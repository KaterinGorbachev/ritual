import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, cleanup } from "vitest-browser-react";
import { cdp } from "vitest/browser";
import { BubbleCanvas } from "../../ui/BubbleCanvas";
import { MotionProvider } from "../../ui/MotionContext";
import { StopAnimationsButton } from "../../ui/StopAnimationsButton";

// The hero canvas no longer has its own pause button — the single global
// "stop animations" control drives it. These tests exercise that wiring: the
// canvas has no toggle of its own, obeys the global flag, and stays decorative.

// Sentinel labels — behaviour, not marketing copy.
const STOP = "STOP_LABEL";
const RESUME = "RESUME_LABEL";

// The motion flag lives on <html> + localStorage, shared across tests.
function reset() {
    localStorage.clear();
    document.documentElement.classList.remove("motion-off");
}
beforeEach(reset);
afterEach(async () => {
    await cleanup();
    reset();
});

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

function renderHero() {
    return render(
        <MotionProvider>
            <BubbleCanvas />
            <StopAnimationsButton stopWord={STOP} resumeWord={RESUME} />
        </MotionProvider>
    );
}

describe("Hero canvas and the global stop control", () => {
    it("has no pause button of its own — only the global control", async () => {
        const screen = await renderHero();

        await expect.element(screen.getByTestId("stop-animations-toggle")).toBeVisible();
        expect(
            screen.container.querySelector('[data-testid="bubble-canvas-toggle"]')
        ).toBeNull();
    });

    it("stops and resumes the canvas via the global flag", async () => {
        const screen = await renderHero();

        const toggle = screen.getByTestId("stop-animations-toggle");
        expect(document.documentElement.classList.contains("motion-off")).toBe(false);

        await toggle.click();
        await expect.element(toggle).toHaveAttribute("aria-label", RESUME);
        expect(document.documentElement.classList.contains("motion-off")).toBe(true);

        await toggle.click();
        await expect.element(toggle).toHaveAttribute("aria-label", STOP);
        expect(document.documentElement.classList.contains("motion-off")).toBe(false);
    });

    it("keeps the canvas decorative and click-through", async () => {
        // The canvas is decorative: pointer-events-none, aria-hidden. Only the
        // button is interactive, so screen readers and clicks reach the hero.
        const screen = await renderHero();

        const canvas = screen.getByTestId("bubble-canvas");
        await expect.element(canvas).toHaveAttribute("aria-hidden", "true");

        await screen.getByTestId("stop-animations-toggle").click();
        await expect.element(canvas).toHaveAttribute("aria-hidden", "true");
    });
});

describe("Hero canvas and the tab being hidden", () => {
    // The overrides below shadow real getters on `document`; drop them after
    // each test so the rest of the file sees a genuinely visible page.
    afterEach(restoreVisibility);

    it("stays visible and decorative across a hide/show cycle", async () => {
        // Hiding the tab pauses the loop to save battery; showing it resumes.
        // Nothing user-visible should change — the canvas is decorative either way.
        const screen = await renderHero();

        const canvas = screen.getByTestId("bubble-canvas");
        await expect.element(canvas).toHaveAttribute("aria-hidden", "true");

        hideTab();
        showTab();

        await expect.element(canvas).toHaveAttribute("aria-hidden", "true");
        // The global control is untouched by tab visibility.
        await expect.element(screen.getByTestId("stop-animations-toggle")).toHaveAttribute("aria-label", STOP);
    });

    it("does not resume against a global stop when the tab returns", async () => {
        const screen = await renderHero();

        await screen.getByTestId("stop-animations-toggle").click();
        expect(document.documentElement.classList.contains("motion-off")).toBe(true);

        hideTab();
        showTab();

        // Coming back must not undo the user's explicit stop.
        expect(document.documentElement.classList.contains("motion-off")).toBe(true);
        await expect
            .element(screen.getByTestId("stop-animations-toggle"))
            .toHaveAttribute("aria-label", RESUME);
    });
});

describe("Hero canvas and prefers-reduced-motion", () => {
    // Emulation is process-wide, so it must be undone even if a test fails.
    afterEach(clearEmulatedMedia);

    it("mounts and stays decorative under reduced motion", async () => {
        // Set before render(): the effect reads matchMedia once, on mount. With
        // reduced motion the canvas holds a still frame instead of animating,
        // but it must still mount and remain decorative.
        await setReducedMotion("reduce");

        const screen = await renderHero();

        const canvas = screen.getByTestId("bubble-canvas");
        await expect.element(canvas).toHaveAttribute("aria-hidden", "true");
        // The global control is independent of the reduced-motion preference.
        await expect
            .element(screen.getByTestId("stop-animations-toggle"))
            .toHaveAttribute("aria-label", STOP);
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
