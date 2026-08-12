import { describe, it, expect } from "vitest";
import en from "../../[lang]/dictionaries/en.json";
import es from "../../[lang]/dictionaries/es.json";
import ru from "../../[lang]/dictionaries/ru.json";

// The single highest-value test for the privacy policy.
//
// The page renders ONE component for all three locales, driven entirely by the
// `privacy` block in each dictionary. So a mismatch between the files does not
// fail loudly — it renders a subtly broken page in one language only, which is
// exactly the failure nobody notices until a client reads it. These assertions
// make that failure a red test instead.

type LegalTable = { columns: string[]; rows: string[][] };

type LegalSection = {
  number: number;
  id: string;
  icon: string;
  heading: string;
  summary: string;
  body: string[];
  list?: { term: string; detail: string }[];
  table?: LegalTable;
  note?: string;
};

type PrivacyBlock = {
  meta: Record<string, string>;
  sections: LegalSection[];
};

const dictionaries: Record<string, PrivacyBlock> = {
  en: (en as unknown as { privacy: PrivacyBlock }).privacy,
  es: (es as unknown as { privacy: PrivacyBlock }).privacy,
  ru: (ru as unknown as { privacy: PrivacyBlock }).privacy,
};

const locales = Object.keys(dictionaries);

/** Every string reachable in the block, for the emptiness / placeholder sweeps. */
function collectStrings(value: unknown, path: string, out: [string, string][]) {
  if (typeof value === "string") {
    out.push([path, value]);
  } else if (Array.isArray(value)) {
    value.forEach((item, i) => collectStrings(item, `${path}[${i}]`, out));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      collectStrings(v, `${path}.${k}`, out);
    }
  }
}

