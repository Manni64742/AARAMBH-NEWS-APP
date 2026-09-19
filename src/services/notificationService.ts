import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { API_URL } from '../config'

// Configure foreground presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

const DEVICE_ID_KEY = 'aarambh_unique_device_id'
const PUSH_TOKEN_KEY = 'aarambh_expo_push_token'
const LAST_PROCESSED_NEWS_ID_KEY = 'aarambh_last_processed_news_id'
const UNREAD_COUNT_KEY = 'aarambh_unread_notif_count'
const EAS_PROJECT_ID =
  (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ??
  (Constants.easConfig?.projectId as string | undefined) ??
  '980071c6-0de9-4ea3-bfa9-c837696a6d7d'

type UnreadListener = (count: number) => void
const unreadListeners: Set<UnreadListener> = new Set()

export function subscribeUnreadCount(listener: UnreadListener) {
  unreadListeners.add(listener)
  getUnreadCount().then(listener)
  return () => {
    unreadListeners.delete(listener)
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(UNREAD_COUNT_KEY)
    return raw ? parseInt(raw, 10) || 0 : 0
  } catch {
    return 0
  }
}

export async function setUnreadCount(count: number): Promise<void> {
  try {
    const safe = Math.max(0, count)
    await AsyncStorage.setItem(UNREAD_COUNT_KEY, safe.toString())
    unreadListeners.forEach((l) => l(safe))
  } catch {
    // ignore
  }
}

export async function incrementUnreadCount(delta = 1): Promise<number> {
  const current = await getUnreadCount()
  const next = current + delta
  await setUnreadCount(next)
  return next
}

export async function markAllNotificationsSeen(): Promise<void> {
  await setUnreadCount(0)
}

export async function getOrCreateDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
    await AsyncStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('aarambh_news_default', {
      name: 'Aarambh News',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF2E00',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    })
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Aarambh News Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      showBadge: true,
    })
  }
}

export async function sendPushDebugLog(data: Record<string, any>): Promise<void> {
  try {
    await axios.post(
      `${API_URL}/notifications/debug-log`,
      {
        ...data,
        platform: Platform.OS,
        clientTime: new Date().toISOString(),
      },
      { timeout: 8000 }
    )
  } catch {
    // silently fail
  }
}

export interface DiagnosticResult {
  ok: boolean
  step: string
  permissionStatus: string
  token: string | null
  deviceId: string
  serverRegistered: boolean
  error?: string
  appVersion: string
}

export async function runPushNotificationDiagnostic(): Promise<DiagnosticResult> {
  const deviceId = await getOrCreateDeviceId()
  const appVersion = Constants.expoConfig?.version || '1.0.1'
  let step = 'init'
  let permissionStatus = 'unknown'
  let token: string | null = null
  let serverRegistered = false
  let errorMsg = ''

  try {
    step = 'setupChannel'
    await setupNotificationChannel()

    step = 'checkPermission'
    const perm = await Notifications.getPermissionsAsync()
    permissionStatus = perm.status
    if (perm.status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync()
      permissionStatus = req.status
    }

    if (permissionStatus !== 'granted') {
      await sendPushDebugLog({ step: 'DIAGNOSTIC_PERMISSION_DENIED', permissionStatus, deviceId, appVersion })
      return {
        ok: false,
        step: 'permission',
        permissionStatus,
        token: null,
        deviceId,
        serverRegistered: false,
        error: `Permission is ${permissionStatus}. Device notification setting is disabled.`,
        appVersion,
      }
    }

    step = 'fetchExpoToken'
    const effectiveProjectId = EAS_PROJECT_ID || '980071c6-0de9-4ea3-bfa9-c837696a6d7d'
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: effectiveProjectId,
      })
      token = tokenData.data
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token)
    } catch (tokenErr: any) {
      errorMsg = tokenErr?.message || String(tokenErr)
      await sendPushDebugLog({
        step: 'DIAGNOSTIC_TOKEN_ERROR',
        error: errorMsg,
        deviceId,
        appVersion,
      })
      return {
        ok: false,
        step: 'fetchExpoToken',
        permissionStatus,
        token: null,
        deviceId,
        serverRegistered: false,
        error: `Expo token error: ${errorMsg}`,
        appVersion,
      }
    }

    step = 'registerWithServer'
    if (token) {
      let userState: string | undefined
      let userCity: string | undefined
      let userInterests: string[] = []

      try {
        const rawLoc = await AsyncStorage.getItem('aarambh_location')
        if (rawLoc) {
          const parsed = JSON.parse(rawLoc)
          userState = parsed.state || parsed.label
          userCity = parsed.city || parsed.district
        }
        const rawInterests = await AsyncStorage.getItem('aarambh_guest_interests')
        if (rawInterests) {
          userInterests = JSON.parse(rawInterests)
        }
      } catch {}

      try {
        const resp = await axios.post(
          `${API_URL}/notifications/push-token`,
          {
            token,
            deviceId,
            platform: Platform.OS,
            language: 'hi',
            state: userState,
            city: userCity,
            interests: userInterests,
          },
          { timeout: 15000 }
        )
        serverRegistered = Boolean(resp.data?.success)
        await sendPushDebugLog({
          step: 'DIAGNOSTIC_REGISTER_SUCCESS',
          token,
          deviceId,
          appVersion,
        })
      } catch (apiErr: any) {
        errorMsg = apiErr?.response?.data?.message || apiErr?.message || String(apiErr)
        await sendPushDebugLog({
          step: 'DIAGNOSTIC_REGISTER_FAIL',
          error: errorMsg,
          token,
          deviceId,
          appVersion,
        })
      }
    }

    return {
      ok: Boolean(token && serverRegistered),
      step: 'completed',
      permissionStatus,
      token,
      deviceId,
      serverRegistered,
      error: errorMsg || undefined,
      appVersion,
    }
  } catch (err: any) {
    const errText = err?.message || String(err)
    await sendPushDebugLog({
      step: 'DIAGNOSTIC_FATAL',
      failedStep: step,
      error: errText,
      deviceId,
      appVersion,
    })
    return {
      ok: false,
      step,
      permissionStatus,
      token,
      deviceId,
      serverRegistered: false,
      error: `Diagnostic error at ${step}: ${errText}`,
      appVersion,
    }
  }
}

