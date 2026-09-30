import type { ReactNode } from "react";

// One service, as a card: the name, a short description, the duration + price,
// and a call-to-action slot. The CTA (a <WhatsAppButton> on the services page)
// is passed in by the parent as `children`, so the card stays presentational
// and doesn't depend on the WhatsApp store.
type ServiceItemCardProps = {
  name: string;
  from: string;
  description: string;
  /** Already localised, e.g. "60 min". */
  duration: string;
  /** Already formatted, e.g. "€65". */
  price: string;
  /** Screen-reader prefix for the duration, e.g. "Duration". */
  durationLabel: string;
  /** Booking CTA, e.g. a <WhatsAppButton> whose message names this service. */
  children?: ReactNode;
  className?: string;
  /** "div" when the parent already wraps each card in an <li> (HorizontalGallery). */
  as?: "li" | "div";
};

export function ServiceItemCard({
  name,
  from,
  description,
  duration,
  price,
  durationLabel,
  children,
  className = "",
  as: Tag = "li",
}: ServiceItemCardProps) {
  return (
    <Tag
      data-testid="service-item-card"
      className={`group flex h-full min-h-72 w-full flex-col justify-between gap-5 rounded-card border border-blush/10 bg-cream p-6 text-start transition hover:shadow-[0_0_0_1px_rgba(218,24,132,.12),0_18px_50px_-24px_rgba(218,24,132,.45)] ${className}`}
    >
      <div className="flex flex-col gap-3">
        
        <h3 className="font-display text-2xl font-semibold leading-snug tracking-normal text-ink">
          {name}
        </h3>
        <p className="font-body text-base leading-relaxed text-ink/75">{description}</p>
      </div>

      <div className="flex flex-col md:flex-row items-end justify-between gap-3">
        <div className="flex flex-row justify-between items-center md:items-start gap-4 md:flex-col md:gap-0.5 font-body w-full">
          <span className="inline-flex items-center gap-1.5 text-sm text-ink/70">
            {/* Clock glyph, decorative — the sr-only label carries the meaning. */}
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
            <span className="sr-only">{durationLabel}: </span>
            {duration}
          </span>
          <span className="font-display text-lg font-semibold tabular-nums text-iris">
            {from + " " + price}
          </span>
        </div>

        {children}
      </div>
    </Tag>
  );
}
