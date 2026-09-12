import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { useRoute } from '@react-navigation/native'
import { categoryApi, contentApi } from '../api/endpoints'
import { colors, fonts, radius, spacing } from '../theme'
import { NewsCard } from '../components/NewsCard'
import { EmptyState, ErrorState, SkeletonCard } from '../components/States'
import { usePagedFeed } from '../hooks/usePagedFeed'
import { useTheme } from '../context/ThemeContext'
import { ScaledText as Text } from '../components/ScaledText'
import { CategoryItem } from '../types'

export default function CategoryNewsScreen({ navigation }: any) {
  const { colors: themeColors } = useTheme()
  const route = useRoute() as any
  const { categoryId, subCategoryId: initialSubId, title } = route.params
  const [subcategories, setSubcategories] = useState<CategoryItem[]>([])
  const [activeSub, setActiveSub] = useState<string>(initialSubId || '')

  useEffect(() => {
    categoryApi
      .tree()
      .then((tree) => {
        const top = tree.find((c) => c._id === categoryId)
        setSubcategories(top?.subCategories || [])
      })
      .catch(() => {})
  }, [categoryId])

  const load = useCallback(
    async (page: number) => {
      const params: Record<string, any> = { page, limit: 15, status: 'PUBLISHED', category: categoryId }
      if (activeSub) params.subCategory = activeSub
      const res = await contentApi.list(params)
      return { data: res.data, pagination: res.pagination }
    },
    [categoryId, activeSub]
  )

  const feed = usePagedFeed({ load })

  return (
    <View style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
      {subcategories.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <Pressable
            style={[styles.chip, { backgroundColor: !activeSub ? colors.primary : themeColors.card, borderColor: themeColors.border }]}
            onPress={() => setActiveSub('')}
          >
            <Text style={[styles.chipText, { color: !activeSub ? '#fff' : themeColors.textMuted }]}>All</Text>
          </Pressable>
          {subcategories.map((sub) => (
            <Pressable
              key={sub._id}
              style={[styles.chip, { backgroundColor: activeSub === sub._id ? colors.primary : themeColors.card, borderColor: themeColors.border }]}
              onPress={() => setActiveSub(sub._id)}
            >
              <Text style={[styles.chipText, { color: activeSub === sub._id ? '#fff' : themeColors.textMuted }]}>
                {sub.name.en}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      <FlatList
        data={feed.items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <NewsCard item={item} onPress={() => navigation.push('NewsDetail', { item })} />}
        ListEmptyComponent={
          feed.loading ? (
            <View>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : feed.error ? (
            <ErrorState message={feed.error} onRetry={feed.refresh} />
          ) : (
            <EmptyState title="No stories here yet" />
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
  title: { fontFamily: fonts.serif[700], fontSize: 20, color: colors.text, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  chipsRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, alignItems: 'center' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
    borderWidth: 1,
  },
  chipText: { fontFamily: fonts.inter[600], fontSize: 13 },
})