import { describe, it, expect, vi } from "vitest";

// Deterministic tests for the WebMCP tool logic — app/lib/webmcp.ts.
//
// Everything here is a pure function, so this needs no browser: the `.db.`
// suffix routes the file to the jsdom `unit` project (see vitest.config.mts).
// Registration itself — that all twelve tools reach document.modelContext with
// the right annotations — is covered separately in ModelContextTools.test.tsx,
// which needs a real React render.
//
// Four things are checked:
//   1. tool logic returns the expected values, in all three languages
//   2. untrusted arguments are rejected rather than followed
//   3. injected dependencies are called correctly (router / cookie writer)
//   4. character budgets hold — the check that catches a future copy edit

import * as t from "../../lib/webmcp";
import { toContactFacts, type ContactDataItem } from "../../lib/contactFacts";
import en from "../../[lang]/dictionaries/en.json";
import es from "../../[lang]/dictionaries/es.json";
import ru from "../../[lang]/dictionaries/ru.json";

// The dictionaries carry far more than the tools read; HomeDict is that slice.
function homeDict(dict: typeof en): t.HomeDict {
  return JSON.parse(
    JSON.stringify({
      hero: dict.hero,
      aboutStaff: dict.aboutStaff,
      topServices: dict.topServices,
      staff: dict.staff,
      cosmetics: dict.cosmetics,
      reviews: dict.reviews,
      nav: dict.nav,
      footer: dict.footer,
      daysOfWeek: dict.daysOfWeek,
      languagesSpoken: dict.seo.languagesSpoken,
    }),
  );
}

const LOCALES = {
  en: homeDict(en),
  es: homeDict(es as unknown as typeof en),
  ru: homeDict(ru as unknown as typeof en),
};

/** The shape the layout actually passes, mirroring the real Firestore docs. */
const CONTACT_DOCS: ContactDataItem[] = [
  {
    id: "address",
    location: "Carrer de Sant Vicent Màrtir 12, València",
    coordinates: "39.4720, -0.3759",
  },
  { id: "workingHours", from: "10", to: "20", dayStart: "monday", dayEnd: "saturday" },
  { id: "messanger", telephone: "+34643987849" },
  { id: "instagram", url: "https://www.instagram.com/ritual.beauty_estetica" },
];

const FACTS = toContactFacts(CONTACT_DOCS);

