import { CreamCard } from "./CreamCard";

type Brand = {
  id: string | number;
  name: string;
  description?: string;
  image?: string;
};

type BrandMarqueeProps = {
  items: Brand[];
};

/** Widest viewport we design for; one track half must exceed this to look full. */
const MAX_VIEWPORT = 2560;
/** Conservative minimum footprint of a single card (width + track gap), in px.
    Kept low on purpose so we err toward more copies rather than empty space. */
const MIN_CARD_FOOTPRINT = 160;

/**
 * A continuously scrolling gallery of brand cards that pauses on hover.
 *
 * One "half" of the track must be wider than the viewport, or a gap appears
 * before the loop wraps. We can't measure DOM width on the server, so we repeat
 * the list enough times that a half is guaranteed to exceed MAX_VIEWPORT even
 * with a small number of narrow cards — then render two halves so translating
 * the track by -50% loops seamlessly.
 *
 * Styling is inline Tailwind: `animate-marquee` (defined in globals.css @theme)
 * scrolls the track and `group-hover` pauses it. Only the reduced-motion
 * fallback (matched via [data-marquee]) lives in globals.css.
 */
export function BrandMarquee({ items }: BrandMarqueeProps) {
  if (items.length === 0) return null;

  const oneHalfWidth = items.length * MIN_CARD_FOOTPRINT;
  const repeats = Math.max(1, Math.ceil(MAX_VIEWPORT / oneHalfWidth));

  // One half = the list repeated `repeats` times; the full track is two halves.
  const half = Array.from({ length: repeats }, () => items).flat();
  const track = [...half, ...half];

  return (
    <div
      data-marquee
      className="group w-full overflow-hidden py-2"
      aria-label="Brands we use"
    >
      <ul className="flex w-max items-stretch gap-4 animate-marquee will-change-transform group-hover:[animation-play-state:paused]">
        {track.map((member, i) => (
          <CreamCard
            key={`${member.id}-${i}`}
            name={member.name}
            description={member.description}
            image={member.image}
            // Only the first pass through the real list is announced; every
            // repeated/duplicated card is decorative.
            aria-hidden={i >= items.length}
          />
        ))}
      </ul>
    </div>
  );
}
