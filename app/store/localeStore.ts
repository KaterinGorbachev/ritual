// Deliberately NOT `persist`: we never restore the locale from storage at render
// time (the URL already told us), so a second copy in localStorage could only
// ever disagree with the cookie — and the cookie is the copy the edge can read.

import { create } from "zustand";
import { type Locale, DEFAULT_LOCALE, LOCALE_COOKIE } from "../lib/locales";

const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

type LocaleState = { 
    locale: Locale;
    /** Seed from the URL on navigation — deliberately does NOT write the cookie. */
    setLocaleFromUrl: (locale: Locale) => void;
    /** The visitor actively picked a language — persist it. */
    chooseLocale: (locale: Locale) => void;

}

export function writeLocaleCookie(locale: Locale): void { 
    // server render 
    if (typeof document === "undefined") { 
        return 
    }

    let cookie = `${LOCALE_COOKIE}=${locale}`; 
    cookie += "; Path=/"; 
    cookie += `; Max-Age=${MAX_AGE}`;
    cookie += "; SameSite=Lax";

    if (location.protocol === "https:") { 
        cookie += "; Secure"; 
    }   

    document.cookie = cookie;
    
}

export const useLocaleStore = create<LocaleState>(function (set) {
    return {
        locale: DEFAULT_LOCALE,

        setLocaleFromUrl: (locale) => {
            set({ locale });
        },

        chooseLocale: (locale) => {
            writeLocaleCookie(locale);
            set({ locale });
        },

    }
})