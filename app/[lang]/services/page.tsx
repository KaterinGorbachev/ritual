import { getDictionary, toLocale } from "../dictionaries";
import { Section } from "../../ui/Section";
import { BubbleField } from "../../ui/BubbleField";
import { ServicePriceList } from "../../ui/ServicePriceList";
import { WhatsAppButton } from "../../ui/WhatsAppButton";

// Services & Prices. Reuses app/[lang]/layout.tsx (header + footer) via the
// App Router's nested layouts — this page only renders <main>'s children.
//
// The signature moment (per DESIGN.md): a single liquid-glass bubble field,
// fixed and centred *behind* the content, so as the reader scrolls it shows
// through the gaps between the three price containers.
export default async function ServicesPage({ params }: PageProps<"/[lang]/services">) {
  const { lang } = await params;
  const dict = await getDictionary(toLocale(lang));
  const page = dict.servicesPage;

  return (
    <Section className="relative isolate w-full overflow-clip">
      {/* Transparent, always-behind bubble backdrop. Absolutely positioned and
          clipped to THIS section (the Section is relative + overflow-hidden), so
          the animation stays on the page's main content only — never over the
          layout header above or the footer below. A sticky inner layer keeps
          the bubbles centred in view as the section scrolls past. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="sticky top-35 mx-auto flex h-screen max-w-[1600px] items-center justify-center rounded-pill overflow-hidden ">
          <div className="h-[70vh] w-full">
            <BubbleField />
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col items-center justify-center bg-cream rounded-pill mb-8 lg:mb-10">
        {/* --- Page header: eyebrow, title, description, then the search bar --- */}
        <header className="flex w-full flex-col items-center gap-3 text-center  py-8 px-4 max-w-3xl">
          <p className="font-handwriting text-3xl leading-none text-magenta">{page.eyebrow}</p>
          <h1 className="text-balance font-display text-[clamp(2.5rem,7vw,3rem)] font-semibold tracking-wider text-ink">
            {page.title}
          </h1>
          <p className="max-w-2xl font-body text-lg leading-relaxed text-ink/80 md:text-xl">
            {page.description}
          </p>

          
        </header>
      </div>

      {/* --- Page header (with the search bar) + the category lists --- */}
      <div className="flex w-full max-w-400 flex-col items-center gap-10 px-4 md:px-8 lg:gap-14 ">
        <ServicePriceList
          categories={JSON.parse(JSON.stringify(page.categories))}
          eyebrow={page.eyebrow}
          title={page.title}
          description={page.description}
          searchLabel={page.searchLabel}
          searchPlaceholder={page.searchPlaceholder}
          emptyText={page.emptyText}
          noResultsText={page.noResults}
          durationLabel={page.durationLabel}
        />

        {/* One primary CTA — booking always happens personally on WhatsApp. */}
        <div className="flex flex-col items-center gap-3 rounded-pill bg-cream/70 px-6 py-6 text-center shadow-sm backdrop-blur-md">
          <p className="max-w-md font-body text-base text-ink/80">{dict.topServices.ctaComment}</p>
          <WhatsAppButton message={dict.topServices.message}>
            <span className="font-body text-lg text-ink">{dict.topServices.cta}</span>
          </WhatsAppButton>
        </div>
      </div>
    </Section>
  );
}
