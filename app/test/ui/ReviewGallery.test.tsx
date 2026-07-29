import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { ReviewGallery } from "../../ui/ReviewGallery";

const labels = {
    previous: "Previous reviews",
    next: "Next reviews",
    track: "Client reviews",
};

const items = [
    { id: "a", quote: "First quote.", author: "Ana", meta: "first visit", rating: 5 },
    { id: "b", quote: "Second quote.", author: "Bruno", meta: "monthly member", rating: 4 },
    { id: "c", quote: "Third quote.", author: "Carla", meta: "returning client", rating: 3 },
];

const gallery = () => (
    <ReviewGallery items={items} ratingLabel="{rating} out of 5" labels={labels} />
);

describe("ReviewGallery", () => {
    it("renders one card per review", async () => {
        const screen = await render(gallery());
        const cards = screen.container.querySelectorAll('[data-testid="review-card"]');
        expect(cards).toHaveLength(items.length);
    });

    it("names the scroll track as a labelled group", async () => {
        const screen = await render(gallery());
        await expect.element(screen.getByRole("list", { name: labels.track })).toBeInTheDocument();
    });

    it("gives the prev/next controls accessible names", async () => {
        const screen = await render(gallery());
        await expect.element(screen.getByRole("button", { name: labels.previous })).toBeInTheDocument();
        await expect.element(screen.getByRole("button", { name: labels.next })).toBeInTheDocument();
    });

    it("builds each rating label from the template, substituting {rating}", async () => {
        const screen = await render(gallery());
        // First card has rating 5, so its labelled star row reads "5 out of 5".
        await expect.element(screen.getByRole("img", { name: "5 out of 5" })).toBeInTheDocument();
        await expect.element(screen.getByRole("img", { name: "4 out of 5" })).toBeInTheDocument();
    });

    it("starts with the prev control disabled (already at the start)", async () => {
        const screen = await render(gallery());
        await expect
            .element(screen.getByRole("button", { name: labels.previous }))
            .toBeDisabled();
    });

    it("renders nothing when there are no reviews", async () => {
        const screen = await render(
            <ReviewGallery items={[]} ratingLabel="{rating} out of 5" labels={labels} />
        );
        expect(screen.container.querySelector('[data-testid="review-gallery"]')).toBeNull();
    });
});
