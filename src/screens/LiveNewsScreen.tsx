import React, { useEffect, useRef, useState } from 'react'
import { Animated, FlatList, Platform, Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { contentApi, liveStreamApi } from '../api/endpoints'
import { ContentItem, LiveStreamItem } from '../types'
import { colors, fonts, fontFor, radius, spacing } from '../theme'
import { useTheme } from '../context/ThemeContext'
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

export default function LiveNewsScreen({ navigation }: any) {
  const { colors: themeColors } = useTheme()
  const [items, setItems] = useState<LiveStreamItem[]>([])
  const [liveArticles, setLiveArticles] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [streamsRes, articlesRes] = await Promise.all([
        liveStreamApi.list().catch(() => []),
        contentApi.live().catch(() => ({ data: [] as ContentItem[] })),
      ])
      setItems((streamsRes || []).sort((a: LiveStreamItem, b: LiveStreamItem) => (a.status === 'LIVE' ? -1 : 1)))
      setLiveArticles(articlesRes?.data || [])
    } catch {
      setError('Failed to load live content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()

  return (
    <View style={[styles.safe, { backgroundColor: themeColors.background }]}>
      {/* Sleek Top Header — Zero Gap, matching AppStackHeader */}
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
          liveArticles.length > 0 ? (
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

              {items.length > 0 ? (
                <View style={[styles.sectionHeaderRow, { marginTop: spacing.md, marginBottom: spacing.sm }]}>
                  <Text style={[styles.streamsSectionTitle, { color: themeColors.text }]}>Live Video Streams</Text>
                </View>
              ) : null}
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const isLive = item.status === 'LIVE'
          const thumb = youtubeThumb(item.youtubeId) || mediaUrl(item.thumbnailUrl)
          const videoId = item.youtubeId || videoIdFromUrl(item.youtubeUrl)
          const isPlaying = playingId === item._id
          return (
            <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={styles.thumbWrap}>
                {isPlaying && videoId ? (
                  <View style={styles.playerWrap}>
                    <YouTubePlayer videoId={videoId} showOpenButton />
                  </View>
                ) : isPlaying && !videoId ? (
                  <View style={[styles.thumb, styles.playerWrap, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="videocam-off" size={28} color={themeColors.textMuted} />
                    <Text style={[styles.playerFallbackText, { color: themeColors.textMuted, fontFamily: fonts.inter[500] }]}>
                      Video unavailable
                    </Text>
                  </View>
                ) : (
                  <>
                    {thumb ? (
                      <Image source={{ uri: thumb }} style={styles.thumb} contentFit="cover" transition={200} />
                    ) : (
                      <View style={[styles.thumb, { backgroundColor: themeColors.surfaceContainer }]}>
                        <Ionicons name="logo-youtube" size={30} color={themeColors.textMuted} />
                      </View>
                    )}
                    <View style={[styles.statusBadge, { backgroundColor: isLive ? colors.primary : '#6b7280' }]}>
                      {isLive ? <LiveDot active /> : null}
                      <Text style={styles.statusText}>{STATUS_LABEL[item.status]?.text || item.status}</Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.playBtn, pressed && { opacity: 0.7 }]}
                      onPress={() => setPlayingId(item._id)}
                    >
                      <Ionicons name="play" size={20} color="#fff" />
                    </Pressable>
                  </>
                )}
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: themeColors.text, fontFamily: fontFor(item.title.en, 700) }]} numberOfLines={2}>
                  {item.title.en}
                </Text>
                {item.title.hi && item.title.hi !== item.title.en ? (
                  <Text style={[styles.cardHindi, { color: themeColors.textMuted, fontFamily: fontFor(item.title.hi, 400) }]} numberOfLines={1}>
                    {item.title.hi}
                  </Text>
                ) : null}
                {item.description?.en ? (
                  <Text style={[styles.cardDesc, { color: themeColors.textMuted }]} numberOfLines={2}>
                    {item.description.en}
                  </Text>
                ) : null}
                {item.scheduledFor ? (
                  <Text style={[styles.cardMeta, { color: themeColors.textMuted }]}>
                    {isLive ? 'Streaming now' : `Starts ${new Date(item.scheduledFor).toLocaleString()}`}
                  </Text>
                ) : null}
              </View>
            </View>
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

/* ── styles ── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontFamily: fonts.sans[700], fontSize: 17.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
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
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  thumbWrap: { position: 'relative' },
  thumb: { width: '100%', height: 170 },
  playerWrap: { width: '100%', height: 200, backgroundColor: '#000' },
  playerFallbackText: { fontSize: 12, marginTop: 8 },
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
  playBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  cardBody: { padding: spacing.md },
  cardTitle: { fontFamily: fonts.serif[700], fontSize: 16, lineHeight: 22 },
  cardHindi: { fontSize: 13, marginTop: 2 },
  cardDesc: { fontSize: 13, lineHeight: 18, marginTop: 6 },
  cardMeta: { fontFamily: fonts.inter[500], fontSize: 11, marginTop: 8 },
})