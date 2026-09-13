import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { notificationApi } from '../api/endpoints'
import { NotificationItem } from '../types'
import { colors } from '../theme'
import { EmptyState, ErrorState, SkeletonCard } from '../components/States'
import { usePagedFeed } from '../hooks/usePagedFeed'
import { useAuth } from '../context/AuthContext'
import { ScaledText as Text } from '../components/ScaledText'
import { useTheme } from '../context/ThemeContext'

const iconFor: Record<string, string> = {
  BREAKING: '🔥',
  LOCAL_NEWS: '📍',
  CATEGORY: '🗂️',
  REPORTER: '📰',
  LOCATION: '📍',
  TRENDING: '📈',
  SYSTEM: '🔔',
  REPORTER_STATUS: '🪪',
}

import { markAllNotificationsSeen } from '../services/notificationService'

export default function NotificationsScreen({ navigation }: any) {
  const { colors: themeColors } = useTheme()
  const { user } = useAuth()
  const load = useCallback(async (page: number) => {
    try {
      const res = user
        ? await notificationApi.list(page, 20)
        : await notificationApi.publicList(page, 20)
      return { data: res.data || [], pagination: res.pagination }
    } catch {
      return { data: [], pagination: undefined }
    }
  }, [user])
  const feed = usePagedFeed<NotificationItem>({ load })

  useEffect(() => {
    markAllNotificationsSeen().catch(() => {})
    if (user) notificationApi.markAllRead().catch(() => {})
  }, [user])

  const open = async (item: NotificationItem) => {
    if (user) await notificationApi.markRead(item._id).catch(() => {})
    if (item.contentId) navigation.push('NewsDetailById', { id: item.contentId })
  }

  const topPadding = 12

  return (
    <View style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <FlatList
        data={feed.items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingTop: topPadding, paddingBottom: 40 }}
        scrollIndicatorInsets={{ top: topPadding }}
        refreshControl={
          <RefreshControl
            refreshing={feed.refreshing}
            onRefresh={feed.refresh}
            colors={[colors.primary]}
            progressViewOffset={topPadding}
          />
        }
        renderItem={({ item }) => (
          <Pressable style={[styles.item, { backgroundColor: themeColors.card, borderColor: themeColors.border }, !item.read && { backgroundColor: themeColors.primarySoft, borderColor: themeColors.primarySoftBorder }]} onPress={() => open(item)}>
            <Text style={styles.icon}>{iconFor[item.type] || '🔔'}</Text>
            <View style={styles.body}>
              <Text style={[styles.title, { color: themeColors.text }]}>{item.title}</Text>
              {item.body ? <Text style={[styles.text, { color: themeColors.textMuted }]}>{item.body}</Text> : null}
              <Text style={[styles.time, { color: themeColors.textLight }]}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          feed.loading ? (
            <SkeletonCard />
          ) : feed.error ? (
            <ErrorState message={feed.error} onRetry={feed.refresh} />
          ) : (
            <EmptyState title="No notifications" subtitle="Breaking news and updates will appear here" icon="🔕" />
          )
        }
        onEndReached={feed.loadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  item: { flexDirection: 'row', padding: 14, backgroundColor: colors.card, marginHorizontal: 12, marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  unread: { backgroundColor: colors.warningSoft, borderColor: colors.primarySoftBorder },
  icon: { fontSize: 22, marginRight: 12 },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: colors.text },
  text: { fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  time: { fontSize: 11, color: colors.textLight, marginTop: 6 },
})
