import { Code2, ExternalLink, Headphones } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import { BrandLogo } from './BrandLogo'
import { LanguageSelect } from './LanguageSelect'

export function Footer() {
  const { t } = useTranslation()
  const { activeTheme, brand } = useApp()
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <BrandLogo theme={activeTheme} className="footer-logo" />
          <div><strong>{t('app.title')}</strong><span>{t('app.version')}</span></div>
        </div>
        <div className="footer-meta">
          <div className="footer-credits">
            <span>{t('app.copyright')}</span>
            <strong><Code2 size={14} aria-hidden="true" />{t('app.developer')}</strong>
          </div>
          {brand && (
            <a href={brand.supportUrl} target="_blank" rel="noreferrer"><Headphones size={16} />{t('app.contact')}<ExternalLink size={13} /></a>
          )}
          <LanguageSelect />
        </div>
      </div>
    </footer>
  )
}
