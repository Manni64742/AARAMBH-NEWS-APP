import React, { useEffect, useRef, useState } from 'react'
import { Animated, FlatList, Platform, Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { liveStreamApi } from '../api/endpoints'
import { LiveStreamItem } from '../types'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await liveStreamApi.list()
      setItems(list.sort((a: LiveStreamItem, b: LiveStreamItem) => (a.status === 'LIVE' ? -1 : 1)))
    } catch {
      setError('Failed to load live streams')
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
          <LiveDot active={items.some((i) => i.status === 'LIVE')} />
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}
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
          ) : (
            <EmptyState
              title="No live streams right now"
              subtitle="Check back soon — our desk will go live on YouTube here."
            />
          )
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