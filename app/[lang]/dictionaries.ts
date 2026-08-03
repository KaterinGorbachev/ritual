import 'server-only'
import { type Locale } from '../lib/locales'
 
const dictionaries = {
  en: () => import('./dictionaries/en.json').then((module) => module.default),
  es: () => import('./dictionaries/es.json').then((module) => module.default),
  ru: () => import('./dictionaries/ru.json').then((module) => module.default),
}
 
export {type Locale, hasLocale, toLocale } from '../lib/locales'

export const getDictionary = async (locale: Locale) => dictionaries[locale]()