export async function sendTestPushNotification(customToken?: string): Promise<{ success: boolean; message: string }> {
  try {
    const token = customToken || (await AsyncStorage.getItem(PUSH_TOKEN_KEY))
    const deviceId = await getOrCreateDeviceId()

    // Show immediate local notification on device
    await showLocalSystemNotification(
      'Aarambh News Live Push Test',
      'बधाई हो! आपकी पुश नोटिफिकेशन सफलतापूर्वक काम कर रही है।'
    )

    const resp = await axios.post(
      `${API_URL}/notifications/test-push`,
      { token, deviceId },
      { timeout: 15000 }
    )

    return {
      success: true,
      message: resp.data?.message || 'Test push sent successfully!',
    }
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Failed to send test push'
    return {
      success: false,
      message: msg,
    }
  }
}

/**
 * Request notification permissions and register the device's push token with the backend,
 * including user's selected location and interests for targeted delivery.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  const deviceId = await getOrCreateDeviceId()
  const appVersion = Constants.expoConfig?.version || '1.0.1'

  try {
    await setupNotificationChannel()

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    await sendPushDebugLog({
      step: 'PERMISSION_EVALUATED',
      existingStatus,
      finalStatus,
      deviceId,
      appVersion,
    })

    if (finalStatus !== 'granted') {
      console.log('[Notification] Notification permission not granted by user.')
      return null
    }

    // Retrieve Expo Push Token with explicit projectId
    let token: string | null = null
    const effectiveProjectId = EAS_PROJECT_ID || '980071c6-0de9-4ea3-bfa9-c837696a6d7d'

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: effectiveProjectId,
      })
      token = tokenData.data
      console.log('[Notification] Successfully acquired Expo Push Token:', token)
      await sendPushDebugLog({
        step: 'TOKEN_FETCH_SUCCESS',
        token,
        deviceId,
        appVersion,
      })
    } catch (pushErr: any) {
      const pushErrMsg = pushErr?.message || String(pushErr)
      console.error('[Notification] Expo push token fetch error:', pushErrMsg)
      await sendPushDebugLog({
        step: 'TOKEN_FETCH_ERROR',
        error: pushErrMsg,
        stack: pushErr?.stack,
        deviceId,
        appVersion,
      })
    }

    // Read user's selected location & interests from storage
    let userState: string | undefined
    let userCity: string | undefined
    let userInterests: string[] = []

    try {
      const rawLoc = await AsyncStorage.getItem('aarambh_location')
      if (rawLoc) {
        const parsed = JSON.parse(rawLoc)
        userState = parsed.state || parsed.label
        userCity = parsed.city || parsed.district
      }
      const rawInterests = await AsyncStorage.getItem('aarambh_guest_interests')
      if (rawInterests) {
        userInterests = JSON.parse(rawInterests)
      }
    } catch {
      // ignore
    }

    if (token) {
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token)
      // Register with Aarambh News backend
      try {
        const resp = await axios.post(
          `${API_URL}/notifications/push-token`,
          {
            token,
            deviceId,
            platform: Platform.OS,
            language: 'hi',
            state: userState,
            city: userCity,
            interests: userInterests,
          },
          { timeout: 15000 }
        )
        console.log('[Notification] Device push token registered with server response:', resp.data?.success)
        await sendPushDebugLog({
          step: 'SERVER_REGISTER_SUCCESS',
          token,
          deviceId,
          appVersion,
        })
      } catch (err: any) {
        const apiErrMsg = err?.response?.data || err?.message || String(err)
        console.error('[Notification] Could not register token with server:', apiErrMsg)
        await sendPushDebugLog({
          step: 'SERVER_REGISTER_ERROR',
          error: apiErrMsg,
          token,
          deviceId,
          appVersion,
        })
      }
    }

    return token
  } catch (error: any) {
    const fatalMsg = error?.message || String(error)
    console.error('[Notification] registerForPushNotificationsAsync fatal error:', fatalMsg)
    await sendPushDebugLog({
      step: 'REGISTER_FATAL_ERROR',
      error: fatalMsg,
      deviceId,
      appVersion,
    })
    return null
  }
}

/**
 * Display an immediate notification in the Android system tray / notification shade
 * with sound, vibration, professional Aarambh News branding, and deep-link payload
 */
