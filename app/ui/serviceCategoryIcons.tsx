import type { ReactNode } from "react";

// Decorative, category-specific glyphs for the service cards. Stroke colour is
// inherited (currentColor) from the card's circle, so these carry no colour of
// their own. Keyed by the dictionary category id; an unknown id falls back to a
// soft generic bloom so a new category never renders an empty circle.
const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICONS: Record<string, ReactNode> = {
  face: (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="8" />
      <path d="M9 10.5h.01M15 10.5h.01" />
      <path d="M9.5 14.5a3.5 3.5 0 0 0 5 0" />
    </svg>
  ),
  body: (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="4.5" r="2" />
      <path d="M8 22l1.5-8-2-2 1-4h5l1 4-2 2 1.5 8" />
    </svg>
  ),
  nails: (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
      <path d="M8 21c-1.5 0-2.5-1-2.5-2.5V10a3.5 3.5 0 0 1 7 0v8.5C12.5 20 11.5 21 8 21Z" />
      <path d="M5.5 10c0-2 1-3.5 2.5-3.5S10.5 8 10.5 10" />
    </svg>
  ),
};

const FALLBACK: ReactNode = (
  <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export function serviceCategoryIcon(categoryId: string): ReactNode {
  return ICONS[categoryId] ?? FALLBACK;
}
