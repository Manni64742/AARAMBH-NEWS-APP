import React, { useState } from 'react'
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { contentApi, locationApi, searchApi } from '../api/endpoints'
import { CategoryItem, ContentItem, LocationItem } from '../types'
import { colors, fonts } from '../theme'
import { NewsCard, CategoryChip } from '../components/NewsCard'
import { EmptyState, SkeletonCard } from '../components/States'
import { ScaledText as Text } from '../components/ScaledText'
import { AppBackButton } from '../components/AppBackButton'
import { useTheme } from '../context/ThemeContext'

const FILTERS = ['All', 'News', 'Videos', 'Shorts', 'Reporters', 'Locations', 'Categories']

export default function SearchScreen({ navigation }: any) {
  const { colors: themeColors, isDark } = useTheme()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [results, setResults] = useState<ContentItem[]>([])
  const [locations, setLocations] = useState<LocationItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  const run = async () => {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setSearched(true)
    try {
      const params: Record<string, any> = { status: 'PUBLISHED', limit: 30 }
      if (filter === 'Videos' || filter === 'Shorts') params.contentType = filter === 'Videos' ? 'VIDEO' : 'SHORT_VIDEO'
      if (filter === 'All' || filter === 'News') params.search = q
      else if (filter === 'Videos' || filter === 'Shorts') params.search = q
      const [contentRes, locRes, catRes, allRes] = await Promise.all([
        contentApi.list(params),
        locationApi.search(q),
        (await import('../api/endpoints')).categoryApi.list(),
        filter === 'All' ? searchApi.all(q, 1, 10) : Promise.resolve(null),
      ])
      setResults(contentRes.data)
      setLocations(locRes)
      setCategories(catRes.filter((c) => c.name.en.toLowerCase().includes(q.toLowerCase())))
      if (allRes && allRes.data?.categories) setCategories((prev) => (prev.length ? prev : allRes.data.categories))
    } catch {
    } finally {
      setSearching(false)
    }
  }

  const searchListHeader = (
    <View>
      {locations.length > 0 ? (
        <View style={styles.locationSection}>
          <Text style={styles.sectionLabel}>Locations</Text>
          {locations.map((loc) => (
            <Pressable
              key={loc._id}
              style={styles.locationItem}
              onPress={() => navigation.navigate('NewsDetail', { item: { _id: loc._id } as any })}
            >
              <Ionicons name="location-outline" size={16} color={themeColors.primary} />
              <Text style={[styles.locationText, { color: themeColors.text }]}>{loc.name?.en || loc.name?.hi || ''}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {categories.length > 0 && query.trim().length > 0 ? (
        <View style={styles.locationSection}>
          <Text style={styles.sectionLabel}>Categories</Text>
          <View style={styles.catRow}>
            {categories.map((cat) => (
              <CategoryChip key={cat._id} label={cat.name.en} onPress={() => navigation.navigate('CategoryNews', { categoryId: cat._id, title: cat.name.en })} />
            ))}
          </View>
        </View>
      ) : null}

      {searched ? <Text style={styles.resultsLabel}>{results.length} results</Text> : null}
    </View>
  )

  const insets = useSafeAreaInsets()
  const topInset = insets.top
  const [headerWrapHeight, setHeaderWrapHeight] = useState(0)
  const fallbackHeight = topInset + 152
  const headerHeight = (headerWrapHeight > 0 ? headerWrapHeight : fallbackHeight) + 12

  return (
    <View style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <FlatList
        data={results}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <NewsCard item={item} onPress={() => navigation.push('NewsDetail', { item })} />}
        ListHeaderComponent={searchListHeader}
        ListEmptyComponent={
          searching ? (
            <SkeletonCard />
          ) : searched ? (
            <EmptyState title="No results" subtitle="Try different keywords or filters" />
          ) : (
            <EmptyState title="Search Aarambh News" subtitle="News, videos, reporters, categories, locations" icon="🔍" />
          )
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: 80 }}
        scrollIndicatorInsets={{ top: headerHeight }}
      />

      {/* Glossy Translucent / Frosted Glass Search Header */}
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
          <View style={styles.headerTitleWrap}>
            {navigation?.canGoBack?.() ? (
              <AppBackButton onPress={() => navigation.goBack()} size={34} style={{ marginRight: 10 }} />
            ) : null}
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>Search</Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={[styles.inputWrap, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Ionicons name="search" size={18} color={isDark ? '#60A5FA' : '#2563EB'} />
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              value={query}
              onChangeText={setQuery}
              placeholder="Search news, videos, reporters..."
              placeholderTextColor={themeColors.textLight}
              returnKeyType="search"
              onSubmitEditing={run}
              autoFocus={false}
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => {
                  setQuery('')
                  setResults([])
                  setSearched(false)
                }}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={18} color={themeColors.textMuted} />
              </Pressable>
            ) : null}
          </View>
          <Pressable style={[styles.searchBtn, { backgroundColor: themeColors.primary }]} onPress={run}>
            <Text style={styles.searchBtnText}>Search</Text>
          </Pressable>
        </View>

        <View style={styles.filterWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {FILTERS.map((f) => (
              <CategoryChip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
            ))}
          </ScrollView>
        </View>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
  },
  headerTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 18,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 6 },
  inputWrap: { flex: 1, minWidth: 0, height: 46, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  input: { flex: 1, minWidth: 0, paddingVertical: 8, fontSize: 14, lineHeight: 18 },
  searchBtn: { minWidth: 70, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingHorizontal: 12 },
  searchBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  filterWrap: { paddingVertical: 4 },
  filters: { flexDirection: 'row', paddingHorizontal: 16, gap: 0 },
  locationSection: { paddingHorizontal: 16, paddingTop: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  locationItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  locationText: { fontSize: 14, color: colors.text },
  catRow: { flexDirection: 'row', flexWrap: 'wrap' },
  resultsLabel: { paddingHorizontal: 16, paddingVertical: 8, color: colors.textMuted, fontSize: 12 },
})