export async function showLocalSystemNotification(
  title: string,
  body?: string,
  contentId?: string
): Promise<void> {
  try {
    await setupNotificationChannel()

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Aarambh News',
        body: title || body || '',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 250, 250, 250],
        data: {
          contentId,
          url: contentId ? `aarambhnews://article/${contentId}` : undefined,
        },
        badge: 1,
      },
      trigger: null, // show immediately
    })

    await incrementUnreadCount(1)
  } catch (err) {
    console.log('[Notification] showLocalSystemNotification error:', err)
  }
}

/**
 * Check for newly published news from the backend and trigger system notifications.
 * Respects user location/interest preferences, with breaking news always delivered.
 */
export async function checkForNewBreakingNews(): Promise<void> {
  try {
    const res = await axios.get(`${API_URL}/news/home-bundles?limit=5`).catch(() => null)
    if (!res || !res.data?.data?.thematicSections) return

    const sections = res.data.data.thematicSections
    const latestItems: any[] = []
    sections.forEach((sec: any) => {
      if (Array.isArray(sec.items)) {
        latestItems.push(...sec.items)
      }
    })

    if (!latestItems.length) return

    // Find the newest article by publishedAt or createdAt
    latestItems.sort((a, b) => {
      const tA = new Date(a.publishedAt || a.createdAt || 0).getTime()
      const tB = new Date(b.publishedAt || b.createdAt || 0).getTime()
      return tB - tA
    })

    const newest = latestItems[0]
    const lastSeenId = await AsyncStorage.getItem(LAST_PROCESSED_NEWS_ID_KEY)

    if (!lastSeenId) {
      // First run: save latest without spamming
      await AsyncStorage.setItem(LAST_PROCESSED_NEWS_ID_KEY, newest._id)
      return
    }

    if (newest._id !== lastSeenId) {
      // Check location match if not breaking news
      const isBreaking = Boolean(newest.flags?.isBreaking)
      let matchesUser = true

      if (!isBreaking && newest.location?.state) {
        try {
          const rawLoc = await AsyncStorage.getItem('aarambh_location')
          if (rawLoc) {
            const userLoc = JSON.parse(rawLoc)
            if (userLoc.state && userLoc.state !== 'All India') {
              matchesUser =
                userLoc.state.toLowerCase() === newest.location.state.toLowerCase()
            }
          }
        } catch {
          matchesUser = true
        }
      }

      await AsyncStorage.setItem(LAST_PROCESSED_NEWS_ID_KEY, newest._id)

      if (matchesUser) {
        await showLocalSystemNotification(
          newest.title,
          newest.summary || newest.title,
          newest._id
        )
      }
    }
  } catch (err) {
    // ignore
  }
}
