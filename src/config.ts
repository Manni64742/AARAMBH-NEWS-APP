import { Platform } from 'react-native'

export const API_BASE = 'https://api.neelamfoundation.in'
export const API_URL = `${API_BASE}/api/v1`

export const APP_NAME = 'Aarambh News'
export const APP_TAGLINE = 'Hyperlocal News App'

export const SUPPORTED_LANGUAGES = [
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'en', label: 'English' },
] as const

export function getApiUrl() {
  return API_URL
}

export function mediaUrl(path?: string) {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  return `${API_BASE}${path}`
}

// AdMob — see AdBanner.tsx. Real IDs live in app.json; these constants can be
// overridden per-build. When ADS_ENABLED is false (or no native module is
// available, e.g. Expo Go), a branded placeholder ad is shown instead.
export const ADS_ENABLED = false
export const AD_BANNER_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111'
export const AD_INTERSTITIAL_UNIT_ID = 'ca-app-pub-3940256099942544/1033173712'
