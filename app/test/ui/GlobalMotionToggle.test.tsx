import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "vitest-browser-react";
// The marquee half of this suite asserts on *computed* style — that
// `.motion-off` really stops the CSS animation and opens the scroll container.
// Those rules live in globals.css, so without this import the assertions would
// pass against an unstyled DOM and prove nothing.
import "../../globals.css";
import { MotionProvider } from "../../ui/MotionContext";
import { StopAnimationsButton } from "../../ui/StopAnimationsButton";
import { BubbleCanvas } from "../../ui/BubbleCanvas";
import { TeamCard } from "../../ui/TeamCard";
import { BrandMarquee } from "../../ui/BrandMarquee";

// Sentinel labels — deliberately not the real dictionary copy, so the tests
// assert on the button's *behaviour* and never break when marketing rewords it.
const STOP = "STOP_LABEL";
const RESUME = "RESUME_LABEL";

// The `motion-off` class lives on <html> and the flag is persisted to
// localStorage; both are shared across tests in one browser context. The
// browser project has no auto-cleanup, so also unmount prior renders — else
// their leftover buttons make the page-wide `getByTestId` ambiguous.
function reset() {
    localStorage.clear();
    document.documentElement.classList.remove("motion-off");
}
beforeEach(reset);
afterEach(async () => {

    await cleanup();
    reset();
});

describe("Global stop-animations button", () => {
    it("starts offering to stop, then toggles label and aria-pressed", async () => {
        const screen = await render(
            <MotionProvider>
                <StopAnimationsButton stopWord={STOP} resumeWord={RESUME} />
            </MotionProvider>
        );

        const toggle = screen.getByTestId("stop-animations-toggle");
        await expect.element(toggle).toBeVisible();
        // The button is icon-only; its accessible name comes from aria-label.
        // aria-pressed reflects "is off" — false while animations still run.
        await expect.element(toggle).toHaveAttribute("aria-label", STOP);
        await expect.element(toggle).toHaveAttribute("aria-pressed", "false");

        await toggle.click();
        await expect.element(toggle).toHaveAttribute("aria-label", RESUME);
        await expect.element(toggle).toHaveAttribute("aria-pressed", "true");

        await toggle.click();
        await expect.element(toggle).toHaveAttribute("aria-label", STOP);
        await expect.element(toggle).toHaveAttribute("aria-pressed", "false");
    });

    it("adds the motion-off class to the document root only while off", async () => {
        const screen = await render(
            <MotionProvider>
                <StopAnimationsButton stopWord={STOP} resumeWord={RESUME} />
            </MotionProvider>
        );

        const toggle = screen.getByTestId("stop-animations-toggle");
        expect(document.documentElement.classList.contains("motion-off")).toBe(false);

        await toggle.click();
        await expect.element(toggle).toHaveAttribute("aria-label", RESUME);
        expect(document.documentElement.classList.contains("motion-off")).toBe(true);

        await toggle.click();
        await expect.element(toggle).toHaveAttribute("aria-label", STOP);
        expect(document.documentElement.classList.contains("motion-off")).toBe(false);
    });

    it("persists the choice across a remount via localStorage", async () => {
        const first = await render(
            <MotionProvider>
                <StopAnimationsButton stopWord={STOP} resumeWord={RESUME} />
            </MotionProvider>
        );
        await first.getByTestId("stop-animations-toggle").click();
        await expect
            .element(first.getByTestId("stop-animations-toggle"))
            .toHaveAttribute("aria-label", RESUME);
        // Tear down so only the freshly mounted provider is in the DOM (the page
        // locator is document-wide — two live buttons would be ambiguous).
        // `cleanup()`, not `first.unmount()`: unmounting a single render leaves
        // vitest-browser-react's container bookkeeping in a state that makes the
        // afterEach `cleanup()` drop the mount point, and every later render in
        // the file then resolves to an empty body.
        await cleanup();

        // A freshly mounted provider must read the stored "off" and show Resume.
        const second = await render(
            <MotionProvider>
                <StopAnimationsButton stopWord={STOP} resumeWord={RESUME} />
            </MotionProvider>
        );
        await expect
            .element(second.getByTestId("stop-animations-toggle"))
            .toHaveAttribute("aria-label", RESUME);
    });
});

