import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { ContentItem } from '../types'
import { colors, fonts, fontFor, radius, spacing } from '../theme'
import { mediaUrl } from '../config'
import { ScaledText as Text } from './ScaledText'
import { useTheme } from '../context/ThemeContext'

const timeAgo = (iso?: string) => {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min. ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hrs. ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days} days ago`
  const d = new Date(iso)
  return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}, ${d.getFullYear()}`
}

export const NewsCard: React.FC<{
  item: ContentItem
  onPress: () => void
  compact?: boolean
  showThumb?: boolean
  onBookmark?: () => void
}> = ({ item, onPress, compact, showThumb = true, onBookmark }) => {
  const { colors: tc } = useTheme()
  const image = mediaUrl(item.featuredImage?.url)
  const titleFont = fontFor(item.title, 700)
  const summaryFont = fontFor(item.summary, 400)
  const isBreaking = item.flags?.isBreaking

  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
      <View style={styles.cardInner}>
        {/* Category + Breaking row */}
        <View style={styles.categoryRow}>
          <Text style={[styles.categoryLabel, { color: tc.primaryDark }]}>
            {(item.category?.name?.en || 'News').toUpperCase()}
          </Text>
          {isBreaking ? (
            <View style={styles.breakingBadge}>
              <View style={styles.breakingDotSmall} />
              <Text style={styles.breakingBadgeText}>BREAKING</Text>
            </View>
          ) : null}
        </View>

        {/* Headline */}
        <Text
          style={[
            styles.headline,
            { color: tc.text, fontFamily: titleFont },
            compact && styles.headlineCompact,
          ]}
          numberOfLines={compact ? 2 : 3}
        >
          {item.title}
        </Text>

        {/* Summary */}
        {!compact && item.summary ? (
          <Text
            style={[styles.summary, { color: tc.textMuted, fontFamily: summaryFont }]}
            numberOfLines={2}
          >
            {item.summary}
          </Text>
        ) : null}

        {/* Bottom row: author + time + views + bookmark */}
        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <Text style={[styles.metaText, { color: tc.secondary }]} numberOfLines={1}>
              {item.author?.name || 'Aarambh News'}
            </Text>
            <Text style={[styles.metaDot, { color: tc.secondary }]}>·</Text>
            <Text style={[styles.metaText, { color: tc.secondary }]}>
              {timeAgo(item.publishedAt)}
            </Text>
          </View>
          <View style={styles.metaRight}>
            <Ionicons name="eye-outline" size={13} color={tc.secondary} />
            <Text style={[styles.viewCount, { color: tc.secondary }]}>
              {(item.metrics?.views || 0).toLocaleString()}
            </Text>
            {onBookmark ? (
              <Pressable onPress={onBookmark} hitSlop={8} style={styles.bookmarkBtn}>
                <Ionicons name="bookmark-outline" size={16} color={tc.secondary} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      {/* Thumbnail */}
      {showThumb && image ? (
        <Image source={{ uri: image }} style={styles.thumb} contentFit="cover" transition={200} />
      ) : null}
    </Pressable>
  )
}

export const HorizontalNewsCard: React.FC<{
  item: ContentItem
  onPress: () => void
  width?: number
}> = ({ item, onPress, width = 300 }) => {
  const { colors: tc } = useTheme()
  const image = mediaUrl(item.featuredImage?.url)
  return (
    <Pressable
      onPress={onPress}
      style={[styles.hCard, { width, backgroundColor: tc.card, borderColor: tc.border }]}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.hImage} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.hImage, styles.hImageFallback]} />
      )}
      <View style={styles.hBody}>
        <Text style={[styles.categoryLabel, { color: tc.primaryDark }]}>
          {item.category?.name?.en || 'News'}
        </Text>
        <Text
          style={[styles.hTitle, { color: tc.text, fontFamily: fontFor(item.title, 700) }]}
          numberOfLines={3}
        >
          {item.title}
        </Text>
        <Text style={[styles.hMeta, { color: tc.textLight }]}>{timeAgo(item.publishedAt)}</Text>
      </View>
    </Pressable>
  )
}

