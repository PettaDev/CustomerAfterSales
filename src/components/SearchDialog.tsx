import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Guide } from '../types'

export function SearchDialog({ open, guide, onClose, onSelect }: { open: boolean; guide: Guide; onClose: () => void; onSelect: (index: number) => void }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    if (!normalized) return guide.steps.map((step, index) => ({ step, index }))
    return guide.steps.map((step, index) => ({ step, index })).filter(({ step }) => (t(step.titleKey) + ' ' + t(step.descriptionKey)).toLocaleLowerCase().includes(normalized))
  }, [guide.steps, query, t])

  useEffect(() => {
    if (open) setQuery('')
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [onClose, open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="dialog-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="search-dialog" role="dialog" aria-modal="true" aria-label={t('search.title')} initial={{ opacity: 0, y: -16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} onClick={(event) => event.stopPropagation()}>
            <div className="search-box"><Search size={21} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('search.placeholder')} /><button type="button" onClick={onClose} aria-label={t('actions.close')}><X size={19} /></button></div>
            <div className="search-summary">{t('search.resultCount', { count: results.length })}</div>
            <div className="search-results">
              {results.length ? results.map(({ step, index }) => (
                <button key={step.id} type="button" onClick={() => { onSelect(index); onClose() }}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{t(step.titleKey)}</strong><p>{t(step.descriptionKey)}</p></div><ArrowRight size={17} /></button>
              )) : <div className="empty-search"><Search size={26} /><p>{t('search.noResults')}</p></div>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
