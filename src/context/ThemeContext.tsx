import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors as lightColors } from '../theme'

const THEME_KEY = 'aarambh_theme'
const FONT_MODE_KEY = 'aarambh_font_mode'

export type FontMode = 'small' | 'medium' | 'large'
const FONT_SCALES: Record<FontMode, number> = { small: 0.84, medium: 1.0, large: 1.25 }

const darkColors = {
  ...lightColors,
  background: '#101114',
  bg: '#101114',
  card: '#1a1c20',
  white: '#1a1c20',
  text: '#f4f4f5',
  textMuted: '#c2c5cc',
  textLight: 'rgba(194,197,204,0.72)',
  secondary: '#b5bac5',
  surfaceVariant: '#30333a',
  surfaceContainer: '#24272d',
  lightSurface: '#24272d',
  border: '#30333a',
  outline: '#8d7775',
  outlineVariant: '#684846',
  hairline: 'rgba(194,197,204,0.22)',
  primarySoft: '#3b1d1f',
  primarySoftBorder: '#684846',
  dark: '#f4f4f5',
  black: '#ffffff',
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
  const [mode, setModeState] = useState<'light' | 'dark'>('light')
  const [fontMode, setFontModeState] = useState<FontMode>('medium')

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(THEME_KEY), AsyncStorage.getItem(FONT_MODE_KEY), AsyncStorage.getItem('aarambh_font_scale')]).then(([savedTheme, savedMode, legacyScale]) => {
      if (savedTheme === 'dark' || savedTheme === 'light') setModeState(savedTheme)
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
