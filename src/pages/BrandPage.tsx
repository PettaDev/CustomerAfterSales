import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Smartphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BrandLogo } from '../components/BrandLogo'
import { PageIntro } from '../components/PageIntro'
import { useApp } from '../context/AppContext'

export function BrandPage() {
  const { t } = useTranslation()
  const { availableThemes, selectBrand, setStage } = useApp()
  return (
    <div className="selection-page">
      <div className="selection-content wide">
        <PageIntro eyebrow={t('brands.choose.eyebrow')} title={t('brands.choose.title')} description={t('brands.choose.description')} />
        <div className="brand-grid">
          {availableThemes.map((theme, index) => (
            <motion.button
              key={theme.id}
              type="button"
              className="selection-card brand-card"
              onClick={() => selectBrand(theme.id)}
              style={{ '--card-brand': theme.colors.primary, '--card-glow': theme.colors.glow } as React.CSSProperties}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 * index }} whileHover={{ y: -7 }}
            >
              <span className="brand-card-glow" />
              <span className="brand-icon"><Smartphone size={23} /></span>
              <BrandLogo theme={theme} className="brand-card-logo" />
              <span className="brand-os">{theme.osName}</span>
              <span className="brand-tagline">{t(theme.taglineKey)}</span>
              <span className="brand-arrow"><ArrowRight size={18} /></span>
            </motion.button>
          ))}
        </div>
        <button type="button" className="text-button" onClick={() => setStage('language')}><ArrowLeft size={17} />{t('actions.back')}</button>
      </div>
    </div>
  )
}
