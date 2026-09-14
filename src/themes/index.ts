import type { BrandTheme } from '../types'

type ThemeModule = { default: BrandTheme }

const modules = import.meta.glob<ThemeModule>('./*.ts', { eager: true })

export const themes = Object.entries(modules)
  .filter(([path]) => !path.endsWith('/index.ts'))
  .map(([, module]) => module.default)
  .sort((a, b) => ['infinix', 'tecno', 'itel'].indexOf(a.id) - ['infinix', 'tecno', 'itel'].indexOf(b.id))

export const themeMap = Object.fromEntries(themes.map((theme) => [theme.id, theme]))

export const neutralTheme: BrandTheme = {
  id: 'transsion',
  name: 'Transsion',
  logo: './brandmarks/transsion.svg',
  taglineKey: 'app.subtitle',
  osName: 'Android',
  supportUrl: 'https://wa.me/5511986543471',
  colors: {
    primary: '#5B73F2',
    primaryStrong: '#3D52CC',
    secondary: '#0A1326',
    accent: '#9BA8FF',
    glow: 'rgba(91, 115, 242, 0.24)',
  },
}
