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

export async function sendPushDebugLog(_data: Record<string, any>): Promise<void> {
  // Silent in production to prevent unnecessary network traffic
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
  const appVersion = Constants.expoConfig?.version || '1.0.3'
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
      if (permissionStatus === 'granted') {
        // Allow Android FCM / Google Play Services permission state to settle
        await new Promise((resolve) => setTimeout(resolve, 800))
      }
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
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: effectiveProjectId,
        })
        token = tokenData.data
        if (token) {
          await AsyncStorage.setItem(PUSH_TOKEN_KEY, token)
          break
        }
      } catch (tokenErr: any) {
        errorMsg = tokenErr?.message || String(tokenErr)
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1500))
        }
      }
    }

    if (!token) {
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

let registrationPromise: Promise<string | null> | null = null

/**
 * Request notification permissions and register the device's push token with the backend,
 * including user's selected location and interests for targeted delivery.
 */
export function registerForPushNotificationsAsync(): Promise<string | null> {
  if (registrationPromise) {
    return registrationPromise
  }

  registrationPromise = (async () => {
    try {
      return await executePushRegistration()
    } finally {
      registrationPromise = null
    }
  })()

  return registrationPromise
}

async function executePushRegistration(): Promise<string | null> {
  const deviceId = await getOrCreateDeviceId()
  const appVersion = Constants.expoConfig?.version || '1.0.3'

  let deviceModel: string | undefined
  let osVersion: string | undefined
  try {
    if (Platform.OS === 'android') {
      const constants = Platform.constants as any
      const manufacturer = constants?.Manufacturer || ''
      const model = constants?.Model || ''
      const brand = constants?.Brand || ''
      deviceModel = [manufacturer, model || brand].filter(Boolean).join(' ').trim() || 'Android Device'
      osVersion = `Android ${constants?.Release || Platform.Version}`
    } else if (Platform.OS === 'ios') {
      deviceModel = (Platform.constants as any)?.systemName || 'Apple Device'
      osVersion = `iOS ${Platform.Version}`
    }
  } catch {
    // ignore
  }

  try {
    await setupNotificationChannel()

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
      if (finalStatus === 'granted') {
        // Allow Android FCM / Google Play Services permission state to settle
        await new Promise((resolve) => setTimeout(resolve, 800))
      }
    }

    if (finalStatus !== 'granted') {
      console.log('[Notification] Notification permission not granted by user.')
      return null
    }

    // Retrieve Expo Push Token with explicit projectId & serial retry for Android FCM
    let token: string | null = null
    const effectiveProjectId = EAS_PROJECT_ID || '980071c6-0de9-4ea3-bfa9-c837696a6d7d'
    let lastPushError: any = null

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: effectiveProjectId,
        })
        token = tokenData.data
        if (token) {
          console.log('[Notification] Successfully acquired Expo Push Token:', token)
          break
        }
      } catch (pushErr: any) {
        lastPushError = pushErr
        const pushErrMsg = pushErr?.message || String(pushErr)
        console.warn(`[Notification] Token attempt ${attempt} failed:`, pushErrMsg)
        if (attempt < 3) {
          // Wait 2 seconds to let Google Play Services settle
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
      }
    }

    // Fallback to locally stored token if transient FCM error occurred
    if (!token) {
      const cachedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY).catch(() => null)
      if (cachedToken) {
        console.log('[Notification] Using cached push token from storage:', cachedToken)
        token = cachedToken
      }
    }

    if (!token && lastPushError) {
      const pushErrMsg = lastPushError?.message || String(lastPushError)
      console.error('[Notification] Expo push token fetch error after retries:', pushErrMsg)
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

      // Deduplication: Avoid redundant network requests if recently synced with identical config
      const lastSyncKey = 'aarambh_last_token_sync'
      const payloadSignature = `${token}:${userState || ''}:${userCity || ''}:${userInterests.sort().join(',')}`
      const lastSyncRaw = await AsyncStorage.getItem(lastSyncKey).catch(() => null)
      if (lastSyncRaw) {
        try {
          const { signature, timestamp } = JSON.parse(lastSyncRaw)
          if (signature === payloadSignature && Date.now() - timestamp < 6 * 60 * 60 * 1000) {
            console.log('[Notification] Push token already synced with backend recently. Skipping network POST.')
            return token
          }
        } catch {}
      }

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
            appVersion,
            deviceModel,
            osVersion,
          },
          { timeout: 15000 }
        )
        if (resp.data?.success) {
          await AsyncStorage.setItem(
            lastSyncKey,
            JSON.stringify({ signature: payloadSignature, timestamp: Date.now() })
          )
        }
        console.log('[Notification] Device push token registered with server response:', resp.data?.success)
      } catch (err: any) {
        const apiErrMsg = err?.response?.data || err?.message || String(err)
        console.error('[Notification] Could not register token with server:', apiErrMsg)
      }
    }

    return token
  } catch (error: any) {
    const fatalMsg = error?.message || String(error)
    console.error('[Notification] registerForPushNotificationsAsync fatal error:', fatalMsg)
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
