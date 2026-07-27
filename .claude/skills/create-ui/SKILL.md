---
name: create-ui
description: Build, style, or restyle any Ritual UI — a React component, a page, a form, a card, a button, email or CRM/CMS chrome — so it matches the brand. Use whenever creating new UI, changing how something looks, or adding a component/page to the massage-salon site.
---

# create-ui — build UI that looks like Ritual

Ritual is a warm, soft, rounded wellness brand: a cream canvas, one signature
pink (`blush #ffadae`), pill and 20px-card shapes, magenta/iris-tinted shadows,
and a soap-bubble hero. This skill makes any new or restyled UI belong to it.

**Read [`DESIGN.md`](DESIGN.md) before writing the first line of markup.** It is
the full manual — every brand hex, the fluid type scale, spacing rhythm, radii,
tinted shadows, and per-component recipes. The source of truth for tokens is
[`app/globals.css`](../../../app/globals.css) (`@theme` block) and the components
in [`app/ui/`](../../../app/ui/); when this skill or `DESIGN.md` disagrees with
the code, **the code wins**.

## How to build

1. **Read `DESIGN.md`** and skim [`app/ui/`](../../../app/ui/) for what already exists.
2. **Reuse before inventing.** There's likely already a component:
   `WhatsAppButton`/`WhatsAppButtonWave` (primary CTA), `GoogleMapButton` /
   `GostButton` (secondary), `ServiceCard` / `TeamCard` / `CreamCard` (cards),
   `Dropdown` (menus — handles outside-click + `Esc`), `Section`, `NavLink`,
   `LangButton`, `BurgerMenuButton`. Extend one rather than starting fresh.
3. **Emit tokens, not raw values.** Use the `@theme` tokens (`blush`, `cream`,
   `mint`, `magenta`, `iris`, `lilac`, `mauve`, `ink`) and Tailwind opacity
   modifiers (`ink/75`, `cream/80`) — never off-token hex, greys, or px radii. 
   Can add new values for colour only by reusing existing tokens, but adding anither colour 
   with color-mix() and other similar CSS fucntions, example: `--color-blush-85: color-mix(in hsl, (--color-blush), white 85%)`
4. **All copy is translatable (ru / es / en).** Strings come from the
   dictionaries as props; **never hard-code text** in a component, and never
   concatenate sentence fragments. Leave ~30% growth room in buttons/nav.
5. **Respect the server/client boundary.** Data-fetching components are async
   Server Components that call the data layer directly; anything touching
   `window`/DOM (canvas, Leaflet, `IntersectionObserver`) is `"use client"`.
   Client components receive translated strings as props — they never import
   dictionaries.
6. **Use Test Driven Development.** If the UI needs any fucntionality - first write tests, 
    than pass them with loggs as RED, than create a fucntion, than pass the tests till they are green. Use unit tests and test cases, check boundaries, +1 and -1, check equivalence portioning. 
    Add data-testid to be reused for further E2E testing with Playwright MCP. 
7. **DRY priciple.** if component can be repeated create a separate component. 
    Create a UI for special buttons, content cards. 
8. **KISS principle.** Make any animations and microinteractions simple and minimalistic. 

   




## Never

- **Pure white `#FFFFFF`** surfaces, cool greys, saturated primaries, or neon —
  the canvas is `cream #F6F3EE` and every hue stays in the soft `blush` register.
- **`mint`** for anything but the primary CTA and focus ring; **`magenta`** as a
  large fill or as body text (it's for pressed/active + hover emphasis).
- **`blush` as a text color** (fails contrast on cream) — all text is `ink` with
  opacity for hierarchy.
- **Off-token radii** (`8px`, `10px`) or **hard neutral shadows** — use pill /
  card / full radii and the magenta/iris-tinted elevation recipes.
- **A fourth font**, or `Caveat` anywhere but the magenta eyebrow above a heading.
- **Auto-playing bubbles / waves / marquee** on CRM/CMS working surfaces — those
  belong to the marketing landing page.
- **Generic AI-generated aesthetics** that makes a UI seems to be AI generated without personal style of a project

## Accessibility (WCAG 2.2 AA — non-negotiable)

44px (`min-h-11 min-w-11`) touch targets · visible `mint` focus on every control ·
`aria-label` on icon-only controls, `aria-hidden` on decorative SVGs · never rely
on color alone · respect `prefers-reduced-motion` (killed globally in
`globals.css`) · visible labels on form inputs · human, translated DB errors
(reason + fix), never a raw error code.

## Check it

- `npm run lint` and `npm run build` are clean.
- Use the **`/run`** skill to launch the app and screenshot the new UI — look at
  the screenshot, don't assume.
- Verify reflow at **320 / 768 / 1280 px** and with `prefers-reduced-motion: reduce`.
