"use client";

export type Slot = {
    id: string;
    /** Service name, already localised. */
    service: string;
    /** Already localised, e.g. "60 min". */
    duration: string;
    /** Already formatted and localised, e.g. "Mon 12 Aug · 10:00". */
    date: string;
    /** Already formatted, e.g. "€65". */
    price: string;
};

export type SlotCardLabels = {
    /** Screen-reader prefix for the duration, e.g. "Duration". */
    duration: string;
    /** Screen-reader prefix for the date, e.g. "Date and time". */
    date: string;
    /** Screen-reader prefix for the price, e.g. "Price". */
    price: string;
    /** Visible booking label, e.g. "Book". */
    book: string;
};

type SlotCardProps = Slot & {
    labels: SlotCardLabels;
    onBook: (slot: Slot) => void;
    /** A slot already taken is shown, but cannot be booked. Defaults to true. */
    available?: boolean;
    /** Visible text for a taken slot, e.g. "Taken". Required when unavailable. */
    unavailableLabel?: string;
    className?: string;
};

/**
 * One bookable appointment slot, as a card: the service, its duration, the date
 * and time, the price, and a button that hands the slot back to the parent to
 * open the booking form.
 *
 * Presentational and reusable — it holds no booking state of its own and every
 * string arrives localised as a prop. A taken slot stays visible (so the
 * gallery reads as a real schedule) but disables its button and says so in
 * words, never by colour alone.
 *
 * Each glyph is decorative and `aria-hidden`, so the value beside it carries an
 * sr-only label — otherwise a screen reader would announce a bare "60 min" with
 * no clue what it measures.
 */
export function SlotCard({
    id,
    service,
    duration,
    date,
    price,
    labels,
    onBook,
    available = true,
    unavailableLabel,
    className = "",
}: SlotCardProps) {
    return (
        <li
            data-testid="slot-card"
            data-available={available}
            className={`flex h-full min-h-64 flex-col justify-between gap-5 rounded-card border-2 border-mauve/10 bg-blush/10 p-6 text-start transition duration-500 ease-in-out hover:bg-blush/40 ${className}`}
        >
            <div className="flex flex-col gap-3">
                <h3 className="font-display text-2xl font-semibold leading-snug text-ink">
                    {service}
                </h3>

                <div className="flex flex-col gap-2">
                    <span className="inline-flex items-center gap-2 font-body text-sm text-ink/75">
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blush/20 text-iris">
                            {/* Calendar, sketched. */}
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1}
                                strokeLinecap="round"
                                aria-hidden="true"
                            >
                                <rect x="3.5" y="5" width="17" height="15" rx="3" />
                                <path d="M8 3v4M16 3v4M3.5 10h17" />
                            </svg>
                        </span>
                        <span className="sr-only">{labels.date}: </span>
                        {date}
                    </span>

                    <span className="inline-flex items-center gap-2 font-body text-sm text-ink/75">
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blush/20 text-iris">
                            {/* Clock, sketched. */}
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1}
                                strokeLinecap="round"
                                aria-hidden="true"
                            >
                                <circle cx="12" cy="12" r="9" />
                                <path d="M12 7v5l3 2" />
                            </svg>
                        </span>
                        <span className="sr-only">{labels.duration}: </span>
                        {duration}
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-display text-2xl font-semibold tabular-nums text-iris">
                    <span className="sr-only">{labels.price}: </span>
                    {price}
                </span>

                {/* A taken slot says so in words beside its disabled button, so
                    the state never rests on colour alone. */}
                {!available && unavailableLabel ? (
                    <span className="font-body text-sm text-ink/70">{unavailableLabel}</span>
                ) : null}

                <button
                    type="button"
                    onClick={() => onBook({ id, service, duration, date, price })}
                    disabled={!available}
                    aria-label={`${labels.book}: ${service}`}
                    data-testid="slot-card-book"
                    className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-pill bg-mint px-6 py-3 font-body font-bold tracking-wider text-ink shadow-sm transition duration-500 ease-in-out hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-cream active:scale-95 active:bg-magenta disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
                >
                    {labels.book}
                </button>
            </div>
        </li>
    );
}
