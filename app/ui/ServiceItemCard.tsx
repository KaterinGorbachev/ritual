import { WhatsAppButton } from "./WhatsAppButton";

// One service, as a card: a category glyph in a circle, the name, a short
// description, the duration + price, and a WhatsApp booking button. The button
// is a <WhatsAppButton>, so it reads the salon number from the store and builds
// the wa.me link itself from the prefilled `bookMessage` (which names this
// service). This makes the card a client-tree component.
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
  /** Visible + accessible booking label, e.g. "Book on WhatsApp". */
  bookLabel: string;
  /** Prefilled WhatsApp message naming this service, e.g. "…book Lifting facial". */
  bookMessage: string;
  className?: string;
};

export function ServiceItemCard({

  name,
  from,
  description,
  duration,
  price,
  durationLabel,
  bookLabel,
  bookMessage,
  className = "",
}: ServiceItemCardProps) {
  return (
    <li
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

        {/* Primary WhatsApp CTA. <WhatsAppButton> reads the salon number from
            the store and builds the wa.me link from `bookMessage` (which names
            this service). `text-sm px-4 py-2` trims its default padding to card
            scale; the aria-label names the service so every card's button reads
            distinctly. */}
        <WhatsAppButton
          message={bookMessage}
          ariaLabel={`${bookLabel}: ${name}`}
          className="shrink-0 text-sm px-4 py-2"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.4 13.9c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7s-3.7-3.2-3.8-3.4c-.1-.2-.9-1.2-.9-2.3s.6-1.6.8-1.8c.2-.2.4-.3.6-.3h.4c.2 0 .4 0 .6.5l.8 1.9c.1.1.1.3 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.2.6 1 1.3 1.6.9.8 1.6 1 1.8 1.1.2.1.4.1.5-.1l.6-.8c.2-.2.3-.2.6-.1l1.8.9c.2.1.4.2.5.3.1.1.1.6-.1 1.2Z" />
          </svg>
          <span>{bookLabel}</span>
        </WhatsAppButton>
      </div>
    </li>
  );
}
