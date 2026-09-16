import React from 'react'
import { StyleSheet, View } from 'react-native'
import { fonts, radius, spacing } from '../theme'
import { useTheme } from '../context/ThemeContext'
import { ScaledText as Text } from './ScaledText'
import { AarambhLoader } from './AarambhLoader'

export { AarambhLoader }

export const Skeleton: React.FC<{ height?: number; width?: number | string; radius?: number; style?: any }> = ({
  height = 16,
  width = '100%',
  radius: r = radius.md,
  style,
}) => {
  const { colors } = useTheme()
  return <View style={[styles.skeleton, { backgroundColor: colors.surfaceVariant, height, width, borderRadius: r }, style]} />
}

export const SkeletonCard: React.FC = () => {
  const { colors } = useTheme()
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Skeleton height={170} radius={radius.lg} />
      <Skeleton height={18} width="90%" style={{ marginTop: spacing.md }} />
      <Skeleton height={14} width="60%" style={{ marginTop: spacing.sm }} />
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
  skeleton: {},
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl, minHeight: 220 },
  emoji: { fontSize: 40, marginBottom: spacing.md },
  emptyTitle: { fontSize: 16, fontFamily: fonts.sans[700], textAlign: 'center' },
  emptySubtitle: { marginTop: spacing.sm, fontSize: 13, textAlign: 'center' },
  retry: { marginTop: spacing.md, fontWeight: '700', fontSize: 14 },
})