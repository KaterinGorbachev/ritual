// WebMCP tool logic for the home page.
//
// WebMCP (document.modelContext) lets a visitor's AI agent call named, described
// tools instead of guessing at the DOM. This module holds the JSON Schemas and
// the pure functions behind each tool; app/ui/ModelContextTools.tsx registers
// them with the useWebMCP hook.
//
// Deliberately free of React and `document` so every function here is directly
// unit-testable — the same discipline as bookingValidation.ts.
//
// Two rules shape everything below:
//
// 1. CHARACTER BUDGETS. Agents truncate or reject oversized payloads. We hold to
//    ~500 chars per tool description, ~150 per parameter description, 30 per
//    name, and 1.5K per tool *output*. Returning every service description at
//    once measured ~3.1K in Spanish, so listing and detail are separate tools.
//
// 2. SCHEMAS ARE MODULE-LEVEL `as const`. useWebMCP re-registers whenever a
//    schema *reference* changes, so building them inside a component would
//    re-register on every render. `as const` is also what drives type inference
//    for the execute() argument.

import type { ContactFacts, DayKey } from "./contactFacts";

/** Longest a truncated free-text field may run before we cut it. */
const TEAM_BIO_LIMIT = 150;
const REVIEW_QUOTE_LIMIT = 200;
/** Reviews returned by default — enough to be representative, small enough to fit. */
const DEFAULT_REVIEW_COUNT = 3;
const MAX_REVIEW_COUNT = 5;

/**
 * Cut to a word boundary and mark the cut with "…".
 *
 * Visible truncation matters: the agent can tell there is more and offer to open
 * the page, rather than silently reporting a half sentence as the whole answer.
 */
export function truncate(text: string, limit: number): string {
  const value = (text ?? "").trim();
  if (value.length <= limit) return value;

  const cut = value.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

// ---------------------------------------------------------------------------
// The slice of the dictionary these tools read.
// ---------------------------------------------------------------------------

export type HomeDict = {
  hero: { title: string; subtitle: string };
  aboutStaff: { title: string };
  topServices: {
    items: ReadonlyArray<{ id: string; name: string; description: string }>;
    message: string;
  };
  staff: ReadonlyArray<{ id: string; name: string; service: string; description?: string }>;
  cosmetics: ReadonlyArray<{ id: string; name: string; description: string }>;
  reviews: {
    items: ReadonlyArray<{ id: string; quote: string; author: string; meta?: string; rating: number }>;
  };
  nav: { message: string };
  footer: { commentAboutAppointments: string };
  daysOfWeek: Record<DayKey, string>;
  languagesSpoken: string;
};

/** Every tool takes no arguments unless stated — this is the shared empty schema. */
export const NO_INPUT = { type: "object", properties: {} } as const;

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export const TOP_SERVICES_OUTPUT = {
  type: "object",
  properties: {
    services: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "Pass to getServiceDetails for the full description." },
          name: { type: "string", description: "Treatment name." },
        },
        required: ["id", "name"],
        additionalProperties: false,
      },
    },
  },
  required: ["services"],
  additionalProperties: false,
} as const;

/**
 * Names and ids only. The full descriptions total ~3K characters, over the
 * per-output budget, so the agent lists first and drills in with
 * getServiceDetails — which is also less to read when the question is just
 * "do you do facials?".
 */
export function listTopServices(dict: HomeDict) {
  return {
    services: dict.topServices.items.map(({ id, name }) => ({ id, name })),
  };
}

export const SERVICE_DETAILS_INPUT = {
  type: "object",
  properties: {
    serviceId: {
      type: "string",
      description: "Service id from listTopServices, e.g. 'microcurrent'.",
    },
  },
  required: ["serviceId"],
  additionalProperties: false,
} as const;

export const SERVICE_DETAILS_OUTPUT = {
  type: "object",
  properties: {
    found: { type: "boolean", description: "False when no service has that id." },
    name: { type: "string", description: "Treatment name." },
    description: { type: "string", description: "What the treatment does." },
    message: { type: "string", description: "Explanation when found is false." },
  },
  required: ["found"],
  additionalProperties: false,
} as const;

/**
 * One service in full.
 *
 * `serviceId` arrives from a model and is therefore untrusted: look it up with
 * an explicit find over our own array rather than indexing an object, so a value
 * like "__proto__" can only ever miss.
 */
export function getServiceDetails(dict: HomeDict, serviceId: unknown) {
  const id = typeof serviceId === "string" ? serviceId : "";
  const match = dict.topServices.items.find((item) => item.id === id);

  if (!match) {
    return {
      found: false,
      message: "No treatment with that id. Call listTopServices for the current list.",
    };
  }
  return { found: true, name: match.name, description: match.description };
}

// ---------------------------------------------------------------------------
// About, team, brands
// ---------------------------------------------------------------------------

export const ABOUT_OUTPUT = {
  type: "object",
  properties: {
    name: { type: "string", description: "The salon's name." },
    tagline: { type: "string", description: "The salon's own one-line pitch." },
    about: { type: "string", description: "What the salon does, in its own words." },
  },
  required: ["name", "about"],
  additionalProperties: false,
} as const;

