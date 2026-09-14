import { Home, Menu, Moon, Search, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import { BrandLogo } from './BrandLogo'
import { LanguageSelect } from './LanguageSelect'

interface HeaderProps {
  onSearch?: () => void
  onMenu?: () => void
}

export function Header({ onSearch, onMenu }: HeaderProps) {
  const { t } = useTranslation()
  const { activeTheme, darkMode, toggleDarkMode, resetSession, session } = useApp()
  return (
    <header className="app-header">
      <div className="header-inner">
        {onMenu && (
          <button type="button" className="mobile-menu-button" onClick={onMenu} aria-label={t('header.openMenu')}>
            <Menu size={20} />
          </button>
        )}
        <button type="button" className="brand-lockup" onClick={resetSession} aria-label={t('actions.home')}>
          <BrandLogo theme={activeTheme} className="header-logo" />
          <span className="brand-divider" />
          <span className="app-name">{t('app.title')}</span>
        </button>
        <div className="header-actions">
          {session.stage === 'guide' && onSearch && (
            <button type="button" className="icon-button search-trigger" onClick={onSearch} aria-label={t('actions.search')}>
              <Search size={19} /><span className="hidden md:inline">{t('actions.search')}</span><kbd>/</kbd>
            </button>
          )}
          <LanguageSelect compact />
          <button type="button" className="icon-button" onClick={toggleDarkMode} aria-label={darkMode ? t('header.lightMode') : t('header.darkMode')}>
            {darkMode ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button type="button" className="icon-button home-button" onClick={resetSession} aria-label={t('actions.home')}>
            <Home size={19} />
          </button>
        </div>
      </div>
    </header>
  )
}
