"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SlotCard, type Slot, type SlotCardLabels } from "./SlotCard";

export type SlotGalleryNavLabels = {
    /** aria-label for the "scroll back" circle button. */
    previous: string;
    /** aria-label for the "scroll forward" circle button. */
    next: string;
    /** aria-label naming the scroll track (the slot list). */
    track: string;
};

/** A slot as the gallery receives it — bookable unless marked otherwise. */
export type GallerySlot = Slot & {
    available?: boolean;
    unavailableLabel?: string;
};

type SlotGalleryProps = {
    items: GallerySlot[];
    labels: SlotCardLabels;
    navLabels: SlotGalleryNavLabels;
    onBook: (slot: Slot) => void;
    className?: string;
};

/**
 * A horizontal, snapping gallery of bookable slots with circle prev/next
 * controls and a hidden scrollbar (`no-bar`, defined in globals.css).
 *
 * The arrows scroll one card at a time and disable themselves at each end; the
 * track also scrolls by touch, trackpad and — because it is focusable — the
 * arrow keys, so the buttons are an enhancement rather than the only way to
 * browse. Client component: it measures the DOM to size a scroll step and to
 * know when an end is reached.
 */
export function SlotGallery({
    items,
    labels,
    navLabels,
    onBook,
    className = "",
}: SlotGalleryProps) {
    const trackRef = useRef<HTMLUListElement>(null);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    // Disable each arrow once the track reaches that end. The ±1 absorbs
    // sub-pixel rounding so the end state is reliable. A track with nothing to
    // scroll (one card, or a wide viewport) reports both ends at once, which
    // correctly disables both arrows.
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
    }, [update, items.length]);

    if (items.length === 0) return null;

    // Both controls share everything but their glyph and handler.
    const navButton = (direction: "prev" | "next") => {
        const isPrev = direction === "prev";
        return (
            <button
                type="button"
                onClick={() => scrollByStep(isPrev ? -1 : 1)}
                disabled={isPrev ? atStart : atEnd}
                aria-label={isPrev ? navLabels.previous : navLabels.next}
                data-testid={`slot-nav-${direction}`}
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
                    {isPrev ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}
                </svg>
            </button>
        );
    };

    return (
        <div data-testid="slot-gallery" className={`flex w-full flex-col gap-4 ${className}`}>
            {/* Circle controls, right-aligned above the track. */}
            <div className="flex justify-end gap-2">
                {navButton("prev")}
                {navButton("next")}
            </div>

            {/* `tabIndex` makes the track a focus stop so a keyboard user can
                scroll it with the arrow keys — a scrollable region needs to be
                reachable to be operable. */}
            <ul
                ref={trackRef}
                onScroll={update}
                aria-label={navLabels.track}
                tabIndex={0}
                className="no-bar flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto pb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
                {items.map((slot) => (
                    <SlotCard
                        key={slot.id}
                        {...slot}
                        labels={labels}
                        onBook={onBook}
                        className="w-full shrink-0 basis-[85%] snap-start sm:basis-[48%] lg:basis-[32%]"
                    />
                ))}
            </ul>
        </div>
    );
}
