import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { WhatsAppButton } from "../../ui/WhatsAppButton";

describe("WhatsAppButton in the header", () => {

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

    
});
