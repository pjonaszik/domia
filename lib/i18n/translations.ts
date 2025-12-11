// /lib/i18n/translations.ts

import { fr } from './fr'
import { en } from './en'
import { es } from './es'

export type Language = 'fr' | 'en' | 'es'

export const translations = {
  fr,
  en,
  es,
} as const

export function getTranslation(key: string, lang: Language, params?: Record<string, string>): string {
  const keys = key.split('.')
  let value: any = translations[lang]
  
  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) {
      // Fallback to French if translation missing
      value = translations.fr
      for (const k2 of keys) {
        value = value?.[k2]
      }
      break
    }
  }
  
  if (typeof value !== 'string') {
    return key
  }
  
  // Replace parameters
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] || match
    })
  }
  
  return value
}
