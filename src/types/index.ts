export type LanguageCode = 'en' | 'pt-BR' | 'es-419' | 'zh-CN' | 'fr' | 'ar' | 'ru'
export type CountryRegion = 'africa' | 'asia' | 'southAmerica' | 'northAmerica' | 'europe'
export type CaptureMethod = 'pc' | 'mobile'
export type WizardStage = 'language' | 'brand' | 'method' | 'guide'

export interface BrandTheme {
  id: string
  name: string
  logo: string
  taglineKey: string
  osName: string
  supportUrl: string
  colors: {
    primary: string
    primaryStrong: string
    secondary: string
    accent: string
    glow: string
  }
}

export interface DownloadBlock {
  type: 'download'
  titleKey: string
  descriptionKey: string
  buttonKey: string
  fileName: string
  url: string
  version: string
  size: string
  icon?: string
  checksum?: string
  releaseNotes?: string
  acknowledgmentKey?: string
}

export interface CodeBlock {
  type: 'code'
  code: string
  labelKey?: string
}

export interface NoticeBlock {
  type: 'info' | 'warning' | 'success'
  titleKey: string
  descriptionKey: string
}

export interface ImageBlock {
  type: 'image'
  src: string
  altKey: string
  captionKey?: string
}

export interface GalleryImage {
  src: string
  altKey: string
  captionKey?: string
}

export interface GalleryBlock {
  type: 'gallery'
  images: GalleryImage[]
}

export interface VideoBlock {
  type: 'video'
  titleKey: string
  url?: string
  src?: string
  portrait?: boolean
}

export interface ChecklistBlock {
  type: 'checklist'
  itemKeys: string[]
}

export type GuideBlock = DownloadBlock | CodeBlock | NoticeBlock | ImageBlock | GalleryBlock | VideoBlock | ChecklistBlock

export interface GuideStep {
  id: string
  titleKey: string
  descriptionKey: string
  eyebrowKey?: string
  blocks?: GuideBlock[]
}

export interface Guide {
  brand: string
  method: CaptureMethod
  titleKey: string
  estimatedMinutes: number
  steps: GuideStep[]
}

export interface PersistedSession {
  language: LanguageCode | null
  countryCode: string
  brandId: string | null
  method: CaptureMethod | null
  stage: WizardStage
  guideStep: number
  reachedStep: number
  completed: string[]
}
