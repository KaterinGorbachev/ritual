import type { Metadata } from "next";
import { getDictionary, toLocale } from "../dictionaries";
import { Section } from "../../ui/Section";
import { LegalSection, type LegalSectionData } from "../../ui/LegalSection";
import { LegalTableOfContents } from "../../ui/LegalTableOfContents";
import { PrintButton } from "../../ui/PrintButton";
import { JsonLd } from "../../lib/jsonLd";
import { absUrl, SITE_URL, WEBSITE_ID } from "../../lib/site";
import { LOCALES, DEFAULT_LOCALE } from "../../lib/locales";

// The privacy policy. Everything on this page comes from the `privacy` block of
// the dictionaries, so adding or reordering a section is a content-only change
// — the numbering, the table of contents and the anchors all follow the data.
//
// No bubble canvas here, deliberately: this is a document people read when they
// are worried about something, and DESIGN.md reserves the expressive animation
// for the marketing surfaces.

function languageAlternates(suffix: string) {
  const map: Record<string, string> = {};
  for (const l of LOCALES) map[l] = `/${l}${suffix}`;
  map["x-default"] = `/${DEFAULT_LOCALE}${suffix}`;
  return map;
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  const locale = toLocale(lang);
  const dict = await getDictionary(locale);
  const meta = dict.privacy.meta;

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: languageAlternates("/privacy"),
    },
    openGraph: {
      type: "article",
      siteName: "Ritual",
      locale,
      url: `/${locale}/privacy`,
      title: meta.title,
      description: meta.description,
    },
    // A privacy policy should be indexed: people look for it, and an
    // unreachable one is worth nothing.
    robots: { index: true, follow: true },
  };
}

/** Render the ISO date from the dictionaries in the reader's own locale. */
function formatDate(iso: string, locale: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default async function PrivacyPage({
  params,
}: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  const locale = toLocale(lang);
  const dict = await getDictionary(locale);
  const { meta, sections } = dict.privacy as unknown as {
    meta: Record<string, string>;
    sections: LegalSectionData[];
  };

  const canonical = absUrl(`/${locale}/privacy`);

  return (
    <Section className="relative w-full px-4 md:px-8 lg:px-24">
      {/* Everything claimed here is visible on the page — the standing rule
          from CLAUDE.md. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${canonical}#webpage`,
          url: canonical,
          name: meta.title,
          description: meta.description,
          inLanguage: locale,
          isPartOf: { "@id": WEBSITE_ID },
          dateModified: meta.dateLastModification,
          publisher: { "@id": `${SITE_URL}/#business` },
        }}
      />

      <div className="flex w-full max-w-400 flex-col gap-10 py-10 lg:gap-14 lg:py-18">
        {/* --- Layer 0: what the page is, and when it last changed --- */}
        <header className="flex w-full flex-col items-center justify-center gap-6 lg:gap-10">
          <div className="flex flex-col gap-3 items-center justify-center">
            <p className="font-handwriting text-3xl leading-none text-magenta">
              {meta.eyebrow}
            </p>
            <h1 className="text-balance font-display text-[clamp(2.5rem,7vw,3rem)] font-semibold tracking-wider text-ink">
              {meta.title}
            </h1>
            <p className="max-w-prose font-body text-lg leading-relaxed text-ink/80 md:text-xl text-center">
              {meta.intro}
            </p>
          </div>

          <div className="flex w-full flex-wrap items-end justify-between gap-4 pt-2">
            <div className="flex flex-col gap-1">
              <p className="font-body text-sm text-ink/70">
                {meta.updatedLabel}:{" "}
                <time
                  dateTime={meta.dateLastModification}
                  className="font-bold"
                >
                  {formatDate(meta.dateLastModification, locale)}
                </time>
              </p>
              <p className="max-w-prose font-body text-sm text-ink/70">
                {meta.authoritativeNote}
              </p>
            </div>

            {/* Prints from the live page via the browser's own dialog, so the
                sheet can never go stale against the policy above it. */}
            <PrintButton label={meta.printLabel} />
          </div>
        </header>

        {/* --- The document: sticky contents beside the sections ---

            A sticky element can only travel inside its own containing block, so
            the nav's wrapper must be TALLER than the nav. On `lg` the wrapper is
            the short left column, which is why it carries `self-start` and the
            stickiness itself. Below `lg` the nav is a 50px collapsed bar whose
            wrapper is also 50px — it would have nowhere to go — so there the
            nav is pulled out of the flow and pinned against this whole row
            instead. */}
        <div className="relative flex w-full flex-col gap-6 lg:flex-row lg:items-start lg:gap-14">
          <div className="sticky top-2 z-30 w-full self-start lg:top-24 lg:w-80 lg:shrink-0 print:hidden">
            <LegalTableOfContents
              sections={sections.map(({ number, id, heading }) => ({
                number,
                id,
                heading,
              }))}
              label={meta.tocLabel}
              heading={meta.tocLabel}
            />
          </div>

          <div className="flex w-full min-w-0 flex-col gap-10">
            {sections.map((section) => (
              <LegalSection
                key={section.id}
                section={section}

              />
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
