import { describe, it, expect, vi, beforeEach } from "vitest";

// Layout tests for app/[lang]/layout.tsx — the chrome every page inherits.
//
// Why this file is a `.db.test.tsx` (jsdom, not the browser project):
//   1. The layout is an async Server Component that calls getInfo("contactData")
//      directly. Only the jsdom project can vi.mock the firebase import, so a
//      real Firestore round-trip never happens.
//   2. It returns a whole <html><body> document. Mounting that inside the
//      browser project's existing document would nest one document in another —
//      React drops the tags and every structural assertion becomes a lie. So the
//      tree is rendered to static markup and parsed into a detached document
//      instead, which is also exactly what a crawler is served.
//
// Client children (BubbleCanvas, MapLeaflet, zustand stores) are NOT mocked:
// renderToStaticMarkup never runs effects, so their browser-only code never
// executes. Only modules that touch the browser at *import* or *render* time
// need a stub, which is what the mocks below cover.

vi.mock("../../lib/handleData", () => ({
  getInfo: vi.fn(),
  getDocById: vi.fn(),
}));

// next/font/google runs the font pipeline at import time — unavailable outside a
// Next build. The real hook only ever contributes a CSS variable class name.
vi.mock("next/font/google", () => {
  const font = (opts: { variable?: string }) => ({
    variable: opts.variable?.replace("--", "") ?? "",
    className: "font-mock",
  });
  return {
    Playfair_Display: font,
    Nunito: font,
    Caveat: font,
  };
});

// LangButton reads the current pathname to decide which language is active, so
// the stub has to follow the locale each test renders — hoisted because
// vi.mock's factory runs before the module body.
const nav = vi.hoisted(() => ({ pathname: "/en" }));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

// next/dynamic with { ssr: false } renders nothing on the server anyway; stub it
// so the Leaflet import chain (which reads `window` at module scope) is never
// pulled in.
vi.mock("next/dynamic", () => ({
  default: () => {
    const Stub = () => null;
    Stub.displayName = "DynamicStub";
    return Stub;
  },
}));

import { renderToStaticMarkup } from "react-dom/server.browser";
import RootLayout, {
  generateMetadata,
  generateStaticParams,
  dynamicParams,
} from "../../[lang]/layout";
import { getInfo } from "../../lib/handleData";
import en from "../../[lang]/dictionaries/en.json";
import es from "../../[lang]/dictionaries/es.json";
import ru from "../../[lang]/dictionaries/ru.json";

const dictionaries: Record<string, typeof en> = {
  en,
  es: es as unknown as typeof en,
  ru: ru as unknown as typeof en,
};

/** The contactData docs Firestore holds in production, shaped as the layout reads them. */
const CONTACT_DOCS = [
  {
    id: "address",
    location: "Calle de Móra de Rubióls 3, Valencia 46007",
    coordinates: "39.459230762224585, -0.3851381134944049",
  },
  { id: "workingHours", from: "10", to: "20", dayStart: "monday", dayEnd: "sunday" },
  { id: "messanger", telephone: "+34643987849" },
  { id: "instagram", url: "https://www.instagram.com/ritual.beauty_estetica" },
];

const okRead = { ok: true as const, data: CONTACT_DOCS };

/**
 * Render the layout for one locale and hand back a queryable Document.
 *
 * `children` stands in for the page slot so assertions can prove the chrome
 * wraps the page rather than replacing it.
 */
async function renderLayout(
  lang: string,
  read: unknown = okRead,
): Promise<Document> {
  vi.mocked(getInfo).mockResolvedValue(read as never);
  // Keep the router's idea of the URL in step with the locale being rendered.
  nav.pathname = `/${lang}`;
  const tree = await RootLayout({
    children: <p data-testid="page-slot">page content</p>,
    params: Promise.resolve({ lang }),
  } as never);
  const html = renderToStaticMarkup(tree);
  return new DOMParser().parseFromString(html, "text/html");
}

/** Every JSON-LD block in the document, parsed. */
function jsonLdBlocks(doc: Document): Record<string, unknown>[] {
  return [...doc.querySelectorAll('script[type="application/ld+json"]')].map(
    (s) => JSON.parse(s.textContent ?? "{}"),
  );
}

beforeEach(() => {
  vi.mocked(getInfo).mockReset();
});

