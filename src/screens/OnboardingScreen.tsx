/**
 * [ONBOARDING SCREEN - PRESERVED FOR FUTURE USE]
 * As per client request, the initial interactive onboarding prompt (Interest & Location selection)
 * is bypassed so the app launches directly to the Home screen (MainTabs).
 * Default values (Interests = ALL, Location = All India) are set automatically.
 * Keep this component fully intact so it can be re-enabled at any time.
 */

import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { ScaledText as Text } from '../components/ScaledText'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { categoryApi, locationApi, userApi } from '../api/endpoints'
import { CategoryItem, LocationItem } from '../types'
import { colors, fonts } from '../theme'
import { useLocation } from '../context/LocationContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

import { AtmosphereBackground } from '../components/AtmosphereBackground'
import { AarambhLoader } from '../components/AarambhLoader'

const ONBOARDING_KEY = 'aarambh_onboarding_done'
const INTERESTS_KEY = 'aarambh_guest_interests'
const icons = ['newspaper-outline', 'globe-outline', 'football-outline', 'heart-outline', 'business-outline', 'book-outline', 'flask-outline', 'color-palette-outline'] as const

type Step = 'INTERESTS' | 'LOCATION'

const ALL_INDIA: LocationItem = {
  _id: 'all-india',
  slug: 'all-india',
  type: 'COUNTRY',
  name: { en: 'All India', hi: 'पूरा भारत' },
  isActive: true,
}

