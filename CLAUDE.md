# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> The import above is load-bearing: this repo runs **Next.js 16** (`next@16.2.9`, React 19). APIs and conventions differ from older Next.js. Consult `node_modules/next/dist/docs/` before writing framework code, and heed deprecation notices.

## Project 

This is web site for a small massage salon "Ritual" with an appointment system via WhatsApp, CMS system and CRM system with Google Calendar integration. The marketing selling texts are essential for each page description. It is accessible WCAG AA 2.2 level. It has a library of UI components made with REACT. It's server part is made with NEXT.js for routes for 3 languages: Russian, Spanish and English. Data is saved in Firebase, data from Firebase is stored in Zustand. All Data Base errors are shown to a user with a human message. Also it is connected to Google Calendar to select date and make a note. It has a comfortable view of a paper notebook to make notes for Google Calendar. It has an API to connect with AI to let agent of a person search information on a web site. It has a shema.org and other architectural capabilities to make google AI find the web site easily.  

## Commands

```bash
npm run dev          # Next.js dev server
npm run build        # production build
npm run start        # serve the production build
npm run lint         # eslint (flat config, eslint-config-next core-web-vitals + typescript)

npm test             # vitest in watch mode
npm run test:run     # vitest single run (CI)
```

Run a single test / project:

```bash
npx vitest run app/test/ui/WhatsAppButton.db.test.tsx   # one file
npx vitest run --project unit                            # jsdom project only
npx vitest run --project browser                         # Chromium/Playwright project only
npx vitest run -t "gets number from database"            # by test name
```

There is no root `.env` checked in — Firebase config reads `NEXT_PUBLIC_FIREBASE_*` env vars (see `app/database/firebase.config.js`). The app needs these set to talk to Firestore.

`NEXT_PUBLIC_SITE_URL` sets the public origin used for canonical URLs, hreflang, the sitemap and JSON-LD `@id`s (see `app/lib/site.ts`). It falls back to the Vercel preview domain, so builds work without it — but production must set it, or every absolute URL in the metadata points at the wrong host.

## Architecture

Single-page, multilingual marketing site for the "Ritual" massage salon. Server Components fetch content from Firestore; translated UI chrome comes from static JSON dictionaries. Everything lives under `app/` (App Router).

