import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "@vitest/browser/context";
import { SlotGallery } from "../../ui/SlotGallery";

const slots = [
    { id: "a", service: "Microcurrent therapy", duration: "60 min", date: "Mon 12 Aug · 10:00", price: "€75" },
    { id: "b", service: "RF lifting", duration: "50 min", date: "Mon 12 Aug · 12:00", price: "€80" },
    { id: "c", service: "Gel manicure", duration: "60 min", date: "Tue 13 Aug · 09:30", price: "€40" },
];

const labels = {
    duration: "Duration",
    date: "Date and time",
    price: "Price",
    book: "Book",
};

const navLabels = {
    previous: "Previous slots",
    next: "Next slots",
    track: "Available appointment slots",
};

const gallery = (over: Partial<React.ComponentProps<typeof SlotGallery>> = {}) => (
    <SlotGallery items={slots} labels={labels} navLabels={navLabels} onBook={() => { }} {...over} />
);

describe("SlotGallery", () => {
    it("renders one card per slot", async () => {
        const screen = await render(gallery());
        expect(screen.container.querySelectorAll('[data-testid="slot-card"]')).toHaveLength(
            slots.length
        );
    });

    it("names the scroll track as a labelled list", async () => {
        const screen = await render(gallery());
        await expect
            .element(screen.getByRole("list", { name: navLabels.track }))
            .toBeInTheDocument();
    });

    it("gives the prev/next circle controls accessible names", async () => {
        const screen = await render(gallery());
        await expect
            .element(screen.getByRole("button", { name: navLabels.previous }))
            .toBeInTheDocument();
        await expect
            .element(screen.getByRole("button", { name: navLabels.next }))
            .toBeInTheDocument();
    });

    it("starts with prev disabled (the track is already at the start)", async () => {
        const screen = await render(gallery());
        await expect
            .element(screen.getByRole("button", { name: navLabels.previous }))
            .toBeDisabled();
    });

    it("bubbles the chosen slot up from the card's book button", async () => {
        const onBook = vi.fn();
        const screen = await render(gallery({ onBook }));
        await userEvent.click(
            screen.getByRole("button", { name: `${labels.book}: ${slots[1].service}` })
        );
        expect(onBook).toHaveBeenCalledWith(expect.objectContaining({ id: "b" }));
    });

    it("keeps the track keyboard-scrollable", async () => {
        const screen = await render(gallery());
        const track = await screen.getByRole("list", { name: navLabels.track }).element();
        expect(track.getAttribute("tabindex")).toBe("0");
    });

    it("renders nothing when there are no slots", async () => {
        const screen = await render(gallery({ items: [] }));
        expect(screen.container.querySelector('[data-testid="slot-gallery"]')).toBeNull();
    });

    it("renders a single slot without breaking the controls", async () => {
        const screen = await render(gallery({ items: [slots[0]] }));
        expect(screen.container.querySelectorAll('[data-testid="slot-card"]')).toHaveLength(1);
        await expect
            .element(screen.getByRole("button", { name: navLabels.next }))
            .toBeDisabled();
    });
});
