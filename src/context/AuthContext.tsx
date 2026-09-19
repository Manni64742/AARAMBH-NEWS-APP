import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { authApi, userApi } from '../api/endpoints'
import { getToken, setToken } from '../api/client'
import { User } from '../types'

const SESSION_KEY = 'aarambh_user'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isReporter: boolean
  login: (identifier: string, password: string) => Promise<User>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  setSession: (user: User, token: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const token = await getToken()
        const cached = await AsyncStorage.getItem(SESSION_KEY)
        if (token && cached) setUser(JSON.parse(cached))
        if (token) {
          const profile = await userApi.profile()
          setUser(profile.user)
          await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(profile.user))
        }
      } catch {
        await setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const setSession = useCallback(async (newUser: User, token: string) => {
    await setToken(token)
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(newUser))
    setUser(newUser)
  }, [])

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await authApi.login(identifier, password)
    await setToken(res.data.tokens.accessToken)
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }, [])

  const logout = useCallback(async () => {
    await setToken(null)
    await AsyncStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    const profile = await userApi.profile()
    setUser(profile.user)
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(profile.user))
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isReporter: user?.role === 'REPORTER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
        login,
        logout,
        refreshProfile,
        setSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
