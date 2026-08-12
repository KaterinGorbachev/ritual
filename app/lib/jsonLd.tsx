import { ORG_ID, SITE_URL, WEBSITE_ID, absUrl } from "./site";
import type { ContactDataItem } from "../ui/FooterContactDetails";

/**
 * Renders a schema.org JSON-LD block.
 *
 * Server-rendered on purpose: AI crawlers read the HTML they are served and many
 * never execute JavaScript, so this has to be in the initial payload rather than
 * injected on the client.
 *
 * The `<` escape stops a stray "</script>" inside any string from terminating the
 * block early. All input is our own dictionary copy and Firestore contact fields,
 * never user submissions.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

// Firestore stores dayStart/dayEnd as lowercase english day keys; schema.org
// wants capitalised names and the full enumerated range, not just the endpoints.
const SCHEMA_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/** "monday"→"saturday" becomes every day in between, inclusive. Wraps past Sunday. */
function daysBetween(start?: string, end?: string): string[] {
  if (!start || !end) return [];
  const from = SCHEMA_DAYS.findIndex((d) => d.toLowerCase() === start.toLowerCase());
  const to = SCHEMA_DAYS.findIndex((d) => d.toLowerCase() === end.toLowerCase());
  if (from === -1 || to === -1) return [];

  const out: string[] = [];
  for (let i = 0; i < SCHEMA_DAYS.length; i++) {
    const day = SCHEMA_DAYS[(from + i) % SCHEMA_DAYS.length];
    out.push(day);
    if ((from + i) % SCHEMA_DAYS.length === to) break;
  }
  return out;
}

/**
 * Normalise an opening time to the "HH:MM" 24-hour form schema.org requires.
 * The footer renders whatever Firestore holds verbatim, so parse tolerantly here
 * rather than forcing a data migration: the collection currently stores bare
 * hours ("10", "20"), but "10:00", "10.30" and "10:00h" all work too.
 */
function toIsoTime(value?: string): string | undefined {
  if (!value) return undefined;
  const match = value.match(/(\d{1,2})(?:\s*[:.]\s*(\d{2}))?/);
  if (!match) return undefined;
  const hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  if (!Number.isFinite(hours) || hours > 23 || minutes > 59) return undefined;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

type StaffMember = { id: string; name: string; service: string; image?: string; defaultImage?: string };

type BusinessLdInput = {
  locale: string;
  contactDocs: ContactDataItem[];
  description: string;
  bookLabel: string;
  staff: readonly StaffMember[];
};

/**
 * The salon itself. Every field is sourced from the `contactData` collection the
 * layout already reads for the footer, so this costs no extra Firestore calls.
 *
 * Fields are spread in conditionally: a missing or malformed document drops that
 * property instead of emitting an empty/invalid one, matching how the footer
 * degrades.
 */
export function buildBusinessLd({
  locale,
  contactDocs,
  description,
  bookLabel,
  staff,
}: BusinessLdInput) {
  const address = contactDocs.find((d) => d.id === "address");
  const hours = contactDocs.find((d) => d.id === "workingHours");
  const phone = contactDocs.find((d) => d.id === "messanger")?.telephone;
  const instagram = contactDocs.find((d) => d.id === "instagram")?.url;

  // Coordinates arrive as a "lat, lng" string, e.g. "39.4720, -0.3759".
  const [lat, lng] = (address?.coordinates ?? "")
    .split(",")
    .map((n) => parseFloat(n.trim()));

  const opens = toIsoTime(hours?.from);
  const closes = toIsoTime(hours?.to);
  const dayOfWeek = daysBetween(hours?.dayStart, hours?.dayEnd);
  const logo = absUrl("/Logo-Ritual-Copyright_All-rights-reserved.webp");

  return {
    "@context": "https://schema.org",
    // Dual type: LocalBusiness-compatible for map/local results, DaySpa for the
    // more specific semantics a model matches against "massage salon".
    "@type": ["HealthAndBeautyBusiness", "DaySpa"],
    "@id": ORG_ID,
    name: "Ritual",
    description,
    url: absUrl(`/${locale}`),
    image: logo,
    logo,
    ...(phone && { telephone: phone }),
    ...(address?.location && {
      address: {
        "@type": "PostalAddress",
        streetAddress: address.location,
        addressLocality: "Valencia",
        addressCountry: "ES",
      },
    }),
    ...(Number.isFinite(lat) &&
      Number.isFinite(lng) && {
        geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lng },
      }),
    ...(opens &&
      closes &&
      dayOfWeek.length > 0 && {
        openingHoursSpecification: [
          { "@type": "OpeningHoursSpecification", dayOfWeek, opens, closes },
        ],
      }),
    ...(instagram && { sameAs: [instagram] }),

    // Machine-readable languages, so a model answering "Russian-speaking salon in
    // Valencia" can match with certainty instead of inferring from prose.
    availableLanguage: [
      { "@type": "Language", name: "Spanish", alternateName: "es" },
      { "@type": "Language", name: "English", alternateName: "en" },
      { "@type": "Language", name: "Russian", alternateName: "ru" },
    ],
    knowsLanguage: ["es", "en", "ru"],

    priceRange: "€€",
    currenciesAccepted: "EUR",
    areaServed: { "@type": "City", name: "Valencia" },

    // Named practitioners with stated experience are strong credibility signals
    // for a health-adjacent service. Already rendered in the #aboutus section.
    employee: staff.map((member) => ({
      "@type": "Person",
      name: member.name,
      jobTitle: member.service,
      ...(member.image && { image: absUrl(member.image) }),
      worksFor: { "@id": ORG_ID },
    })),

    // Booking runs entirely through WhatsApp.
    ...(phone && {
      potentialAction: {
        "@type": "ReserveAction",
        name: bookLabel,
        target: `https://wa.me/${phone.replace(/\D/g, "")}`,
      },
    }),
  };

  // Deliberately no aggregateRating: dict.reviews.ratingSummary is display copy
  // ("4,9 de más de 240 rituales" — comma decimal in es/ru) and review markup must
  // reflect genuinely collected reviews. Add it as numeric literals once the
  // figures are confirmed real.
}

/** The site as an entity, tying the three language versions to the business. */
export function buildWebsiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: "Ritual",
    inLanguage: ["es", "en", "ru"],
    publisher: { "@id": ORG_ID },
  };
}
