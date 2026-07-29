import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { ReviewCard } from "../../ui/ReviewCard";

const QUOTE =
    "I came in wired from a deadline week and left completely re-set. The room really does feel like a painting.";
const AUTHOR = "Marina K.";
const META = "returning client";
const RATING_LABEL = "Rating: 5 out of 5";

const card = (extra: Partial<React.ComponentProps<typeof ReviewCard>> = {}) => (
    <ul>
        <ReviewCard
            quote={QUOTE}
            author={AUTHOR}
            meta={META}
            rating={5}
            ratingLabel={RATING_LABEL}
            {...extra}
        />
    </ul>
);

describe("ReviewCard", () => {
    it("shows the quote", async () => {
        const screen = await render(card());
        await expect.element(screen.getByText(QUOTE)).toBeVisible();
    });

    it("shows the author and their meta line", async () => {
        const screen = await render(card());
        await expect.element(screen.getByText(AUTHOR)).toBeVisible();
        await expect.element(screen.getByText(META, { exact: false })).toBeVisible();
    });

    it("is a list item, so a list of reviews is announced as a list", async () => {
        const screen = await render(card());
        await expect.element(screen.getByRole("listitem")).toBeInTheDocument();
    });

    it("exposes the rating as a single labelled image, not five separate stars", async () => {
        const screen = await render(card());
        // The star row is one img with an accessible name; the individual star
        // SVGs are decorative (aria-hidden), so screen readers hear the label once.
        await expect.element(screen.getByRole("img", { name: RATING_LABEL })).toBeInTheDocument();
    });

    it("renders exactly `rating` filled stars", async () => {
        const screen = await render(card({ rating: 4 }));
        const filled = screen.container.querySelectorAll('[data-testid="review-star-filled"]');
        const empty = screen.container.querySelectorAll('[data-testid="review-star-empty"]');
        expect(filled).toHaveLength(4);
        // Always five stars total, so the row reads as "4 out of 5" visually too.
        expect(filled.length + empty.length).toBe(5);
    });

    it("clamps an out-of-range rating into 0..5", async () => {
        const screen = await render(card({ rating: 9 }));
        const filled = screen.container.querySelectorAll('[data-testid="review-star-filled"]');
        expect(filled).toHaveLength(5);
    });

    it("merges a caller's className onto the card", async () => {
        const screen = await render(card({ className: "snap-start" }));
        await expect.element(screen.getByTestId("review-card")).toHaveClass("snap-start");
    });
});
