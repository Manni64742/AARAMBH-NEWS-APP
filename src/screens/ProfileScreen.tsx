import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import Slider from '@react-native-community/slider'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { useLocation } from '../context/LocationContext'
import { interactionApi, notificationApi, reporterApi, userApi } from '../api/endpoints'
import { useTheme } from '../context/ThemeContext'
import { colors, fonts, fontFor } from '../theme'
import { ScaledText as Text } from '../components/ScaledText'

export default function ProfileScreen({ navigation }: any) {
  const { user, isReporter, logout } = useAuth()
  const { current: location } = useLocation()
  const { colors, fontMode, setFontMode, isDark, toggleTheme } = useTheme()
  const insets = useSafeAreaInsets()
  const [activity, setActivity] = useState({ read: 0, bookmarks: 0, favorites: 0, likes: 0, views: 0, notifications: 0 })
  const [reporterStats, setReporterStats] = useState<any>(null)

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
    ]).then(([history, bookmarks, favorites, likes, views, notifications, stats]) => {
      setActivity({
        read: history.pagination?.total || 0,
        bookmarks: bookmarks.pagination?.total || 0,
        favorites: favorites.pagination?.total || 0,
        likes: likes.pagination?.total || 0,
        views: views.pagination?.total || 0,
        notifications: notifications.pagination?.unread || 0,
      })
      setReporterStats(stats)
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
          <Text style={[styles.guestSection, { color: colors.textMuted }]}>General settings</Text>
          <View style={[styles.guestCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={styles.fontRow}><Ionicons name="text-outline" size={20} color={colors.primary} /><Text style={[styles.menuText, { color: colors.text }]}>Font size</Text><Text style={[styles.sizeValue, { color: colors.textMuted }]}>{fontMode}</Text></View>
            <Slider minimumValue={0} maximumValue={2} step={1} value={fontMode === 'small' ? 0 : fontMode === 'medium' ? 1 : 2} onValueChange={(value) => setFontMode(value === 0 ? 'small' : value === 1 ? 'medium' : 'large')} minimumTrackTintColor={colors.primary} maximumTrackTintColor={colors.surfaceVariant} thumbTintColor={colors.primary} style={styles.slider} />
            <View style={styles.sliderLabels}><Text style={styles.sliderLabel}>Small</Text><Text style={styles.sliderLabel}>Medium</Text><Text style={styles.sliderLabel}>Large</Text></View>
            <Pressable style={styles.menuRow} onPress={toggleTheme}><Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={20} color={colors.primary} /><Text style={[styles.menuText, { color: colors.text }]}>Display mode</Text><Text style={[styles.modeValue, { color: colors.textMuted }]}>{isDark ? 'Dark' : 'Light'}</Text></Pressable>
            <Pressable style={styles.menuRow} onPress={() => navigation.navigate('Settings')}><Ionicons name="notifications-outline" size={20} color={colors.textMuted} /><Text style={[styles.menuText, { color: colors.text }]}>Notification settings</Text><Ionicons name="chevron-forward" size={18} color={colors.textLight} /></Pressable>
            <Pressable style={styles.menuRow} onPress={() => navigation.navigate('LocationPicker')}><Ionicons name="location-outline" size={20} color={colors.textMuted} /><Text style={[styles.menuText, { color: colors.text }]}>Location settings</Text><Ionicons name="chevron-forward" size={18} color={colors.textLight} /></Pressable>
          </View>
        </ScrollView>
      </View>
    )
  }

  const menu: Array<{ icon: any; label: string; route: string }> = [
    { icon: 'bookmark-outline', label: 'Saved / Bookmarks', route: 'Saved' },
    { icon: 'star-outline', label: 'My Favorites', route: 'Favorites' },
    { icon: 'notifications-outline', label: 'Notifications', route: 'Notifications' },
    { icon: 'time-outline', label: 'Reading History', route: 'History' },
    { icon: 'headset-outline', label: 'Audio News', route: 'AudioPlayer' },
    { icon: 'location-outline', label: 'Change Location', route: 'LocationPicker' },
    { icon: 'settings-outline', label: 'My Interests & Settings', route: 'Settings' },
  ]

  const reporterMenu: Array<{ icon: any; label: string; route: string }> = [
    { icon: 'speedometer-outline', label: 'Reporter Dashboard', route: 'ReporterDashboard' },
    { icon: 'create-outline', label: 'Create Article', route: 'SubmitNews' },
    { icon: 'file-tray-outline', label: 'My Submissions', route: 'MySubmissions' },
    { icon: 'person-circle-outline', label: 'Reporter Profile', route: 'ReporterProfileScreen' },
    { icon: 'card-outline', label: 'eKYC Verification', route: 'Ekyc' },
    { icon: 'card-outline', label: 'My Press Card', route: 'ReporterCard' },
  ]

  return (
    <View style={[styles.safe, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.headerCenter}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.name || 'U').charAt(0)}</Text>
            </View>
            <Text style={[styles.name, { fontFamily: fontFor(user?.name, 700) }]}>{user?.name}</Text>
            <Text style={styles.detail}>{user?.email || user?.phone || 'Member'}</Text>
            <View style={styles.roleRow}>
              <View style={[styles.roleBadge, isReporter && styles.roleReporter]}>
                <Text style={[styles.roleText, isReporter && styles.roleTextReporter]}>{user?.role || 'USER'}</Text>
              </View>
            </View>
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

        <Pressable style={[styles.locationCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('LocationPicker')}>
          <Ionicons name="location" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.locationLabel}>Your location</Text>
            <Text style={styles.locationValue}>{location?.label || 'Not set — tap to select'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        </Pressable>

        {isReporter ? (
          <>
            <Text style={styles.section}>Reporter Tools</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.reporterStats}><Text style={styles.reporterStatsText}>Articles {reporterStats?.total ?? 0}</Text><Text style={styles.reporterStatsText}>Pending {reporterStats?.pending ?? 0}</Text><Text style={styles.reporterStatsText}>Published {reporterStats?.published ?? 0}</Text></View>
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

        <Text style={styles.section}>Reading preferences</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.fontRow}><Ionicons name="text-outline" size={20} color={colors.primary} /><Text style={[styles.menuText, { color: colors.text }]}>Font size</Text><Text style={[styles.sizeValue, { color: colors.textMuted }]}>{fontMode}</Text></View>
          <Slider minimumValue={0} maximumValue={2} step={1} value={fontMode === 'small' ? 0 : fontMode === 'medium' ? 1 : 2} onValueChange={(value) => setFontMode(value === 0 ? 'small' : value === 1 ? 'medium' : 'large')} minimumTrackTintColor={colors.primary} maximumTrackTintColor={colors.surfaceVariant} thumbTintColor={colors.primary} style={styles.slider} />
          <View style={styles.sliderLabels}><Text style={styles.sliderLabel}>Small</Text><Text style={styles.sliderLabel}>Medium</Text><Text style={styles.sliderLabel}>Large</Text></View>
          <Pressable style={styles.menuRow} onPress={toggleTheme}><Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={20} color={colors.primary} /><Text style={[styles.menuText, { color: colors.text }]}>Display mode</Text><Text style={[styles.modeValue, { color: colors.textMuted }]}>{isDark ? 'Dark' : 'Light'}</Text></Pressable>
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
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  name: { fontFamily: fonts.serif[700], fontSize: 20, color: colors.text, textAlign: 'center', marginTop: 10 },
  detail: { fontSize: 13, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  roleRow: { flexDirection: 'row', marginTop: 6, justifyContent: 'center' },
  roleBadge: { backgroundColor: colors.surfaceContainer, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  roleReporter: { backgroundColor: colors.primarySoft },
  roleText: { fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 },
  roleTextReporter: { color: colors.primary },
  locationCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14 },
  locationLabel: { fontSize: 11, color: colors.textLight, textTransform: 'uppercase', fontWeight: '700' },
  locationValue: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 2 },
  section: { fontSize: 13, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginHorizontal: 16, marginTop: 20, marginBottom: 8 },
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
  reporterStats: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12 },
  reporterStatsText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
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
