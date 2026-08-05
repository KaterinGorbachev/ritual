import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "@vitest/browser/context";
import { SlotCard } from "../../ui/SlotCard";

const slot = {
    id: "s1",
    service: "Lifting facial massage",
    duration: "60 min",
    date: "Mon 12 Aug · 10:00",
    price: "€65",
};

const labels = {
    duration: "Duration",
    date: "Date and time",
    price: "Price",
    book: "Book",
};

const card = (over: Partial<React.ComponentProps<typeof SlotCard>> = {}) => (
    <SlotCard {...slot} labels={labels} onBook={() => { }} {...over} />
);

describe("SlotCard", () => {
    it("shows the service name as a heading", async () => {
        const screen = await render(card());
        await expect
            .element(screen.getByRole("heading", { name: slot.service }))
            .toBeInTheDocument();
    });

    it("shows duration, date and price", async () => {
        const screen = await render(card());
        await expect.element(screen.getByText(slot.duration)).toBeInTheDocument();
        await expect.element(screen.getByText(slot.date)).toBeInTheDocument();
        await expect.element(screen.getByText(slot.price)).toBeInTheDocument();
    });

    it("prefixes each meta value with a screen-reader-only label", async () => {
        const screen = await render(card());
        const el = screen.container.querySelector('[data-testid="slot-card"]')!;
        expect(el.textContent).toContain(labels.duration);
        expect(el.textContent).toContain(labels.date);
        expect(el.textContent).toContain(labels.price);
    });

    it("is a list item, so a gallery of cards is announced as a list", async () => {
        const screen = await render(<ul>{card()}</ul>);
        await expect.element(screen.getByRole("listitem")).toBeInTheDocument();
    });

    it("names the book button with the service so every card reads distinctly", async () => {
        const screen = await render(card());
        await expect
            .element(screen.getByRole("button", { name: `${labels.book}: ${slot.service}` }))
            .toBeInTheDocument();
    });

    it("calls onBook with the slot when the book button is pressed", async () => {
        const onBook = vi.fn();
        const screen = await render(card({ onBook }));
        await userEvent.click(screen.getByRole("button", { name: `${labels.book}: ${slot.service}` }));
        expect(onBook).toHaveBeenCalledTimes(1);
        expect(onBook).toHaveBeenCalledWith(expect.objectContaining({ id: slot.id }));
    });

    it("marks a taken slot as unavailable and does not fire onBook", async () => {
        const onBook = vi.fn();
        const screen = await render(card({ onBook, available: false, unavailableLabel: "Taken" }));
        const button = screen.getByRole("button", { name: `${labels.book}: ${slot.service}` });
        await expect.element(button).toBeDisabled();
        // State is not carried by colour alone — a text label says so too.
        await expect.element(screen.getByText("Taken")).toBeInTheDocument();
        expect(onBook).not.toHaveBeenCalled();
    });

    it("carries the 44px touch-target classes on the book button", async () => {
        const screen = await render(card());
        // Asserted as classes, not computed size: the browser test project
        // loads no stylesheet, so geometry would always read as unstyled.
        const button = await screen
            .getByRole("button", { name: `${labels.book}: ${slot.service}` })
            .element();
        expect(button.className).toContain("min-h-11");
        expect(button.className).toContain("min-w-11");
    });
});
