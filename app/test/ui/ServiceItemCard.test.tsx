import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { ServiceItemCard } from "../../ui/ServiceItemCard";

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
  price: "€65",
  durationLabel: "Duration",
  bookLabel: "Book on WhatsApp",
  bookHref: "https://wa.me/34600000000?text=Hello",
};

function mount(overrides: Partial<typeof PROPS> = {}) {
  return render(
    <ul>
      <ServiceItemCard {...PROPS} {...overrides} />
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

  it("renders the parent-supplied icon and hides it from assistive tech", async () => {
    const screen = await mount();
    await expect.element(screen.getByTestId("icon-svg")).toBeInTheDocument();
    await expect
      .element(screen.getByTestId("service-item-card-icon"))
      .toHaveAttribute("aria-hidden", "true");
  });

  it("is a list item, so a grid of cards is announced as a list", async () => {
    const screen = await mount();
    await expect.element(screen.getByRole("listitem")).toBeInTheDocument();
  });
});

describe("ServiceItemCard booking link", () => {
  it("links the Book button to the provided wa.me href", async () => {
    const screen = await mount();
    await expect
      .element(screen.getByTestId("service-item-card-book"))
      .toHaveAttribute("href", PROPS.bookHref);
  });

  it("opens WhatsApp in a new, safely-rel'd tab", async () => {
    const screen = await mount();
    const link = screen.getByTestId("service-item-card-book");
    await expect.element(link).toHaveAttribute("target", "_blank");
    await expect.element(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("gives the Book link an accessible name naming the service", async () => {
    const screen = await mount();
    // Icon + short label alone would read the same on every card; the
    // aria-label disambiguates which service is being booked.
    await expect
      .element(screen.getByTestId("service-item-card-book"))
      .toHaveAttribute("aria-label", `${PROPS.bookLabel}: ${PROPS.name}`);
  });

  it("still renders a usable link when the number is missing", async () => {
    // Empty store → href like https://wa.me/?text=... The button must remain
    // present and labelled rather than disappear.
    const screen = await mount({ bookHref: "https://wa.me/?text=Hello" });
    await expect
      .element(screen.getByTestId("service-item-card-book"))
      .toHaveAttribute("href", "https://wa.me/?text=Hello");
  });
});
