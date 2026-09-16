import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, PanResponder, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { categoryApi, contentApi } from '../api/endpoints'
import { marketApi } from '../api/market.api'
import { CategoryItem, ContentItem, MarketIndexItem } from '../types'
import { colors, fonts, spacing } from '../theme'
import { CategoryChip, NewsCard, SectionHeader } from '../components/NewsCard'
import MarketTicker from '../components/MarketTicker'
import { AdBanner } from '../components/AdBanner'
import { EmptyState, ErrorState, SkeletonCard } from '../components/States'
import { ScaledText as Text } from '../components/ScaledText'
import { AarambhLoader } from '../components/AarambhLoader'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
interface GroupedSection {
  id: string
  title: string
  actionTitle?: string
  targetCategorySlug?: string
  items: ContentItem[]
}

export default function FeedScreen({ navigation }: any) {
  const { colors: themeColors, isDark } = useTheme()
  const { language } = useLanguage()
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [activeCategory, setActiveCategory] = useState('')
  const [activeSubCategory, setActiveSubCategory] = useState('')
  const [marketItems, setMarketItems] = useState<MarketIndexItem[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [groupedSections, setGroupedSections] = useState<GroupedSection[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const categoryScrollRef = useRef<ScrollView>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchStartTime = useRef(0)

  useEffect(() => {
    categoryApi
      .tree()
      .then((tree) => {
        if (Array.isArray(tree) && tree.length > 0) setCategories(tree)
      })
      .catch(() => {})
    marketApi.list().then(setMarketItems).catch(() => {})
  }, [])

  /* Deduplicate and merge categories to a single 'Market' tab */
  const displayCategories = useMemo(() => {
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

  const activeCatObj = categories.find((c) => c._id === activeCategory || c.slug === activeCategory)
  const isMarket = activeCatObj
    ? activeCatObj.slug === 'market' || activeCatObj.slug === 'share-market' || activeCatObj.slug === 'finance'
    : activeCategory === 'market' || activeCategory === 'cat-market'

  const currentSubCategories = activeCatObj?.subCategories || []

  /* Master tab list for swipe gestures */
  const allTabs = useMemo(() => {
    return [{ _id: '', slug: 'all' }, ...displayCategories]
  }, [displayCategories])

  const getActiveTabIndex = useCallback(() => {
    const currentIdx = allTabs.findIndex(
      (t) => (!t._id && !activeCategory) || t._id === activeCategory || (t.slug === 'market' && isMarket)
    )
    return currentIdx >= 0 ? currentIdx : 0
  }, [activeCategory, allTabs, isMarket])

  const switchToTabByIndex = useCallback(
    (targetIdx: number) => {
      if (targetIdx < 0 || targetIdx >= allTabs.length) return
      const next = allTabs[targetIdx]
      setActiveCategory(next._id)
      setActiveSubCategory('')
      categoryScrollRef.current?.scrollTo({
        x: Math.max(0, targetIdx * 85 - 100),
        animated: true,
      })
    },
    [allTabs]
  )

  // Auto-scroll top category tabs whenever activeCategory changes
  useEffect(() => {
    const idx = getActiveTabIndex()
    categoryScrollRef.current?.scrollTo({
      x: Math.max(0, idx * 85 - 100),
      animated: true,
    })
  }, [activeCategory, getActiveTabIndex])

  // PanResponder for universal mobile touch gestures
  const panResponder = useMemo(() => {
    const onRelease = (_: any, gestureState: any) => {
      const { dx, dy } = gestureState
      if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 1.15) {
        const currentIdx = getActiveTabIndex()
        if (dx < 0 && currentIdx < allTabs.length - 1) {
          // Drag / Swipe Left -> Next Tab
          switchToTabByIndex(currentIdx + 1)
        } else if (dx > 0 && currentIdx > 0) {
          // Drag / Swipe Right -> Prev Tab
          switchToTabByIndex(currentIdx - 1)
        }
      }
    }

    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState
        return Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy) * 1.2
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const { dx, dy } = gestureState
        return Math.abs(dx) > 22 && Math.abs(dx) > Math.abs(dy) * 1.3
      },
      onPanResponderRelease: onRelease,
      onPanResponderTerminate: onRelease,
    })
  }, [allTabs.length, getActiveTabIndex, switchToTabByIndex])

  // Web mouse cursor drag & touch fallback (100% reliable on desktop browsers)
  useEffect(() => {
    if (Platform.OS !== 'web') return

    // Prevent ghost image dragging in web browser during horizontal swipes
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault()
    }
    window.addEventListener('dragstart', handleDragStart)

    let startX = 0
    let startY = 0
    let startTime = 0
    let isTracking = false

    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null
      if (target) {
        const tag = target.tagName?.toLowerCase()
        if (tag === 'input' || tag === 'textarea' || tag === 'button') return
      }

      const clientX = 'touches' in e ? e.touches[0]?.clientX : (e as MouseEvent).clientX
      const clientY = 'touches' in e ? e.touches[0]?.clientY : (e as MouseEvent).clientY
      if (clientX === undefined || clientY === undefined) return

      startX = clientX
      startY = clientY
      startTime = Date.now()
      isTracking = true
    }

    const onUp = (e: MouseEvent | TouchEvent) => {
      if (!isTracking) return
      isTracking = false

      const clientX = 'changedTouches' in e ? e.changedTouches[0]?.clientX : (e as MouseEvent).clientX
      const clientY = 'changedTouches' in e ? e.changedTouches[0]?.clientY : (e as MouseEvent).clientY
      if (clientX === undefined || clientY === undefined) return

      const deltaX = clientX - startX
      const deltaY = clientY - startY
      const duration = Date.now() - startTime

      if (duration < 900 && Math.abs(deltaX) > 30 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
        const currentIdx = getActiveTabIndex()
        if (deltaX < 0 && currentIdx < allTabs.length - 1) {
          switchToTabByIndex(currentIdx + 1)
        } else if (deltaX > 0 && currentIdx > 0) {
          switchToTabByIndex(currentIdx - 1)
        }
      }
    }

    window.addEventListener('mousedown', onDown, { passive: true })
    window.addEventListener('mouseup', onUp, { passive: true })
    window.addEventListener('touchstart', onDown, { passive: true })
    window.addEventListener('touchend', onUp, { passive: true })

    return () => {
      window.removeEventListener('dragstart', handleDragStart)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchstart', onDown)
      window.removeEventListener('touchend', onUp)
    }
  }, [allTabs.length, getActiveTabIndex, switchToTabByIndex])

  const loadGroupedFeed = useCallback(() => {
    let isMounted = true
    setLoading(true)
    setPage(1)
    contentApi.groupedLatest({ category: activeCategory, language, page: 1 }).then((res) => {
      if (!isMounted) return
      if (res && Array.isArray(res.groups)) {
        setGroupedSections(res.groups)
        setHasMore(res.pagination?.hasNextPage ?? (res.groups.length > 0))
      }
    }).catch(() => {
    }).finally(() => {
      if (isMounted) setLoading(false)
    })
    return () => { isMounted = false }
  }, [activeCategory, language])

  useEffect(() => {
    const cleanup = loadGroupedFeed()
    return cleanup
  }, [loadGroupedFeed])

  const loadMore = useCallback(async () => {
    if (loadingMore || loading || refreshing || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const res = await contentApi.groupedLatest({ category: activeCategory, language, page: nextPage })
      if (res && Array.isArray(res.groups) && res.groups.length > 0) {
        setGroupedSections((prev) => {
          const existingIds = new Set(prev.map((g) => g.id))
          const newGroups = res.groups.filter((g: any) => !existingIds.has(g.id))
          return [...prev, ...newGroups]
        })
        setPage(nextPage)
        setHasMore(res.pagination?.hasNextPage ?? false)
      } else {
        setHasMore(false)
      }
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [activeCategory, language, page, hasMore, loadingMore, loading, refreshing])

  const onRefresh = () => {
    setRefreshing(true)
    loadGroupedFeed()
    categoryApi.tree().then((tree) => {
      if (Array.isArray(tree) && tree.length > 0) setCategories(tree)
    }).catch(() => {})
    setTimeout(() => setRefreshing(false), 500)
  }

  const insets = useSafeAreaInsets()
  const topInset = insets.top
  const [headerWrapHeight, setHeaderWrapHeight] = useState(0)
  const fallbackHeight = topInset + (isMarket && marketItems.length > 0 ? 140 : 96)
  const headerPaddingTop = (headerWrapHeight > 0 ? headerWrapHeight : fallbackHeight) + 12

  return (
    <View
      style={[styles.safe, { backgroundColor: themeColors.background }]}
      {...panResponder.panHandlers}
    >
      {/* Grouped Feed List */}
      <FlatList
        data={groupedSections}
        keyExtractor={(sec) => sec.id}
        renderItem={({ item: section }) => (
          <View style={styles.sectionWrap}>
            <SectionHeader
              title={section.title}
              action={section.targetCategorySlug ? (language === 'hi' ? 'सभी देखें' : 'See all') : undefined}
              onAction={() => {
                if (section.targetCategorySlug) {
                  setActiveCategory(section.targetCategorySlug)
                }
              }}
            />
            {section.items.map((newsItem) => (
              <NewsCard
                key={newsItem._id}
                item={newsItem}
                onPress={() => navigation.navigate('NewsDetail', { item: newsItem })}
              />
            ))}
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title={language === 'hi' ? 'कोई खबर नहीं मिली' : 'No news found'}
            subtitle={language === 'hi' ? 'कृपया दूसरी श्रेणी चुनें' : 'Try selecting another category'}
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 16 }}>
              <AarambhLoader size="sm" />
            </View>
          ) : groupedSections.length > 0 ? (
            <AdBanner slot="feed_bottom" />
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerPaddingTop, paddingBottom: 70 }}
        scrollIndicatorInsets={{ top: headerPaddingTop }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[themeColors.primary]}
            tintColor={themeColors.primary}
            progressViewOffset={headerPaddingTop}
          />
        }
      />

      {/* Sticky Category Tabs Header */}
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
              ? (isDark ? 'rgba(18, 20, 23, 0.96)' : 'rgba(255, 255, 255, 0.96)')
              : (isDark ? '#121417' : '#ffffff'),
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>
            {language === 'hi' ? 'ताज़ा समाचार' : 'Latest Feed'}
          </Text>
        </View>

        {/* Master Category Tabs */}
        <ScrollView
          ref={categoryScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <CategoryChip
            label={language === 'hi' ? 'सभी' : 'All'}
            active={!activeCategory}
            onPress={() => {
              setActiveCategory('')
              setActiveSubCategory('')
            }}
          />
          {displayCategories.map((cat) => {
            const isThisMarket = cat.slug === 'market'
            const isActive = isThisMarket ? isMarket : activeCategory === cat._id
            return (
              <CategoryChip
                key={cat._id}
                label={language === 'hi' ? (cat.name.hi || cat.name.en) : cat.name.en}
                active={isActive}
                onPress={() => {
                  setActiveCategory(cat._id)
                  setActiveSubCategory('')
                }}
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
  safe: { flex: 1 },
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
  title: { fontFamily: fonts.serif[700], fontSize: 22 },
  chips: { paddingHorizontal: 16, paddingVertical: 8, gap: 6 },
  tickerWrap: { marginBottom: 6 },
  sectionWrap: {
    marginBottom: 12,
  },
})
