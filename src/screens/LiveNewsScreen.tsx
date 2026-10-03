import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { contentApi, liveStreamApi } from '../api/endpoints'
import { ContentItem, LiveStreamItem } from '../types'
import { colors, fonts, fontFor, radius, spacing } from '../theme'
import { useTheme } from '../context/ThemeContext'
import { useLocation } from '../context/LocationContext'
import { useLanguage } from '../context/LanguageContext'
import { ScaledText as Text } from '../components/ScaledText'
import { EmptyState, ErrorState, SkeletonCard } from '../components/States'
import { AppBackButton } from '../components/AppBackButton'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YouTubePlayer } from '../components/YouTubePlayer'
import { videoIdFromUrl } from '../utils/youtube'
import { API_BASE } from '../config'

const youtubeThumb = (id?: string) =>
  id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : undefined

function mediaUrl(path?: string) {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  return `${API_BASE}${path}`
}

function LiveDot({ active }: { active: boolean }) {
  // eslint-disable-next-line react-hooks/refs
  const pulse = useRef(new Animated.Value(1)).current
  useEffect(() => {
    if (!active) return
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [active, pulse])
  return <Animated.View style={[styles.liveDot, !active && styles.liveDotOff, active && { opacity: pulse }]} />
}

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  LIVE: { text: 'LIVE', color: '#fff' },
  SCHEDULED: { text: 'UPCOMING', color: '#fff' },
  ENDED: { text: 'ENDED', color: '#fff' },
}

