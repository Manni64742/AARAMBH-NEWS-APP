import React, { useCallback, useEffect, useState } from 'react'
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { reporterApi } from '../../api/endpoints'
import { ContentItem, ReporterProfile } from '../../types'
import { colors as defaultColors, fonts } from '../../theme'
import { LoadingView, ErrorState } from '../../components/States'
import { errorMessage } from '../../api/client'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { mediaUrl } from '../../config'

const statusColor: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: 'rgba(100, 116, 139, 0.12)', text: '#64748B', label: 'Draft' },
  PENDING_REVIEW: { bg: 'rgba(217, 119, 6, 0.12)', text: '#D97706', label: 'Pending Review' },
  APPROVED: { bg: 'rgba(13, 148, 136, 0.12)', text: '#0D9488', label: 'Approved' },
  PUBLISHED: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981', label: 'Published' },
  REJECTED: { bg: 'rgba(239, 68, 68, 0.12)', text: '#EF4444', label: 'Needs Revision' },
}

export default function ReporterDashboardScreen({ navigation }: any) {
  const { colors } = useTheme()
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [profile, setProfile] = useState<ReporterProfile | null>(null)
  const [recentStories, setRecentStories] = useState<ContentItem[]>([])
  const [sortBy, setSortBy] = useState<'latest' | 'views'>('latest')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true)
    setError(null)
    try {
      const [statsData, profData, submissionsData] = await Promise.all([
        reporterApi.stats().catch(() => null),
        reporterApi.profile().catch(() => null),
        reporterApi.submissions({ limit: 8, sort: sortBy }).catch(() => ({ data: [] })),
      ])
      setStats(statsData)
      setProfile(profData)
      setRecentStories(submissionsData?.data || [])
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [sortBy])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadData(true)
  }, [sortBy])

  if (loading && !refreshing) return <LoadingView />
  if (error && !stats) return <ErrorState message={error} onRetry={() => loadData()} />

  const metricCards = [
    {
      id: 'pending',
      label: 'Pending',
      value: stats?.pending ?? 0,
      icon: 'time-outline' as const,
      color: colors.primary,
      statusFilter: 'PENDING_REVIEW',
    },
    {
      id: 'published',
      label: 'Published',
      value: stats?.published ?? 0,
      icon: 'checkmark-done-circle-outline' as const,
      color: colors.success,
      statusFilter: 'PUBLISHED',
    },
    {
      id: 'drafts',
      label: 'Drafts',
      value: stats?.drafts ?? (stats?.total ? Math.max(0, (stats.total || 0) - ((stats.pending || 0) + (stats.published || 0) + (stats.rejected || 0))) : 0),
      icon: 'document-text-outline' as const,
      color: colors.highlightBlueLight,
      statusFilter: 'DRAFT',
    },
    {
      id: 'views',
      label: 'Total Views',
      value: (stats?.totalViews || 0).toLocaleString(),
      icon: 'eye-outline' as const,
      color: colors.highlightBlueLight,
      statusFilter: null,
    },
    {
      id: 'likes',
      label: 'Reader Likes',
      value: (stats?.totalLikes || 0).toLocaleString(),
      icon: 'heart-outline' as const,
      color: colors.primary,
      statusFilter: null,
    },
    {
      id: 'rejected',
      label: 'News Edits',
      value: stats?.rejected ?? 0,
      icon: 'create-outline' as const,
      color: colors.success,
      statusFilter: 'REJECTED',
    },
  ]

  const handleMetricPress = (statusFilter: string | null) => {
    if (statusFilter !== null) {
      navigation.navigate('MySubmissions', { initialStatus: statusFilter })
    }
  }

  return (
    <ScrollView
      style={[styles.safe, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      {/* Reporter Header Card */}
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatarWrap, { borderColor: colors.primary }]}>
            {user?.avatar ? (
              <Image source={{ uri: mediaUrl(user.avatar) }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="person" size={22} color={colors.primary} />
              </View>
            )}
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.reporterName, { color: colors.text }]} numberOfLines={1}>
                {user?.name || 'Journalist'}
              </Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <Text style={[styles.reporterId, { color: colors.textMuted }]} numberOfLines={1}>
              {profile?.reporterId || 'PRESS ID: PENDING'} · {profile?.badge?.replace(/_/g, ' ') || 'REPORTER'}
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('SubmitNews')}
        >
          <Ionicons name="create-outline" size={16} color="#fff" />
          <Text style={styles.createBtnText}>Write</Text>
        </Pressable>
      </View>

      {/* Analytics Overview Section Header (Title on Row 1, Subtitle on Row 2) */}
      <View style={styles.analyticsHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="stats-chart" size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Performance Analytics</Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          Tap status cards to filter stories
        </Text>
      </View>

      {/* Interactive Metric Cards Grid */}
      <View style={styles.grid}>
        {metricCards.map((m) => (
          <Pressable
            key={m.id}
            style={[
              styles.metricCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              m.statusFilter && styles.metricCardClickable,
            ]}
            onPress={() => handleMetricPress(m.statusFilter)}
            disabled={!m.statusFilter}
          >
            <Ionicons name={m.icon} size={16} color={m.color} style={styles.metricIcon} />
            <Text style={[styles.metricValue, { color: colors.text }]}>{m.value}</Text>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]} numberOfLines={1}>
              {m.label}
            </Text>
            {m.statusFilter ? (
              <View style={styles.clickHint}>
                <Ionicons name="arrow-forward" size={11} color={colors.textLight} />
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>

      {/* Recent Stories Section (Row 1: Title & View All, Row 2: Filter Pills) */}
      <View style={{ marginTop: 26, marginBottom: 12 }}>
        <View style={styles.recentStoriesHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="newspaper-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Stories</Text>
          </View>

          <Pressable
            onPress={() => navigation.navigate('MySubmissions')}
            style={styles.viewAllBtn}
            hitSlop={8}
          >
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </Pressable>
        </View>

        {/* Clean Filter Pills on their own dedicated row */}
        <View style={styles.sortPillsRow}>
          <Pressable
            style={[
              styles.sortPillBtn,
              {
                backgroundColor: sortBy === 'latest' ? colors.primary : colors.surfaceContainer,
                borderColor: sortBy === 'latest' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSortBy('latest')}
          >
            <Text style={[styles.sortPillBtnText, { color: sortBy === 'latest' ? '#fff' : colors.textMuted }]}>
              Latest First
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.sortPillBtn,
              {
                backgroundColor: sortBy === 'views' ? colors.primary : colors.surfaceContainer,
                borderColor: sortBy === 'views' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSortBy('views')}
          >
            <Text style={[styles.sortPillBtnText, { color: sortBy === 'views' ? '#fff' : colors.textMuted }]}>
              Top Views
            </Text>
          </Pressable>
        </View>
      </View>

      {recentStories.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="document-text-outline" size={44} color={colors.textLight} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No stories submitted yet</Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>
            Your published stories, reviews, and drafts will appear here with live engagement stats.
          </Text>
          <Pressable
            style={[styles.createFirstBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('SubmitNews')}
          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.createFirstBtnText}>Create Your First Article</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.storyList}>
          {recentStories.map((story) => {
            const sc = statusColor[story.status] || { bg: 'rgba(0,0,0,0.06)', text: colors.textMuted, label: story.status }
            const catName = typeof story.category === 'object' && story.category !== null ? (story.category as any).name?.en || (story.category as any).name?.hi : 'General'
            const formattedDate = new Date(story.updatedAt || story.createdAt || Date.now()).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })

            return (
              <Pressable
                key={story._id}
                style={[styles.storyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.push('NewsDetail', { item: story })}
              >
                {/* Thumbnail (Compact: 60x60) */}
                {story.featuredImage?.url ? (
                  <Image source={{ uri: mediaUrl(story.featuredImage.url) }} style={styles.storyThumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.storyThumbEmpty, { backgroundColor: colors.surfaceContainer }]}>
                    <Ionicons name="newspaper-outline" size={20} color={colors.textLight} />
                  </View>
                )}

                {/* Story Info */}
                <View style={styles.storyContent}>
                  <View style={styles.storyHeaderRow}>
                    <View style={[styles.storyCatBadge, { backgroundColor: colors.surfaceContainer }]}>
                      <Text style={[styles.storyCatText, { color: colors.textMuted }]} numberOfLines={1}>
                        {catName}
                      </Text>
                    </View>
                    <View style={[styles.storyStatusBadge, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.storyStatusText, { color: sc.text }]}>{sc.label}</Text>
                    </View>
                  </View>

                  <Text style={[styles.storyHeadline, { color: colors.text }]} numberOfLines={2}>
                    {story.title}
                  </Text>

                  {/* Story Meta Footer */}
                  <View style={styles.storyFooter}>
                    <View style={styles.storyStats}>
                      <View style={styles.statItem}>
                        <Ionicons name="eye-outline" size={12} color={colors.textLight} />
                        <Text style={[styles.statText, { color: colors.textMuted }]}>{story.viewsCount ?? story.metrics?.views ?? 0}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="heart-outline" size={12} color={colors.textLight} />
                        <Text style={[styles.statText, { color: colors.textMuted }]}>{story.likesCount ?? story.metrics?.likes ?? 0}</Text>
                      </View>
                      <Text style={[styles.statDate, { color: colors.textLight }]}>· {formattedDate}</Text>
                    </View>

                    <Pressable
                      style={[styles.quickEditBtn, { backgroundColor: colors.primarySoft }]}
                      onPress={(e) => {
                        e.stopPropagation()
                        navigation.navigate('SubmitNews', { item: story })
                      }}
                      hitSlop={6}
                    >
                      <Ionicons name="pencil" size={12} color={colors.primary} />
                      <Text style={[styles.quickEditText, { color: colors.primary }]}>Edit</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            )
          })}
        </View>
      )}

      {/* Aarambh Editorial Workflow Stepper */}
      <View style={[styles.workflowCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
        <View style={styles.workflowHeader}>
          <View style={[styles.workflowBadge, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
            <Text style={[styles.workflowBadgeText, { color: colors.primary }]}>AARAMBH EDITORIAL WORKFLOW</Text>
          </View>
          <Text style={[styles.workflowTitle, { color: colors.text }]}>How Your Stories Reach Millions</Text>
          <Text style={[styles.workflowSub, { color: colors.textMuted }]}>
            From field reporting to verified digital publication across India
          </Text>
        </View>

        <View style={styles.workflowSteps}>
          {/* Step 1 */}
          <View style={styles.stepRow}>
            <View style={styles.stepLeft}>
              <View style={[styles.stepNumberCircle, { backgroundColor: '#3B82F6' }]}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepTitleRow}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>Draft & Ground Verify</Text>
                <View style={[styles.stepMiniTag, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Text style={[styles.stepMiniTagText, { color: '#3B82F6' }]}>Authoring</Text>
                </View>
              </View>
              <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
                Compose fact-checked news with headline, story blocks, authentic photos, and coverage tags.
              </Text>
            </View>
          </View>

          {/* Step 2 */}
          <View style={styles.stepRow}>
            <View style={styles.stepLeft}>
              <View style={[styles.stepNumberCircle, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepTitleRow}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>Desk Moderation & Safety</Text>
                <View style={[styles.stepMiniTag, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Text style={[styles.stepMiniTagText, { color: '#F59E0B' }]}>Review</Text>
                </View>
              </View>
              <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
                The editorial desk reviews submissions for journalistic accuracy, community guidelines, and ethical standards.
              </Text>
            </View>
          </View>

          {/* Step 3 */}
          <View style={styles.stepRow}>
            <View style={styles.stepLeft}>
              <View style={[styles.stepNumberCircle, { backgroundColor: '#10B981' }]}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepTitleRow}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>Go Live & Real-Time Impact</Text>
                <View style={[styles.stepMiniTag, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Text style={[styles.stepMiniTagText, { color: '#10B981' }]}>Live Broadcast</Text>
                </View>
              </View>
              <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
                Approved stories publish immediately across Aarambh Mobile App & Web Admin with live readership tracking.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: defaultColors.bg },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    overflow: 'hidden',
    marginRight: 10,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reporterName: {
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#10B981',
  },
  reporterId: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  analyticsHeader: {
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 3,
    marginLeft: 24,
  },
  recentStoriesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sortPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortPillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  sortPillBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    width: '31.3%',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    position: 'relative',
  },
  metricCardClickable: {
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  metricIcon: {
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 1,
    textAlign: 'center',
  },
  clickHint: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  emptyCard: {
    padding: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
    marginBottom: 16,
  },
  createFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  createFirstBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  storyList: {
    gap: 10,
  },
  storyCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 12,
    alignItems: 'center',
  },
  storyThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  storyThumbEmpty: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyContent: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 76,
  },
  storyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  storyCatBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 100,
  },
  storyCatText: {
    fontSize: 10,
    fontWeight: '700',
  },
  storyStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  storyStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  storyHeadline: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 6,
  },
  storyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statDate: {
    fontSize: 11,
  },
  quickEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  quickEditText: {
    fontSize: 11,
    fontWeight: '800',
  },
  workflowCard: {
    marginTop: 22,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  workflowHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  workflowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  workflowBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  workflowTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  workflowSub: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  workflowSteps: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepLeft: {
    alignItems: 'center',
    width: 28,
    marginRight: 12,
  },
  stepNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  stepLine: {
    width: 2,
    height: 48,
    marginVertical: 4,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 16,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  stepMiniTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stepMiniTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  stepDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },
})

