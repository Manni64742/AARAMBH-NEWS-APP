import React, { useCallback, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ScaledText as Text } from '../../components/ScaledText'
import { reporterApi } from '../../api/endpoints'
import { ContentItem } from '../../types'
import { colors, fontFor } from '../../theme'
import { EmptyState, ErrorState, SkeletonCard } from '../../components/States'
import { usePagedFeed } from '../../hooks/usePagedFeed'
import { CategoryChip } from '../../components/NewsCard'
import { useTheme } from '../../context/ThemeContext'

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

export default function MySubmissionsScreen({ navigation }: any) {
  const { colors } = useTheme()
  const [status, setStatus] = useState('')

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
      <FlatList
        horizontal
        style={styles.statusList}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
        data={STATUSES}
        keyExtractor={(s) => s.key}
        renderItem={({ item }) => (
          <CategoryChip label={item.label} active={status === item.key} onPress={() => setStatus(item.key)} />
        )}
      />
      <FlatList
        data={feed.items}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={[styles.itemRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable style={styles.itemBody} onPress={() => navigation.push('NewsDetail', { item })}>
              <Text style={[styles.itemTitle, { color: colors.text, fontFamily: fontFor(item.title, 700) }]} numberOfLines={2}>{item.title}</Text>
              <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
                {item.contentType} · {item.category?.name?.en || '—'} · {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </Pressable>
            {item.status === 'DRAFT' || item.status === 'PENDING_REVIEW' || item.status === 'REJECTED' ? (
              <Pressable style={[styles.editBtn, { borderColor: colors.primary }]} onPress={() => navigation.navigate('SubmitNews', { item })} hitSlop={6}>
                <Ionicons name="create-outline" size={16} color={colors.primary} />
              </Pressable>
            ) : null}
            <View style={[styles.badge, { backgroundColor: `${statusColor[item.status]}20` }]}>
              <Text style={[styles.badgeText, { color: statusColor[item.status] }]}>{item.status.replace(/_/g, ' ')}</Text>
            </View>
          </View>
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
  statusList: { flexGrow: 0 },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 10 },
  itemBody: { flex: 1, paddingRight: 6 },
  editBtn: { borderWidth: 1, borderRadius: 8, padding: 8 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: colors.text, lineHeight: 19 },
  itemMeta: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
})
