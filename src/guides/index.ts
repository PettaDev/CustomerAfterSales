import type { CaptureMethod, Guide } from '../types'

const modules = import.meta.glob<Guide>('./*/*.json', { eager: true, import: 'default' })

const mobileStepOrder = [
  'prepare-phone',
  'developer-options',
  'logger-access',
  'logger-config',
  'logger-clear',
  'start-capture',
  'reproduce',
  'termux-setup',
  'wireless-debugging',
  'split-screen',
  'pair-adb',
  'connect-adb',
  'pull-logs',
  'verify-files',
  'finish',
]

const mobileStepPosition = new Map(mobileStepOrder.map((id, index) => [id, index]))
const guides = Object.values(modules).map((guide) => guide.method === 'mobile'
  ? {
      ...guide,
      steps: [...guide.steps].sort((left, right) =>
        (mobileStepPosition.get(left.id) ?? Number.MAX_SAFE_INTEGER)
        - (mobileStepPosition.get(right.id) ?? Number.MAX_SAFE_INTEGER)),
    }
  : guide)

export const guideMap = Object.fromEntries(
  guides.map((guide) => [guide.brand + ':' + guide.method, guide]),
) as Record<string, Guide>

export const getGuide = (brandId: string, method: CaptureMethod) => guideMap[brandId + ':' + method]