describe("privacy dictionaries", () => {
  it.each(locales)("%s has a privacy block with meta and sections", (locale) => {
    const privacy = dictionaries[locale];
    expect(privacy, `${locale}.json has no "privacy" key`).toBeDefined();
    expect(Array.isArray(privacy.sections)).toBe(true);
    expect(privacy.sections.length).toBeGreaterThan(0);
  });

  it("has the same section ids, in the same order, in all three languages", () => {
    const ids = locales.map((l) => dictionaries[l].sections.map((s) => s.id));
    // Compared against es — the authoritative language.
    const reference = dictionaries.es.sections.map((s) => s.id);
    for (const list of ids) {
      expect(list).toEqual(reference);
    }
  });

  it("has the same section numbers, in the same order, in all three languages", () => {
    const reference = dictionaries.es.sections.map((s) => s.number);
    for (const locale of locales) {
      expect(dictionaries[locale].sections.map((s) => s.number)).toEqual(reference);
    }
  });

  it("numbers sections 1..N with no gaps and no duplicates", () => {
    for (const locale of locales) {
      const numbers = dictionaries[locale].sections.map((s) => s.number);
      const expected = Array.from({ length: numbers.length }, (_, i) => i + 1);
      expect(numbers, `${locale} numbering`).toEqual(expected);
    }
  });

  it("covers every section the policy is required to have", () => {
    // Fixed ids: these are URL fragments people link to and cite by number.
    // There is no separate `data-international-transfer` section: transfers do
    // happen (Meta and Google are US-owned) and art. 13.1.f still requires
    // disclosing them, so the fact lives in the §5 processor table instead of
    // occupying a whole section for two sentences of substance.
    const required = [
      "responsible-person",
      "data-collection",
      "data-usage",
      "health-data",
      "data-sharing",
      "data-whatsapp-usage",
      "data-retention",
      "cookies",
      "user-rights",
      "security",
      "minors",
      "changes",
      "contact-information",
    ];
    expect(dictionaries.es.sections.map((s) => s.id)).toEqual(required);
  });

  it("still discloses the international transfer somewhere (art. 13.1.f)", () => {
    // Dropping the standalone section must not drop the disclosure. Meta and
    // Google are US-owned, so the transfer and its safeguard have to appear.
    for (const locale of locales) {
      const sharing = dictionaries[locale].sections.find(
        (s) => s.id === "data-sharing",
      )!;
      const text = [
        ...sharing.body,
        ...(sharing.table?.rows.flat() ?? []),
      ].join(" ");
      expect(text, `${locale} does not disclose the transfer safeguard`).toMatch(
        /Data Privacy Framework|Marco de Privacidad|ЕС–США|EU–US/,
      );
    }
  });

  it("keeps every body paragraph to at most two sentences", () => {
    // The house rule for legal copy here: a reader should never meet a wall of
    // text. Two sentences per paragraph is the cap that enforces it.
    for (const locale of locales) {
      for (const section of dictionaries[locale].sections) {
        for (const [i, paragraph] of section.body.entries()) {
          // Count sentence-ending punctuation, ignoring the dots inside
          // article references ("art. 6.1.b") and abbreviations ("EE. UU.",
          // "Ltd.", "C/ Jorge Juan"), which are not sentence breaks.
          const sentences = paragraph
            .replace(/EE\.\s*UU\./g, "EEUU")
            // Abbreviations whose dot is not a sentence break. No \b here:
            // it does not behave with Cyrillic, so the alternation is anchored
            // on the literal words instead.
            .replace(/(art|arts|ст|п|Ltd|Inc|núm|no)\.\s*/gi, "$1 ")
            // "6.1.b", "9.2.a" — collapse the remaining article numbers.
            .replace(/\d+(?:\.\d+)*\.?[a-z]?/gi, "0")
            .split(/[.!?](?:\s|$)/)
            .filter((s) => s.trim().length > 0).length;
          expect(
            sentences,
            `${locale} §${section.number} body[${i}] has ${sentences} sentences: ${paragraph.slice(0, 90)}…`,
          ).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it("never bakes the section number into the heading", () => {
    for (const locale of locales) {
      for (const section of dictionaries[locale].sections) {
        // The component composes "{number}. {heading}"; a number in the string
        // itself renders twice and breaks renumbering.
        expect(
          section.heading,
          `${locale} §${section.number} heading starts with a number`,
        ).not.toMatch(/^\s*\d+[.)]/);
      }
    }
  });

  it("shares one dateLastModification across all three files", () => {
    const dates = locales.map((l) => dictionaries[l].meta.dateLastModification);
    expect(new Set(dates).size, `dates differ: ${dates.join(", ")}`).toBe(1);
    // ISO 8601 — the component formats it for display.
    expect(dates[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("names es as the authoritative language everywhere", () => {
    for (const locale of locales) {
      expect(dictionaries[locale].meta.authoritativeLanguage).toBe("es");
    }
  });

  it("keeps the same number of body paragraphs per section in every language", () => {
    for (const section of dictionaries.es.sections) {
      const expected = section.body.length;
      for (const locale of locales) {
        const match = dictionaries[locale].sections.find((s) => s.id === section.id);
        expect(
          match?.body.length,
          `${locale} §${section.number} (${section.id}) body length`,
        ).toBe(expected);
      }
    }
  });

  it("keeps optional list/table/note structurally identical across languages", () => {
    for (const section of dictionaries.es.sections) {
      for (const locale of locales) {
        const match = dictionaries[locale].sections.find((s) => s.id === section.id)!;
        const where = `${locale} §${section.number} (${section.id})`;

        expect(match.list?.length ?? 0, `${where} list length`).toBe(
          section.list?.length ?? 0,
        );
        expect(Boolean(match.note), `${where} note presence`).toBe(
          Boolean(section.note),
        );
        expect(Boolean(match.table), `${where} table presence`).toBe(
          Boolean(section.table),
        );

        if (section.table) {
          expect(match.table!.columns.length, `${where} table columns`).toBe(
            section.table.columns.length,
          );
          expect(match.table!.rows.length, `${where} table rows`).toBe(
            section.table.rows.length,
          );
          // Every row must match the column count, or the table renders ragged.
          for (const [i, row] of match.table!.rows.entries()) {
            expect(row.length, `${where} table row ${i} width`).toBe(
              match.table!.columns.length,
            );
          }
        }
      }
    }
  });

  it("has no empty strings anywhere in the block", () => {
    for (const locale of locales) {
      const found: [string, string][] = [];
      collectStrings(dictionaries[locale], locale, found);
      const empty = found.filter(([, v]) => v.trim() === "");
      expect(empty.map(([p]) => p)).toEqual([]);
    }
  });

  it("ships no [[PENDING: …]] placeholder in any language", () => {
    // An incomplete policy must not go live silently. When the salon supplies
    // its registered name, NIF/CIF, postal address and privacy email, this
    // test goes green on its own.
    for (const locale of locales) {
      const found: [string, string][] = [];
      collectStrings(dictionaries[locale], locale, found);
      const pending = found.filter(([, v]) => v.includes("[[PENDING:"));
      expect(
        pending.map(([p, v]) => `${p}: ${v}`),
        "unfilled placeholders — the policy cannot be published",
      ).toEqual([]);
    }
  });

  it("keeps meta.title and meta.description within search-result limits", () => {
    for (const locale of locales) {
      const { title, description } = dictionaries[locale].meta;
      expect(title.length, `${locale} title too long`).toBeLessThanOrEqual(60);
      expect(
        description.length,
        `${locale} description too long`,
      ).toBeLessThanOrEqual(155);
    }
  });

  it("keeps every layer-1 summary to a single short sentence", () => {
    for (const locale of locales) {
      for (const section of dictionaries[locale].sections) {
        expect(
          section.summary.length,
          `${locale} §${section.number} summary too long`,
        ).toBeLessThanOrEqual(160);
      }
    }
  });

  it("keeps article numbers out of the layer-1 summaries", () => {
    // Layer 1 is the plain-language layer; article citations belong in `body`.
    for (const section of dictionaries.es.sections) {
      expect(
        section.summary.toLowerCase(),
        `es §${section.number} summary cites an article`,
      ).not.toMatch(/\bart\.?\s*\d/);
    }
  });
});