/** The salon in its own words, straight from the hero copy. */
export function getAboutSalon(dict: HomeDict) {
  return {
    name: "Ritual",
    tagline: dict.hero.title,
    about: dict.hero.subtitle,
  };
}

export const TEAM_OUTPUT = {
  type: "object",
  properties: {
    team: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Specialist's name." },
          speciality: { type: "string", description: "Their focus and experience." },
          about: { type: "string", description: "Short bio, may be truncated." },
        },
        required: ["name", "speciality"],
        additionalProperties: false,
      },
    },
  },
  required: ["team"],
  additionalProperties: false,
} as const;

/** The specialists. Bios are truncated — the page carries the full text. */
export function listTeamMembers(dict: HomeDict) {
  return {
    team: dict.staff.map((member) => ({
      name: member.name,
      speciality: member.service,
      about: truncate(member.description ?? "", TEAM_BIO_LIMIT),
    })),
  };
}

export const BRANDS_OUTPUT = {
  type: "object",
  properties: {
    brands: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Brand name." },
          description: { type: "string", description: "Why the salon uses it." },
        },
        required: ["name"],
        additionalProperties: false,
      },
    },
  },
  required: ["brands"],
  additionalProperties: false,
} as const;

/** The cosmetics brands the salon works with. */
export function listCosmeticBrands(dict: HomeDict) {
  return {
    brands: dict.cosmetics.map(({ name, description }) => ({ name, description })),
  };
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export const REVIEWS_INPUT = {
  type: "object",
  properties: {
    limit: {
      type: "integer",
      description: "How many reviews to return, 1-5. Defaults to 3.",
      minimum: 1,
      maximum: MAX_REVIEW_COUNT,
    },
  },
  additionalProperties: false,
} as const;

export const REVIEWS_OUTPUT = {
  type: "object",
  properties: {
    reviews: {
      type: "array",
      items: {
        type: "object",
        properties: {
          quote: { type: "string", description: "The client's words, may be truncated." },
          author: { type: "string", description: "Who wrote it." },
          rating: { type: "integer", description: "Their rating out of 5." },
        },
        required: ["quote", "author", "rating"],
        additionalProperties: false,
      },
    },
    total: { type: "integer", description: "How many reviews exist in total." },
  },
  required: ["reviews", "total"],
  additionalProperties: false,
} as const;

/**
 * Client testimonials.
 *
 * Capped and truncated to stay inside the output budget — the full set measured
 * ~1.07K, which left no headroom.
 *
 * Note what is NOT returned: dict.reviews.ratingSummary. That is display copy
 * with a comma decimal in es/ru ("4,9 de 240+ rituales") and must never be
 * machine-parsed into a number — the same reason aggregateRating stays out of
 * the JSON-LD until the figures are verifiable.
 */
export function listClientReviews(dict: HomeDict, limit?: unknown) {
  const requested = typeof limit === "number" && Number.isFinite(limit)
    ? Math.floor(limit)
    : DEFAULT_REVIEW_COUNT;
  const count = Math.min(Math.max(requested, 1), MAX_REVIEW_COUNT);

  return {
    reviews: dict.reviews.items.slice(0, count).map((review) => ({
      quote: truncate(review.quote, REVIEW_QUOTE_LIMIT),
      author: review.author,
      rating: review.rating,
    })),
    total: dict.reviews.items.length,
  };
}

// ---------------------------------------------------------------------------
// Booking, hours, location, contact
// ---------------------------------------------------------------------------

export const HOW_TO_BOOK_OUTPUT = {
  type: "object",
  properties: {
    howToBook: { type: "string", description: "How booking works, in a sentence." },
    whatsAppLink: { type: "string", description: "wa.me link with a prefilled message." },
  },
  required: ["howToBook"],
  additionalProperties: false,
} as const;

/**
 * Booking runs entirely through WhatsApp — there is no online booking form.
 *
 * Returns the link; it never opens or sends anything. A person still writes the
 * message, which is what keeps this tool safe to expose without a confirmation
 * step.
 */
export function howToBook(dict: HomeDict, contact: ContactFacts | null) {
  const number = contact?.whatsAppNumber ?? "";
  const appointmentNote = dict.footer.commentAboutAppointments;

  if (!number) {
    return {
      howToBook: `Booking is by appointment, arranged personally over WhatsApp. ${appointmentNote}.`,
    };
  }

  return {
    howToBook: `Booking is by appointment, arranged personally over WhatsApp. ${appointmentNote}. Open the link and send the message to ask for a time.`,
    whatsAppLink: `https://wa.me/${number}?text=${encodeURIComponent(dict.nav.message)}`,
  };
}

export const HOURS_OUTPUT = {
  type: "object",
  properties: {
    hours: { type: "string", description: "Opening days and times, in a sentence." },
  },
  required: ["hours"],
  additionalProperties: false,
} as const;

/**
 * Opening hours as a sentence an agent can relay verbatim, rather than fields it
 * has to reassemble.
 */
export function describeWorkingHours(dict: HomeDict, contact: ContactFacts | null) {
  const hours = contact?.hours;
  const appointmentNote = dict.footer.commentAboutAppointments;

  if (!hours) {
    return {
      hours: "Opening hours aren't listed right now — please ask on WhatsApp.",
    };
  }

  const dayStart = hours.dayStart ? dict.daysOfWeek[hours.dayStart] : "";
  const dayEnd = hours.dayEnd ? dict.daysOfWeek[hours.dayEnd] : "";
  const days = dayStart && dayEnd ? `${dayStart}–${dayEnd}, ` : "";

  return {
    hours: `Ritual is open ${days}${hours.from}–${hours.to}. ${appointmentNote}.`,
  };
}

export const FIND_US_OUTPUT = {
  type: "object",
  properties: {
    address: { type: "string", description: "Street address of the salon." },
    mapLink: { type: "string", description: "Google Maps link to the salon." },
    message: { type: "string", description: "Explanation when the address is unavailable." },
  },
  additionalProperties: false,
} as const;

/** Where the salon is, plus a map link. */
export function findUs(contact: ContactFacts | null) {
  if (!contact?.address) {
    return { message: "The address isn't available right now — please ask on WhatsApp." };
  }
  return {
    address: contact.address,
    ...(contact.mapLink && { mapLink: contact.mapLink }),
  };
}

export const CONTACT_OUTPUT = {
  type: "object",
  properties: {
    whatsApp: { type: "string", description: "WhatsApp number in international form." },
    instagram: { type: "string", description: "Instagram profile URL." },
    message: { type: "string", description: "Explanation when no details are available." },
  },
  additionalProperties: false,
} as const;

/** How to reach the salon. */
export function getContactDetails(contact: ContactFacts | null) {
  const whatsApp = contact?.telephone ?? "";
  const instagram = contact?.instagramUrl ?? "";

  if (!whatsApp && !instagram) {
    return { message: "Contact details aren't available right now." };
  }
  return {
    ...(whatsApp && { whatsApp }),
    ...(instagram && { instagram }),
  };
}

export const LANGUAGES_OUTPUT = {
  type: "object",
  properties: {
    languages: {
      type: "array",
      description: "Language codes the salon speaks.",
      items: { type: "string" },
    },
    summary: { type: "string", description: "The same, as a sentence." },
  },
  required: ["languages", "summary"],
  additionalProperties: false,
} as const;

/**
 * Languages spoken at the salon. Answers "do they speak Russian?" — a question,
 * not a request to change the site language (that is switchLanguage).
 */
export function getSpokenLanguages(dict: HomeDict) {
  return {
    languages: ["es", "en", "ru"],
    summary: dict.languagesSpoken,
  };
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export const SITE_LANGUAGES = ["en", "es", "ru"] as const;
export type SiteLanguage = (typeof SITE_LANGUAGES)[number];

export const SWITCH_LANGUAGE_INPUT = {
  type: "object",
  properties: {
    language: {
      type: "string",
      enum: SITE_LANGUAGES,
      description: "Language to switch to: en, es or ru.",
    },
  },
  required: ["language"],
  additionalProperties: false,
} as const;

export const ACTION_OUTPUT = {
  type: "object",
  properties: {
    ok: { type: "boolean", description: "Whether the action was carried out." },
    message: { type: "string", description: "What happened, in a sentence." },
  },
  required: ["ok", "message"],
  additionalProperties: false,
} as const;

/**
 * Home-page section ids an agent may scroll to.
 *
 * A closed map, not a free string: the value comes from a model and is used to
 * look up an element. Mapping through this table means an unexpected value can
 * only miss, never reach something it shouldn't.
 */
export const SECTION_IDS = {
  top: "main",
  aboutus: "aboutus",
  reviews: "reviews",
  contact: "contact",
} as const;

export type SectionName = keyof typeof SECTION_IDS;

export const SCROLL_INPUT = {
  type: "object",
  properties: {
    section: {
      type: "string",
      enum: Object.keys(SECTION_IDS),
      description: "Section: top, aboutus, reviews or contact.",
    },
  },
  required: ["section"],
  additionalProperties: false,
} as const;

/**
 * Is this one of the three languages the site is built in?
 *
 * The JSON Schema `enum` above is a hint to the agent, not an enforced boundary
 * — a confused or prompt-injected model can still send anything, so the value is
 * re-checked here before it reaches the router.
 */
export function isSiteLanguage(value: unknown): value is SiteLanguage {
  return typeof value === "string" && (SITE_LANGUAGES as readonly string[]).includes(value);
}

/** Same reasoning as isSiteLanguage: validate before looking anything up. */
export function isSectionName(value: unknown): value is SectionName {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(SECTION_IDS, value);
}

/**
 * Swap the locale segment of a path: "/en/privacy" → "/ru/privacy".
 *
 * Builds the path from the validated language and the existing suffix rather
 * than interpolating anything the model sent.
 */
export function localePath(pathname: string, language: SiteLanguage): string {
  const suffix = (pathname ?? "").replace(/^\/[^/]*/, "");
  return `/${language}${suffix}`;
}
