import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUp, Check, CheckCircle2, ChevronRight, CirclePlay, Clock3, Headphones, ListChecks, LockKeyhole, RotateCcw, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Footer } from '../components/Footer'
import { GuideBlockRenderer } from '../components/GuideBlockRenderer'
import { Header } from '../components/Header'
import { ImageModal } from '../components/ImageModal'
import { SearchDialog } from '../components/SearchDialog'
import { useApp } from '../context/AppContext'
import { getGuide } from '../guides'

const ACK_KEY = 'transsion-guide-acknowledgments-v1'
const TERMUX_VIDEO_STEPS = new Set(['termux-setup', 'wireless-debugging', 'split-screen', 'pair-adb', 'connect-adb'])

export function GuidePage() {
  const { t } = useTranslation()
  const { session, brand, setGuideStep, markCompleted, setStage, resetSession } = useApp()
  const guide = brand && session.method ? getGuide(brand.id, session.method) : null
  const [searchOpen, setSearchOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [image, setImage] = useState<{ src: string; alt: string } | null>(null)
  const [finished, setFinished] = useState(false)
  const [showTop, setShowTop] = useState(false)
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(ACK_KEY) ?? '{}') } catch { return {} }
  })

  const closeImage = useCallback(() => setImage(null), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  useEffect(() => { localStorage.setItem(ACK_KEY, JSON.stringify(acknowledged)) }, [acknowledged])
  useEffect(() => {
    const scroll = () => setShowTop(window.scrollY > 540)
    window.addEventListener('scroll', scroll, { passive: true })
    return () => window.removeEventListener('scroll', scroll)
  }, [])

  const step = guide?.steps[session.guideStep]
  const ackId = guide && step ? guide.brand + ':' + guide.method + ':' + step.id : ''
  const requiresAcknowledgment = step?.blocks?.some((block) => block.type === 'download' && block.acknowledgmentKey) ?? false
  const canContinue = !requiresAcknowledgment || Boolean(acknowledged[ackId])
  const progress = guide ? Math.round(((session.guideStep + 1) / guide.steps.length) * 100) : 0
  const showTermuxVideo = session.method === 'mobile' && TERMUX_VIDEO_STEPS.has(step?.id ?? '') && !finished

  const goTo = useCallback((index: number) => {
    if (!guide) return
    setFinished(false)
    setGuideStep(Math.min(Math.max(index, 0), guide.steps.length - 1))
    setSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [guide, setGuideStep])

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.key === '/' && !searchOpen) { event.preventDefault(); setSearchOpen(true) }
      if (event.key === 'ArrowLeft' && session.guideStep > 0) goTo(session.guideStep - 1)
      if (event.key === 'ArrowRight' && guide && canContinue && session.guideStep < guide.steps.length - 1) goTo(session.guideStep + 1)
    }
    window.addEventListener('keydown', keyboard)
    return () => window.removeEventListener('keydown', keyboard)
  }, [canContinue, goTo, guide, searchOpen, session.guideStep])

  const handleNext = () => {
    if (!guide || !step || !canContinue) return
    markCompleted(step.id)
    if (session.guideStep === guide.steps.length - 1) {
      setFinished(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    goTo(session.guideStep + 1)
  }

  if (!guide || !brand || !session.method || !step) return null

  return (
    <div className="guide-shell">
      <Header onSearch={() => setSearchOpen(true)} onMenu={() => setSidebarOpen(true)} />
      <div className="guide-progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><motion.span animate={{ width: progress + '%' }} transition={{ duration: 0.45 }} /></div>
      <div className="guide-layout">
        <AnimatePresence>
          {sidebarOpen && <motion.button type="button" className="sidebar-backdrop" aria-label={t('actions.close')} onClick={() => setSidebarOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
        </AnimatePresence>
        <aside className={'guide-sidebar ' + (sidebarOpen ? 'is-open' : '')}>
          <div className="sidebar-mobile-head"><strong>{t('guide.allSteps')}</strong><button type="button" onClick={() => setSidebarOpen(false)} aria-label={t('actions.close')}><X size={20} /></button></div>
          <div className="guide-summary">
            <span className="guide-brand-dot" />
            <div><strong>{t(guide.titleKey)}</strong><span><Clock3 size={14} />{t('guide.estimated', { minutes: guide.estimatedMinutes })}</span></div>
          </div>
          <div className="sidebar-title"><ListChecks size={17} /><span>{t('guide.allSteps')}</span></div>
          <nav className="step-list">
            {guide.steps.map((item, index) => {
              const completed = session.completed.includes(item.id) || index < session.guideStep
              const current = index === session.guideStep && !finished
              const upcoming = index > session.reachedStep
              return (
                <button type="button" key={item.id} className={(current ? 'is-current ' : '') + (completed ? 'is-completed' : '')} onClick={() => goTo(index)} aria-current={current ? 'step' : undefined}>
                  <span className="step-number">{completed ? <Check size={14} /> : upcoming ? <LockKeyhole size={12} /> : index + 1}</span>
                  <span className="step-copy"><strong>{t(item.titleKey)}</strong><small>{completed ? t('guide.completed') : current ? t('guide.current') : t('guide.upcoming')}</small></span>
                </button>
              )
            })}
          </nav>
          <div className="keyboard-hint">{t('guide.keyboardHint')}</div>
        </aside>

        <main className={'guide-main' + (showTermuxVideo ? ' has-process-video' : '')}>
          <div className="guide-topline">
            <nav className="breadcrumbs" aria-label={t('guide.breadcrumb.guide')}><button type="button" onClick={() => setStage('brand')}>{t('guide.breadcrumb.home')}</button><ChevronRight size={14} /><span>{brand.name}</span><ChevronRight size={14} /><span>{t('guide.breadcrumb.guide')}</span></nav>
            <span className="step-percent">{t('wizard.stepOf', { current: session.guideStep + 1, total: guide.steps.length })} · {progress}%</span>
          </div>

          {finished ? (
            <motion.section className="completion-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
              <div className="completion-icon"><CheckCircle2 size={38} /></div>
              <span className="eyebrow">{t('completion.eyebrow')}</span>
              <h1>{t('completion.title')}</h1>
              <p>{t('completion.description')}</p>
              <div className="completion-summary"><span className="brand-dot" />{t('completion.summary', { brand: brand.name, method: t('methods.' + session.method + '.title') })}</div>
              <div className="completion-actions">
                <a href={brand.supportUrl} target="_blank" rel="noreferrer" className="primary-button"><Headphones size={18} />{t('completion.support', { brand: brand.name })}</a>
                <button type="button" className="secondary-button" onClick={resetSession}><RotateCcw size={17} />{t('completion.another')}</button>
              </div>
            </motion.section>
          ) : (
            <div className={'guide-step-stage' + (showTermuxVideo ? ' has-process-video' : '')}>
              {showTermuxVideo && (
                <aside className="persistent-guide-video" aria-label={t('guide.videos.termux.title')}>
                  <div className="persistent-video-heading">
                    <span><CirclePlay size={19} /></span>
                    <div><strong>{t('guide.videos.termux.title')}</strong><small>{t('guide.videos.termux.persistent')}</small></div>
                  </div>
                  <div className="video-frame is-portrait">
                    <video src="./videos/termux-adb-process.mp4" title={t('guide.videos.termux.title')} aria-label={t('guide.videos.termux.title')} controls playsInline preload="metadata" />
                  </div>
                </aside>
              )}
              <AnimatePresence mode="wait">
                <motion.article key={step.id} className="guide-article" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.26 }}>
                <div className="step-heading">
                  {step.eyebrowKey && <span className="eyebrow"><span />{t(step.eyebrowKey)}</span>}
                  <span className="step-index">{String(session.guideStep + 1).padStart(2, '0')}</span>
                  <h1>{t(step.titleKey)}</h1>
                  <p>{t(step.descriptionKey)}</p>
                </div>
                <div className="guide-blocks">
                  {step.blocks?.map((block, index) => (
                    <GuideBlockRenderer key={block.type + index} block={block} acknowledged={Boolean(acknowledged[ackId])} onAcknowledged={(value) => setAcknowledged((current) => ({ ...current, [ackId]: value }))} onOpenImage={setImage} />
                  ))}
                </div>
                <div className="guide-navigation">
                  <button type="button" className="secondary-button" disabled={session.guideStep === 0} onClick={() => goTo(session.guideStep - 1)}><ArrowLeft size={17} />{t('actions.previous')}</button>
                  <button type="button" className="primary-button" disabled={!canContinue} onClick={handleNext}>{session.guideStep === guide.steps.length - 1 ? t('actions.finish') : t('actions.next')}{session.guideStep === guide.steps.length - 1 ? <Check size={17} /> : <ArrowRight size={17} />}</button>
                </div>
                </motion.article>
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
      <Footer />
      <SearchDialog open={searchOpen} guide={guide} onClose={closeSearch} onSelect={goTo} />
      <ImageModal image={image} onClose={closeImage} />
      <AnimatePresence>{showTop && <motion.button type="button" className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label={t('actions.backToTop')} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><ArrowUp size={19} /></motion.button>}</AnimatePresence>
    </div>
  )
}
