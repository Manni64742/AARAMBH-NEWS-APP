import React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { colors, fonts, radius, spacing } from '../theme'
import { ScaledText as Text } from './ScaledText'

export const Skeleton: React.FC<{ height?: number; width?: number | string; radius?: number; style?: any }> = ({
  height = 16,
  width = '100%',
  radius: r = radius.md,
  style,
}) => <View style={[styles.skeleton, { height, width, borderRadius: r }, style]} />

export const SkeletonCard: React.FC = () => (
  <View style={styles.card}>
    <Skeleton height={170} radius={radius.lg} />
    <Skeleton height={18} width="90%" style={{ marginTop: spacing.md }} />
    <Skeleton height={14} width="60%" style={{ marginTop: spacing.sm }} />
  </View>
)

import { AarambhLoader } from './AarambhLoader'
export { AarambhLoader }

export const LoadingView: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => (
  <View style={styles.center}>
    <AarambhLoader size="lg" label={label} />
  </View>
)

export const EmptyState: React.FC<{ title: string; subtitle?: string; icon?: string }> = ({
  title,
  subtitle,
  icon = '📭',
}) => (
  <View style={styles.center}>
    <Text style={styles.emoji}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
  </View>
)

export const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <View style={styles.center}>
    <Text style={styles.emoji}>⚠️</Text>
    <Text style={styles.emptyTitle}>{message}</Text>
    <Text style={styles.retry} onPress={onRetry}>
      Tap to retry
    </Text>
  </View>
)

const styles = StyleSheet.create({
  skeleton: { backgroundColor: colors.surfaceVariant },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl, minHeight: 220 },
  loadingText: { marginTop: spacing.md, color: colors.secondary, fontSize: 13 },
  emoji: { fontSize: 40, marginBottom: spacing.md },
  emptyTitle: { fontSize: 16, fontFamily: fonts.sans[700], color: colors.text, textAlign: 'center' },
  emptySubtitle: { marginTop: spacing.sm, fontSize: 13, color: colors.secondary, textAlign: 'center' },
  retry: { marginTop: spacing.md, color: colors.primary, fontWeight: '700', fontSize: 14 },
})
