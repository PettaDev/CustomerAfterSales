import type { CountryRegion, LanguageCode } from '../types'

export interface CountryOption {
  code: string
  region: CountryRegion
  languages: LanguageCode[]
}

const country = (code: string, region: CountryRegion, languages: LanguageCode[]): CountryOption => ({ code, region, languages })

export const COUNTRY_SOURCE_URL = 'https://www.transsion.com/en/about'

export const countries: CountryOption[] = [
  country('BR', 'southAmerica', ['pt-BR', 'en']),

  country('NE', 'africa', ['fr', 'en']),
  country('BW', 'africa', ['en']),
  country('BI', 'africa', ['fr', 'en']),
  country('CG', 'africa', ['fr', 'en']),
  country('DJ', 'africa', ['fr', 'ar', 'en']),
  country('ER', 'africa', ['ar', 'en']),
  country('GA', 'africa', ['fr', 'en']),
  country('GW', 'africa', ['pt-BR', 'en']),
  country('GQ', 'africa', ['es-419', 'fr', 'pt-BR']),
  country('LS', 'africa', ['en']),
  country('NA', 'africa', ['en']),
  country('CF', 'africa', ['fr', 'en']),
  country('SS', 'africa', ['en']),
  country('SZ', 'africa', ['en']),
  country('TG', 'africa', ['fr', 'en']),
  country('BJ', 'africa', ['fr', 'en']),
  country('GN', 'africa', ['fr', 'en']),
  country('ZM', 'africa', ['en']),
  country('UG', 'africa', ['en']),
  country('AO', 'africa', ['pt-BR', 'en']),
  country('MG', 'africa', ['fr', 'en']),
  country('ET', 'africa', ['en']),
  country('GM', 'africa', ['en']),
  country('MZ', 'africa', ['pt-BR', 'en']),
  country('TN', 'africa', ['ar', 'fr', 'en']),
  country('DZ', 'africa', ['ar', 'fr']),
  country('MA', 'africa', ['ar', 'fr']),
  country('MR', 'africa', ['ar', 'fr']),
  country('CM', 'africa', ['fr', 'en']),
  country('TD', 'africa', ['fr', 'ar']),
  country('CI', 'africa', ['fr', 'en']),
  country('BF', 'africa', ['fr', 'en']),
  country('SN', 'africa', ['fr', 'en']),
  country('ML', 'africa', ['fr', 'en']),
  country('CD', 'africa', ['fr', 'en']),
  country('RW', 'africa', ['en', 'fr']),
  country('TZ', 'africa', ['en']),
  country('MW', 'africa', ['en']),
  country('MU', 'africa', ['en', 'fr']),
  country('SL', 'africa', ['en']),
  country('ZA', 'africa', ['en']),
  country('LR', 'africa', ['en']),
  country('GH', 'africa', ['en']),
  country('KE', 'africa', ['en']),
  country('NG', 'africa', ['en']),
  country('LY', 'africa', ['ar', 'en']),
  country('EG', 'africa', ['ar', 'en']),

  country('CN', 'asia', ['zh-CN', 'en']),
  country('LA', 'asia', ['en']),
  country('SY', 'asia', ['ar', 'en']),
  country('KG', 'asia', ['ru', 'en']),
  country('MY', 'asia', ['en']),
  country('UZ', 'asia', ['ru', 'en']),
  country('IQ', 'asia', ['ar', 'en']),
  country('VN', 'asia', ['en']),
  country('LK', 'asia', ['en']),
  country('PH', 'asia', ['en']),
  country('KH', 'asia', ['en']),
  country('JO', 'asia', ['ar', 'en']),
  country('LB', 'asia', ['ar', 'fr', 'en']),
  country('KZ', 'asia', ['ru', 'en']),
  country('MM', 'asia', ['en']),
  country('SA', 'asia', ['ar', 'en']),
  country('AE', 'asia', ['ar', 'en']),
  country('TH', 'asia', ['en']),
  country('BD', 'asia', ['en']),
  country('ID', 'asia', ['en']),
  country('PK', 'asia', ['en']),
  country('IN', 'asia', ['en']),
  country('NP', 'asia', ['en']),
  country('TJ', 'asia', ['ru', 'en']),
  country('OM', 'asia', ['ar', 'en']),
  country('KW', 'asia', ['ar', 'en']),
  country('BH', 'asia', ['ar', 'en']),
  country('QA', 'asia', ['ar', 'en']),
  country('YE', 'asia', ['ar', 'en']),
  country('PS', 'asia', ['ar', 'en']),

  country('AR', 'southAmerica', ['es-419', 'en']),
  country('CL', 'southAmerica', ['es-419', 'en']),
  country('EC', 'southAmerica', ['es-419', 'en']),
  country('BO', 'southAmerica', ['es-419', 'en']),
  country('PE', 'southAmerica', ['es-419', 'en']),
  country('CO', 'southAmerica', ['es-419', 'en']),

  country('MX', 'northAmerica', ['es-419', 'en']),
  country('GT', 'northAmerica', ['es-419', 'en']),
  country('HN', 'northAmerica', ['es-419', 'en']),
  country('DO', 'northAmerica', ['es-419', 'en']),

  country('GR', 'europe', ['en']),
  country('AZ', 'europe', ['ru', 'en']),
  country('BA', 'europe', ['en']),
  country('ME', 'europe', ['en']),
  country('HU', 'europe', ['en']),
  country('RO', 'europe', ['en']),
  country('PL', 'europe', ['en']),
  country('BG', 'europe', ['en', 'ru']),
  country('CZ', 'europe', ['en']),
  country('RS', 'europe', ['en']),
  country('TR', 'europe', ['en']),
  country('UA', 'europe', ['ru', 'en']),
  country('RU', 'europe', ['ru', 'en']),
  country('SI', 'europe', ['en']),
  country('MK', 'europe', ['en']),
  country('AL', 'europe', ['en']),
  country('ES', 'europe', ['es-419', 'en']),
  country('FR', 'europe', ['fr', 'en']),
]

export const countryMap = Object.fromEntries(countries.map((item) => [item.code, item])) as Record<string, CountryOption>

let englishDisplayNames: Intl.DisplayNames | null = null

export const getCountryName = (code: string) => {
  try {
    englishDisplayNames ??= new Intl.DisplayNames(['en'], { type: 'region' })
    return englishDisplayNames.of(code) ?? code
  } catch {
    return code
  }
}

export const getCountryFlagUrl = (code: string) => `./flags/countries/${code.toLocaleLowerCase('en-US')}.svg`
