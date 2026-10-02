import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Dimensions, FlatList, Platform, Pressable, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native'
import { ScaledText as Text } from '../components/ScaledText'
import { useTheme } from '../context/ThemeContext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useVideoPlayer, VideoView } from 'expo-video'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { contentApi, interactionApi } from '../api/endpoints'
import { ContentItem } from '../types'
import { colors, fonts, radius } from '../theme'
import { ErrorState } from '../components/States'
import { AppBackButton } from '../components/AppBackButton'
import { usePagedFeed } from '../hooks/usePagedFeed'
import { mediaUrl } from '../config'
import { YouTubePlayer } from '../components/YouTubePlayer'
import { videoIdFromUrl, youtubeThumb } from '../utils/youtube'

const { height } = Dimensions.get('window')

function NativeVideoPlayer({ source, active }: { source: string; active: boolean }) {
  const player = useVideoPlayer(active && source ? (mediaUrl(source) as any) : null, (p) => {
    p.loop = true
    if (active) p.play()
  })

  useEffect(() => {
    if (active && source) player.play()
    else player.pause()
  }, [active, source, player])

  return (
    <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
  )
}

function YouTubeReelPlayer({ videoId, active }: { videoId: string; active: boolean }) {
  const thumb = youtubeThumb(videoId)
  if (!active) {
    return (
      <View style={StyleSheet.absoluteFill}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
        )}
      </View>
    )
  }
  return (
    <View style={StyleSheet.absoluteFill}>
      <YouTubePlayer videoId={videoId} autoplay={true} active={active} />
    </View>
  )
}

