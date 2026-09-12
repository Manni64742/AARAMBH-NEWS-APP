import React, { useCallback, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { interactionApi } from '../api/endpoints'
import { ContentItem } from '../types'
import { colors, fonts, radius, spacing } from '../theme'
import { NewsCard } from '../components/NewsCard'
import { EmptyState, ErrorState, SkeletonCard } from '../components/States'
import { usePagedFeed } from '../hooks/usePagedFeed'
import { useTheme } from '../context/ThemeContext'
import { ScaledText as Text } from '../components/ScaledText'

type Mode = 'BOOKMARK' | 'FAVORITE'

export default function SavedScreen({ navigation }: any) {
  const { colors: themeColors } = useTheme()
  const [mode, setMode] = useState<Mode>('BOOKMARK')

  const load = useCallback(
    async (page: number) => {
      const res = await interactionApi.list(mode, page, 20)
      return { data: res.data, pagination: res.pagination }
    },
    [mode]
  )

  const feed = usePagedFeed({ load })

  return (
    <View style={[styles.safe, { backgroundColor: themeColors.background, paddingTop: 8 }]}>
      <View style={[styles.segment, { backgroundColor: themeColors.surfaceContainer }]}>
        {(
          [
            { key: 'BOOKMARK', label: 'Bookmarks' },
            { key: 'FAVORITE', label: 'Favorites' },
          ] as Array<{ key: Mode; label: string }>
        ).map((s) => (
          <Pressable
            key={s.key}
            style={[styles.segmentItem, mode === s.key && { backgroundColor: themeColors.card }]}
            onPress={() => setMode(s.key)}
          >
            <Text style={[styles.segmentText, { color: mode === s.key ? themeColors.primary : themeColors.secondary }]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={feed.items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <NewsCard item={item} onPress={() => navigation.push('NewsDetail', { item })} />}
        ListEmptyComponent={
          feed.loading ? (
            <SkeletonCard />
          ) : feed.error ? (
            <ErrorState message={feed.error} onRetry={feed.refresh} />
          ) : (
            <EmptyState
              title={mode === 'BOOKMARK' ? 'No bookmarks yet' : 'No favorites yet'}
              subtitle="Tap the bookmark or star icon on any story to save it here"
              icon={mode === 'BOOKMARK' ? '🔖' : '⭐'}
            />
          )
        }
        onEndReached={feed.loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={feed.refreshing} onRefresh={feed.refresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  title: { fontFamily: fonts.serif[700], fontSize: 24, color: colors.text },
  segment: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    padding: 3,
  },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.white },
  segmentText: { fontFamily: fonts.inter[600], fontSize: 13, color: colors.secondary },
  segmentTextActive: { color: colors.primary },
})
