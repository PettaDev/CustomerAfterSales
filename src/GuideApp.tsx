import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { LogAssistant } from './components/LogAssistant'
import { WizardProgress } from './components/WizardProgress'
import { useApp } from './context/AppContext'
import { BrandPage } from './pages/BrandPage'
import { GuidePage } from './pages/GuidePage'
import { LanguagePage } from './pages/LanguagePage'
import { MethodPage } from './pages/MethodPage'

const pages = {
  language: LanguagePage,
  brand: BrandPage,
  method: MethodPage,
}

export default function App() {
  const { session } = useApp()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [session.stage])

  const Page = session.stage === 'guide' ? GuidePage : pages[session.stage]
  return (
    <>
      {session.stage === 'guide' ? <GuidePage /> : (
        <div className="app-shell">
          <Header />
          <WizardProgress />
          <AnimatePresence mode="wait">
            <motion.main key={session.stage} className="wizard-main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Page />
            </motion.main>
          </AnimatePresence>
          <Footer />
        </div>
      )}
      <LogAssistant />
    </>
  )
}
