import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function ImageModal({ image, onClose }: { image: { src: string; alt: string } | null; onClose: () => void }) {
  const { t } = useTranslation()
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])
  return (
    <AnimatePresence>
      {image && (
        <motion.div className="image-modal" role="dialog" aria-modal="true" aria-label={image.alt} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <button type="button" onClick={onClose} aria-label={t('actions.close')}><X size={24} /></button>
          <motion.img src={image.src} alt={image.alt} initial={{ scale: 0.94 }} animate={{ scale: 1 }} onClick={(event) => event.stopPropagation()} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
