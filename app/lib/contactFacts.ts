// One parser for the `contactData` collection.
//
// The same documents are read by three consumers: the footer, the JSON-LD block
// and the WebMCP tools. Each used to parse the raw docs itself, which meant the
// "lat, lng" split and the day-key lookup existed in more than one place. They
// live here now.
//
// Deliberately pure — no React, no `document`, no Firestore. buildBusinessLd()
// runs on the server (AI crawlers rarely execute JS, so that block has to be in
// the served HTML), so this cannot live inside a client store.
//
// Every field degrades rather than throws: a missing or malformed document drops
// that one fact and leaves the rest usable. The layout passes `[]` when the
// Firestore read fails, and the page still has to render.
export type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

/**
 * Shape of a document in the Firestore `contactData` collection. Fields are
 * optional because each document (address, workingHours, messanger, …) only
 * carries the ones relevant to it.
 *
 * Defined here rather than in the footer so the parser has no import back into
 * the UI layer — the footer re-exports it for the callers that already use it.
 */
export type ContactDataItem = {
  id: string;
  location?: string;
  coordinates?: string;
  from?: string;
  to?: string;
  dayStart?: DayKey;
  dayEnd?: DayKey;
  telephone?: string;
  url?: string;
  mapLink?: string;
};

export type ContactFacts = {
  /** Street address as stored, or "" when absent. */
  address: string;
  /** Parsed coordinates, or null when missing/malformed. */
  coordinates: { lat: number; lng: number } | null;
  /** Explicit mapLink when set, else a Google Maps search built from coordinates. */
  mapLink: string;
  /** Opening hours, or null when the document is missing its times. */
  hours: { from: string; to: string; dayStart?: DayKey; dayEnd?: DayKey } | null;
  /**
   * The number exactly as stored, e.g. "+34643987849" — this is what the footer
   * shows a person. Use `whatsAppNumber` for links.
   */
  telephone: string;
  /** Digits-only, e.g. "34643987849" — the shape wa.me requires. "" when absent. */
  whatsAppNumber: string;
  /** Full Instagram profile URL, or "" when absent. */
  instagramUrl: string;
};

/** Strip everything but digits — the shape wa.me expects. */
export function toDigits(raw: string): string {
  return (raw ?? "").replace(/\D/g, "");
}

/**
 * Coordinates are stored as a single "lat, lng" string, e.g. "39.4720, -0.3759".
 * Returns null rather than NaN coordinates when the value is missing or unparseable,
 * so callers can test one thing instead of two Number.isFinite checks.
 */
function parseCoordinates(raw?: string): { lat: number; lng: number } | null {
  if (typeof raw !== "string") return null;

  const parts = raw.split(",").map((n) => parseFloat(n.trim()));
  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) {
    return null;
  }
  return { lat: parts[0], lng: parts[1] };
}

/**
 * Turn the raw `contactData` documents into plain facts.
 *
 * Callers pass the array the layout already fetched — this never touches
 * Firestore itself, so it costs nothing to call from several places.
 */
export function toContactFacts(docs: ContactDataItem[]): ContactFacts {
  const list = Array.isArray(docs) ? docs : [];

  const addressDoc = list.find((d) => d.id === "address");
  const hoursDoc = list.find((d) => d.id === "workingHours");
  const messangerDoc = list.find((d) => d.id === "messanger");
  const instagramDoc = list.find((d) => d.id === "instagram");

  const coordinates = parseCoordinates(addressDoc?.coordinates);

  // Prefer the curated link; fall back to a coordinate search only when we have
  // real coordinates, so we never emit a map link pointing at 0,0.
  const mapLink =
    addressDoc?.mapLink ??
    (coordinates
      ? `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`
      : "");

  const hours =
    hoursDoc?.from && hoursDoc?.to
      ? {
          from: hoursDoc.from,
          to: hoursDoc.to,
          dayStart: hoursDoc.dayStart,
          dayEnd: hoursDoc.dayEnd,
        }
      : null;

  return {
    address: addressDoc?.location ?? "",
    coordinates,
    mapLink,
    hours,
    telephone: messangerDoc?.telephone ?? "",
    whatsAppNumber: toDigits(messangerDoc?.telephone ?? ""),
    instagramUrl: instagramDoc?.url ?? "",
  };
}
