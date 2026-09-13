import React, { useEffect, useState } from 'react'
import { Image, ScrollView, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ScaledText as Text } from '../../components/ScaledText'
import { reporterApi } from '../../api/endpoints'
import { ReporterProfile } from '../../types'
import { fonts, radius } from '../../theme'
import { LoadingView, ErrorState } from '../../components/States'
import { useTheme } from '../../context/ThemeContext'
import { mediaUrl } from '../../config'

export default function ReporterCardScreen() {
  const { colors, isDark } = useTheme()
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
  const avatarUri = user?.avatar ? mediaUrl(user.avatar) : undefined
  const designation = (card?.badge || 'LOCAL STRINGER').replace(/_/g, ' ')
  const isApproved = card?.approvalStatus === 'APPROVED'

  return (
    <ScrollView style={[styles.safe, { backgroundColor: colors.background }]} contentContainerStyle={styles.container}>
      {/* Lanyard Clip Slot Indicator */}
      <View style={styles.lanyardWrap}>
        <View style={styles.lanyardSlot} />
      </View>

      {/* Main Press Pass Card */}
      <View style={[styles.card, { backgroundColor: isDark ? '#14171F' : '#FFFFFF', borderColor: isDark ? '#262D3D' : '#E2E8F0' }]}>
        {/* Tricolor Accent Stripe */}
        <View style={styles.tricolorStripe}>
          <View style={[styles.tricolorSegment, { backgroundColor: '#FF9933' }]} />
          <View style={[styles.tricolorSegment, { backgroundColor: '#FFFFFF' }]} />
          <View style={[styles.tricolorSegment, { backgroundColor: '#138808' }]} />
        </View>

        {/* Card Header */}
        <View style={styles.cardHeader}>
          <Image
            source={require('../../../assets/aarambh_news_logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={styles.headerTitleWrap}>
            <Text style={styles.cardTypeTitle}>PRESS PASS</Text>
            <Text style={styles.cardTypeSubtitle}>ACCREDITED MEDIA CREDENTIAL</Text>
          </View>
        </View>

        {/* Golden Security Bar */}
        <View style={styles.securityBar}>
          <Ionicons name="shield-checkmark" size={13} color="#B45309" />
          <Text style={styles.securityBarText}>GOVERNMENT & POLICE MEDIA AUTHORIZATION</Text>
        </View>

        {/* Card Body: Photo & Credentials */}
        <View style={styles.cardBody}>
          <View style={styles.photoContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.photo} />
            ) : (
              <View style={[styles.photoFallback, { backgroundColor: colors.primary }]}>
                <Text style={styles.photoFallbackText}>{(user?.name || 'R').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={[styles.verifiedPill, { backgroundColor: isApproved ? '#059669' : '#D97706' }]}>
              <Ionicons name={isApproved ? "checkmark-circle" : "time"} size={10} color="#fff" />
              <Text style={styles.verifiedPillText}>{isApproved ? 'VERIFIED' : 'PENDING'}</Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <Text style={[styles.reporterName, { color: isDark ? '#FFFFFF' : '#0F172A' }]} numberOfLines={1}>
              {user?.name || 'Journalist Name'}
            </Text>

            <View style={styles.designationBadge}>
              <Text style={styles.designationText}>{designation}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>ID NO:</Text>
              <Text style={styles.metaValueHighlight}>{card?.reporterId || 'AAR/CM/2026/000001'}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>CONTACT:</Text>
              <Text style={[styles.metaValue, { color: isDark ? '#CBD5E1' : '#334155' }]} numberOfLines={1}>
                {user?.email || user?.phone || 'sahaniguddu74@gmail.com'}
              </Text>
            </View>
          </View>
        </View>

        {/* Assigned Areas & Beat */}
        <View style={[styles.jurisdictionBox, { backgroundColor: isDark ? '#1C2230' : '#F8FAFC', borderColor: isDark ? '#2D3748' : '#E2E8F0' }]}>
          <View style={styles.jurisdictionRow}>
            <Ionicons name="location-sharp" size={13} color={colors.primary} />
            <Text style={[styles.jurisdictionLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Assigned Region: </Text>
            <Text style={[styles.jurisdictionVal, { color: isDark ? '#E2E8F0' : '#1E293B' }]} numberOfLines={1}>
              {(card?.assignedLocations || []).map((l: any) => l.name?.en).join(', ') || 'Uttar Pradesh, Gorakhpur'}
            </Text>
          </View>

          <View style={styles.jurisdictionRow}>
            <Ionicons name="newspaper-outline" size={13} color={colors.primary} />
            <Text style={[styles.jurisdictionLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Beats: </Text>
            <Text style={[styles.jurisdictionVal, { color: isDark ? '#E2E8F0' : '#1E293B' }]} numberOfLines={1}>
              {(card?.assignedCategories || []).map((c: any) => c.name?.en).join(', ') || 'All categories'}
            </Text>
          </View>
        </View>

        {/* Digital Verification QR & Security Seal */}
        <View style={[styles.qrSection, { backgroundColor: isDark ? '#181F2E' : '#F8FAFC', borderTopColor: isDark ? '#262D3D' : '#E2E8F0' }]}>
          <View style={styles.qrLeft}>
            <Ionicons name="qr-code" size={32} color={isDark ? '#E2E8F0' : '#1E293B'} />
            <View>
              <Text style={[styles.qrTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>OFFICIAL VERIFICATION</Text>
              <Text style={[styles.qrSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                aarambh.news/verify/{card?.reporterId || 'CREDENTIAL'}
              </Text>
            </View>
          </View>
          <View style={styles.qrRightSeal}>
            <Ionicons name="ribbon" size={20} color="#D97706" />
            <Text style={styles.qrSealText}>GOVT RECOGNIZED</Text>
          </View>
        </View>

        {/* Card Footer: Simulated Security Stamp & Validity */}
        <View style={[styles.cardFooter, { borderTopColor: isDark ? '#262D3D' : '#E2E8F0' }]}>
          <View style={styles.validityCol}>
            <Text style={styles.validityLabel}>VALID PERIOD</Text>
            <Text style={styles.validityDates}>2026 — 2027</Text>
          </View>

          <View style={styles.watermarkBadge}>
            <Ionicons name="shield" size={14} color="#059669" />
            <Text style={styles.watermarkBadgeText}>EDITORIAL BOARD APPROVED</Text>
          </View>
        </View>

        {/* Legal Police / Law Enforcement Advisory */}
        <View style={styles.legalNoticeWrap}>
          <Text style={styles.legalNoticeText}>
            The holder of this credential is an accredited news correspondent of Aarambh News. Law enforcement and civil authorities are requested to extend full cooperation and assistance in newsgathering duties.
          </Text>
        </View>
      </View>

      <Text style={[styles.footerHint, { color: colors.textLight }]}>
        Official Digital Press Credential · Valid for field reporting and media events.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 16, alignItems: 'center', paddingBottom: 40 },
  lanyardWrap: {
    width: 60,
    height: 14,
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -2,
    zIndex: 2,
  },
  lanyardSlot: {
    width: 30,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  card: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  tricolorStripe: {
    flexDirection: 'row',
    height: 5,
    width: '100%',
  },
  tricolorSegment: { flex: 1, height: '100%' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  headerLogo: {
    width: 120,
    height: 38,
  },
  headerTitleWrap: { alignItems: 'flex-end' },
  cardTypeTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#DC2626',
    fontFamily: fonts.inter[700],
  },
  cardTypeSubtitle: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#64748B',
    marginTop: 1,
  },
  securityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  securityBarText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#92400E',
  },
  cardBody: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 14,
  },
  photoContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  photo: {
    width: 84,
    height: 96,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  photoFallback: {
    width: 84,
    height: 96,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFallbackText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
  },
  verifiedPill: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedPillText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  detailsContainer: {
    flex: 1,
  },
  reporterName: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: fonts.serif[700],
    lineHeight: 22,
  },
  designationBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 6,
  },
  designationText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  metaValueHighlight: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF5722',
    letterSpacing: 0.4,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  jurisdictionBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 5,
  },
  jurisdictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jurisdictionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  jurisdictionVal: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  qrSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  qrLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  qrTitle: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  qrSub: {
    fontSize: 9,
    marginTop: 1,
  },
  qrRightSeal: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingLeft: 8,
  },
  qrSealText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#D97706',
    letterSpacing: 0.4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  validityCol: {
    gap: 1,
  },
  validityLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  validityDates: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#059669',
  },
  watermarkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  watermarkBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.3,
  },
  legalNoticeWrap: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  legalNoticeText: {
    fontSize: 8,
    lineHeight: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  footerHint: {
    fontSize: 11,
    marginTop: 16,
    textAlign: 'center',
  },
})
