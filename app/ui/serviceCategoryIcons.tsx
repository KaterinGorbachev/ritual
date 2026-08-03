import type { ReactNode } from "react";

// Decorative, category-specific glyphs for the service cards and headers.
// Each icon is the same standing-figure silhouette (drawn in magenta) with a
// soft blush highlight marking the area the category treats: the head (face),
// the torso (body), and the hands + feet (nails). The caller renders them at
// ~22px inside a `text-iris` circle and already sets `aria-hidden`, so these
// are purely presentational. Keyed by the dictionary category id; an unknown id
// falls back to a soft petal bloom so a new category never renders an empty
// circle.

// The figure is traced on a 48-unit canvas — the viewBox must match it or the
// linework lands outside the visible area.
const VIEW_BOX = "0 0 48 48";
const SIZE = 22;

const FIGURE_FILL = "#ffadae";
const HIGHLIGHT_FILL = "#bc1571";
const HIGHLIGHT_OPACITY = 0.24;

// Head, then torso + limbs. Both are solid fills, not strokes.
const HEAD_PATH =
  "m 24,12 a 3,3 0 1 0 0,-6 3,3 0 0 0 0,6 m 0,2 a 5,5 0 1 0 0,-10 5,5 0 0 0 0,10";
const BODY_PATH =
  "M 17.374,18.314 A 2,2 0 0 1 19,20.28 V 41 a 1,1 0 0 0 1,1 h 0.087 a 1,1 0 0 0 0.996,-0.91 L 22,31 a 2,2 0 0 1 4,0 l 0.917,10.09 A 1,1 0 0 0 27.913,42 H 28 a 1,1 0 0 0 1,-1 V 20.317 a 2,2 0 0 1 1.626,-1.965 c 1.756,-0.334 3.613,-0.797 5.654,-1.392 a 1,1 0 1 0 -0.56,-1.92 c -4.634,1.35 -8.19,1.976 -11.716,1.96 -3.53,-0.016 -7.09,-0.674 -11.737,-1.963 a 1,1 0 1 0 -0.534,1.927 c 2.033,0.564 3.886,1.016 5.641,1.35 m 5.604,23.489 A 3,3 0 0 1 20.087,44 H 20 A 3,3 0 0 1 17,41 V 20.28 c -1.826,-0.348 -3.735,-0.816 -5.802,-1.39 a 3,3 0 1 1 1.604,-5.78 c 4.57,1.267 7.935,1.875 11.211,1.89 3.266,0.014 6.618,-0.56 11.148,-1.88 a 3,3 0 1 1 1.678,5.76 C 34.755,19.488 32.835,19.968 31,20.317 V 41 a 3,3 0 0 1 -3,3 H 27.913 A 3,3 0 0 1 24.925,41.272 L 24.008,31.182 A 2,2 0 0 1 24,31.005 q 0,0.088 -0.008,0.176 l -0.918,10.09 a 3,3 0 0 1 -0.096,0.532";

type Highlight = { cx: number; cy: number; rx: number; ry: number };

// The shared silhouette plus whichever highlights the category calls for. No
// `id` attributes: the same icon can appear more than once on a page and
// duplicate ids are invalid HTML.
function FigureIcon({ highlights }: { highlights: Highlight[] }) {
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={VIEW_BOX}
      xmlns="http://www.w3.org/2000/svg"
      fillRule="evenodd"
      clipRule="evenodd"
      aria-hidden="true"
      focusable="false"
      className="object-center object-cover w-full h-full"
    >
      <path d={HEAD_PATH} fill={FIGURE_FILL} />
      <path d={BODY_PATH} fill={FIGURE_FILL} />
      {highlights.map((h) => (
        <ellipse
          key={`${h.cx}-${h.cy}`}
          cx={h.cx}
          cy={h.cy}
          rx={h.rx}
          ry={h.ry}
          fill={HIGHLIGHT_FILL}
          fillOpacity={HIGHLIGHT_OPACITY}
        />
      ))}
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  // Head.
  face: (
    <FigureIcon
      highlights={[{ cx: 24.1487, cy: 9.33829, rx: 8.32714, ry: 8.50558 }]}
    />
  ),

  // Torso.
  body: (
    <FigureIcon
      highlights={[{ cx: 24, cy: 27.776953, rx: 8.773235, ry: 13.442379 }]}
    />
  ),

  // Feet, then each hand.
  nails: (
    <FigureIcon
      highlights={[
        { cx: 24, cy: 42.111523, rx: 8.773235, ry: 4.223048 },
        { cx: 37.267662, cy: 15.895911, rx: 4.282529, ry: 4.223048 },
        { cx: 11.059481, cy: 15.806692, rx: 4.282529, ry: 4.223048 },
      ]}
    />
  ),
};

// Unlike the figures above, the fallback bloom is single-weight line-art that
// inherits its colour from the surrounding circle.
const FALLBACK: ReactNode = (
  <svg
    width={SIZE}
    height={SIZE}
    viewBox="0 0 512 512"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    strokeWidth={14}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M256 70c16 44 42 70 86 86-44 16-70 42-86 86-16-44-42-70-86-86 44-16 70-42 86-86Z" />
    <path d="M256 270c12 34 32 54 66 66-34 12-54 32-66 66-12-34-32-54-66-66 34-12 54-32 66-66Z" />
  </svg>
);

export function serviceCategoryIcon(categoryId: string): ReactNode {
  return ICONS[categoryId] ?? FALLBACK;
}
