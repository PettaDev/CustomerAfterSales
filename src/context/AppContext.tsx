import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { detectBrowserLocale } from '../data/browserLocale'
import { countryMap } from '../data/countries'
import i18n from '../i18n'
import { neutralTheme, themeMap, themes } from '../themes'
import type { BrandTheme, CaptureMethod, LanguageCode, PersistedSession, WizardStage } from '../types'

const STORAGE_KEY = 'transsion-guide-session-v2'
const THEME_KEY = 'transsion-guide-color-mode'

const defaultSession: PersistedSession = {
  language: 'pt-BR',
  countryCode: 'BR',
  brandId: null,
  method: null,
  stage: 'language',
  guideStep: 0,
  reachedStep: 0,
  completed: [],
}

interface AppContextValue {
  session: PersistedSession
  brand: BrandTheme | null
  activeTheme: BrandTheme
  availableThemes: BrandTheme[]
  darkMode: boolean
  setCountry: (countryCode: string) => void
  setLanguage: (language: LanguageCode) => void
  continueFromLocale: () => void
  selectBrand: (brandId: string) => void
  selectMethod: (method: CaptureMethod) => void
  setStage: (stage: WizardStage) => void
  setGuideStep: (step: number) => void
  markCompleted: (stepId: string) => void
  toggleDarkMode: () => void
  resetSession: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

const loadSession = (): PersistedSession => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultSession, ...JSON.parse(raw) }
  } catch {
    // Fall through to browser locale detection when stored data is unavailable.
  }

  const browserLanguages = typeof navigator === 'undefined'
    ? []
    : navigator.languages?.length
      ? navigator.languages
      : [navigator.language]
  const preference = detectBrowserLocale(browserLanguages)

  return { ...defaultSession, ...preference }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PersistedSession>(loadSession)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(THEME_KEY) !== 'light')
  const brand = session.brandId ? themeMap[session.brandId] ?? null : null
  const activeTheme = brand ?? neutralTheme

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    if (session.language) {
      document.documentElement.lang = session.language
      document.documentElement.dir = session.language === 'ar' ? 'rtl' : 'ltr'
      void i18n.changeLanguage(session.language)
    }
  }, [session])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--brand-primary', activeTheme.colors.primary)
    root.style.setProperty('--brand-primary-strong', activeTheme.colors.primaryStrong)
    root.style.setProperty('--brand-secondary', activeTheme.colors.secondary)
    root.style.setProperty('--brand-accent', activeTheme.colors.accent)
    root.style.setProperty('--brand-glow', activeTheme.colors.glow)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', activeTheme.colors.secondary)
  }, [activeTheme])

  const value = useMemo<AppContextValue>(() => ({
    session,
    brand,
    activeTheme,
    availableThemes: themes,
    darkMode,
    setCountry: (countryCode) => setSession((current) => {
      const selectedCountry = countryMap[countryCode] ?? countryMap.BR
      return { ...current, countryCode: selectedCountry.code, language: selectedCountry.languages[0], stage: 'language' }
    }),
    setLanguage: (language) => setSession((current) => ({ ...current, language })),
    continueFromLocale: () => setSession((current) => ({ ...current, stage: current.language ? 'brand' : 'language' })),
    selectBrand: (brandId) => setSession((current) => ({ ...current, brandId, method: null, stage: 'method', guideStep: 0, reachedStep: 0, completed: [] })),
    selectMethod: (method) => setSession((current) => ({ ...current, method, stage: 'guide', guideStep: 0, reachedStep: 0, completed: [] })),
    setStage: (stage) => setSession((current) => ({ ...current, stage })),
    setGuideStep: (guideStep) => setSession((current) => ({ ...current, guideStep, reachedStep: Math.max(current.reachedStep, guideStep) })),
    markCompleted: (stepId) => setSession((current) => ({ ...current, completed: current.completed.includes(stepId) ? current.completed : [...current.completed, stepId] })),
    toggleDarkMode: () => setDarkMode((current) => !current),
    resetSession: () => setSession({ ...defaultSession, countryCode: session.countryCode, language: session.language }),
  }), [activeTheme, brand, darkMode, session])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
