import React, { useEffect, useRef } from 'react'
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native'
import { fonts, radius, spacing } from '../theme'
import { useTheme } from '../context/ThemeContext'
import { ScaledText as Text } from './ScaledText'
import { AarambhLoader } from './AarambhLoader'

export { AarambhLoader }

/**
 * Animated pulsing skeleton block matching Aarambh News theme (light/dark)
 */
export const Skeleton: React.FC<{
  height?: number | string
  width?: number | string
  radius?: number
  style?: any
}> = ({ height = 16, width = '100%', radius: r = radius.md, style }) => {
  const { colors, isDark } = useTheme()
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [opacity])

  const defaultBg = isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.07)'

  return (
    <Animated.View
      style={[
        {
          backgroundColor: colors.surfaceVariant || defaultBg,
          height,
          width,
          borderRadius: r,
          opacity,
        },
        style,
      ]}
    />
  )
}

/**
 * Skeleton exactly matching the actual NewsCard layout:
 * Left: Category badge, 2-line headline, summary, meta info (author, time, views)
 * Right: 90x90 thumbnail
 */
export const NewsCardSkeleton: React.FC<{ style?: any }> = ({ style }) => {
  const { colors: tc } = useTheme()
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: tc.card,
          marginHorizontal: spacing.lg,
          marginBottom: spacing.md,
          padding: spacing.md,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: tc.border,
        },
        style,
      ]}
    >
      <View style={{ flex: 1, paddingRight: spacing.md, justifyContent: 'space-between' }}>
        <View>
          {/* Category Tag Badge */}
          <Skeleton width={64} height={18} radius={radius.sm} style={{ marginBottom: 8 }} />
          {/* Headline (2 lines) */}
          <Skeleton width="96%" height={15} radius={radius.sm} style={{ marginBottom: 6 }} />
          <Skeleton width="78%" height={15} radius={radius.sm} style={{ marginBottom: 8 }} />
          {/* Summary line */}
          <Skeleton width="88%" height={11} radius={radius.xs} style={{ marginBottom: 10 }} />
        </View>
        {/* Meta row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Skeleton width={64} height={10} radius={radius.xs} />
            <Skeleton width={4} height={4} radius={2} />
            <Skeleton width={38} height={10} radius={radius.xs} />
          </View>
          <Skeleton width={32} height={10} radius={radius.xs} />
        </View>
      </View>
      {/* 90x90 Thumbnail */}
      <Skeleton width={90} height={90} radius={radius.md} />
    </View>
  )
}

/**
 * Backward compatibility alias so all screens (Bookmarks, Saved, Search, etc.)
 * get the realistic NewsCard skeleton immediately.
 */
export const SkeletonCard: React.FC = () => <NewsCardSkeleton />

/**
 * Skeleton matching top Breaking News ticker bar
 */
export const BreakingTickerSkeleton: React.FC = () => {
  const { colors: tc } = useTheme()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 38,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
        marginTop: 4,
        paddingHorizontal: 10,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: tc.border,
        backgroundColor: tc.card,
        gap: 10,
      }}
    >
      <Skeleton width={52} height={22} radius={radius.sm} />
      <Skeleton width="68%" height={12} radius={radius.xs} />
    </View>
  )
}

/**
 * Skeleton exactly matching the Hero NewsSlider:
 * Header: Title + SLIDER badge + 1/5 counter
 * Card: 185px hero image with overlays + 2-line headline + summary
 * Dots row below
 */
