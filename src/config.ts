import { Platform } from 'react-native'

const DEFAULT_API_BASE =
  typeof window !== 'undefined' &&
  (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://api.aarambhnews.online'
const RAW_API_BASE = process.env.EXPO_PUBLIC_API_BASE || DEFAULT_API_BASE
export const API_BASE = RAW_API_BASE.replace(/\/+$/, '')
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

export const DEFAULT_COVER_IMAGE = `${API_BASE}/uploads/default-cover.png`;

export function mediaUrl(path?: string) {
  if (!path || path.includes('unsplash.com/photo-')) return DEFAULT_COVER_IMAGE;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

// AdMob — see AdBanner.tsx. Real IDs live in app.json; these constants can be
// overridden per-build. When ADS_ENABLED is false (or no native module is
// available, e.g. Expo Go), a branded placeholder ad is shown instead.
export const ADS_ENABLED = false
export const AD_BANNER_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111'
export const AD_INTERSTITIAL_UNIT_ID = 'ca-app-pub-3940256099942544/1033173712'
