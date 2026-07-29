import { describe, it, expect, beforeEach } from "vitest";
import { render } from "vitest-browser-react";
import { FilmSection } from "../../ui/FilmSection";
import { useWhatsAppStore } from "../../store/whatsappStore";

// FilmSection pairs a vertical Instagram-format film frame with a right-side
// card: eyebrow + heading ("Discover Ritual for you"), a marketing line, and a
// WhatsApp CTA ("Contact us"). All copy arrives localised as props.
const PROPS = {
  eyebrow: "a minute inside",
  title: "See the light for yourself",
  description: "A calm hour, filmed. Watch a minute inside the atelier.",
  video: {
    src: "/film/ritual.mp4",
    poster: "/services/massage.webp",
    title: "A minute inside Ritual",
    playLabel: "Play the film",
  },
  card: {
    eyebrow: "come and see us",
    heading: "Discover Ritual for you",
    lead: "One message, and we shape the ritual around your week.",
    cta: "Contact us",
  },
  message: "Hello, I would like to book at Ritual.",
};

// The CTA reads the salon number from the store to build its wa.me link.
beforeEach(() => {
  useWhatsAppStore.getState().setNumber("34600000000");
});

function mount(overrides: Partial<typeof PROPS> = {}) {
  return render(<FilmSection {...PROPS} {...overrides} />);
}

describe("FilmSection layout", () => {
  it("shows the section heading and description", async () => {
    const screen = await mount();
    await expect.element(screen.getByRole("heading", { name: PROPS.title })).toBeVisible();
    await expect.element(screen.getByText(PROPS.description)).toBeVisible();
  });

  it("renders the vertical film frame with the poster (no video until played)", async () => {
    const screen = await mount();
    await expect.element(screen.getByTestId("video-frame")).toBeVisible();
    await expect
      .element(screen.getByTestId("video-frame-poster"))
      .toHaveAttribute("src", PROPS.video.poster);
    expect(screen.container.querySelector("video")).toBeNull();
  });

  it("shows the marketing card heading 'Discover Ritual for you' and lead", async () => {
    const screen = await mount();
    await expect.element(screen.getByRole("heading", { name: PROPS.card.heading })).toBeVisible();
    await expect.element(screen.getByText(PROPS.card.lead)).toBeVisible();
  });

  it("has a WhatsApp CTA labelled 'Contact us' pointing at the salon number", async () => {
    const screen = await mount();
    const cta = screen.getByTestId("whatsapp-button");
    await expect.element(cta).toBeVisible();
    await expect
      .element(cta)
      .toHaveAttribute("href", `https://wa.me/34600000000?text=${encodeURIComponent(PROPS.message)}`);
    await expect.element(screen.getByText(PROPS.card.cta)).toBeVisible();
  });
});
