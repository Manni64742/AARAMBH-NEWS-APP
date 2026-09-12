import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as Location from 'expo-location'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LocationState } from '../types'

const LOCATION_KEY = 'aarambh_location'
const ONBOARDING_KEY = 'aarambh_onboarding_done'

interface LocationContextValue {
  current: LocationState | null
  permissionDenied: boolean
  loading: boolean
  detect: () => Promise<LocationState | null>
  setManual: (loc: LocationState) => Promise<void>
  clear: () => Promise<void>
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined)

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [current, setCurrent] = useState<LocationState | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [loading, setLoading] = useState(false)

  const detect = useCallback(async (): Promise<LocationState | null> => {
    setLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setPermissionDenied(true)
        return null
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const geocode = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      })
      const place = geocode[0]
      if (!place) return null
      const loc: LocationState = {
        country: place.country || undefined,
        state: place.region || undefined,
        district: place.district || place.subregion || undefined,
        city: place.city || place.subregion || undefined,
        locality: place.name || undefined,
        label: [place.city || place.subregion, place.region].filter(Boolean).join(', ') || 'Your area',
      }
      setCurrent(loc)
      await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(loc))
      return loc
    } catch {
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const setManual = useCallback(async (loc: LocationState) => {
    setCurrent(loc)
    setPermissionDenied(false)
    await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(loc))
  }, [])

  const clear = useCallback(async () => {
    setCurrent(null)
    await AsyncStorage.removeItem(LOCATION_KEY)
  }, [])

  useEffect(() => {
    ;(async () => {
      const cached = await AsyncStorage.getItem(LOCATION_KEY)
      if (cached) {
        setCurrent(JSON.parse(cached))
        return
      }
      // Default location to 'All India' as requested (GPS prompt bypassed on startup)
      const defaultLoc: LocationState = { label: 'All India', country: 'India' }
      setCurrent(defaultLoc)
      await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(defaultLoc))
      await AsyncStorage.setItem(ONBOARDING_KEY, '1')
    })()
  }, [])

  return (
    <LocationContext.Provider value={{ current, permissionDenied, loading, detect, setManual, clear }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocation must be used within LocationProvider')
  return ctx
}
