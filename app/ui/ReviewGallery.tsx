"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReviewCard } from "./ReviewCard";

export type Review = {
    id: string | number;
    quote: string;
    author: string;
    meta: string;
    rating: number;
};

type ReviewGalleryProps = {
    items: Review[];
    /** Star-row label template; `{rating}` is replaced per card, e.g. "{rating} out of 5". */
    ratingLabel: string;
    labels: {
        /** aria-label for the "scroll back" circle button. */
        previous: string;
        /** aria-label for the "scroll forward" circle button. */
        next: string;
        /** aria-label naming the scroll track (the review list). */
        track: string;
    };
    className?: string;
};

/** Round gallery control: a small elegant circle with a chevron. Reveals a
 *  mint focus border and magenta on hover; disables + fades at each track end. */
function NavButton({
    direction,
    label,
    disabled,
    onClick,
}: {
    direction: "prev" | "next";
    label: string;
    disabled: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            data-testid={`review-nav-${direction}`}
            className="inline-flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-full border-2 border-transparent bg-cream/80 text-iris shadow-sm backdrop-blur transition duration-500 ease-in-out hover:border-magenta hover:text-magenta focus:border-mint focus:outline-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-transparent disabled:hover:text-iris cursor-pointer"
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                {direction === "prev" ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}
            </svg>
        </button>
    );
}

/**
 * A horizontal, snapping gallery of review cards with small circle prev/next
 * buttons and a hidden scrollbar (`no-bar`, defined in globals.css). Arrows
 * scroll one card at a time and disable themselves at each end; the track also
 * scrolls by touch/trackpad, so the buttons are an enhancement, not the only
 * way to browse. Client component — it measures the DOM to size a scroll step
 * and to know when an end is reached.
 */
export function ReviewGallery({ items, ratingLabel, labels, className = "" }: ReviewGalleryProps) {
    const trackRef = useRef<HTMLUListElement>(null);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    // Disable each arrow once the track reaches that end. `-1` / `+1` absorb
    // sub-pixel rounding so the end state is reliable.
    const update = useCallback(() => {
        const track = trackRef.current;
        if (!track) return;
        const max = track.scrollWidth - track.clientWidth;
        setAtStart(track.scrollLeft <= 1);
        setAtEnd(track.scrollLeft >= max - 1);
    }, []);

    // Scroll distance = one card (first child width + the flex column gap).
    const step = useCallback(() => {
        const track = trackRef.current;
        if (!track) return 0;
        const card = track.firstElementChild as HTMLElement | null;
        const gap = parseFloat(getComputedStyle(track).columnGap) || 20;
        return card ? card.getBoundingClientRect().width + gap : track.clientWidth;
    }, []);

    const scrollByStep = useCallback(
        (dir: 1 | -1) => {
            trackRef.current?.scrollBy({ left: dir * step(), behavior: "smooth" });
        },
        [step]
    );

    useEffect(() => {
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, [update]);

    if (items.length === 0) return null;

    return (
        <div data-testid="review-gallery" data-gallery className={`w-full ${className}`}>
            {/* Circle controls, right-aligned above the track. Hidden from the
                tab order on very small screens is unnecessary: swipe still works,
                and the buttons remain reachable and disabled-aware. */}
            <div className="mb-4 flex justify-end gap-2">
                <NavButton
                    direction="prev"
                    label={labels.previous}
                    disabled={atStart}
                    onClick={() => scrollByStep(-1)}
                />
                <NavButton
                    direction="next"
                    label={labels.next}
                    disabled={atEnd}
                    onClick={() => scrollByStep(1)}
                />
            </div>

            <ul
                ref={trackRef}
                onScroll={update}
                aria-label={labels.track}
                className="no-bar flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto pb-2"
            >
                {items.map((r) => (
                    <ReviewCard
                        key={r.id}
                        quote={r.quote}
                        author={r.author}
                        meta={r.meta}
                        rating={r.rating}
                        ratingLabel={ratingLabel.replace("{rating}", String(r.rating))}
                        className="w-full shrink-0 basis-[85%] snap-start sm:basis-[48%] lg:basis-[32%]"
                    />
                ))}
            </ul>
        </div>
    );
}
