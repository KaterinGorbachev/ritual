This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Testing (TDD with Vitest Browser Mode)

This project uses **Vitest** for tests. Component tests run in a **real Chromium
browser** (driven by Playwright), not a fake DOM — so what you test is what a real
user's browser actually does. This is a great fit for TDD: you write a failing test
first, then write just enough code to make it pass.

Below is the whole setup, explained plainly and step by step. If you're setting this
up on a fresh machine, do steps 1–2. If it's already set up, jump to "Running tests".

### Why two kinds of tests?

We split tests into two groups, because they need different environments:

- **`unit`** — runs in **jsdom** (a fake, in-memory DOM). Fast. Good for plain logic
  and simple render checks. Example: `app/test/smoke.test.tsx`.
- **`browser`** — runs in a **real Chromium browser** via Playwright. Slower to start,
  but real. Good for component behavior. Example: `app/test/ui/WhatsAppButton.test.tsx`.

For TDD on UI components, use the **browser** tests — they catch things a fake DOM can't
(real visibility, real clicks, native `<details>`/`<summary>` toggles, etc).

### Step 1 — Install the packages

These are already in `package.json`, but here's what each one is for and how you'd
install them from scratch:

```bash
# The test runner + assertions
npm install -D vitest

# Browser Mode: runs tests in a real browser instead of jsdom
npm install -D @vitest/browser @vitest/browser-playwright playwright

# A render() helper that works inside Browser Mode (React 19 compatible)
npm install -D vitest-browser-react

# jsdom (for the fast "unit" tests) + nice DOM matchers like toBeVisible()
npm install -D jsdom @testing-library/jest-dom
```

What they do:

| Package | Why it's needed |
| --- | --- |
| `vitest` | The test runner and `expect()` assertions. |
| `@vitest/browser` | Enables Browser Mode (running tests in a real browser). |
| `@vitest/browser-playwright` | The provider that lets Vitest drive Playwright. In Vitest 4 this is a **separate package** — you import `playwright()` from it in the config. |
| `playwright` | Provides the actual browser engine. |
| `vitest-browser-react` | A `render()` that mounts your React component into the real browser page. |
| `jsdom` | The fake DOM used by the fast `unit` project. |
| `@testing-library/jest-dom` | Extra matchers (`toBeVisible`, `toHaveAttribute`, ...). |

### Step 2 — Download the browser binary (one time)

Playwright needs an actual Chromium to drive. Download it once:

```bash
npx playwright install chromium
```

If tests ever fail with "browser not found", just run this again.

### Step 3 — The configuration files

Three files make this work. Here's what each one is and why it exists.

