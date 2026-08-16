# E2E plan — Playwright MCP for the home page and privacy policy

Scope: `/{lang}` and `/{lang}/privacy` in `en`, `es`, `ru` — the two surfaces
being deployed now.

---

## 1. Which markdown MCP reads when it writes tests

This was the open question, so it comes first.

**An MCP-driven agent has no special test instructions in this repo today.** It
loads whatever Claude Code loads:

| File | Loaded when | What it gives a test-writing agent |
| --- | --- | --- |
| `CLAUDE.md` | Always (project instructions) | The vitest project split, the `.db.test.tsx` convention, the data-layer result-object contract, the two standing JSON-LD rules |
| `AGENTS.md` | Always (imported by `CLAUDE.md`) | "This is not the Next.js you know" — read `node_modules/next/dist/docs/` first |
| `.claude/skills/create-ui/SKILL.md` | Only when `create-ui` is invoked | The TDD instruction (step 6) and a 6-line accessibility paragraph (lines 68–74) |
| `.claude/skills/create-ui/DESIGN.md` | Only via that skill | Tokens and component recipes — mostly irrelevant to E2E |

So the honest state: **`CLAUDE.md` is the only file reliably in context, and it
documents the *unit* test setup, not E2E.** There is no `accessibility.md`, no
testing manual, and no Playwright conventions file. `create-ui/SKILL.md:42`
already says *"Add data-testid to be reused for further E2E testing with
Playwright MCP"* — referring to a skill that was never written.

### What is missing, and where it should live

Following the pattern this repo already uses (a skill folder with a `SKILL.md`
plus a reference manual, as `create-ui` does with `DESIGN.md`), the gap is:

- **`.claude/skills/write-tests/SKILL.md`** — when to write which kind of test,
  the jsdom-vs-browser decision, the `@critical` tagging rule, the transcription
  rules in §5 below.
- **`.claude/skills/write-tests/ACCESSIBILITY.md`** — the WCAG 2.2 AA checklist
  as testable assertions. Today those rules exist only as prose inside a UI
  skill, which means an agent writing tests never sees them: 44px targets,
  visible `mint` focus, `aria-label` on icon-only controls, `aria-hidden` on
  decorative SVGs, unique landmarks, skip-link behaviour, reduced-motion.
- **`.claude/skills/write-tests/PLAYWRIGHT-MCP.md`** — §3–§5 of this document,
  once the specs exist and the conventions have settled.

Writing those is a separate task; this plan is the input to it. **Until they
exist, an MCP session must be told the conventions in the prompt** — the agent
will not infer them, and will default to CSS selectors and screenshot
assertions, both of which are wrong here.

---

## 2. Status: the MCP server is not connected

No `.mcp.json` in the repo, and no `mcp__playwright__*` tools in the current
session. Nothing in §3–§5 can run until:

```bash
claude mcp add playwright -- npx @playwright/mcp@latest
```

Restart Claude Code, then confirm with `/mcp`.

---

## 3. What MCP is for — and what it is not

**MCP Playwright does not run your tests. It writes them.**

| | Playwright MCP | `@playwright/test` specs |
| --- | --- | --- |
| Who drives | An agent, interactively | The runner, unattended |
| Deterministic | No | Required |
| Runs in CI | No | Yes |
| Output | Findings, a draft spec | Pass/fail, traces |
| Regression value | **Zero — nothing persists** | The entire point |

An MCP session that "verified booking works" has guarded nothing. Its value is
that the agent **sees the real DOM** — the accessibility tree, the hydrated
dropdown, the actual `wa.me` href — so the committed spec has correct selectors
on the first run instead of guesses made from reading source.

Loop: **explore with MCP → transcribe to `e2e/*.spec.ts` → commit → CI runs it.**

### Why E2E at all, given 314 vitest tests pass

E2E earns its minutes only where the real stack is the thing under test:

| Only observable end-to-end | Why vitest cannot see it |
| --- | --- |
| `proxy.js` locale negotiation, `ritual:lang` cookie | Middleware layer — never runs in vitest |
| Real Firestore reads | The data layer is mocked in every existing test |
| `dynamicParams = false` returning a real 404 | Asserted today as a constant, not a response |
| Hydration: dropdowns, motion toggle, carousel | `renderToStaticMarkup` never runs effects |
| Sticky header, `scroll-mt-24`, print layout | jsdom has no layout engine |
| `robots.txt` / `sitemap.xml` escaping the redirect | A matcher regex in `proxy.js` |

### The tools

`browser_navigate`, `browser_click`, `browser_type`, `browser_press_key`,
`browser_resize`, `browser_console_messages` (hydration errors — invisible to
vitest), `browser_network_requests`, `browser_evaluate` (computed style,
`localStorage`, scroll position), `browser_tabs`, `browser_pdf_save`.

`browser_snapshot` is the important one: it returns the **accessibility tree**,
not pixels —

```yaml
- banner:
  - navigation:
    - link "About Us" [ref=e12]
  - button "Toggle menu" [ref=e15]
  - button "Language selector" [ref=e16]
```

That is what a screen reader announces. Two payoffs: you pick
`getByRole("button", { name: "Toggle menu" })` over a brittle CSS selector, and
**a11y defects are visible immediately** — an unnamed control appears as a bare
`button` with no name, a WCAG 4.1.2 failure, before you write any assertion.

### Setup

```bash
npm i -D @playwright/test @axe-core/playwright
npx playwright install chromium
npm run build && npm run start     # NOT `next dev`
```

Build-and-start, never dev: `proxy.js` redirects and static prerendering behave
differently in dev, and locale routing is the highest-value thing tested here. A
spec authored against `next dev` can pass locally and fail in production.

