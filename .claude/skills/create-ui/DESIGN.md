---
# =============================================================================
# Ritual Design System — token manifest
# Every value below is emitted literally in HTML/CSS (Tailwind v4 @theme tokens).
# Prose in the body explains how the pieces fit together. Rules use RFC 2119:
# MUST, MUST NOT, SHOULD, MAY.
# =============================================================================

colors:
  # --- Brand palette (Tailwind @theme, app/globals.css) ----------------------
  # All hues live in a single soft, warm register anchored to blush #ffadae.
  blush:   "#ffadae"   # signature pink — primary decorative fill, footer washes
  cream:   "#F6F3EE"   # page canvas + frosted panel fill
  magenta: "#BC1571"   # pressed / active accent, handwriting eyebrows, links-hover
  iris:    "#6A0DAD"   # secondary text accent (professions, links), icon strokes
  lilac:   "#B57EDC"   # tertiary decorative (burger dots, scrollbar gradient)
  mint:    "#77E6ad"   # primary CTA fill, focus ring
  mauve:   "#C8A2C8"   # hairline borders on chrome (header, dropdown panels)
  ink:     "#1A1A1A"   # all body + heading text

  # --- Alpha derivations used in the codebase --------------------------------
  # Expressed as Tailwind opacity modifiers on the tokens above.
  text:            "ink"            # 100% — headings, CTA labels
  text-body:       "ink/80"        # subtitles, lead paragraphs
  text-muted:      "ink/75"        # card body copy
  text-subtle:     "ink/70"        # footer meta, fine print
  surface-panel:   "cream/55"      # hero frosted glass (backdrop-blur-md)
  surface-chrome:  "cream/85"      # sticky header bar
  surface-card:    "cream/80"      # service / team cards
  surface-blush:   "blush/70"      # about-staff band, service CTA tile
  border-hair:     "blush/10"      # card outlines
  border-chrome:   "mauve/30"      # header + dropdown-panel borders
  brand-shadow:    "rgba(218,24,132,.12)" # magenta ring in card/hero shadows
  brand-glow:      "rgba(218,24,132,.25)" # magenta ambient shadow (hero)
  iris-shadow:     "rgba(106,13,173,.12)" # iris ring on the wave CTA

typography:
  families:
    display:     '"Playfair Display", serif'   # --font-display — headings, brand
    body:        '"Nunito", system-ui, sans-serif' # --font-body — all UI copy
    handwriting: '"Caveat", cursive'            # --font-handwriting — eyebrows only
  # Fluid heading sizes use clamp() so they scale with the viewport.
  scale:
    hero-title:    "clamp(2.5rem, 7vw, 3rem)"    # h1, font-display semibold, tracking-wider
    section-title: "clamp(1.75rem, 5vw, 2.25rem)"# h2, font-display semibold
    eyebrow-hero:  "1.875rem"   # text-3xl handwriting, magenta
    eyebrow:       "1.5rem"     # text-2xl handwriting, magenta
    card-title:    "1.5rem"     # h3 in cards, text-2xl display
    detail-title:  "1.125rem"   # h3 in footer/cream cards, text-lg display
    lead:          "1.125rem→1.25rem" # hero subtitle text-lg → md:text-xl
    body:          "1rem"       # text-base — card + paragraph copy
    small:         "0.875rem"   # text-sm — meta, professions, fine print
  weights:
    regular: 400   # Nunito body default
    light:   300   # lang-button code glyph
    semibold: 600  # display headings, brand wordmark
    bold:    700   # CTA labels, nav hover, emphasis

spacing:
  # 4px base (Tailwind scale). Section rhythm below is what the landing page uses.
  section-y:       "py-10 lg:py-18"   # 2.5rem → 4.5rem vertical band padding
  section-y-tight: "py-8 lg:py-16"    # 2rem → 4rem
  block-gap:       "gap-6 lg:gap-12"  # header→content within a band
  card-grid-gap:   "gap-8"            # service card grid
  page-max:        "max-w-400"        # 100rem content ceiling (custom scale)
  page-x:          "px-4 md:px-8 lg:px-24" # asymmetric section insets
  touch-min:       "min-h-11 min-w-11"# 44px — WCAG 2.2 target size

