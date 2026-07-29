type ReviewCardProps = {
    /** The review body, already localised. */
    quote: string;
    /** Reviewer name, e.g. "Marina K.". */
    author: string;
    /** Short reviewer context, e.g. "returning client" / "first visit". */
    meta: string;
    /** Whole-number star count; clamped into 0..5. */
    rating: number;
    /** Accessible name for the star row, already localised, e.g. "Rating: 5 out of 5". */
    ratingLabel: string;
    className?: string;
    "aria-hidden"?: boolean;
};

const MAX_STARS = 5;

/** A single hand-drawn five-point star. `filled` seats it in magenta; empty
 *  stars keep a soft outline so the rating reads by shape, not colour alone. */
function Star({ filled }: { filled: boolean }) {
    return (
        <svg
            data-testid={filled ? "review-star-filled" : "review-star-empty"}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.3}
            strokeLinejoin="round"
            className={filled ? "text-magenta" : "text-magenta/30"}
            aria-hidden="true"
        >
            <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.8 6.1 20.9l1.1-6.5L2.5 9.3l6.5-.9z" />
        </svg>
    );
}

/**
 * One client review, as a card: a star rating, the quote, and the reviewer's
 * name + context. Pure presentational Server Component — all copy arrives
 * localised as props. Lives inside a <ul>; the star row is a single labelled
 * image so assistive tech hears the rating once, not five times.
 */
export function ReviewCard({
    quote,
    author,
    meta,
    rating,
    ratingLabel,
    className = "",
    "aria-hidden": ariaHidden,
}: ReviewCardProps) {
    const filled = Math.max(0, Math.min(MAX_STARS, Math.round(rating)));

    return (
        <li
            data-testid="review-card"
            aria-hidden={ariaHidden}
            className={`flex flex-col gap-4 rounded-card border border-blush/10 bg-cream/80 p-6 text-start transition  ${className}`}
        >
            <figure className="flex grow flex-col gap-4">
                <div className="flex gap-0.5" role="img" aria-label={ratingLabel}>
                    {Array.from({ length: MAX_STARS }, (_, i) => (
                        <Star key={i} filled={i < filled} />
                    ))}
                </div>

                <blockquote className="font-body text-base leading-relaxed text-ink/80">
                    &ldquo;{quote}&rdquo;
                </blockquote>

                <figcaption className="mt-auto pt-2 font-body text-sm leading-relaxed tracking-normal text-ink/70">
                    <span className="font-semibold text-ink">{author}</span>
                    <span aria-hidden="true"> · </span>
                    {meta}
                </figcaption>
            </figure>
        </li>
    );
}
