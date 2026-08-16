import type { Metadata } from "next";
import { Playfair_Display, Nunito, Caveat } from "next/font/google";
import "../globals.css";
import { getDictionary, toLocale } from "./dictionaries";
import { NavLink } from "../ui/NavLink";
import { Dropdown } from "../ui/Dropdown";
import { LangButton } from "../ui/LangButton";
import { WhatsAppButton } from "../ui/WhatsAppButton";
import { WhatsAppStoreProvider } from "../ui/WhatsAppStoreProvider";
import { LocaleStoreProvider } from "../ui/LocaleStoreProvider";
import { FooterContactDetails, type ContactDataItem } from "../ui/FooterContactDetails";
import { MotionProvider } from "../ui/MotionContext";
import { StopAnimationsButton } from "../ui/StopAnimationsButton";
import { getInfo } from "../lib/handleData";
import { JsonLd, buildBusinessLd, buildWebsiteLd } from "../lib/jsonLd";
import { SITE_URL } from "../lib/site";
import { LOCALES, DEFAULT_LOCALE } from "../lib/locales";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
});

const nunito = Nunito({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
});

const caveat = Caveat({
  variable: "--font-handwriting",
  subsets: ["latin"],
});

// Prerender all three locales as static HTML at build time.
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

// Without this, toLocale() falls back to "es" for any unrecognised segment, so
// /xx, /foo and /pizza each returned 200 with the full Spanish homepage —
// unbounded duplicate URLs. Now they 404.
export const dynamicParams = false;

