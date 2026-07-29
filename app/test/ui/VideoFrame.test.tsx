import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { VideoFrame } from "../../ui/VideoFrame";

// A vertical, Instagram-format (9:16) film frame that never autoplays: it shows
// a lightweight poster with a play button, and only mounts the real <video>
// (with native controls) once the user presses play. All copy arrives as props
// so it stays translatable.
const PROPS = {
  src: "/film/ritual.mp4",
  poster: "/services/massage.webp",
  playLabel: "Play the film",
  title: "A minute inside Ritual",
};

function mount(overrides: Partial<typeof PROPS> = {}) {
  return render(<VideoFrame {...PROPS} {...overrides} />);
}

describe("VideoFrame before play (poster state)", () => {
  it("shows the poster image with the film title as its alt text", async () => {
    const screen = await mount();
    const poster = screen.getByTestId("video-frame-poster");
    await expect.element(poster).toBeVisible();
    await expect.element(poster).toHaveAttribute("src", PROPS.poster);
    await expect.element(poster).toHaveAttribute("alt", PROPS.title);
  });

  it("does NOT render a <video> element before the user presses play (no autoplay, nothing downloads)", async () => {
    const screen = await mount();
    await expect.element(screen.getByTestId("video-frame-poster")).toBeVisible();
    expect(screen.container.querySelector("video")).toBeNull();
  });

  it("offers an accessible play button naming the action", async () => {
    const screen = await mount();
    const play = screen.getByRole("button", { name: PROPS.playLabel });
    await expect.element(play).toBeVisible();
  });

  it("meets the 44px minimum touch target on the play button", async () => {
    const screen = await mount();
    const play = screen.getByTestId("video-frame-play");
    // min-h-11 min-w-11 == 44px in Tailwind.
    await expect.element(play).toHaveClass(/min-h-11/);
    await expect.element(play).toHaveClass(/min-w-11/);
  });

  it("hides the decorative play glyph from assistive tech", async () => {
    const screen = await mount();
    await expect
      .element(screen.getByTestId("video-frame-play-icon"))
      .toHaveAttribute("aria-hidden", "true");
  });
});

describe("VideoFrame is a vertical Instagram-format frame", () => {
  it("constrains the frame to the 9:16 portrait aspect ratio", async () => {
    const screen = await mount();
    await expect.element(screen.getByTestId("video-frame")).toHaveClass(/aspect-\[9\/16\]/);
  });
});

describe("VideoFrame after play (click to play)", () => {
  it("mounts a <video> with native controls once play is pressed", async () => {
    const screen = await mount();
    await screen.getByTestId("video-frame-play").click();

    const video = screen.container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video!.hasAttribute("controls")).toBe(true);
  });

  it("uses performance-first loading: no autoplay, preload none, and plays inline on mobile", async () => {
    const screen = await mount();
    await screen.getByTestId("video-frame-play").click();

    const video = screen.container.querySelector("video")!;
    // No autoplay attribute at all — playback is user-initiated.
    expect(video.hasAttribute("autoplay")).toBe(false);
    // preload="none" so nothing is fetched until the user asks for it.
    expect(video.getAttribute("preload")).toBe("none");
    // playsInline keeps it in the frame on iOS instead of going fullscreen.
    expect(video.hasAttribute("playsinline")).toBe(true);
  });

  it("keeps the poster on the <video> so the first frame paints instantly", async () => {
    const screen = await mount();
    await screen.getByTestId("video-frame-play").click();

    const video = screen.container.querySelector("video")!;
    expect(video.getAttribute("poster")).toBe(PROPS.poster);
  });

  it("points the <video> at the provided source", async () => {
    const screen = await mount();
    await screen.getByTestId("video-frame-play").click();

    const source = screen.container.querySelector("video source");
    expect(source?.getAttribute("src")).toBe(PROPS.src);
  });

  it("removes the poster overlay button once the video is showing", async () => {
    const screen = await mount();
    await screen.getByTestId("video-frame-play").click();
    // The play overlay button is gone; the native <video> controls take over.
    expect(screen.container.querySelector('[data-testid="video-frame-play"]')).toBeNull();
  });
});
