import React, { useCallback } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text } from 'react-native'
import { interactionApi } from '../api/endpoints'
import { colors } from '../theme'
import { NewsCard } from '../components/NewsCard'
import { EmptyState, ErrorState, SkeletonCard } from '../components/States'
import { usePagedFeed } from '../hooks/usePagedFeed'

export default function BookmarksScreen({ navigation }: any) {
  const topPadding = 12

  const load = useCallback(async (page: number) => {
    const res = await interactionApi.list('BOOKMARK', page, 20)
    return { data: res.data, pagination: res.pagination }
  }, [])
  const feed = usePagedFeed({ load })

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={feed.items}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => <NewsCard item={item} onPress={() => navigation.push('NewsDetail', { item })} />}
      ListEmptyComponent={
        feed.loading ? (
          <SkeletonCard />
        ) : feed.error ? (
          <ErrorState message={feed.error} onRetry={feed.refresh} />
        ) : (
          <EmptyState title="No bookmarks yet" subtitle="Tap the bookmark icon on any story to save it here" icon="🔖" />
        )
      }
      onEndReached={feed.loadMore}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          refreshing={feed.refreshing}
          onRefresh={feed.refresh}
          colors={[colors.primary]}
          progressViewOffset={topPadding}
        />
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: topPadding, paddingBottom: 40 }}
      scrollIndicatorInsets={{ top: topPadding }}
    />
  )
}