describe("Global button and the hero canvas", () => {
    it("is the only animation control — the hero canvas has no toggle of its own", async () => {
        const screen = await render(
            <MotionProvider>
                <BubbleCanvas />
                <StopAnimationsButton stopWord={STOP} resumeWord={RESUME} />
            </MotionProvider>
        );

        // The single global button exists; the old per-hero toggle does not.
        await expect.element(screen.getByTestId("stop-animations-toggle")).toBeVisible();
        expect(
            screen.container.querySelector('[data-testid="bubble-canvas-toggle"]')
        ).toBeNull();
    });

    it("keeps the canvas decorative and click-through when stopping animations", async () => {
        // The button is rendered first and static, and the decorative canvas is
        // confined to a small relative box, so the full-bleed `absolute inset-0`
        // canvas can't paint over the control and trip Playwright's actionability
        // hit-test. On the real page the canvas lives inside the hero, not over
        // the control.
        const screen = await render(
            <MotionProvider>
                <StopAnimationsButton
                    stopWord={STOP}
                    resumeWord={RESUME}
                    style={{ position: "static" }}
                />
                <div style={{ position: "relative", width: 80, height: 60 }}>
                    <BubbleCanvas />
                </div>
            </MotionProvider>
        );

        const canvas = screen.getByTestId("bubble-canvas");
        await expect.element(canvas).toHaveAttribute("aria-hidden", "true");

        const toggle = screen.getByTestId("stop-animations-toggle");
        await toggle.click();
        await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
        expect(document.documentElement.classList.contains("motion-off")).toBe(true);
        // Still decorative after the flag flips — only the button is interactive.
        await expect.element(canvas).toHaveAttribute("aria-hidden", "true");
    });
});

describe("Stopping animations reveals hidden content", () => {
    it("shows a team card that has not scrolled into view", async () => {
        // position:static so the large team card can't cover the otherwise
        // sticky control in this flat test layout (see the canvas test above).
        const screen = await render(
            <MotionProvider>
                <StopAnimationsButton
                    stopWord={STOP}
                    resumeWord={RESUME}
                    style={{ position: "static" }}
                />
                <ul>
                    <TeamCard
                        name="Ada"
                        profession="Therapist"
                        description="Deep tissue."
                        image="/mone.jpg"
                        className="team-card--from-left"
                    />
                </ul>
            </MotionProvider>
        );

        const toggle = screen.getByTestId("stop-animations-toggle");
        await toggle.click();
        await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
        expect(document.documentElement.classList.contains("motion-off")).toBe(true);

        const card = screen.getByTestId("team-card");
        await expect.element(card).toBeVisible();
        // The reveal guarantee: forced visible, not merely animation-stopped.
        const el = screen.container.querySelector<HTMLElement>('[data-testid="team-card"]')!;
        expect(getComputedStyle(el).opacity).toBe("1");
    });
});

// The brands the marquee renders. Two items keep the repeated track small
// while still exercising the real duplication logic.
const CREAMS = [
    { id: 1, name: "Cream One" },
    { id: 2, name: "Cream Two" },
];

/** The marquee's scroll container and its animated track, as live elements.
 *  Locators are re-queried through the container because these assertions read
 *  computed style, which the locator API doesn't expose. */
function marqueeParts(container: HTMLElement) {
    const box = container.querySelector<HTMLElement>("[data-marquee]")!;
    const track = box.querySelector<HTMLElement>("ul")!;
    return { box, track };
}

describe("Stopping cream gallery horizontal carusel animation", () => {
    it("stops the carousel animation and opens horizontal scrolling", async () => {
        // position:static so the wide marquee can't cover the otherwise sticky
        // control in this flat test layout (see the canvas test above).
        const screen = await render(
            <MotionProvider>
                <StopAnimationsButton
                    stopWord={STOP}
                    resumeWord={RESUME}
                    style={{ position: "static" }}
                />
                <BrandMarquee items={CREAMS} />
            </MotionProvider>
        );

        const { box, track } = marqueeParts(screen.container);

        // While motion runs the track scrolls itself, so the gallery is clipped
        // rather than scrollable — the animation *is* the way you see the rest.
        expect(getComputedStyle(track).animationName).toBe("brand-marquee");
        expect(getComputedStyle(box).overflowX).toBe("hidden");

        const toggle = screen.getByTestId("stop-animations-toggle");
        await toggle.click();
        await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
        expect(document.documentElement.classList.contains("motion-off")).toBe(true);

        // The guarantee: no animation left, and the cards stay reachable by hand.
        // Losing the animation without gaining the scrollbar would hide every
        // card past the fold.
        expect(getComputedStyle(track).animationName).toBe("none");
        expect(getComputedStyle(box).overflowX).toBe("auto");
    });

    it("keeps every real cream card in the DOM once stopped", async () => {
        const screen = await render(
            <MotionProvider>
                <StopAnimationsButton
                    stopWord={STOP}
                    resumeWord={RESUME}
                    style={{ position: "static" }}
                />
                <BrandMarquee items={CREAMS} />
            </MotionProvider>
        );

        const toggle = screen.getByTestId("stop-animations-toggle");
        await toggle.click();
        await expect.element(toggle).toHaveAttribute("aria-pressed", "true");

        // Stopping the marquee must not drop cards. Only the first pass through
        // the real list is announced; the duplicated copies are aria-hidden, so
        // exactly one non-hidden card per brand must remain for assistive tech.
        const { box } = marqueeParts(screen.container);
        const announced = box.querySelectorAll("li:not([aria-hidden='true'])");
        expect(announced.length).toBe(CREAMS.length);
        expect([...announced].map((li) => li.querySelector("h3")?.textContent)).toEqual(
            CREAMS.map((c) => c.name)
        );
    });
});

