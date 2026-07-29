import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { FooterContactDetails, type ContactDataItem } from "../../ui/FooterContactDetails";

describe("FooterContactDetails (contact details container)", () => {

    // The salon contact docs the layout would normally fetch once and pass down.
    const contactDocs: ContactDataItem[] = [
        {
            id: "address",
            location: "Carrer de la Pau, 12, 46003 València, España",
            coordinates: "39.4720, -0.3759",
        },
        { id: "workingHours", from: "10:00", to: "20:00", dayStart: "tuesday", dayEnd: "saturday" },
        { id: "messanger", telephone: "+34 600 000 000" },
        { id: "instagram", url: "https://instagram.com/ritual" },
    ];

    // The translated chrome strings the layout passes from the dictionary.
    const props = {
        contactDocs,
        address: "Address",
        hours: "Hours",
        commentAboutAppointments: "By appointment",
        daysOfWeek: {
            monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
            friday: "Fri", saturday: "Sat", sunday: "Sun",
        } as Record<ContactDataItem["dayStart"] & string, string>,
        ariaLabelMapBox: "Map",
        ariaLabelGoogleMapButton: "Open in Google Maps",
    };

    it("renders the contact details container", async () => {
        const screen = await render(<FooterContactDetails {...props} />);

        const container = screen.getByTestId("contact-details");
        await expect.element(container).toBeInTheDocument();
        await expect.element(container).toBeVisible();
    });

    it("shows the address the salon gives it", async () => {
        const screen = await render(<FooterContactDetails {...props} />);

        await expect.element(screen.getByText("Address")).toBeVisible();
        await expect
            .element(screen.getByTestId("contact-details"))
            .toHaveTextContent("Carrer de la Pau, 12");
    });

    it("shows the opening hours", async () => {
        const screen = await render(<FooterContactDetails {...props} />);

        await expect.element(screen.getByText("Hours")).toBeVisible();
        await expect
            .element(screen.getByTestId("contact-details"))
            .toHaveTextContent("Tue – Sat · 10:00 – 20:00");
    });

    it("shows the WhatsApp number", async () => {
        const screen = await render(<FooterContactDetails {...props} />);

        await expect.element(screen.getByText("WhatsApp")).toBeVisible();
        await expect
            .element(screen.getByTestId("contact-details"))
            .toHaveTextContent("+34 600 000 000");
    });

    it("renders the Instagram link with the salon URL", async () => {
        const screen = await render(<FooterContactDetails {...props} />);

        await expect.element(screen.getByText("Instagram")).toBeVisible();
    });

});
