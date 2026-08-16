"use client";

// Registers the salon's WebMCP tools so a visitor's AI agent can answer
// questions about Ritual and move around the site, instead of scraping the DOM.
//
// Renders nothing. Mounted once in app/[lang]/layout.tsx, beside the other store
// providers.
//
// Every tool is read-only except the two navigation ones, and none of them
// writes to Firestore, sends a WhatsApp message or creates a consent record —
// that is what makes them safe to expose without a confirmation step.
//
// If document.modelContext is missing (any browser without WebMCP), useWebMCP
// logs once and skips registration; the page is unaffected.
import { useWebMCP } from "usewebmcp";
import { useRouter, usePathname } from "next/navigation";
import { useContactStore } from "../store/contactStore";
import { useLocaleStore } from "../store/localeStore";
import * as t from "../lib/webmcp";
import type { HomeDict } from "../lib/webmcp";

/** Read-only tools that never change state and can be called repeatedly. */
const READ_ONLY = { readOnlyHint: true, idempotentHint: true } as const;

export function ModelContextTools({ home }: { home: HomeDict }) {
  const router = useRouter();
  const pathname = usePathname();
  const chooseLocale = useLocaleStore((s) => s.chooseLocale);
  // Seeded by <ContactStoreProvider> from the layout's single Firestore read.
  const contact = useContactStore((s) => s.facts);

  // `home` is a new object on every server render, so it cannot be a dependency
  // — the locale is what actually decides which language the tools answer in.
  const locale = useLocaleStore((s) => s.locale);

  // --- Services ---------------------------------------------------------

  useWebMCP({
    name: "listTopServices",
    description:
      "List the treatments Ritual offers, as ids and names. Use when someone " +
      "asks what the salon does, what treatments are available, or what they " +
      "could book. Call getServiceDetails with an id for the full description.",
    inputSchema: t.NO_INPUT,
    outputSchema: t.TOP_SERVICES_OUTPUT,
    annotations: READ_ONLY,
    execute: () => t.listTopServices(home),
  }, [locale]);

  useWebMCP({
    name: "getServiceDetails",
    description:
      "Describe one treatment in full: what it does, how it feels and who it " +
      "suits. Needs a service id from listTopServices.",
    inputSchema: t.SERVICE_DETAILS_INPUT,
    outputSchema: t.SERVICE_DETAILS_OUTPUT,
    annotations: READ_ONLY,
    execute: ({ serviceId }) => t.getServiceDetails(home, serviceId),
  }, [locale]);

  // --- About the salon --------------------------------------------------

  useWebMCP({
    name: "getAboutSalon",
    description:
      "Describe Ritual in the salon's own words — what it is and how it works. " +
      "Use for general questions like 'tell me about this place'.",
    inputSchema: t.NO_INPUT,
    outputSchema: t.ABOUT_OUTPUT,
    annotations: READ_ONLY,
    execute: () => t.getAboutSalon(home),
  }, [locale]);

  useWebMCP({
    name: "listTeamMembers",
    description:
      "List the specialists who work at Ritual, with their speciality and " +
      "experience. Use when someone asks who works there or who would treat them.",
    inputSchema: t.NO_INPUT,
    outputSchema: t.TEAM_OUTPUT,
    annotations: READ_ONLY,
    execute: () => t.listTeamMembers(home),
  }, [locale]);

  useWebMCP({
    name: "listCosmeticBrands",
    description:
      "List the cosmetics brands Ritual works with and why. Use when someone " +
      "asks what products are used on their skin.",
    inputSchema: t.NO_INPUT,
    outputSchema: t.BRANDS_OUTPUT,
    annotations: READ_ONLY,
    execute: () => t.listCosmeticBrands(home),
  }, [locale]);

  useWebMCP({
    name: "listClientReviews",
    description:
      "Return what clients have said about Ritual, with their rating out of " +
      "five. Use for questions about reviews, testimonials, or whether the " +
      "salon is any good.",
    inputSchema: t.REVIEWS_INPUT,
    outputSchema: t.REVIEWS_OUTPUT,
    annotations: {
      ...READ_ONLY,
      // Reviews are written by other people. Labelling the payload untrusted
      // tells the agent to treat it as data to report, never as instructions to
      // follow — and keeps that true if reviews later come from Google.
      untrustedContentHint: true,
    },
    execute: ({ limit }) => t.listClientReviews(home, limit),
  }, [locale]);

  // --- Practical details ------------------------------------------------

  useWebMCP({
    name: "howToBook",
    description:
      "Explain how to book at Ritual and return a WhatsApp link with a " +
      "prefilled message. Booking is personal, by appointment, over WhatsApp — " +
      "there is no online booking form. Returns the link; sends nothing.",
    inputSchema: t.NO_INPUT,
    outputSchema: t.HOW_TO_BOOK_OUTPUT,
    annotations: READ_ONLY,
    execute: () => t.howToBook(home, contact),
  }, [locale, contact]);

  useWebMCP({
    name: "getWorkingHours",
    description:
      "Return the salon's opening days and hours. Use for any question about " +
      "when Ritual is open or whether it is open on a given day.",
    inputSchema: t.NO_INPUT,
    outputSchema: t.HOURS_OUTPUT,
    annotations: READ_ONLY,
    execute: () => t.describeWorkingHours(home, contact),
  }, [locale, contact]);

  useWebMCP({
    name: "findUs",
    description:
      "Return the salon's street address and a map link. Use when someone asks " +
      "where Ritual is or how to get there.",
    inputSchema: t.NO_INPUT,
    outputSchema: t.FIND_US_OUTPUT,
    annotations: READ_ONLY,
    execute: () => t.findUs(contact),
  }, [contact]);

  useWebMCP({
    name: "getContactDetails",
    description:
      "Return the salon's WhatsApp number and Instagram profile. Use when " +
      "someone asks how to contact or follow Ritual.",
    inputSchema: t.NO_INPUT,
    outputSchema: t.CONTACT_OUTPUT,
    annotations: READ_ONLY,
    execute: () => t.getContactDetails(contact),
  }, [contact]);

  useWebMCP({
    name: "getSpokenLanguages",
    description:
      "Return the languages spoken at Ritual. Use when someone asks whether " +
      "the staff speak a language. To change the site's language instead, use " +
      "switchLanguage.",
    inputSchema: t.NO_INPUT,
    outputSchema: t.LANGUAGES_OUTPUT,
    annotations: READ_ONLY,
    execute: () => t.getSpokenLanguages(home),
  }, [locale]);

  // --- Navigation -------------------------------------------------------
  // Not read-only: these change what the visitor is looking at, so an agent
  // should consider confirming first.

  useWebMCP({
    name: "switchLanguage",
    description:
      "Switch the website to English, Spanish or Russian and remember the " +
      "choice. Use when someone cannot read the current language or asks for " +
      "another one.",
    inputSchema: t.SWITCH_LANGUAGE_INPUT,
    outputSchema: t.ACTION_OUTPUT,
    annotations: { readOnlyHint: false, idempotentHint: false },
    execute: ({ language }) => {
      // The schema enum is a hint to the agent, not a boundary — re-check here.
      if (!t.isSiteLanguage(language)) {
        return { ok: false, message: "Ritual's site is in English, Spanish and Russian only." };
      }
      chooseLocale(language); // persists to the ritual:lang cookie
      router.push(t.localePath(pathname, language));
      return { ok: true, message: `Switched the site to ${language}.` };
    },
  }, [pathname]);

  useWebMCP({
    name: "scrollToSection",
    description:
      "Scroll the home page to a section: top, aboutus (the team), reviews, or " +
      "contact (address, hours and map). Only works on the home page.",
    inputSchema: t.SCROLL_INPUT,
    outputSchema: t.ACTION_OUTPUT,
    annotations: { readOnlyHint: false, idempotentHint: true },
    execute: ({ section }) => {
      if (!t.isSectionName(section)) {
        return { ok: false, message: "That section doesn't exist on this page." };
      }

      const target = document.getElementById(t.SECTION_IDS[section]);
      if (!target) {
        return { ok: false, message: "That section is only on the home page." };
      }

      target.scrollIntoView({ behavior: "smooth" });
      return { ok: true, message: `Scrolled to ${section}.` };
    },
  }, []);

  return null;
}
