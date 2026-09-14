import type { SyntheticEvent } from 'react'
import { getCountryFlagUrl } from '../data/countries'

interface CountryFlagProps {
  code: string
  large?: boolean
  eager?: boolean
}

const hideUnavailableFlag = (event: SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.hidden = true
}

export function CountryFlag({ code, large = false, eager = false }: CountryFlagProps) {
  return (
    <span className={`country-flag${large ? ' country-flag--large' : ''}`} aria-hidden="true">
      <span className="country-flag-fallback">{code}</span>
      <img
        src={getCountryFlagUrl(code)}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={hideUnavailableFlag}
      />
    </span>
  )
}
