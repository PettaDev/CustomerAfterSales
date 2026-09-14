import { countryMap } from './countries'
import type { LanguageCode } from '../types'

export interface BrowserLocalePreference {
  countryCode: string
  language: LanguageCode
}

const fallbackPreference: BrowserLocalePreference = {
  countryCode: 'BR',
  language: 'pt-BR',
}

const supportedLanguageByBrowserLanguage: Partial<Record<string, LanguageCode>> = {
  ar: 'ar',
  en: 'en',
  es: 'es-419',
  fr: 'fr',
  pt: 'pt-BR',
  ru: 'ru',
  zh: 'zh-CN',
}

export const detectBrowserLocale = (languageTags: readonly string[]): BrowserLocalePreference => {
  for (const languageTag of languageTags) {
    try {
      const locale = new Intl.Locale(languageTag)
      const region = (locale.region ?? locale.maximize().region)?.toUpperCase()
      const selectedCountry = region ? countryMap[region] : undefined

      if (!selectedCountry) continue

      const browserLanguage = supportedLanguageByBrowserLanguage[locale.language.toLowerCase()]
      const language = browserLanguage && selectedCountry.languages.includes(browserLanguage)
        ? browserLanguage
        : selectedCountry.languages[0]

      return { countryCode: selectedCountry.code, language }
    } catch {
      // Ignore malformed browser language tags and try the next preference.
    }
  }

  return fallbackPreference
}
