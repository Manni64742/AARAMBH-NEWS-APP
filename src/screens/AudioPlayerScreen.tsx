import React, { useCallback, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { ScaledText as Text } from '../components/ScaledText'
import { useTheme } from '../context/ThemeContext'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { Ionicons } from '@expo/vector-icons'
import { contentApi } from '../api/endpoints'
import { ContentItem } from '../types'
import { colors } from '../theme'
import { EmptyState, ErrorState, SkeletonCard } from '../components/States'
import { usePagedFeed } from '../hooks/usePagedFeed'
import { mediaUrl } from '../config'

function PlayerBar({ item, onClose }: { item: ContentItem; onClose: () => void }) {
  const player = useAudioPlayer(mediaUrl(item.featuredImage?.url || '') || undefined)
  const status = useAudioPlayerStatus(player)

  return (
    <View style={styles.playerBar}>
      <View style={styles.playerInfo}>
        <Text style={styles.playerTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.playerTime}>
          {Math.floor(status.currentTime / 60)}:{String(Math.floor(status.currentTime % 60)).padStart(2, '0')} /{' '}
          {Math.floor((status.duration || 0) / 60)}:{String(Math.floor((status.duration || 0) % 60)).padStart(2, '0')}
        </Text>
      </View>
      <Pressable onPress={() => (status.playing ? player.pause() : player.play())} style={styles.playBtn}>
        <Ionicons name={status.playing ? 'pause' : 'play'} size={22} color="#fff" />
      </Pressable>
      <Pressable onPress={() => player.seekTo(Math.min(status.currentTime + 10, status.duration || 0))} style={styles.skipBtn}>
        <Text style={styles.skipText}>+10s</Text>
      </Pressable>
      <Pressable onPress={onClose} style={styles.skipBtn}>
        <Ionicons name="close" size={18} color="#fff" />
      </Pressable>
    </View>
  )
}

export default function AudioPlayerScreen({ navigation }: any) {
  const { colors } = useTheme()
  const [playing, setPlaying] = useState<ContentItem | null>(null)
  const load = useCallback(async (page: number) => {
    const res = await contentApi.list({ page, limit: 20, status: 'PUBLISHED', contentType: 'AUDIO' })
    return { data: res.data, pagination: res.pagination }
  }, [])
  const feed = usePagedFeed({ load })

  return (
    <View style={[styles.safe, { backgroundColor: colors.background }]}>
      <FlatList
        data={feed.items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <Pressable style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setPlaying(item)}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="musical-notes" size={22} color={colors.primary} />
            </View>
            <View style={styles.itemBody}>
              <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
              <Text style={[styles.itemMeta, { color: colors.textMuted }]}>{item.author?.name || 'Aarambh News'} · {item.category?.name?.en || 'Audio'}</Text>
            </View>
            <Ionicons name="play-circle" size={30} color={colors.primary} />
          </Pressable>
        )}
        ListEmptyComponent={
          feed.loading ? (
            <SkeletonCard />
          ) : feed.error ? (
            <ErrorState message={feed.error} onRetry={feed.refresh} />
          ) : (
            <EmptyState title="No audio news yet" icon="🎧" />
          )
        }
        refreshControl={<RefreshControl refreshing={feed.refreshing} onRefresh={feed.refresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8, paddingBottom: 120 }}
      />
      {playing ? <PlayerBar item={playing} onClose={() => setPlaying(null)} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  item: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: colors.card, marginHorizontal: 12, marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  itemBody: { flex: 1, marginLeft: 12 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  itemMeta: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  playerBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: '#101114', padding: 14, paddingBottom: 24 },
  playerInfo: { flex: 1 },
  playerTitle: { color: '#fff', fontSize: 13, fontWeight: '700' },
  playerTime: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  playBtn: { backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  skipBtn: { paddingHorizontal: 8, alignItems: 'center' },
  skipText: { color: '#fff', fontSize: 11, fontWeight: '700' },
})
