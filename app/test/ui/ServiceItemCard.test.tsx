import { describe, it, expect, beforeEach } from "vitest";
import { render } from "vitest-browser-react";
import { ServiceItemCard } from "../../ui/ServiceItemCard";
import { WhatsAppButton } from "../../ui/WhatsAppButton";
import { useWhatsAppStore } from "../../store/whatsappStore";

// A category-specific decorative glyph, supplied by the parent (mirrors the
// existing ServiceCard's icon prop pattern).
const icon = (
  <svg data-testid="icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8" />
  </svg>
);

const PROPS = {
  icon,
  name: "Lifting facial massage",
  description: "A face, neck and scalp massage that relaxes muscles.",
  duration: "60 min",
  from: "from",
  price: "€65",
  durationLabel: "Duration",
};

const BOOK_LABEL = "Book on WhatsApp";
const BOOK_MESSAGE = "Hello";

// The <WhatsAppButton> the parent passes in reads the salon number from the
// store to build the wa.me link. Seed a known number so hrefs are stable.
beforeEach(() => {
  useWhatsAppStore.getState().setNumber("34600000000");
});

function mount(overrides: Partial<typeof PROPS> = {}) {
  const props = { ...PROPS, ...overrides };
  return render(
    <ul>
      <ServiceItemCard {...props}>
        <WhatsAppButton message={BOOK_MESSAGE} ariaLabel={`${BOOK_LABEL}: ${props.name}`}>
          <span>{BOOK_LABEL}</span>
        </WhatsAppButton>
      </ServiceItemCard>
    </ul>,
  );
}

describe("ServiceItemCard content", () => {
  it("shows the service name as a heading", async () => {
    const screen = await mount();
    await expect.element(screen.getByRole("heading", { name: PROPS.name })).toBeVisible();
  });

  it("shows the description", async () => {
    const screen = await mount();
    await expect.element(screen.getByText(PROPS.description)).toBeVisible();
  });

  it("shows the duration and price", async () => {
    const screen = await mount();
    await expect.element(screen.getByText(PROPS.duration)).toBeVisible();
    await expect.element(screen.getByText(PROPS.price)).toBeVisible();
  });

  it("prefixes the duration with a screen-reader-only label", async () => {
    const screen = await mount();
    // The visible duration is preceded by an sr-only "Duration:" so the number
    // isn't announced bare.
    await expect.element(screen.getByText(`${PROPS.durationLabel}:`)).toBeInTheDocument();
  });

  
  it("is a list item, so a grid of cards is announced as a list", async () => {
    const screen = await mount();
    await expect.element(screen.getByRole("listitem")).toBeInTheDocument();
  });
});

describe("ServiceItemCard booking link", () => {
  it("builds a wa.me href from the seeded number and the booking message", async () => {
    const screen = await mount();
    await expect
      .element(screen.getByTestId("whatsapp-button"))
      .toHaveAttribute("href", `https://wa.me/34600000000?text=${encodeURIComponent(BOOK_MESSAGE)}`);
  });

  it("opens WhatsApp in a new, safely-rel'd tab", async () => {
    const screen = await mount();
    const link = screen.getByTestId("whatsapp-button");
    await expect.element(link).toHaveAttribute("target", "_blank");
    await expect.element(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("gives the Book link an accessible name naming the service", async () => {
    const screen = await mount();
    // Icon + short label alone would read the same on every card; the
    // aria-label disambiguates which service is being booked.
    await expect
      .element(screen.getByTestId("whatsapp-button"))
      .toHaveAttribute("aria-label", `${BOOK_LABEL}: ${PROPS.name}`);
  });

  it("still renders a usable link when the number is missing", async () => {
    // Empty store → href like https://wa.me/?text=... The button must remain
    // present and labelled rather than disappear.
    useWhatsAppStore.getState().setNumber("");
    const screen = await mount();
    await expect
      .element(screen.getByTestId("whatsapp-button"))
      .toHaveAttribute("href", `https://wa.me/?text=${encodeURIComponent(BOOK_MESSAGE)}`);
  });
});
