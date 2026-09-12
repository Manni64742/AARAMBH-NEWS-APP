import React, { useCallback } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { userApi } from '../api/endpoints'
import { colors } from '../theme'
import { NewsCard } from '../components/NewsCard'
import { EmptyState, ErrorState, SkeletonCard } from '../components/States'
import { usePagedFeed } from '../hooks/usePagedFeed'
import { useToast } from '../context/ToastContext'
import { useTheme } from '../context/ThemeContext'
import { ScaledText as Text } from '../components/ScaledText'

export default function HistoryScreen({ navigation }: any) {
  const { colors: themeColors } = useTheme()
  const { success, error } = useToast()
  const load = useCallback(async (page: number) => {
    const res = await userApi.history(page, 20)
    return { data: res.data, pagination: res.pagination }
  }, [])
  const feed = usePagedFeed({ load })

  const clear = async () => {
    try {
      await userApi.clearHistory()
      success('History cleared')
      feed.refresh()
    } catch (e) {
      error('Failed to clear history')
    }
  }

  return (
    <View style={[styles.safe, { backgroundColor: themeColors.background, paddingTop: 8 }]}>
      <Pressable style={styles.clearBtn} onPress={clear}>
        <Text style={[styles.clearText, { color: themeColors.danger }]}>Clear history</Text>
      </Pressable>
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
            <EmptyState title="No reading history" subtitle="Stories you read will appear here" icon="📖" />
          )
        }
        onEndReached={feed.loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={feed.refreshing} onRefresh={feed.refresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  clearBtn: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 10 },
  clearText: { color: colors.danger, fontSize: 13, fontWeight: '700' },
})
