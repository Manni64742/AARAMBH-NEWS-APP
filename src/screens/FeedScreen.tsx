import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { categoryApi, contentApi } from '../api/endpoints'
import { marketApi } from '../api/market.api'
import { CategoryItem, MarketIndexItem } from '../types'
import { colors, fonts } from '../theme'
import { CategoryChip, NewsCard } from '../components/NewsCard'
import MarketTicker from '../components/MarketTicker'
import { EmptyState, ErrorState, SkeletonCard } from '../components/States'
import { usePagedFeed } from '../hooks/usePagedFeed'
import { ScaledText as Text } from '../components/ScaledText'
import { AarambhLoader } from '../components/AarambhLoader'
import { useTheme } from '../context/ThemeContext'

export default function FeedScreen({ navigation }: any) {
  const { colors: themeColors, isDark } = useTheme()
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [activeCategory, setActiveCategory] = useState('')
  const [marketItems, setMarketItems] = useState<MarketIndexItem[]>([])

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => {})
    marketApi.list().then(setMarketItems).catch(() => {})
  }, [])

  /* Deduplicate and merge categories to a single 'Market' tab */
  const displayCategories = React.useMemo(() => {
    const list: CategoryItem[] = []
    const seenSlugs = new Set<string>()
    for (const c of categories) {
      if (c.slug === 'share-market' || c.slug === 'finance') {
        if (!seenSlugs.has('market')) {
          seenSlugs.add('market')
          list.push({ ...c, _id: c._id || 'cat-market', name: { en: 'Market', hi: 'मार्केट' }, slug: 'market' })
        }
      } else if (!seenSlugs.has(c.slug)) {
        seenSlugs.add(c.slug)
        list.push(c)
      }
    }
    return list
  }, [categories])

  const activeCatObj = categories.find((c) => c._id === activeCategory)
  const isMarket = activeCatObj
    ? activeCatObj.slug === 'market' || activeCatObj.slug === 'share-market' || activeCatObj.slug === 'finance'
    : activeCategory === 'market' || activeCategory === 'cat-market'

  const load = useCallback(
    async (page: number) => {
      const params: Record<string, any> = { page, limit: 15, status: 'PUBLISHED', contentType: 'ARTICLE' }
      if (activeCategory) params.category = activeCategory
      const res = await contentApi.list(params)
      return { data: res.data, pagination: res.pagination }
    },
    [activeCategory]
  )

  const feed = usePagedFeed({ load })

  const insets = useSafeAreaInsets()
  const topInset = insets.top
  const [headerWrapHeight, setHeaderWrapHeight] = useState(0)
  const fallbackHeight = topInset + (isMarket && marketItems.length > 0 ? 140 : 96)
  const headerPaddingTop = (headerWrapHeight > 0 ? headerWrapHeight : fallbackHeight) + 12

  return (
    <View style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <FlatList
        data={feed.items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <NewsCard item={item} onPress={() => navigation.navigate('NewsDetail', { item })} />}
        ListEmptyComponent={
          feed.loading ? (
            <View>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : feed.error ? (
            <ErrorState message={feed.error} onRetry={feed.refresh} />
          ) : (
            <EmptyState title="No articles here" subtitle="Try another category" />
          )
        }
        ListFooterComponent={feed.loadingMore ? <AarambhLoader size="sm" style={{ paddingVertical: 12 }} /> : null}
        onEndReached={feed.loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={feed.refreshing}
            onRefresh={feed.refresh}
            colors={[colors.primary]}
            progressViewOffset={headerPaddingTop}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerPaddingTop, paddingBottom: 60 }}
        scrollIndicatorInsets={{ top: headerPaddingTop }}
      />

      {/* Glossy Translucent / Frosted Glass Header */}
      <View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height
          if (h > 0) setHeaderWrapHeight(h)
        }}
        style={[
          styles.headerWrap,
          {
            paddingTop: topInset,
            backgroundColor: Platform.OS === 'web'
              ? (isDark ? 'rgba(26, 28, 32, 0.92)' : 'rgba(255, 255, 255, 0.92)')
              : (isDark ? '#1a1c20' : '#ffffff'),
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>
            {isMarket ? 'Market Feed' : 'Explore Feed'}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <CategoryChip label="All" active={!activeCategory} onPress={() => setActiveCategory('')} />
          {displayCategories.map((cat) => {
            const isThisMarket = cat.slug === 'market'
            const isActive = isThisMarket ? isMarket : activeCategory === cat._id
            return (
              <CategoryChip
                key={cat._id}
                label={cat.name.en}
                active={isActive}
                onPress={() => setActiveCategory(cat._id)}
              />
            )
          })}
        </ScrollView>
        {isMarket && marketItems.length > 0 ? (
          <View style={styles.tickerWrap}>
            <MarketTicker items={marketItems} />
          </View>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      },
      default: {},
    }),
  },
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 2 },
  title: { fontFamily: fonts.serif[700], fontSize: 24, color: colors.text },
  chips: { paddingHorizontal: 16, paddingVertical: 8 },
  tickerWrap: { marginBottom: 6 },
  footer: { textAlign: 'center', color: colors.textMuted, padding: 16 },
})
