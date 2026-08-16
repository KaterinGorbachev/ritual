import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { FooterContactDetails, type ContactDataItem } from "../../ui/FooterContactDetails";

describe("FooterContactDetails (contact details container)", () => {

    // The salon contact docs the layout would normally fetch once and pass down.
    const contactDocs: ContactDataItem[] = [
        {
            id: "address",
            location: "Calle de Móra de Rubióls 3, Valencia 46007",
            coordinates: "39.459230762224585, -0.3851381134944049",
            mapLink: "https://maps.app.goo.gl/pNYJdivn8REfyfT57"
        },
        { id: "workingHours", from: "10", to: "20", dayStart: "monday", dayEnd: "sunday" },
        { id: "messanger", telephone: "+34643987849" },
        { id: "instagram", url: "https://www.instagram.com/ritual.beauty_estetica" },
    ];

    // The translated chrome strings the layout passes from the dictionary.
    const props = {
        contactDocs,
        address: "Address",
        hours: "Hours",
        commentAboutAppointments: "By appointment",
        daysOfWeek: {
            monday: "Monday", tuesday: "Tuesday", wednesday: "Wednsday", thursday: "Thursday",
            friday: "Friday", saturday: "Saturday", sunday: "Sunday",
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
            .toHaveTextContent("Calle de Móra de Rubióls 3, Valencia 46007");
    });

    it("shows the opening hours", async () => {
        const screen = await render(<FooterContactDetails {...props} />);

        await expect.element(screen.getByText("Hours")).toBeVisible();
        await expect
            .element(screen.getByTestId("contact-details"))
            .toHaveTextContent("Monday – Sunday · 10 – 20");
    });

    it("shows the WhatsApp number", async () => {
        const screen = await render(<FooterContactDetails {...props} />);

        await expect.element(screen.getByText("WhatsApp")).toBeVisible();
        await expect
            .element(screen.getByTestId("contact-details"))
            .toHaveTextContent("+34643987849");
    });

    it("renders the Instagram link with the salon URL", async () => {
        const screen = await render(<FooterContactDetails {...props} />);

        await expect.element(screen.getByText("Instagram")).toBeVisible();
    });

    // The link is a plain anchor — clicking it would open a real tab in the
    // browser project, so assert on the attributes the browser acts on instead.
    it("on click Instagram link opens in a new window", async () => {
        const screen = await render(<FooterContactDetails {...props} />);

        const link = screen.getByRole("link", { name: "Instagram" });
        await expect.element(link).toHaveAttribute("target", "_blank");
        await expect.element(link).toHaveAttribute("rel", "noopener noreferrer");
        await expect
            .element(link)
            .toHaveAttribute("href", "https://www.instagram.com/ritual.beauty_estetica");
    });

    // The Google Maps button sits on top of the map, so it arrives with
    // MapLeaflet — which is next/dynamic({ ssr: false }) and therefore mounts
    // one tick after the footer itself. The retrying `expect.element` is what
    // bridges that gap; a synchronous query would race the lazy chunk.
    it("shows a link Open in Google maps", async () => {
        const screen = await render(<FooterContactDetails {...props} />);

        const link = screen.getByRole("link", { name: "Open in Google Maps" });
        await expect.element(link).toBeVisible();
        // The salon's own short link from the address doc wins over the
        // coordinate-built fallback, so a curated pin is what the visitor gets.
        await expect
            .element(link)
            .toHaveAttribute("href", "https://maps.app.goo.gl/pNYJdivn8REfyfT57");
    })

    it("safely opens a googlemaps link in a new window", async () => {
        const screen = await render(<FooterContactDetails {...props} />);

        const link = screen.getByRole("link", { name: "Open in Google Maps" });
        // Leaving the site for Google Maps must not cost the visitor their
        // place in the page, and without noopener the opened tab can reach
        // back through window.opener.
        await expect.element(link).toHaveAttribute("target", "_blank");
        await expect.element(link).toHaveAttribute("rel", "noopener noreferrer");
    })

    // Firestore may hold an address doc with no mapLink at all — the component
    // then builds the query URL from the parsed coordinates rather than
    // rendering a link that goes nowhere.
    it("falls back to a coordinate link when the salon has no mapLink", async () => {
        const docsWithoutMapLink = contactDocs.map((doc) =>
            doc.id === "address" ? { ...doc, mapLink: undefined } : doc,
        );
        const screen = await render(
            <FooterContactDetails {...props} contactDocs={docsWithoutMapLink} />,
        );

        await expect
            .element(screen.getByRole("link", { name: "Open in Google Maps" }))
            .toHaveAttribute(
                "href",
                "https://www.google.com/maps/search/?api=1&query=39.459230762224585,-0.3851381134944049",
            );
    })

    // WCAG AA 2.2 — the footer is the salon's contact card, so the checks that
    // matter here are: every block is reachable by its heading, the one
    // interactive element has an accessible name, and the decorative icons stay
    // out of the accessibility tree.
    describe("accessibility", () => {

        it("labels each contact block with a heading", async () => {
            const screen = await render(<FooterContactDetails {...props} />);

            for (const heading of ["Address", "Hours", "WhatsApp", "Instagram"]) {
                await expect
                    .element(screen.getByRole("heading", { name: heading, level: 3 }))
                    .toBeVisible();
            }
        });

        it("gives the Instagram link an accessible name", async () => {
            const screen = await render(<FooterContactDetails {...props} />);

            const link = screen.getByRole("link", { name: "Instagram" });
            await expect.element(link).toBeVisible();
            // An empty href would leave a focusable link that goes nowhere.
            await expect.element(link).not.toHaveAttribute("href", "");
        });

        it("hides the decorative icons from assistive technology", async () => {
            const screen = await render(<FooterContactDetails {...props} />);

            // Scope to the contact grid — the map renders its own SVGs, which
            // are MapLeaflet's business, not this component's.
            const icons = screen.container.querySelectorAll(
                '[data-testid="contact-details"] svg',
            );
            expect(icons).toHaveLength(4);
            for (const icon of icons) {
                expect(icon).toHaveAttribute("aria-hidden", "true");
            }
        });

        it("keeps the contact text selectable rather than image-only", async () => {
            const screen = await render(<FooterContactDetails {...props} />);

            const details = screen.getByTestId("contact-details");
            await expect.element(details).toHaveTextContent("+34643987849");
            await expect
                .element(details)
                .toHaveTextContent("Calle de Móra de Rubióls 3, Valencia 46007");
        });

    });

});
