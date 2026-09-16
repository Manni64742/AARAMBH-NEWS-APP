import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import Slider from '@react-native-community/slider'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { useLocation } from '../context/LocationContext'
import { interactionApi, notificationApi, reporterApi, userApi } from '../api/endpoints'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { colors, fonts, fontFor } from '../theme'
import { mediaUrl } from '../config'
import { ScaledText as Text } from '../components/ScaledText'

export default function ProfileScreen({ navigation }: any) {
  const { user, isReporter, logout } = useAuth()
  const { language } = useLanguage()
  const { current: location } = useLocation()
  const { colors, fontMode, setFontMode, isDark, toggleTheme } = useTheme()
  const insets = useSafeAreaInsets()
  const [activity, setActivity] = useState({ read: 0, bookmarks: 0, favorites: 0, likes: 0, views: 0, notifications: 0 })
  const [reporterStats, setReporterStats] = useState<any>(null)
  const [reporterProfile, setReporterProfile] = useState<any>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      userApi.history(1, 1),
      interactionApi.list('BOOKMARK', 1, 1),
      interactionApi.list('FAVORITE', 1, 1),
      interactionApi.list('LIKE', 1, 1),
      interactionApi.list('VIEW', 1, 1),
      notificationApi.list(1, 1),
      isReporter ? reporterApi.stats() : Promise.resolve(null),
      isReporter ? reporterApi.profile().catch(() => null) : Promise.resolve(null),
    ]).then(([history, bookmarks, favorites, likes, views, notifications, stats, rp]) => {
      setActivity({
        read: history.pagination?.total || 0,
        bookmarks: bookmarks.pagination?.total || 0,
        favorites: favorites.pagination?.total || 0,
        likes: likes.pagination?.total || 0,
        views: views.pagination?.total || 0,
        notifications: notifications.pagination?.unread || 0,
      })
      setReporterStats(stats)
      setReporterProfile(rp)
    }).catch(() => {})
  }, [user, isReporter])

  if (!user) {
    return (
      <View style={[styles.safe, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.guest}>
          <Text style={[styles.guestHeading, { color: colors.text }]}>Profile</Text>
          <View style={[styles.guestAvatar, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder }]}>
            <Ionicons name="person" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.guestTitle, { color: colors.text }]}>Login to your profile</Text>
          <Text style={styles.guestSub}>
            Sign in to sync bookmarks, favorites, likes and reading activity with your account.
          </Text>
          <Pressable style={[styles.guestBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.guestBtnText}>Login to your profile</Text>
          </Pressable>
          <Pressable style={styles.guestBtnAlt} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.guestBtnAltText}>Create Profile</Text>
          </Pressable>
          <Text style={[styles.guestSection, { color: colors.textMuted }]}>
            {language === 'hi' ? 'सामान्य सेटिंग्स' : 'General settings'}
          </Text>
          <View style={[styles.guestCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={styles.fontRow}>
              <Ionicons name="text-outline" size={20} color={colors.primary} />
              <Text style={[styles.menuText, { color: colors.text }]}>
                {language === 'hi' ? 'फॉन्ट साइज़' : 'Font size'}
              </Text>
              <Text style={[styles.sizeValue, { color: colors.textMuted }]}>{fontMode}</Text>
            </View>
            <Slider minimumValue={0} maximumValue={2} step={1} value={fontMode === 'small' ? 0 : fontMode === 'medium' ? 1 : 2} onValueChange={(value) => setFontMode(value === 0 ? 'small' : value === 1 ? 'medium' : 'large')} minimumTrackTintColor={colors.primary} maximumTrackTintColor={colors.surfaceVariant} thumbTintColor={colors.primary} style={styles.slider} />
            <View style={styles.sliderLabels}><Text style={styles.sliderLabel}>Small</Text><Text style={styles.sliderLabel}>Medium</Text><Text style={styles.sliderLabel}>Large</Text></View>
            
            <Pressable style={styles.menuRow} onPress={toggleTheme}>
              <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={20} color={colors.primary} />
              <Text style={[styles.menuText, { color: colors.text }]}>
                {language === 'hi' ? 'डिस्प्ले मोड' : 'Display mode'}
              </Text>
              <Text style={[styles.modeValue, { color: colors.textMuted }]}>{isDark ? 'Dark' : 'Light'}</Text>
            </Pressable>
            
            <Pressable style={styles.menuRow} onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="notifications-outline" size={20} color={colors.textMuted} />
              <Text style={[styles.menuText, { color: colors.text }]}>
                {language === 'hi' ? 'नोटिफिकेशन सेटिंग्स' : 'Notification settings'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </Pressable>
            
            <Pressable style={styles.menuRow} onPress={() => navigation.navigate('LocationPicker')}>
              <Ionicons name="location-outline" size={20} color={colors.textMuted} />
              <Text style={[styles.menuText, { color: colors.text }]}>
                {language === 'hi' ? 'लोकेशन सेटिंग्स' : 'Location settings'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </Pressable>

            <Pressable style={styles.menuRow} onPress={() => navigation.navigate('LanguageSettings')}>
              <Ionicons name="language-outline" size={20} color={colors.textMuted} />
              <Text style={[styles.menuText, { color: colors.text }]}>
                {language === 'hi' ? 'भाषा सेटिंग्स' : 'Language settings'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '700' }}>
                  {language === 'hi' ? 'हिन्दी' : 'English'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    )
  }

  const menu: Array<{ icon: any; label: string; route: string }> = [
    { icon: 'bookmark-outline', label: language === 'hi' ? 'सहेजे गए / बुकमार्क' : 'Saved / Bookmarks', route: 'Saved' },
    { icon: 'star-outline', label: language === 'hi' ? 'पसंदीदा' : 'My Favorites', route: 'Favorites' },
    { icon: 'notifications-outline', label: language === 'hi' ? 'नोटिफिकेशन सेटिंग्स' : 'Notification settings', route: 'Settings' },
    { icon: 'location-outline', label: language === 'hi' ? 'लोकेशन सेटिंग्स' : 'Location settings', route: 'LocationPicker' },
    { icon: 'language-outline', label: language === 'hi' ? 'भाषा सेटिंग्स' : 'Language settings', route: 'LanguageSettings' },
    { icon: 'time-outline', label: language === 'hi' ? 'रीडिंग हिस्ट्री' : 'Reading History', route: 'History' },
    { icon: 'headset-outline', label: language === 'hi' ? 'ऑडियो समाचार' : 'Audio News', route: 'AudioPlayer' },
    { icon: 'settings-outline', label: language === 'hi' ? 'मेरी रुचियां व सेटिंग्स' : 'My Interests & Settings', route: 'Settings' },
  ]

  const reporterMenu: Array<{ icon: any; label: string; route: string }> = [
    { icon: 'speedometer-outline', label: 'Reporter Dashboard', route: 'ReporterDashboard' },
    { icon: 'create-outline', label: 'Create Article', route: 'SubmitNews' },
    { icon: 'file-tray-outline', label: 'My Submissions', route: 'MySubmissions' },
    { icon: 'person-circle-outline', label: 'Reporter Profile', route: 'ReporterProfileScreen' },
    { icon: 'card-outline', label: 'eKYC Verification', route: 'Ekyc' },
    { icon: 'card-outline', label: 'My Press Card', route: 'ReporterCard' },
  ]

  const reporterUser = (reporterProfile?.userId as any) || user
  const reporterPhoto = reporterProfile?.profilePhotoUrl || reporterUser?.avatar || user?.avatar || ''
  const reporterDesignation = reporterProfile?.badge ? reporterProfile.badge.replace(/_/g, ' ') : ''
  const reporterVerified = reporterProfile?.approvalStatus === 'APPROVED'
  const reporterPending = reporterProfile?.approvalStatus === 'PENDING'
  const reporterBadgeColor = reporterVerified ? '#00A859' : reporterPending ? '#F59E0B' : '#64748B'

  return (
    <View style={[styles.safe, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.headerCenter}>
            <View style={[styles.avatar, reporterPhoto && styles.avatarImgWrap]}>
              {reporterPhoto ? (
                <Image source={{ uri: mediaUrl(reporterPhoto) }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <Text style={styles.avatarText}>{(user?.name || 'U').charAt(0)}</Text>
              )}
            </View>
            <Text style={[styles.name, { fontFamily: fontFor(user?.name, 700), color: colors.text }]}>{user?.name}</Text>

            {isReporter && reporterProfile ? (
              <>
                <View style={styles.badgeRow}>
                  <View style={[styles.verifiedBadge, { backgroundColor: `${reporterBadgeColor}1F`, borderColor: `${reporterBadgeColor}50` }]}>
                    <Ionicons name={reporterVerified ? 'checkmark-circle' : reporterPending ? 'time' : 'shield-outline'} size={12} color={reporterBadgeColor} />
                    <Text style={[styles.verifiedBadgeText, { color: reporterBadgeColor }]}>
                      {reporterVerified
                        ? 'VERIFIED REPORTER'
                        : reporterPending
                        ? 'REPORTER · PENDING REVIEW'
                        : 'REPORTER'}
                    </Text>
                  </View>
                </View>

                <View style={styles.profileLine}>
                  <Ionicons name="mail-outline" size={14} color={colors.primary} />
                  <Text style={[styles.profileLineText, { color: colors.textMuted }]} numberOfLines={1}>
                    {user?.email || user?.phone || 'N/A'}
                  </Text>
                </View>

                <View style={styles.profileLine}>
                  <Ionicons name="id-card-outline" size={14} color={colors.primary} />
                  <Text style={[styles.profileLineText, { color: colors.textMuted }]} numberOfLines={1}>
                    {reporterProfile.reporterId}
                  </Text>
                </View>

                <View style={[styles.designationChip, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
                  <Text style={[styles.designationChipText, { color: colors.textMuted }]}>
                    {reporterDesignation || 'LOCAL STRINGER'}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.detail, { color: colors.textMuted }]}>{user?.email || user?.phone || 'Member'}</Text>
                <View style={styles.roleRow}>
                  <View style={[styles.roleBadge, isReporter && styles.roleReporter]}>
                    <Text style={[styles.roleText, isReporter && styles.roleTextReporter]}>{user?.role || 'USER'}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        <Text style={[styles.section, { color: colors.textMuted }]}>My Activity</Text>
        <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View><Text style={[styles.activityValue, { color: colors.text }]}>{activity.read}</Text><Text style={[styles.activityLabel, { color: colors.textMuted }]}>Read</Text></View>
          <View><Text style={[styles.activityValue, { color: colors.text }]}>{activity.bookmarks}</Text><Text style={[styles.activityLabel, { color: colors.textMuted }]}>Saved</Text></View>
          <View><Text style={[styles.activityValue, { color: colors.text }]}>{activity.favorites}</Text><Text style={[styles.activityLabel, { color: colors.textMuted }]}>Favorites</Text></View>
          <View><Text style={[styles.activityValue, { color: colors.text }]}>{activity.likes}</Text><Text style={[styles.activityLabel, { color: colors.textMuted }]}>Liked</Text></View>
        </View>

        <Text style={styles.section}>Personal activity</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable style={styles.menuRow} onPress={() => navigation.navigate('History')}><Ionicons name="book-outline" size={20} color={colors.primary} /><Text style={[styles.menuText, { color: colors.text }]}>Reading activity</Text><Text style={[styles.count, { color: colors.textMuted }]}>{activity.read}</Text><Ionicons name="chevron-forward" size={18} color={colors.textLight} /></Pressable>
          <Pressable style={styles.menuRow} onPress={() => navigation.navigate('Favorites')}><Ionicons name="heart-outline" size={20} color={colors.primary} /><Text style={[styles.menuText, { color: colors.text }]}>Liked / favorite stories</Text><Text style={[styles.count, { color: colors.textMuted }]}>{activity.likes + activity.favorites}</Text><Ionicons name="chevron-forward" size={18} color={colors.textLight} /></Pressable>
          <Pressable style={styles.menuRow} onPress={() => navigation.navigate('Notifications')}><Ionicons name="notifications-outline" size={20} color={colors.primary} /><Text style={[styles.menuText, { color: colors.text }]}>Notifications</Text><Text style={[styles.count, { color: colors.textMuted }]}>{activity.notifications}</Text><Ionicons name="chevron-forward" size={18} color={colors.textLight} /></Pressable>
        </View>

        <Text style={[styles.section, { color: colors.textMuted }]}>LOCATION</Text>
        <Pressable style={[styles.locationCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('LocationPicker')}>
          <Ionicons name="location" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.locationLabel, { color: colors.textMuted }]}>Your location</Text>
            <Text style={[styles.locationValue, { color: colors.text }]}>{location?.label || 'All India'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        </Pressable>
        <View style={{ height: 10 }} />

        {isReporter ? (
          <>
            <Text style={[styles.section, { color: colors.textMuted }]}>Reporter Tools</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.reporterStatsRow, { borderBottomColor: colors.border }]}>
                <View style={styles.reporterStat}>
                  <Text style={[styles.reporterStatValue, { color: colors.highlightBlueLight }]}>{reporterStats?.total ?? 0}</Text>
                  <Text style={[styles.reporterStatLabel, { color: colors.textMuted }]}>Articles</Text>
                </View>
                <View style={styles.reporterStat}>
                  <Text style={[styles.reporterStatValue, { color: colors.highlightBlueLight }]}>{reporterStats?.pending ?? 0}</Text>
                  <Text style={[styles.reporterStatLabel, { color: colors.textMuted }]}>Pending</Text>
                </View>
                <View style={styles.reporterStat}>
                  <Text style={[styles.reporterStatValue, { color: colors.highlightBlueLight }]}>{reporterStats?.published ?? 0}</Text>
                  <Text style={[styles.reporterStatLabel, { color: colors.textMuted }]}>Published</Text>
                </View>
              </View>
              {reporterMenu.map((m) => (
                <Pressable key={m.label} style={styles.menuRow} onPress={() => navigation.navigate(m.route)}>
                  <Ionicons name={m.icon} size={20} color={colors.primary} />
                  <Text style={[styles.menuText, { color: colors.text }]}>{m.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.section}>My Account</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {menu.map((m) => (
            <Pressable key={m.label} style={styles.menuRow} onPress={() => navigation.navigate(m.route)}>
              <Ionicons name={m.icon} size={20} color={colors.textMuted} />
              <Text style={[styles.menuText, { color: colors.text }]}>{m.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.section}>{language === 'hi' ? 'रीडिंग व सामान्य सेटिंग्स' : 'Reading & General Preferences'}</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.fontRow}><Ionicons name="text-outline" size={20} color={colors.primary} /><Text style={[styles.menuText, { color: colors.text }]}>{language === 'hi' ? 'फॉन्ट साइज़' : 'Font size'}</Text><Text style={[styles.sizeValue, { color: colors.textMuted }]}>{fontMode}</Text></View>
          <Slider minimumValue={0} maximumValue={2} step={1} value={fontMode === 'small' ? 0 : fontMode === 'medium' ? 1 : 2} onValueChange={(value) => setFontMode(value === 0 ? 'small' : value === 1 ? 'medium' : 'large')} minimumTrackTintColor={colors.primary} maximumTrackTintColor={colors.surfaceVariant} thumbTintColor={colors.primary} style={styles.slider} />
          <View style={styles.sliderLabels}><Text style={styles.sliderLabel}>Small</Text><Text style={styles.sliderLabel}>Medium</Text><Text style={styles.sliderLabel}>Large</Text></View>
          <Pressable style={styles.menuRow} onPress={toggleTheme}><Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={20} color={colors.primary} /><Text style={[styles.menuText, { color: colors.text }]}>{language === 'hi' ? 'डिस्प्ले मोड' : 'Display mode'}</Text><Text style={[styles.modeValue, { color: colors.textMuted }]}>{isDark ? 'Dark' : 'Light'}</Text></Pressable>
          <Pressable style={styles.menuRow} onPress={() => navigation.navigate('LanguageSettings')}>
            <Ionicons name="language-outline" size={20} color={colors.textMuted} />
            <Text style={[styles.menuText, { color: colors.text }]}>{language === 'hi' ? 'भाषा सेटिंग्स' : 'Language settings'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '700' }}>
                {language === 'hi' ? 'हिन्दी' : 'English'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </View>
          </Pressable>
        </View>

        <Pressable style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
        <Text style={styles.footerText}>Aarambh News · Hyperlocal News App</Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerCard: { alignItems: 'center', padding: 20, marginHorizontal: 16, marginTop: 12, borderRadius: 16, borderWidth: 1 },
  headerCenter: { alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '900' },
  avatarImgWrap: { overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  badgeRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 4 },
  verifiedBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  profileLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 7 },
  profileLineText: { fontSize: 13, fontWeight: '500' },
  designationChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 4, marginTop: 10 },
  designationChipText: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.5 },
  name: { fontFamily: fonts.serif[700], fontSize: 22, textAlign: 'center', marginTop: 12 },
  detail: { fontSize: 13, marginTop: 3, textAlign: 'center' },
  roleRow: { flexDirection: 'row', marginTop: 6, justifyContent: 'center' },
  roleBadge: { backgroundColor: colors.surfaceContainer, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  roleReporter: { backgroundColor: colors.primarySoft },
  roleText: { fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 },
  roleTextReporter: { color: colors.primary },
  locationCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14 },
  locationLabel: { fontSize: 11, color: colors.textLight, textTransform: 'uppercase', fontWeight: '700' },
  locationValue: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 2 },
  section: { fontSize: 13, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginHorizontal: 16, marginTop: 22, marginBottom: 10 },
  card: { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  activityCard: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 16, borderRadius: 14, borderWidth: 1, paddingVertical: 16 },
  activityValue: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  activityLabel: { fontSize: 11, textAlign: 'center', marginTop: 3 },
  menuRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  fontRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingTop: 13 },
  menuText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  sizeValue: { color: colors.textMuted, fontSize: 12, textTransform: 'capitalize' },
  slider: { marginHorizontal: 10, height: 36 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 10 },
  sliderLabel: { color: colors.textMuted, fontSize: 11 },
  modeValue: { color: colors.textMuted, fontWeight: '700' },
  count: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginRight: 2 },
  reporterStatsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  reporterStat: { alignItems: 'center', gap: 2 },
  reporterStatValue: { fontSize: 16, fontWeight: '800' },
  reporterStatLabel: { fontSize: 10.5, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, marginHorizontal: 16, paddingVertical: 13, borderRadius: 12, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primarySoftBorder },
  logoutText: { color: colors.danger, fontSize: 14, fontWeight: '800' },
  footerText: { textAlign: 'center', color: colors.textLight, fontSize: 12, marginTop: 16 },
  guest: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  guestHeading: { alignSelf: 'flex-start', fontFamily: fonts.serif[700], fontSize: 24, color: colors.text, marginBottom: 28, marginLeft: 2 },
  guestAvatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  guestTitle: { fontFamily: fonts.serif[700], fontSize: 21, color: colors.text },
  guestSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20, maxWidth: 300, paddingHorizontal: 8 },
  guestBtn: { width: '100%', maxWidth: 320, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 26 },
  guestBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  guestBtnAlt: { marginTop: 6, paddingVertical: 14, paddingHorizontal: 40, alignItems: 'center' },
  guestBtnAltText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  guestCard: { width: '100%', maxWidth: 360, alignSelf: 'center', borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginTop: 8 },
  guestSection: { width: '100%', maxWidth: 360, alignSelf: 'center', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 30, marginBottom: 10 },
})
