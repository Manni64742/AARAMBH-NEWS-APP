import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { userApi } from '../api/endpoints'

export type AppLanguage = 'hi' | 'en'

export interface LanguageOption {
  code: AppLanguage
  label: string
  nativeLabel: string
  description: string
  nativeDescription: string
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    description: 'Hindi News, Videos & Updates',
    nativeDescription: 'ताज़ा ख़बरें, वीडियो और ब्रेकिंग न्यूज़',
  },
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    description: 'Top Stories, Videos & Headlines',
    nativeDescription: 'Breaking news, in-depth reports & headlines',
  },
]

const LANGUAGE_KEY = 'aarambh_language'
const LANGUAGE_SELECTED_KEY = 'aarambh_language_selected'

interface LanguageContextValue {
  language: AppLanguage
  isLanguageSelected: boolean
  isLoading: boolean
  setLanguage: (lang: AppLanguage) => Promise<void>
  completeLanguageOnboarding: (lang: AppLanguage) => Promise<void>
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>('hi')
  const [isLanguageSelected, setIsLanguageSelected] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(LANGUAGE_KEY),
      AsyncStorage.getItem(LANGUAGE_SELECTED_KEY),
    ])
      .then(([storedLang, selectedFlag]) => {
        if (storedLang === 'en' || storedLang === 'hi') {
          setLanguageState(storedLang)
        }
        if (selectedFlag === '1') {
          setIsLanguageSelected(true)
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const setLanguage = useCallback(async (lang: AppLanguage) => {
    setLanguageState(lang)
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang)
      userApi.updatePreferences({ languages: [lang] }).catch(() => {})
    } catch {}
  }, [])

  const completeLanguageOnboarding = useCallback(async (lang: AppLanguage) => {
    setLanguageState(lang)
    setIsLanguageSelected(true)
    try {
      await Promise.all([
        AsyncStorage.setItem(LANGUAGE_KEY, lang),
        AsyncStorage.setItem(LANGUAGE_SELECTED_KEY, '1'),
      ])
      userApi.updatePreferences({ languages: [lang] }).catch(() => {})
    } catch {}
  }, [])

  return (
    <LanguageContext.Provider
      value={{
        language,
        isLanguageSelected,
        isLoading,
        setLanguage,
        completeLanguageOnboarding,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
