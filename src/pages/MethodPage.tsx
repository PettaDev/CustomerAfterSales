import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Cable, Clock3, Laptop, Smartphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageIntro } from '../components/PageIntro'
import { useApp } from '../context/AppContext'
import type { CaptureMethod } from '../types'

const methods: { id: CaptureMethod; icon: typeof Laptop; accentIcon: typeof Cable }[] = [
  { id: 'pc', icon: Laptop, accentIcon: Cable },
  { id: 'mobile', icon: Smartphone, accentIcon: Clock3 },
]

export function MethodPage() {
  const { t } = useTranslation()
  const { brand, selectMethod, setStage } = useApp()
  return (
    <div className="selection-page themed-selection">
      <div className="method-brand-orb" />
      <div className="selection-content">
        <div className="selected-brand-pill"><span className="brand-dot" />{brand?.name}</div>
        <PageIntro eyebrow={t('methods.choose.eyebrow')} title={t('methods.choose.title')} description={t('methods.choose.description')} />
        <div className="method-grid">
          {methods.map((method, index) => {
            const Icon = method.icon
            const AccentIcon = method.accentIcon
            return (
              <motion.button key={method.id} type="button" className="selection-card method-card" onClick={() => selectMethod(method.id)} initial={{ opacity: 0, x: index ? 18 : -18 }} animate={{ opacity: 1, x: 0 }} whileHover={{ y: -5 }}>
                <span className="method-badge">{t('methods.' + method.id + '.badge')}</span>
                <span className="method-icon"><Icon size={34} /><span><AccentIcon size={15} /></span></span>
                <strong>{t('methods.' + method.id + '.title')}</strong>
                <p>{t('methods.' + method.id + '.description')}</p>
                <span className="method-action">{t('actions.continue')}<ArrowRight size={17} /></span>
              </motion.button>
            )
          })}
        </div>
        <button type="button" className="text-button" onClick={() => setStage('brand')}><ArrowLeft size={17} />{t('actions.back')}</button>
      </div>
    </div>
  )
}