const FALLBACK_STATES: LocationItem[] = [
  { _id: 'fb-andhra-pradesh', slug: 'andhra-pradesh', type: 'STATE', name: { en: 'Andhra Pradesh', hi: 'आंध्र प्रदेश' } },
  { _id: 'fb-arunachal-pradesh', slug: 'arunachal-pradesh', type: 'STATE', name: { en: 'Arunachal Pradesh', hi: 'अरुणाचल प्रदेश' } },
  { _id: 'fb-assam', slug: 'assam', type: 'STATE', name: { en: 'Assam', hi: 'असम' } },
  { _id: 'fb-bihar', slug: 'bihar', type: 'STATE', name: { en: 'Bihar', hi: 'बिहार' } },
  { _id: 'fb-chhattisgarh', slug: 'chhattisgarh', type: 'STATE', name: { en: 'Chhattisgarh', hi: 'छत्तीसगढ़' } },
  { _id: 'fb-goa', slug: 'goa', type: 'STATE', name: { en: 'Goa', hi: 'गोवा' } },
  { _id: 'fb-gujarat', slug: 'gujarat', type: 'STATE', name: { en: 'Gujarat', hi: 'गुजरात' } },
  { _id: 'fb-haryana', slug: 'haryana', type: 'STATE', name: { en: 'Haryana', hi: 'हरियाणा' } },
  { _id: 'fb-himachal-pradesh', slug: 'himachal-pradesh', type: 'STATE', name: { en: 'Himachal Pradesh', hi: 'हिमाचल प्रदेश' } },
  { _id: 'fb-jharkhand', slug: 'jharkhand', type: 'STATE', name: { en: 'Jharkhand', hi: 'झारखंड' } },
  { _id: 'fb-karnataka', slug: 'karnataka', type: 'STATE', name: { en: 'Karnataka', hi: 'कर्नाटक' } },
  { _id: 'fb-kerala', slug: 'kerala', type: 'STATE', name: { en: 'Kerala', hi: 'केरल' } },
  { _id: 'fb-madhya-pradesh', slug: 'madhya-pradesh', type: 'STATE', name: { en: 'Madhya Pradesh', hi: 'मध्य प्रदेश' } },
  { _id: 'fb-maharashtra', slug: 'maharashtra', type: 'STATE', name: { en: 'Maharashtra', hi: 'महाराष्ट्र' } },
  { _id: 'fb-manipur', slug: 'manipur', type: 'STATE', name: { en: 'Manipur', hi: 'मणिपुर' } },
  { _id: 'fb-meghalaya', slug: 'meghalaya', type: 'STATE', name: { en: 'Meghalaya', hi: 'मेघालय' } },
  { _id: 'fb-mizoram', slug: 'mizoram', type: 'STATE', name: { en: 'Mizoram', hi: 'मिज़ोरम' } },
  { _id: 'fb-nagaland', slug: 'nagaland', type: 'STATE', name: { en: 'Nagaland', hi: 'नागालैंड' } },
  { _id: 'fb-odisha', slug: 'odisha', type: 'STATE', name: { en: 'Odisha', hi: 'ओडिशा' } },
  { _id: 'fb-punjab', slug: 'punjab', type: 'STATE', name: { en: 'Punjab', hi: 'पंजाब' } },
  { _id: 'fb-rajasthan', slug: 'rajasthan', type: 'STATE', name: { en: 'Rajasthan', hi: 'राजस्थान' } },
  { _id: 'fb-sikkim', slug: 'sikkim', type: 'STATE', name: { en: 'Sikkim', hi: 'सिक्किम' } },
  { _id: 'fb-tamil-nadu', slug: 'tamil-nadu', type: 'STATE', name: { en: 'Tamil Nadu', hi: 'तमिलनाडु' } },
  { _id: 'fb-telangana', slug: 'telangana', type: 'STATE', name: { en: 'Telangana', hi: 'तेलंगाना' } },
  { _id: 'fb-tripura', slug: 'tripura', type: 'STATE', name: { en: 'Tripura', hi: 'त्रिपुरा' } },
  { _id: 'fb-uttar-pradesh', slug: 'uttar-pradesh', type: 'STATE', name: { en: 'Uttar Pradesh', hi: 'उत्तर प्रदेश' } },
  { _id: 'fb-uttarakhand', slug: 'uttarakhand', type: 'STATE', name: { en: 'Uttarakhand', hi: 'उत्तराखंड' } },
  { _id: 'fb-west-bengal', slug: 'west-bengal', type: 'STATE', name: { en: 'West Bengal', hi: 'पश्चिम बंगाल' } },
  { _id: 'fb-andaman-nicobar', slug: 'andaman-and-nicobar-islands', type: 'UT', name: { en: 'Andaman & Nicobar Islands', hi: 'अंडमान और निकोबार द्वीपसमूह' } },
  { _id: 'fb-chandigarh', slug: 'chandigarh', type: 'UT', name: { en: 'Chandigarh', hi: 'चंडीगढ़' } },
  { _id: 'fb-dnhdd', slug: 'dadra-nagar-haveli-daman-diu', type: 'UT', name: { en: 'Dadra & Nagar Haveli and Daman & Diu', hi: 'दादरा और नगर हवेली और दमन और दीव' } },
  { _id: 'fb-delhi', slug: 'delhi', type: 'UT', name: { en: 'Delhi', hi: 'दिल्ली' } },
  { _id: 'fb-jammu-kashmir', slug: 'jammu-and-kashmir', type: 'UT', name: { en: 'Jammu & Kashmir', hi: 'जम्मू और कश्मीर' } },
  { _id: 'fb-ladakh', slug: 'ladakh', type: 'UT', name: { en: 'Ladakh', hi: 'लद्दाख' } },
  { _id: 'fb-lakshadweep', slug: 'lakshadweep', type: 'UT', name: { en: 'Lakshadweep', hi: 'लक्षद्वीप' } },
  { _id: 'fb-puducherry', slug: 'puducherry', type: 'UT', name: { en: 'Puducherry', hi: 'पुदुच्चेरी' } },
]

function buildPills(fromApi: LocationItem[]): LocationItem[] {
  const map = new Map<string, LocationItem>()
  fromApi.forEach((item) => { if (item?.slug) map.set(item.slug, item) })
  FALLBACK_STATES.forEach((item) => { if (!map.has(item.slug)) map.set(item.slug, item) })
  const states = [...map.values()].sort((a, b) => a.name.en.localeCompare(b.name.en))
  return [ALL_INDIA, ...states]
}