radius:
  pill: "40px"   # --radius-pill — buttons, CTA, header bar, hero panel (lg), nav
  card: "20px"   # --radius-card — service cards, image frames, cream cards
  full: "9999px" # avatars, team-card image, burger dots, lang trigger
  panel: "1rem"  # rounded-2xl dropdown/menu panels

border-width:
  hair:     "1px"   # card outlines, header bottom rule
  control:  "2px"   # chrome controls (nav, lang, burger) — transparent at rest

elevation:
  # Shadows are magenta/iris-tinted, never neutral grey — depth stays on-brand.
  card-hover: "0 0 0 1px rgba(218,24,132,.12), 0 18px 50px -24px rgba(218,24,132,.45)"
  hero:       "0 0 0 1px rgba(218,24,132,.12), 0 18px 50px -24px rgba(218,24,132,.25)"
  cta-wave:   "0 0 0 1px rgba(106,13,173,.12), 0 18px 50px -24px rgba(106,13,173,.45)"
  chrome:     "shadow-sm"  # header, dropdown triggers
  panel:      "shadow-lg"  # open dropdown panels
  footer-card:"inset 0 0 0 1px rgba(26,26,26,0.06), 0 1px 0 rgba(255,255,255,0.7)"

motion:
  duration:
    control: "500ms"   # transition duration-500 — all chrome controls
    wave:    "2.4s"     # CTA pulse ring (infinite)
    slide:   "1.1s"     # team-card slide-in
    marquee: "90s"      # brand marquee full loop (linear infinite)
  easing:
    control: "ease-in-out"
    slide:   "cubic-bezier(.22,.61,.36,1)"  # soft decelerate
  reduced-motion: "all animation + transition killed globally (globals.css)"

components:
  cta-primary:      # WhatsAppButton — the money control
    fill: "mint"; text: "ink"; radius: "pill"; weight: "bold"; tracking: "wider"
    padding: "px-6 py-3"; min: "min-h-11 min-w-9"; shadow: "shadow-sm"
    focus: "ring-2 ring-mint ring-offset-2 ring-offset-cream"
    active: "bg-magenta ring-magenta scale-95"; hover: "brightness-105"
  cta-wave:         # WhatsAppButtonWave — CTA + two pulsing mint halo rings
    wraps: "cta-primary"; halo: "mint (magenta on active)"; shadow: "cta-wave"
  button-secondary: # GoogleMapButton — same shape, blush fill
    fill: "blush"; text: "ink"; radius: "pill"; hover: "brightness-95"
  button-ghost:     # GostButton ghost — outlined
    fill: "cream/50"; text: "iris"; border: "iris/40 1px"; radius: "pill"
  button-solid:     # GostButton solid
    fill: "blush"; text: "ink"; radius: "pill"
  chrome-control:   # nav trigger, lang trigger, burger — the header vocabulary
    fill: "cream/80–100 backdrop-blur"; border: "2px transparent"; radius: "pill/full"
    shadow: "chrome"; focus: "border-mint"; hover: "border-magenta"; active: "scale-95"
  nav-link:
    text: "ink"; radius: "pill"; border: "2px transparent"; tracking: "wider"
    hover: "font-bold text-magenta (no reflow — invisible bold reserves width)"
    active: "text-magenta border-magenta"
  card-service:     # ServiceCard
    fill: "cream/80"; border: "blush/10 1px"; radius: "card"; min-h: "18rem"
    max-w: "350px"; hover: "card-hover shadow"; image: "rounded-card h-50 cover"
  card-team:        # TeamCard — pill/circle, slides in on scroll
    fill: "cream/80"; border: "blush/10 1px"; radius: "pill md:full"
    image: "rounded-full 290px"; motion: "slide (from-left / from-right)"
  card-cream:       # CreamCard — brand marquee tile
    border: "magenta/20 1px"; radius: "card"; min-w: "300px"; fill: "transparent"
  panel-menu:       # dropdown / language panels
    fill: "cream backdrop-blur-md"; border: "mauve/30 2px"; radius: "panel"; shadow: "panel"
  header-bar:
    fill: "cream/85 backdrop-blur-md"; border-b: "mauve/30 1px"; radius: "pill"
    position: "sticky top-2"; z: 40
