import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import type { ComponentProps } from "react";
import { ServiceCard } from "../../ui/ServiceCard";


const IMAGE = "/presoterapy.jpg";
const TITLE = "Neuro-acoustic resonance";
const DESCRIPTION = "Low-frequency sound matched to your breath.";

// The card renders an <li>, so it needs a list parent to be valid markup and
// to be found by the "listitem" role.
function mount(overrides: Partial<ComponentProps<typeof ServiceCard>> = {}) {
    return render(
        <ul>
            <ServiceCard title={TITLE} description={DESCRIPTION} image={IMAGE} {...overrides} />
        </ul>,
    );
}

describe("ServiceCard", () => {
    it("shows the title", async () => {
        const screen = await render(
            <ul>
                <ServiceCard  title={TITLE} description={DESCRIPTION} image={IMAGE} />
            </ul>
        );

        await expect.element(screen.getByRole("heading", { name: TITLE })).toBeVisible();
    });

    it("shows the description", async () => {
        const screen = await render(
            <ul>
                <ServiceCard  title={TITLE} description={DESCRIPTION} image={IMAGE} />
            </ul>
        );

        await expect.element(screen.getByText(DESCRIPTION)).toBeVisible();
    });

    
    

    it("is a list item, so a list of cards is announced as a list", async () => {
        const screen = await render(
            <ul>
                <ServiceCard  title={TITLE} description={DESCRIPTION} image={IMAGE} />
            </ul>
        );

        await expect.element(screen.getByRole("listitem")).toBeInTheDocument();
    });

    it("merges a caller's className onto the card", async () => {
        const screen = await render(
            <ul>
                <ServiceCard
                    
                    title={TITLE}
                    description={DESCRIPTION}
                    image={IMAGE}
                    className="col-span-2"
                />
            </ul>
        );

        await expect.element(screen.getByTestId("service-card")).toHaveClass("col-span-2");
    });

    it("keeps its own layout classes when a caller adds one", async () => {
        const screen = await mount({ className: "col-span-2" });

        // className is appended, not substituted — the card must not lose its
        // own styling because the caller positioned it in a grid.
        const card = screen.getByTestId("service-card");
        await expect.element(card).toHaveClass("col-span-2");
        await expect.element(card).toHaveClass("rounded-card");
    });

    it("renders the image from the given path", async () => {
        const screen = await mount();

        const image = screen.getByRole("img", { name: TITLE });
        await expect.element(image).toBeVisible();
        // A plain <img>, not next/image — src is passed through untouched.
        await expect.element(image).toHaveAttribute("src", IMAGE);
    });

    it("names the image after the service, so it isn't announced bare", async () => {
        const screen = await mount();

        await expect.element(screen.getByRole("img", { name: TITLE })).toHaveAttribute("alt", TITLE);
    });

    it("titles the card at h3, below the section heading it sits under", async () => {
        const screen = await mount();

        await expect
            .element(screen.getByRole("heading", { name: TITLE, level: 3 }))
            .toBeVisible();
    });

    it("renders the content the caller passes, not the previous card's", async () => {
        const OTHER = "Lymphatic drainage";
        const screen = await mount({ title: OTHER, image: "/lymph.jpg" });

        await expect.element(screen.getByRole("heading", { name: OTHER })).toBeVisible();
        await expect.element(screen.getByRole("img", { name: OTHER })).toHaveAttribute("src", "/lymph.jpg");
    });
});

