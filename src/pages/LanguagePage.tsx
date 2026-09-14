import { motion } from 'framer-motion'
import { ArrowRight, Check, ExternalLink, Globe2, MapPin, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CountryFlag } from '../components/CountryFlag'
import { PageIntro } from '../components/PageIntro'
import { useApp } from '../context/AppContext'
import { countries, countryMap, COUNTRY_SOURCE_URL, getCountryName } from '../data/countries'
import { languageMap } from '../data/languages'
import type { CountryRegion } from '../types'

const regions: CountryRegion[] = ['africa', 'asia', 'southAmerica', 'northAmerica', 'europe']
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()

export function LanguagePage() {
  const { t } = useTranslation()
  const { session, setCountry, setLanguage, continueFromLocale } = useApp()
  const [query, setQuery] = useState('')
  const selectedCountry = countryMap[session.countryCode] ?? countryMap.BR
  const selectedLanguage = session.language ?? selectedCountry.languages[0]
  const groupedCountries = useMemo(() => {
    const normalizedQuery = normalize(query.trim())
    const visible = countries
      .filter((item) => item.code !== 'BR')
      .map((item) => ({ ...item, name: getCountryName(item.code) }))
      .filter((item) => !normalizedQuery || normalize(item.name).includes(normalizedQuery) || item.code.toLocaleLowerCase().includes(normalizedQuery))
      .sort((left, right) => left.name.localeCompare(right.name, 'en'))

    return regions.map((region) => ({ region, countries: visible.filter((item) => item.region === region) }))
      .filter((group) => group.countries.length > 0)
  }, [query])

  const selectCountry = (countryCode: string) => {
    setQuery('')
    setCountry(countryCode)
    window.requestAnimationFrame(() => document.querySelector('.locale-confirmation')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
  }

  return (
    <div className="selection-page locale-selection-page">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <div className="selection-content country-selection-content">
        <div className="welcome-mark"><Globe2 size={18} /><span>{t('app.badge')}</span></div>
        <PageIntro eyebrow={t('locale.choose.eyebrow')} title={t('locale.choose.title')} description={t('locale.choose.description')} />

        <div className="country-locale-layout">
          <section className="country-directory" aria-labelledby="country-directory-title">
            <div className="country-directory-head">
              <div>
                <span className="section-kicker">{t('locale.country.kicker')}</span>
                <h2 id="country-directory-title">{t('locale.country.title')}</h2>
              </div>
              <span className="country-count">{t('locale.country.count', { count: countries.length })}</span>
            </div>

            <button
              type="button"
              className={'featured-country' + (selectedCountry.code === 'BR' ? ' is-selected' : '')}
              aria-pressed={selectedCountry.code === 'BR'}
              onClick={() => selectCountry('BR')}
            >
              <CountryFlag code="BR" large eager />
              <span><small>{t('locale.country.recommended')}</small><strong>{getCountryName('BR')}</strong></span>
              <span className="featured-country-action">{selectedCountry.code === 'BR' ? <Check size={18} /> : <ArrowRight size={18} />}</span>
            </button>

            <label className="country-search">
              <Search size={18} aria-hidden="true" />
              <span className="sr-only">{t('locale.country.search')}</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('locale.country.search')} />
            </label>

            <div className="country-list" role="listbox" aria-label={t('locale.country.title')}>
              {groupedCountries.map((group) => (
                <div className="country-region-group" key={group.region} role="group" aria-label={t(`locale.regions.${group.region}`)}>
                  <div className="country-region-title">{t(`locale.regions.${group.region}`)}</div>
                  <div className="country-grid">
                    {group.countries.map((item) => {
                      const active = selectedCountry.code === item.code
                      return (
                        <button
                          type="button"
                          role="option"
                          aria-selected={active}
                          className={active ? 'is-selected' : ''}
                          key={item.code}
                          onClick={() => selectCountry(item.code)}
                        >
                          <CountryFlag code={item.code} />
                          <strong>{item.name}</strong>
                          <small>{item.code}</small>
                          {active ? <Check size={15} aria-hidden="true" /> : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              {groupedCountries.length === 0 ? <p className="country-empty">{t('locale.country.empty')}</p> : null}
            </div>

            <a className="country-source" href={COUNTRY_SOURCE_URL} target="_blank" rel="noreferrer">
              {t('locale.country.source')}<ExternalLink size={13} />
            </a>
          </section>

          <motion.aside className="locale-confirmation" layout aria-live="polite">
            <div className="selected-country-summary">
              <CountryFlag code={selectedCountry.code} large eager />
              <div><span>{t('locale.language.selectedCountry')}</span><strong>{getCountryName(selectedCountry.code)}</strong></div>
              <MapPin size={20} aria-hidden="true" />
            </div>

            <div className="locale-language-copy">
              <span className="section-kicker">{t('locale.language.kicker')}</span>
              <h2>{selectedCountry.languages.length > 1 ? t('locale.language.multipleTitle') : t('locale.language.title')}</h2>
              <p>{selectedCountry.languages.length > 1 ? t('locale.language.multipleDescription') : t('locale.language.description')}</p>
            </div>

            <div className="country-language-options" role="radiogroup" aria-label={t('locale.language.title')}>
              {selectedCountry.languages.map((code) => {
                const language = languageMap[code]
                const active = selectedLanguage === code
                return (
                  <button type="button" role="radio" aria-checked={active} className={active ? 'is-selected' : ''} key={code} onClick={() => setLanguage(code)}>
                    <span className="language-symbol" aria-hidden="true">{language.symbol}</span>
                    <span><strong>{language.native}</strong><small>{language.shortCode}</small></span>
                    <span className="language-choice-check">{active ? <Check size={16} /> : null}</span>
                  </button>
                )
              })}
            </div>

            <button type="button" className="locale-continue" onClick={continueFromLocale}>
              <span><small>{t('locale.continue.label')}</small><strong>{t('locale.continue.action')}</strong></span>
              <ArrowRight size={20} />
            </button>
          </motion.aside>
        </div>
      </div>
    </div>
  )
}
