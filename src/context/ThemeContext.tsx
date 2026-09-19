import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors as lightColors } from '../theme'

const THEME_KEY = 'aarambh_theme'
const FONT_MODE_KEY = 'aarambh_font_mode'

export type FontMode = 'small' | 'medium' | 'large'
const FONT_SCALES: Record<FontMode, number> = { small: 0.88, medium: 1.0, large: 1.2 }

const darkColors = {
  ...lightColors,
  primary: '#FF5722', // मुख्य एक्शन कलर (Vibrant Orange)
  primaryContainer: '#E64A19',
  secondaryAction: '#00A859', // सेकेंडरी एक्शन कलर (Emerald Green)
  highlightBlue: '#1E3A8A', // हाइलाइट/आइकन कलर (Navy Blue)
  highlightBlueLight: '#2563EB',
  background: '#121417',
  bg: '#121417',
  card: '#1A1C22',
  white: '#1A1C22',
  text: '#FFFFFF',
  textMuted: '#94A3B8',
  textLight: 'rgba(148,163,184,0.72)',
  secondary: '#94A3B8',
  surfaceVariant: '#252830',
  surfaceContainer: '#1E2027',
  lightSurface: '#1E2027',
  border: '#282C35',
  outline: '#475569',
  outlineVariant: '#334155',
  hairline: 'rgba(148,163,184,0.22)',
  primarySoft: 'rgba(255, 87, 34, 0.15)',
  primarySoftBorder: 'rgba(255, 87, 34, 0.35)',
  dark: '#FFFFFF',
  black: '#FFFFFF',
}

interface ThemeContextValue {
  mode: 'light' | 'dark'
  isDark: boolean
  colors: typeof lightColors
  toggleTheme: () => void
  setMode: (mode: 'light' | 'dark') => void
  fontMode: FontMode
  fontScale: number
  setFontMode: (mode: FontMode) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<'light' | 'dark'>('dark')
  const [fontMode, setFontModeState] = useState<FontMode>('medium')

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(THEME_KEY), AsyncStorage.getItem(FONT_MODE_KEY), AsyncStorage.getItem('aarambh_font_scale')]).then(([savedTheme, savedMode, legacyScale]) => {
      if (savedTheme === 'dark' || savedTheme === 'light') setModeState(savedTheme)
      else setModeState('dark')
      if (savedMode === 'small' || savedMode === 'medium' || savedMode === 'large') setFontModeState(savedMode)
      else if (legacyScale && Number(legacyScale) >= 1) setFontModeState('large')
    }).catch(() => {})
  }, [])

  const setMode = (nextMode: 'light' | 'dark') => {
    setModeState(nextMode)
    AsyncStorage.setItem(THEME_KEY, nextMode).catch(() => {})
  }

  const setFontMode = (nextMode: FontMode) => {
    setFontModeState(nextMode)
    AsyncStorage.setItem(FONT_MODE_KEY, nextMode).catch(() => {})
  }

  const value = useMemo(() => ({
    mode,
    isDark: mode === 'dark',
    colors: (mode === 'dark' ? darkColors : lightColors) as typeof lightColors,
    toggleTheme: () => setMode(mode === 'dark' ? 'light' : 'dark'),
    setMode,
    fontMode,
    fontScale: FONT_SCALES[fontMode],
    setFontMode,
  }), [mode, fontMode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

const defaultThemeValue: ThemeContextValue = {
  mode: 'light',
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
  setMode: () => {},
  fontMode: 'medium',
  fontScale: FONT_SCALES.medium,
  setFontMode: () => {},
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  return context ?? defaultThemeValue
}
