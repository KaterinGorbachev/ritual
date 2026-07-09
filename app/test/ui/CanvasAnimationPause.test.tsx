import { describe, it, expect, afterEach } from "vitest";
import { render } from "vitest-browser-react";
import { cdp } from "vitest/browser";
import { BubbleCanvas } from "../../ui/BubbleCanvas";

// The real labels come from the locale dictionaries (hero.playWord /
// hero.pauseWord). These sentinels are deliberately not real copy, so the
// tests assert on the toggle's *behaviour* and never break when marketing
// rewords the button.
const PLAY = "PLAY_LABEL";
const PAUSE = "PAUSE_LABEL";

/**
 * BubbleCanvas reads `prefers-reduced-motion` once, inside its mount effect.
 * These tests run in real Chromium, so there is no `matchMedia` to stub —
 * we drive the real media feature over the DevTools Protocol instead, and it
 * must be set *before* render() for the effect to observe it.
 */
async function setReducedMotion(value: "reduce" | "no-preference") {
    await cdp().send("Emulation.setEmulatedMedia", {
        features: [{ name: "prefers-reduced-motion", value }],
    });
}

async function clearEmulatedMedia() {
    await cdp().send("Emulation.setEmulatedMedia", { features: [] });
}

/**
 * The toggle only mounts once the animation has started, which happens after
 * the Monet image resolves (onload or onerror). Every test therefore waits for
 * the button before asserting on it.
 */
describe("BubbleCanvas pause control", () => {
    it("starts playing, so the button offers to pause", async () => {
        const screen = await render(<BubbleCanvas heroPlayWord={PLAY} heroPauseWord={PAUSE} />);

        const toggle = screen.getByTestId("bubble-canvas-toggle");

        await expect.element(toggle).toBeVisible();
        await expect.element(toggle).toHaveTextContent(PAUSE);
        // aria-pressed reflects "is paused" — false while the bubbles drift.
        await expect.element(toggle).toHaveAttribute("aria-pressed", "false");
    });

    it("animation is paused by first click", async () => {
        const screen = await render(<BubbleCanvas heroPlayWord={PLAY} heroPauseWord={PAUSE} />);

        const toggle = screen.getByTestId("bubble-canvas-toggle");
        await expect.element(toggle).toHaveTextContent(PAUSE);

        await toggle.click();

        // Label flips to the action now available, and the pressed state is on.
        await expect.element(toggle).toHaveTextContent(PLAY);
        await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
    });

    it("resumes on the second click", async () => {
        const screen = await render(<BubbleCanvas heroPlayWord={PLAY} heroPauseWord={PAUSE} />);

        const toggle = screen.getByTestId("bubble-canvas-toggle");
        await expect.element(toggle).toHaveTextContent(PAUSE);

        await toggle.click();
        await expect.element(toggle).toHaveTextContent(PLAY);

        await toggle.click();

        await expect.element(toggle).toHaveTextContent(PAUSE);
        await expect.element(toggle).toHaveAttribute("aria-pressed", "false");
    });

    it("keeps the canvas itself click-through", async () => {
        // The canvas is decorative: pointer-events-none, aria-hidden. Only the
        // button is interactive, so screen readers and clicks reach the hero.
        const screen = await render(<BubbleCanvas heroPlayWord={PLAY} heroPauseWord={PAUSE} />);

        const canvas = screen.getByTestId("bubble-canvas");
        await expect.element(canvas).toHaveAttribute("aria-hidden", "true");
    });
});

describe("BubbleCanvas and the tab being hidden", () => {
    // The overrides below shadow real getters on `document`; drop them after
    // each test so the rest of the file sees a genuinely visible page.
    afterEach(restoreVisibility);

    it("does not flip the button when the tab is hidden and shown again", async () => {
        // Hiding the tab pauses the loop to save battery, but that is not the
        // user pausing — the control must still offer to pause when they return.
        const screen = await render(<BubbleCanvas heroPlayWord={PLAY} heroPauseWord={PAUSE} />);

        const toggle = screen.getByTestId("bubble-canvas-toggle");
        await expect.element(toggle).toHaveTextContent(PAUSE);

        hideTab();
        showTab();

        await expect.element(toggle).toHaveTextContent(PAUSE);
        await expect.element(toggle).toHaveAttribute("aria-pressed", "false");
    });

    it("stays paused across a hide/show cycle if the user paused first", async () => {
        const screen = await render(<BubbleCanvas heroPlayWord={PLAY} heroPauseWord={PAUSE} />);

        const toggle = screen.getByTestId("bubble-canvas-toggle");
        await toggle.click();
        await expect.element(toggle).toHaveTextContent(PLAY);

        hideTab();
        showTab();

        // wasRunning was false, so becoming visible must not restart the loop.
        await expect.element(toggle).toHaveTextContent(PLAY);
        await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
    });
});

describe("BubbleCanvas and prefers-reduced-motion", () => {
    // Emulation is process-wide, so it must be undone even if a test fails.
    afterEach(clearEmulatedMedia);

    it("starts paused, so the button offers to play", async () => {
        // Set before render(): the effect reads matchMedia once, on mount.
        await setReducedMotion("reduce");

        const screen = await render(<BubbleCanvas heroPlayWord={PLAY} heroPauseWord={PAUSE} />);

        const toggle = screen.getByTestId("bubble-canvas-toggle");
        await expect.element(toggle).toBeVisible();
        await expect.element(toggle).toHaveTextContent(PLAY);
        await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
    });

    it("still lets the user opt in to the animation", async () => {
        await setReducedMotion("reduce");

        const screen = await render(<BubbleCanvas heroPlayWord={PLAY} heroPauseWord={PAUSE} />);

        const toggle = screen.getByTestId("bubble-canvas-toggle");
        await expect.element(toggle).toHaveTextContent(PLAY);

        await toggle.click();

        await expect.element(toggle).toHaveTextContent(PAUSE);
        await expect.element(toggle).toHaveAttribute("aria-pressed", "false");
    });
});

/**
 * `document.hidden` and `document.visibilityState` are read-only accessors on
 * Document.prototype and cannot be driven from inside the page. We shadow them
 * with own properties on `document`, then fire the event the component listens
 * for. `restoreVisibility` deletes the shadows so the prototype getters show
 * through again.
 */
function setVisibility(state: "visible" | "hidden") {
    Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => state,
    });
    Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => state === "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
}

function restoreVisibility() {
    // @ts-expect-error deleting the shadowing own-property, not the prototype one
    delete document.visibilityState;
    // @ts-expect-error same
    delete document.hidden;
}

const hideTab = () => setVisibility("hidden");
const showTab = () => setVisibility("visible");