export default function OnboardingScreen({ navigation }: any) {
  const { colors: themeColors } = useTheme()
  const { user } = useAuth()
  const { setManual } = useLocation()
  const [step, setStep] = useState<Step>('INTERESTS')
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [pills, setPills] = useState<LocationItem[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => setCategories([])).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (step !== 'LOCATION') return
    let active = true
    setLoading(true)
    locationApi.states()
      .then((result) => { if (active) setPills(buildPills(result || [])) })
      .catch(() => { if (active) setPills(buildPills([])) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [step])

  const finish = async (skip: boolean) => {
    const selectedId = selectedLocation?._id
    const isSkip = skip || selectedId === ALL_INDIA._id
    if (isSkip) {
      await setManual({ label: 'All India' })
    } else if (selectedLocation) {
      await setManual({ state: selectedLocation.name.en, label: selectedLocation.name.en })
    }
    await AsyncStorage.setItem(INTERESTS_KEY, JSON.stringify(selected))
    if (user) await userApi.updatePreferences({ interests: selected }).catch(() => {})
    await AsyncStorage.setItem(ONBOARDING_KEY, '1')
    navigation.replace('Main')
  }

  const canProceed = selectedLocation != null

  return (
    <View style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <AtmosphereBackground />
      <View style={styles.brand}><Image source={require('../../assets/aarambh_news_logo.png')} style={styles.brandLogo} contentFit="contain" /></View>
      {step === 'INTERESTS' ? (
        <>
          <Text style={[styles.title, { color: themeColors.text }]}>Select your interests</Text>
          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>Choose topics to personalize your news feed.</Text>
          {loading ? <AarambhLoader size="md" style={styles.loader} /> : <ScrollView contentContainerStyle={styles.grid}>
            {categories.map((category, index) => {
              const active = selected.includes(category._id)
              return <Pressable key={category._id} style={[styles.chip, { backgroundColor: themeColors.card, borderColor: themeColors.border }, active && [styles.chipActive, { backgroundColor: themeColors.primary, borderColor: themeColors.primary }]]} onPress={() => setSelected((current) => active ? current.filter((id) => id !== category._id) : [...current, category._id])}>
                <Ionicons name={icons[index % icons.length]} size={20} color={active ? '#fff' : themeColors.textMuted} />
                <Text style={[styles.chipText, { color: themeColors.textMuted }, active && styles.chipTextActive]}>{category.name.en}</Text>
              </Pressable>
            })}
          </ScrollView>}
          <Pressable disabled={!selected.length} style={[styles.next, !selected.length && styles.nextDisabled]} onPress={() => setStep('LOCATION')}><Text style={styles.nextText}>Next</Text><Ionicons name="arrow-forward" size={20} color="#fff" /></Pressable>
        </>
      ) : (
        <>
          <Text style={[styles.title, { color: themeColors.text }]}>Select your location</Text>
          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>Pick a state for local news, or choose All India for nationwide updates.</Text>
          {loading ? <AarambhLoader size="md" style={styles.loader} /> : <ScrollView contentContainerStyle={styles.grid}>
            {pills.map((item) => {
              const active = selectedLocation?._id === item._id
              const isGlobal = item._id === ALL_INDIA._id
              return <Pressable key={item._id} style={[styles.chip, { backgroundColor: themeColors.card, borderColor: themeColors.border }, active && [styles.chipActive, { backgroundColor: themeColors.primary, borderColor: themeColors.primary }]]} onPress={() => setSelectedLocation(active ? null : item)}>
                <Ionicons name={isGlobal ? 'globe-outline' : 'location-outline'} size={20} color={active ? '#fff' : themeColors.textMuted} />
                <Text style={[styles.chipText, { color: themeColors.textMuted }, active && styles.chipTextActive]}>{item.name.en}</Text>
              </Pressable>
            })}
          </ScrollView>}
          <Pressable disabled={!canProceed} style={[styles.next, !canProceed && styles.nextDisabled, { marginTop: 6 }]} onPress={() => finish(false)}><Text style={styles.nextText}>Next</Text><Ionicons name="arrow-forward" size={20} color="#fff" /></Pressable>
          <View style={styles.footerRow}>
            <Pressable style={styles.secondary} onPress={() => setStep('INTERESTS')}><Ionicons name="arrow-back" size={18} color={colors.primary} /><Text style={styles.secondaryText}>Back</Text></Pressable>
            <Pressable style={styles.secondary} onPress={() => finish(true)}><Ionicons name="flash-outline" size={18} color={colors.primary} /><Text style={styles.secondaryText}>Skip / All India</Text></Pressable>
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  brand: { alignItems: 'center', marginTop: 30, marginBottom: 42 },
  brandLogo: { width: 220, height: 76 },
  title: { fontFamily: fonts.serif[700], fontSize: 28, color: colors.text, textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8 },
  loader: { marginTop: 50 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, paddingVertical: 28, paddingBottom: 20 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: colors.border, borderRadius: 24, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  next: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 15, marginTop: 'auto' },
  nextDisabled: { opacity: 0.45 },
  nextText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingBottom: 8 },
  secondary: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 6 },
  secondaryText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
})