export const NewsSliderSkeleton: React.FC<{ title?: string }> = ({ title = 'Headlines' }) => {
  const { colors: tc } = useTheme()
  return (
    <View style={{ marginBottom: spacing.md }}>
      {/* Header row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Skeleton width={110} height={18} radius={radius.sm} />
          <Skeleton width={54} height={18} radius={radius.pill} />
        </View>
        <Skeleton width={24} height={14} radius={radius.xs} />
      </View>

      {/* Main Big Hero Card */}
      <View
        style={{
          marginHorizontal: spacing.lg,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: tc.border,
          backgroundColor: tc.card,
          overflow: 'hidden',
        }}
      >
        {/* Top Image area with badges */}
        <View style={{ height: 185, width: '100%', position: 'relative' }}>
          <Skeleton height={185} width="100%" radius={0} />
          {/* Breaking badge top-left */}
          <View style={{ position: 'absolute', top: 10, left: 10 }}>
            <Skeleton width={60} height={20} radius={radius.pill} />
          </View>
          {/* Time badge top-right */}
          <View style={{ position: 'absolute', top: 10, right: 10 }}>
            <Skeleton width={44} height={20} radius={radius.pill} />
          </View>
          {/* Category badge bottom-left */}
          <View style={{ position: 'absolute', bottom: 10, left: 10 }}>
            <Skeleton width={64} height={20} radius={radius.sm} />
          </View>
        </View>

        {/* Card Body */}
        <View style={{ padding: spacing.md }}>
          <Skeleton width="94%" height={16} radius={radius.sm} style={{ marginBottom: 6 }} />
          <Skeleton width="72%" height={16} radius={radius.sm} style={{ marginBottom: 8 }} />
          <Skeleton width="86%" height={12} radius={radius.xs} />
        </View>
      </View>

      {/* Dots Row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          paddingVertical: spacing.sm,
        }}
      >
        <Skeleton width={16} height={5} radius={3} />
        <Skeleton width={5} height={5} radius={2.5} />
        <Skeleton width={5} height={5} radius={2.5} />
        <Skeleton width={5} height={5} radius={2.5} />
      </View>
    </View>
  )
}

/**
 * Skeleton exactly matching the Thematic Section & BundleCard:
 * Section title on top
 * Card container with header ("TITLE" + "VIEW MORE")
 * 3 news rows with tag badge, headline, and 60x60 thumbnail
 */
export const BundleCardSkeleton: React.FC<{ title?: string }> = ({ title }) => {
  const { colors: tc } = useTheme()
  return (
    <View style={{ marginBottom: spacing.lg }}>
      {/* Section Header */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: 14,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Skeleton width={96} height={19} radius={radius.sm} />
      </View>

      {/* Bundle Card Container */}
      <View
        style={{
          marginHorizontal: spacing.lg,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: tc.border,
          backgroundColor: tc.card,
          paddingHorizontal: 14,
          paddingTop: 12,
          paddingBottom: 6,
          overflow: 'hidden',
        }}
      >
        {/* Header row: title + view more */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: tc.border,
          }}
        >
          <Skeleton width={88} height={16} radius={radius.sm} />
          <Skeleton width={64} height={14} radius={radius.xs} />
        </View>

        {/* 3 News Rows */}
        {[1, 2, 3].map((rowIdx) => (
          <View
            key={rowIdx}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 10,
              borderBottomWidth: rowIdx === 3 ? 0 : 1,
              borderBottomColor: tc.border,
            }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Skeleton width={48} height={16} radius={radius.xs} style={{ marginBottom: 6 }} />
              <Skeleton width="92%" height={13} radius={radius.xs} style={{ marginBottom: 4 }} />
              <Skeleton width="68%" height={13} radius={radius.xs} />
            </View>
            <Skeleton width={60} height={60} radius={radius.sm} />
          </View>
        ))}
      </View>
    </View>
  )
}

export const LoadingView: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => (
  <View style={styles.center}>
    <AarambhLoader size="lg" label={label} />
  </View>
)

export const EmptyState: React.FC<{ title: string; subtitle?: string; icon?: string }> = ({
  title,
  subtitle,
  icon = '📭',
}) => {
  const { colors } = useTheme()
  return (
    <View style={styles.center}>
      <Text style={styles.emoji}>{icon}</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.emptySubtitle, { color: colors.secondary }]}>{subtitle}</Text> : null}
    </View>
  )
}

export const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => {
  const { colors } = useTheme()
  return (
    <View style={styles.center}>
      <Text style={styles.emoji}>⚠️</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{message}</Text>
      <Text style={[styles.retry, { color: colors.primary }]} onPress={onRetry}>
        Tap to retry
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl, minHeight: 220 },
  emoji: { fontSize: 40, marginBottom: spacing.md },
  emptyTitle: { fontSize: 16, fontFamily: fonts.sans[700], textAlign: 'center' },
  emptySubtitle: { marginTop: spacing.sm, fontSize: 13, textAlign: 'center' },
  retry: { marginTop: spacing.md, fontWeight: '700', fontSize: 14 },
})