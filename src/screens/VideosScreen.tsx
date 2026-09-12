import React, { useCallback, useState } from 'react'
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { contentApi, liveStreamApi } from '../api/endpoints'
import { ContentItem, LiveStreamItem, Pagination } from '../types'
import { colors, fonts, radius, spacing } from '../theme'
import { CategoryChip } from '../components/NewsCard'
import { EmptyState, ErrorState, SkeletonCard } from '../components/States'
import { usePagedFeed } from '../hooks/usePagedFeed'
import { ScaledText as Text } from '../components/ScaledText'
import { mediaUrl } from '../config'
import ShortsScreen from './ShortsScreen'
import { useTheme } from '../context/ThemeContext'

const VIDEO_FILTERS = [
  { key: '', label: 'All Videos' },
  { key: 'LIVE', label: 'Live Streams' },
  { key: 'cat-market', label: 'Market Videos' },
  { key: 'cat-politics', label: 'Politics' },
  { key: 'cat-state', label: 'State News' },
]

const NO_MORE: Pagination = { total: 0, page: 1, limit: 12, totalPages: 1, hasNextPage: false, hasPrevPage: false }

interface MediaCardItem {
  key: string
  type: 'video' | 'short' | 'live'
  title: string
  thumbnail?: string
  duration?: number
  meta: string
  isLive: boolean
  onPress: () => void
}

function formatDuration(sec?: number) {
  if (!sec || sec <= 0) return ''
  return sec >= 60 ? `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}` : `${sec}s`
}

function MediaCard({ item }: { item: MediaCardItem }) {
  const { colors: tc } = useTheme()
  const thumb = mediaUrl(item.thumbnail)
  const duration = formatDuration(item.duration)
  return (
    <Pressable onPress={item.onPress} style={[styles.item, { backgroundColor: tc.card, borderColor: tc.border }]}>
      <View style={styles.thumbWrap}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.thumb} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty, { backgroundColor: tc.surfaceContainer }]}>
            <Ionicons name="play-circle-outline" size={34} color={tc.textMuted} />
          </View>
        )}
        {item.type === 'live' ? (
          <View style={[styles.badge, { backgroundColor: item.isLive ? colors.primary : '#6b7280' }]}>
            <View style={[styles.liveDot, { backgroundColor: item.isLive ? '#fff' : '#d1d5db' }]} />
            <Text style={styles.badgeText}>{item.isLive ? 'LIVE' : 'UPCOMING'}</Text>
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: 'rgba(0,0,0,0.72)' }]}>
            <Ionicons name="logo-youtube" size={11} color="#ff0000" style={{ marginRight: 4 }} />
            <Text style={styles.badgeText}>VIDEO</Text>
          </View>
        )}
        {!item.isLive ? (
          <View style={styles.playOverlay} pointerEvents="none">
            <View style={styles.playCircle}>
              <Ionicons name="play" size={18} color="#fff" style={{ marginLeft: 2 }} />
            </View>
          </View>
        ) : null}
        {duration ? <Text style={styles.duration}>{duration}</Text> : null}
      </View>
      <View style={styles.info}>
        <Text style={[styles.itemTitle, { color: tc.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.meta, { color: tc.textMuted }]} numberOfLines={1}>
          {item.meta}
        </Text>
      </View>
    </Pressable>
  )
}

