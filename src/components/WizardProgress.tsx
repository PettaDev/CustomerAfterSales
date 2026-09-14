import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import type { WizardStage } from '../types'

const stages: WizardStage[] = ['language', 'brand', 'method', 'guide']

export function WizardProgress() {
  const { t } = useTranslation()
  const { session } = useApp()
  const activeIndex = stages.indexOf(session.stage)
  return (
    <nav className="wizard-progress" aria-label={t('app.title')}>
      {stages.map((stage, index) => (
        <div key={stage} className={'wizard-progress-item ' + (index < activeIndex ? 'is-done' : index === activeIndex ? 'is-active' : '')}>
          <span className="wizard-dot">{index < activeIndex ? <Check size={14} /> : index + 1}</span>
          <span>{t('wizard.' + stage)}</span>
          {index < stages.length - 1 && <span className="wizard-line" />}
        </div>
      ))}
    </nav>
  )
}