export default function LiveNewsScreen({ navigation, route }: any) {
  const { colors: themeColors, isDark } = useTheme()
  const { current: location } = useLocation()
  const { language } = useLanguage()
  const insets = useSafeAreaInsets()

  const [items, setItems] = useState<LiveStreamItem[]>([])
  const [liveArticles, setLiveArticles] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dedicated YouTube Watch Mode (opens when user clicks any live stream)
  const [activeStream, setActiveStream] = useState<LiveStreamItem | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const locParams: Record<string, any> = {}
      if (location?.state) locParams.state = location.state
      if (location?.city) locParams.city = location.city
      if (location?.district) locParams.district = location.district
      if (language) locParams.language = language

      const [streamsRes, articlesRes] = await Promise.all([
        liveStreamApi.list(locParams).catch(() => []),
        contentApi.live(locParams).catch(() => ({ data: [] as ContentItem[] })),
      ])
      const sortedStreams = (streamsRes || []).sort((a: LiveStreamItem, b: LiveStreamItem) =>
        a.status === 'LIVE' ? -1 : 1
      )
      setItems(sortedStreams)
      setLiveArticles(articlesRes?.data || [])

      // Auto-open requested stream if streamId was passed via navigation
      if (route?.params?.streamId) {
        const found = sortedStreams.find((s: LiveStreamItem) => s._id === route.params.streamId)
        if (found) {
          handleOpenStream(found)
        }
      }
    } catch {
      setError('Failed to load live content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [location?.state, location?.city, location?.district, language])

  // Open stream in dedicated YouTube Watch view
  const handleOpenStream = (stream: LiveStreamItem) => {
    setActiveStream(stream)
    liveStreamApi.recordView(stream._id).catch(() => {})
    setItems((prev) =>
      prev.map((it) => (it._id === stream._id ? { ...it, viewsCount: (it.viewsCount || 0) + 1 } : it))
    )
  }

  // Sharing helpers
  const handleWhatsAppShare = (stream: LiveStreamItem) => {
    const titleText = typeof stream.title === 'object' ? stream.title.hi || stream.title.en : stream.title
    const url = stream.youtubeUrl || `https://aarambhnews.com/live-tv`
    const message = `🔴 *LIVE NEWS:* ${titleText}\n\nआरम्भ न्यूज़ पर लाइव प्रसारण देखें:\n${url}`
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`).catch(() => {
      Share.share({ message, title: titleText, url }).catch(() => {})
    })
  }

  const handleShare = (stream: LiveStreamItem) => {
    const titleText = typeof stream.title === 'object' ? stream.title.hi || stream.title.en : stream.title
    const url = stream.youtubeUrl || `https://aarambhnews.com/live-tv`
    Share.share({
      message: `🔴 LIVE: ${titleText}\n${url}`,
      title: titleText,
      url,
    }).catch(() => {})
  }

  const handleOpenYouTube = (stream: LiveStreamItem) => {
    const videoId = stream.youtubeId || videoIdFromUrl(stream.youtubeUrl)
    if (videoId) {
      Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`).catch(() => {})
    } else if (stream.youtubeUrl) {
      Linking.openURL(stream.youtubeUrl).catch(() => {})
    }
  }

  /* ─────────────────────────────────────────────────────────────
     1. YOUTUBE WATCH MODE (Dedicated Full Player & Details View)
     Opened whenever any live stream card is clicked
  ───────────────────────────────────────────────────────────── */
  if (activeStream) {
    const videoId = activeStream.youtubeId || videoIdFromUrl(activeStream.youtubeUrl)
    const titleEn =
      typeof activeStream.title === 'object'
        ? activeStream.title?.en || activeStream.title?.hi
        : String(activeStream.title || '')
    const titleHi = typeof activeStream.title === 'object' ? activeStream.title?.hi : undefined
    const descText =
      typeof activeStream.description === 'object'
        ? activeStream.description?.hi || activeStream.description?.en
        : typeof activeStream.description === 'string'
          ? activeStream.description
          : ''
    const otherStreams = items.filter((s) => s._id !== activeStream._id)

    return (
      <View style={[styles.safe, { backgroundColor: themeColors.background }]}>
        {/* Top Header Bar */}
        <View
          style={{
            height: insets.top + 48,
            paddingTop: insets.top,
            backgroundColor: Platform.OS === 'web'
              ? (isDark ? 'rgba(26, 28, 32, 0.95)' : 'rgba(255, 255, 255, 0.95)')
              : (isDark ? '#1a1c20' : '#ffffff'),
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            zIndex: 10,
          }}
        >
          <AppBackButton onPress={() => setActiveStream(null)} size={34} style={{ marginRight: 8 }} />
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
            <Text style={{ fontFamily: fonts.sans[700], fontSize: 16, color: themeColors.text }} numberOfLines={1}>
              Live Broadcast
            </Text>
          </View>
          <Pressable
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: radius.pill,
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            }}
            onPress={() => setActiveStream(null)}
          >
            <Text style={{ fontSize: 12, fontFamily: fonts.inter[600], color: themeColors.textMuted }}>
              सभी लाइव देखें
            </Text>
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          {/* Main 16:9 Video Player Screen (Docked at top like YouTube) */}
          <View style={styles.watchPlayerContainer}>
            {videoId ? (
              <YouTubePlayer videoId={videoId} autoplay={true} showOpenButton />
            ) : (
              <View style={[styles.watchPlayerFallback, { backgroundColor: '#000' }]}>
                <Ionicons name="videocam-off" size={40} color={themeColors.textMuted} />
                <Text style={{ color: themeColors.textMuted, marginTop: 8 }}>Video unavailable</Text>
              </View>
            )}
          </View>

          {/* Stream Information (YouTube Watch Style) */}
          <View style={{ padding: spacing.md }}>
            {/* Live Indicator & Viewers */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.liveTagBadge, { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4 }]}>
                  <View style={[styles.liveDot, { backgroundColor: '#DC2626' }]} />
                  <Text style={[styles.liveTagText, { color: '#DC2626', fontSize: 11 }]}>LIVE</Text>
                </View>
                <Text style={{ fontSize: 11, fontFamily: fonts.inter[700], color: colors.primary, letterSpacing: 0.5 }}>
                  ON AIR
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Ionicons name="eye-outline" size={15} color={themeColors.textMuted} />
                <Text style={{ fontSize: 12, fontFamily: fonts.inter[600], color: themeColors.textMuted }}>
                  {(activeStream.viewsCount || 0) + 1} watching now
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.watchTitle, { color: themeColors.text, fontFamily: fontFor(titleEn, 700) }]}>
              {titleEn}
            </Text>
            {titleHi && titleHi !== titleEn ? (
              <Text style={[styles.watchHindiTitle, { color: themeColors.textMuted, fontFamily: fontFor(titleHi, 500) }]}>
                {titleHi}
              </Text>
            ) : null}

            {/* Channel Info & Action Buttons Bar */}
            <View style={[styles.channelActionRow, { borderColor: themeColors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.channelAvatar, { backgroundColor: colors.primary }]}>
                  <Ionicons name="tv-outline" size={18} color="#fff" />
                </View>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 14, fontFamily: fonts.inter[700], color: themeColors.text }}>
                      Aarambh News
                    </Text>
                    <Ionicons name="checkmark-circle" size={14} color="#0284C7" />
                  </View>
                  <Text style={{ fontSize: 11, color: themeColors.textMuted }}>24x7 Official Live</Text>
                </View>
              </View>

              {/* Action Buttons: WhatsApp & Native Share & YouTube */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Pressable
                  style={[styles.actionPillBtn, { backgroundColor: '#25D366' }]}
                  onPress={() => handleWhatsAppShare(activeStream)}
                >
                  <Ionicons name="logo-whatsapp" size={15} color="#fff" />
                  <Text style={styles.actionPillBtnText}>Share</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionPillBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9' }]}
                  onPress={() => handleShare(activeStream)}
                >
                  <Ionicons name="share-social-outline" size={16} color={themeColors.text} />
                </Pressable>
                <Pressable
                  style={[styles.actionPillBtn, { backgroundColor: '#FF0000' }]}
                  onPress={() => handleOpenYouTube(activeStream)}
                >
                  <Ionicons name="logo-youtube" size={15} color="#fff" />
                </Pressable>
              </View>
            </View>

            {/* Description Box */}
            {descText ? (
              <View style={[styles.watchDescCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Text style={[styles.watchDescText, { color: themeColors.textMuted }]}>{descText}</Text>
              </View>
            ) : null}

            {/* Other Live Streams Section (YouTube Recommendations Style) */}
            {otherStreams.length > 0 ? (
              <View style={{ marginTop: spacing.xl }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: spacing.md,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="radio" size={16} color={colors.primary} />
                    <Text style={[styles.otherStreamsSectionTitle, { color: themeColors.text }]}>
                      अन्य लाइव प्रसारण ({otherStreams.length})
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, fontFamily: fonts.inter[500], color: themeColors.textMuted }}>
                    टैप करके बदलें
                  </Text>
                </View>

                {otherStreams.map((stream) => {
                  const sThumb = youtubeThumb(stream.youtubeId) || mediaUrl(stream.thumbnailUrl)
                  const sTitle =
                    typeof stream.title === 'object'
                      ? stream.title.en || stream.title.hi
                      : String(stream.title || '')
                  const sTitleHi = typeof stream.title === 'object' ? stream.title.hi : undefined
                  return (
                    <Pressable
                      key={stream._id}
                      style={[
                        styles.otherStreamCard,
                        {
                          backgroundColor: themeColors.card,
                          borderColor: themeColors.border,
                        },
                      ]}
                      onPress={() => handleOpenStream(stream)}
                    >
                      <View style={styles.otherStreamThumbWrap}>
                        {sThumb ? (
                          <Image source={{ uri: sThumb }} style={styles.otherStreamThumb} contentFit="cover" transition={150} />
                        ) : (
                          <View
                            style={[
                              styles.otherStreamThumb,
                              { backgroundColor: themeColors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
                            ]}
                          >
                            <Ionicons name="logo-youtube" size={24} color={themeColors.textMuted} />
                          </View>
                        )}
                        <View style={[styles.otherStreamBadge, { backgroundColor: colors.primary }]}>
                          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' }} />
                          <Text style={{ color: '#fff', fontSize: 9, fontFamily: fonts.inter[700] }}>LIVE</Text>
                        </View>
                      </View>
                      <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                        <Text
                          style={[styles.otherStreamTitle, { color: themeColors.text, fontFamily: fontFor(sTitle, 700) }]}
                          numberOfLines={2}
                        >
                          {sTitle}
                        </Text>
                        {sTitleHi && sTitleHi !== sTitle ? (
                          <Text style={{ fontSize: 12, color: themeColors.textMuted, marginTop: 2 }} numberOfLines={1}>
                            {sTitleHi}
                          </Text>
                        ) : null}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <Ionicons name="eye-outline" size={12} color={colors.primary} />
                          <Text style={{ fontSize: 11, color: colors.primary, fontFamily: fonts.inter[600] }}>
                            {stream.viewsCount || 0} views · Live
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            ) : null}

            {/* Live Updates Articles Section */}
            {liveArticles.length > 0 ? (
              <View style={{ marginTop: spacing.xl }}>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.liveIndicatorPill, { backgroundColor: '#DC2626' }]}>
                    <View style={styles.whitePulseDot} />
                    <Text style={styles.liveIndicatorPillText}>LIVE COVERAGE</Text>
                  </View>
                  <Text style={[styles.sectionCountText, { color: themeColors.textMuted }]}>
                    {liveArticles.length} {liveArticles.length === 1 ? 'Update' : 'Updates'}
                  </Text>
                </View>

                {liveArticles.map((art) => {
                  const artImage = mediaUrl(art.featuredImage?.url)
                  return (
                    <Pressable
                      key={art._id}
                      style={[
                        styles.liveArticleCard,
                        {
                          backgroundColor: themeColors.card,
                          borderColor: themeColors.border,
                        },
                      ]}
                      onPress={() => navigation.navigate('NewsDetail', { item: art })}
                    >
                      {artImage ? (
                        <Image source={{ uri: artImage }} style={styles.liveArticleImage} contentFit="cover" transition={200} />
                      ) : null}
                      <View style={styles.liveArticleBody}>
                        <View style={styles.liveArticleMetaRow}>
                          <View style={[styles.liveTagBadge, { backgroundColor: '#FEE2E2' }]}>
                            <View style={[styles.liveDot, { backgroundColor: '#DC2626' }]} />
                            <Text style={[styles.liveTagText, { color: '#DC2626' }]}>LIVE</Text>
                          </View>
                          {art.category?.name ? (
                            <Text style={[styles.liveArticleCat, { color: themeColors.primary }]}>
                              {art.category.name.hi || art.category.name.en}
                            </Text>
                          ) : null}
                        </View>
                        <Text
                          style={[styles.liveArticleTitle, { color: themeColors.text, fontFamily: fontFor(art.title, 700) }]}
                          numberOfLines={2}
                        >
                          {art.title}
                        </Text>
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    )
  }

  /* ─────────────────────────────────────────────────────────────
     2. LIST VIEW (When no stream is actively playing in watch mode)
     Clicking ANY card opens the dedicated YouTube Watch Mode!
  ───────────────────────────────────────────────────────────── */
  return (
    <View style={[styles.safe, { backgroundColor: themeColors.background }]}>
      {/* Sleek Top Header */}
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
          <AppBackButton onPress={() => navigation.goBack()} size={34} style={{ marginRight: 8 }} />
          <Text style={{ flex: 1, fontFamily: fonts.sans[700], fontSize: 16.5, color: themeColors.text }}>
            Live News
          </Text>
          <LiveDot active={items.some((i) => i.status === 'LIVE') || liveArticles.length > 0} />
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}
        ListHeaderComponent={
          <>
            {/* Live Articles Coverage */}
            {liveArticles.length > 0 ? (
              <View style={{ marginBottom: spacing.lg }}>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.liveIndicatorPill, { backgroundColor: '#DC2626' }]}>
                    <View style={styles.whitePulseDot} />
                    <Text style={styles.liveIndicatorPillText}>LIVE COVERAGE</Text>
                  </View>
                  <Text style={[styles.sectionCountText, { color: themeColors.textMuted }]}>
                    {liveArticles.length} {liveArticles.length === 1 ? 'Update' : 'Updates'}
                  </Text>
                </View>

                {liveArticles.map((art) => {
                  const artImage = mediaUrl(art.featuredImage?.url)
                  return (
                    <Pressable
                      key={art._id}
                      style={[
                        styles.liveArticleCard,
                        {
                          backgroundColor: themeColors.card,
                          borderColor: themeColors.border,
                        },
                      ]}
                      onPress={() => navigation.navigate('NewsDetail', { item: art })}
                    >
                      {artImage ? (
                        <Image source={{ uri: artImage }} style={styles.liveArticleImage} contentFit="cover" transition={200} />
                      ) : null}
                      <View style={styles.liveArticleBody}>
                        <View style={styles.liveArticleMetaRow}>
                          <View style={[styles.liveTagBadge, { backgroundColor: '#FEE2E2' }]}>
                            <View style={[styles.liveDot, { backgroundColor: '#DC2626' }]} />
                            <Text style={[styles.liveTagText, { color: '#DC2626' }]}>LIVE</Text>
                          </View>
                          {art.category?.name ? (
                            <Text style={[styles.liveArticleCat, { color: themeColors.primary }]}>
                              {art.category.name.hi || art.category.name.en}
                            </Text>
                          ) : null}
                          <Text style={[styles.liveArticleTime, { color: themeColors.textMuted }]}>
                            {art.publishedAt
                              ? new Date(art.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </Text>
                        </View>
                        <Text
                          style={[styles.liveArticleTitle, { color: themeColors.text, fontFamily: fontFor(art.title, 700) }]}
                          numberOfLines={2}
                        >
                          {art.title}
                        </Text>
                        {art.summary ? (
                          <Text style={[styles.liveArticleSummary, { color: themeColors.textMuted }]} numberOfLines={2}>
                            {art.summary}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            ) : null}

            {items.length > 0 ? (
              <View style={[styles.sectionHeaderRow, { marginTop: spacing.xs, marginBottom: spacing.md }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="tv-outline" size={17} color={colors.primary} />
                  <Text style={[styles.streamsSectionTitle, { color: themeColors.text }]}>Live Video Streams</Text>
                </View>
                <Text style={{ fontSize: 11, fontFamily: fonts.inter[500], color: themeColors.textMuted }}>
                  {items.length} {items.length === 1 ? 'Stream' : 'Streams'} ON AIR
                </Text>
              </View>
            ) : null}
          </>
        }
        renderItem={({ item }) => {
          const isLive = item.status === 'LIVE'
          const thumb = youtubeThumb(item.youtubeId) || mediaUrl(item.thumbnailUrl)
          const titleEn = typeof item.title === 'object' ? item.title?.en || item.title?.hi : String(item.title || '')
          const titleHi = typeof item.title === 'object' ? item.title?.hi : undefined
          const descText =
            typeof item.description === 'object'
              ? item.description?.hi || item.description?.en
              : typeof item.description === 'string'
                ? item.description
                : ''

          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: themeColors.card, borderColor: themeColors.border },
                pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
              ]}
              onPress={() => handleOpenStream(item)}
            >
              {/* Thumbnail Container with Play Overlay (Opens into Watch View on tap) */}
              <View style={styles.thumbWrap}>
                {thumb ? (
                  <Image source={{ uri: thumb }} style={styles.thumb} contentFit="cover" transition={200} />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: themeColors.surfaceContainer }]}>
                    <Ionicons name="logo-youtube" size={36} color={themeColors.textMuted} />
                  </View>
                )}

                {/* Live Badge */}
                <View style={[styles.statusBadge, { backgroundColor: isLive ? colors.primary : '#6b7280' }]}>
                  {isLive ? <LiveDot active /> : null}
                  <Text style={styles.statusText}>{STATUS_LABEL[item.status]?.text || item.status}</Text>
                </View>

                {/* Big Center Glowing Play Button */}
                <View style={styles.centerPlayCircle}>
                  <Ionicons name="play" size={24} color="#fff" style={{ marginLeft: 3 }} />
                </View>

                {/* Viewers Pill */}
                {typeof item.viewsCount === 'number' && item.viewsCount > 0 ? (
                  <View style={styles.viewerBadge}>
                    <Ionicons name="eye" size={11} color="#fff" />
                    <Text style={styles.viewerBadgeText}>{item.viewsCount} live</Text>
                  </View>
                ) : null}
              </View>

              {/* Card Body */}
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: themeColors.text, fontFamily: fontFor(titleEn, 700) }]} numberOfLines={2}>
                  {titleEn}
                </Text>
                {titleHi && titleHi !== titleEn ? (
                  <Text style={[styles.cardHindi, { color: themeColors.textMuted, fontFamily: fontFor(titleHi, 400) }]} numberOfLines={1}>
                    {titleHi}
                  </Text>
                ) : null}
                {descText ? (
                  <Text style={[styles.cardDesc, { color: themeColors.textMuted }]} numberOfLines={2}>
                    {descText}
                  </Text>
                ) : null}

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.cardMeta, { color: colors.primary, fontWeight: '700' }]}>
                      {isLive ? '🔴 Streaming now' : 'Broadcast'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 12, fontFamily: fonts.inter[600], color: colors.primary }}>
                      देखने के लिए टैप करें
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                  </View>
                </View>
              </View>
            </Pressable>
          )
        }}
        ListEmptyComponent={
          loading ? (
            <View>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : liveArticles.length === 0 ? (
            <EmptyState
              title="No live content right now"
              subtitle="Check back soon — our desk will publish live coverage and stream updates here."
            />
          ) : null
        }
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

/* ─────────────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  liveDotOff: { backgroundColor: '#9aa0a6' },
  whitePulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff' },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  liveIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  liveIndicatorPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: fonts.inter[700],
    letterSpacing: 0.5,
  },
  sectionCountText: {
    fontSize: 12,
    fontFamily: fonts.inter[500],
  },
  streamsSectionTitle: {
    fontSize: 15,
    fontFamily: fonts.sans[700],
  },
  liveArticleCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  liveArticleImage: {
    width: '100%',
    height: 180,
  },
  liveArticleBody: {
    padding: spacing.md,
  },
  liveArticleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  liveTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveTagText: {
    fontSize: 10,
    fontFamily: fonts.inter[700],
    letterSpacing: 0.4,
  },
  liveArticleCat: {
    fontSize: 12,
    fontFamily: fonts.inter[600],
  },
  liveArticleTime: {
    fontSize: 11,
    fontFamily: fonts.inter[400],
    marginLeft: 'auto',
  },
  liveArticleTitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  liveArticleSummary: {
    fontSize: 13,
    lineHeight: 18,
  },

  /* Card in List Mode */
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  thumbWrap: {
    position: 'relative',
    width: '100%',
    height: 195,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusText: { fontFamily: fonts.inter[700], fontSize: 10, letterSpacing: 0.6, color: '#fff' },
  viewerBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  viewerBadgeText: { color: '#fff', fontSize: 11, fontFamily: fonts.inter[600] },
  centerPlayCircle: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(234, 88, 12, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  cardBody: { padding: spacing.md },
  cardTitle: { fontFamily: fonts.serif[700], fontSize: 16.5, lineHeight: 23 },
  cardHindi: { fontSize: 13, marginTop: 2 },
  cardDesc: { fontSize: 13, lineHeight: 18, marginTop: 6 },
  cardMeta: { fontFamily: fonts.inter[500], fontSize: 11 },

  /* Dedicated YouTube Watch Mode Styles */
  watchPlayerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  watchPlayerFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchTitle: {
    fontSize: 18,
    lineHeight: 25,
    marginTop: 4,
  },
  watchHindiTitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },
  channelActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  channelAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  actionPillBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: fonts.inter[700],
  },
  watchDescCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  watchDescText: {
    fontSize: 13,
    lineHeight: 19,
  },
  otherStreamsSectionTitle: {
    fontSize: 15,
    fontFamily: fonts.sans[700],
  },
  otherStreamCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 10,
  },
  otherStreamThumbWrap: {
    position: 'relative',
    width: 120,
    height: 75,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  otherStreamThumb: {
    width: '100%',
    height: '100%',
  },
  otherStreamBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  otherStreamTitle: {
    fontSize: 13.5,
    lineHeight: 18,
  },
})