import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  AppState,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { ScaledText as Text } from '../components/ScaledText'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useIsFocused } from '@react-navigation/native'
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

function NativeVideoPlayer({
  source,
  isLoaded,
  isPlaying,
}: {
  source: string
  isLoaded: boolean
  isPlaying: boolean
}) {
  const resolvedSource = isLoaded && source ? (mediaUrl(source) as any) : null
  const player = useVideoPlayer(resolvedSource, (p) => {
    p.loop = true
    if (isPlaying) {
      p.play()
    }
  })

  useEffect(() => {
    if (!player) return
    if (isPlaying && isLoaded) {
      player.play()
    } else {
      player.pause()
    }
  }, [isPlaying, isLoaded, player])

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  )
}

function YouTubeReelPlayer({
  videoId,
  isLoaded,
  isPlaying,
}: {
  videoId: string
  isLoaded: boolean
  isPlaying: boolean
}) {
  const thumb = youtubeThumb(videoId)
  if (!isLoaded) {
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
      <YouTubePlayer videoId={videoId} autoplay={isPlaying} active={isPlaying} />
    </View>
  )
}

function ReelItem({
  item,
  isCurrent,
  isPlaying,
  onTogglePlay,
  onLike,
  isLiked,
  likeCount,
  onShare,
}: {
  item: ContentItem
  isCurrent: boolean
  isPlaying: boolean
  onTogglePlay: () => void
  onLike: () => void
  isLiked: boolean
  likeCount: number
  onShare: () => void
}) {
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
    if (isPlaying && item._id) {
      contentApi.recordView(item._id).catch(() => {})
    }
  }, [isPlaying, item._id])

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
        <YouTubeReelPlayer videoId={ytId} isLoaded={isCurrent} isPlaying={isPlaying} />
      ) : (
        <Pressable onPress={onTogglePlay} style={StyleSheet.absoluteFill}>
          <NativeVideoPlayer source={rawUrl} isLoaded={isCurrent} isPlaying={isPlaying} />
        </Pressable>
      )}

      {/* When paused on the current reel, display full tap-to-resume overlay with centered Play button */}
      {isCurrent && !isPlaying ? (
        <Pressable onPress={onTogglePlay} style={styles.pausedTapOverlay}>
          <View style={styles.playCenterBtn}>
            <Ionicons name="play" size={40} color="#ffffff" style={{ marginLeft: 4 }} />
          </View>
        </Pressable>
      ) : null}

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
        <TouchableOpacity onPress={onLike} hitSlop={12} style={{ alignItems: 'center' }}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={32}
            color={isLiked ? '#e11d48' : '#ffffff'}
          />
          <Text style={[styles.actionCount, isLiked && { color: '#fb7185', fontWeight: 'bold' }]}>
            {likeCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onShare} hitSlop={12} style={{ alignItems: 'center', marginTop: 8 }}>
          <Ionicons name="share-social-outline" size={26} color="#ffffff" />
          <Text style={styles.actionCount}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function ShortsScreen({
  navigation,
  onBackToVideos,
  isTabFocused = true,
}: {
  navigation: any
  onBackToVideos?: () => void
  isTabFocused?: boolean
}) {
  const { colors: tc, isDark } = useTheme()
  const { language } = useLanguage()
  const isNavFocused = useIsFocused()
  const [navListenerFocused, setNavListenerFocused] = useState(true)
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active')

  useEffect(() => {
    const unsubBlur = navigation?.addListener?.('blur', () => {
      setNavListenerFocused(false)
    })
    const unsubFocus = navigation?.addListener?.('focus', () => {
      setNavListenerFocused(true)
    })
    const appSub = AppState.addEventListener('change', (nextState) => {
      setIsAppActive(nextState === 'active')
    })
    return () => {
      unsubBlur?.()
      unsubFocus?.()
      appSub.remove()
    }
  }, [navigation])

  const isScreenActive = isNavFocused && isTabFocused && navListenerFocused && isAppActive

  const [pausedMap, setPausedMap] = useState<Record<string, boolean>>({})
  const prevScreenActiveRef = useRef(isScreenActive)

  const onTogglePlay = useCallback((id: string) => {
    setPausedMap((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const load = useCallback(async (page: number) => {
    const res = await contentApi.list({ page, limit: 10, status: 'PUBLISHED', contentType: 'SHORT_VIDEO', language })
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
  }, [language])

  const feed = usePagedFeed({ load })
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<FlatList>(null)

  useEffect(() => {
    // If the screen was active and becomes inactive, mark the current reel as paused so it won't auto-play on return
    if (prevScreenActiveRef.current && !isScreenActive) {
      const currentItem = feed.items[activeIndex]
      if (currentItem?._id) {
        setPausedMap((prev) => ({ ...prev, [currentItem._id]: true }))
      }
    }
    prevScreenActiveRef.current = isScreenActive
  }, [isScreenActive, activeIndex, feed.items])

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

  const { user } = useAuth()
  const { error } = useToast()
  const [userLikedMap, setUserLikedMap] = useState<Record<string, boolean>>({})
  const [likeCountMap, setLikeCountMap] = useState<Record<string, number>>({})

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

  // Pre-fetch and track like status for visible and neighboring reels
  useEffect(() => {
    if (!user || !feed.items.length) return
    const indicesToCheck = [activeIndex, activeIndex + 1, activeIndex - 1].filter(
      (idx) => idx >= 0 && idx < feed.items.length
    )
    indicesToCheck.forEach((idx) => {
      const item = feed.items[idx]
      if (item?._id && userLikedMap[item._id] === undefined) {
        interactionApi
          .status(item._id)
          .then((st: any) => {
            if (st) {
              setUserLikedMap((prev) => ({ ...prev, [item._id]: Boolean(st.liked) }))
              if (typeof st.likes === 'number') {
                setLikeCountMap((prev) => ({ ...prev, [item._id]: st.likes }))
              }
            }
          })
          .catch(() => {})
      }
    })
  }, [user, activeIndex, feed.items, userLikedMap])

  const onLike = useCallback(
    async (item: ContentItem) => {
      if (!user) {
        error('कृपया लाइक करने के लिए लॉगिन करें / Please login to like')
        navigation.navigate('Login')
        return
      }

      const itemId = item._id
      const currentlyLiked = Boolean(userLikedMap[itemId])
      const currentLikes =
        typeof likeCountMap[itemId] === 'number'
          ? likeCountMap[itemId]
          : item.metrics?.likes || 0

      const nextLiked = !currentlyLiked
      const nextLikes = Math.max(0, currentLikes + (nextLiked ? 1 : -1))

      // Optimistic update — keep video playing seamlessly without reloading feed
      setUserLikedMap((prev) => ({ ...prev, [itemId]: nextLiked }))
      setLikeCountMap((prev) => ({ ...prev, [itemId]: nextLikes }))

      try {
        const res = await interactionApi.toggle(itemId, 'LIKE')
        const returnedLikes = (res as any)?.data?.likes ?? (res as any)?.likes
        if (typeof returnedLikes === 'number') {
          setLikeCountMap((prev) => ({ ...prev, [itemId]: returnedLikes }))
        }
      } catch (err: any) {
        // Rollback state if server request fails
        setUserLikedMap((prev) => ({ ...prev, [itemId]: currentlyLiked }))
        setLikeCountMap((prev) => ({ ...prev, [itemId]: currentLikes }))
        error('लाइक अपडेट करने में समस्या हुई / Failed to update like')
      }
    },
    [user, userLikedMap, likeCountMap, navigation, error]
  )

  const onShare = useCallback(async (item: ContentItem) => {
    try {
      const title =
        typeof item.title === 'object'
          ? (item.title as any)?.hi || (item.title as any)?.en || ''
          : item.title || ''
      const shareUrl = `https://aarambhnews.com/media?tab=SHORTS&id=${item._id}`
      await Share.share({
        title: title || 'Aarambh News Short',
        message: `${title}\n\nआरंभ न्यूज़ पर देखें: ${shareUrl}`,
        url: shareUrl,
      })
    } catch {}
  }, [])

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
        renderItem={({ item, index }) => {
          const isCurrent = index === activeIndex
          const isUserPaused = Boolean(pausedMap[item._id])
          const isPlaying = isScreenActive && isCurrent && !isUserPaused

          return (
            <ReelItem
              item={item}
              isCurrent={isCurrent}
              isPlaying={isPlaying}
              onTogglePlay={() => onTogglePlay(item._id)}
              onLike={() => onLike(item)}
              isLiked={Boolean(userLikedMap[item._id])}
              likeCount={
                typeof likeCountMap[item._id] === 'number'
                  ? likeCountMap[item._id]
                  : item.metrics?.likes || 0
              }
              onShare={() => onShare(item)}
            />
          )
        }}
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
  pausedTapOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  playCenterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
})
