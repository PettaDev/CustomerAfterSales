import type { LanguageCode } from '../types'

export interface LanguageOption {
  code: LanguageCode
  symbol: string
  native: string
  shortCode: string
}

export const languageOptions: LanguageOption[] = [
  { code: 'pt-BR', symbol: '🇧🇷', native: 'Português (Brasil)', shortCode: 'PT · BR' },
  { code: 'en', symbol: '🌐', native: 'English', shortCode: 'EN' },
  { code: 'es-419', symbol: '🌎', native: 'Español (Latinoamérica)', shortCode: 'ES · LATAM' },
  { code: 'fr', symbol: '🇫🇷', native: 'Français', shortCode: 'FR' },
  { code: 'ar', symbol: 'ع', native: 'العربية', shortCode: 'AR' },
  { code: 'ru', symbol: '🇷🇺', native: 'Русский', shortCode: 'RU' },
  { code: 'zh-CN', symbol: '🇨🇳', native: '简体中文', shortCode: 'ZH · CN' },
]

export const languageMap = Object.fromEntries(languageOptions.map((language) => [language.code, language])) as Record<LanguageCode, LanguageOption>
