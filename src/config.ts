import { Platform } from 'react-native'

const envBase = process.env.EXPO_PUBLIC_API_BASE?.trim()
export const API_BASE = (envBase && !envBase.includes('localhost') && !envBase.includes('127.0.0.1')
  ? envBase
  : 'https://api.aarambhnews.online'
).replace(/\/+$/, '')
export const API_URL = `${API_BASE}/api/v1`

export const APP_NAME = 'Aarambh News'
export const APP_TAGLINE = 'Aaramb News App'

export const SUPPORTED_LANGUAGES = [
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'en', label: 'English' },
] as const

export function getApiUrl() {
  return API_URL
}

export const APP_LOGO = require('../assets/aarambh_news_logo.png');
export const DEFAULT_COVER_IMAGE = `${API_BASE}/uploads/default-cover.png`;

export function mediaUrl(path?: string): string | undefined {
  if (!path || path.includes('unsplash.com/photo-') || path.includes('default-cover.png')) return undefined;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

// AdMob — see AdBanner.tsx. Real IDs live in app.json; these constants can be
// overridden per-build. When ADS_ENABLED is false (or no native module is
// available, e.g. Expo Go), a branded placeholder ad is shown instead.
export const ADS_ENABLED = false
export const AD_BANNER_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111'
export const AD_INTERSTITIAL_UNIT_ID = 'ca-app-pub-3940256099942544/1033173712'
