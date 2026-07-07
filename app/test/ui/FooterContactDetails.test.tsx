import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { FooterDetailsBox } from "../../ui/FooterContactDetails";

describe("FooterDetailsBox (contact details container)", () => {

    // The props we feed the component in every test below.
    const props = {
        address: "Carrer de la Pau, 12, 46003 València, España",
        hours: "Tue–Sat · 10:00–20:00",
        whatsapp: "+34 600 000 000",
        instagram: "hello@aurelle.studio",
    };

    it("renders the contact details container", async () => {
        // Arrange + Act — mount the component with contact data.
        const screen = await render(<FooterDetailsBox {...props} />);

        // Assert — the outer container is on the page and visible.
        const container = screen.getByTestId("contact-details");
        await expect.element(container).toBeInTheDocument();
        await expect.element(container).toBeVisible();
    });

    it("shows the address the salon gives it", async () => {
        const screen = await render(<FooterDetailsBox {...props} />);

        // The address heading and the actual address text both appear.
        await expect.element(screen.getByText("Address")).toBeVisible();
        await expect
            .element(screen.getByTestId("contact-details"))
            .toHaveTextContent("Carrer de la Pau, 12");
    });

    it("shows the opening hours", async () => {
        const screen = await render(<FooterDetailsBox {...props} />);

        await expect.element(screen.getByText("Hours")).toBeVisible();
        await expect
            .element(screen.getByTestId("contact-details"))
            .toHaveTextContent("Tue–Sat · 10:00–20:00");
    });

    it("shows the WhatsApp number", async () => {
        const screen = await render(<FooterDetailsBox {...props} />);

        await expect.element(screen.getByText("WhatsApp")).toBeVisible();
        await expect
            .element(screen.getByTestId("contact-details"))
            .toHaveTextContent("+34 600 000 000");
    });

    it("shows the Instagram handle", async () => {
        const screen = await render(<FooterDetailsBox {...props} />);

        await expect.element(screen.getByText("Instagram")).toBeVisible();
        await expect
            .element(screen.getByTestId("contact-details"))
            .toHaveTextContent("hello@aurelle.studio");
    });

});
