import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  FlatList,
  LayoutChangeEvent,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useLocation } from '../context/LocationContext'
import { categoryApi, contentApi, interactionApi, liveStreamApi } from '../api/endpoints'
import { marketApi } from '../api/market.api'
import { CategoryItem, ContentItem, LiveStreamItem, MarketIndexItem } from '../types'
import { colors, fonts, radius, shadows, spacing } from '../theme'
import { CategoryChip, HorizontalNewsCard, NewsCard, SectionHeader } from '../components/NewsCard'
import { NewsSlider } from '../components/NewsSlider'
import { AdBanner } from '../components/AdBanner'
import MarketTicker from '../components/MarketTicker'
import { EmptyState, ErrorState, SkeletonCard } from '../components/States'
import { AarambhLoader } from '../components/AarambhLoader'
import { usePagedFeed } from '../hooks/usePagedFeed'

import { ScaledText as Text } from '../components/ScaledText'
import { useTheme } from '../context/ThemeContext'

/* ────── helpers ────── */

/* ────── Breaking Ticker ────── */

function BreakingTicker({
  items,
  onPress,
}: {
  items: ContentItem[]
  onPress: (item: ContentItem) => void
}) {
  const { colors: tc } = useTheme()
  const scrollAnim = useRef(new Animated.Value(0)).current
  const textWidth = useRef(0)
  const containerWidth = useRef(0)
  const animRef = useRef<Animated.CompositeAnimation | null>(null)

  const startScroll = useCallback(() => {
    if (textWidth.current <= containerWidth.current || !items.length) return
    animRef.current?.stop()
    scrollAnim.setValue(0)
    const duration = Math.max((textWidth.current / 40) * 1000, 4000)
    animRef.current = Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(scrollAnim, {
          toValue: -(textWidth.current + 40),
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scrollAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    )
    animRef.current.start()
  }, [items, scrollAnim])

  useEffect(() => {
    startScroll()
    return () => animRef.current?.stop()
  }, [startScroll])

  if (!items.length) return null

  const headline = items.map((i) => i.title).join('  ●  ')

  return (
    <Pressable
      style={[styles.breakingBar, { backgroundColor: tc.primary }]}
      onPress={() => onPress(items[0])}
    >
      <View style={styles.breakingLeft}>
        <View style={styles.breakingDot} />
        <Text style={styles.breakingTag}>BREAKING</Text>
      </View>
      <View
        style={styles.breakingTextWrap}
        onLayout={(e: LayoutChangeEvent) => {
          containerWidth.current = e.nativeEvent.layout.width
          startScroll()
        }}
      >
        <Animated.View style={{ transform: [{ translateX: scrollAnim }] }}>
          <Text
            style={styles.breakingText}
            numberOfLines={1}
            onLayout={(e: LayoutChangeEvent) => {
              textWidth.current = e.nativeEvent.layout.width
              startScroll()
            }}
          >
            {headline}
          </Text>
        </Animated.View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.onPrimary} style={{ marginLeft: 4 }} />
    </Pressable>
  )
}

/* ────── Live News Banner ────── */

function LiveBanner({
  streams,
  onPress,
}: {
  streams: LiveStreamItem[]
  onPress: () => void
}) {
  const { colors: tc } = useTheme()
  const liveCount = streams.filter((s) => s.status === 'LIVE').length || streams.length
  if (!streams.length) return null
  return (
    <Pressable
      style={[styles.liveBanner, { backgroundColor: tc.primary }]}
      onPress={onPress}
    >
      <View style={styles.liveBannerLeft}>
        <View style={styles.liveBannerPulse}>
          <Ionicons name="radio" size={15} color="#fff" />
        </View>
        <View style={styles.liveBannerTexts}>
          <Text style={styles.liveBannerTitle}>LIVE NOW</Text>
          <Text style={styles.liveBannerSub} numberOfLines={1}>
            {liveCount} active {liveCount === 1 ? 'stream' : 'streams'} — watch live news on YouTube
          </Text>
        </View>
      </View>
      <View style={styles.liveBannerGo}>
        <Text style={styles.liveBannerGoText}>WATCH</Text>
        <Ionicons name="play-circle" size={18} color="#fff" />
      </View>
    </Pressable>
  )
}

