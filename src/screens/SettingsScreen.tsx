import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native'
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
import {
  registerForPushNotificationsAsync,
  runPushNotificationDiagnostic,
  sendTestPushNotification,
  DiagnosticResult,
} from '../services/notificationService'

const GUEST_NOTIFICATIONS_KEY = 'aarambh_guest_notifications'

export default function SettingsScreen({ navigation }: any) {
  const { user } = useAuth()
  const { language, setLanguage } = useLanguage()
  const { colors, fontMode, setFontMode, isDark, toggleTheme } = useTheme()
  const { success, error } = useToast()
  const [prefs, setPrefs] = useState<UserPreferences | null>(null)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [follows, setFollows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notif, setNotif] = useState<Record<string, boolean>>({})
  const [pw, setPw] = useState({ current: '', next: '' })
  const [diagResult, setDiagResult] = useState<DiagnosticResult | null>(null)
  const [diagLoading, setDiagLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)

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

  const handleRunDiagnostic = async () => {
    setDiagLoading(true)
    try {
      const res = await runPushNotificationDiagnostic()
      setDiagResult(res)
      if (res.ok) {
        Alert.alert(
          'पुश नोटिफिकेशन सफल ✅',
          `डिवाइस सफलतापूर्वक कनेक्टेड और रजिस्टर्ड है!\n\nBuild: v${res.appVersion}\nPermission: ${res.permissionStatus}\nToken: ${res.token?.substring(0, 28)}...\nServer: Active & Registered ✅`
        )
      } else {
        Alert.alert(
          'नोटिफिकेशन डायग्नोस्टिक रिपोर्ट ⚠️',
          `Status: Failed\nStep: ${res.step}\nPermission: ${res.permissionStatus}\nDetails: ${res.error || 'टोकन प्राप्त नहीं हुआ'}`
        )
      }
    } catch (e: any) {
      Alert.alert('जांच त्रुटि', e?.message || 'जांच पूरी नहीं हो सकी')
    } finally {
      setDiagLoading(false)
    }
  }

  const handleSendTestPush = async () => {
    setTestLoading(true)
    try {
      const res = await sendTestPushNotification(diagResult?.token || undefined)
      if (res.success) {
        Alert.alert(
          'टेस्ट पुश भेजा गया! 🔔',
          'सर्वर से Google Firebase (FCM) के जरिए आपकी डिवाइस पर टेस्ट नोटिफिकेशन भेज दिया गया है। कृपया अपने फोन का नोटिफिकेशन शेड चेक करें!'
        )
      } else {
        Alert.alert('टेस्ट पुश विफल ❌', res.message)
      }
    } catch (e: any) {
      Alert.alert('त्रुटि', e?.message || 'टेस्ट नोटिफिकेशन नहीं भेजा जा सका')
    } finally {
      setTestLoading(false)
    }
  }

  if (loading) return <View style={[styles.center, { backgroundColor: colors.bg }]}><AarambhLoader size="lg" color={colors.primary} /></View>

  const topPadding = 12

  return (
    <ScrollView
      style={[styles.safe, { backgroundColor: colors.bg }]}
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

      {/* Push Notification Diagnostics & Live Verification */}
      <Text style={[styles.section, { color: colors.text }]}>पुश नोटिफिकेशन स्थिति (Push Diagnostics)</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, paddingVertical: 14 }]}>
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 13, color: colors.textLight }}>App Build</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
              v{Constants.expoConfig?.version || '1.0.2'} (Build #{Constants.expoConfig?.android?.versionCode || 3})
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 13, color: colors.textLight }}>Notification Status</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: diagResult?.ok ? baseColors.success : colors.text }}>
              {diagResult ? (diagResult.ok ? 'सक्रिय एवं कनेक्टेड ✅' : 'पुनः जांच आवश्यक ⚠️') : 'जांच के लिए बटन दबाएं'}
            </Text>
          </View>
          {diagResult?.token ? (
            <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 4 }} numberOfLines={1}>
              Token: {diagResult.token.substring(0, 24)}...
            </Text>
          ) : null}
        </View>

        <Pressable
          style={[styles.btn, { backgroundColor: colors.primary, marginBottom: 10 }]}
          disabled={diagLoading}
          onPress={handleRunDiagnostic}
        >
          {diagLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnText}>🔄 स्थिति जांचें और टोकन जोड़ें (Check Status)</Text>
          )}
        </Pressable>

        <Pressable
          style={[styles.btn, { backgroundColor: '#1b873f' }]}
          disabled={testLoading}
          onPress={handleSendTestPush}
        >
          {testLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnText}>📨 टेस्ट नोटिफिकेशन भेजें (Send Test Push)</Text>
          )}
        </Pressable>
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
    </ScrollView>
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
})