---

> A token-first manifest for producing anything that should look like it belongs to **Ritual** —
> the massage-salon marketing site, its CMS/CRM chrome, the paper-notebook calendar view, emails,
> or onboarding surfaces.

Everything needed to build Ritual UI is in this file: **YAML above** (every brand hex, the fluid
type scale, spacing rhythm, radii, border widths, tinted shadows, and control recipes) plus **this
prose** (how the pieces fit together). Rules use RFC 2119: MUST, MUST NOT, SHOULD, MAY.

Source of truth for the tokens is [`app/globals.css`](app/globals.css) (`@theme` block) and the
components in [`app/ui/`](app/ui/). This file is the portable summary; when they disagree, the code
wins — update this file to match.

### Table of contents

[Overview](#overview) · [Colors](#colors) · [Typography](#typography) · [Layout](#layout) ·
[Elevation & depth](#elevation--depth) · [Shapes](#shapes) · [Motion](#motion) ·
[Components](#components) · [Voice & tone](#voice--tone) · [Accessibility](#accessibility) ·
[Do's and don'ts](#dos-and-donts)

---

## Overview

### Brand & style

Ritual is **warm, soft, shabby-chick, cyberpunk and impressionist** — frosted cream panels, 
and a single signature pink (`blush` `#ffadae`).
It is the opposite of a dense neutral product UI: the canvas is **cream, not white**, 
depth is **rounded and generous** (pills and 20px cards, never sharp rectangles), 
and every shadow is **magenta- or iris-tinted** so even elevation stays on-brand. 
The central animation as a liquid-glass 3D soap bubble that is repeatable on some pages that gives a feeling of a 
comfort and relax. 



#### Atmosphere rules

- **MUST** keep every colour in the same soft, warm register as `blush` `#ffadae`. New hues MUST be
  desaturated pastels of comparable lightness — never a saturated primary, neon, or cool grey.
- **MUST** use `cream` `#F6F3EE` as the page canvas (`body` is `bg-cream`). Frosted panels
  (`cream/55`–`cream/85` + `backdrop-blur`) float over the bubble canvas; cards sit at `cream/80`.
- **MUST** reserve `mint` for the primary call-to-action and focus rings, and `magenta` for the
  pressed/active accent and hover emphasis. These two carry almost all of the site's "signal".
- **MUST** compose on generous vertical bands (`py-10 lg:py-18`) with a `max-w-400` (100rem) content
  ceiling, centred.
- **SHOULD** let whitespace and soft blush washes separate sections before reaching for borders.
- **MUST NOT** introduce Material-style hard drop shadows, pure-white `#FFFFFF` surfaces, sharp
  corners, or a grey product-UI palette. This is a marketing/wellness surface, not a dashboard.

#### Brand vs product

- **Playfair Display** (`--font-display`) is the brand voice — headings, the "Ritual" wordmark, card
  titles. Use it for anything that should feel editorial.
- **Nunito** (`--font-body`) is every piece of UI copy: buttons, nav, paragraphs, meta, forms.
- **Caveat** (`--font-handwriting`) is reserved for the **magenta eyebrow line** above a heading and
  nothing else — it is the site's one handwritten flourish. MUST NOT set body copy, buttons, or
  headings in Caveat.

#### The signature moment

The hero is a client-only `<canvas>` (`BubbleCanvas`) painting a Monet garden with liquid-glass
soap bubbles, under a frosted `cream/55` pill panel. This is the one place the brand goes fully
expressive. Page with services and prices has the liquid-glass 3D soap bubble animation as one frame in the center of the page, 
placed behind containers with texts and information - so that on a scroll the animation is partly visible in the space between containers with information. 
FAQs has no canvas animation. 
Everyday CRM/CMS chrome MUST stay quiet — cream surfaces, pill controls, no bubbles.
Circle is the main figure, any svg, icons **MUST** be in a circle container. 

---

## Colors

The palette is eight brand tokens (YAML `colors`), all in one warm pastel register. Refer to them by
token name in prose; emit the literal hex, or a Tailwind opacity modifier (`ink/75`, `cream/80`), in
markup.

### Roles

| Token     | Hex        | Role                                                                          |
| --------- | ---------- | ----------------------------------------------------------------------------- |
| `blush`   | `#ffadae`  | Signature pink. Decorative fills, footer gradient washes, service-CTA tile.   |
| `cream`   | `#F6F3EE`  | **Page canvas** and every frosted panel / card surface (via opacity).         |
| `mint`    | `#77E6ad`  | **Primary CTA fill** and **focus ring**. The site's "go" colour.              |
| `magenta` | `#BC1571`  | **Pressed / active** state, hover emphasis, handwriting eyebrows, link-hover. |
| `iris`    | `#6A0DAD`  | Secondary text accent (staff professions, links), icon strokes.               |
| `lilac`   | `#B57EDC`  | Tertiary decoration — burger dots, scrollbar gradient.                        |
| `mauve`   | `#C8A2C8`  | Hairline chrome borders (`mauve/30` on header + menu panels).                 |
| `ink`     | `#1A1A1A`  | **All** text. Hierarchy comes from opacity + font, not from new hues.         |

### Rules

- **MUST** render text in `ink`, using opacity for hierarchy: `ink` (headings, CTA labels), `ink/80`
  (leads), `ink/75` (card body), `ink/70` (meta / fine print). MUST NOT introduce a new grey.
- **MUST** treat `iris` as the link/secondary-accent text colour and `magenta` as its hover — this
  is the pattern in the footer and copyright line.
- **MUST NOT** use `blush` for text (it fails contrast on cream). `blush` is a **fill** token only.
- **MUST NOT** repurpose a decorative token as status. If the CRM needs status colours
  (success/error), derive them as soft pastels in this register and document them here first — do not
  reach for a saturated system red/green.
- **MUST** keep surfaces on `cream` at 55–85% opacity over the bubble/blush background; pure opaque
  `cream` is fine for solid chrome (header pill, menu panels).

---

## Typography

### Families

- **Playfair Display** (`family-display`) — headings (`h1`–`h3`), the "Ritual" wordmark, card
  titles. Semibold (600) is the working weight; MUST NOT go lighter than 600 for a heading.
- **Nunito** (`family-body`) — all UI copy: paragraphs, buttons, nav, labels, meta.
- **Caveat** (`family-handwriting`) — **only** the magenta eyebrow above a heading.
- All three are loaded via `next/font/google` in [`layout.tsx`](app/[lang]/layout.tsx) with `latin`
  + `cyrillic` subsets (Russian is a first-class locale). MUST NOT add a fourth font family.

### Scale

Headings use fluid `clamp()` sizes so they scale between mobile and desktop without breakpoints:

- **h1 (hero)** — `clamp(2.5rem, 7vw, 3rem)`, Playfair semibold, `tracking-wider`. One per page.
- **h2 (section)** — `clamp(1.75rem, 5vw, 2.25rem)`, Playfair semibold.
- **eyebrow** — Caveat in `magenta`, `text-2xl` (`text-3xl` in the hero). Sits **above** the h2.
- **h3 (card title)** — `text-2xl` Playfair; **h3 (detail)** — `text-lg` Playfair (footer, marquee).
- **lead** — `text-lg md:text-xl` Nunito in `ink/80`.
- **body** — `text-base` Nunito; **small** — `text-sm` for professions, meta, fine print.

### Rules

- **MUST** keep exactly one `<h1>` per page (the hero) and never skip heading levels.
- **MUST** pair each section heading with its Caveat eyebrow — that eyebrow/heading duo is the site's
  section-opener pattern. The eyebrow is decorative flavour text, so it MUST NOT be the only label a
  screen reader gets; the `<h2>` carries the real title.
- **MUST** set heading emphasis via the token weights (semibold headings, bold for CTA/nav-hover) —
  not arbitrary numeric weights.
- **MUST** treat every user-visible string as translatable across **ru / es / en** and leave ~30%
  growth room in buttons, nav, and headings. Strings come from the dictionaries as props — MUST NOT
  hard-code copy in components.

---

## Layout

Ritual uses Tailwind's 4px scale. The landing page is a stack of centred, full-width **bands**, each
with its own vertical rhythm and an inner `max-w-400` content column.

### The band rhythm

- **Section vertical padding:** `py-10 lg:py-18` (roomy) or `py-8 lg:py-16` (tighter). Bands
  alternate a plain cream canvas with a `blush/70` washed band (about-staff) for gentle sectioning.
- **Header→content gap inside a band:** `gap-6 lg:gap-12`.
- **Content ceiling:** `max-w-400` (100rem), centred with `items-center justify-center`.
- **Asymmetric insets:** left-aligned sections use `px-4 md:px-8 lg:px-24`; centred sections use
  smaller `px-2`/`px-4`. The service grid is `grid gap-8 sm:grid-cols-2 lg:grid-cols-3`.

### Rules

- **MUST** land padding, margins, and gaps on the Tailwind step scale — no off-rail arbitrary px.
- **MUST** express hierarchy by varying the band padding and `gap` (label→heading is tight `gap-2`;
  section→section is `py-10 lg:py-18`). The same gap everywhere flattens the page.
- **MUST** keep every interactive control at least `min-h-11 min-w-11` (44px) for touch — this is
  already the button/chrome baseline and is a WCAG 2.2 target-size requirement.
- **MUST** reflow to a single column as the viewport narrows: the service grid collapses
  3→2→1, team cards stack `flex-col` below `md`, and nav collapses into the burger `Dropdown` below
  `lg`. MUST NOT hide the WhatsApp CTA on small screens.
- **SHOULD** test at 320px, 768px, and 1280px.

---

## Elevation & depth

Depth in Ritual is **soft, rounded, and brand-tinted** — never a hard neutral drop shadow. Every
elevation shadow carries a faint magenta (`rgba(218,24,132,…)`) or iris (`rgba(106,13,173,…)`) tint,
so lifting a surface still reads as "Ritual".

| Layer            | Recipe (YAML `elevation`)                                  | Use                                        |
| ---------------- | ---------------------------------------------------------- | ------------------------------------------ |
| **Flat canvas**  | none                                                       | Cream bands. Group with washes + spacing.  |
| **Card**         | 1px magenta ring + soft magenta ambient, on **hover only** | Service / team cards lift on hover.        |
| **Hero panel**   | same ring, lighter ambient (`.25`)                         | Hero pill over the bubble canvas.          |
| **CTA wave**     | iris-tinted ring + ambient (`cta-wave`)                    | The pulsing primary WhatsApp CTA.          |
| **Chrome**       | `shadow-sm`                                                | Sticky header bar, dropdown triggers.      |
| **Menu panel**   | `shadow-lg` + `mauve/30` 2px border                        | Open language / pages dropdowns.           |
| **Footer card**  | `inset` hairline + top highlight (`footer-card`)           | The cream contact card in the footer well. |

### Rules

- **MUST** use the tinted recipes from the YAML `elevation` block; MUST NOT hand-author a neutral
  `box-shadow: 0 4px 8px rgba(0,0,0,…)`.
- **MUST** reserve the strong card-hover shadow for hover — resting cards use a `blush/10` hairline
  border, not a shadow.
- **SHOULD** prefer a soft blush-washed band or a hairline border to separate content before
  reaching for elevation.
- **MUST NOT** stack multiple floating shadows; at most one lifted surface reads at a time.

---

## Shapes

### Corner radius

Ritual is a **rounded** system — nothing on the page has a sharp 90° corner.

| Token        | Value    | Applies to                                                        |
| ------------ | -------- | ----------------------------------------------------------------- |
| `radius-pill`| `40px`   | Buttons, CTA, nav links, header bar, chrome controls, hero panel. |
| `radius-card`| `20px`   | Service cards, cream/marquee cards, image frames, inner tiles.    |
| `radius-panel`| `1rem`  | Dropdown / menu panels (`rounded-2xl`).                           |
| `radius-full`| pill/circle | Avatars, team-card image, burger dots, language trigger.       |

Rules:

- **MUST** pick radius by component class: pill for controls/CTA/header, `card` (20px) for cards and
  image frames, `full` for avatars and round chips. MUST NOT emit an off-token radius (`8px`, `10px`).
- **MUST** clip card imagery with `rounded-card` and team-member photos with `rounded-full`.

### Borders

| Width  | px  | Use                                                                          |
| ------ | --- | ---------------------------------------------------------------------------- |
| hair   | 1px | Card outlines (`blush/10`), header bottom rule (`mauve/30`).                  |
| control| 2px | Chrome controls (nav, lang, burger) — `border-transparent` at rest.          |

Rules:

- **MUST** keep resting card borders at 1px `blush/10` and chrome-control borders at 2px transparent,
  revealing `mint` on focus and `magenta` on hover/active.
- **MUST NOT** use a thick coloured border as decoration — stroke weight only carries interaction
  state (rest → transparent, focus → mint, active → magenta).

### Focus ring

- **MUST** give every focusable control a visible focus affordance. Two patterns exist in the code,
  both acceptable: CTAs use a `ring-2 ring-mint ring-offset-2 ring-offset-cream` ring; chrome
  controls reveal their 2px `border-mint`. MUST NOT `outline: none` without one of these.
- **MUST NOT** drop or restyle focus to a lower-contrast colour than `mint`.

---

## Motion

Motion is warm and organic, matching the impressionist tone — soft decelerations, gentle pulses,
never a mechanical snap. All values live in the YAML `motion` block.

- **Chrome interactions** — `transition duration-500 ease-in-out` on every control (colour, border,
  `scale-95` on active). Longer than a typical product UI on purpose: the site feels calm.
- **CTA wave** — two `mint` halo rings pulse behind the primary WhatsApp button on a `2.4s` loop
  (`@keyframes wave`, staggered `1.2s`). Pauses on focus-within and active.
- **Team cards** — slide in from the screen edge (`team-slide-in-left` / `-right`, `1.1s`
  `cubic-bezier(.22,.61,.36,1)`) once they scroll into view, animating **once**.
- **Brand marquee** — a single continuous `90s linear infinite` leftward scroll; pauses on hover.

### Rules

- **MUST** respect `prefers-reduced-motion: reduce` — [`globals.css`](app/globals.css) kills all
  animation + transition globally and turns the marquee into a normal scroll container so every brand
  stays reachable. Any new motion MUST survive that switch (remain usable with motion off).
- **MUST** use the documented durations/easings, not hand-picked curves. The soft
  `cubic-bezier(.22,.61,.36,1)` decelerate is the house easing for entrances.
- **SHOULD** animate `transform` / `opacity`, not layout properties.
- **MUST NOT** auto-play attention-grabbing loops on CRM/CMS working surfaces — save the bubbles,
  waves, and marquee for the marketing landing page.

---

## Components

Visual recipes (tokens, padding, radius) are in the YAML `components` block. This section covers
intent, variants, and the anti-patterns to correct on sight. Source lives in [`app/ui/`](app/ui/).

### WhatsAppButton — primary CTA

The site's money control ([`WhatsAppButton.tsx`](app/ui/WhatsAppButton.tsx)): `mint` fill, `ink`
label, `radius-pill`, bold `tracking-wider`, `min-h-11`. Builds a `wa.me` link from the Firestore
`messanger` doc. `WhatsAppButtonWave` wraps it with two pulsing halo rings for the hero.

- **MUST** use `mint`→`magenta` for rest→active and the `mint` focus ring; MUST NOT recolour it.
- **MUST** keep exactly one primary CTA emphasis per section. Secondary map/link actions use
  `GoogleMapButton` (`blush` fill) or a `GostButton` ghost.
- **MUST** carry a text label or `aria-label` — icon-only WhatsApp buttons (header) already do.

### GoogleMapButton / GostButton — secondary actions

Same pill geometry, softer emphasis. `GoogleMapButton` = `blush` fill. `GostButton` has `ghost`
(cream/50 fill, `iris` text, `iris/40` border) and `solid` (`blush`) variants.

- **SHOULD** reach for a ghost/secondary button before inventing a new appearance.
- **MUST NOT** give a secondary action the `mint` CTA fill — that emphasis belongs to WhatsApp.

### Chrome controls — nav, language, burger

The header vocabulary ([`NavLink`](app/ui/NavLink.tsx), [`LangButton`](app/ui/LangButton.tsx),
[`BurgerMenuButton`](app/ui/BurgerMenuButton.tsx)): `cream` + `backdrop-blur` fill, 2px transparent
border, pill/circle radius, `mint` on focus, `magenta` on hover/active, `scale-95` press.

- **MUST** preserve the no-reflow nav-hover trick: an invisible bold copy reserves the widest width so
  bolding on hover doesn't shift layout. Keep it when editing `NavLink`.
- **MUST** render menus through the `Dropdown` (`<details>`) primitive — it already handles
  outside-click and `Esc` to close. MUST NOT hand-roll open/close state.
- **MUST** give every icon-only control an `aria-label` (burger, language trigger already do).

### Cards

- **ServiceCard** — `cream/80` fill, 1px `blush/10` border, `radius-card`, image in a `rounded-card`
  frame, hover lifts with the tinted shadow. The 3-up service grid ends with a `blush/70` CTA tile.
- **TeamCard** — pill/circle card, `rounded-full` 290px photo, slides in from the edge on scroll
  (client component with `IntersectionObserver`).
- **CreamCard** — marquee tile: transparent fill, `magenta/20` border, `radius-card`; falls back to
  an `iris/20` bottle glyph when a brand has no logo.

Rules:

- **MUST** keep cards on a `cream` surface with a hairline border, lifting via the tinted hover
  shadow — MUST NOT nest card-on-card or darken the canvas to make cards "pop".
- **MUST** provide real `alt` text on card imagery (staff name, service title, brand name).

### Panels & chrome

- **Header bar** — `cream/85 backdrop-blur-md`, `mauve/30` bottom rule, `radius-pill`, `sticky top-2`.
- **Menu panels** — `cream backdrop-blur-md`, `mauve/30` 2px border, `rounded-2xl`, `shadow-lg`.
- **Footer contact card** — cream pill in a blush-gradient well with the inset `footer-card` shadow.

### BrandMarquee

Continuously scrolling brand gallery. Duplicates the list enough to exceed the widest viewport, then
renders two halves and translates `-50%` for a seamless loop; only the first real pass is announced
to assistive tech (`aria-hidden` on the duplicates). Pauses on hover; degrades to a scroll container
under reduced motion.

---

## Voice & tone

Ritual's product voice is **warm, calm, and inviting** — this is a wellness brand, not a dashboard.
Marketing selling copy is essential on every page (per the project brief).

- **MUST** keep copy warm and personal on marketing/success surfaces (hero, service cards, empty
  states) — the eyebrow/heading pattern sets an unhurried, editorial tone.
- **MUST** structure CRM/DB errors as **human, reason + next step** in the user's language — the data
  layer already surfaces friendly messages (`firebaseErrors.js`); never leak a raw error code.
- **MUST** write every string translatable (ru / es / en) and pull it from the dictionaries — never
  hard-code English, never concatenate sentence fragments (word order differs across the three
  locales).
- **SHOULD** use inviting, active CTAs ("Book on WhatsApp") over generic "Submit" / "Click here".
- **MUST NOT** be playful in genuine friction moments (booking failure, billing) — save the warmth
  and the bubbles for welcome and success.

---

## Accessibility

WCAG **2.2 AA** is the floor (it's a stated project requirement).

- **MUST** keep the `Skip to content` link and the single-`<h1>`, ordered-heading structure. Use
  semantic landmarks (`header` / `main` / `footer`, `nav`).
- **MUST** show a visible focus affordance on every control (`mint` ring or revealed `mint` border) —
  MUST NOT remove it.
- **MUST** meet 44px touch targets (`min-h-11 min-w-11`) on every interactive control.
- **MUST NOT** rely on colour alone. Pair state with shape/label — e.g. the burger dots also change
  colour *and* the control scales on press; nav hover bolds text as well as recolouring it.
- **MUST** label every icon-only control (`aria-label`) and hide decorative icons/SVGs
  (`aria-hidden`) — the codebase already does both.
- **MUST** respect `prefers-reduced-motion` (handled globally) and keep the marquee reachable as a
  scroll container when motion is off.
- **MUST** support 200% zoom and 320px width; the fluid `clamp()` headings and single-column reflow
  already carry this — don't fix type or layout in absolute px.
- **MUST** ensure text contrast on cream: body is `ink` at ≥70% opacity; MUST NOT put text on a
  `blush` fill without checking contrast (use `ink`, never `blush`, for text).
- **MUST** associate CRM form inputs with a **visible label** (never placeholder-as-label) and tie
  validation messages to their field.

---

## Do's and don'ts

The scan-friendly TL;DR. Each line is a drift pattern to correct on sight.

| Do                                                                    | Don't                                                                  |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `cream` `#F6F3EE` as the page canvas                                  | Pure white `#FFFFFF` surfaces, or a grey product-UI background         |
| New hues as soft pastels in the `blush` register                     | Saturated primaries, neon, or cool greys                               |
| `mint` for the primary CTA + focus ring                               | Repurposing `mint` for decoration, or a non-mint CTA                   |
| `magenta` for pressed/active + hover emphasis                        | `magenta` as a large fill or as body text                              |
| Text in `ink` with opacity for hierarchy (`ink/80`, `ink/75`)         | Introducing a new grey, or `blush` as a text colour                    |
| Pill (`40px`) controls, `card` (`20px`) cards, `full` avatars         | Sharp corners or off-token radii (`8px`, `10px`)                       |
| Tinted elevation recipes (magenta / iris shadows)                     | Hand-authored neutral `box-shadow: …rgba(0,0,0,…)`                     |
| Card hover-lift; resting card uses a `blush/10` hairline              | Resting cards floating on a shadow; nested card-on-card                |
| Caveat only for the magenta eyebrow                                   | Caveat in body, buttons, or headings                                   |
| Playfair for headings, Nunito for all UI copy                         | A fourth font family; a heading lighter than semibold                  |
| Strings from dictionaries, translatable (ru/es/en)                    | Hard-coded English or concatenated sentence fragments                  |
| `transition duration-500 ease-in-out` + house `cubic-bezier` easing   | Snappy/mechanical curves; bounce on product surfaces                   |
| `prefers-reduced-motion` respected; marquee stays scrollable          | Auto-playing bubbles/waves/marquee on CRM working surfaces             |
| `aria-label` on icon-only controls; `aria-hidden` on decorative SVGs  | Icon-only buttons with no accessible name                              |
| `min-h-11 min-w-11` (44px) touch targets                              | Sub-44px controls                                                      |
| Visible focus (`mint` ring / border) on every control                 | `outline: none` with no replacement                                    |
| Human, translated, reason + fix DB errors                             | Raw Firestore error codes; "Oops, something went wrong"                |
| Menus via the `Dropdown` `<details>` primitive                        | Hand-rolled open/close state without outside-click / `Esc`             |
