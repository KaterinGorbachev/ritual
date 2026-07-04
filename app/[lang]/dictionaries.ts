import 'server-only'
 
const dictionaries = {
  en: () => import('./dictionaries/en.json').then((module) => module.default),
  es: () => import('./dictionaries/es.json').then((module) => module.default),
  ru: () => import('./dictionaries/ru.json').then((module) => module.default),
}
 
export type Locale = keyof typeof dictionaries

export const hasLocale = (locale: string): locale is Locale =>
  locale in dictionaries

// Map a URL locale like "es-ES" down to a dictionary key like "es".
// Falls back to "en" for anything unrecognized.
export const toLocale = (lang: string): Locale => {
  const short = lang.split('-')[0]
  return hasLocale(short) ? short : 'en'
}

export const getDictionary = async (locale: Locale) => dictionaries[locale]()