describe("Resuming animations after they were stopped", () => {
    it("restores the carousel animation and re-clips the gallery on a second click", async () => {
        const screen = await render(
            <MotionProvider>
                <StopAnimationsButton
                    stopWord={STOP}
                    resumeWord={RESUME}
                    style={{ position: "static" }}
                />
                <BrandMarquee items={CREAMS} />
            </MotionProvider>
        );

        const { box, track } = marqueeParts(screen.container);
        const toggle = screen.getByTestId("stop-animations-toggle");

        await toggle.click();
        await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
        expect(getComputedStyle(track).animationName).toBe("none");

        // Clicking again must genuinely put the motion back, not just relabel
        // the button — the CSS has to return to its animated state.
        await toggle.click();
        await expect.element(toggle).toHaveAttribute("aria-pressed", "false");
        await expect.element(toggle).toHaveAttribute("aria-label", STOP);
        expect(document.documentElement.classList.contains("motion-off")).toBe(false);
        expect(getComputedStyle(track).animationName).toBe("brand-marquee");
        expect(getComputedStyle(box).overflowX).toBe("hidden");
    });

    it("survives repeated stop/resume cycles without sticking", async () => {
        const screen = await render(
            <MotionProvider>
                <StopAnimationsButton
                    stopWord={STOP}
                    resumeWord={RESUME}
                    style={{ position: "static" }}
                />
                <BrandMarquee items={CREAMS} />
            </MotionProvider>
        );

        const { track } = marqueeParts(screen.container);
        const toggle = screen.getByTestId("stop-animations-toggle");

        // Two full round trips: a flag that latched after the first resume — or
        // a stale localStorage write — would show up on the second pass.
        for (let i = 0; i < 2; i++) {
            await toggle.click();
            await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
            expect(getComputedStyle(track).animationName).toBe("none");
            expect(localStorage.getItem("ritual:motion-off")).toBe("1");

            await toggle.click();
            await expect.element(toggle).toHaveAttribute("aria-pressed", "false");
            expect(getComputedStyle(track).animationName).toBe("brand-marquee");
            expect(localStorage.getItem("ritual:motion-off")).toBe("0");
        }
    });

    it("releases the forced team-card visibility on resume, not just the marquee", async () => {
        const screen = await render(
            <MotionProvider>
                <StopAnimationsButton
                    stopWord={STOP}
                    resumeWord={RESUME}
                    style={{ position: "static" }}
                />
                <ul>
                    <TeamCard
                        name="Ada"
                        profession="Therapist"
                        description="Deep tissue."
                        image="/mone.jpg"
                        className="team-card--from-left"
                    />
                </ul>
            </MotionProvider>
        );

        const toggle = screen.getByTestId("stop-animations-toggle");
        const card = screen.container.querySelector<HTMLElement>('[data-testid="team-card"]')!;

        await toggle.click();
        await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
        // Forced visible while stopped — the reveal can never run, so the card
        // must not be left behind at opacity 0.
        expect(getComputedStyle(card).opacity).toBe("1");

        await toggle.click();
        await expect.element(toggle).toHaveAttribute("aria-pressed", "false");
        expect(document.documentElement.classList.contains("motion-off")).toBe(false);

        // Resuming releases the override and hands the card back to its reveal
        // animation, which the observer has already armed with `--in-view`.
        // That the animation is running again is the proof the stop-state was a
        // temporary override, not a permanent style change.
        expect(card.classList.contains("team-card--in-view")).toBe(true);
        expect(getComputedStyle(card).animationName).toBe("team-slide-in-left");

        // The reveal restarts from its first keyframe, so the card is briefly
        // transparent again — it must still finish fully visible rather than
        // stranding the card mid-fade.
        await expect
            .poll(() => getComputedStyle(card).opacity, { timeout: 3000 })
            .toBe("1");
    });
});
