"use client";

// Seeds the contact store with the facts the server already parsed. Rendered
// near the top of the layout with the facts as a prop, so the store is populated
// before any client component reads it. Renders nothing.
//
// Hydrating during render (not in an effect) means the very first client paint
// already has the data — no flash of an empty address or number.
import { useState } from "react";
import { useContactStore } from "../store/contactStore";
import type { ContactFacts } from "../lib/contactFacts";

export function ContactStoreProvider({ facts }: { facts: ContactFacts }) {
  // A lazy useState initializer runs exactly once on mount, synchronously,
  // before the first paint. The "only if still empty" guard makes a repeat call
  // harmless if this ever renders twice.
  useState(() => {
    if (useContactStore.getState().facts === null) {
      useContactStore.getState().setFacts(facts);
    }
    return null;
  });
  return null;
}