describe("WebMCP tool logic", () => {
  describe("listTopServices", () => {
    it("returns every service as an id and a name", () => {
      const out = t.listTopServices(LOCALES.en);

      expect(out.services).toHaveLength(en.topServices.items.length);
      expect(out.services[0]).toEqual({
        id: en.topServices.items[0].id,
        name: en.topServices.items[0].name,
      });
    });

    it("omits descriptions, which is what keeps it inside the output budget", () => {
      // Returning descriptions here measured ~3.1K in Spanish, twice the limit.
      for (const service of t.listTopServices(LOCALES.es).services) {
        expect(service).not.toHaveProperty("description");
      }
    });
  });

  describe("getServiceDetails", () => {
    it("returns the full description for a known id", () => {
      const first = en.topServices.items[0];
      const out = t.getServiceDetails(LOCALES.en, first.id);

      expect(out).toEqual({
        found: true,
        name: first.name,
        description: first.description,
      });
    });

    it("chains from listTopServices — every listed id resolves", () => {
      // The agent learns ids from listTopServices; if any failed to resolve here
      // the two-step flow would break in a way no single-tool test would show.
      for (const { id } of t.listTopServices(LOCALES.ru).services) {
        expect(t.getServiceDetails(LOCALES.ru, id).found).toBe(true);
      }
    });

    it("reports a miss instead of throwing", () => {
      const out = t.getServiceDetails(LOCALES.en, "no-such-service");

      expect(out.found).toBe(false);
      expect(out.message).toMatch(/listTopServices/);
    });

    it.each(["__proto__", "constructor", "toString"])(
      "does not resolve the inherited property %s",
      (id) => {
        expect(t.getServiceDetails(LOCALES.en, id).found).toBe(false);
      },
    );

    it.each([undefined, null, 42, {}, []])("survives a %s argument", (id) => {
      expect(() => t.getServiceDetails(LOCALES.en, id)).not.toThrow();
      expect(t.getServiceDetails(LOCALES.en, id).found).toBe(false);
    });
  });

  describe("listClientReviews", () => {
    it("returns three reviews by default", () => {
      const out = t.listClientReviews(LOCALES.en);

      expect(out.reviews).toHaveLength(3);
      expect(out.total).toBe(en.reviews.items.length);
    });

    it("clamps an out-of-range limit rather than trusting it", () => {
      expect(t.listClientReviews(LOCALES.en, 99).reviews.length).toBeLessThanOrEqual(5);
      expect(t.listClientReviews(LOCALES.en, -5).reviews).toHaveLength(1);
      expect(t.listClientReviews(LOCALES.en, "3" as unknown).reviews).toHaveLength(3);
    });

    it("never emits a parsed rating from the display-copy summary", () => {
      // dict.reviews.ratingSummary is "4,9 de 240+ rituales" in es/ru — a comma
      // decimal. Machine-parsing it would publish an unverified figure.
      const serialised = JSON.stringify(t.listClientReviews(LOCALES.es, 5));
      expect(serialised).not.toContain(es.reviews.ratingSummary);
    });
  });

  describe("describeWorkingHours", () => {
    it("reads as a sentence, with localised day names", () => {
      const { hours } = t.describeWorkingHours(LOCALES.en, FACTS);

      expect(hours).toContain(en.footer.workingHours);
      expect(hours).toContain(en.daysOfWeek.monday);
      expect(hours).toContain(en.daysOfWeek.saturday);
      expect(hours).toContain("10");
      expect(hours).toContain(en.footer.commentAboutAppointments);
    });

    it.each(["es", "ru"] as const)("leaves no English sentence frame in %s", (locale) => {
      // The day names and the appointment note come from the dictionary, so an
      // English frame around them ("Ritual is open …") would hand a Spanish or
      // Russian speaker a half-translated answer. Caught in a real browser, not
      // by the assertions above — hence this test.
      const { hours } = t.describeWorkingHours(LOCALES[locale], FACTS);

      expect(hours).not.toMatch(/\bis open\b/);
      expect(hours).toContain(
        locale === "es" ? es.footer.workingHours : ru.footer.workingHours,
      );
    });

    it("degrades to a helpful sentence when Firestore gave us nothing", () => {
      // The layout passes [] when the read fails, so this is a real path.
      const { hours } = t.describeWorkingHours(LOCALES.en, toContactFacts([]));

      expect(hours).toMatch(/WhatsApp/);
      expect(hours).not.toMatch(/undefined|null|NaN/);
    });
  });

  describe("howToBook", () => {
    it("builds a wa.me link with the prefilled message", () => {
      const out = t.howToBook(LOCALES.en, FACTS);

      expect(out.whatsAppLink).toBe(
        `https://wa.me/34643987849?text=${encodeURIComponent(en.nav.message)}`,
      );
    });

    it("still explains booking when no number is stored", () => {
      const out = t.howToBook(LOCALES.en, toContactFacts([]));

      expect(out.whatsAppLink).toBeUndefined();
      expect(out.howToBook).toMatch(/WhatsApp/);
    });
  });

  describe("findUs and getContactDetails", () => {
    it("returns the address and a map link", () => {
      const out = t.findUs(FACTS);

      expect(out.address).toBe("Carrer de Sant Vicent Màrtir 12, València");
      expect(out.mapLink).toContain("39.472");
    });

    it("shows the number as stored, not stripped to digits", () => {
      // The digits-only form is for wa.me links; a person reads the + form.
      expect(t.getContactDetails(FACTS).whatsApp).toBe("+34643987849");
    });

    it("explains itself when there is no contact data at all", () => {
      expect(t.findUs(toContactFacts([])).message).toBeTruthy();
      expect(t.getContactDetails(toContactFacts([])).message).toBeTruthy();
    });
  });

  describe("argument validation", () => {
    it.each(["de", "EN", "", "es-ES", "../../etc", null, undefined, 1])(
      "rejects %s as a site language",
      (value) => {
        expect(t.isSiteLanguage(value)).toBe(false);
      },
    );

    it.each(["en", "es", "ru"])("accepts %s", (value) => {
      expect(t.isSiteLanguage(value)).toBe(true);
    });

    it.each(["__proto__", "constructor", "hasOwnProperty", "../../etc", "", null])(
      "rejects %s as a section name",
      (value) => {
        // hasOwnProperty, not `in`: inherited keys must not resolve to an id.
        expect(t.isSectionName(value)).toBe(false);
      },
    );

    it.each(["top", "aboutus", "reviews", "contact"])("accepts section %s", (value) => {
      expect(t.isSectionName(value)).toBe(true);
    });
  });

  describe("localePath", () => {
    it.each([
      ["/en", "ru", "/ru"],
      ["/en/privacy", "es", "/es/privacy"],
      ["/es/services", "en", "/en/services"],
      ["/", "ru", "/ru"],
    ])("rewrites %s to %s → %s", (pathname, language, expected) => {
      expect(t.localePath(pathname, language as t.SiteLanguage)).toBe(expected);
    });

    it("cannot be steered into a javascript: URL", () => {
      // router.push executes javascript: URLs in page context, so the path is
      // always rebuilt from a validated language — never interpolated.
      const out = t.localePath("/en", "ru");
      expect(out.startsWith("/")).toBe(true);
      expect(out).not.toContain("javascript:");
    });
  });

  describe("truncate", () => {
    it("leaves short text alone", () => {
      expect(t.truncate("short", 50)).toBe("short");
    });

    it("marks the cut so the agent knows there is more", () => {
      const out = t.truncate("a".repeat(200), 50);
      expect(out.endsWith("…")).toBe(true);
      expect(out.length).toBeLessThanOrEqual(51);
    });

    it("cuts on a word boundary", () => {
      expect(t.truncate("the quick brown fox jumps over", 20)).toBe("the quick brown fox…");
    });
  });
});