describe("layout — document shell", () => {
  it.each(["en", "es", "ru"])(
    "sets lang=%s on <html> so screen readers pick the right voice",
    async (lang) => {
      const doc = await renderLayout(lang);
      expect(doc.documentElement.getAttribute("lang")).toBe(lang);
    },
  );

  // toLocale() folds a regional tag onto its base language. Without this the
  // dictionary lookup would fall through to the Spanish default for es-ES.
  it("folds a regional tag onto its base locale", async () => {
    const doc = await renderLayout("es-ES");
    expect(doc.documentElement.getAttribute("lang")).toBe("es");
  });

  it("renders the page it wraps inside <main id='main'>", async () => {
    const doc = await renderLayout("en");
    const main = doc.querySelector("main#main");
    expect(main).not.toBeNull();
    expect(main!.querySelector('[data-testid="page-slot"]')).not.toBeNull();
  });

  it("puts exactly one header, one main and one footer in the document", async () => {
    const doc = await renderLayout("en");
    // Landmark duplication is the classic screen-reader regression when chrome
    // gets refactored — "banner" and "contentinfo" must each be unique.
    expect(doc.querySelectorAll("header")).toHaveLength(1);
    expect(doc.querySelectorAll("main")).toHaveLength(1);
    expect(doc.querySelectorAll("footer")).toHaveLength(1);
  });
});

