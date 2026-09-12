import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { ScaledText as Text } from '../../components/ScaledText'
import { reporterApi } from '../../api/endpoints'
import { ReporterProfile } from '../../types'
import { colors, fonts } from '../../theme'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../api/client'
import { LoadingView, ErrorState } from '../../components/States'
import { useTheme } from '../../context/ThemeContext'

export default function ReporterProfileScreen() {
  const { success, error } = useToast()
  const { colors } = useTheme()
  const [profile, setProfile] = useState<ReporterProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ badge: 'LOCAL_STRINGER', idProofType: 'AADHAAR', idProofNumber: '' })
  const [mode, setMode] = useState<'view' | 'apply'>('view')

  const load = async () => {
    setLoading(true)
    try {
      const p = await reporterApi.profile()
      setProfile(p)
      setMode('view')
    } catch {
      setMode('apply')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const apply = async () => {
    if (!form.idProofNumber.trim()) {
      error('ID proof number is required')
      return
    }
    try {
      const p = await reporterApi.register({ badge: form.badge, idProofType: form.idProofType, idProofNumber: form.idProofNumber })
      setProfile(p)
      success('Application submitted')
      setMode('view')
    } catch (e) {
      error(errorMessage(e))
    }
  }

  if (loading) return <LoadingView />
  if (mode === 'apply')
    return (
      <ScrollView style={[styles.safe, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 20 }}>
        <Text style={[styles.title, { color: colors.text }]}>Become a Reporter</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>Submit your reporter application. Admin approval is required before you can submit news.</Text>
        <Text style={[styles.label, { color: colors.text }]}>Badge</Text>
        {['LOCAL_STRINGER', 'TRAINEE', 'STAFF_REPORTER', 'SENIOR_JOURNALIST'].map((b) => (
          <Pressable key={b} style={[styles.option, { backgroundColor: colors.card, borderColor: colors.border }, form.badge === b && [styles.optionActive, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]]} onPress={() => setForm({ ...form, badge: b })}>
            <Text style={[styles.optionText, { color: colors.text }, form.badge === b && { color: colors.primary }]}>{b.replace(/_/g, ' ')}</Text>
          </Pressable>
        ))}
        <Text style={[styles.label, { color: colors.text }]}>ID Proof Type</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={form.idProofType} onChangeText={(v) => setForm({ ...form, idProofType: v })} placeholder="AADHAAR / PAN" placeholderTextColor={colors.textLight} />
        <Text style={[styles.label, { color: colors.text }]}>ID Proof Number</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={form.idProofNumber} onChangeText={(v) => setForm({ ...form, idProofNumber: v })} placeholder="XXXX-XXXX-XXXX" placeholderTextColor={colors.textLight} />
        <Pressable style={styles.btn} onPress={apply}>
          <Text style={styles.btnText}>Submit Application</Text>
        </Pressable>
      </ScrollView>
    )

  if (!profile)
    return <ErrorState message="Could not load profile" onRetry={load} />

  return (
    <ScrollView style={[styles.safe, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 20 }}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(profile.userId?.name || 'R').charAt(0)}</Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{profile.userId?.name}</Text>
        <Text style={[styles.reporterId, { color: colors.textMuted }]}>{profile.reporterId}</Text>
        <View style={[styles.badge, { backgroundColor: profile.approvalStatus === 'APPROVED' ? colors.successSoft : profile.approvalStatus === 'REJECTED' ? colors.errorSoft : colors.warningSoft }]}>
          <Text style={[styles.badgeText, { color: profile.approvalStatus === 'APPROVED' ? colors.success : profile.approvalStatus === 'REJECTED' ? colors.danger : colors.warning }]}>
            {profile.approvalStatus}
          </Text>
        </View>
        <Text style={[styles.meta, { color: colors.textMuted }]}>Badge: {profile.badge.replace(/_/g, ' ')}</Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>Auto-publish: {profile.isAutoPublishAllowed ? 'Allowed' : 'Requires review'}</Text>
        {profile.rejectionReason ? <Text style={styles.reason}>Reason: {profile.rejectionReason}</Text> : null}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { fontFamily: fonts.serif[700], fontSize: 22, color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 6, lineHeight: 19 },
  label: { fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 18, marginBottom: 8 },
  option: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginBottom: 8, backgroundColor: colors.card },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  optionTextActive: { color: colors.primary },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: colors.text },
  btn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 20, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  name: { fontFamily: fonts.serif[700], fontSize: 18, color: colors.text, marginTop: 12 },
  reporterId: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 10 },
  badgeText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
  reason: { fontSize: 13, color: colors.danger, marginTop: 8, textAlign: 'center' },
})
