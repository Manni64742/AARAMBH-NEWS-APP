import { Platform, TextStyle } from 'react-native'

/**
 * Aarambh News — Global Design System
 * Source of truth: HTML reference design.
 */

export const colors = {
  primary: '#91000a',
  primaryContainer: '#b71c1c',
  onPrimary: '#ffffff',
  background: '#faf9fb',
  text: '#1b1c1e',
  secondary: '#545f73',
  surfaceVariant: '#e3e2e4',
  surfaceContainer: '#efedf0',
  lightSurface: '#f5f3f5',
  white: '#ffffff',
  outline: '#8f706c',
  outlineVariant: '#e4beb9',
  error: '#ba1a1a',
  success: '#2e7d32',
  warning: '#9a5b00',
  dark: '#1b1c1e',
  black: '#000000',

  primarySoft: '#f8ecec',
  primarySoftBorder: '#e4beb9',
  successSoft: '#e8f3ea',
  warningSoft: '#fdf4e1',
  errorSoft: '#fbeaea',

  hairline: 'rgba(84,95,115,0.22)',
  textLight: 'rgba(84,95,115,0.72)',
  overlay: 'rgba(0,0,0,0.55)',

  // Backward-compatible aliases (same palette)
  bg: '#faf9fb',
  card: '#ffffff',
  border: '#e3e2e4',
  textMuted: '#545f73',
  primaryDark: '#7d0009',
  danger: '#ba1a1a',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
}

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
}

export const typography = {
  display: { fontSize: 32, lineHeight: 40 },
  pageTitle: { fontSize: 24, lineHeight: 30 },
  sectionTitle: { fontSize: 20, lineHeight: 26 },
  articleHeadline: { fontSize: 18, lineHeight: 24 },
  body: { fontSize: 15, lineHeight: 22 },
  metadata: { fontSize: 12, lineHeight: 16 },
  smallLabel: { fontSize: 11, lineHeight: 14 },
}

export const fonts = {
  serif: {
    400: 'NotoSans_400Regular',
    700: 'NotoSans_700Bold',
  },
  sans: {
    400: 'NotoSans_400Regular',
    500: 'NotoSans_500Medium',
    600: 'NotoSans_600SemiBold',
    700: 'NotoSans_700Bold',
  },
  devanagari: {
    400: 'NotoSansDevanagari_400Regular',
    700: 'NotoSansDevanagari_700Bold',
  },
  inter: {
    400: 'NotoSans_400Regular',
    500: 'NotoSans_500Medium',
    600: 'NotoSans_600SemiBold',
    700: 'NotoSans_700Bold',
  },
}

export const shadows = {
  card: Platform.select({
    ios: { shadowColor: '#1b1c1e', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
    android: { elevation: 2 },
    default: {},
  }) as object,
  header: Platform.select({
    ios: { shadowColor: '#1b1c1e', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    android: { elevation: 1 },
    default: {},
  }) as object,
}

const DEVANAGARI = /[\u0900-\u097F]/

export function isHindi(text?: string) {
  return !!text && DEVANAGARI.test(text)
}

/** All editorial text uses the Noto Sans family, including Devanagari. */
export function headlineFont(text?: string): string {
  return isHindi(text) ? fonts.devanagari[700] : fonts.sans[700]
}

/** Article body / content → Noto Sans (Hindi → Noto Sans Devanagari). */
export function bodyFont(text?: string): string {
  return isHindi(text) ? fonts.devanagari[400] : fonts.sans[400]
}

/** Labels / buttons / small UI → Noto Sans. */
export function labelFont(weight: 400 | 500 | 600 | 700 = 400): string {
  return fonts.inter[weight]
}

/** Backward-compatible helper: headlines when weight >= 700, body otherwise */
export function fontFor(text: string | undefined, weight: 400 | 500 | 600 | 700 = 400): string {
  return weight >= 700 ? headlineFont(text) : bodyFont(text)
}

/** Convenient style presets */
export const textStyles = {
  display: { fontFamily: fonts.serif[700], ...typography.display } as TextStyle,
  pageTitle: { fontFamily: fonts.serif[700], ...typography.pageTitle } as TextStyle,
  sectionTitle: { fontFamily: fonts.serif[700], ...typography.sectionTitle } as TextStyle,
  articleHeadline: { fontFamily: fonts.serif[700], ...typography.articleHeadline } as TextStyle,
  body: { fontFamily: fonts.sans[400], ...typography.body } as TextStyle,
  metadata: { fontFamily: fonts.inter[500], ...typography.metadata } as TextStyle,
  smallLabel: { fontFamily: fonts.inter[600], ...typography.smallLabel } as TextStyle,
}
