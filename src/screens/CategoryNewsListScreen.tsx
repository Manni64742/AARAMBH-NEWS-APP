import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { contentApi } from '../api/endpoints'
import { ContentItem } from '../types'
import { BundleNewsItem, bundleItemToContentItem, contentItemToBundleItem, getLocalizedTag, isOrangeTag } from '../types/bundles'
import { fonts, radius, spacing } from '../theme'
import { ScaledText as Text } from '../components/ScaledText'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { AdBanner } from '../components/AdBanner'

export default function CategoryNewsListScreen({ route, navigation }: any) {
  const { colors: tc, isDark } = useTheme()
  const { language } = useLanguage()
  const insets = useSafeAreaInsets()

  const {
    title = 'News',
    items: initialItems = [] as BundleNewsItem[],
    sectionTitle,
    categorySlug,
    subCategorySlug,
    locationName,
    locationType,
  } = route.params || {}

  const [articleList, setArticleList] = useState<BundleNewsItem[]>(initialItems)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchArticles = useCallback(async (targetPage: number) => {
    const params: Record<string, any> = {
      page: targetPage,
      limit: 15,
      status: 'PUBLISHED',
      language,
    }
    if (subCategorySlug) {
      params.subCategory = subCategorySlug
    } else if (categorySlug) {
      params.category = categorySlug
    }
    if (locationName) {
      if (locationType === 'state') params.state = locationName
      else if (locationType === 'district') params.district = locationName
      else params.city = locationName
    }

    const res = await contentApi.list(params)
    const newItems = (res.data || []).map(contentItemToBundleItem)
    return {
      items: newItems,
      hasNext: res.pagination?.hasNextPage ?? (newItems.length >= 15),
    }
  }, [categorySlug, subCategorySlug, locationName, locationType, language])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const { items: freshItems, hasNext } = await fetchArticles(1)
      if (freshItems.length > 0) {
        setArticleList(freshItems)
      }
      setPage(1)
      setHasMore(hasNext)
    } catch {
    } finally {
      setRefreshing(false)
    }
  }, [fetchArticles])

  useEffect(() => {
    if (initialItems.length === 0) {
      onRefresh()
    }
  }, [initialItems.length, onRefresh])

  const loadMore = useCallback(async () => {
    if (loadingMore || refreshing || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const { items: moreItems, hasNext } = await fetchArticles(nextPage)
      if (moreItems.length > 0) {
        setArticleList((prev) => {
          const existingIds = new Set(prev.map((i) => i.id))
          const filtered = moreItems.filter((i) => !existingIds.has(i.id))
          return [...prev, ...filtered]
        })
        setPage(nextPage)
        setHasMore(hasNext)
      } else {
        setHasMore(false)
      }
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, refreshing, hasMore, page, fetchArticles])

  const openNews = (item: BundleNewsItem) => {
    const fullContent = (item as any)._content || bundleItemToContentItem(item, title)
    navigation.navigate('NewsDetail', { item: fullContent })
  }

  return (
    <View style={[styles.safe, { backgroundColor: tc.background }]}>
      {/* Sticky Header with Circle Back Button */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 6,
            backgroundColor: tc.card,
            borderBottomColor: tc.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          {/* Classic Circular Back Button */}
          <Pressable
            style={[
              styles.backBtn,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
            ]}
            onPress={() => navigation.goBack()}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={20} color={tc.text} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: tc.text }]} numberOfLines={1} ellipsizeMode="tail">
              {title}
            </Text>
            {sectionTitle ? (
              <Text style={[styles.headerSub, { color: tc.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
                {sectionTitle}
              </Text>
            ) : null}
          </View>

          <View style={[styles.countBadge, { backgroundColor: tc.surfaceVariant }]}>
            <Text style={[styles.countText, { color: tc.textMuted }]}>
              {articleList.length} {language === 'hi' ? 'खबरें' : 'articles'}
            </Text>
          </View>
        </View>
      </View>

      {/* Articles List */}
      <FlatList
        data={articleList}
        keyExtractor={(item, index) => (item?.id ? `${item.id}-${index}` : `news-${index}`)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[tc.primary]}
            tintColor={tc.primary}
          />
        }
        renderItem={({ item, index }) => {
          const isOrange = isOrangeTag(item.tag)
          return (
            <View>
              <Pressable
                style={[styles.articleCard, { backgroundColor: tc.card, borderColor: tc.border }]}
                onPress={() => openNews(item)}
              >
                <View style={styles.cardContent}>
                  {/* Details */}
                  <View style={styles.detailsWrap}>
                    <View style={styles.tagRow}>
                      {/* Badge: Orange for Breaking/Viral/Trending, Blue for topic tags */}
                      <View
                        style={[
                          styles.tagBadge,
                          isOrange
                            ? {
                                backgroundColor: isDark ? 'rgba(255, 87, 34, 0.16)' : '#FFF3E0',
                                borderColor: isDark ? 'rgba(255, 87, 34, 0.35)' : '#FFCCBC',
                              }
                            : {
                                backgroundColor: isDark ? 'rgba(30, 58, 138, 0.35)' : '#EFF6FF',
                                borderColor: isDark ? '#1E3A8A' : '#DBEAFE',
                              },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            { color: isOrange ? (isDark ? '#FF7043' : '#E64A19') : (isDark ? '#93C5FD' : '#1D4ED8') },
                          ]}
                        >
                          {getLocalizedTag(item.tag, language)}
                        </Text>
                      </View>
                      <Text style={[styles.dot, { color: tc.textMuted }]}>•</Text>
                      <Text style={[styles.timeText, { color: tc.textMuted }]}>{item.publishedAt}</Text>
                    </View>
                    <Text
                      style={[styles.articleTitle, { color: tc.text }]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {item.title}
                    </Text>
                    {item.summary ? (
                      <Text
                        style={[styles.articleSummary, { color: tc.textMuted }]}
                        numberOfLines={2}
                      >
                        {item.summary}
                      </Text>
                    ) : null}
                  </View>

                  {/* Thumbnail */}
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={[styles.cardThumb, { backgroundColor: tc.surfaceVariant }]}
                    contentFit="cover"
                  />
                </View>
              </Pressable>
              {index === 2 ? (
                <View style={{ marginVertical: 4 }}>
                  <AdBanner slot="category_middle" />
                </View>
              ) : null}
            </View>
          )
        }}
        ListHeaderComponent={
          articleList.length > 0 ? (
            <View style={{ marginBottom: 6 }}>
              <AdBanner slot="category_top" />
            </View>
          ) : null
        }
        ListFooterComponent={
          articleList.length > 0 ? (
            <View style={{ marginVertical: 10 }}>
              <AdBanner slot="category_bottom" />
            </View>
          ) : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  headerTitle: {
    fontFamily: fonts.serif[700],
    fontSize: 17.5,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontFamily: fonts.sans[500],
    fontSize: 11,
    marginTop: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radius.pill,
  },
  countText: {
    fontFamily: fonts.sans[600],
    fontSize: 11,
  },
  listContent: {
    padding: spacing.lg,
    gap: 12,
  },
  articleCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 14,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailsWrap: {
    flex: 1,
    paddingRight: 12,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  tagText: {
    fontFamily: fonts.sans[700],
    fontSize: 9.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dot: {
    fontSize: 10,
  },
  timeText: {
    fontFamily: fonts.sans[500],
    fontSize: 10.5,
  },
  articleTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 14.5,
    lineHeight: 20,
    marginBottom: 4,
  },
  articleSummary: {
    fontFamily: fonts.sans[400],
    fontSize: 12,
    lineHeight: 17,
  },
  cardThumb: {
    width: 84,
    height: 64,
    borderRadius: radius.md,
  },
})
