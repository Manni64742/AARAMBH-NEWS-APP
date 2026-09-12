import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { ScaledText as Text } from '../../components/ScaledText'
import { reporterApi } from '../../api/endpoints'
import { colors, fonts } from '../../theme'
import { LoadingView, ErrorState } from '../../components/States'
import { errorMessage } from '../../api/client'
import { useTheme } from '../../context/ThemeContext'

export default function ReporterDashboardScreen() {
  const { colors } = useTheme()
  const [stats, setStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setStats(await reporterApi.stats())
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) return <LoadingView />
  if (error) return <ErrorState message={error} onRetry={load} />

  const cards = [
    { label: 'Total Submitted', value: stats?.total, color: colors.text },
    { label: 'Pending Review', value: stats?.pending, color: colors.warning },
    { label: 'Approved', value: stats?.approved, color: colors.textMuted },
    { label: 'Published', value: stats?.published, color: colors.success },
    { label: 'Rejected', value: stats?.rejected, color: colors.danger },
    { label: 'Total Views', value: stats?.totalViews?.toLocaleString(), color: colors.primary },
  ]

  return (
    <ScrollView style={[styles.safe, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 16 }}>
      <Text style={[styles.title, { color: colors.text }]}>News Analytics</Text>
      <View style={styles.grid}>
        {cards.map((c) => (
          <View key={c.label} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.value, { color: c.color }]}>{c.value ?? 0}</Text>
            <Text style={[styles.label, { color: colors.textMuted }]}>{c.label}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.note, { backgroundColor: colors.surfaceContainer }]}>
        <Text style={[styles.noteText, { color: colors.textMuted }]}>
          Submission flow: Draft → Submit → Pending Review → Admin Approval → Published. Status updates appear in My
          Submissions.
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { fontFamily: fonts.serif[700], fontSize: 20, color: colors.text, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '31%', backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14, alignItems: 'center' },
  value: { fontSize: 22, fontWeight: '900' },
  label: { fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  note: { marginTop: 18, backgroundColor: colors.surfaceContainer, borderRadius: 12, padding: 14 },
  noteText: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
})
