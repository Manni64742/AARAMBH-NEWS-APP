import React, { Component, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import {
  Linking,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { WebView } from 'react-native-webview'
import { colors, fonts, radius, spacing } from '../theme'
import { useTheme } from '../context/ThemeContext'
import { ScaledText as Text } from './ScaledText'
import { AD_BANNER_UNIT_ID, AD_INTERSTITIAL_UNIT_ID, ADS_ENABLED } from '../config'
import { getAdSdk } from './ads/getAdSdk'
import { advertisementApi } from '../api/endpoints'
import { ActiveAdvertisementItem } from '../types'

// Simple in-memory cache with 3-minute TTL to prevent re-fetching on small scrolls
const adCache: Record<string, { ad: ActiveAdvertisementItem | null; timestamp: number }> = {}
const CACHE_TTL_MS = 3 * 60 * 1000

export function clearAdCache(slot?: string) {
  if (slot) {
    delete adCache[slot]
  } else {
    Object.keys(adCache).forEach((k) => delete adCache[k])
  }
}

class AdErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err: any) {
    console.warn('Ad rendering error handled gracefully:', err)
  }
  render() {
    return this.state.failed ? this.props.fallback || <BrandedAd /> : this.props.children
  }
}

export function BrandedAd({ slot = 'ad' }: { slot?: string }) {
  const { colors: tc } = useTheme()
  return (
    <View style={[styles.branded, { backgroundColor: tc.surfaceVariant, borderColor: tc.border }]}>
      <View style={[styles.adLabelWrap, { borderBottomColor: tc.border }]}>
        <Text style={[styles.adLabel, { color: tc.textMuted }]}>ADVERTISEMENT</Text>
      </View>
      <View style={styles.brandedInner}>
        <View style={[styles.brandedIcon, { backgroundColor: tc.card }]}>
          <Ionicons name="megaphone-outline" size={20} color={tc.primary} />
        </View>
        <Text style={[styles.brandedTitle, { color: tc.text }]}>Aarambh News</Text>
        <Text style={[styles.brandedSub, { color: tc.textMuted }]}>Sponsored Story · {slot}</Text>
      </View>
    </View>
  )
}

function NativeBanner({ unitId }: { unitId: string }) {
  const sdk = getAdSdk()
  if (!sdk) return <BrandedAd />
  const BannerAd = sdk.BannerAd
  const BannerAdSize = sdk.BannerAdSize
  const TestIds = sdk.TestIds
  const isTest = String(unitId).startsWith('ca-app-pub-3940256099942544')
  const id = isTest ? TestIds.BANNER : unitId
  return (
    <View style={styles.nativeWrap}>
      <BannerAd unitId={id} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  )
}

/**
 * Isolated Sandboxed Script Renderer
 */
function ScriptAdRenderer({
  ad,
  isDark,
  themeColors,
}: {
  ad: ActiveAdvertisementItem
  isDark: boolean
  themeColors: any
}) {
  const [webViewHeight, setWebViewHeight] = useState(100)
  const webViewRef = useRef<WebView>(null)

  const htmlSource = useMemo(() => {
    const bgColor = isDark ? '#1a1f26' : '#ffffff'
    const textColor = isDark ? '#e2e8f0' : '#1e293b'

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        background-color: ${bgColor};
        color: ${textColor};
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        overflow: hidden;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      #ad-container {
        width: 100%;
        text-align: center;
        padding: 4px;
      }
      img { max-width: 100% !important; height: auto !important; border-radius: 6px; }
      a { color: inherit; text-decoration: none; }
    </style>
  </head>
  <body>
    <div id="ad-container">
      ${ad.script || ''}
    </div>
    <script>
      function notifyParent() {
        try {
          var container = document.getElementById('ad-container');
          var height = container ? container.scrollHeight : document.body.scrollHeight;
          if (window.ReactNativeWebView && height > 20) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'AD_HEIGHT', height: height }));
          }
        } catch(e) {}
      }
      window.addEventListener('load', notifyParent);
      setTimeout(notifyParent, 300);
      setTimeout(notifyParent, 1000);
      setTimeout(notifyParent, 2500);
    </script>
  </body>