export const CategoryChip: React.FC<{
  label: string
  active?: boolean
  onPress: () => void
  style?: any
  textStyle?: any
}> = ({ label, active, onPress, style, textStyle }) => {
  const { colors: tc } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? tc.primary : tc.lightSurface,
          borderColor: active ? tc.primary : tc.border,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? '#fff' : tc.textMuted },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

export const SectionHeader: React.FC<{
  title: string
  action?: string
  onAction?: () => void
  showLiveBadge?: boolean
  showFilter?: boolean
  filterLabel?: string
  onFilter?: () => void
}> = ({ title, action, onAction, showLiveBadge, showFilter, filterLabel = 'Filter Desk', onFilter }) => {
  const { colors: tc } = useTheme()
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { color: tc.text }]}>{title}</Text>
        {showLiveBadge ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveBadgeDot} />
            <Text style={styles.liveBadgeText}>LIVE FEED</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.sectionActions}>
        {showFilter ? (
          <Pressable onPress={onFilter} style={[styles.filterChip, { borderColor: tc.border }]}>
            <Text style={[styles.filterChipText, { color: tc.textMuted }]}>{filterLabel}</Text>
            <Ionicons name="chevron-down" size={12} color={tc.textMuted} />
          </Pressable>
        ) : null}
        {action && onAction ? (
          <Pressable onPress={onAction}>
            <Text style={[styles.sectionAction, { color: tc.primaryDark }]}>{action}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  // ─── NewsCard ───
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardInner: { flex: 1, paddingRight: spacing.md },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: spacing.sm,
  },
  categoryLabel: {
    fontFamily: fonts.inter[700],
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.primaryDark,
  },
  breakingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    gap: 4,
  },
  breakingDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#fff',
  },
  breakingBadgeText: {
    fontFamily: fonts.inter[700],
    fontSize: 9,
    color: '#fff',
    letterSpacing: 0.5,
  },
  headline: {
    fontFamily: fonts.serif[700],
    fontSize: 17,
    lineHeight: 23,
    color: colors.text,
    marginBottom: 4,
  },
  headlineCompact: { fontSize: 15, lineHeight: 20 },
  summary: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  metaText: {
    fontFamily: fonts.inter[500],
    fontSize: 11,
    color: colors.secondary,
  },
  metaDot: {
    fontFamily: fonts.inter[500],
    fontSize: 11,
    color: colors.secondary,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewCount: {
    fontFamily: fonts.inter[500],
    fontSize: 11,
    color: colors.secondary,
  },
  bookmarkBtn: { marginLeft: 6, padding: 2 },
  thumb: {
    width: 90,
    height: 90,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainer,
  },

  // ─── HorizontalNewsCard ───
  hCard: {
    marginRight: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  hImage: { width: '100%', height: 170, backgroundColor: colors.surfaceContainer },
  hImageFallback: { backgroundColor: colors.surfaceContainer },
  hBody: { padding: 10 },
  hTitle: {
    fontFamily: fonts.serif[700],
    fontSize: 16,
    lineHeight: 21,
    color: colors.text,
    marginTop: 4,
  },
  hMeta: { fontSize: 11, color: colors.textLight, marginTop: 6 },

  // ─── CategoryChip ───
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    minHeight: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.lightSurface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontFamily: fonts.inter[600],
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // ─── SectionHeader ───
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  sectionTitle: {
    fontFamily: fonts.serif[700],
    fontSize: 20,
    color: colors.text,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    gap: 4,
  },
  liveBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveBadgeText: {
    fontFamily: fonts.inter[700],
    fontSize: 9,
    color: '#fff',
    letterSpacing: 0.5,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    gap: 4,
  },
  filterChipText: {
    fontFamily: fonts.inter[500],
    fontSize: 11,
    color: colors.textMuted,
  },
  sectionAction: {
    fontFamily: fonts.inter[600],
    fontSize: 12,
    color: colors.primaryDark,
  },
})