describe("layout — header", () => {
  it("renders the header", async () => {
    const doc = await renderLayout("en");
    expect(doc.querySelector('[data-testid="header"]')).not.toBeNull();
  });

  it("shows the salon logo with a describing alt text", async () => {
    const doc = await renderLayout("en");
    const logo = doc.querySelector<HTMLImageElement>(
      'header img[src*="Logo-Ritual"]',
    );
    expect(logo).not.toBeNull();
    // An empty alt on the only branded image leaves the home link unnamed.
    expect(logo!.getAttribute("alt")).toBe("Ritual logo");
  });

  it("makes the logo a link back to the top of the page", async () => {
    const doc = await renderLayout("en");
    const home = doc.querySelector<HTMLAnchorElement>(
      'header a[aria-label="Aurelle home"]',
    );
    expect(home).not.toBeNull();
    expect(home!.getAttribute("href")).toContain("#main");
  });

  it.each([
    ["en", en],
    ["es", es],
    ["ru", ru],
  ])("labels the nav links in %s", async (lang, dict) => {
    const doc = await renderLayout(lang);
    const nav = doc.querySelector('[data-testid="header"]')!;
    const text = nav.textContent ?? "";
    const d = dict as unknown as typeof en;
    expect(text).toContain(d.nav.about);
    expect(text).toContain(d.nav.contact);
    expect(text).toContain(d.nav.instagram);
  });

  it("points the nav links at the sections the home page actually has", async () => {
    const doc = await renderLayout("en");
    const hrefs = [
      ...doc.querySelectorAll<HTMLAnchorElement>(
        'header [data-testid="nav-link"]',
      ),
    ].map((a) => a.getAttribute("href"));
    // #aboutus and #contact are real ids on the page / in the footer. A typo
    // here scrolls nowhere and the failure is silent in the browser.
    expect(hrefs).toContain("/#aboutus");
    expect(hrefs).toContain("/#contact");
  });

  it("opens the Instagram link in a new tab, safely", async () => {
    const doc = await renderLayout("en");
    const links = [
      ...doc.querySelectorAll<HTMLAnchorElement>(
        'header a[href*="instagram.com"]',
      ),
    ];
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute("target")).toBe("_blank");
      // Without noopener the opened tab can reach back through window.opener.
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });

  it("renders the WhatsApp booking button with the salon number from the data layer", async () => {
    const doc = await renderLayout("en");
    const button = doc.querySelector<HTMLAnchorElement>(
      'header [data-testid="whatsapp-button"]',
    );
    expect(button).not.toBeNull();
    // The number is read once by the layout and seeded into the store; the
    // rendered href is the proof it travelled the whole way.
    // The store strips the number to digits, so the "+34 …" from Firestore
    // becomes the bare international form wa.me expects.
    expect(button!.getAttribute("href")).toBe(
      `https://wa.me/34643987849?text=${encodeURIComponent(en.nav.message)}`,
    );
  });

  it("hides the WhatsApp icon from assistive technology", async () => {
    const doc = await renderLayout("en");
    const icon = doc.querySelector(
      'header [data-testid="whatsapp-button"] svg',
    );
    expect(icon).not.toBeNull();
    // The button's text already names it; an announced icon says it twice.
    expect(icon!.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders the burger menu with an accessible name", async () => {
    const doc = await renderLayout("en");
    const burger = doc.querySelector('[data-testid="burger-menu-button"]');
    expect(burger).not.toBeNull();
    expect(burger!.getAttribute("aria-label")).toBe("Toggle menu");
  });

  it("keeps the mobile menu panel closed until it is opened", async () => {
    const doc = await renderLayout("en");
    const menu = doc.querySelector('[data-testid="pages-menu"]');
    expect(menu).not.toBeNull();
    // <details> without `open`: the panel is collapsed in the initial HTML, so
    // a no-JS visitor is not served an expanded overlay.
    expect(menu!.hasAttribute("open")).toBe(false);
  });

  it("repeats every nav destination inside the mobile menu", async () => {
    const doc = await renderLayout("en");
    const desktop = [
      ...doc.querySelectorAll<HTMLAnchorElement>(
        'header nav:not([data-testid="pages-menu-panel"]) [data-testid="nav-link"]',
      ),
    ].map((a) => a.getAttribute("href"));
    const mobile = [
      ...doc.querySelectorAll<HTMLAnchorElement>(
        '[data-testid="pages-menu-panel"] [data-testid="nav-link"]',
      ),
    ].map((a) => a.getAttribute("href"));

    expect(mobile.length).toBeGreaterThan(0);
    // Small screens must not lose a destination — the two menus are the same
    // site, rendered twice.
    expect(new Set(mobile)).toEqual(new Set(desktop));
  });

  it("renders the language selector with all three locales", async () => {
    const doc = await renderLayout("en");
    expect(
      doc.querySelector('[data-testid="language-selector-button"]'),
    ).not.toBeNull();
    for (const code of ["EN", "RU", "ES"]) {
      expect(
        doc.querySelector(`[data-testid="language-option-${code}"]`),
        `no language option for ${code}`,
      ).not.toBeNull();
    }
  });

  it("marks the current language as the selected one", async () => {
    const doc = await renderLayout("ru");
    const current = doc.querySelector('[data-testid="language-option-RU"]');
    expect(current!.getAttribute("aria-current")).toBe("true");
    // Exactly one option may claim to be current.
    expect(
      doc.querySelectorAll('[data-testid^="language-option-"][aria-current]'),
    ).toHaveLength(1);
  });

  it.each([
    ["en", en],
    ["es", es],
    ["ru", ru],
  ])("names the stop-animations control in %s", async (lang, dict) => {
    const doc = await renderLayout(lang);
    const toggle = doc.querySelector('[data-testid="stop-animations-toggle"]');
    expect(toggle).not.toBeNull();
    const d = dict as unknown as typeof en;
    // Icon-only control: the accessible name is the only thing a screen-reader
    // user gets, and it must be in their language (WCAG 4.1.2).
    expect(toggle!.getAttribute("aria-label")).toBe(d.hero.stopWord);
    expect(toggle!.getAttribute("title")).toBe(d.hero.stopWord);
    // Not yet pressed: animations are running on first paint.
    expect(toggle!.getAttribute("aria-pressed")).toBe("false");
  });

  it("offers a skip link as the first focusable thing in the body", async () => {
    const doc = await renderLayout("en");
    const skip = doc.querySelector<HTMLAnchorElement>(
      '[data-testid="skip-to-content"]',
    );
    expect(skip).not.toBeNull();
    expect(skip!.getAttribute("href")).toBe("#main");
    // WCAG 2.4.1 — it must target an element that exists.
    expect(doc.querySelector("#main")).not.toBeNull();

    // It must precede the header, or a keyboard user tabs the whole nav first.
    const header = doc.querySelector('[data-testid="header"]')!;
    expect(
      skip!.compareDocumentPosition(header) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("keeps the skip link visually hidden until it is focused", async () => {
    const doc = await renderLayout("en");
    const skip = doc.querySelector('[data-testid="skip-to-content"]')!;
    const classes = skip.getAttribute("class") ?? "";
    // sr-only hides it; focus:not-sr-only is what brings it back. Losing the
    // second half makes the link permanently invisible — WCAG 2.4.7.
    expect(classes).toContain("sr-only");
    expect(classes).toContain("focus:not-sr-only");
  });
});

describe("layout — footer", () => {
  it("renders the footer", async () => {
    const doc = await renderLayout("en");
    expect(doc.querySelector("footer")).not.toBeNull();
  });

  it("renders the contact details block inside the footer", async () => {
    const doc = await renderLayout("en");
    const contact = doc.querySelector('footer [data-testid="contact-details"]');
    expect(contact).not.toBeNull();
  });

  it("passes the fetched contact docs down instead of re-reading Firestore", async () => {
    const doc = await renderLayout("en");
    const contact = doc.querySelector('footer [data-testid="contact-details"]')!;
    const text = contact.textContent ?? "";
    expect(text).toContain("Calle de Móra de Rubióls 3, Valencia 46007");
    expect(text).toContain("+34643987849");
    // One read for the whole page — the footer must not add a second.
    expect(getInfo).toHaveBeenCalledTimes(1);
    expect(getInfo).toHaveBeenCalledWith("contactData");
  });

  it("anchors the contact section at #contact so the nav link lands", async () => {
    const doc = await renderLayout("en");
    expect(doc.querySelector("footer #contact")).not.toBeNull();
  });

  it.each([
    ["en", en],
    ["es", es],
    ["ru", ru],
  ])("states the languages spoken in %s", async (lang, dict) => {
    const doc = await renderLayout(lang);
    const line = doc.querySelector('[data-testid="languages-spoken"]');
    // The standing rule: availableLanguage in the JSON-LD is only legitimate
    // because this sentence is visible on the page.
    expect(line).not.toBeNull();
    expect(line!.textContent).toBe((dict as unknown as typeof en).seo.languagesSpoken);
  });

  it.each([
    ["en", en],
    ["es", es],
    ["ru", ru],
  ])("links to the privacy policy of the same locale in %s", async (lang, dict) => {
    const doc = await renderLayout(lang);
    const link = [
      ...doc.querySelectorAll<HTMLAnchorElement>("footer a"),
    ].find((a) => a.getAttribute("href") === `/${lang}/privacy`);
    // Deploying the privacy policy is pointless if the footer link 404s or
    // throws the reader into another language.
    expect(link, `no /${lang}/privacy link in the footer`).toBeDefined();
    expect(link!.textContent).toContain(
      (dict as unknown as typeof en).footer.privacyPolicy,
    );
  });

  it("shows the copyright line and credits the developer safely", async () => {
    const doc = await renderLayout("en");
    const footer = doc.querySelector("footer")!;
    expect(footer.textContent).toContain("© 2026 Ritual");
    expect(footer.textContent).toContain(en.footer.rightsReserved);

    const credit = footer.querySelector<HTMLAnchorElement>(
      'a[href*="linkedin.com"]',
    );
    expect(credit).not.toBeNull();
    expect(credit!.getAttribute("target")).toBe("_blank");
    expect(credit!.getAttribute("rel")).toBe("noopener noreferrer");
  });
});

describe("layout — structured data", () => {
  it("server-renders both JSON-LD blocks into the HTML", async () => {
    const doc = await renderLayout("en");
    // AI crawlers read the served HTML and many never run JS, so these have to
    // be present before hydration.
    expect(jsonLdBlocks(doc)).toHaveLength(2);
  });

  it("emits valid parseable JSON in every block", async () => {
    const doc = await renderLayout("en");
    for (const script of doc.querySelectorAll(
      'script[type="application/ld+json"]',
    )) {
      expect(() => JSON.parse(script.textContent ?? "")).not.toThrow();
    }
  });

  it("describes the business from the contact docs", async () => {
    const doc = await renderLayout("en");
    const business = jsonLdBlocks(doc).find((b) =>
      String(b["@type"]).includes("DaySpa"),
    )!;
    expect(business.name).toBe("Ritual");
    expect(business.telephone).toBe("+34643987849");
    expect((business.address as Record<string, string>).streetAddress).toBe(
      "Calle de Móra de Rubióls 3, Valencia 46007",
    );
    expect(business.geo).toMatchObject({ latitude: 39.459230762224585 });
  });

  it("never claims an aggregateRating", async () => {
    const doc = await renderLayout("en");
    // Review markup must reflect genuinely collected reviews; ratingSummary is
    // display copy with a comma decimal in es/ru and is not machine-readable.
    for (const block of jsonLdBlocks(doc)) {
      expect(block).not.toHaveProperty("aggregateRating");
    }
  });

  it("escapes '<' so a stray closing tag cannot break out of the script", async () => {
    const doc = await renderLayout("en");
    for (const script of doc.querySelectorAll(
      'script[type="application/ld+json"]',
    )) {
      expect(script.textContent).not.toContain("<");
    }
  });
});

// The read can fail — Firestore being down must not take the site with it.
describe("layout — degraded data", () => {
  const failed = {
    ok: false as const,
    error: { message: "no permission", code: "permission-denied" },
  };

  it("still renders the header and footer when the contact read fails", async () => {
    const doc = await renderLayout("en", failed);
    expect(doc.querySelector('[data-testid="header"]')).not.toBeNull();
    expect(doc.querySelector("footer")).not.toBeNull();
    expect(doc.querySelector('[data-testid="page-slot"]')).not.toBeNull();
  });

  it("keeps the nav usable when the contact read fails", async () => {
    const doc = await renderLayout("en", failed);
    const hrefs = [
      ...doc.querySelectorAll<HTMLAnchorElement>(
        'header [data-testid="nav-link"]',
      ),
    ].map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/#aboutus");
    expect(hrefs).toContain("/#contact");
  });

  it("renders the WhatsApp button unnumbered rather than crashing", async () => {
    const doc = await renderLayout("en", failed);
    const button = doc.querySelector('[data-testid="whatsapp-button"]');
    expect(button).not.toBeNull();
  });

  it("drops the unknown fields from the JSON-LD instead of emitting empty ones", async () => {
    const doc = await renderLayout("en", failed);
    const business = jsonLdBlocks(doc).find((b) =>
      String(b["@type"]).includes("DaySpa"),
    )!;
    // A schema with `telephone: ""` is worse than one without the property.
    expect(business).not.toHaveProperty("telephone");
    expect(business).not.toHaveProperty("address");
    expect(business.name).toBe("Ritual");
  });

  it("survives contact docs whose fields are missing or malformed", async () => {
    const doc = await renderLayout("en", {
      ok: true as const,
      data: [{ id: "address", coordinates: "not, numbers" }, { id: "messanger" }],
    });
    expect(doc.querySelector('[data-testid="header"]')).not.toBeNull();
    const business = jsonLdBlocks(doc).find((b) =>
      String(b["@type"]).includes("DaySpa"),
    )!;
    expect(business).not.toHaveProperty("geo");
  });
});

describe("layout — routing and metadata", () => {
  it("prerenders exactly the three supported locales", async () => {
    expect(generateStaticParams()).toEqual([
      { lang: "en" },
      { lang: "ru" },
      { lang: "es" },
    ]);
  });

  it("404s unknown locale segments instead of serving Spanish", () => {
    // Without this /xx, /foo and /pizza each returned 200 with the full Spanish
    // homepage — unbounded duplicate URLs for a crawler.
    expect(dynamicParams).toBe(false);
  });

  it.each(["en", "es", "ru"])(
    "builds %s metadata from that locale's dictionary",
    async (lang) => {
      const meta = await generateMetadata({
        params: Promise.resolve({ lang }),
      } as never);
      const seo = dictionaries[lang].seo.home;
      expect(meta.title).toEqual({
        default: seo.title,
        template: "%s · Ritual",
      });
      expect(meta.description).toBe(seo.description);
    },
  );

  it("sets metadataBase so hreflang hrefs resolve absolute", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ lang: "en" }),
    } as never);
    // Google silently discards relative hreflang hrefs — without this the whole
    // multilingual setup does nothing.
    expect(meta.metadataBase).toBeInstanceOf(URL);
  });

  it("canonicalises each locale to its own root", async () => {
    for (const lang of ["en", "es", "ru"]) {
      const meta = await generateMetadata({
        params: Promise.resolve({ lang }),
      } as never);
      expect(meta.alternates?.canonical).toBe(`/${lang}`);
    }
  });

  it("advertises all three locales plus an x-default", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ lang: "en" }),
    } as never);
    expect(meta.alternates?.languages).toEqual({
      en: "/en",
      ru: "/ru",
      es: "/es",
      // x-default points at the same locale proxy.js falls back to, so an
      // unmatched visitor and a crawler land in the same place.
      "x-default": "/es",
    });
  });

  it("lets AI Overviews quote more than a truncated fragment", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ lang: "en" }),
    } as never);
    const robots = meta.robots as {
      index: boolean;
      googleBot: Record<string, unknown>;
    };
    expect(robots.index).toBe(true);
    expect(robots.googleBot["max-snippet"]).toBe(-1);
    expect(robots.googleBot["max-image-preview"]).toBe("large");
  });

  it("names the sibling locales in the OpenGraph block", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ lang: "es" }),
    } as never);
    expect(meta.openGraph?.locale).toBe("es");
    expect(
      (meta.openGraph as { alternateLocale?: string[] }).alternateLocale,
    ).toEqual(["en", "ru"]);
  });
});