</html>`
  }, [ad.script, isDark])

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)
      if (data?.type === 'AD_HEIGHT' && typeof data.height === 'number') {
        const clampedHeight = Math.max(50, Math.min(Math.round(data.height) + 12, 340))
        setWebViewHeight(clampedHeight)
      }
    } catch {
      // ignore
    }
  }

  const handleShouldStartLoad = (request: any) => {
    const url = request.url
    if (!url || url === 'about:blank' || url.startsWith('data:')) {
      return true
    }

    if (ad._id) {
      advertisementApi.recordClick(ad._id)
    }

    const dest = ad.targetUrl && ad.targetUrl.trim() ? ad.targetUrl : url
    Linking.openURL(dest).catch(() => {})
    return false
  }

  return (
    <View
      style={[
        styles.branded,
        {
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
          height: webViewHeight + 24,
        },
      ]}
    >
      <View style={[styles.adLabelWrap, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.adLabel, { color: themeColors.textMuted }]}>
          SPONSORED · {((ad.placements && ad.placements[0]) || ad.placement || 'ADVERTISEMENT').toUpperCase()}
        </Text>
      </View>
      <WebView
        ref={webViewRef}
        source={{ html: htmlSource }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  )
}

/**
 * Image Banner Ad Renderer
 */
function ImageAdRenderer({
  ad,
  themeColors,
}: {
  ad: ActiveAdvertisementItem
  themeColors: any
}) {
  const handlePress = () => {
    if (ad._id) {
      advertisementApi.recordClick(ad._id)
    }
    if (ad.targetUrl) {
      Linking.openURL(ad.targetUrl).catch(() => {})
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.branded, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
    >
      <View style={[styles.adLabelWrap, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.adLabel, { color: themeColors.textMuted }]}>
          SPONSORED · {((ad.placements && ad.placements[0]) || ad.placement || 'ADVERTISEMENT').toUpperCase()}
        </Text>
      </View>
      <View style={styles.imageAdWrap}>
        <Image
          source={{ uri: ad.imageUrl }}
          style={styles.imageAdBanner}
          contentFit="cover"
          transition={200}
        />
      </View>
      {ad.title ? (
        <View style={styles.imageAdFooter}>
          <Text style={[styles.imageAdTitle, { color: themeColors.text }]} numberOfLines={1}>
            {ad.title}
          </Text>
          {ad.targetUrl ? (
            <View style={styles.openLinkBadge}>
              <Ionicons name="open-outline" size={13} color={themeColors.primary} />
              <Text style={[styles.openLinkText, { color: themeColors.primary }]}>Learn More</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  )
}

export interface AdBannerProps {
  slot?: string
  size?: 'banner' | 'card'
  style?: StyleProp<ViewStyle>
  hideIfEmpty?: boolean
}

/**
 * Dynamic Advertisement Container
 * Fetches active advertisement for `slot` from Backend and renders:
 * 1. Sandboxed script/embed code inside isolated WebView
 * 2. Image banner with destination URL
 * 3. Graceful branded fallback (or Native AdMob when configured)
 */
export const AdBanner: React.FC<AdBannerProps> = ({
  slot = 'home_top',
  style,
  hideIfEmpty = false,
}) => {
  const { colors: tc, isDark } = useTheme()
  const [activeAd, setActiveAd] = useState<ActiveAdvertisementItem | null>(() => {
    const cached = adCache[slot]
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.ad
    }
    return null
  })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true

    const fetchAd = async () => {
      const cached = adCache[slot]
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        if (isMounted) {
          setActiveAd(cached.ad)
          setLoaded(true)
        }
        return
      }

      try {
        const ad = await advertisementApi.getActive(slot)
        if (isMounted) {
          adCache[slot] = { ad, timestamp: Date.now() }
          setActiveAd(ad)
          setLoaded(true)
          if (ad?._id) {
            advertisementApi.recordImpression(ad._id)
          }
        }
      } catch (err) {
        if (isMounted) {
          setLoaded(true)
        }
      }
    }

    fetchAd()

    return () => {
      isMounted = false
    }
  }, [slot])

  const canRenderNative = useMemo(() => ADS_ENABLED && !!getAdSdk(), [])

  return (
    <View style={[styles.wrap, style]}>
      <AdErrorBoundary fallback={<BrandedAd slot={slot} />}>
        {activeAd?.script && activeAd.script.trim() ? (
          <ScriptAdRenderer ad={activeAd} isDark={isDark} themeColors={tc} />
        ) : activeAd?.imageUrl && activeAd.imageUrl.trim() ? (
          <ImageAdRenderer ad={activeAd} themeColors={tc} />
        ) : canRenderNative ? (
          <NativeBanner unitId={AD_BANNER_UNIT_ID} />
        ) : hideIfEmpty ? null : (
          <BrandedAd slot={slot} />
        )}
      </AdErrorBoundary>
    </View>
  )
}

/** Full-screen interstitial — fires once per article when enabled. */
export function showInterstitialIfEnabled() {
  if (!ADS_ENABLED) return
  try {
    const sdk = getAdSdk()
    if (!sdk) return
    const InterstitialAd = sdk.InterstitialAd
    const AdEventType = sdk.AdEventType
    const TestIds = sdk.TestIds
    const id = String(AD_INTERSTITIAL_UNIT_ID).startsWith('ca-app-pub-3940256099942544')
      ? TestIds.INTERSTITIAL
      : AD_INTERSTITIAL_UNIT_ID
    InterstitialAd.createForAdRequest(id)
      .load()
      .then((ad: any) => {
        ad.onAdEvent((type: string) => {
          if (type === AdEventType.LOADED) ad.show()
        })
      })
      .catch(() => {})
  } catch {
    // Expo Go / web: no-op
  }
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  branded: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  adLabelWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adLabel: {
    fontFamily: fonts.inter[700],
    fontSize: 9,
    letterSpacing: 1.2,
  },
  brandedInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  brandedIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandedTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 13,
  },
  brandedSub: {
    fontFamily: fonts.inter[500],
    fontSize: 11,
    flexShrink: 1,
  },
  imageAdWrap: {
    width: '100%',
    height: 120,
    backgroundColor: '#000',
  },
  imageAdBanner: {
    width: '100%',
    height: '100%',
  },
  imageAdFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  imageAdTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 13,
    flex: 1,
  },
  openLinkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  openLinkText: {
    fontFamily: fonts.inter[700],
    fontSize: 11,
  },
  nativeWrap: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.black,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
})