// hreflang alternates so search engines treat the locales as variants of one page
// rather than competitors. Takes a suffix so /services can reuse it later —
// otherwise every page would advertise the locale roots as its siblings.
function languageAlternates(suffix = "") {
  const map: Record<string, string> = {};
  for (const l of LOCALES) map[l] = `/${l}${suffix}`;
  map["x-default"] = `/${DEFAULT_LOCALE}${suffix}`;
  return map;
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const locale = toLocale(lang);
  const dict = await getDictionary(locale);

  return {
    // Required for the hreflang/canonical URLs below to resolve as absolute.
    // Google silently discards relative hreflang hrefs, so without this the
    // whole multilingual setup does nothing.
    metadataBase: new URL(SITE_URL),
    title: { default: dict.seo.home.title, template: "%s · Ritual" },
    description: dict.seo.home.description,
    keywords: dict.seo.home.keywords,
    alternates: {
      canonical: `/${locale}`,
      languages: languageAlternates(),
    },
    openGraph: {
      type: "website",
      siteName: "Ritual",
      locale,
      alternateLocale: LOCALES.filter((l) => l !== locale),
      url: `/${locale}`,
      title: dict.seo.home.title,
      description: dict.seo.home.description,
    },
    twitter: { card: "summary_large_image" },
    robots: {
      index: true,
      follow: true,
      // max-snippet: -1 lifts the cap on how much text may be quoted, which is
      // what lets AI Overviews use more than a truncated fragment.
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  const locale = toLocale(lang);
  const dict = await getDictionary(toLocale(lang));

  // Single read of the whole contactData collection for the entire page. From it
  // we (1) derive the site-wide WhatsApp number and seed the Zustand store so
  // client booking buttons can build wa.me links without their own Firestore read,
  // and (2) pass the docs to the footer so it doesn't read the same collection
  // again. Degrades to empty docs/number if the read fails — everything still
  // renders (links just unnumbered, footer fields blank).
  const contact = await getInfo("contactData");
  const contactDocs = contact.ok ? (contact.data as ContactDataItem[]) : [];
  const whatsAppNumber =
    contactDocs.find((d) => d.id === "messanger")?.telephone ?? "";

  return (
    <html
      lang={locale}
      className={`${playfair.variable} ${nunito.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col items-center scroll-smooth bg-cream text-ink font-body">
        {/* Structured data for search engines and AI assistants. Built from the
            contactDocs already read above, so no extra Firestore calls. */}
        <JsonLd
          data={buildBusinessLd({
            locale,
            contactDocs,
            description: dict.seo.home.description,
            bookLabel: dict.hero.cta,
            staff: dict.staff,
          })}
        />
        <JsonLd data={buildWebsiteLd()} />
        <MotionProvider>
        <WhatsAppStoreProvider number={whatsAppNumber} />
        <LocaleStoreProvider locale={locale} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:left-4 focus:top-4 btn-primary"
          data-testid="skip-to-content"
        >
          Skip to content
        </a>

        <header
          className="flex flex-col gap-2 items-center justify-center w-full sticky top-2 max-w-400 z-40 min-h-[5vh]  px-2 "
          data-testid="header"
        >
          <div className="flex items-center justify-between w-full px-2 md:px-4 pt-3 pb-2 gap-4 shadow-sm bg-cream/85 backdrop-blur-md border-b border-mauve/30 rounded-pill">
            <div
              className="flex items-center justify-center "
              aria-label="Primary"
            >
              <a
                href="./#main"
                className="items-center gap-2 rounded-pill hidden md:flex"
                aria-label="Aurelle home"
              >
                <div className="w-10 h-10 overflow-hidden flex items-center justify-center rounded-full">
                  <img
                    src="/Logo-Ritual-Copyright_All-rights-reserved.webp"
                    alt="Ritual logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-display text-2xl font-semibold tracking-normal ">
                  Ritual
                </span>
              </a>

              <div >
                <nav>
                  <ul className="hidden lg:flex items-center gap-4 ml-4">
                    <li>
                      <NavLink href="/#aboutus">{dict.nav.about}</NavLink>
                    </li>
                    {/*<li>
                      <NavLink href="/services">{dict.nav.services}</NavLink>
                    </li>
                    <li>
                      <NavLink href="#faqs">{dict.nav.faqs}</NavLink>
                    </li>*/}
                    <li>
                      <NavLink href="/#contact">{dict.nav.contact}</NavLink>
                    </li>
                    <li>
                      <NavLink
                        href="https://www.instagram.com/ritual.beauty_estetica"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {dict.nav.instagram}
                      </NavLink>
                    </li>
                  </ul>
                </nav>
              </div>
              <WhatsAppButton
                
                message={dict.nav.message}
                className="inline-flex md:ml-6"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  className="text-ink"
                >
                  <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.4 13.9c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7s-3.7-3.2-3.8-3.4c-.1-.2-.9-1.2-.9-2.3s.6-1.6.8-1.8c.2-.2.4-.3.6-.3h.4c.2 0 .4 0 .6.5l.8 1.9c.1.1.1.3 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.2.6 1 1.3 1.6.9.8 1.6 1 1.8 1.1.2.1.4.1.5-.1l.6-.8c.2-.2.3-.2.6-.1l1.8.9c.2.1.4.2.5.3.1.1.1.6-.1 1.2Z" />
                </svg>
                <span className="hidden md:inline text-ink">
                  {dict.nav.whatsapp}
                </span>
              </WhatsAppButton>
            </div>

            <div className="flex flex-row-reverse lg:flex-row items-center gap-2 ">
              {/* Pages dropdown — UI only */}
              <Dropdown
                className="relative group isolate lg:hidden"
                data-testid="pages-menu"
              >
                <summary
                  aria-label="Toggle menu"
                  className=" cursor-pointer group inline-flex items-center justify-center gap-1.5 rounded-pill min-h-11 min-w-9 px-2 py-2 border-2 border-transparent shadow-sm bg-cream backdrop-blur  transition duration-500 ease-in-out focus:outline-none focus:border-mint hover:bg-cream  hover:border-magenta hover:brightness-95 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed "
                  data-testid="burger-menu-button"
                >
                  <span className="block h-2.5 w-2.5 rounded-full bg-mint transition-colors duration-500 ease-in-out group-focus:bg-lilac group-active:bg-lilac" />
                  <span className="block h-2.5 w-2.5 rounded-full bg-lilac transition-colors duration-500 ease-in-out group-focus:bg-blush group-active:bg-blush" />
                  <span className="block h-2.5 w-2.5 rounded-full bg-blush transition-colors duration-500 ease-in-out group-focus:bg-mint group-active:bg-mint" />
                </summary>
                <nav
                  className="absolute right-0 mt-2 min-w-52 rounded-2xl border-2 border-mauve/30 bg-cream backdrop-blur-md shadow-lg z-50"
                  data-testid="pages-menu-panel"
                >
                  <ul className="flex flex-col gap-4 p-2">
                    <li>
                      <NavLink href="/#aboutus">{dict.nav.about}</NavLink>
                    </li>
                    {/*<li>
                      <NavLink href="/services">{dict.nav.services}</NavLink>
                    </li>
                    <li>
                      <NavLink href="#faqs">{dict.nav.faqs}</NavLink>
                    </li>*/}
                    <li>
                      <NavLink href="/#contact">{dict.nav.contact}</NavLink>
                    </li>
                    <li>
                      <NavLink
                        href="https://www.instagram.com/ritual.beauty_estetica"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {dict.nav.instagram}
                      </NavLink>
                    </li>
                  </ul>
                </nav>
              </Dropdown>

              {/* Language selector dropdown */}
              <LangButton />
              <StopAnimationsButton
                stopWord={dict.hero.stopWord}
                resumeWord={dict.hero.resumeWord}
              />
            </div>
            
          </div>
          <div className="flex items-center justify-end w-full">
            
          </div>
        </header>

        <main
          id="main"
          className="flex flex-col items-center justify-center w-full flex-1  scroll-mt-24"
        >
          
          {children}
        </main>

        <footer className="flex flex-col items-center justify-center w-full ">
          <section id="visit" className="flex  items-center justify-center  w-full bg-gradient-to-b from-blush/60 via-blush/90 to-blush pt-16 lg:pt-32 pb-8 px-2" >
            <div className="flex flex-col items-center justify-center gap-4 text-center rounded-pill bg-cream/80 py-6 px-4 min-h-40 shadow-[inset_0_0_0_1px_rgba(26,26,26,0.06),0_1px_0_rgba(255,255,255,0.7)] max-w-400 scroll-mt-24" id="contact">
              <FooterContactDetails contactDocs={contactDocs} address={dict.footer.address} hours={dict.footer.workingHours} commentAboutAppointments={dict.footer.commentAboutAppointments} daysOfWeek={JSON.parse(JSON.stringify(dict.daysOfWeek))} ariaLabelMapBox={dict.ariaLabels.map} ariaLabelGoogleMapButton={dict.ariaLabels.googleMapButton} />

              {/* Visible counterpart to availableLanguage in the JSON-LD — schema
                  describing content a user can't see gets discounted. */}
              <p className="font-handwriting text-magenta text-2xl leading-normal text-center" data-testid="languages-spoken">
                {dict.seo.languagesSpoken}
              </p>
            </div>
          </section>
          <section className="flex flex-col gap-12 items-center justify-center  w-full bg-gradient-to-b from-blush to-blush pt-10 pb-6 px-4">
            <div className="flex flex-row flex-wrap items-center justify-center gap-4 max-w-400">
              {/*<NavLink href="">{dict.nav.blog}</NavLink>*/}
              <NavLink href={`/${locale}/privacy`}>{dict.footer.privacyPolicy}</NavLink>
              {/*<NavLink href="">{dict.footer.contactUs}</NavLink>*/}
            </div>
            <p className="text-sm text-ink/70 text-center">
              &copy; 2026 Ritual. {dict.footer.rightsReserved} - {dict.footer.designedBy} <a href="https://www.linkedin.com/in/katerina-gorbacheva-93717324a/" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline text-iris">
                Katerina Gorbacheva
              </a>
            </p>
          </section>
        </footer>

        </MotionProvider>
      </body>
    </html>
  );
}
          