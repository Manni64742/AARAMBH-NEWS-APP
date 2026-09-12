import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { ScaledText as Text } from '../components/ScaledText'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, radius } from '../theme'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  show: (message: string, type?: Toast['type']) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<Toast | null>(null)
  const opacity = useRef(new Animated.Value(0)).current

  const show = useCallback(
    (message: string, type: Toast['type'] = 'info') => {
      setToast({ id: Date.now(), message, type })
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start()
      setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() =>
          setToast(null)
        )
      }, 2600)
    },
    [opacity]
  )

  const value: ToastContextValue = {
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
    info: (m) => show(m, 'info'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <SafeAreaView pointerEvents="none" style={styles.wrap}>
          <Animated.View
            style={[styles.toast, { opacity }, toast.type === 'success' && styles.success, toast.type === 'error' && styles.error]}
          >
            <Text style={styles.text}>{toast.message}</Text>
          </Animated.View>
        </SafeAreaView>
      )}
    </ToastContext.Provider>
  )
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center', zIndex: 9999 },
  toast: {
    maxWidth: '90%',
    backgroundColor: '#1b1c1e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  success: { backgroundColor: '#2e7d32' },
  error: { backgroundColor: '#ba1a1a' },
  text: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
})

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