---

## 4. The authoring sessions

Each produces one spec file. Prompts written as you would type them.

### A — locale routing → `e2e/locale-routing.spec.ts`
Highest value: none of this is reachable from vitest.

> Start at `/` and record where you land. Check `/es`, `/en`, `/ru` load
> directly. Check `/xx`, `/foo`, `/pizza` — I expect 404, confirm it. Check
> `/robots.txt` and `/sitemap.xml` do NOT redirect into a locale. Then open the
> language dropdown, pick Russian, and report the URL, the `ritual:lang` cookie,
> and whether scroll position moved.

Finds what source-reading cannot: the real redirect status, whether the cookie
is set before or after navigation, and whether `router.replace` leaves history
clean (Back should exit the site, not cycle locales).

### B — booking journey → `e2e/home.spec.ts`
The only journey that makes the salon money.

> On `/es`, find every WhatsApp button and give me its `href`. Confirm they all
> carry the same live Firestore number and the Spanish message. Do not follow
> them to WhatsApp. Then click the header "Find Us" link and tell me whether the
> contact section ends up visible *below* the sticky header.

That last clause is the point: `scroll-mt-24` clearing the sticky header is pure
layout, invisible to jsdom. Have the agent `browser_evaluate` the target's
`getBoundingClientRect().top` against the header height.

### C — hydration → `e2e/header-interaction.spec.ts`

> Resize to 390×844. Click the burger, snapshot. Click outside — does it close?
> Reopen, press Escape — does it close? Then the motion toggle: click it, report
> `aria-pressed`, whether `<html>` has `motion-off`, and `localStorage`. Then
> **reload and tell me if the setting survived.**

The reload is the point — `MotionProvider` rehydrates from `localStorage` in an
effect, and nothing currently tests that it survives a reload. Also check that
with animations stopped the cream gallery becomes horizontally *scrollable*, not
merely frozen: losing the animation without gaining the scrollbar hides every
brand card past the fold.

### D — privacy policy → `e2e/privacy.spec.ts`

> Go to `/es/privacy`. Click every table-of-contents entry and confirm it
> scrolls to a section that exists. Report any anchor going nowhere. Then resize
> to mobile and check the collapsed ToC bar still opens.

A dead anchor in a legal document is a compliance problem, and
`privacyDictionaries.db.test.tsx` validates only the dictionary, never the
rendered anchors. Then, MCP-only and worth doing **before this deploy**:
`browser_pdf_save` the policy — `print:hidden` on the ToC has never been checked
against a real print stylesheet.

### E — accessibility → `e2e/a11y.spec.ts`

> On `/en`, press Tab once from the top. What is focused? Is it visible? Press
> Enter — where does focus land? Then Tab through the whole header and report any
> control with no visible focus indicator or an ambiguous name.

The skip link is asserted today only by its CSS classes (`sr-only` +
`focus:not-sr-only`); whether focus *actually lands in `<main>`* is browser
behaviour only this can confirm. Finish with an axe scan, transcribed as the
highest-coverage assertion in the suite:

```ts
test("has no WCAG AA violations @critical", async ({ page }) => {
  await page.goto("/en");
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(violations).toEqual([]);
});
```

---

## 5. Transcription rules

Where the value is won or lost. **Until the skill files in §1 exist, paste these
into the MCP prompt.**

- **Prefer role selectors.** The snapshot gives you the accessible name; use it.
  `getByRole("button", { name: "Toggle menu" })` survives a Tailwind refactor
  that `.rounded-pill > summary` does not — and it fails if the accessible name
  breaks, which is a bug worth failing on. `data-testid` is the fallback for
  elements with no meaningful role (`[data-marquee]`, `hero-section`).
- **Never transcribe a `[ref=eNN]`.** Session-scoped snapshot handles; they mean
  nothing in a spec file.
- **Assert the value, not the presence.** Assert the exact `wa.me` URL shape,
  not "a link exists".
- **Drop the waits the agent needed.** Playwright assertions auto-retry; keep an
  explicit wait only where a genuine race was observed.
- **Tag the gate** so `--grep @critical` is the merge gate:

```ts
test("every booking CTA carries the live number @critical", async ({ page }) => {
  await page.goto("/es");
  await expect(page.getByTestId("whatsapp-button").first())
    .toHaveAttribute("href", /^https:\/\/wa\.me\/\d{9,}\?text=/);
});
```

`@critical` = locale routing, booking journey, privacy reachability, axe scan.
Those four cover every way these two pages break for a real visitor.

---

## 6. Order of work

1. **Connect the MCP server** — nothing starts without it.
2. **Sessions A + B**, transcribe. The go/no-go set for this deploy.
3. **Session E**, transcribe the axe scan.
4. **Session D**, plus the print check.
5. **Session C** after deploy — hydration bugs are real but not launch-blocking.
6. **Write the three skill files from §1**, using what the sessions taught, so
   the next agent starts with the conventions instead of being told them.

CI wiring (Vercel preview URL via `E2E_BASE_URL`, `@critical` as the required
check) is a separate, smaller piece of work once specs exist.

---

## 7. Out of scope, deliberately

- **Visual regression** — the bubble canvas makes screenshot comparison
  permanently flaky; it is decorative and unasserted by design.
- **WhatsApp itself** — assert the generated `wa.me` URL and stop.
- **Re-testing what vitest covers** — 314 tests pass today, 129 of them across
  the header, footer and home-page bands. Re-verifying copy and structure
  through a browser is minutes spent for nothing.
- **Firestore writes** — both pages are read-only; the CRM booking flow is a
  separate surface.
