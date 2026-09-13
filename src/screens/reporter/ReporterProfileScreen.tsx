import React, { useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { ScaledText as Text } from '../../components/ScaledText'
import { reporterApi } from '../../api/endpoints'
import { ReporterProfile } from '../../types'
import { fonts } from '../../theme'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../api/client'
import { LoadingView, ErrorState } from '../../components/States'
import { useTheme } from '../../context/ThemeContext'
import { mediaUrl } from '../../config'

export default function ReporterProfileScreen({ navigation }: any) {
  const { success, error } = useToast()
  const { colors, isDark } = useTheme()
  const [profile, setProfile] = useState<ReporterProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [form, setForm] = useState({ badge: 'LOCAL_STRINGER', idProofType: 'AADHAAR', idProofNumber: '' })
  const [mode, setMode] = useState<'view' | 'apply'>('view')

  const load = async () => {
    try {
      const p = await reporterApi.profile()
      setProfile(p)
      setMode('view')
    } catch {
      setMode('apply')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    load()
  }

  const apply = async () => {
    if (!form.idProofNumber.trim()) {
      error('ID proof number is required')
      return
    }
    try {
      const p = await reporterApi.register({ badge: form.badge, idProofType: form.idProofType, idProofNumber: form.idProofNumber })
      setProfile(p)
      success('Application submitted successfully')
      setMode('view')
    } catch (e) {
      error(errorMessage(e))
    }
  }

  if (loading) return <LoadingView />

  if (mode === 'apply') {
    return (
      <ScrollView
        style={[styles.safe, { backgroundColor: colors.background }]}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      >
        <View style={styles.applyHeader}>
          <View style={[styles.applyBadge, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="newspaper" size={14} color={colors.primary} />
            <Text style={[styles.applyBadgeText, { color: colors.primary }]}>ACCREDITATION</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Apply for Press Accreditation</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            Join Aarambh News verified correspondent network. Admin approval is required before you can publish stories.
          </Text>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Accreditation Designation</Text>
        {[
          { key: 'LOCAL_STRINGER', title: 'Local Stringer', desc: 'Field correspondent for local & district news' },
          { key: 'TRAINEE', title: 'Trainee Journalist', desc: 'Junior reporting under senior desk supervision' },
          { key: 'STAFF_REPORTER', title: 'Staff Reporter', desc: 'Full-time field news gathering correspondent' },
          { key: 'SENIOR_JOURNALIST', title: 'Senior Journalist', desc: 'Senior editorial & investigative coverage' },
        ].map((b) => (
          <Pressable
            key={b.key}
            style={[
              styles.option,
              { backgroundColor: colors.card, borderColor: colors.border },
              form.badge === b.key && [styles.optionActive, { backgroundColor: colors.primarySoft, borderColor: colors.primary }],
            ]}
            onPress={() => setForm({ ...form, badge: b.key })}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionTitle, { color: colors.text }, form.badge === b.key && { color: colors.primary }]}>
                {b.title}
              </Text>
              <Text style={[styles.optionDesc, { color: colors.textMuted }]}>{b.desc}</Text>
            </View>
            <Ionicons
              name={form.badge === b.key ? 'radio-button-on' : 'radio-button-off'}
              size={18}
              color={form.badge === b.key ? colors.primary : colors.textLight}
            />
          </Pressable>
        ))}

        <Text style={[styles.label, { color: colors.text }]}>Identity Verification Document</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={form.idProofType}
          onChangeText={(v) => setForm({ ...form, idProofType: v })}
          placeholder="Document Type (e.g. AADHAAR, PAN, VOTER ID)"
          placeholderTextColor={colors.textLight}
        />

        <Text style={[styles.label, { color: colors.text }]}>Document Identification Number</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={form.idProofNumber}
          onChangeText={(v) => setForm({ ...form, idProofNumber: v })}
          placeholder="e.g. 5432-XXXX-XXXX"
          placeholderTextColor={colors.textLight}
        />

        <Pressable style={[styles.btn, { backgroundColor: colors.primary }]} onPress={apply}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>Submit Credential Application</Text>
        </Pressable>
      </ScrollView>
    )
  }

  if (!profile) return <ErrorState message="Could not load profile" onRetry={load} />

  const user = profile.userId as any
  const isApproved = profile.approvalStatus === 'APPROVED'
  const isPending = profile.approvalStatus === 'PENDING'
  const isRejected = profile.approvalStatus === 'REJECTED'
  const avatarUri = user?.avatar ? mediaUrl(user.avatar) : undefined
  const designation = (profile.badge || 'LOCAL STRINGER').replace(/_/g, ' ')

  return (
    <ScrollView
      style={[styles.safe, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Top Banner Card */}
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Tricolor Header Banner */}
        <View style={styles.tricolor}>
          <View style={{ flex: 1, backgroundColor: '#FF9933' }} />
          <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
          <View style={{ flex: 1, backgroundColor: '#138808' }} />
        </View>

        <View style={styles.cardHeaderContent}>
          {/* Avatar with Verified Ring */}
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarFallbackText}>{(user?.name || 'R').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={[styles.statusMiniDot, { backgroundColor: isApproved ? '#10B981' : isPending ? '#F59E0B' : '#EF4444' }]} />
          </View>

          {/* Name & Title */}
          <View style={styles.nameSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || 'Aarambh Journalist'}</Text>
              {isApproved && <Ionicons name="checkmark-circle" size={17} color="#2563EB" />}
            </View>
            <View style={[styles.designationPill, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.designationText, { color: colors.primary }]}>{designation}</Text>
            </View>
            <Text style={[styles.reporterIdText, { color: colors.textMuted }]}>
              ID: <Text style={{ color: colors.primary, fontWeight: '800' }}>{profile.reporterId}</Text>
            </Text>
          </View>
        </View>

        {/* Status Callout Banner */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: isApproved
                ? 'rgba(16, 185, 129, 0.12)'
                : isPending
                ? 'rgba(245, 158, 11, 0.12)'
                : 'rgba(239, 68, 68, 0.12)',
              borderColor: isApproved ? '#10B98150' : isPending ? '#F59E0B50' : '#EF444450',
            },
          ]}
        >
          <Ionicons
            name={isApproved ? 'shield-checkmark' : isPending ? 'time' : 'alert-circle'}
            size={18}
            color={isApproved ? '#10B981' : isPending ? '#F59E0B' : '#EF4444'}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.statusBannerTitle,
                { color: isApproved ? '#059669' : isPending ? '#D97706' : '#DC2626' },
              ]}
            >
              {isApproved ? 'Accredited & Verified Journalist' : isPending ? 'Accreditation Under Editorial Review' : 'Accreditation Rejected'}
            </Text>
            <Text style={[styles.statusBannerSub, { color: colors.textMuted }]}>
              {isApproved
                ? 'Your press credentials have been verified by the editorial desk.'
                : isPending
                ? 'Your application is being evaluated by desk editors. You will be notified upon approval.'
                : profile.rejectionReason || 'Please review your application details.'}
            </Text>
          </View>
        </View>
      </View>

      {/* Accreditation Details Card */}
      <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Credential Details</Text>

        <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
          <View style={styles.detailRowLeft}>
            <Ionicons name="mail-outline" size={16} color={colors.primary} />
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Email Contact</Text>
          </View>
          <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
            {user?.email || 'N/A'}
          </Text>
        </View>

        <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
          <View style={styles.detailRowLeft}>
            <Ionicons name="call-outline" size={16} color={colors.primary} />
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Phone Number</Text>
          </View>
          <Text style={[styles.detailValue, { color: colors.text }]}>{user?.phone || 'N/A'}</Text>
        </View>

        <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
          <View style={styles.detailRowLeft}>
            <Ionicons name="card-outline" size={16} color={colors.primary} />
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>ID Verification</Text>
          </View>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {profile.idProofType} ({profile.idProofNumber ? `••••${profile.idProofNumber.slice(-4)}` : 'Verified'})
          </Text>
        </View>

        <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
          <View style={styles.detailRowLeft}>
            <Ionicons name="flash-outline" size={16} color={colors.primary} />
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Publishing Rights</Text>
          </View>
          <Text style={[styles.detailValue, { color: isApproved ? '#059669' : colors.textMuted }]}>
            {profile.isAutoPublishAllowed ? 'Instant Publish ✓' : 'Editorial Desk Moderated'}
          </Text>
        </View>

        <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
          <View style={styles.detailRowLeft}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Assigned Region</Text>
          </View>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {(profile.assignedLocations || []).map((l: any) => l.name?.en).join(', ') || 'All India'}
          </Text>
        </View>
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.actionsBox}>
        <Pressable
          style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('ReporterCard')}
        >
          <Ionicons name="id-card-outline" size={18} color="#fff" />
          <Text style={styles.primaryActionBtnText}>View Digital Press Pass Card</Text>
        </Pressable>

        <View style={styles.secondaryRow}>
          <Pressable
            style={[styles.secondaryActionBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}
            onPress={() => navigation.navigate('SubmitNews')}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={[styles.secondaryActionBtnText, { color: colors.text }]}>Write News</Text>
          </Pressable>

          <Pressable
            style={[styles.secondaryActionBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}
            onPress={() => navigation.navigate('MySubmissions')}
          >
            <Ionicons name="newspaper-outline" size={16} color={colors.primary} />
            <Text style={[styles.secondaryActionBtnText, { color: colors.text }]}>My Submissions</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  applyHeader: { marginBottom: 18 },
  applyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  applyBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  title: { fontFamily: fonts.serif[700], fontSize: 22 },
  sub: { fontSize: 13, marginTop: 6, lineHeight: 19 },
  label: { fontSize: 13, fontWeight: '800', marginTop: 18, marginBottom: 8 },
  option: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionActive: { borderWidth: 1.5 },
  optionTitle: { fontSize: 14, fontWeight: '700' },
  optionDesc: { fontSize: 11.5, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    marginBottom: 6,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 22,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tricolor: {
    flexDirection: 'row',
    height: 5,
    width: '100%',
  },
  cardHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  avatarFallback: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
  },
  statusMiniDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  nameSection: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: fonts.serif[700],
  },
  designationPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 4,
  },
  designationText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  reporterIdText: {
    fontSize: 12,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 14,
    marginBottom: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBannerTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  statusBannerSub: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  detailsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 12.5,
  },
  detailValue: {
    fontSize: 12.5,
    fontWeight: '700',
    maxWidth: '55%',
    textAlign: 'right',
  },
  actionsBox: {
    gap: 10,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  primaryActionBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
})
