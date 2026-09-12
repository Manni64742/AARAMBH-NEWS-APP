import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { ScaledText as Text } from '../../components/ScaledText'
import { reporterApi } from '../../api/endpoints'
import { ReporterProfile } from '../../types'
import { colors, fonts } from '../../theme'
import { LoadingView, ErrorState } from '../../components/States'
import { useTheme } from '../../context/ThemeContext'

export default function ReporterCardScreen() {
  const { colors } = useTheme()
  const [card, setCard] = useState<ReporterProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reporterApi
      .card()
      .then(setCard)
      .catch((e) => setError(e?.response?.data?.message || 'Could not load card'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingView />
  if (error) return <ErrorState message={error} onRetry={() => setError(null)} />

  const user = card?.userId as any

  return (
    <ScrollView style={[styles.safe, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 20 }}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardTop}>
          <Text style={[styles.brand, { color: colors.text }]}>Aarambh <Text style={styles.brandRed}>News</Text></Text>
          <Text style={[styles.cardType, { color: colors.textMuted }]}>PRESS CARD</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'R').charAt(0)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
            <Text style={styles.reporterId}>{card?.reporterId}</Text>
            <Text style={[styles.meta, { color: colors.textMuted }]}>{card?.badge?.replace(/_/g, ' ')}</Text>
            <Text style={[styles.meta, { color: colors.textMuted }]}>{user?.email || user?.phone}</Text>
          </View>
        </View>
        <View style={[styles.cardBottom, { borderTopColor: colors.border }]}>
          <Text style={[styles.small, { color: colors.textMuted }]}>Assigned: {(card?.assignedLocations || []).map((l: any) => l.name?.en).join(', ') || 'All locations'}</Text>
          <Text style={[styles.small, { color: colors.textMuted }]}>Categories: {(card?.assignedCategories || []).map((c: any) => c.name?.en).join(', ') || 'All categories'}</Text>
          <Text style={styles.status}>{card?.approvalStatus}</Text>
        </View>
      </View>
      <Text style={[styles.note, { color: colors.textLight }]}>Card is generated from your reporter profile on the newsroom platform. Print or screenshot this card.</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: colors.primary, paddingBottom: 8 },
  brand: { fontFamily: fonts.serif[700], fontSize: 17, color: colors.text },
  brandRed: { color: colors.primary },
  cardType: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 2 },
  cardBody: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '900' },
  info: { marginLeft: 14, flex: 1 },
  name: { fontFamily: fonts.serif[700], fontSize: 17, color: colors.text },
  reporterId: { fontSize: 13, color: colors.primary, fontWeight: '800', marginTop: 2 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  cardBottom: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  small: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  status: { fontSize: 11, fontWeight: '800', color: colors.success, textTransform: 'uppercase', marginTop: 4 },
  note: { fontSize: 12, color: colors.textLight, marginTop: 16, textAlign: 'center', lineHeight: 18 },
})
