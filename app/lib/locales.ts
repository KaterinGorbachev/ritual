// create read only array of locales and type for it
export const LOCALES = ["en", "ru", "es"] as const; 
export type Locale = (typeof LOCALES)[number]; 

// mirrows what proxy.js falls back to 
export const DEFAULT_LOCALE: Locale = "es";

// Cookie proxy.js reads to determine the users choice of a lang
export const LOCALE_COOKIE = "ritual:lang";

export function hasLocale(value: string): value is Locale {
    for (const locale of LOCALES) { 
        if (locale === value) { 
            return true; 
        }
    }
    return false; 
}

// get locale from a path segment, e.g. "/es/about" -> "es"
export function toLocale(lang: string): Locale { 
    if (!lang) {
        return DEFAULT_LOCALE;
    }

    const short = lang.split("-")[0];

    if (hasLocale(short)) {
        return short; 
    }

    return DEFAULT_LOCALE;
}
