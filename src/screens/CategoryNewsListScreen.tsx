import React, { useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { BundleNewsItem, bundleItemToContentItem, getLocalizedTag, isOrangeTag } from '../types/bundles'
import { fonts, radius, spacing } from '../theme'
import { ScaledText as Text } from '../components/ScaledText'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'

export default function CategoryNewsListScreen({ route, navigation }: any) {
  const { colors: tc, isDark } = useTheme()
  const { language } = useLanguage()
  const insets = useSafeAreaInsets()

  const { title = 'News', items = [] as BundleNewsItem[], sectionTitle } = route.params || {}
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 600)
  }

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
              {items.length} {language === 'hi' ? 'खबरें' : 'articles'}
            </Text>
          </View>
        </View>
      </View>

      {/* Articles List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[tc.primary]}
            tintColor={tc.primary}
          />
        }
        renderItem={({ item }) => {
          const isOrange = isOrangeTag(item.tag)
          return (
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
          )
        }}
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