// ---------------------------------------------------------------------------
// Character budgets. Agents truncate or reject oversized payloads, and the
// failure shows up as an agent behaving strangely — very hard to trace back to a
// copy edit. So it is asserted, across every locale, rather than eyeballed.
// ---------------------------------------------------------------------------

describe("character budgets", () => {
  const OUTPUT_LIMIT = 1500;

  const outputs = (dict: t.HomeDict, facts: typeof FACTS) => ({
    listTopServices: t.listTopServices(dict),
    getServiceDetails: t.getServiceDetails(dict, dict.topServices.items[0].id),
    getAboutSalon: t.getAboutSalon(dict),
    listTeamMembers: t.listTeamMembers(dict),
    listCosmeticBrands: t.listCosmeticBrands(dict),
    listClientReviews: t.listClientReviews(dict, 5),
    howToBook: t.howToBook(dict, facts),
    getWorkingHours: t.describeWorkingHours(dict, facts),
    findUs: t.findUs(facts),
    getContactDetails: t.getContactDetails(facts),
    getSpokenLanguages: t.getSpokenLanguages(dict),
  });

  for (const [locale, dict] of Object.entries(LOCALES)) {
    for (const [name, output] of Object.entries(outputs(dict, FACTS))) {
      it(`${locale}: ${name} output stays under ${OUTPUT_LIMIT} characters`, () => {
        expect(JSON.stringify(output).length).toBeLessThanOrEqual(OUTPUT_LIMIT);
      });
    }
  }

  it("every tool name fits in 30 characters", () => {
    for (const name of Object.keys(outputs(LOCALES.en, FACTS))) {
      expect(name.length).toBeLessThanOrEqual(30);
    }
  });
});