/* ────── Featured / Hero Card ────── */

/* ────── HomeScreen ────── */

export default function HomeScreen({ navigation }: any) {
  const { current: location } = useLocation()
  const { colors: themeColors, isDark } = useTheme()
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [breaking, setBreaking] = useState<ContentItem[]>([])
  const [trending, setTrending] = useState<ContentItem[]>([])
  const [stateNews, setStateNews] = useState<ContentItem[]>([])
  const [cityNews, setCityNews] = useState<ContentItem[]>([])
  const [liveStreams, setLiveStreams] = useState<LiveStreamItem[]>([])
  const [activeCategory, setActiveCategory] = useState('')
  const [marketItems, setMarketItems] = useState<MarketIndexItem[]>([])

  useEffect(() => {
    marketApi.list().then(setMarketItems).catch(() => {})
  }, [])

  // Deduplicate and merge 'Share Market' + 'Finance' into a single 'Market' tab
  const displayCategories = React.useMemo(() => {
    const list: CategoryItem[] = []
    let marketItem: CategoryItem | null = null
    for (const cat of categories) {
      const slug = (cat.slug || '').toLowerCase()
      if (slug === 'market' || slug === 'share-market' || slug === 'finance') {
        if (!marketItem) {
          marketItem = {
            ...cat,
            name: { en: 'Market', hi: 'मार्केट' },
            slug: 'market',
          }
          list.push(marketItem)
        }
      } else {
        list.push(cat)
      }
    }
    return list
  }, [categories])

  const activeCatObj = categories.find((c) => c._id === activeCategory)
  const isMarket = activeCatObj
    ? activeCatObj.slug === 'market' || activeCatObj.slug === 'share-market' || activeCatObj.slug === 'finance'
    : activeCategory === 'market' || activeCategory === 'cat-market'

  const loadFeed = useCallback(
    async (page: number) => {
      const params: Record<string, any> = { page, limit: 15, status: 'PUBLISHED' }
      if (activeCategory) {
        params.category = activeCategory
      } else {
        if (location?.city) params.city = location.city
        if (location?.district) params.district = location.district
        if (location?.state) params.state = location.state
      }
      const res = await contentApi.feed(params)
      return { data: res.data, pagination: res.pagination }
    },
    [location, activeCategory]
  )

  const feed = usePagedFeed({ load: loadFeed })

  useEffect(() => {
    categoryApi
      .list()
      .then((cats) => setCategories(cats))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const base: Record<string, any> = { status: 'PUBLISHED', limit: 10 }
    const breakingParams: Record<string, any> = { ...base, breaking: 'true' }
    const trendingParams: Record<string, any> = { ...base, sort: 'trending', limit: 10 }
    if (activeCategory) {
      breakingParams.category = activeCategory
      trendingParams.category = activeCategory
    } else {
      if (location?.locality) breakingParams.locality = location.locality
      if (location?.city) {
        breakingParams.city = location.city
        trendingParams.city = location.city
      }
      if (location?.district) {
        breakingParams.district = location.district
        if (!location?.city) trendingParams.district = location.district
      }
      if (location?.state) {
        breakingParams.state = location.state
        if (!location?.city && !location?.district) trendingParams.state = location.state
      }
    }
    contentApi.list(breakingParams).then((r) => setBreaking(r.data)).catch(() => setBreaking([]))
    contentApi.list(trendingParams).then((r) => setTrending(r.data)).catch(() => setTrending([]))
  }, [location, activeCategory])

  useEffect(() => {
    if (!location?.state || isMarket) {
      setStateNews([])
      return
    }
    contentApi
      .list({ status: 'PUBLISHED', state: location.state, limit: 8, sort: 'latest' })
      .then((r) => setStateNews(r.data))
      .catch(() => setStateNews([]))
  }, [location?.state, isMarket])

  useEffect(() => {
    if (!location?.city || location?.city === location?.state || isMarket) {
      setCityNews([])
      return
    }
    contentApi
      .list({ status: 'PUBLISHED', city: location.city, limit: 8, sort: 'latest' })
      .then((r) => setCityNews(r.data))
      .catch(() => setCityNews([]))
  }, [location?.city, isMarket])

  useEffect(() => {
    liveStreamApi
      .list()
      .then((r) => {
        const live = r.filter((s) => s.status !== 'ENDED')
        setLiveStreams(live)
      })
      .catch(() => setLiveStreams([]))
  }, [])

  const openNews = (item: ContentItem) => navigation.navigate('NewsDetail', { item })
  const handleBookmark = (id: string) => {
    interactionApi.toggle(id, 'BOOKMARK').catch(() => {})
  }

  /* Fallback: if breaking API returned empty, pick breaking-flagged items from feed */
  const breakingItems = breaking.length > 0
    ? breaking
    : feed.items.filter((i) => i.flags?.isBreaking).length > 0
      ? feed.items.filter((i) => i.flags?.isBreaking)
      : feed.items.slice(0, 5)

  /* Helpline: slider headlines = breaking items, else trending, else feed */
  const headlines = breakingItems.length >= 2
    ? breakingItems.slice(0, 6)
    : trending.length >= 2
      ? trending.slice(0, 6)
      : feed.items.slice(0, 6)

  /* Feed items excluding slider items (avoid duplicates in the latest list) */
  const sliderIds = new Set(headlines.map((i) => i._id))
  const feedWithoutHero = feed.items.filter((i) => !sliderIds.has(i._id))

  /* Market horizontal sliding items */
  const marketSlidingItems = trending.length > 0 ? trending : feed.items.slice(0, 8)

  const openLive = () => navigation.navigate('LiveNews')
  const openLocations = () => navigation.navigate('Locations')
  const openCategories = () => navigation.navigate('Categories')

  /* ────── Header (FlatList ListHeaderComponent) ────── */
  const Header = (
    <View>
      {/* 1. BREAKING NEWS TICKER */}
      <BreakingTicker items={breakingItems} onPress={openNews} />

      {/* 2. LIVE NEWS BANNER (YouTube streams - hidden on Market tab) */}
      {!isMarket && <LiveBanner streams={liveStreams} onPress={openLive} />}

      {/* 4. NEWS SLIDER (Headlines) */}
      {headlines.length >= 2 ? (
        <NewsSlider
          items={headlines}
          onPress={openNews}
          title={isMarket ? 'Market Headlines' : 'Headlines'}
        />
      ) : null}

      {/* 5. CATEGORY TABS (Merged Single 'Market' Tab) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
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
        <Pressable style={styles.allCatsChip} onPress={openCategories}>
          <Ionicons name="grid-outline" size={13} color={themeColors.primaryDark} />
          <Text style={styles.allCatsText}>All categories</Text>
        </Pressable>
      </ScrollView>

      {/* 6. MARKET TICKER (Visible ONLY when Market tab is selected, right below category tabs) */}
      {isMarket && marketItems.length > 0 ? (
        <View style={styles.marketTickerWrap}>
          <MarketTicker items={marketItems} />
        </View>
      ) : null}

      {/* 7. TRENDING / MARKET SLIDING NEWS SECTION */}
      {isMarket ? (
        marketSlidingItems.length > 0 ? (
          <View style={styles.sectionBlock}>
            <SectionHeader
              title="Trending in Market"
              action="See all"
              onAction={openCategories}
              showLiveBadge
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsRow}
            >
              {marketSlidingItems.map((item) => (
                <HorizontalNewsCard key={item._id} item={item} onPress={() => openNews(item)} />
              ))}
            </ScrollView>
          </View>
        ) : null
      ) : trending.length > 0 ? (
        <View style={styles.sectionBlock}>
          <SectionHeader title="Trending Now" action="See all" onAction={openCategories} showLiveBadge />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
          >
            {trending.slice(0, 6).map((item) => (
              <HorizontalNewsCard key={item._id} item={item} onPress={() => openNews(item)} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* 8. STATE NEWS SECTION (Only on Home All) */}
      {!activeCategory && location?.state && stateNews.length > 0 ? (
        <View style={styles.sectionBlock}>
          <SectionHeader
            title={location?.city ? `${location.state} News` : 'State News'}
            action="See all"
            onAction={openLocations}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
          >
            {stateNews.slice(0, 6).map((item) => (
              <HorizontalNewsCard key={item._id} item={item} onPress={() => openNews(item)} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* 9. CITY NEWS SECTION (Only on Home All) */}
      {!activeCategory && location?.city && location?.city !== location?.state && cityNews.length > 0 ? (
        <View style={styles.sectionBlock}>
          <SectionHeader
            title={`${location.city} News`}
            action="See all"
            onAction={openLocations}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
          >
            {cityNews.slice(0, 6).map((item) => (
              <HorizontalNewsCard key={item._id} item={item} onPress={() => openNews(item)} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* 10. ADVERTISEMENT SECTION (Placed right above Latest Headlines / Latest News) */}
      <View style={styles.adSlotWrap}>
        <AdBanner slot="home_top" />
      </View>

      {/* 11. LATEST HEADLINES / MARKET NEWS SECTION HEADER */}
      <SectionHeader
        title={isMarket ? 'Latest Market News' : activeCatObj ? `${activeCatObj.name.en} News` : 'Latest Headlines'}
        showLiveBadge
        showFilter
        filterLabel="Filter Desk"
      />
    </View>
  )

  /* ────── Footer ────── */
  const ListFooter = feed.loadingMore ? (
    <AarambhLoader size="sm" style={{ paddingVertical: 14 }} />
  ) : !feed.pagination?.hasNextPage && feed.items.length > 0 ? (
    <Text style={[styles.endText, { color: themeColors.secondary }]}>{`You've reached the end`}</Text>
  ) : null

  const insets = useSafeAreaInsets()
  const topInset = insets.top
  const headerTotalHeight = topInset + 48

  /* ────── Render ────── */
  return (
    <View style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <FlatList
        data={feedWithoutHero}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <NewsCard
            item={item}
            onPress={() => openNews(item)}
            onBookmark={() => handleBookmark(item._id)}
          />
        )}
        ListHeaderComponent={Header}
        ListEmptyComponent={
          feed.loading ? (
            <View>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : feed.error ? (
            <ErrorState message={feed.error} onRetry={feed.refresh} />
          ) : (
            <EmptyState title="No news yet" subtitle="Pull down to refresh" />
          )
        }
        ListFooterComponent={ListFooter}
        onEndReached={feed.loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={feed.refreshing}
            onRefresh={feed.refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            progressViewOffset={headerTotalHeight}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingTop: headerTotalHeight }]}
        scrollIndicatorInsets={{ top: headerTotalHeight }}
      />

      {/* Glossy Translucent / Frosted Glass Top Brand Header */}
      <View
        style={[
          styles.header,
          {
            height: headerTotalHeight,
            paddingTop: topInset,
            backgroundColor: Platform.OS === 'web'
              ? (isDark ? 'rgba(26, 28, 32, 0.92)' : 'rgba(255, 255, 255, 0.92)')
              : (isDark ? '#1a1c20' : '#ffffff'),
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable style={styles.logoBtn} onPress={() => setActiveCategory('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Image
              source={require('../../AARAMBH_LOGO.png')}
              style={styles.logo}
              contentFit="contain"
              contentPosition="left center"
            />
          </Pressable>
          <View style={styles.headerIcons}>
            <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Search')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="search-outline" size={21} color={themeColors.text} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="notifications-outline" size={21} color={themeColors.text} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  )
}

/* ────── Styles ────── */

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { paddingBottom: spacing.xxxl + 20 },

  /* ── Header ── */
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
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
  headerRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingRight: 12,
  },
  logoBtn: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logo: {
    width: 90,
    height: 40,
  },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { padding: 6 },

  /* ── Breaking Ticker ── */
  breakingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  breakingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
    gap: 6,
  },
  breakingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.onPrimary,
  },
  breakingTag: {
    fontFamily: fonts.inter[700],
    color: colors.onPrimary,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  breakingTextWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  breakingText: {
    fontFamily: fonts.inter[600],
    color: colors.onPrimary,
    fontSize: 13,
  },

  /* ── Live Banner ── */
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.sm,
  },
  liveBannerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.sm },
  liveBannerPulse: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.22)' },
  liveBannerTexts: { flex: 1 },
  liveBannerTitle: {
    fontFamily: fonts.inter[700],
    color: colors.onPrimary,
    fontSize: 12,
    letterSpacing: 1,
  },
  liveBannerSub: { fontFamily: fonts.inter[500], color: colors.onPrimary, fontSize: 11, marginTop: 1 },
  liveBannerGo: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: spacing.sm },
  liveBannerGoText: { fontFamily: fonts.inter[700], color: colors.onPrimary, fontSize: 11, letterSpacing: 0.6 },

  /* ── Category Chips ── */
  chipsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  allCatsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    gap: 4,
    marginLeft: 2,
  },
  allCatsText: { fontFamily: fonts.inter[600], fontSize: 13, color: colors.primaryDark },
  marketTickerWrap: {
    marginBottom: spacing.xs,
  },
  sectionBlock: {
    marginBottom: spacing.xs,
  },
  adSlotWrap: {
    marginVertical: spacing.xs,
  },

  /* ── Horizontal cards row ── */
  cardsRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },

  /* ── Featured Card ── */
  featured: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.card,
  },
  featuredImage: {
    width: '100%',
    height: 200,
  },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  featuredBadgeText: {
    fontFamily: fonts.inter[700],
    color: colors.onPrimary,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  featuredTimeOverlay: {
    position: 'absolute',
    top: 10,
    right: 40,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 4,
  },
  featuredTimeText: {
    fontFamily: fonts.inter[500],
    color: '#fff',
    fontSize: 10,
  },
  featuredBookmark: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 5,
    borderRadius: radius.pill,
  },
  featuredBody: {
    padding: spacing.md,
  },
  featuredMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  featuredCategory: {
    fontFamily: fonts.inter[700],
    fontSize: 10,
    letterSpacing: 0.8,
  },
  featuredDot: {
    fontFamily: fonts.inter[500],
    fontSize: 10,
  },
  featuredTime: {
    fontFamily: fonts.inter[500],
    fontSize: 10,
  },
  featuredTitle: {
    fontFamily: fonts.serif[700],
    fontSize: 21,
    lineHeight: 28,
    marginBottom: 4,
  },
  featuredSummary: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  featuredBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  featuredAuthor: {
    fontFamily: fonts.inter[500],
    fontSize: 11,
  },
  featuredReadTime: {
    fontFamily: fonts.inter[500],
    fontSize: 11,
  },
  featuredViewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredViews: {
    fontFamily: fonts.inter[500],
    fontSize: 11,
  },

  /* ── End text ── */
  endText: {
    textAlign: 'center',
    fontSize: 12,
    padding: spacing.lg,
    fontFamily: fonts.inter[500],
  },
})
