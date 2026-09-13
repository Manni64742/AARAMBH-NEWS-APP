import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useFonts } from 'expo-font'
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans'
import {
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_700Bold,
} from '@expo-google-fonts/noto-sans-devanagari'
import { AuthProvider } from './src/context/AuthContext'
import { LanguageProvider } from './src/context/LanguageContext'
import { LocationProvider } from './src/context/LocationContext'
import { ToastProvider } from './src/context/ToastContext'
import { ThemeProvider, useTheme } from './src/context/ThemeContext'
import RootNavigator, { navigateToNewsDetail } from './src/navigation/RootNavigator'
import { AarambhSplashScreen } from './src/components/AarambhSplashScreen'
import * as Notifications from 'expo-notifications'
import { registerForPushNotificationsAsync, checkForNewBreakingNews } from './src/services/notificationService'

function AppContent() {
  const { isDark } = useTheme()

  React.useEffect(() => {
    // 1. Register device for push notifications
    registerForPushNotificationsAsync().catch(() => {})

    // 2. Listen for clicks on Android notification tray / slider
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data
      const contentId = data?.contentId
      if (contentId) {
        navigateToNewsDetail(String(contentId))
      }
    })

    // 3. Check for new breaking news periodically
    checkForNewBreakingNews().catch(() => {})
    const interval = setInterval(() => {
      checkForNewBreakingNews().catch(() => {})
    }, 30000)

    return () => {
      sub.remove()
      clearInterval(interval)
    }
  }, [])

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  )
}

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_700Bold,
  })

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              <LocationProvider>
                <ToastProvider>
                  {!fontsLoaded ? (
                    <AarambhSplashScreen isReady={false} />
                  ) : (
                    <AppContent />
                  )}
                </ToastProvider>
              </LocationProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
