import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "vitest-browser-react";
import { MotionProvider } from "../../ui/MotionContext";
import { StopAnimationsButton } from "../../ui/StopAnimationsButton";
import { BubbleCanvas } from "../../ui/BubbleCanvas";
import { TeamCard } from "../../ui/TeamCard";

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
        // Unmount so only the freshly mounted provider is in the DOM (the page
        // locator is document-wide — two live buttons would be ambiguous).
        first.unmount();

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
