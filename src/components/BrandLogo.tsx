import { useTranslation } from 'react-i18next'
import type { BrandTheme } from '../types'

export function BrandLogo({ theme, className = '' }: { theme: BrandTheme; className?: string }) {
  const { t } = useTranslation()
  return <img className={className} src={theme.logo} alt={t('header.brandLogo', { brand: theme.name })} />
}
