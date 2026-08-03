"use client";

// Keeps the locale store in step with the URL. The URL is authoritative: if
// someone opens a shared /en/services link, the store says "en" even though
// their cookie says "ru" — what's on screen and what the store reports must
// never disagree. No cookie write here; only a deliberate click persists.
import { useLocaleStore } from "../store/localeStore";
import type { Locale } from "../lib/locales";

export function LocaleStoreProvider({ locale }: { locale: Locale }) {
    const state = useLocaleStore.getState(); 

    if (state.locale !== locale) {
        state.setLocaleFromUrl(locale);
    }

    return null;

}