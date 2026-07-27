// Site-wide WhatsApp number, held in a Zustand store.
//
// There is exactly one salon number for the whole site. The server fetches it
// once (in layout.tsx, via the data layer) and seeds this store through
// <WhatsAppStoreProvider>. Any *client* component can then read the number and
// build a wa.me booking link without another Firestore round-trip — the async
// server <WhatsAppButton> stays the tool for server contexts.
//
// The store keeps digits only (the shape wa.me expects); `waLink()` appends a
// URL-encoded prefilled message so callers pass a plain, already-translated
// string.
import { create } from "zustand";

type WhatsAppState = {
  /** Digits only, e.g. "34600000000". Empty until hydrated. */
  number: string;
  setNumber: (raw: string) => void;
  /** Build a wa.me link with a prefilled, already-localised message. */
  waLink: (message: string) => string;
};

/** Strip everything but digits — wa.me wants the bare international number. */
export function toDigits(raw: string): string {
  return (raw ?? "").replace(/\D/g, "");
}

export const useWhatsAppStore = create<WhatsAppState>((set, get) => ({
  number: "",
  setNumber: (raw) => set({ number: toDigits(raw) }),
  waLink: (message) =>
    `https://wa.me/${get().number}?text=${encodeURIComponent(message)}`,
}));
