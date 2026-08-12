import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { LegalSection } from "../../ui/LegalSection";

const section = {
  number: 6,
  id: "data-whatsapp-usage",
  icon: "chat",
  heading: "WhatsApp",
  summary: "Writing to us is a request to be served, not a consent form.",
  body: [
    "When you write to us, we use your number to reply.",
    "We never add you to a broadcast list.",
  ],
};

const legalSection = (
  over: Partial<React.ComponentProps<typeof LegalSection>> = {},
) => <LegalSection section={section} {...over} />;

describe("LegalSection", () => {
  it("renders the number as text inside the heading", async () => {
    const screen = await render(legalSection());
    // The number lives in the data and must be copied with the heading and
    // read out by a screen reader — never a CSS counter.
    await expect
      .element(screen.getByRole("heading", { name: /6\.\s*WhatsApp/ }))
      .toBeInTheDocument();
  });

  it("renders the heading at level 2", async () => {
    const screen = await render(legalSection());
    await expect
      .element(screen.getByRole("heading", { level: 2, name: /WhatsApp/ }))
      .toBeInTheDocument();
  });

  it("shows the one-sentence lead-in", async () => {
    // The lead-in is marked by its tinted box and icon rather than a text
    // label, so the sentence itself is what has to be on screen.
    const screen = await render(legalSection());
    await expect.element(screen.getByText(section.summary)).toBeVisible();
  });

  // --- Nothing is hidden ----------------------------------------------------
  //
  // A privacy policy exists to be read. An earlier version put the body behind
  // a <details>, which meant most readers never saw the substance and Ctrl+F
  // could not find it. These are the tests that keep it visible.

  it("shows every body paragraph without any interaction", async () => {
    const screen = await render(legalSection());
    for (const paragraph of section.body) {
      await expect.element(screen.getByText(paragraph)).toBeVisible();
    }
  });

  it("renders no <details> or <summary> anywhere in the section", async () => {
    const screen = await render(legalSection());
    expect(screen.container.querySelector("details")).toBeNull();
    expect(screen.container.querySelector("summary")).toBeNull();
  });

  it("shows the list, table and note without interaction", async () => {
    const screen = await render(
      legalSection({
        section: {
          ...section,
          list: [{ term: "Marketing", detail: "Optional, always." }],
          table: {
            columns: ["Purpose", "Basis"],
            rows: [["Replying", "Art. 6.1.b"]],
          },
          note: "Refusing marketing never blocks a booking.",
        },
      }),
    );
    await expect.element(screen.getByText("Optional, always.")).toBeVisible();
    await expect.element(screen.getByText("Art. 6.1.b")).toBeVisible();
    await expect
      .element(screen.getByText("Refusing marketing never blocks a booking."))
      .toBeVisible();
  });

  it("labels the section landmark with its heading", async () => {
    const screen = await render(legalSection());
    // The ToC anchors land here, so the region must carry an accessible name.
    await expect
      .element(screen.getByRole("region", { name: /6\.\s*WhatsApp/ }))
      .toBeInTheDocument();
  });

  it("uses the section id as its anchor target", async () => {
    const screen = await render(legalSection());
    const region = screen.getByRole("region", { name: /WhatsApp/ });
    await expect.element(region).toHaveAttribute("id", section.id);
  });

  it("numbers list sub-points {number}.{n} rather than trusting the strings", async () => {
    const screen = await render(
      legalSection({
        section: {
          ...section,
          list: [
            { term: "Marketing", detail: "Optional, always." },
            { term: "Health", detail: "Please tell us in the salon." },
          ],
        },
      }),
    );
    await expect.element(screen.getByText("6.1")).toBeVisible();
    await expect.element(screen.getByText("6.2")).toBeVisible();
  });

  it("renders no icon for an unknown key rather than throwing", async () => {
    const screen = await render(
      legalSection({ section: { ...section, icon: "not-a-real-icon" } }),
    );
    await expect
      .element(screen.getByRole("heading", { level: 2, name: /WhatsApp/ }))
      .toBeInTheDocument();
  });
});