export default function VideosScreen({ navigation }: any) {
  const { colors: themeColors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const topInset = insets.top
  const [headerWrapHeight, setHeaderWrapHeight] = useState(0)
  const [mode, setMode] = useState<'videos' | 'shorts'>('videos')
  const [activeType, setActiveType] = useState('')
  const isShorts = mode === 'shorts'

  const toContentCard = useCallback(
    (item: ContentItem): MediaCardItem => {
      const thumb =
        item.featuredImage?.url ||
        item.videoPayload?.thumbnail ||
        (item.youtubeId ? `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg` : undefined)
      return {
        key: item._id,
        type: 'video',
        title: item.title,
        thumbnail: thumb,
        duration: item.videoPayload?.duration,
        meta: `${item.category?.name?.en || 'News'} · 👁 ${(item.metrics?.views || 0).toLocaleString()}`,
        isLive: false,
        onPress: () => navigation.navigate('NewsDetail', { item }),
      }
    },
    [navigation]
  )

  const toLiveCard = useCallback(
    (s: LiveStreamItem): MediaCardItem => {
      const isLive = s.status === 'LIVE'
      const thumb = s.thumbnailUrl || (s.youtubeId ? `https://img.youtube.com/vi/${s.youtubeId}/hqdefault.jpg` : undefined)
      return {
        key: `live-${s._id}`,
        type: 'live',
        title: s.title.en,
        thumbnail: thumb,
        meta: isLive
          ? 'LIVE · Streaming now'
          : s.scheduledFor
            ? `UPCOMING · ${new Date(s.scheduledFor).toLocaleString()}`
            : 'UPCOMING',
        isLive,
        onPress: () => navigation.navigate('LiveNews'),
      }
    },
    [navigation]
  )

  const load = useCallback(
    async (page: number) => {
      let live: LiveStreamItem[] = []
      try {
        live = await liveStreamApi.list()
      } catch {
        // live is best-effort
      }
      if (activeType === 'LIVE') {
        const data = live.map(toLiveCard)
        return { data, pagination: { ...NO_MORE, total: data.length } }
      }

      const res = await contentApi.list({
        page,
        limit: 12,
        status: 'PUBLISHED',
        contentType: 'VIDEO',
        category: activeType.startsWith('cat-') ? activeType : undefined,
      })

      // Strict filter: ONLY items that actually have video / YouTube links
      const validVideos = (res.data || []).filter(
        (i) =>
          i.contentType === 'VIDEO' ||
          !!(i.youtubeId || i.youtubeUrl || i.videoPayload?.videoUrl || i.bodyBlocks?.some((b: any) => b.type === 'YOUTUBE' || b.type === 'VIDEO'))
      )

      const cards = validVideos.map(toContentCard)
      const head = page === 1 && !activeType ? live.map(toLiveCard) : []
      return { data: [...head, ...cards], pagination: res.pagination }
    },
    [activeType, toContentCard, toLiveCard]
  )

  const feed = usePagedFeed<MediaCardItem>({ load })

  if (isShorts) {
    return <ShortsScreen navigation={navigation} onBackToVideos={() => setMode('videos')} />
  }

  const empty = feed.loading ? (
    <View>
      <SkeletonCard />
      <SkeletonCard />
    </View>
  ) : feed.error ? (
    <ErrorState message={feed.error} onRetry={feed.refresh} />
  ) : activeType === 'LIVE' ? (
    <EmptyState title="No streams live right now" subtitle="Live videos show up here the moment they go on air." icon="📡" />
  ) : (
    <EmptyState title="No videos yet" subtitle="Published news videos will appear here." icon="🎬" />
  )

  const fallbackHeaderHeight = topInset + 158
  const headerPaddingTop = (headerWrapHeight > 0 ? headerWrapHeight : fallbackHeaderHeight) + 14

  return (
    <View style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <FlatList
        data={feed.items}
        keyExtractor={(item) => item.key}
        numColumns={2}
        columnWrapperStyle={styles.column}
        renderItem={({ item }) => <MediaCard item={item} />}
        ListEmptyComponent={empty}
        onEndReached={feed.loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={feed.refreshing}
            onRefresh={feed.refresh}
            colors={[colors.primary]}
            progressViewOffset={headerPaddingTop}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerPaddingTop, paddingBottom: 40 }}
        scrollIndicatorInsets={{ top: headerPaddingTop }}
      />

      {/* Glossy Translucent / Frosted Glass Header */}
      <View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height
          if (h > 0) setHeaderWrapHeight(h)
        }}
        style={[
          styles.headerWrap,
          {
            paddingTop: topInset,
            backgroundColor: Platform.OS === 'web'
              ? (isDark ? 'rgba(26, 28, 32, 0.92)' : 'rgba(255, 255, 255, 0.92)')
              : (isDark ? '#1a1c20' : '#ffffff'),
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>Videos</Text>
        </View>
        <View style={[styles.segment, { backgroundColor: themeColors.surfaceContainer }]}>
          <Pressable
            style={[styles.segmentItem, !isShorts && { backgroundColor: themeColors.card }]}
            onPress={() => setMode('videos')}
          >
            <Text style={[styles.segmentText, { color: !isShorts ? themeColors.text : themeColors.textMuted }]}>
              News Videos
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentItem, isShorts && { backgroundColor: themeColors.card }]}
            onPress={() => setMode('shorts')}
          >
            <Text style={[styles.segmentText, { color: isShorts ? themeColors.text : themeColors.textMuted }]}>
              Shorts / Reels
            </Text>
          </Pressable>
        </View>

        {/* Video Filter Chips */}
        <View style={styles.typeListWrap}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.typeList}
            contentContainerStyle={styles.typeContent}
            data={VIDEO_FILTERS}
            keyExtractor={(t) => t.key}
            renderItem={({ item }) => (
              <CategoryChip
                label={item.label}
                active={activeType === item.key}
                onPress={() => setActiveType(item.key)}
              />
            )}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      },
      default: {},
    }),
  },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: { fontFamily: fonts.serif[700], fontSize: 24 },
  segment: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: radius.md,
    padding: 3,
  },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.sm },
  segmentText: { fontFamily: fonts.inter[600], fontSize: 13 },
  typeListWrap: {
    paddingVertical: 6,
  },
  typeList: {
    flexGrow: 0,
  },
  typeContent: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  column: { paddingHorizontal: spacing.lg, gap: spacing.md },
  item: {
    flex: 1,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  thumbWrap: { position: 'relative' },
  thumb: { width: '100%', height: 120 },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  badgeText: { color: colors.onPrimary, fontFamily: fonts.inter[700], fontSize: 9, letterSpacing: 0.6 },
  playOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  duration: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: colors.overlay,
    color: colors.onPrimary,
    fontFamily: fonts.inter[600],
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  info: { padding: spacing.sm },
  itemTitle: { fontFamily: fonts.serif[700], fontSize: 14, lineHeight: 19 },
  meta: { fontFamily: fonts.inter[500], fontSize: 11, marginTop: 4 },
})