**`vitest.config.mts`** — the main config. It defines the two projects (`unit` and
`browser`) and registers the logging reporter (see step 5).

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { playwright } from '@vitest/browser-playwright'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // Reporters must live at the ROOT level (not inside a project) to apply everywhere.
    reporters: [
      'default',
      fileURLToPath(new URL('./app/test/test-log-reporter.ts', import.meta.url)),
    ],
    projects: [
      {
        // Fast jsdom tests.
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: true,
          include: ['app/test/smoke.test.tsx'],
          setupFiles: [fileURLToPath(new URL('./app/test/setup.ts', import.meta.url))],
        },
      },
      {
        // Real-browser component tests.
        extends: true,
        test: {
          name: 'browser',
          include: ['app/test/ui/**/*.test.tsx'],
          browser: {
            enabled: true,
            provider: playwright(), // NOTE: a function call, not the string 'playwright'
            headless: true,         // no visible window; set to false to watch it run
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
```

Two things that commonly trip people up:

- In Vitest 4, `provider` must be **`playwright()`** imported from
  `@vitest/browser-playwright`. The old `provider: 'playwright'` string no longer works.
- Any test file matching `app/test/ui/**/*.test.tsx` runs in the **browser** project.
  Put fast logic-only tests elsewhere (like the `smoke.test.tsx` path) so they stay in jsdom.

**`app/test/setup.ts`** — setup for the **jsdom** project only. It loads the extra DOM
matchers and cleans up the DOM between tests:

```ts
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => cleanup())
```

**`app/test/test-log-reporter.ts`** — a small custom reporter that prints a line after
each test (see step 5).

### Step 4 — How to write a test case

A test always follows the same three-beat rhythm: **Arrange → Act → Assert**.

1. **Arrange** — put the component on the screen with `render(...)`.
2. **Act** — find the element you care about (we locate by `data-testid`).
3. **Assert** — check something is true with `expect(...)`.

Here's a real example from `app/test/ui/WhatsAppButton.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { WhatsAppButton } from "../../ui/WhatsAppButton";

describe("WhatsAppButton in the header", () => {
    it("is visible and clickable to the user", async () => {
        // 1. Arrange — mount the component in the real browser.
        //    NOTE: render() is async in Browser Mode, so you must `await` it.
        const screen = await render(
            <WhatsAppButton number="+34666666666" message="Book a massage">
                <span>WhatsApp</span>
            </WhatsAppButton>
        );

        // 2. Act — locate the element by its data-testid (returns a locator).
        const button = screen.getByTestId("whatsapp-button");

        // 3. Assert — always `await expect.element(...)` for browser locators.
        await expect.element(button).toBeInTheDocument();
        await expect.element(button).toBeVisible();
    });
});
```

The rules to remember for Browser Mode:

- `render()` **puts the component on screen** — nothing exists to test until you call it.
- `getByTestId("...")` **finds** that element (it reads the `data-testid` attribute on
  the element in your component). It does not create anything — it locates what `render`
  already mounted.
- Assertions on a located element use **`await expect.element(button)....`** — the `await`
  matters, because the browser is real and things settle asynchronously.

Common assertions:

```tsx
await expect.element(button).toBeVisible();
await expect.element(button).toHaveTextContent("WhatsApp");
await expect.element(button).toHaveAttribute("target", "_blank");
```

**Doing it TDD-style:** write the test first for behavior that doesn't exist yet, run it,
watch it fail (**red**), then write the component code until it passes (**green**), then
tidy up (**refactor**). For example, to make the button build a real WhatsApp link, you'd
first add `await expect.element(button).toHaveAttribute("href", /wa\.me/)`, watch it fail,
then implement the `href` in the component.

### Step 5 — Making logs visible during tests

Inside a Browser Mode test, a plain `console.log(...)` runs **in the browser tab**, so it
does **not** show up in your terminal. To print a line after every test (with its name and
result), we use a small **reporter** that runs in Node instead.

`app/test/test-log-reporter.ts`:

```ts
import type { Reporter, TestCase } from "vitest/node";

// Runs in Node (not the browser), so its output reaches your terminal.
export default class TestLogReporter implements Reporter {
    onTestCaseResult(testCase: TestCase) {
        const { state } = testCase.result();
        console.log(`✓ finished test: "${testCase.fullName}" — ${state}`);
    }
}
```

It's registered at the **root** `test.reporters` in `vitest.config.mts` (see step 3), so it
applies to both projects. You'll see lines like:

```
✓ finished test: "WhatsAppButton in the header > is visible and clickable to the user" — passed
```

Tip: if you *do* want to see a `console.log` from inside a browser test, run the browser
with a visible window (`headless: false` in the config) and check the browser's own devtools,
or move that log into the reporter.

### Running tests

```bash
# Watch mode — reruns on every save. This is the TDD loop.
npm test

# Run once and exit (what CI uses)
npm run test:run

# Only the real-browser tests
npx vitest --project browser

# Only the fast jsdom tests
npx vitest run --project unit

# A single file
npx vitest run app/test/ui/WhatsAppButton.test.tsx
```

The first browser run is a few seconds slower because it boots Chromium; after that,
watch-mode reruns are fast.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
