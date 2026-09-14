import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ar from './locales/ar/translation.json'
import en from './locales/en/translation.json'
import es419 from './locales/es-419/translation.json'
import fr from './locales/fr/translation.json'
import ptBR from './locales/pt-BR/translation.json'
import ru from './locales/ru/translation.json'
import zhCN from './locales/zh-CN/translation.json'

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'pt-BR': { translation: ptBR },
    'es-419': { translation: es419 },
    'zh-CN': { translation: zhCN },
    fr: { translation: fr },
    ar: { translation: ar },
    ru: { translation: ru },
  },
  lng: 'pt-BR',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
