import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
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
const EAS_PROJECT_ID = 'be1cca30-db67-4709-a407-f3c830ee556a'

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

/**
 * Request notification permissions and register the device's push token with the backend,
 * including user's selected location and interests for targeted delivery.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    await setupNotificationChannel()

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.log('[Notification] Notification permission not granted by user.')
      return null
    }

    // Retrieve Expo Push Token with explicit projectId
    let token: string | null = null
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: EAS_PROJECT_ID,
      })
      token = tokenData.data
    } catch (pushErr: any) {
      console.log('[Notification] Expo push token fetch note:', pushErr?.message)
    }

    const deviceId = await getOrCreateDeviceId()

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
      await axios
        .post(`${API_URL}/notifications/push-token`, {
          token,
          deviceId,
          platform: Platform.OS,
          language: 'hi',
          state: userState,
          city: userCity,
          interests: userInterests,
        })
        .catch((err) => {
          console.log('[Notification] Could not register token with server:', err?.message)
        })
    }

    return token
  } catch (error) {
    console.log('[Notification] registerForPushNotificationsAsync error:', error)
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
