import { getDictionary, toLocale } from "../dictionaries";
import { Section } from "../../ui/Section";
import { BubbleCanvas } from "../../ui/BubbleCanvas";
import { ServicePriceList } from "../../ui/ServicePriceList";
import { BookingSelectForm } from "@/app/ui/BookingSelectForm";
import { getInfo } from "@/app/lib/handleData";
import type { Locale } from "@/app/lib/locales";
import type { PriceItem } from "../../ui/ServicePriceList";

// Firestore-backed data is read at build time; re-read it at most hourly.
// The dashboard also calls revalidatePath after adding a service.
export const revalidate = 3600;

/** A document in the "services" collection, as the dashboard saves it. */
type ServiceDoc = {
  id: string;
  type?: string;
  nameRU?: string; nameEN?: string; nameES?: string;
  descriptionRU?: string; descriptionEN?: string; descriptionES?: string;
  time?: number;
  price?: number;
  createdAt?: { toMillis?: () => number };
};

const FIELD_SUFFIX = { en: "EN", es: "ES", ru: "RU" } as const;
const INTL_TAG = { en: "en-GB", es: "es-ES", ru: "ru-RU" } as const;

// One Firestore doc → one card item in the page's language. A doc with no name
// in this language or a bad time/price is skipped rather than rendered half-empty.
function toPriceItem(doc: ServiceDoc, locale: Locale): PriceItem | null {
  const suffix = FIELD_SUFFIX[locale];
  const name = doc[`name${suffix}`]?.trim();
  const { time, price } = doc;
  if (!name || !Number.isFinite(time) || !Number.isFinite(price)) {
    console.error(`ServicesPage: skipping service "${doc.id}" — missing name${suffix}, time or price`);
    return null;
  }
  const tag = INTL_TAG[locale];
  return {
    id: doc.id,
    name,
    description: doc[`description${suffix}`]?.trim() ?? "",
    duration: new Intl.NumberFormat(tag, { style: "unit", unit: "minute" }).format(time!),
    price: new Intl.NumberFormat(tag, {
      style: "currency",
      currency: "EUR",
      trailingZeroDisplay: "stripIfInteger",
    }).format(price!),
  };
}

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

  // Treatments come from Firestore; category titles and blurbs stay in the
  // dictionary. Only plain strings go to the client list, no Timestamps.
  const services = await getInfo("services");
  if (!services.ok) console.error("ServicesPage: could not load services:", services.error);
  const docs = (services.ok ? services.data ?? [] : []) as ServiceDoc[];
  const items = docs
    .toSorted((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0))
    .map((doc) => ({ type: doc.type, item: toPriceItem(doc, locale) }));
  const categories = page.categories.map(({ id, title, blurb }) => ({
    id,
    title,
    blurb,
    items: items.flatMap(({ type, item }) => (type === id && item ? [item] : [])),
  })).filter((c) => c.items.length > 0);

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
        {!services.ok && (
          <p
            role="alert"
            className="w-full max-w-2xl rounded-pill bg-cream/95 px-6 py-6 text-center font-body text-lg leading-relaxed text-ink shadow-sm"
          >
            {page.loadError}
          </p>
        )}
        <ServicePriceList
          from={page.from}
          categories={categories}
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
