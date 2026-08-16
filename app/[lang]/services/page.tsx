import { getDictionary, toLocale } from "../dictionaries";
import { Section } from "../../ui/Section";
import { BubbleCanvas } from "../../ui/BubbleCanvas";
import { ServicePriceList } from "../../ui/ServicePriceList";
import { WhatsAppButton } from "../../ui/WhatsAppButton";
import { BookingSelectForm } from "@/app/ui/BookingSelectForm";

// Services & Prices. Reuses app/[lang]/layout.tsx (header + footer) via the
// App Router's nested layouts — this page only renders <main>'s children.
//
// The signature moment (per DESIGN.md): a single liquid-glass bubble field,
// fixed and centred *behind* the content, so as the reader scrolls it shows
// through the gaps between the three price containers.
export default async function ServicesPage({ params }: PageProps<"/[lang]/services">) {
  const { lang } = await params;
  const locale = toLocale(lang);
  const dict = await getDictionary(locale);
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
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden px-4"
      >
        <div className="sticky top-0 mx-auto flex h-screen items-center justify-center rounded-pill overflow-hidden ">
          <div className="h-full w-full">
            {/* Still, not animated: the same bubbles as the hero, drawn once.
                They sit behind the price text, so they must not move. */}
            <BubbleCanvas still />
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col items-center justify-center bg-cream/89 rounded-pill mb-8 lg:mb-10 ">
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
      <div className="flex w-full flex-col items-center gap-10 lg:gap-14 py-12 px-2">
        <ServicePriceList
          from={page.from}
          categories={JSON.parse(JSON.stringify(page.categories))}
          eyebrow={page.eyebrow}
          title={page.title}
          description={page.description}
          searchLabel={page.searchLabel}
          searchPlaceholder={page.searchPlaceholder}
          emptyText={page.emptyText}
          noResultsText={page.noResults}
          durationLabel={page.durationLabel}
          bookLabel={page.bookLabel}
          bookMessage={page.bookMessage}
        />

        
      </div>

      {/* One primary CTA — booking always happens personally on WhatsApp. */}
      <div className="flex w-full bg-blush/60 py-12 px-4 items-center justify-center ">
        <div className="flex flex-col items-center md:flex-row md:items-start gap-3 rounded-pill bg-cream/95 px-6 py-6 text-start shadow-sm backdrop-blur-md max-w-[1024px]gap-4 md:gap-8 lg:gap-10">
          <div className="rounded-pill overflow-hidden flex items-center justify-center">
            <img src="/gepard.jpg" alt="gepard"  />

          </div>

          <BookingSelectForm defaultLang={locale} categoryLabel={dict.serviceCategory.label} categoryPlaceholder={dict.serviceCategory.placeholder} languageLabel={dict.serviceCategory.lang}bookLabel={dict.topServices.cta} formTitle={dict.topServices.ctaQuestion}
          >

          </BookingSelectForm>

          
          
          
        </div>
        
      

      </div>
      
    </Section>
  );
}
