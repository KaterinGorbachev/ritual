"use client";

// Seeds the WhatsApp Zustand store with the salon number the server already
// fetched. Rendered near the top of the layout with the number as a prop, so
// the store is populated before any client component reads it. Renders nothing.
//
// Hydrating during render (not in an effect) means the very first client paint
// already has the number — links are correct without a flash of an empty href.
import { useState } from "react";
import { useWhatsAppStore } from "../store/whatsappStore";

export function WhatsAppStoreProvider({ number }: { number: string }) {
  // Seed the module-level store exactly once, synchronously, before the first
  // client paint — so booking links have the number immediately, no flash of an
  // empty href. A lazy useState initializer runs a single time on mount; the
  // store's own "only if still empty" guard makes a repeat call harmless anyway.
  useState(() => {
    if (useWhatsAppStore.getState().number === "") {
      useWhatsAppStore.getState().setNumber(number);
    }
    return null;
  });
  return null;
}
