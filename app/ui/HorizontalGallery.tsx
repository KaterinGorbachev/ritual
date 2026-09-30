"use client";

import {
    Children,
    isValidElement,
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";

type HorizontalGalleryProps = {
    /** The cards. Each child is wrapped in its own `<li>` snap slot, so cards
     *  should NOT render an `<li>` themselves. Falsy children are skipped. */
    children: ReactNode;
    labels: {
        /** aria-label for the "scroll back" circle button. */
        previous: string;
        /** aria-label for the "scroll forward" circle button. */
        next: string;
        /** aria-label naming the scroll track (the card list). */
        track: string;
    };
    className?: string;
    /** Width of each slot. Defaults to 1 card on mobile, 2 on tablet, 3 on desktop. */
    itemClassName?: string;
    /** Test-id prefix; the track, items and controls derive theirs from it. */
    "data-testid"?: string;
};

/** Round gallery control: a small elegant circle with a chevron. Reveals a
 *  mint focus border and magenta on hover; disables + fades at each track end. */
function NavButton({
    direction,
    label,
    disabled,
    onClick,
    testId,
}: {
    direction: "prev" | "next";
    label: string;
    disabled: boolean;
    onClick: () => void;
    testId: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            data-testid={`${testId}-nav-${direction}`}
            className="inline-flex h-11 w-11 min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border-2 border-transparent bg-cream/80 text-iris shadow-sm backdrop-blur transition duration-500 ease-in-out hover:border-magenta hover:text-magenta focus:border-mint focus:outline-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-transparent disabled:hover:text-iris"
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
 * A reusable horizontal, snapping gallery with circle prev/next controls and a
 * hidden scrollbar (`no-bar`, defined in globals.css). The parent owns the
 * cards and passes them as children; the gallery only lays them out and scrolls.
 *
 * Each arrow press scrolls by the cards that fully fit (1 on mobile, 2–3 on a
 * wide screen) and the arrows disable themselves at each end. The track also
 * scrolls by touch, trackpad and — because it is focusable — the arrow keys.
 * Client component: it measures the DOM to size a step and detect the ends.
 */
export function HorizontalGallery({
    children,
    labels,
    className = "",
    itemClassName = "basis-[85%] sm:basis-[48%] lg:basis-[32%]",
    "data-testid": testId = "horizontal-gallery",
}: HorizontalGalleryProps) {
    const trackRef = useRef<HTMLUListElement>(null);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    // toArray drops null/false/undefined, so conditional cards leave no empty slot.
    const cards = Children.toArray(children);

    // Disable each arrow once the track reaches that end. The ±1 absorbs
    // sub-pixel rounding; a track with nothing to scroll disables both.
    const update = useCallback(() => {
        const track = trackRef.current;
        if (!track) return;
        const max = track.scrollWidth - track.clientWidth;
        setAtStart(track.scrollLeft <= 1);
        setAtEnd(track.scrollLeft >= max - 1);
    }, []);

    // Scroll distance = as many whole cards as are visible (at least one).
    const step = useCallback(() => {
        const track = trackRef.current;
        if (!track) return 0;
        const card = track.firstElementChild as HTMLElement | null;
        const cardWidth = card?.getBoundingClientRect().width ?? 0;
        if (cardWidth <= 0) return track.clientWidth;
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        const stride = cardWidth + gap;
        return Math.max(1, Math.floor((track.clientWidth + gap) / stride)) * stride;
    }, []);

    const scrollByStep = useCallback(
        (dir: 1 | -1) => {
            trackRef.current?.scrollBy({ left: dir * step(), behavior: "smooth" });
        },
        [step]
    );

    // ResizeObserver also catches the track resizing on its own (images
    // loading, parent reflow), not only window resizes.
    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;
        update();
        const observer = new ResizeObserver(update);
        observer.observe(track);
        return () => observer.disconnect();
    }, [update, cards.length]);

    if (cards.length === 0) return null;

    return (
        // min-w-0 + max-w-full: a flex child defaults to min-width:auto, which
        // would let the track's full scroll width push the page past the viewport.
        <div data-testid={testId} className={`flex w-full min-w-0 max-w-full flex-col gap-4 ${className}`}>
            {/* Circle controls, right-aligned above the track. */}
            <div className="flex justify-end gap-2">
                <NavButton
                    direction="prev"
                    label={labels.previous}
                    disabled={atStart}
                    onClick={() => scrollByStep(-1)}
                    testId={testId}
                />
                <NavButton
                    direction="next"
                    label={labels.next}
                    disabled={atEnd}
                    onClick={() => scrollByStep(1)}
                    testId={testId}
                />
            </div>

            {/* `tabIndex` makes the track a focus stop so a keyboard user can
                scroll it with the arrow keys. */}
            <ul
                ref={trackRef}
                onScroll={update}
                aria-label={labels.track}
                tabIndex={0}
                data-testid={`${testId}-track`}
                className="no-bar flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto pb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
                {cards.map((card, i) => (
                    <li
                        key={isValidElement(card) && card.key != null ? card.key : i}
                        data-testid={`${testId}-item`}
                        className={`flex w-full shrink-0 snap-start ${itemClassName}`}
                    >
                        {card}
                    </li>
                ))}
            </ul>
        </div>
    );
}
