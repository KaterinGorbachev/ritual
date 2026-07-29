import { describe, it, expect, beforeEach } from "vitest";
import { render } from "vitest-browser-react";
import { WhatsAppButton } from "../../ui/WhatsAppButton";
import { useWhatsAppStore } from "../../store/whatsappStore";

describe("WhatsAppButton in the header", () => {
    beforeEach(() => {
        // The button reads the salon number from the Zustand store (seeded in
        // the layout at runtime). Seed it here so the tests mirror production.
        useWhatsAppStore.getState().setNumber("+34 611 22 33 44");
    });

    it("is visible and clickable to the user", async () => {
        // Arrange — mount the button exactly how the header uses it.
        const screen = await render(
            <WhatsAppButton
                message=""
                className="inline-flex lg:ml-6"
            >
                <span>WhatsApp</span>
            </WhatsAppButton>
        );

        // Act — locate it in the real DOM by its test id (a Playwright locator).
        const button = screen.getByTestId("whatsapp-button");

        // Assert — it exists and is actually shown.
        await expect.element(button).toBeInTheDocument();
        await expect.element(button).toBeVisible();
    });

    it("renders its children (icon + label)", async () => {
        const screen = await render(
            <WhatsAppButton
                message=""
            >
                <span>WhatsApp</span>
            </WhatsAppButton>
        );

        const button = screen.getByTestId("whatsapp-button");
        await expect.element(button).toHaveTextContent("WhatsApp");
    });

    it("opens WhatsApp in a new tab, safely", async () => {
        const screen = await render(
            <WhatsAppButton
                message=""
            >
                <span>WhatsApp</span>
            </WhatsAppButton>
        );

        const button = screen.getByTestId("whatsapp-button");
        // New tab, without leaking the opener window.
        await expect.element(button).toHaveAttribute("target", "_blank");
        await expect.element(button).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("builds a wa.me link from the number in the store", async () => {
        const screen = await render(
            <WhatsAppButton message="Hello">
                <span>WhatsApp</span>
            </WhatsAppButton>
        );

        const button = screen.getByTestId("whatsapp-button");
        // Digits only from the store, plus the URL-encoded prefilled message.
        await expect
            .element(button)
            .toHaveAttribute("href", "https://wa.me/34611223344?text=Hello");
    });
});
