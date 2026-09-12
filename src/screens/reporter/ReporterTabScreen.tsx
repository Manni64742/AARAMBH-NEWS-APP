import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { ScaledText as Text } from '../../components/ScaledText'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { reporterApi } from '../../api/endpoints'
import { ReporterProfile } from '../../types'
import { colors, fonts } from '../../theme'
import { useToast } from '../../context/ToastContext'
import { useTheme } from '../../context/ThemeContext'

export default function ReporterTabScreen({ navigation }: any) {
  const { error } = useToast()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const [profile, setProfile] = useState<ReporterProfile | null>(null)
  const [stats, setStats] = useState<any>(null)

  const load = async () => {
    try {
      const [p, s] = await Promise.all([reporterApi.profile(), reporterApi.stats()])
      setProfile(p)
      setStats(s)
    } catch (e) {
      error('Reporter profile not found — apply first')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const actions = [
    { icon: 'create-outline', label: 'Create Article', route: 'SubmitNews' },
    { icon: 'file-tray-outline', label: 'My Submissions', route: 'MySubmissions' },
    { icon: 'card-outline', label: 'eKYC', route: 'Ekyc' },
    { icon: 'card-outline', label: 'Press Card', route: 'ReporterCard' },
    { icon: 'person-outline', label: 'Profile', route: 'ReporterProfileScreen' },
    { icon: 'speedometer-outline', label: 'Dashboard', route: 'ReporterDashboard' },
  ]

  return (
    <View style={[styles.safe, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Reporter</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {profile ? `${profile.reporterId} · ${profile.badge.replace(/_/g, ' ')}` : 'Apply to become a reporter'}
          </Text>
        </View>

        {profile && profile.approvalStatus === 'APPROVED' ? (
          <View style={styles.statsRow}>
            <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats?.total || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Submitted</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.success }]}>{stats?.published || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Published</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.warning }]}>{stats?.pending || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Pending</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.danger }]}>{stats?.rejected || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Rejected</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.notice, { backgroundColor: colors.warningSoft, borderColor: colors.primarySoftBorder }]}>
            <Ionicons name="information-circle" size={18} color={colors.warning} />
            <Text style={[styles.noticeText, { color: colors.text }]}>
              {profile?.approvalStatus === 'PENDING'
                ? 'Your reporter application is pending review. You will be notified once approved.'
                : profile?.approvalStatus === 'REJECTED'
                ? `Application rejected: ${profile.rejectionReason || 'contact admin'}`
                : 'Create a reporter profile to submit news.'}
            </Text>
          </View>
        )}

        <View style={styles.grid}>
          {actions.map((a) => (
            <Pressable key={a.label} style={styles.actionCard} onPress={() => navigation.navigate(a.route)}>
              <Ionicons name={a.icon as any} size={26} color={colors.primary} />
              <Text style={[styles.actionLabel, { color: colors.textMuted }]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 10 },
  title: { fontFamily: fonts.serif[700], fontSize: 22, color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 14 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', paddingVertical: 12 },
  statValue: { fontSize: 20, fontWeight: '900', color: colors.text },
  statLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2, textTransform: 'uppercase', fontWeight: '700' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 14, backgroundColor: colors.warningSoft, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.primarySoftBorder },
  noticeText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: 14 },
  actionCard: { width: '33.3%', alignItems: 'center', paddingVertical: 16 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginTop: 8 },
})
