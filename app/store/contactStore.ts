// Salon contact details, held in a Zustand store.
//
// Same shape as whatsappStore: the server reads `contactData` once (in
// layout.tsx, via the data layer), parses it with toContactFacts(), and seeds
// this store through <ContactStoreProvider>. Client components then read the
// address, hours, number and Instagram URL without another Firestore round-trip.
//
// Only the parsed facts live here, never the raw documents — parsing belongs in
// app/lib/contactFacts.ts, which the server-rendered JSON-LD also uses.
import { create } from "zustand";
import type { ContactFacts } from "../lib/contactFacts";

type ContactState = {
  /** Null until the provider seeds it. */
  facts: ContactFacts | null;
  setFacts: (facts: ContactFacts) => void;
};

export const useContactStore = create<ContactState>((set) => ({
  facts: null,
  setFacts: (facts) => set({ facts }),
}));
