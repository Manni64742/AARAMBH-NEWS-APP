import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  FlatList,
  LayoutChangeEvent,
  PanResponder,
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
import { subscribeUnreadCount, markAllNotificationsSeen } from '../services/notificationService'

import { ScaledText as Text } from '../components/ScaledText'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { BundleCard } from '../components/BundleCard'
import { TrendingRankedList } from '../components/TrendingRankedList'
import {
  ThematicSectionData,
  bundleItemToContentItem,
  BundleCardData,
  BundleNewsItem,
  TrendingRankItem,
  isOrangeTag,
} from '../types/bundles'

/* ────── Breaking Ticker ────── */

const TICKER_SPEED = 45

function BreakingTicker({
  items,
  onPress,
}: {
  items: ContentItem[]
  onPress: (item: ContentItem) => void
}) {
  const { colors: tc, isDark } = useTheme()
  const { language } = useLanguage()
  const [copyWidth, setCopyWidth] = useState(0)
  const pos = useRef(new Animated.Value(0)).current

  // If there's 1 or 2 items, repeat them so there's plenty of content to loop continuously
  const displayItems = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return []
    const valid = items.filter((i): i is ContentItem => Boolean(i && typeof i === 'object' && i.title))
    if (valid.length === 0) return []
    if (valid.length === 1) return [valid[0], valid[0], valid[0], valid[0]]
    if (valid.length === 2) return [...valid, ...valid]
    return valid
  }, [items])

  useEffect(() => {
    if (!displayItems.length || !copyWidth) return
    pos.setValue(0)
    const anim = Animated.loop(
      Animated.timing(pos, {
        toValue: -copyWidth,
        duration: (copyWidth / TICKER_SPEED) * 1000,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    )
    anim.start()
    return () => anim.stop()
  }, [copyWidth, displayItems, pos])

  if (!displayItems.length) return null

  const renderRow = (key: string) => (
    <View
      key={key}
      style={styles.tickerRow}
      {...(key === 'a'
        ? {
            onLayout: (e: LayoutChangeEvent) => {
              const w = e.nativeEvent.layout.width
              if (w > 0 && Math.abs(w - copyWidth) > 2) {
                setCopyWidth(w)
              }
            },
          }
        : {})}
    >
      {displayItems.map((item, idx) => (
        <Pressable
          key={`${key}-${item._id || 'item'}-${idx}`}
          onPress={() => item && onPress(item)}
          style={styles.tickerItem}
        >
          <Text
            style={[
              styles.breakingText,
              { color: tc.text },
              Platform.OS === 'web' && ({ whiteSpace: 'nowrap' } as any),
            ]}
          >
            {item.title}
          </Text>
          <View style={styles.tickerDotWrap}>
            <Text style={[styles.tickerDot, { color: tc.primary }]}>●</Text>
          </View>
        </Pressable>
      ))}
    </View>
  )

  const breakingBg = isDark ? '#251208' : '#FFF2EB'
  const breakingBorder = isDark ? '#4A2010' : '#FFD4C2'

  return (
    <View
      style={[
        styles.breakingBar,
        {
          backgroundColor: breakingBg,
          borderTopColor: breakingBorder,
          borderBottomColor: breakingBorder,
        },
      ]}
    >
      <View style={[styles.breakingLeft, { backgroundColor: breakingBg }]}>
        <Ionicons name="flash" size={15} color={tc.primary} />
        <Text style={[styles.breakingTag, { color: tc.primary }]}>
          {language === 'hi' ? 'ब्रेकिंग' : 'BREAKING'}
        </Text>
      </View>
      <View style={styles.breakingMarqueeTrack}>
        <Animated.View style={[styles.tickerTrack, { transform: [{ translateX: pos }] }]}>
          {renderRow('a')}
          {renderRow('b')}
        </Animated.View>
      </View>
    </View>
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
  const { language } = useLanguage()
  const { isDark } = useTheme()
  const liveCount = streams.filter((s) => s.status === 'LIVE').length || streams.length
  if (!streams.length) return null

  const bannerBg = isDark ? '#092518' : '#ECFDF5'
  const bannerBorder = isDark ? '#15442c' : '#A7F3D0'
  const pulseBg = isDark ? '#0d3824' : '#D1FAE5'
  const primaryGreen = isDark ? '#10B981' : '#059669'
  const subColor = isDark ? '#6EE7B7' : '#047857'

  return (
    <Pressable
      style={[
        styles.liveBanner,
        {
          backgroundColor: bannerBg,
          borderTopColor: bannerBorder,
          borderBottomColor: bannerBorder,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.liveBannerLeft}>
        <View style={[styles.liveBannerPulse, { backgroundColor: pulseBg }]}>
          <Ionicons name="radio" size={15} color={primaryGreen} />
        </View>
        <View style={styles.liveBannerTexts}>
          <Text style={[styles.liveBannerTitle, { color: primaryGreen }]}>LIVE NOW</Text>
          <Text style={[styles.liveBannerSub, { color: subColor }]} numberOfLines={1}>
            {language === 'hi'
              ? `${liveCount} सक्रिय स्ट्रीम — YouTube पर लाइव खबरें देखें`
              : `${liveCount} active stream — watch live on YouTube`}
          </Text>
        </View>
      </View>
      <View style={[styles.liveBannerBtn, { backgroundColor: isDark ? '#10B981' : '#059669' }]}>
        <Text style={styles.liveBannerBtnText}>
          {language === 'hi' ? 'देखें' : 'WATCH'}
        </Text>
        <Ionicons name="play" size={12} color="#fff" />
      </View>
    </Pressable>
  )
}

/* ────── HomeScreen ────── */

export default function HomeScreen({ navigation }: any) {
  const { current: location } = useLocation()
  const { language } = useLanguage()
  const { colors: themeColors, isDark } = useTheme()
  const [unreadNotifs, setUnreadNotifs] = useState(0)

  useEffect(() => {
    return subscribeUnreadCount(setUnreadNotifs)
  }, [])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [breaking, setBreaking] = useState<ContentItem[]>([])
  const [trending, setTrending] = useState<ContentItem[]>([])
  const [stateNews, setStateNews] = useState<ContentItem[]>([])
  const [cityNews, setCityNews] = useState<ContentItem[]>([])
  const [liveStreams, setLiveStreams] = useState<LiveStreamItem[]>([])
  const [activeCategory, setActiveCategory] = useState('')
  const [activeSubCategory, setActiveSubCategory] = useState('')
  const [marketItems, setMarketItems] = useState<MarketIndexItem[]>([])
  const [categoryHeadlines, setCategoryHeadlines] = useState<ContentItem[]>([])

  useEffect(() => {
    marketApi.list().then(setMarketItems).catch(() => {})
  }, [])

  // Load complete category hierarchy tree (Master Categories + Sub-Categories)
  useEffect(() => {
    categoryApi
      .tree()
      .then((tree) => {
        if (Array.isArray(tree) && tree.length > 0) {
          setCategories(tree)
        }
      })
      .catch(() => {})
  }, [])

  // Find active category object
  const activeCatObj = categories.find((c) => c._id === activeCategory || c.slug === activeCategory)
  const isMarket = activeCatObj
    ? activeCatObj.slug === 'market' || activeCatObj.slug === 'share-market' || activeCatObj.slug === 'finance'
    : activeCategory === 'market'

  // Sub-categories of currently active category
  const currentSubCategories = activeCatObj?.subCategories || []
  const activeSubCatObj = currentSubCategories.find((s) => s._id === activeSubCategory || s.slug === activeSubCategory)

  // Keep master category top headlines loaded so top slider and breaking ticker never collapse
  useEffect(() => {
    const params: Record<string, any> = { status: 'PUBLISHED', limit: 8, language, sort: 'latest' }
    if (activeCategory) {
      params.category = activeCategory
    }
    contentApi.list(params).then((r) => setCategoryHeadlines(r.data)).catch(() => setCategoryHeadlines([]))
  }, [activeCategory, language])

  const topTabsScrollRef = useRef<ScrollView>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchStartTime = useRef(0)

  // Dynamic Thematic Sections, Trending, and Most Read items from Backend
  const [thematicSections, setThematicSections] = useState<ThematicSectionData[]>([])
  const [trendingList, setTrendingList] = useState<TrendingRankItem[]>([])
  const [mostReadList, setMostReadList] = useState<any[]>([])

  const loadHomeBundles = useCallback(() => {
    let isMounted = true
    contentApi.homeBundles(language).then((data) => {
      if (!isMounted) return
      if (data && Array.isArray(data.thematicSections)) {
        setThematicSections(data.thematicSections)
      }
      if (data && Array.isArray(data.trending)) {
        setTrendingList(data.trending)
      }
      if (data && Array.isArray(data.mostRead)) {
        setMostReadList(data.mostRead)
      }
    }).catch(() => {})

    return () => { isMounted = false }
  }, [language])

  useEffect(() => {
    const cleanup = loadHomeBundles()
    return cleanup
  }, [loadHomeBundles])

  // Master tab list for swipe gestures
  const tabList = useMemo(() => {
    return [
      { id: '', label: language === 'hi' ? 'होम' : 'Home', slug: 'home' },
      ...categories.map((c) => ({
        id: c._id,
        label: language === 'hi' ? (c.name?.hi || c.name?.en) : (c.name?.en || c.name?.hi),
        slug: c.slug,
      })),
    ]
  }, [categories, language])

  const getActiveTabIndex = useCallback(() => {
    if (!activeCategory) return 0
    const idx = tabList.findIndex((t) => {
      if (t.id && t.id === activeCategory) return true
      if (t.slug && activeCatObj?.slug && t.slug === activeCatObj.slug) return true
      if (t.slug === 'market' && isMarket) return true
      return false
    })
    return idx >= 0 ? idx : 0
  }, [activeCategory, activeCatObj, isMarket, tabList])

  const switchToTabByIndex = useCallback(
    (targetIdx: number) => {
      if (targetIdx < 0 || targetIdx >= tabList.length) return
      const target = tabList[targetIdx]
      setActiveCategory(target.id)
      setActiveSubCategory('')
      topTabsScrollRef.current?.scrollTo({
        x: Math.max(0, targetIdx * 90 - 110),
        animated: true,
      })
    },
    [tabList]
  )

  // Auto-scroll top category tabs whenever activeCategory changes
  useEffect(() => {
    const idx = getActiveTabIndex()
    topTabsScrollRef.current?.scrollTo({
      x: Math.max(0, idx * 95 - 100),
      animated: true,
    })
  }, [activeCategory, getActiveTabIndex])

  // PanResponder for universal mobile touch gestures
  const panResponder = useMemo(() => {
    const onRelease = (_: any, gestureState: any) => {
      const { dx, dy } = gestureState
      if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 1.15) {
        const currentIdx = getActiveTabIndex()
        if (dx < 0 && currentIdx < tabList.length - 1) {
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
  }, [getActiveTabIndex, switchToTabByIndex, tabList.length])

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
        if (deltaX < 0 && currentIdx < tabList.length - 1) {
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
  }, [getActiveTabIndex, switchToTabByIndex, tabList.length])

  // Load feed based on activeCategory, activeSubCategory, and location
  const loadFeed = useCallback(
    async (page: number) => {
      const params: Record<string, any> = { page, limit: 15, status: 'PUBLISHED', language }
      if (activeSubCategory) {
        params.subCategory = activeSubCategory
      } else if (activeCategory) {
        params.category = activeCategory
      } else {
        if (location?.city) params.city = location.city
        if (location?.district) params.district = location.district
        if (location?.state) params.state = location.state
      }
      const res = await contentApi.feed(params)
      return { data: res.data, pagination: res.pagination }
    },
    [location, activeCategory, activeSubCategory, language]
  )

  const feed = usePagedFeed({ load: loadFeed })

  useEffect(() => {
    const base: Record<string, any> = { status: 'PUBLISHED', limit: 10, language }
    const breakingParams: Record<string, any> = { ...base, breaking: 'true' }
    const trendingParams: Record<string, any> = { ...base, sort: 'trending', limit: 10 }

    if (activeSubCategory) {
      breakingParams.subCategory = activeSubCategory
      trendingParams.subCategory = activeSubCategory
    } else if (activeCategory) {
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
  }, [location, activeCategory, activeSubCategory, language])

  useEffect(() => {
    if (!location?.state || isMarket || activeCategory) {
      setStateNews([])
      return
    }
    contentApi
      .list({ status: 'PUBLISHED', state: location.state, limit: 8, sort: 'latest', language })
      .then((r) => setStateNews(r.data))
      .catch(() => setStateNews([]))
  }, [location?.state, activeCategory, isMarket, language])

  useEffect(() => {
    if (!location?.city || isMarket || activeCategory) {
      setCityNews([])
      return
    }
    contentApi
      .list({ status: 'PUBLISHED', city: location.city, limit: 8, sort: 'latest', language })
      .then((r) => setCityNews(r.data))
      .catch(() => setCityNews([]))
  }, [location?.city, activeCategory, isMarket, language])

  useEffect(() => {
    liveStreamApi
      .list()
      .then((r) => {
        const live = (r || []).filter((s: LiveStreamItem) => s.status !== 'ENDED')
        setLiveStreams(live)
      })
      .catch(() => setLiveStreams([]))
  }, [])

  const openNews = (item: ContentItem) => navigation.navigate('NewsDetail', { item })
  const handleBookmark = (id: string) => {
    interactionApi.toggle(id, 'BOOKMARK').catch(() => {})
  }

  /* Fallback: breaking-flagged items or category headlines or feed items */
  const validBreaking = (breaking || []).filter((i) => i && i.title)
  const validFeedBreaking = (feed.items || []).filter((i) => i && i.flags?.isBreaking && i.title)
  const validCatHeadlines = (categoryHeadlines || []).filter((i) => i && i.title)
  const validFeedItems = (feed.items || []).filter((i) => i && i.title)
  const validTrending = (trending || []).filter((i) => i && i.title)

  const breakingItems = validBreaking.length > 0
    ? validBreaking
    : validFeedBreaking.length > 0
      ? validFeedBreaking
      : validCatHeadlines.length > 0
        ? validCatHeadlines.slice(0, 5)
        : validFeedItems.slice(0, 5)

  /* Slider headlines: always prioritize the freshest published article at position #0 in top hero slider */
  const newestItem = validFeedItems[0]
  const otherHeadlines = (validBreaking.length > 0 ? validBreaking : [])
    .concat(validTrending.length > 0 ? validTrending : [])
    .concat(validCatHeadlines)
    .concat(validFeedItems.slice(1))
    .filter((i) => i && i._id && (!newestItem || i._id !== newestItem._id))

  const rawHeadlines = (newestItem ? [newestItem, ...otherHeadlines] : otherHeadlines).slice(0, 6)

  const headlines = rawHeadlines.length >= 2
    ? rawHeadlines
    : validCatHeadlines.length >= 2
      ? validCatHeadlines.slice(0, 6)
      : validFeedItems.slice(0, 6)

  const sliderList = headlines.length === 1 ? [headlines[0], headlines[0]] : headlines

  /* Feed items: include all valid articles in strict recency order */
  const feedWithoutHero = validFeedItems

  /* Horizontal sliding items: when subcategory is active, show trending/feed items of that subcategory */
  const marketSlidingItems = validTrending.length > 0 ? validTrending : validFeedItems.slice(0, 8)

  const openLive = () => navigation.navigate('LiveNews')
  const openLocations = () => navigation.navigate('Locations')
  const openCategories = () => navigation.navigate('Categories')

  const openBundleItem = (item: BundleNewsItem | TrendingRankItem, catName = 'General') => {
    const fullContent = (item as any)._content || bundleItemToContentItem(item, catName)
    navigation.navigate('NewsDetail', { item: fullContent })
  }

  const openBundleViewMore = (bundle: BundleCardData) => {
    navigation.navigate('CategoryNewsList', {
      title: bundle.title,
      sectionTitle: bundle.sectionTitle,
      items: bundle.items,
    })
  }

  const insets = useSafeAreaInsets()
  const topInset = insets.top
  const headerTotalHeight = topInset + 46 + 42

  /* ────── Header (FlatList ListHeaderComponent) ────── */
  const Header = (
    <View>
      {/* 1. BREAKING NEWS TICKER */}
      <BreakingTicker items={breakingItems} onPress={openNews} />

      {/* 2. LIVE NEWS BANNER (YouTube streams - hidden on Market tab) */}
      {!isMarket && <LiveBanner streams={liveStreams} onPress={openLive} />}

      {/* 3. MARKET TICKER (Visible ONLY when Market tab is selected) */}
      {isMarket && marketItems.length > 0 ? (
        <View style={styles.marketTickerWrap}>
          <MarketTicker items={marketItems} />
        </View>
      ) : null}

      {/* 4. NEWS SLIDER (मुख्य खबरें / Headlines) */}
      {sliderList.length >= 2 ? (
        <View style={styles.heroWrap}>
          <NewsSlider
            items={sliderList}
            onPress={openNews}
            title={
              isMarket
                ? language === 'hi' ? 'मार्केट मुख्य खबरें' : 'Market Headlines'
                : activeCatObj
                  ? language === 'hi' ? `${activeCatObj.name.hi || activeCatObj.name.en} मुख्य खबरें` : `${activeCatObj.name.en} Headlines`
                  : language === 'hi' ? 'मुख्य खबरें' : 'Headlines'
            }
          />
        </View>
      ) : null}

      {/* ── IF ON HOME (ALL): RENDER THEMATIC BUNDLE SECTIONS ── */}
      {!activeCategory ? (
        <View>
          {/* DYNAMIC CATEGORY THEMATIC SECTIONS */}
          {thematicSections.length === 0 ? (
            <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : (
            thematicSections.map((sec) => (
              <View key={sec.id} style={styles.thematicSection}>
                <View style={styles.thematicSectionHeader}>
                  <Text style={[styles.thematicSectionHeading, { color: themeColors.text }]}>
                    {sec.title}
                  </Text>
                </View>
                <ScrollView
                  horizontal={sec.bundles.length > 1}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.bundleScrollRow}
                  scrollEnabled={sec.bundles.length > 1}
                >
                  {sec.bundles.map((b) => (
                    <BundleCard
                      key={b.id}
                      bundle={b}
                      isSingle={sec.bundles.length === 1}
                      onItemPress={(item) => openBundleItem(item, b.title)}
                      onViewMore={() => openBundleViewMore(b)}
                    />
                  ))}
                </ScrollView>
              </View>
            ))
          )}

          {/* SECTION: TRENDING 01-05 */}
          {trendingList.length > 0 ? (
            <View style={styles.thematicSection}>
              <View style={styles.thematicSectionHeader}>
                <Text style={[styles.thematicSectionHeading, { color: themeColors.text }]}>
                  {language === 'hi' ? 'टॉप ट्रेंडिंग' : 'Trending'}
                </Text>
              </View>
              <TrendingRankedList
                items={trendingList}
                onItemPress={(item) => openBundleItem(item, 'Trending')}
                onViewMore={() => navigation.navigate('Latest')}
              />
            </View>
          ) : null}

          {/* SECTION: MOST READ */}
          {mostReadList.length > 0 ? (
            <View style={styles.thematicSection}>
              <View style={styles.thematicSectionHeader}>
                <Text style={[styles.thematicSectionHeading, { color: themeColors.text }]}>
                  {language === 'hi' ? 'सर्वाधिक पढ़े गए' : 'Most Read'}
                </Text>
              </View>
              <View style={styles.indiaItemsWrap}>
                {mostReadList.map((item, idx) => (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.indiaCard,
                      { backgroundColor: themeColors.card, borderColor: themeColors.border },
                      idx === mostReadList.length - 1 && { marginBottom: 0 },
                    ]}
                    onPress={() => openBundleItem(item, 'Most Read')}
                  >
                    <View style={styles.indiaDetails}>
                      <View
                        style={[
                          styles.blueTagBadge,
                          isOrangeTag(item.tag)
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
                            styles.blueTagText,
                            {
                              color: isOrangeTag(item.tag)
                                ? (isDark ? '#FF7043' : '#E64A19')
                                : (isDark ? '#93C5FD' : '#1D4ED8'),
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.tag}
                        </Text>
                      </View>
                      <Text
                        style={[styles.indiaTitle, { color: themeColors.text }]}
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                      <Text style={[styles.timeText, { color: themeColors.textMuted }]}>
                        {item.publishedAt}
                      </Text>
                    </View>
                    <Image source={{ uri: item.imageUrl }} style={styles.indiaThumb} contentFit="cover" />
                  </Pressable>
                ))}

                {/* Full Width Solid VIEW MORE Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.outlineViewMoreBtn,
                    {
                      backgroundColor: pressed ? '#E64A19' : themeColors.primary,
                    },
                  ]}
                  onPress={() => navigation.navigate('Latest')}
                >
                  <Text style={styles.outlineViewMoreText}>
                    {language === 'hi' ? 'सभी सर्वाधिक पढ़े गए देखें' : 'VIEW MORE MOST READ'}
                  </Text>
                  <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      ) : (
        /* ── IF A SPECIFIC CATEGORY IS ACTIVE: RENDER CATEGORY FILTER & SLIDER ── */
        <View>
          {/* 5. SUB-CATEGORIES / QUICK FILTERS PILLS ROW */}
          <View style={styles.subCategorySection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subChipsContainer}
            >
              {/* 'All' pill */}
              <Pressable
                style={[
                  styles.subPill,
                  !activeSubCategory && styles.subPillActive,
                  {
                    backgroundColor: !activeSubCategory ? themeColors.primary : themeColors.card,
                    borderColor: !activeSubCategory ? themeColors.primary : themeColors.border,
                  },
                ]}
                onPress={() => setActiveSubCategory('')}
              >
                <Text
                  style={[
                    styles.subPillText,
                    !activeSubCategory ? styles.subPillTextActive : { color: themeColors.textMuted },
                  ]}
                >
                  {language === 'hi' ? 'सभी' : 'All'}
                </Text>
              </Pressable>

              {currentSubCategories.map((sub) => {
                const isSubActive = activeSubCategory === sub._id
                const subLabel = language === 'hi' ? (sub.name?.hi || sub.name?.en) : (sub.name?.en || sub.name?.hi)
                return (
                  <Pressable
                    key={sub._id}
                    style={[
                      styles.subPill,
                      isSubActive && styles.subPillActive,
                      {
                        backgroundColor: isSubActive ? themeColors.primary : themeColors.card,
                        borderColor: isSubActive ? themeColors.primary : themeColors.border,
                      },
                    ]}
                    onPress={() => setActiveSubCategory(isSubActive ? '' : sub._id)}
                  >
                    <Text
                      style={[
                        styles.subPillText,
                        isSubActive ? styles.subPillTextActive : { color: themeColors.textMuted },
                      ]}
                    >
                      {subLabel}
                    </Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>

          {/* Category Horizontal Sliding Section */}
          {marketSlidingItems.length > 0 ? (
            <View style={styles.sectionBlock}>
              <SectionHeader
                title={
                  activeSubCatObj
                    ? language === 'hi'
                      ? `${activeSubCatObj.name.hi || activeSubCatObj.name.en} ट्रेंड्स`
                      : `${activeSubCatObj.name.en || activeSubCatObj.name.hi} Trends`
                    : isMarket
                      ? language === 'hi' ? 'मार्केट ट्रेंड्स' : 'Market Trends'
                      : language === 'hi' ? 'ट्रेंडिंग अभी' : 'Trending Now'
                }
                action={language === 'hi' ? 'सभी देखें' : 'See all'}
                onAction={openCategories}
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
          ) : null}
        </View>
      )}

      {/* 9. ADVERTISEMENT SECTION */}
      <View style={styles.adSlotWrap}>
        <AdBanner slot="home_top" />
      </View>

      {/* 10. CONTINUOUS NEWS FEED SECTION HEADER */}
      <SectionHeader
        title={
          activeSubCatObj
            ? (language === 'hi'
                ? (activeSubCatObj.name.hi || activeSubCatObj.name.en)
                : (activeSubCatObj.name.en || activeSubCatObj.name.hi))
            : isMarket
              ? (language === 'hi' ? 'मार्केट' : 'Market')
              : activeCatObj
                ? (language === 'hi'
                    ? (activeCatObj.name.hi || activeCatObj.name.en)
                    : (activeCatObj.name.en || activeCatObj.name.hi))
                : (language === 'hi' ? 'ताज़ा ख़बरें' : 'Latest Headlines')
        }
      />
    </View>
  )

  /* ────── Footer ────── */
  const ListFooter = (
    <View>
      {feed.items.length > 0 ? (
        <View style={styles.adSlotWrap}>
          <AdBanner slot="home_bottom" />
        </View>
      ) : null}
      {feed.loadingMore ? (
        <AarambhLoader size="sm" style={{ paddingVertical: 14 }} />
      ) : !feed.pagination?.hasNextPage && feed.items.length > 0 ? (
        <Text style={[styles.endText, { color: themeColors.secondary }]}>
          {language === 'hi' ? 'आपने सभी खबरें देख ली हैं' : "You've reached the end"}
        </Text>
      ) : null}
    </View>
  )

  /* ────── Render ────── */
  return (
    <View
      style={[styles.safe, { backgroundColor: themeColors.background }]}
      {...panResponder.panHandlers}
    >
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
            <EmptyState
              title={language === 'hi' ? 'कोई खबर नहीं मिली' : 'No news yet'}
              subtitle={language === 'hi' ? 'ताज़ा करने के लिए नीचे खींचें' : 'Pull down to refresh'}
            />
          )
        }
        ListFooterComponent={ListFooter}
        onEndReached={feed.loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={feed.refreshing}
            onRefresh={() => {
              feed.refresh()
              loadHomeBundles()
              categoryApi.tree().then((t) => { if (Array.isArray(t) && t.length > 0) setCategories(t) }).catch(() => {})
            }}
            colors={[themeColors.primary]}
            tintColor={themeColors.primary}
            progressViewOffset={headerTotalHeight}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingTop: headerTotalHeight }]}
        scrollIndicatorInsets={{ top: headerTotalHeight }}
      />

      {/* ────── Fixed Top Brand Header & Category Tabs (Sticky) ────── */}
      <View
        style={[
          styles.header,
          {
            height: headerTotalHeight,
            paddingTop: topInset,
            backgroundColor: Platform.OS === 'web'
              ? (isDark ? 'rgba(18, 20, 23, 0.96)' : 'rgba(255, 255, 255, 0.96)')
              : (isDark ? '#121417' : '#ffffff'),
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        {/* Row 1: Logo & Icons */}
        <View style={styles.headerRow}>
          <Pressable
            style={styles.logoBtn}
            onPress={() => {
              setActiveCategory('')
              setActiveSubCategory('')
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Image
              source={require('../../assets/aarambh_news_logo.png')}
              style={styles.logo}
              contentFit="contain"
              contentPosition="left center"
            />
          </Pressable>
          <View style={styles.headerIcons}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Search')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="search" size={21} color={themeColors.text} />
            </Pressable>
            <Pressable
              style={[
                styles.liveHeaderBtn,
                {
                  backgroundColor: isDark ? '#092518' : '#ECFDF5',
                  borderColor: isDark ? '#15442c' : '#A7F3D0',
                },
              ]}
              onPress={() => navigation.navigate('LiveNews')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="radio" size={15} color={isDark ? '#10B981' : '#059669'} />
              <Text style={[styles.liveHeaderBtnText, { color: isDark ? '#10B981' : '#059669' }]}>LIVE</Text>
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={() => {
                markAllNotificationsSeen().catch(() => {})
                navigation.navigate('Notifications')
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="notifications" size={21} color={themeColors.text} />
              {unreadNotifs > 0 ? (
                <View style={[styles.notificationBadge, { backgroundColor: '#EF4444' }]}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotifs > 99 ? '99+' : unreadNotifs}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>

        {/* Row 2: Top Category Tabs (No Home Icon per user request!) */}
        <ScrollView
          ref={topTabsScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topTabsContainer}
        >
          {/* Home Tab */}
          <Pressable
            style={[styles.topTabItem, !activeCategory && styles.topTabItemActive]}
            onPress={() => {
              setActiveCategory('')
              setActiveSubCategory('')
            }}
          >
            <Text
              style={[
                styles.topTabText,
                !activeCategory
                  ? [styles.topTabTextActive, { color: themeColors.primary }]
                  : { color: themeColors.textMuted },
                { fontFamily: language === 'hi' ? fonts.devanagari[700] : fonts.inter[600] },
              ]}
            >
              {language === 'hi' ? 'होम' : 'Home'}
            </Text>
            {!activeCategory && (
              <View style={[styles.activeTabIndicator, { backgroundColor: themeColors.primary }]} />
            )}
          </Pressable>

          {/* Master Categories */}
          {categories.map((cat) => {
            const isThisMarket = cat.slug === 'market'
            const isActive = isThisMarket ? isMarket : activeCategory === cat._id
            const label = language === 'hi' ? (cat.name?.hi || cat.name?.en) : (cat.name?.en || cat.name?.hi)
            return (
              <Pressable
                key={cat._id}
                style={[styles.topTabItem, isActive && styles.topTabItemActive]}
                onPress={() => {
                  setActiveCategory(cat._id)
                  setActiveSubCategory('')
                }}
              >
                <Text
                  style={[
                    styles.topTabText,
                    isActive
                      ? [styles.topTabTextActive, { color: themeColors.primary }]
                      : { color: themeColors.textMuted },
                    { fontFamily: language === 'hi' ? (isActive ? fonts.devanagari[700] : fonts.devanagari[400]) : (isActive ? fonts.inter[700] : fonts.inter[500]) },
                  ]}
                >
                  {label}
                </Text>
                {isActive && (
                  <View style={[styles.activeTabIndicator, { backgroundColor: themeColors.primary }]} />
                )}
              </Pressable>
            )
          })}
        </ScrollView>
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
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12,
    paddingRight: 12,
  },
  logoBtn: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logo: {
    width: 140,
    height: 40,
  },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { padding: 6, position: 'relative' },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7.5,
    height: 7.5,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#121417',
  },
  notificationBadge: {
    position: 'absolute',
    top: 1,
    right: 1,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: fonts.inter[700],
    textAlign: 'center',
    lineHeight: 11,
  },
  liveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: radius.pill,
  },
  liveHeaderBtnText: {
    fontFamily: fonts.sans[700],
    fontSize: 10.5,
    letterSpacing: 0.6,
  },

  /* ── Top Category Tabs ── */
  topTabsContainer: {
    paddingHorizontal: 12,
    alignItems: 'center',
    height: 38,
  },
  topTabItem: {
    paddingHorizontal: 12,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 4,
  },
  topTabItemActive: {},
  topTabText: {
    fontSize: 14,
    includeFontPadding: false,
  },
  topTabTextActive: {
    fontWeight: '700',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    right: 10,
    height: 3,
    borderRadius: 2,
  },

  /* ── Breaking Ticker ── */
  breakingBar: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    marginTop: 6,
    marginBottom: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  breakingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.sm + 4,
    zIndex: 2,
    gap: 4,
  },
  breakingTag: {
    fontFamily: fonts.sans[700],
    fontSize: 11.5,
    letterSpacing: 0.5,
  },
  breakingMarqueeTrack: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  tickerTrack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  tickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  breakingText: {
    fontFamily: fonts.sans[600],
    fontSize: 12.5,
  },
  tickerDotWrap: {
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickerDot: {
    fontSize: 8,
  },

  /* ── Live Banner ── */
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 6,
  },
  liveBannerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.sm },
  liveBannerPulse: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBannerTexts: { flex: 1 },
  liveBannerTitle: {
    fontFamily: fonts.inter[700],
    fontSize: 12,
    letterSpacing: 0.8,
  },
  liveBannerSub: {
    fontFamily: fonts.inter[500],
    fontSize: 11,
    marginTop: 1,
  },
  liveBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginLeft: spacing.sm,
  },
  liveBannerBtnText: {
    fontFamily: fonts.sans[700],
    color: '#ffffff',
    fontSize: 11.5,
  },

  /* ── Sub-Category Pills Row ── */
  subCategorySection: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  subChipsContainer: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  subPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subPillActive: {},
  subPillText: {
    fontFamily: fonts.sans[600],
    fontSize: 12.5,
    includeFontPadding: false,
  },
  subPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

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

  /* ── Thematic Bundle Sections ── */
  heroWrap: {
    marginBottom: 8,
  },
  outlineViewMoreBtn: {
    width: '100%',
    marginTop: 14,
    height: 44,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 2,
  },
  outlineViewMoreText: {
    fontFamily: fonts.sans[700],
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  thematicSection: {
    marginTop: 22,
    marginBottom: 6,
  },
  thematicSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: 12,
  },
  brandSectionBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 9,
  },
  thematicSectionHeading: {
    fontFamily: fonts.serif[700],
    fontSize: 20,
    letterSpacing: -0.3,
  },
  bundleScrollRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 6,
  },
  indiaItemsWrap: {
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  indiaCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indiaDetails: {
    flex: 1,
    paddingRight: 12,
  },
  indiaTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 14,
    lineHeight: 19.5,
    marginTop: 3,
    marginBottom: 4,
  },
  indiaThumb: {
    width: 82,
    height: 58,
    borderRadius: radius.md,
  },
  blueTagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginBottom: 4,
  },
  blueTagText: {
    fontFamily: fonts.sans[700],
    fontSize: 9.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timeText: {
    fontFamily: fonts.sans[500],
    fontSize: 10.5,
  },

  /* ── End text ── */
  endText: {
    textAlign: 'center',
    fontSize: 12,
    padding: spacing.lg,
    fontFamily: fonts.inter[500],
  },
})
