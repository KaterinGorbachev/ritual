import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { ServiceCard } from "../../ui/ServiceCard";

const icon = (
    <svg data-testid="icon-svg" width="34" height="34" viewBox="0 0 32 32" fill="none">
        <path d="M2 16c4 0 4-8 8-8s4 16 8 16 4-8 4-8" />
    </svg>
);

const IMAGE = "/presoterapy.jpg";
const TITLE = "Neuro-acoustic resonance";
const DESCRIPTION = "Low-frequency sound matched to your breath.";

describe("ServiceCard", () => {
    it("shows the title", async () => {
        const screen = await render(
            <ul>
                <ServiceCard icon={icon} title={TITLE} description={DESCRIPTION} image={IMAGE} />
            </ul>
        );

        await expect.element(screen.getByRole("heading", { name: TITLE })).toBeVisible();
    });

    it("shows the description", async () => {
        const screen = await render(
            <ul>
                <ServiceCard icon={icon} title={TITLE} description={DESCRIPTION} image={IMAGE} />
            </ul>
        );

        await expect.element(screen.getByText(DESCRIPTION)).toBeVisible();
    });

    it("renders the icon passed by the parent", async () => {
        const screen = await render(
            <ul>
                <ServiceCard icon={icon} title={TITLE} description={DESCRIPTION} image={IMAGE} />
            </ul>
        );

        await expect.element(screen.getByTestId("icon-svg")).toBeInTheDocument();
    });

    it("hides the decorative icon from screen readers", async () => {
        const screen = await render(
            <ul>
                <ServiceCard icon={icon} title={TITLE} description={DESCRIPTION} image={IMAGE} />
            </ul>
        );

        await expect
            .element(screen.getByTestId("service-card-icon"))
            .toHaveAttribute("aria-hidden", "true");
    });

    it("is a list item, so a list of cards is announced as a list", async () => {
        const screen = await render(
            <ul>
                <ServiceCard icon={icon} title={TITLE} description={DESCRIPTION} image={IMAGE} />
            </ul>
        );

        await expect.element(screen.getByRole("listitem")).toBeInTheDocument();
    });

    it("merges a caller's className onto the card", async () => {
        const screen = await render(
            <ul>
                <ServiceCard
                    icon={icon}
                    title={TITLE}
                    description={DESCRIPTION}
                    image={IMAGE}
                    className="col-span-2"
                />
            </ul>
        );

        await expect.element(screen.getByTestId("service-card")).toHaveClass("col-span-2");
    });
});

describe("ServiceCard click-to-reveal", () => {
    const card = (
        <ul>
            <ServiceCard icon={icon} title={TITLE} description={DESCRIPTION} image={IMAGE} />
        </ul>
    );

    it("starts on the copy side, not the photo", async () => {
        const screen = await render(card);

        await expect.element(screen.getByRole("heading", { name: TITLE })).toBeVisible();
        await expect
            .element(screen.getByTestId("service-card-toggle"))
            .toHaveAttribute("aria-pressed", "false");
    });

    it("shows the photo and hides the copy on first click", async () => {
        const screen = await render(card);

        await screen.getByTestId("service-card-toggle").click();

        await expect
            .element(screen.getByTestId("service-card-toggle"))
            .toHaveAttribute("aria-pressed", "true");

        // The photo is decorative (aria-hidden), so it has no role to query by:
        // the button already announces the service name.
        const img = screen.container.querySelector("img");
        expect(img).not.toBeNull();
        expect(img).toHaveAttribute("aria-hidden", "true");
        expect(screen.container.querySelector("h3")).toBeNull();
    });

    it("returns to the copy on a second click", async () => {
        const screen = await render(card);
        const toggle = screen.getByTestId("service-card-toggle");

        await toggle.click();
        await toggle.click();

        await expect.element(screen.getByRole("heading", { name: TITLE })).toBeVisible();
        await expect.element(toggle).toHaveAttribute("aria-pressed", "false");
    });

    it("is reachable and operable by keyboard", async () => {
        const screen = await render(card);
        const toggle = screen.getByTestId("service-card-toggle");

        // A real <button>, so it is focusable and Enter activates it.
        (toggle.element() as HTMLButtonElement).focus();
        expect(document.activeElement).toBe(toggle.element());

        await toggle.click();
        await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
    });

    it("names the toggle for screen readers in both states", async () => {
        const screen = await render(card);
        const toggle = screen.getByTestId("service-card-toggle");

        await expect.element(toggle).toHaveAttribute("aria-label", `Show photo of ${TITLE}`);
        await toggle.click();
        await expect.element(toggle).toHaveAttribute("aria-label", `Hide photo of ${TITLE}`);
    });
});

describe("ServiceCard face swaps in place", () => {
    // These assert DOM structure, not geometry: no stylesheet is loaded into
    // the browser tests, so Tailwind classes are inert here and any measured
    // rect would be meaningless.
    const card = (
        <ul>
            <ServiceCard icon={icon} title={TITLE} description={DESCRIPTION} image={IMAGE} />
        </ul>
    );

    it("renders the photo into the same slot the copy occupied", async () => {
        const screen = await render(card);
        const face = () => screen.container.querySelector('[data-testid="service-card-face"]')!;

        expect(face().querySelector("h3")).not.toBeNull();
        expect(face().querySelector("img")).toBeNull();

        await screen.getByTestId("service-card-toggle").click();

        expect(face().querySelector("img")).not.toBeNull();
        expect(face().querySelector("h3")).toBeNull();
    });

    it("keeps the button as the sole, unchanging container of that slot", async () => {
        const screen = await render(card);
        const toggle = screen.getByTestId("service-card-toggle");

        const parentBefore = screen.container
            .querySelector('[data-testid="service-card-face"]')!
            .parentElement!.getAttribute("data-testid");

        await toggle.click();

        const parentAfter = screen.container
            .querySelector('[data-testid="service-card-face"]')!
            .parentElement!.getAttribute("data-testid");

        expect(parentBefore).toBe("service-card-toggle");
        expect(parentAfter).toBe("service-card-toggle");
        // exactly one face, in both states
        expect(screen.container.querySelectorAll('[data-testid="service-card-face"]')).toHaveLength(1);
    });
});
