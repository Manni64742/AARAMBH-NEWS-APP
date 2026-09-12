import React, { useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LocationState } from '../types'
import { colors, fonts } from '../theme'
import { useLocation } from '../context/LocationContext'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { userApi } from '../api/endpoints'
import { useTheme } from '../context/ThemeContext'
import { ScaledText as Text } from '../components/ScaledText'
import { AtmosphereBackground } from '../components/AtmosphereBackground'
import { AarambhLoader } from '../components/AarambhLoader'

const POPULAR_CITIES: Array<{ name: string; state: string }> = [
  { name: 'Mumbai', state: 'Maharashtra' },
  { name: 'Delhi', state: 'Delhi' },
  { name: 'Patna', state: 'Bihar' },
  { name: 'Bengaluru', state: 'Karnataka' },
  { name: 'Kolkata', state: 'West Bengal' },
  { name: 'Pune', state: 'Maharashtra' },
  { name: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Hyderabad', state: 'Telangana' },
  { name: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Jaipur', state: 'Rajasthan' },
  { name: 'Lucknow', state: 'Uttar Pradesh' },
  { name: 'Varanasi', state: 'Uttar Pradesh' },
  { name: 'Chandigarh', state: 'Chandigarh' },
  { name: 'Guwahati', state: 'Assam' },
  { name: 'Bhopal', state: 'Madhya Pradesh' },
  { name: 'Surat', state: 'Gujarat' },
  { name: 'Indore', state: 'Madhya Pradesh' },
  { name: 'Nagpur', state: 'Maharashtra' },
  { name: 'Kochi', state: 'Kerala' },
  { name: 'Amritsar', state: 'Punjab' },
]

const ICONS = ['business-outline', 'flag-outline', 'compass-outline', 'home-outline', 'map-outline', 'pin-outline', 'location-outline', 'navigate-outline', 'bulb-outline', 'cafe-outline', 'train-outline', 'restaurant-outline', 'trail-sign-outline', 'earth-outline', 'water-outline', 'storefront-outline', 'shield-outline', 'boat-outline', 'leaf-outline'] as const

export default function LocationPickerScreen({ navigation }: any) {
  const { colors: themeColors } = useTheme()
  const { detect, setManual, current } = useLocation()
  const { user } = useAuth()
  const { success } = useToast()
  const [gpsLoading, setGpsLoading] = useState(false)
  const [overlayMode, setOverlayMode] = useState<'listing' | 'other' | null>(null)
  const [otherCity, setOtherCity] = useState('')

  const useGps = async () => {
    setGpsLoading(true)
    try {
      const loc = await detect()
      if (loc) {
        success(`Location detected: ${loc.label}`)
        navigation.goBack()
      }
    } finally {
      setGpsLoading(false)
    }
  }

  const saveSelected = async (loc: LocationState) => {
    await setManual(loc)
    if (user) await userApi.updateProfile({ location: loc }).catch(() => {})
    success(`Location set to ${loc.label || 'selected location'}`)
    navigation.goBack()
  }

  const placePick = (entry: { name: string; state: string }) => {
    toggleListing(entry)
  }

  const saveAll = async () => {
    await saveSelected({ country: 'India', label: 'All India' })
  }

  const saveOther = async () => {
    const trimmed = otherCity.trim()
    if (!trimmed) return
    await saveSelected({ city: trimmed, label: trimmed })
  }

  const toggleListing = (city: { name: string; state: string }) => {
    const currentArr = current?.multiCity || current?.cities || []
    const exists = currentArr.includes(city.name) || current?.label?.toLowerCase() === city.name.toLowerCase()
    const next = exists ? currentArr.filter((c) => c !== city.name) : [...currentArr, city.name]
    const loc: LocationState = {
      ...current,
      country: 'India',
      multiCity: next,
      label: next.length ? next.join(', ') : undefined,
    }
    setManual(loc).catch(() => {})
  }

  const placesSelected = (city: { name: string; state: string }) => {
    const currentArr = current?.multiCity || current?.cities || []
    return currentArr.includes(city.name) || current?.label?.toLowerCase() === city.name.toLowerCase()
  }

  const selectedCount = (current?.multiCity || current?.cities || []).length
  const allSelected = current?.label === 'All India'

  const listingGrid = (
    <ScrollView style={styles.overlayBody} contentContainerStyle={styles.listingGrid} showsVerticalScrollIndicator={false}>
      {POPULAR_CITIES.map((city, index) => {
        const active = placesSelected(city)
        return (
          <Pressable key={city.name} style={[styles.listingChip, active && styles.listingChipActive, { borderColor: themeColors.border, backgroundColor: active ? colors.primary : themeColors.card }]} onPress={() => toggleListing(city)}>
            <Ionicons name={active ? 'checkmark-circle' : ICONS[index % ICONS.length]} size={16} color={active ? '#fff' : themeColors.textMuted} />
            <Text style={[styles.listingChipText, { color: active ? '#fff' : themeColors.text }]}>{city.name}</Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )

  return (
    <View style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <AtmosphereBackground />
      <Pressable style={[styles.gpsBtn, { backgroundColor: themeColors.primary }]} onPress={useGps}>
        {gpsLoading ? <AarambhLoader size="sm" color="#fff" /> : <Ionicons name="navigate" size={18} color="#fff" />}
        <Text style={styles.gpsText}>Use my GPS location</Text>
      </Pressable>

      <View style={[styles.header, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.heading, { color: themeColors.text }]}>Choose your locations</Text>
        <Text style={[styles.subHeading, { color: themeColors.textMuted }]}>Tap to select one or more places for your local news feed.</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.gridScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.chipGrid}>
        {POPULAR_CITIES.map((city, index) => {
          const active = placesSelected(city)
          return (
            <Pressable key={city.name} style={[styles.popularChip, active && styles.popularChipActive, { backgroundColor: active ? colors.primary : themeColors.card, borderColor: themeColors.border }]} onPress={() => placePick(city)}>
              <Ionicons name={active ? 'checkmark-circle' : ICONS[index % ICONS.length]} size={18} color={active ? '#fff' : themeColors.textMuted} />
              <Text style={[styles.popularChipText, { color: active ? '#fff' : themeColors.text }]} numberOfLines={1}>{city.name}</Text>
            </Pressable>
          )
        })}

        <Pressable style={[styles.popularChip, { backgroundColor: allSelected ? colors.primary : themeColors.card, borderColor: themeColors.border }]} onPress={saveAll}>
          <Ionicons name={allSelected ? 'checkmark-circle' : 'earth-outline'} size={18} color={allSelected ? '#fff' : themeColors.textMuted} />
          <Text style={[styles.popularChipText, { color: allSelected ? '#fff' : themeColors.text }]} numberOfLines={1}>All India</Text>
        </Pressable>

        <Pressable style={[styles.popularChip, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderStyle: 'dashed' }]} onPress={() => setOverlayMode('other')}>
          <Ionicons name="add-circle-outline" size={18} color={themeColors.primary} />
          <Text style={[styles.popularChipText, { color: themeColors.primary }]} numberOfLines={1}>Other</Text>
        </Pressable>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable style={[styles.saveBtn, { backgroundColor: themeColors.primary, opacity: selectedCount ? 1 : 0.45 }]} disabled={!selectedCount} onPress={() => setOverlayMode('listing')}>
          <Text style={styles.saveBtnText}>Next ({selectedCount} selected)</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
      </View>

      <Modal visible={overlayMode === 'listing'} animationType="slide" transparent onRequestClose={() => setOverlayMode(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Confirm your locations</Text>
              <Pressable onPress={() => setOverlayMode(null)}><Ionicons name="close" size={24} color={themeColors.textLight} /></Pressable>
            </View>
            <Text style={[styles.modalSub, { color: themeColors.textMuted }]}>Review and adjust your selection.</Text>
            {listingGrid}
            <View style={styles.modalFooter}>
              <Pressable style={[styles.saveBtn, { backgroundColor: themeColors.primary }]} onPress={() => {
                const arr = current?.multiCity || current?.cities || []
                const loc: LocationState = { ...current, country: 'India', multiCity: arr, label: arr.length ? arr.join(', ') : undefined }
                saveSelected(loc)
              }}>
                <Text style={styles.saveBtnText}>Save ({selectedCount} selected)</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={overlayMode === 'other'} animationType="fade" transparent onRequestClose={() => setOverlayMode(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Enter your location</Text>
              <Pressable onPress={() => setOverlayMode(null)}><Ionicons name="close" size={24} color={themeColors.textLight} /></Pressable>
            </View>
            <Text style={[styles.modalSub, { color: themeColors.textMuted }]}>Type a city, area or country outside India.</Text>
            <TextInput
              style={[styles.otherInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
              placeholder="e.g. London, New York, Dubai"
              placeholderTextColor={themeColors.textLight}
              value={otherCity}
              onChangeText={setOtherCity}
              autoFocus
            />
            <View style={styles.modalFooter}>
              <Pressable style={[styles.saveBtn, { backgroundColor: themeColors.primary, opacity: otherCity.trim() ? 1 : 0.45 }]} disabled={!otherCity.trim()} onPress={saveOther}>
                <Text style={styles.saveBtnText}>Save location</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: 14, marginHorizontal: 16, borderRadius: 12, marginTop: 14 },
  gpsText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  heading: { fontFamily: fonts.sans[700], fontSize: 22, textAlign: 'center' },
  subHeading: { fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 19, paddingHorizontal: 24 },
  header: { paddingTop: 24, paddingHorizontal: 16, backgroundColor: colors.bg },
  gridScroll: { paddingTop: 20, paddingBottom: 150, alignItems: 'center' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 16, maxWidth: 420 },
  popularChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 24, paddingHorizontal: 14, paddingVertical: 10 },
  popularChipActive: { borderColor: colors.primary },
  popularChipText: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 15 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  bottomBar: { paddingHorizontal: 24, paddingBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, paddingTop: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 6 },
  modalTitle: { fontFamily: fonts.sans[700], fontSize: 18 },
  modalSub: { paddingHorizontal: 20, fontSize: 13, marginBottom: 6 },
  overlayBody: { flex: 1 },
  listingGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 9, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20 },
  listingChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 24, paddingHorizontal: 13, paddingVertical: 9 },
  listingChipActive: { borderColor: colors.primary },
  listingChipText: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  otherInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginHorizontal: 20, marginTop: 12 },
  modalFooter: { paddingHorizontal: 20, paddingVertical: 16 },
})
