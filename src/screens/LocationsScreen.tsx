import React, { useCallback, useEffect, useState } from 'react'
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { contentApi, locationApi } from '../api/endpoints'
import { ContentItem, LocationItem } from '../types'
import { colors, fonts, radius, spacing } from '../theme'
import { useTheme } from '../context/ThemeContext'
import { ScaledText as Text } from '../components/ScaledText'
import { ErrorState, SkeletonCard } from '../components/States'
import { NewsCard } from '../components/NewsCard'
import { AppBackButton } from '../components/AppBackButton'

export default function LocationsScreen({ navigation }: any) {
  const { colors: themeColors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const [states, setStates] = useState<LocationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [districtsByState, setDistrictsByState] = useState<Record<string, LocationItem[]>>({})
  const [citiesByDistrict, setCitiesByDistrict] = useState<Record<string, LocationItem[]>>({})
  const [expandedState, setExpandedState] = useState<string | null>(null)
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState<LocationItem | null>(null)
  const [browsed, setBrowsed] = useState<LocationItem | null>(null)
  const [news, setNews] = useState<ContentItem[] | null>(null)
  const [newsLoading, setNewsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setStates(await locationApi.states())
    } catch {
      setError('Failed to load locations')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggleState = async (state: LocationItem) => {
    if (expandedState === state._id) {
      setExpandedState(null)
      return
    }
    setExpandedState(state._id)
    setExpandedDistrict(null)
    setBrowsed(state)
    await loadNews(state.name.en, 'state')
    if (!districtsByState[state._id]) {
      const ds = await locationApi.districts(state._id).catch(() => [])
      setDistrictsByState((prev) => ({ ...prev, [state._id]: ds }))
    }
  }

  const toggleDistrict = async (district: LocationItem) => {
    if (expandedDistrict === district._id) {
      setExpandedDistrict(null)
      return
    }
    setExpandedDistrict(district._id)
    setBrowsed(district)
    await loadNews(district.name.en, 'district')
    if (!citiesByDistrict[district._id]) {
      const cs = await locationApi.cities(district._id).catch(() => [])
      setCitiesByDistrict((prev) => ({ ...prev, [district._id]: cs }))
    }
  }

  const chooseCity = async (city: LocationItem) => {
    setSelectedCity(city)
    setBrowsed(city)
    await loadNews(city.name.en, 'city')
  }

  const loadNews = async (name: string, type: string) => {
    setNewsLoading(true)
    setNews(null)
    try {
      const params: Record<string, any> = { status: 'PUBLISHED', limit: 20 }
      if (type === 'state') params.state = name
      else if (type === 'district') params.district = name
      else params.city = name
      const res = await contentApi.list(params)
      setNews(res.data)
    } catch {
      setNews([])
    } finally {
      setNewsLoading(false)
    }
  }

  return (
    <View style={[styles.safe, { backgroundColor: themeColors.background }]}>
      {/* Sleek Top Header — Zero Gap, matching AppStackHeader */}
      <View
        style={{
          height: insets.top + 48,
          paddingTop: insets.top,
          backgroundColor: Platform.OS === 'web'
            ? (isDark ? 'rgba(26, 28, 32, 0.92)' : 'rgba(255, 255, 255, 0.92)')
            : (isDark ? '#1a1c20' : '#ffffff'),
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          ...Platform.select({
            web: { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' },
            default: {},
          }),
        }}
      >
        <View style={{ height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}>
          <AppBackButton onPress={() => navigation.goBack()} size={34} style={{ marginRight: 8 }} />
          <Text style={{ flex: 1, fontFamily: fonts.sans[700], fontSize: 16.5, color: themeColors.text }}>
            News by State &amp; City
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Select a location</Text>
          <Text style={[styles.sectionSub, { color: themeColors.textMuted }]}>
            Tap a state → district → city to explore its news.
          </Text>
        </View>

        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {loading ? (
          <View>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          states.map((state) => {
            const stateOpen = expandedState === state._id
            const districts = districtsByState[state._id] || []
            return (
              <View key={state._id}>
                <Pressable
                  style={[styles.row, { backgroundColor: themeColors.card }, browsed?._id === state._id && { borderLeftWidth: 3, borderLeftColor: colors.primary }]}
                  onPress={() => toggleState(state)}
                >
                  <Ionicons name="business-outline" size={16} color={colors.primary} />
                  <Text style={[styles.rowText, { color: themeColors.text }]} numberOfLines={1}>
                    {state.name.en}
                  </Text>
                  <Text style={[styles.rowCount, { color: themeColors.textMuted }]}>
                    {districts.length} districts
                  </Text>
                  <Ionicons name={stateOpen ? 'chevron-down' : 'chevron-forward'} size={16} color={themeColors.textMuted} />
                </Pressable>

                {stateOpen ? (
                  <View>
                    {districts.length === 0 && !districtsByState[state._id] ? (
                      <Text style={[styles.emptyHint, { color: themeColors.textMuted }]}>Loading districts…</Text>
                    ) : null}
                    {districts.map((district) => {
                      const districtOpen = expandedDistrict === district._id
                      const cities = citiesByDistrict[district._id] || []
                      return (
                        <View key={district._id}>
                          <Pressable
                            style={[styles.row, styles.rowNested, { backgroundColor: themeColors.surfaceContainer }, browsed?._id === district._id && { borderLeftWidth: 3, borderLeftColor: colors.primary }]}
                            onPress={() => toggleDistrict(district)}
                          >
                            <Ionicons name="map-outline" size={15} color={themeColors.textMuted} />
                            <Text style={[styles.rowText, { color: themeColors.text }]} numberOfLines={1}>
                              {district.name.en}
                            </Text>
                            <Text style={[styles.rowCount, { color: themeColors.textMuted }]}>
                              {cities.length} cities
                            </Text>
                            <Ionicons name={districtOpen ? 'chevron-down' : 'chevron-forward'} size={15} color={themeColors.textMuted} />
                          </Pressable>
                          {districtOpen ? (
                            <View style={styles.cityRow}>
                              {cities.length === 0 && !citiesByDistrict[district._id] ? (
                                <Text style={[styles.emptyHint, { color: themeColors.textMuted }]}>Loading cities…</Text>
                              ) : null}
                              {cities.map((city) => (
                                <Pressable
                                  key={city._id}
                                  onPress={() => chooseCity(city)}
                                  style={[styles.cityChip, { backgroundColor: selectedCity?._id === city._id ? colors.primary : themeColors.card, borderColor: themeColors.border }]}
                                >
                                  <Ionicons name="location-outline" size={12} color={selectedCity?._id === city._id ? '#fff' : themeColors.textMuted} />
                                  <Text
                                    style={[styles.cityChipText, { color: selectedCity?._id === city._id ? '#fff' : themeColors.text }]}
                                    numberOfLines={1}
                                  >
                                    {city.name.en}
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                          ) : null}
                        </View>
                      )
                    })}
                  </View>
                ) : null}
              </View>
            )
          })
        )}

        {(browsed || news) ? (
          <View style={[styles.newsPanel, { borderTopColor: themeColors.border }]}>
            <View style={styles.newsHead}>
              <Text style={[styles.newsTitle, { color: themeColors.text }]} numberOfLines={1}>
                {browsed?.name?.en || 'News'}
              </Text>
              {browsed ? (
                <Pressable onPress={() => { setBrowsed(null); setNews(null) }} hitSlop={8}>
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              ) : null}
            </View>
            {newsLoading ? (
              <View>
                <SkeletonCard />
                <SkeletonCard />
              </View>
            ) : news && news.length > 0 ? (
              news.map((item) => (
                <NewsCard key={item._id} item={item} onPress={() => navigation.push('NewsDetail', { item })} />
              ))
            ) : news && news.length === 0 ? (
              <Text style={[styles.noNews, { color: themeColors.textMuted }]}>
                No stories for {browsed?.name?.en || 'this location'} yet
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.sans[700], fontSize: 17.5, flex: 1 },
  sectionHead: { paddingTop: spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  sectionTitle: { fontFamily: fonts.serif[700], fontSize: 20 },
  sectionSub: { fontFamily: fonts.inter[500], fontSize: 12, marginTop: 2 },
  row: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  rowNested: { paddingLeft: spacing.lg + 20 },
  rowText: { flex: 1, fontFamily: fonts.inter[600], fontSize: 14 },
  rowCount: { fontFamily: fonts.inter[500], fontSize: 11 },
  emptyHint: { paddingLeft: spacing.lg + 40, paddingVertical: spacing.sm, fontSize: 12, fontFamily: fonts.inter[500] },
  cityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg + 20,
    paddingVertical: spacing.sm,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  cityChipText: { fontFamily: fonts.inter[600], fontSize: 12 },
  newsPanel: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: spacing.lg, paddingTop: spacing.md },
  newsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  newsTitle: { flex: 1, fontFamily: fonts.serif[700], fontSize: 18 },
  clearText: { fontFamily: fonts.inter[600], fontSize: 12, color: colors.primaryDark },
  noNews: { fontFamily: fonts.inter[500], fontSize: 13, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
})