import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native'
import Slider from '@react-native-community/slider'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { categoryApi, followApi, notificationApi, userApi } from '../api/endpoints'
import { CategoryItem, UserPreferences } from '../types'
import { colors as baseColors, fonts } from '../theme'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../api/client'
import { SUPPORTED_LANGUAGES } from '../config'
import { useAuth } from '../context/AuthContext'
import { useLanguage, AppLanguage } from '../context/LanguageContext'
import { ScaledText as Text } from '../components/ScaledText'
import { AarambhLoader } from '../components/AarambhLoader'
import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'
import { registerForPushNotificationsAsync } from '../services/notificationService'

const GUEST_NOTIFICATIONS_KEY = 'aarambh_guest_notifications'

export default function SettingsScreen({ navigation }: any) {
  const { user, logout } = useAuth()
  const { language, setLanguage } = useLanguage()
  const { colors, fontMode, setFontMode, isDark, toggleTheme } = useTheme()
  const { success, error } = useToast()
  const [prefs, setPrefs] = useState<UserPreferences | null>(null)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [follows, setFollows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notif, setNotif] = useState<Record<string, boolean>>({})
  const [pw, setPw] = useState({ current: '', next: '' })

  useEffect(() => {
    const load = async () => {
      try {
        setCategories(await categoryApi.list())
        if (user) {
          const [preferences, notificationPreferences, following] = await Promise.all([
            userApi.preferences(),
            notificationApi.preferences(),
            followApi.list(),
          ])
          setPrefs(preferences)
          setNotif(notificationPreferences)
          setFollows(following)
        } else {
          const saved = await AsyncStorage.getItem(GUEST_NOTIFICATIONS_KEY)
          setNotif(saved ? JSON.parse(saved) : {})
        }
      } catch {
        setCategories([])
      } finally {
        setLoading(false)
        registerForPushNotificationsAsync().catch(() => {})
      }
    }
    load()
  }, [user])

  const toggleInterest = async (id: string) => {
    if (!prefs) return
    const interests = prefs.interests.includes(id) ? prefs.interests.filter((item) => item !== id) : [...prefs.interests, id]
    setPrefs({ ...prefs, interests })
    try {
      await userApi.updatePreferences({ interests })
      success('Interests updated')
    } catch (e) {
      error(errorMessage(e))
    }
  }

  const toggleNotif = async (key: string, value: boolean) => {
    const next = { ...notif, [key]: value }
    setNotif(next)
    try {
      if (user) await notificationApi.updatePreferences({ [key]: value })
      else await AsyncStorage.setItem(GUEST_NOTIFICATIONS_KEY, JSON.stringify(next))
      success('Preferences saved')
    } catch (e) {
      error(errorMessage(e))
    }
  }

  const changePassword = async () => {
    if (!pw.current || pw.next.length < 6) {
      error('Fill current password and new password (min 6)')
      return
    }
    try {
      await userApi.changePassword(pw.current, pw.next)
      success('Password changed')
      setPw({ current: '', next: '' })
    } catch (e) {
      error(errorMessage(e))
    }
  }

  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteAccount = () => {
    setDeleteModalVisible(true)
  }

  const confirmDeleteAccount = async () => {
    setDeleting(true)
    try {
      await userApi.deleteAccount()
      setDeleteModalVisible(false)
      await logout()
      success('Account deleted successfully')
      navigation.navigate('Main', { screen: 'Home' })
    } catch (e) {
      error(errorMessage(e, 'Failed to delete account'))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <View style={[styles.center, { backgroundColor: colors.bg }]}><AarambhLoader size="lg" color={colors.primary} /></View>

  const topPadding = 12

  return (
    <View style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.safe}
        contentContainerStyle={[styles.content, { paddingTop: topPadding }]}
        scrollIndicatorInsets={{ top: topPadding }}
      >
      <Text style={[styles.section, { color: colors.text }]}>Appearance</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={[styles.rowText, { color: colors.text }]}>{isDark ? 'Dark mode' : 'Light mode'}</Text>
            <Text style={[styles.note, { color: colors.textLight }]}>Choose how Aarambh News looks</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      <Text style={[styles.section, { color: colors.text }]}>Font size</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.fontMode, { color: colors.textMuted }]}>{fontMode}</Text>
        <Slider
          minimumValue={0}
          maximumValue={2}
          step={1}
          value={fontMode === 'small' ? 0 : fontMode === 'medium' ? 1 : 2}
          onValueChange={(value) => setFontMode(value === 0 ? 'small' : value === 1 ? 'medium' : 'large')}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.surfaceVariant}
          thumbTintColor={colors.primary}
          style={styles.slider}
        />
        <View style={styles.sliderLabels}>
          <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>Small</Text>
          <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>Medium</Text>
          <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>Large</Text>
        </View>
      </View>


      {user ? (
        <>
          <Text style={[styles.section, { color: colors.text }]}>Your Interests</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, paddingVertical: 12 }]}>
            <View style={styles.chips}>
              {categories.map((category) => {
                const active = prefs?.interests?.includes(category._id)
                return (
                  <Pressable
                    key={category._id}
                    style={[
                      styles.chip,
                      { backgroundColor: colors.lightSurface },
                      active && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => toggleInterest(category._id)}
                  >
                    <Text style={[styles.chipText, { color: active ? '#fff' : colors.textMuted }]}>
                      {category.name.en}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        </>
      ) : null}

      <Text style={[styles.section, { color: colors.text }]}>Notification Preferences</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          ['breaking', 'Breaking News'],
          ['localNews', 'Local News'],
          ['followedCategory', 'Followed Categories'],
          ['followedReporter', 'Followed Reporters'],
          ['followedLocation', 'Followed Locations'],
          ['trending', 'Trending Stories'],
        ].map(([key, label], idx, arr) => (
          <React.Fragment key={key}>
            <View style={styles.row}>
              <Text style={[styles.rowText, { color: colors.text }]}>{label}</Text>
              <Switch
                value={!!notif[key]}
                onValueChange={(value) => toggleNotif(key, value)}
                trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
            {idx < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
          </React.Fragment>
        ))}
      </View>

      {user && follows.length > 0 ? (
        <>
          <Text style={[styles.section, { color: colors.text }]}>Following</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {follows.map((follow, idx) => (
              <React.Fragment key={`${follow.targetType}-${follow.targetId}`}>
                <View style={styles.row}>
                  <Text style={[styles.rowText, { color: colors.text }]}>{follow.label}</Text>
                </View>
                {idx < follows.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            ))}
          </View>
        </>
      ) : null}

      {user ? (
        <>
          <Text style={[styles.section, { color: colors.text }]}>Change Password</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, paddingVertical: 14 }]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.lightSurface, color: colors.text }]}
              value={pw.current}
              onChangeText={(value) => setPw({ ...pw, current: value })}
              placeholder="Current password"
              placeholderTextColor={colors.textLight}
              secureTextEntry
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.lightSurface, color: colors.text }]}
              value={pw.next}
              onChangeText={(value) => setPw({ ...pw, next: value })}
              placeholder="New password (min 6)"
              placeholderTextColor={colors.textLight}
              secureTextEntry
            />
            <Pressable style={styles.btn} onPress={changePassword}>
              <Text style={styles.btnText}>Update Password</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      <Text style={[styles.section, { color: colors.text }]}>Legal & Information</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable
          style={styles.row}
          onPress={() => Linking.openURL('https://aarambhnews.online/privacy-policy')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
            <Text style={[styles.rowText, { color: colors.text }]}>Privacy Policy</Text>
          </View>
          <Ionicons name="open-outline" size={16} color={colors.textLight} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Pressable
          style={styles.row}
          onPress={() => Linking.openURL('https://aarambhnews.online/terms-of-service')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <Text style={[styles.rowText, { color: colors.text }]}>Terms of Use & UGC</Text>
          </View>
          <Ionicons name="open-outline" size={16} color={colors.textLight} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Pressable
          style={styles.row}
          onPress={() => Linking.openURL('mailto:contact@aarambhnews.online')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="mail-outline" size={18} color={colors.primary} />
            <Text style={[styles.rowText, { color: colors.text }]}>Contact & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
        </Pressable>
      </View>

      {user ? (
        <>
          <Text style={[styles.section, { color: baseColors.danger }]}>Account Management</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: `${baseColors.danger}40`, paddingVertical: 12 }]}>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 10 }}>
              Permanently delete your Aarambh News account and all associated profile, reading history, and saved data.
            </Text>
            <Pressable
              style={[styles.deleteBtn, { backgroundColor: `${baseColors.danger}15`, borderColor: baseColors.danger }]}
              onPress={handleDeleteAccount}
            >
              <Ionicons name="trash-outline" size={18} color={baseColors.danger} />
              <Text style={[styles.deleteBtnText, { color: baseColors.danger }]}>Delete Account</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      <Text style={{ textAlign: 'center', fontSize: 12, color: colors.textLight, marginTop: 24, marginBottom: 12 }}>
        Aarambh News • v{Constants.expoConfig?.version || '1.0.3'} (Build #{Constants.expoConfig?.android?.versionCode || 4})
      </Text>
    </ScrollView>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleting) setDeleteModalVisible(false)
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (!deleting) setDeleteModalVisible(false)
            }}
          />
          <View style={[styles.deleteModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.deleteModalIconWrap}>
              <Ionicons name="trash" size={28} color="#EF4444" />
            </View>
            <Text style={[styles.deleteModalTitle, { color: colors.text }]}>Delete Account Permanently?</Text>
            <Text style={[styles.deleteModalDesc, { color: colors.textMuted }]}>
              This action cannot be undone. All your profile information, reading history, saved articles, and comments will be permanently erased.
            </Text>

            <View style={styles.deleteModalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalCancelBtn, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deleting}
              >
                <Text style={[styles.modalCancelBtnText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalConfirmBtn, deleting && { opacity: 0.7 }]}
                onPress={confirmDeleteAccount}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Yes, Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { fontFamily: fonts.serif[700], fontSize: 16, fontWeight: '700', marginBottom: 8, marginTop: 16, paddingHorizontal: 2 },
  card: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, minHeight: 48 },
  rowText: { fontSize: 14, fontWeight: '500' },
  divider: { height: StyleSheet.hairlineWidth, width: '100%' },
  check: { color: baseColors.success, fontWeight: '900', fontSize: 16 },
  note: { fontSize: 12, marginTop: 4 },
  fontMode: { textAlign: 'center', textTransform: 'capitalize', fontSize: 13, fontWeight: '700', marginTop: 6 },
  slider: { marginHorizontal: 6, height: 36, marginTop: 4 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 10 },
  sliderLabel: { fontSize: 11 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18 },
  chipText: { fontSize: 13, fontWeight: '600' },
  input: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 10 },
  btn: { backgroundColor: baseColors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    marginTop: 4,
  },
  deleteBtnText: {
    fontWeight: '800',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  deleteModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  deleteModalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  deleteModalDesc: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {},
  modalCancelBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  modalConfirmBtn: {
    backgroundColor: '#EF4444',
  },
  modalConfirmBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
})
