import type { Metadata } from "next";
import { Playfair_Display, Nunito, Caveat } from "next/font/google";
import "../globals.css";
import { getDictionary, toLocale } from "./dictionaries";
import { NavLink } from "../ui/NavLink";
import { Dropdown } from "../ui/Dropdown";
import { LangButton } from "../ui/LangButton";
import { WhatsAppButton } from "../ui/WhatsAppButton";
import { FooterContactDetails } from "../ui/FooterContactDetails";

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

export const metadata: Metadata = {
  title: "Ritual",
  description: "Ritual massage salon",
  alternates: {
    // hreflang alternates so search engines know these are language variants.
    languages: {
      en: "/en",
      ru: "/ru",
      es: "/es",
      "x-default": "/es",
    },
  },
};

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  const dict = await getDictionary(toLocale(lang));

  return (
    <html
      lang={lang}
      className={`${playfair.variable} ${nunito.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col items-center scroll-smooth bg-cream text-ink font-body">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:left-4 focus:top-4 btn-primary"
          data-testid="skip-to-content"
        >
          Skip to content
        </a>

        <header
          className="flex items-center justify-center w-full sticky top-2 max-w-400 z-40 min-h-[5vh]  px-2 "
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
                      <NavLink href="#about">{dict.nav.about}</NavLink>
                    </li>
                    <li>
                      <NavLink href="#services">{dict.nav.services}</NavLink>
                    </li>
                    <li>
                      <NavLink href="#faqs">{dict.nav.faqs}</NavLink>
                    </li>
                    <li>
                      <NavLink href="#contact">{dict.nav.contact}</NavLink>
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

            <div className="flex flex-row-reverse items-center gap-2 ">
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
                      <NavLink href="#about">{dict.nav.about}</NavLink>
                    </li>
                    <li>
                      <NavLink href="#services">{dict.nav.services}</NavLink>
                    </li>
                    <li>
                      <NavLink href="#faqs">{dict.nav.faqs}</NavLink>
                    </li>
                    <li>
                      <NavLink href="#contact">{dict.nav.contact}</NavLink>
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
            </div>
          </div>
        </header>

        <main
          id="main"
          className="flex flex-col items-center justify-center w-full flex-1 px-4 scroll-mt-24"
        >
          {children}
        </main>

        <footer className="flex flex-col items-center justify-center w-full ">
          <section id="visit" className="flex  items-center justify-center  w-full bg-gradient-to-b from-cream via-blush/20 to-blush/80 pt-16 lg:pt-32 pb-8 px-2">
            <div className="flex flex-col items-center justify-center gap-4 text-center rounded-pill bg-cream/80 py-6 px-4 min-h-40 shadow-[inset_0_0_0_1px_rgba(26,26,26,0.06),0_1px_0_rgba(255,255,255,0.7)] max-w-400">
              <FooterContactDetails address={dict.footer.address} hours={dict.footer.workingHours} commentAboutAppointments={dict.footer.commentAboutAppointments} daysOfWeek={JSON.parse(JSON.stringify(dict.daysOfWeek))} ariaLabelMapBox={dict.ariaLabels.map} ariaLabelGoogleMapButton={dict.ariaLabels.googleMapButton} />
            
              
            </div>
          </section>
          <section className="flex flex-col gap-12 items-center justify-center  w-full bg-gradient-to-b from-blush/80 to-blush pt-10 pb-6 px-4">
            <div className="flex flex-row flex-wrap items-center justify-center gap-4 max-w-400">
              <NavLink href="">{dict.nav.blog}</NavLink>
              <NavLink href="">{dict.footer.privacyPolicy}</NavLink>
              <NavLink href="">{dict.footer.contactUs}</NavLink>
            </div>
            <p className="text-sm text-ink/70 text-center">
              &copy; 2026 Ritual. {dict.footer.rightsReserved} - {dict.footer.designedBy} <a href="https://www.linkedin.com/in/katerina-gorbacheva-93717324a/" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline text-iris">
                Katerina Gorbacheva
              </a>
            </p>
          </section>
        </footer>
      </body>
    </html>
  );
}
          