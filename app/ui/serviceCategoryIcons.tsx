import type { ReactNode } from "react";

// Decorative, category-specific glyphs for the service cards and headers.
// Stroke colour is inherited (currentColor) from the surrounding circle, so
// these carry no colour of their own — the caller sets it with a `text-` class
// (lilac / iris per the design system). Traced as clean single-weight salon
// line-art from a spa icon set: an elegant profile with flowing hair (face), a
// lotus / bloom yoga figure (body), and an open hand catching a droplet
// (nails). Drawn on the source 512-unit canvas so the linework keeps its true
// proportions; the caller renders them at ~22px. Keyed by the dictionary
// category id (face / body / hand a.k.a. nails); an unknown id falls back to a
// soft petal bloom so a new category never renders an empty circle. The stroke
// is scaled up (~14) so it stays visible when shrunk to icon size.
const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 14,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICONS: Record<string, ReactNode> = {
  // Face — elegant right-facing profile with long flowing hair cascading down
  // the left. Forehead → nose → lips → chin → neck on the right; the hair falls
  // in three sweeping strands past the shoulder.
  face: (
    <svg width="22" height="22" viewBox="0 0 512 512" {...stroke} aria-hidden="true">
      {/* profile contour: crown, forehead, nose, lips, chin, jaw */}
      <path d="M347 40c14 26 8 52 3 78-4 22-6 44 5 64 9 17 22 32 34 47 7 9 4 20-6 24-9 4-19 6-15 18 3 9 9 18 2 27-5 6-13 6-13 15 0 8 7 14 4 23-4 13-18 18-31 19-21 2-42-3-63 0" />
      {/* jaw / neck to shoulder */}
      <path d="M203 400c8 24 6 50-6 73-6 12-15 22-26 30" />
      {/* long flowing hair, three strands sweeping from crown down the back */}
      <path d="M347 40c-40 6-77 30-100 65-27 41-38 90-33 138 3 32 13 63 12 95" />
      <path d="M270 82C214 106 172 155 158 214c-11 47-4 96 10 141" />
      <path d="M175 452c14-22 20-49 15-75" />
    </svg>
  ),
  // Body — a lotus / bloom yoga figure: a head at the centre, arms lifted into
  // upper petals, and lower petals fanning out, forming a symmetric flower.
  body: (
    <svg width="22" height="22" viewBox="0 0 512 512" {...stroke} aria-hidden="true">
      {/* head */}
      <circle cx="256" cy="176" r="46" />
      {/* upper centre petal, rising between the arms */}
      <path d="M256 130c-16-24-22-52-22-80 0-14 8-26 22-38 14 12 22 24 22 38 0 28-6 56-22 80Z" />
      {/* raised arms sweeping out to the upper side petals */}
      <path d="M214 196c-30-4-58-16-84-34-11-8-11-20 2-26 26 4 52 14 74 30" />
      <path d="M298 196c30-4 58-16 84-34 11-8 11-20-2-26-26 4-52 14-74 30" />
      {/* upper side petals */}
      <path d="M132 136c30 6 56 22 74 46-28 8-58 6-84-8-13-8-13-30 10-38Z" />
      <path d="M380 136c-30 6-56 22-74 46 28 8 58 6 84-8 13-8 13-30-10-38Z" />
      {/* lower side petals */}
      <path d="M156 250c34 14 60 40 74 76-30 2-60-10-80-36-11-14-8-34 6-40Z" />
      <path d="M356 250c-34 14-60 40-74 76 30 2 60-10 80-36 11-14 8-34-6-40Z" />
      {/* body / lower centre petal tapering down */}
      <path d="M214 210c-16 76-6 154 42 220 48-66 58-144 42-220" />
    </svg>
  ),
  // Hand (dictionary id "nails") — an open upturned palm catching a water
  // droplet above it. The hand-care / cleanse scene.
  nails: (
    <svg width="22" height="22" viewBox="0 0 512 512" {...stroke} aria-hidden="true">
      {/* droplet above the palm */}
      <path d="M300 60c34 44 66 88 66 128a66 66 0 0 1-132 0c0-14 4-28 10-42" />
      {/* fingertips / thumb tucked in */}
      <path d="M150 300c40 6 78 24 110 52l40-4c30-24 62-46 96-64 14-8 30-8 42 4-30 40-66 74-108 100l-64 14" />
      {/* palm and forearm, sweeping to the wrist */}
      <path d="M40 320h60l160 90h60c50-28 100-54 152-76 16-8 34-2 42 14-40 24-82 44-126 60" />
      {/* lower wrist line back to the palm */}
      <path d="M290 460c40-14 82-22 118-4 16 8 22 28 14 44" />
    </svg>
  ),
};

const FALLBACK: ReactNode = (
  <svg width="22" height="22" viewBox="0 0 512 512" {...stroke} aria-hidden="true">
    <path d="M256 70c16 44 42 70 86 86-44 16-70 42-86 86-16-44-42-70-86-86 44-16 70-42 86-86Z" />
    <path d="M256 270c12 34 32 54 66 66-34 12-54 32-66 66-12-34-32-54-66-66 34-12 54-32 66-66Z" />
  </svg>
);

export function serviceCategoryIcon(categoryId: string): ReactNode {
  return ICONS[categoryId] ?? FALLBACK;
}
