import React, { useEffect, useState } from 'react'
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { ScaledText as Text } from '../components/ScaledText'
import { EmptyState, SkeletonCard } from '../components/States'
import { AppBackButton } from '../components/AppBackButton'
import { useTheme } from '../context/ThemeContext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { categoryApi } from '../api/endpoints'
import { CategoryItem } from '../types'
import { colors, fonts, radius, spacing } from '../theme'

const CATEGORY_ICONS: Record<string, string> = {
  BREAKING: 'flash',
  LOCAL: 'location',
  NATIONAL: 'flag',
  INTERNATIONAL: 'earth',
  POLITICS: 'business',
  BUSINESS: 'briefcase',
  MARKET: 'stats-chart',
  FINANCE: 'trending-up',
  'SHARE MARKET': 'trending-up',
  TECHNOLOGY: 'hardware-chip',
  EDUCATION: 'school',
  HEALTH: 'medkit',
  SPORTS: 'football',
  CRICKET: 'baseball',
  ENTERTAINMENT: 'film',
  BOLLYWOOD: 'film',
  LIFESTYLE: 'sunny',
  AUTO: 'car',
  WEATHER: 'partly-sunny',
  CRIME: 'shield',
  JOBS: 'briefcase',
  AGRICULTURE: 'leaf',
  ENVIRONMENT: 'leaf',
  GOVERNMENT: 'business',
  VIRAL: 'flame',
  TRENDING: 'trending-up',
  OPINION: 'chatbubbles',
  'FACT_CHECK': 'checkmark-circle',
}

export default function CategoriesScreen({ navigation }: any) {
  const { colors: themeColors, isDark } = useTheme()
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setCategories(await categoryApi.tree())
    } catch {
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const open = (cat: CategoryItem) => navigation.navigate('CategoryNews', { categoryId: cat._id, title: cat.name.en })
  const openSub = (cat: CategoryItem, sub: CategoryItem) =>
    navigation.navigate('CategoryNews', { categoryId: cat._id, subCategoryId: sub._id, title: sub.name.en })

  const insets = useSafeAreaInsets()

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
          {navigation?.canGoBack?.() ? (
            <AppBackButton onPress={() => navigation.goBack()} size={34} style={{ marginRight: 8 }} />
          ) : null}
          <Text style={{ flex: 1, fontFamily: fonts.sans[700], fontSize: 16.5, color: themeColors.text }}>
            Categories
          </Text>
        </View>
      </View>
      <FlatList
        data={categories}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Pressable style={styles.cardMain} onPress={() => open(item)}>
              <View style={[styles.iconWrap, { backgroundColor: themeColors.primarySoft }]}>
                <Ionicons name={(CATEGORY_ICONS[item.slug.toUpperCase()] || 'newspaper') as any} size={20} color={themeColors.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: themeColors.text }]}>{item.name.en}</Text>
              {item.name.hi !== item.name.en ? <Text style={[styles.cardHindi, { color: themeColors.textMuted }]}>{item.name.hi}</Text> : null}
              <Text style={[styles.cardMeta, { color: themeColors.textMuted }]}>Explore</Text>
            </Pressable>
            {item.subCategories && item.subCategories.length > 0 ? (
              <View style={styles.subWrap}>
                {item.subCategories.slice(0, 3).map((sub) => (
                  <Pressable key={sub._id} style={[styles.subChip, { backgroundColor: themeColors.surfaceContainer }]} onPress={() => openSub(item, sub)}>
                    <Text style={[styles.subChipText, { color: themeColors.text }]} numberOfLines={1}>{sub.name.en}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={{ padding: spacing.lg }}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : error ? (
            <EmptyState title={error} />
          ) : (
            <EmptyState title="No categories" />
          )
        }
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingTop: 14 }]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  title: { fontFamily: fonts.serif[700], fontSize: 24, color: colors.text },
  subtitle: { fontFamily: fonts.inter[500], fontSize: 12, color: colors.secondary, marginTop: 2 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  column: { gap: spacing.md },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMain: { flex: 1 },
  subWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: spacing.sm },
  subChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill },
  subChipText: { fontFamily: fonts.inter[500], fontSize: 10 },
  cardTitle: { fontFamily: fonts.sans[700], fontSize: 14, color: colors.text, marginTop: spacing.sm },
  cardHindi: { fontFamily: fonts.devanagari[400], fontSize: 12, color: colors.secondary, marginTop: 2 },
  cardMeta: { fontFamily: fonts.inter[500], fontSize: 11, color: colors.secondary, marginTop: spacing.sm },
})
