import React, { Component, ReactNode, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, fonts, radius, spacing } from '../theme'
import { useTheme } from '../context/ThemeContext'
import { ScaledText as Text } from './ScaledText'
import { AD_BANNER_UNIT_ID, AD_INTERSTITIAL_UNIT_ID, ADS_ENABLED } from '../config'
import { getAdSdk } from './ads/getAdSdk'

class AdErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <BrandedAd /> : this.props.children
  }
}

function BrandedAd({ slot = 'ad' }: { slot?: string }) {
  const { colors: tc } = useTheme()
  return (
    <View style={[styles.branded, { backgroundColor: tc.surfaceVariant, borderColor: tc.border }]}>
      <View style={styles.adLabelWrap}>
        <Text style={[styles.adLabel, { color: tc.textMuted }]}>ADVERTISEMENT</Text>
      </View>
      <View style={styles.brandedInner}>
        <View style={[styles.brandedIcon, { backgroundColor: tc.card }]}>
          <Ionicons name="megaphone-outline" size={20} color={tc.primary} />
        </View>
        <Text style={[styles.brandedTitle, { color: tc.text }]}>Aarambh News</Text>
        <Text style={[styles.brandedSub, { color: tc.textMuted }]}>Your advertisement here · {slot}</Text>
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

/** Drop-in ad slot. Renders a real AdMob banner when the SDK is available and
 *  enabled; otherwise a themed placeholder so the layout always looks right. */
export const AdBanner: React.FC<{
  slot?: string
  size?: 'banner' | 'card'
}> = ({ slot = 'ad' }) => {
  const canRenderNative = useMemo(() => ADS_ENABLED && !!getAdSdk(), [])

  if (!canRenderNative) {
    return (
      <View style={styles.wrap}>
        <BrandedAd slot={slot} />
      </View>
    )
  }

  return (
    <View style={styles.wrap}>
      <AdErrorBoundary>
        <NativeBanner unitId={AD_BANNER_UNIT_ID} />
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
    InterstitialAd.createForAdRequest(id).load().then((ad: any) => {
      ad.onAdEvent((type: string) => {
        if (type === AdEventType.LOADED) ad.show()
      })
    }).catch(() => {})
  } catch {
    // Expo Go / web: no-op
  }
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
  branded: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  adLabelWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adLabel: { fontFamily: fonts.inter[700], fontSize: 9, letterSpacing: 1.2 },
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
  brandedTitle: { fontFamily: fonts.sans[700], fontSize: 13 },
  brandedSub: { fontFamily: fonts.inter[500], fontSize: 11, flexShrink: 1 },
  nativeWrap: { minHeight: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.black, borderRadius: radius.md, overflow: 'hidden' },
})