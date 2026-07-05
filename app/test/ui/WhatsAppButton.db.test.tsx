import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the data layer so no real Firestore call happens. This is the seam:
// the test controls what "the database" returns.
vi.mock("../../lib/handleData", () => ({
    getInfo: vi.fn(),
}));
import { getInfo } from "../../lib/handleData";
import { WhatsAppButton } from "../../ui/WhatsAppButton";

describe("WhatsAppButton sources its number from the database", () => {
    beforeEach(() => {
        vi.mocked(getInfo).mockReset();
    });

    it("gets number from database", async () => {
        // Arrange — the database returns a contact row with a WhatsApp number.
        vi.mocked(getInfo).mockResolvedValue({
            ok: true,
            data: [{ id: "1", whatsapp: "+34 611 22 33 44" }],
        });

        // Act — WhatsAppButton is (will become) an async server component:
        // await it to get its rendered JSX, then mount that.
        const jsx = await WhatsAppButton({
            message: "Hello",
            children: <span>WhatsApp</span>,
        });
        render(jsx);

        // Assert — it asked the DB for the contact...
        expect(getInfo).toHaveBeenCalledWith("contact");

        // ...and the number from the DB ended up in the wa.me link.
        const button = screen.getByTestId("whatsapp-button");
        expect(button).toHaveAttribute(
            "href",
            expect.stringContaining("wa.me/34611223344")
        );
    });
});
