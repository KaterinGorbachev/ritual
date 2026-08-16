import { describe, it, expect, vi } from "vitest";

// Home page section inventory — app/[lang]/page.tsx.
//
// The component tests next door prove each widget behaves. This file proves the
// page still *contains* them: hero, top services, the team band, the cream
// gallery, reviews and the film section, in all three languages. That is the
// regression a refactor or a dictionary edit actually causes — a section
// silently disappears and nothing else goes red.
//
// jsdom + renderToStaticMarkup, same reasoning as LayoutHeader.db.test.tsx: the
// page pulls in client components whose module scope touches the browser, and
// static rendering never runs their effects.

vi.mock("../../lib/handleData", () => ({
  getInfo: vi.fn().mockResolvedValue({ ok: true, data: [] }),
  getDocById: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

import { renderToStaticMarkup } from "react-dom/server.browser";
import HomePage from "../../[lang]/page";
import en from "../../[lang]/dictionaries/en.json";
import es from "../../[lang]/dictionaries/es.json";
import ru from "../../[lang]/dictionaries/ru.json";

type Dict = typeof en;

const dictionaries: Record<string, Dict> = {
  en,
  es: es as unknown as Dict,
  ru: ru as unknown as Dict,
};

const LOCALES = ["en", "es", "ru"] as const;

async function renderPage(lang: string): Promise<Document> {
  const tree = await HomePage({ params: Promise.resolve({ lang }) } as never);
  return new DOMParser().parseFromString(
    renderToStaticMarkup(tree),
    "text/html",
  );
}

/** Rendered once per locale — the page is pure given `lang`, so render is cached. */
const pages = new Map<string, Promise<Document>>();
function page(lang: string): Promise<Document> {
  if (!pages.has(lang)) pages.set(lang, renderPage(lang));
  return pages.get(lang)!;
}

describe("home page — hero", () => {
  it.each(LOCALES)("renders the hero section in %s", async (lang) => {
    const doc = await page(lang);
    expect(doc.querySelector('[data-testid="hero-section"]')).not.toBeNull();
  });

  it.each(LOCALES)("gives the page exactly one h1, in %s", async (lang) => {
    const doc = await page(lang);
    const h1s = doc.querySelectorAll("h1");
    // One h1 per page: a second one splits the document outline, a missing one
    // leaves the page unnamed for assistive tech and for search.
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toBe(dictionaries[lang].hero.title);
  });

  it.each(LOCALES)("shows the hero eyebrow and subtitle in %s", async (lang) => {
    const doc = await page(lang);
    const hero = doc.querySelector('[data-testid="hero-section"]')!;
    const d = dictionaries[lang];
    expect(hero.textContent).toContain(d.hero.eyebrow);
    expect(hero.textContent).toContain(d.hero.subtitle);
  });

  it.each(LOCALES)("puts a booking CTA in the hero in %s", async (lang) => {
    const doc = await page(lang);
    const hero = doc.querySelector('[data-testid="hero-section"]')!;
    const cta = hero.querySelector('[data-testid="whatsapp-button"]');
    // The hero CTA is the primary conversion path on the whole site.
    expect(cta).not.toBeNull();
    expect(cta!.textContent).toContain(dictionaries[lang].hero.cta);
  });

  it("mounts the bubble canvas behind the hero", async () => {
    const doc = await page("en");
    const canvas = doc.querySelector('[data-testid="hero-section"] canvas');
    expect(canvas).not.toBeNull();
    // Decorative — it carries no information, so it must not be announced.
    expect(canvas!.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("home page — top services", () => {
  it.each(LOCALES)("renders one card per service in %s", async (lang) => {
    const doc = await page(lang);
    const d = dictionaries[lang];
    for (const item of d.topServices.items) {
      expect(
        doc.body.textContent,
        `missing service card: ${item.name}`,
      ).toContain(item.name);
    }
  });

  it.each(LOCALES)("heads the services block in %s", async (lang) => {
    const doc = await page(lang);
    const d = dictionaries[lang];
    const headings = [...doc.querySelectorAll("h2")].map((h) => h.textContent);
    expect(headings).toContain(d.topServices.title);
  });

  it.each(LOCALES)("closes the services grid with a booking CTA in %s", async (lang) => {
    const doc = await page(lang);
    const d = dictionaries[lang];
    expect(doc.body.textContent).toContain(d.topServices.ctaQuestion);
    const ctas = [
      ...doc.querySelectorAll('[data-testid="whatsapp-button"]'),
    ].map((b) => b.textContent);
    expect(ctas).toContain(d.topServices.cta);
  });

  it("gives every service image a non-empty alt", async () => {
    const doc = await page("en");
    const images = [...doc.querySelectorAll<HTMLImageElement>("img")];
    expect(images.length).toBeGreaterThan(0);
    for (const img of images) {
      // Content images here are photos of the service/therapist — an empty alt
      // would drop real information for a screen-reader user (WCAG 1.1.1).
      expect(
        img.getAttribute("alt"),
        `image without alt: ${img.getAttribute("src")}`,
      ).toBeTruthy();
    }
  });
});

describe("home page — team band", () => {
  it.each(LOCALES)("renders a card for every staff member in %s", async (lang) => {
    const doc = await page(lang);
    const cards = doc.querySelectorAll('[data-testid="team-card"]');
    expect(cards).toHaveLength(dictionaries[lang].staff.length);
  });

  it.each(LOCALES)("names each therapist and their service in %s", async (lang) => {
    const doc = await page(lang);
    const text = doc.body.textContent ?? "";
    for (const member of dictionaries[lang].staff) {
      expect(text, `missing staff member: ${member.name}`).toContain(member.name);
      expect(text).toContain(member.service);
    }
  });

  it("anchors the team band at #aboutus so the header nav link lands", async () => {
    const doc = await page("en");
    // The header renders `/#aboutus`; if this id moves the link scrolls nowhere
    // and the browser gives no error.
    expect(doc.querySelector("#aboutus")).not.toBeNull();
  });

  it("falls back to the default portrait when a member has no image", async () => {
    const doc = await page("en");
    for (const card of doc.querySelectorAll('[data-testid="team-card"]')) {
      const img = card.querySelector<HTMLImageElement>("img");
      expect(img).not.toBeNull();
      expect(img!.getAttribute("src")).toBeTruthy();
    }
  });
});

describe("home page — cream gallery", () => {
  it.each(LOCALES)("renders the cream gallery in %s", async (lang) => {
    const doc = await page(lang);
    // [data-marquee] is the hook globals.css uses for the reduced-motion
    // fallback, so it is the gallery's real identity, not a test-only marker.
    expect(doc.querySelector("[data-marquee]")).not.toBeNull();
  });

  it.each(LOCALES)("heads the cosmetics block in %s", async (lang) => {
    const doc = await page(lang);
    const d = dictionaries[lang];
    const headings = [...doc.querySelectorAll("h2")].map((h) => h.textContent);
    expect(headings).toContain(d.aboutCosmetics.title);
    expect(doc.body.textContent).toContain(d.aboutCosmetics.eyebrow);
  });

  it.each(LOCALES)("shows every cream brand in %s", async (lang) => {
    const doc = await page(lang);
    const gallery = doc.querySelector("[data-marquee]")!;
    const text = gallery.textContent ?? "";
    for (const brand of dictionaries[lang].cosmetics) {
      expect(text, `missing brand: ${brand.name}`).toContain(brand.name);
    }
  });

  it("announces each brand exactly once despite the duplicated track", async () => {
    const doc = await page("en");
    const gallery = doc.querySelector("[data-marquee]")!;
    const announced = [
      ...gallery.querySelectorAll('li:not([aria-hidden="true"])'),
    ];
    // The track repeats the list to fill the widest viewport and then doubles it
    // so the loop wraps seamlessly. Every copy past the first pass is
    // decorative — otherwise a screen reader reads the brand list a dozen times.
    expect(announced).toHaveLength(en.cosmetics.length);
  });

  it("names the gallery for assistive technology", async () => {
    const doc = await page("en");
    const gallery = doc.querySelector("[data-marquee]")!;
    expect(gallery.getAttribute("aria-label")).toBeTruthy();
  });

  it("gives every visible cream card an image or a fallback icon", async () => {
    const doc = await page("en");
    const gallery = doc.querySelector("[data-marquee]")!;
    for (const card of gallery.querySelectorAll('li:not([aria-hidden="true"])')) {
      const hasImage = card.querySelector("img") !== null;
      const hasIcon = card.querySelector("svg") !== null;
      expect(hasImage || hasIcon).toBe(true);
    }
  });
});

describe("home page — reviews", () => {
  it.each(LOCALES)("renders the review gallery in %s", async (lang) => {
    const doc = await page(lang);
    expect(doc.querySelector('[data-testid="review-gallery"]')).not.toBeNull();
  });

  it.each(LOCALES)("renders one card per review in %s", async (lang) => {
    const doc = await page(lang);
    const gallery = doc.querySelector('[data-testid="review-gallery"]')!;
    const text = gallery.textContent ?? "";
    for (const review of dictionaries[lang].reviews.items) {
      expect(text, `missing review by ${review.author}`).toContain(review.author);
    }
  });

  it.each(LOCALES)("names both gallery arrows in %s", async (lang) => {
    const doc = await page(lang);
    const d = dictionaries[lang];
    const prev = doc.querySelector('[data-testid="review-nav-prev"]');
    const next = doc.querySelector('[data-testid="review-nav-next"]');
    // Icon-only buttons — aria-label is the whole accessible name (WCAG 4.1.2).
    expect(prev!.getAttribute("aria-label")).toBe(d.reviews.prev);
    expect(next!.getAttribute("aria-label")).toBe(d.reviews.next);
  });

  it("disables the previous arrow before anything has scrolled", async () => {
    const doc = await page("en");
    const prev = doc.querySelector('[data-testid="review-nav-prev"]');
    expect(prev!.hasAttribute("disabled")).toBe(true);
  });

  it("keeps the rating summary as display copy only", async () => {
    const doc = await page("en");
    expect(doc.body.textContent).toContain(en.reviews.ratingSummary);
    // Its es/ru counterparts use a comma decimal — it must never be parsed into
    // schema. The layout test asserts no aggregateRating is emitted.
    expect(doc.querySelector('[itemprop="ratingValue"]')).toBeNull();
  });

  it("anchors the reviews band at #reviews", async () => {
    const doc = await page("en");
    expect(doc.querySelector("#reviews")).not.toBeNull();
  });
});

describe("home page — film section", () => {
  it.each(LOCALES)("renders the film section in %s", async (lang) => {
    const doc = await page(lang);
    expect(doc.querySelector('[data-testid="film-section"]')).not.toBeNull();
  });

  it.each(LOCALES)("shows the film heading and card copy in %s", async (lang) => {
    const doc = await page(lang);
    const film = doc.querySelector('[data-testid="film-section"]')!;
    const d = dictionaries[lang];
    expect(film.textContent).toContain(d.film.title);
    expect(film.textContent).toContain(d.film.card.heading);
    expect(film.textContent).toContain(d.film.card.lead);
  });

  it.each(LOCALES)("puts a booking CTA on the film card in %s", async (lang) => {
    const doc = await page(lang);
    const film = doc.querySelector('[data-testid="film-section"]')!;
    const cta = film.querySelector('[data-testid="whatsapp-button"]');
    expect(cta).not.toBeNull();
    expect(cta!.textContent).toContain(dictionaries[lang].film.card.cta);
  });

  it("serves a poster rather than autoplaying the video", async () => {
    const doc = await page("en");
    const film = doc.querySelector('[data-testid="film-section"]')!;
    // Click-to-play: no <video autoplay> in the initial HTML. Autoplaying media
    // is both a bandwidth cost and a WCAG 2.2.2 problem.
    const video = film.querySelector("video");
    expect(video?.hasAttribute("autoplay") ?? false).toBe(false);
  });
});

describe("home page — section inventory", () => {
  // The single assertion that fails loudest if a whole band is dropped.
  it.each(LOCALES)("has every top-level band in %s", async (lang) => {
    const doc = await page(lang);
    const missing = [
      ['[data-testid="hero-section"]', "hero"],
      ["#aboutus", "team band"],
      ["[data-marquee]", "cream gallery"],
      ['[data-testid="review-gallery"]', "reviews"],
      ['[data-testid="film-section"]', "film"],
    ]
      .filter(([selector]) => doc.querySelector(selector) === null)
      .map(([, name]) => name);

    expect(missing, `sections missing from /${lang}`).toEqual([]);
  });

  it.each(LOCALES)("keeps the heading order h1 then h2s in %s", async (lang) => {
    const doc = await page(lang);
    const levels = [...doc.querySelectorAll("h1, h2, h3")].map((h) =>
      Number(h.tagName[1]),
    );
    expect(levels[0]).toBe(1);
    // No skipped level (h2 → h4) anywhere: WCAG 1.3.1 / 2.4.10.
    for (let i = 1; i < levels.length; i++) {
      expect(
        levels[i] - levels[i - 1],
        `heading level jumps from h${levels[i - 1]} to h${levels[i]}`,
      ).toBeLessThanOrEqual(1);
    }
  });

  it("leaves no untranslated dictionary key on the page", async () => {
    for (const lang of LOCALES) {
      const doc = await page(lang);
      const text = doc.body.textContent ?? "";
      // A missing key renders as "undefined" or as the raw dotted path.
      expect(text, `/${lang} renders "undefined"`).not.toContain("undefined");
      expect(text).not.toMatch(/\{\{?\w+(\.\w+)+\}?\}/);
    }
  });
});