### Routing & i18n
- Routes are `app/[lang]/` — `layout.tsx` (header/footer chrome) and `page.tsx` (the landing page) — plus `app/[lang]/services/`.
- `proxy.js` at the repo root (Next 16's replacement for `middleware.ts`) negotiates the locale: a path with no locale prefix is redirected to `/{locale}/…`, preferring the `ritual:lang` cookie, then `Accept-Language`, then `es`. Its matcher skips anything ending in a file extension, so `/robots.txt` and `/sitemap.xml` are served directly rather than redirected.
- `layout.tsx` exports `generateStaticParams` for all three locales plus `dynamicParams = false`, so an unknown segment 404s instead of silently rendering as Spanish.
- `app/[lang]/dictionaries.ts` maps a URL locale (e.g. `es-ES`) to a dictionary key via `toLocale()` (falls back to `en`) and lazy-imports `dictionaries/{en,es,ru}.json`. Dictionaries are `server-only`.
- Pattern: server components `await params` → `getDictionary(toLocale(lang))` → pass strings down as props. **Client components never import dictionaries**; they receive translated strings as props (see `MapLeaflet`, `FooterContactDetails`).

### Data layer (Firestore)
- `app/database/firebase.config.js` initializes Firebase and exports `db`.
- `app/lib/handleData.js` is the only module that touches Firestore. All functions return a **result object** `{ ok: true, data } | { ok: false, error: { message, code } }` — callers branch on `.ok`, they don't try/catch. `getDocById(table, id)` fetches one doc; `getInfo(table)` fetches a whole collection.
- `app/lib/firebaseErrors.js` maps Firestore error codes to Spanish user-facing messages.
- Content collection is `contactData`, keyed by well-known doc ids: `address` (has `location` + a `"lat, lng"` `coordinates` string), `workingHours`, `messanger` (WhatsApp `telephone`), `instagram` (`url`). Fetching/parsing is defensive — a missing doc or malformed field logs and degrades, it doesn't throw (see `FooterContactDetails.tsx`).

### SEO / AI discoverability
- `app/lib/site.ts` is the single source of truth for the public origin: `SITE_URL`, the stable JSON-LD node ids `ORG_ID`/`WEBSITE_ID`, and `absUrl()`. Never hardcode a domain anywhere else.
- `app/[lang]/layout.tsx` exports `generateMetadata` (not a static `metadata` object) so title/description/keywords come per-locale from the `seo` block in each dictionary. `metadataBase` is required — without it Next emits relative hreflang hrefs, which Google discards.
- `app/lib/jsonLd.tsx` holds the `<JsonLd>` component and the schema builders. It is server-rendered on purpose: AI crawlers read the HTML they are served and many never execute JS. `buildBusinessLd` derives everything from the `contactData` docs the layout **already** fetches for the footer, so structured data costs no extra Firestore reads. It parses defensively (bare `"10"` hours, `"lat, lng"` strings) — a missing or malformed field drops that property rather than emitting an invalid one.
- `app/robots.ts` and `app/sitemap.ts` use the Next 16 metadata file conventions. Next has no built-in AI-crawler rules, so the allowlist in `robots.ts` is explicit; the sitemap's `ROUTES` array is where new pages get added.
- Two standing rules: **any claim in JSON-LD must also be visible on the page** (hence the languages-spoken line in the footer), and **`aggregateRating` stays out until the review figures are real** — `dict.reviews.ratingSummary` is display copy with a comma decimal in es/ru and must never be machine-parsed.

### Server vs client boundary
- Data-fetching components (`WhatsAppButton`, `FooterContactDetails`) are **async Server Components** that call the data layer directly.
- Leaflet reads `window`/DOM at import time, so it can't be server-rendered. `MapLeafletClient.tsx` is a thin `"use client"` wrapper that `next/dynamic(..., { ssr: false })`-imports `MapLeaflet.tsx`. Server components render `MapLeafletClient`, never `MapLeaflet` directly.
- Other client components (`BubbleCanvas`, marquee, team-card scroll animation) are `"use client"` and use canvas / `IntersectionObserver`; motion respects `prefers-reduced-motion` (killed globally in `globals.css`).

### Styling
- Tailwind CSS v4 via `@tailwindcss/postcss`, configured **in CSS** (`app/globals.css` `@theme` block), not a JS config. Brand tokens: colors (`blush`, `cream`, `magenta`, `iris`, `lilac`, `mint`, `mauve`, `ink`), fonts (`--font-display` Playfair, `--font-body` Nunito, `--font-handwriting` Caveat, wired via `next/font/google` in `layout.tsx`), radii (`pill`, `card`), and the `animate-marquee` keyframe live here.
It has main animation of soap bubbles and personal pink color #ffadae, so all other colors must be in the same tone and softness.

## Testing

`vitest.config.mts` defines two projects (both run under `npm test`):
- **`unit`** (jsdom): `app/test/smoke.test.tsx` and `app/test/ui/**/*.db.test.tsx`. `.db.test.tsx` files test components that hit the data layer — they `vi.mock("../../lib/handleData")` so no real Firestore call happens (jsdom can mock the firebase import; the real browser can't). Because the components are async Server Components, tests `await Component(props)` to get JSX, then `render()` it.
- **`browser`** (real Chromium via Playwright): all other `app/test/ui/**/*.test.tsx`.

`define: { 'process.env': '{}' }` in the vitest config exists because `next/image` reads `process.env` at module scope and the browser project has no `process`. A custom reporter (`app/test/test-log-reporter.ts`) logs each test's full name + result.