function ReelItem({ item, active, onLike }: { item: ContentItem; active: boolean; onLike: () => void }) {
  const rawUrl =
    item.shortVideoPayload?.videoUrl ||
    item.videoPayload?.videoUrl ||
    (item as any).youtubeUrl ||
    (item as any).mediaUrl ||
    ''

  const ytId =
    item.shortVideoPayload?.youtubeId ||
    item.videoPayload?.youtubeId ||
    videoIdFromUrl(rawUrl)

  useEffect(() => {
    if (active && item._id) {
      contentApi.recordView(item._id).catch(() => {})
    }
  }, [active, item._id])

  if (!rawUrl && !ytId) return null

  const titleText =
    typeof item.title === 'object'
      ? ((item.title as any)?.hi || (item.title as any)?.en || '')
      : item.title || ''

  const categoryName =
    typeof item.category === 'object'
      ? ((item.category as any)?.name?.hi || (item.category as any)?.name?.en || (item.category as any)?.name || 'Shorts')
      : 'Shorts'

  return (
    <View style={styles.reel}>
      {ytId ? (
        <YouTubeReelPlayer videoId={ytId} active={active} />
      ) : (
        <NativeVideoPlayer source={rawUrl} active={active} />
      )}
      <View style={styles.reelInfo} pointerEvents="box-none">
        <Text style={styles.reelCategory}>{categoryName}</Text>
        <Text style={styles.reelTitle} numberOfLines={3}>
          {titleText}
        </Text>
        <Text style={styles.reelMeta}>
          {item.author?.name || 'Aarambh News'} · 👁 {(item.metrics?.views || 0).toLocaleString()}
        </Text>
      </View>
      <View style={styles.actions} pointerEvents="box-none">
        <TouchableOpacity onPress={onLike} hitSlop={10} style={{ alignItems: 'center' }}>
          <Text style={styles.actionIcon}>{item.metrics?.likes ? '❤️' : '🤍'}</Text>
          <Text style={styles.actionCount}>{item.metrics?.likes || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity hitSlop={10} style={{ alignItems: 'center' }}>
          <Text style={styles.actionIcon}>🔖</Text>
          <Text style={styles.actionCount}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function ShortsScreen({ navigation, onBackToVideos }: any) {
  const { colors: tc, isDark } = useTheme()
  const load = useCallback(async (page: number) => {
    const res = await contentApi.list({ page, limit: 10, status: 'PUBLISHED', contentType: 'SHORT_VIDEO' })
    const list = Array.isArray(res) ? res : (res?.data || [])
    // Strict filter: ONLY real short videos with a video URL or YouTube ID
    const valid = list.filter(
      (i: ContentItem) =>
        i.contentType === 'SHORT_VIDEO' &&
        !!(
          i.shortVideoPayload?.videoUrl ||
          i.videoPayload?.videoUrl ||
          (i as any).youtubeUrl ||
          (i as any).mediaUrl ||
          i.shortVideoPayload?.youtubeId ||
          i.videoPayload?.youtubeId ||
          (i as any).youtubeId
        )
    )
    return { data: valid, pagination: res.pagination }
  }, [])

  const feed = usePagedFeed({ load })
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<FlatList>(null)

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const visibleItem = viewableItems.find((v: any) => v.isViewable) || viewableItems[0]
      if (visibleItem && typeof visibleItem.index === 'number') {
        setActiveIndex(visibleItem.index)
      }
    }
  }).current

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current

  const handleScroll = useCallback(
    (e: any) => {
      const offsetY = e.nativeEvent.contentOffset.y
      const nextIndex = Math.round(offsetY / height)
      if (nextIndex >= 0 && nextIndex !== activeIndex) {
        setActiveIndex(nextIndex)
      }
    },
    [activeIndex]
  )

  const onLike = async (item: ContentItem) => {
    try {
      await interactionApi.toggle(item._id, 'LIKE')
      feed.refresh()
    } catch {}
  }

  const handleBack = useCallback(() => {
    if (typeof onBackToVideos === 'function') {
      onBackToVideos()
    } else if (navigation?.canGoBack?.()) {
      navigation.goBack()
    } else {
      navigation?.navigate?.('Main', { screen: 'Videos' })
    }
  }, [navigation, onBackToVideos])

  const insets = useSafeAreaInsets()

  // Dedicated empty state when no shorts/reels are uploaded
  if (!feed.loading && feed.items.length === 0) {
    return (
      <View style={[styles.safe, { backgroundColor: tc.background }]}>
        {/* Sleek top header matching AppStackHeader */}
        <View
          style={{
            height: insets.top + 48,
            paddingTop: insets.top,
            backgroundColor: Platform.OS === 'web'
              ? (isDark ? 'rgba(26, 28, 32, 0.92)' : 'rgba(255, 255, 255, 0.92)')
              : (isDark ? '#1a1c20' : '#ffffff'),
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            ...Platform.select({
              web: { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' },
              default: {},
            }),
          }}
        >
          <View style={{ height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
            <AppBackButton onPress={handleBack} size={34} style={{ marginRight: 8 }} />
            <Text style={{ flex: 1, fontFamily: fonts.sans[700], fontSize: 16.5, color: tc.text }}>
              Shorts &amp; Reels
            </Text>
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyGlowCircle,
              {
                backgroundColor: isDark ? 'rgba(225,29,72,0.15)' : 'rgba(225,29,72,0.08)',
                borderColor: isDark ? 'rgba(225,29,72,0.35)' : 'rgba(225,29,72,0.22)',
              },
            ]}
          >
            <Ionicons name="film-outline" size={44} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: tc.text }]}>शॉर्ट्स और रील्स अभी उपलब्ध नहीं हैं</Text>
          <Text style={[styles.emptyTitleEn, { color: tc.textMuted }]}>Shorts & Reels Coming Soon</Text>
          <Text style={[styles.emptySub, { color: tc.textMuted }]}>
            हमारे न्यूज़ डेस्क द्वारा 60 सेकंड के तेज़ न्यूज़ अपडेट्स और रील्स जल्द ही यहाँ जोड़े जाएंगे।
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => feed.refresh()} activeOpacity={0.8}>
              <Ionicons name="refresh" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>रिफ्रेश करें</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: isDark ? '#334155' : '#475569' }]}
              onPress={handleBack}
              activeOpacity={0.8}
            >
              <Ionicons name="play-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>News Videos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.safe, { backgroundColor: '#000' }]}>
      <View style={[styles.floatingHeader, { top: insets.top + 10 }]}>
        <AppBackButton
          onPress={handleBack}
          size={34}
          iconColor="#fff"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)', borderColor: 'rgba(255,255,255,0.2)' }}
        />
        <Text style={styles.floatingTitle}>Shorts &amp; Reels</Text>
      </View>
      <FlatList
        ref={listRef}
        data={feed.items}
        keyExtractor={(item) => item._id}
        pagingEnabled
        snapToInterval={height}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onMomentumScrollEnd={(e) => setActiveIndex(Math.round(e.nativeEvent.contentOffset.y / height))}
        windowSize={3}
        maxToRenderPerBatch={2}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={({ item, index }) => (
          <ReelItem item={item} active={index === activeIndex} onLike={() => onLike(item)} />
        )}
        getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
        ListEmptyComponent={
          feed.loading ? null : feed.error ? (
            <ErrorState message={feed.error} onRetry={feed.refresh} />
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={feed.refreshing} onRefresh={feed.refresh} colors={[colors.primary]} />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 99,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.sans[700],
  },
  backIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
  floatingHeader: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  floatingBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: fonts.sans[700],
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  reel: { height, width: '100%', backgroundColor: '#000', justifyContent: 'flex-end' },
  reelInfo: { padding: 16, paddingBottom: 100, maxWidth: '80%' },
  reelCategory: { color: 'rgba(255,255,255,0.7)', fontWeight: '800', fontSize: 12 },
  reelTitle: { color: '#fff', fontSize: 17, fontFamily: fonts.sans[700], marginTop: 6, lineHeight: 24 },
  reelMeta: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 8 },
  actions: { position: 'absolute', right: 14, bottom: 120, alignItems: 'center' },
  actionIcon: { fontSize: 26, marginBottom: 2 },
  actionCount: { color: '#fff', fontSize: 11, marginBottom: 14, fontWeight: '700' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  emptyGlowCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.sans[700],
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyTitleEn: {
    fontSize: 13,
    fontFamily: fonts.inter[600],
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.4,
  },
  emptySub: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 26,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.pill,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: fonts.inter[600],
  },
})
