import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { ScaledText as Text } from '../../components/ScaledText'
import { reporterApi } from '../../api/endpoints'
import { ContentItem } from '../../types'
import { colors, fontFor } from '../../theme'
import { EmptyState, ErrorState, SkeletonCard } from '../../components/States'
import { usePagedFeed } from '../../hooks/usePagedFeed'
import { CategoryChip } from '../../components/NewsCard'
import { useTheme } from '../../context/ThemeContext'
import { mediaUrl } from '../../config'

const STATUSES = [
  { key: '', label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'PENDING_REVIEW', label: 'Pending' },
  { key: 'PUBLISHED', label: 'Published' },
  { key: 'REJECTED', label: 'Rejected' },
]

const statusColor: Record<string, string> = {
  DRAFT: colors.textMuted,
  PENDING_REVIEW: colors.warning,
  APPROVED: colors.textMuted,
  PUBLISHED: colors.success,
  REJECTED: colors.danger,
}

export default function MySubmissionsScreen({ navigation, route }: any) {
  const { colors } = useTheme()
  const [status, setStatus] = useState(route?.params?.initialStatus || '')

  useEffect(() => {
    if (route?.params?.initialStatus !== undefined) {
      setStatus(route?.params?.initialStatus)
    }
  }, [route?.params?.initialStatus])

  const load = useCallback(
    async (page: number) => {
      const res = await reporterApi.submissions({ page, limit: 20, ...(status ? { status } : {}) })
      return { data: res.data, pagination: res.pagination }
    },
    [status]
  )

  const feed = usePagedFeed({ load })

  return (
    <View style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Compact intro so reporters understand what this section is for */}
      <Text style={[styles.sectionDescription, { color: colors.textMuted }]}>
        View and manage all your submitted stories — drafts, pending reviews, published and rejected reports.
      </Text>

      {/* Fixed Clean Top Status Tabs */}
      <View style={[styles.filterBarContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBarContent}
        >
          {STATUSES.map((item) => {
            const isActive = status === item.key
            return (
              <Pressable
                key={item.key}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surfaceContainer,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setStatus(item.key)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    { color: isActive ? '#fff' : colors.textMuted, fontWeight: isActive ? '700' : '600' },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>

      <FlatList
        data={feed.items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.push('NewsDetail', { item })}
          >
            {/* Top Row: Category Tag & Status Badge */}
            <View style={styles.cardTopRow}>
              <View style={[styles.catBadge, { backgroundColor: colors.surfaceContainer }]}>
                <Text style={[styles.catBadgeText, { color: colors.textMuted }]}>
                  {item.category?.name?.en || item.contentType}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `${statusColor[item.status] || colors.textMuted}18`, borderColor: `${statusColor[item.status] || colors.textMuted}50` }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor[item.status] || colors.textMuted }]} />
                <Text style={[styles.badgeText, { color: statusColor[item.status] || colors.textMuted }]}>
                  {item.status.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>

            {/* Middle Row: Headline + Thumbnail Image */}
            <View style={styles.cardMiddleRow}>
              <Text
                style={[
                  styles.itemTitle,
                  {
                    color: colors.text,
                    fontFamily: fontFor(item.title, 700),
                    flex: 1,
                    marginRight: item.featuredImage?.url ? 12 : 0,
                  },
                ]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
              {item.featuredImage?.url ? (
                <Image
                  source={{ uri: mediaUrl(item.featuredImage.url) }}
                  style={styles.cardThumbnail}
                  contentFit="cover"
                  transition={200}
                />
              ) : null}
            </View>

            {/* Bottom Row: Metadata & Edit Button */}
            <View style={styles.cardBottomRow}>
              <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
                {new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                {item.metrics?.views ? (
                  <>
                    {' · '}
                    <Ionicons name="eye-outline" size={12} color={colors.highlightBlueLight} />
                    {` ${item.metrics.views}`}
                  </>
                ) : null}
              </Text>

              {item.status === 'DRAFT' || item.status === 'PENDING_REVIEW' || item.status === 'REJECTED' ? (
                <Pressable
                  style={[styles.editBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
                  onPress={(e) => {
                    e.stopPropagation()
                    navigation.navigate('SubmitNews', { item })
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="create-outline" size={14} color={colors.primary} />
                  <Text style={[styles.editBtnText, { color: colors.primary }]}>Edit</Text>
                </Pressable>
              ) : null}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          feed.loading ? (
            <SkeletonCard />
          ) : feed.error ? (
            <ErrorState message={feed.error} onRetry={feed.refresh} />
          ) : (
            <EmptyState title="No submissions" subtitle="Submit news from the Reporter tab" icon="📝" />
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
  filterBarContainer: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  sectionDescription: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    fontSize: 12.5,
    lineHeight: 18,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabText: {
    fontSize: 13,
  },
  itemCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  cardMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  cardThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
    paddingTop: 8,
  },
  itemMeta: {
    fontSize: 11.5,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  editBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
})
