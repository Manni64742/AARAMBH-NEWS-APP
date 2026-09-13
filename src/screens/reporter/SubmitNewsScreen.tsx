import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { Ionicons } from '@expo/vector-icons'
import { categoryApi, contentApi, locationApi, mediaApi } from '../../api/endpoints'
import { ArticleBlock, CategoryItem, ContentItem, ContentType, LocationItem } from '../../types'
import { useToast } from '../../context/ToastContext'
import { useLocation } from '../../context/LocationContext'
import { useAuth } from '../../context/AuthContext'
import { errorMessage } from '../../api/client'
import { mediaUrl } from '../../config'
import { colors as defaultColors, fonts } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import ArticleBlockEditor from '../../components/reporter/ArticleBlockEditor'

const TYPES: Array<{ key: ContentType; label: string }> = [
  { key: 'ARTICLE', label: 'Article' },
  { key: 'SHORT_NEWS', label: 'Short News' },
  { key: 'VIDEO', label: 'Video' },
  { key: 'SHORT_VIDEO', label: 'Short Video' },
  { key: 'AUDIO', label: 'Audio' },
]

const INDIAN_LOCATIONS = [
  { name: 'All India (National)', scope: 'NATIONAL' },
  { name: 'International (World)', scope: 'INTERNATIONAL' },
  { name: 'Uttar Pradesh', scope: 'STATE' },
  { name: 'Bihar', scope: 'STATE' },
  { name: 'Madhya Pradesh', scope: 'STATE' },
  { name: 'Delhi NCR', scope: 'STATE' },
  { name: 'Maharashtra', scope: 'STATE' },
  { name: 'Rajasthan', scope: 'STATE' },
  { name: 'Haryana', scope: 'STATE' },
  { name: 'Punjab', scope: 'STATE' },
  { name: 'Gujarat', scope: 'STATE' },
  { name: 'West Bengal', scope: 'STATE' },
  { name: 'Jharkhand', scope: 'STATE' },
  { name: 'Chhattisgarh', scope: 'STATE' },
  { name: 'Uttarakhand', scope: 'STATE' },
  { name: 'Himachal Pradesh', scope: 'STATE' },
  { name: 'Karnataka', scope: 'STATE' },
  { name: 'Tamil Nadu', scope: 'STATE' },
  { name: 'Telangana', scope: 'STATE' },
  { name: 'Andhra Pradesh', scope: 'STATE' },
  { name: 'Kerala', scope: 'STATE' },
  { name: 'Assam', scope: 'STATE' },
  { name: 'Odisha', scope: 'STATE' },
  { name: 'Goa', scope: 'STATE' },
  { name: 'Jammu & Kashmir', scope: 'STATE' },
  { name: 'Ladakh', scope: 'STATE' },
  { name: 'Tripura', scope: 'STATE' },
  { name: 'Meghalaya', scope: 'STATE' },
  { name: 'Manipur', scope: 'STATE' },
  { name: 'Nagaland', scope: 'STATE' },
  { name: 'Mizoram', scope: 'STATE' },
  { name: 'Arunachal Pradesh', scope: 'STATE' },
  { name: 'Sikkim', scope: 'STATE' },
]

const DRAFT_TTL = 1000 * 60 * 60 * 24 * 3

export default function SubmitNewsScreen({ navigation, route }: any) {
  const { success, error } = useToast()
  const { colors } = useTheme()
  const { current: gpsLocation } = useLocation()
  const { user } = useAuth()
  const editing = !!(route?.params?.item)
  const item: ContentItem | undefined = route?.params?.item

  const [contentType, setContentType] = useState<ContentType>(item?.contentType || 'ARTICLE')
  const [title, setTitle] = useState(item?.title || '')
  const [summary, setSummary] = useState(item?.summary || '')
  const [blocks, setBlocks] = useState<ArticleBlock[]>(item?.bodyBlocks?.map((b) => ({ ...b })) || [])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [category, setCategory] = useState(item?.category?._id || (typeof item?.category === 'string' ? item.category : ''))
  const [subCategory, setSubCategory] = useState(item?.subCategory?._id || (typeof item?.subCategory === 'string' ? item.subCategory : ''))
  const [tags, setTags] = useState((item?.tags || []).join(', '))
  const [language, setLanguage] = useState(item?.language || 'hi')
  const [featuredImage, setFeaturedImage] = useState<{ url: string } | null>(item?.featuredImage || null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [mediaUrlState, setMediaUrlState] = useState<{ url: string; kind: 'VIDEO' | 'AUDIO' | 'SHORT_VIDEO' } | null>(null)
  const [loc, setLoc] = useState(
    item?.location?.primary
      ? { state: item.location.primary.state || '', district: item.location.primary.district || '', city: item.location.primary.city || '', locality: item.location.primary.locality || '' }
      : { state: '', district: '', city: '', locality: '' }
  )
  const [scope, setScope] = useState<'NATIONAL' | 'INTERNATIONAL' | 'STATE' | 'DISTRICT'>(
    (item?.location?.scope as any) || 'NATIONAL'
  )

  const [busy, setBusy] = useState(false)
  const draftKey = `aarambh_article_draft_${user?._id || 'anon'}`
  const saveTimer = useRef<any>(null)

  // Modals
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationSearch, setLocationSearch] = useState('')
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  useEffect(() => {
    navigation.setOptions({ title: editing ? 'Edit Article' : 'Create Article' })
    categoryApi
      .tree()
      .then((tree) => {
        if (Array.isArray(tree) && tree.length > 0) setCategories(tree)
        else categoryApi.list().then(setCategories).catch(() => {})
      })
      .catch(() => categoryApi.list().then(setCategories).catch(() => {}))

    if (!editing) {
      AsyncStorage.getItem(draftKey)
        .then((s) => {
          if (!s) return
          try {
            const d = JSON.parse(s)
            if (Date.now() - (d.savedAt || 0) > DRAFT_TTL) {
              AsyncStorage.removeItem(draftKey).catch(() => {})
              return
            }
            if (d.title) setTitle(d.title)
            if (typeof d.summary === 'string') setSummary(d.summary)
            if (d.contentType) setContentType(d.contentType)
            if (Array.isArray(d.blocks)) setBlocks(d.blocks)
            if (d.category) setCategory(d.category)
            if (d.subCategory) setSubCategory(d.subCategory)
            if (typeof d.tags === 'string') setTags(d.tags)
            if (d.language) setLanguage(d.language)
            if (d.featuredImage) setFeaturedImage(d.featuredImage)
            if (d.mediaUrl) setMediaUrlState(d.mediaUrl)
            if (d.loc) setLoc((prev) => ({ ...prev, ...d.loc }))
            if (d.scope) setScope(d.scope)
            success('Recovered your last unsaved draft')
            AsyncStorage.removeItem(draftKey).catch(() => {})
          } catch {
            AsyncStorage.removeItem(draftKey).catch(() => {})
          }
        })
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (editing || busy) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(
        draftKey,
        JSON.stringify({
          title,
          summary,
          contentType,
          category,
          subCategory,
          tags,
          language,
          loc,
          scope,
          featuredImage,
          mediaUrl: mediaUrlState,
          blocks,
          savedAt: Date.now(),
        })
      ).catch(() => {})
    }, 1500)
    return () => clearTimeout(saveTimer.current)
  }, [title, summary, contentType, category, subCategory, tags, language, loc, scope, featuredImage, blocks, mediaUrlState])

  const clearDraft = () => AsyncStorage.removeItem(draftKey).catch(() => {})

  const uploadImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 })
      if (result.canceled || !result.assets?.[0]) return
      const file = result.assets[0]
      setUploadingImage(true)
      const res = await mediaApi.upload({ uri: file.uri, name: file.fileName || 'image.jpg', type: file.mimeType || 'image/jpeg' })
      setFeaturedImage({ url: res.url })
      success('Cover image uploaded to server ✓')
    } catch (e) {
      error(errorMessage(e, 'Upload failed'))
    } finally {
      setUploadingImage(false)
    }
  }

  const pickMedia = async (kind: 'VIDEO' | 'AUDIO' | 'SHORT_VIDEO') => {
    const type = kind === 'AUDIO' ? 'audio/*' : 'video/*'
    const result = await DocumentPicker.getDocumentAsync({ type, copyToCacheDirectory: true })
    if (result.canceled || !result.assets?.[0]) return
    const file = result.assets[0]
    try {
      const res = await mediaApi.upload({
        uri: file.uri,
        name: file.name,
        type: file.mimeType || (kind === 'AUDIO' ? 'audio/mpeg' : 'video/mp4'),
      })
      setMediaUrlState({ url: res.url, kind })
      success('Media uploaded')
    } catch (e) {
      error(errorMessage(e, 'Upload failed'))
    }
  }

  const validateForPreview = () => {
    if (!title.trim() || title.trim().length < 5) {
      error('Please provide a headline (minimum 5 characters)')
      return false
    }
    const catToUse = category || categories.find((c) => c.slug === 'national' || c.slug === 'india')?._id || categories[0]?._id
    if (!catToUse && categories.length > 0) {
      error('Please select a category')
      return false
    }
    return true
  }

  const openPreview = () => {
    if (!validateForPreview()) return
    setShowPreviewModal(true)
  }

  const save = async (status: 'DRAFT' | 'PENDING_REVIEW') => {
    if (!title.trim() || title.trim().length < 5) {
      error('Title is required (minimum 5 characters)')
      return
    }
    const catToSave = category || categories.find((c) => c.slug === 'national' || c.slug === 'india')?._id || categories[0]?._id
    if (!catToSave && categories.length > 0) {
      error('Please choose a category')
      return
    }
    setBusy(true)
    try {
      const bodyBlocks = blocks.map((b) => ({ ...b }))
      const determinedScope =
        loc.district ? 'DISTRICT' : loc.state ? 'STATE' : scope || 'NATIONAL'

      const location: any = {
        primary: { state: loc.state, district: loc.district, city: loc.city, locality: loc.locality },
        scope: determinedScope,
      }
      const payload: Record<string, any> = {
        title: title.trim(),
        summary: summary.trim() || undefined,
        bodyBlocks,
        featuredImage: featuredImage || null,
        contentType,
        status,
        category: catToSave,
        subCategory: subCategory || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        language,
        visibility: 'PUBLIC',
        location,
      }
      if (mediaUrlState?.kind === 'VIDEO') payload.videoPayload = { videoUrl: mediaUrlState.url }
      if (mediaUrlState?.kind === 'SHORT_VIDEO') payload.shortVideoPayload = { videoUrl: mediaUrlState.url }
      if (mediaUrlState?.kind === 'AUDIO') payload.audioPayload = { audioUrl: mediaUrlState.url }

      const saved: ContentItem = editing && item ? await contentApi.update(item._id, payload) : await contentApi.create(payload)
      await clearDraft()
      setShowPreviewModal(false)
      const finalStatus = saved.status
      if (finalStatus === 'PUBLISHED') success('Your article is now live 🎉')
      else if (finalStatus === 'PENDING_REVIEW') success('Submitted for review! Editorial desk has been notified.')
      else success('Draft saved successfully')
      navigation.goBack()
    } catch (e) {
      error(errorMessage(e, 'Failed to submit'))
    } finally {
      setBusy(false)
    }
  }

  const selectedCatObj = categories.find((c) => c._id === category)
  const availableSubCats = (selectedCatObj?.subCategories || []).filter((s) => s.isActive !== false)

  const selectedCatLabel = selectedCatObj
    ? (language === 'hi' ? (selectedCatObj.name?.hi || selectedCatObj.name?.en) : (selectedCatObj.name?.en || selectedCatObj.name?.hi))
    : (language === 'hi' ? 'सभी / राष्ट्रीय' : 'All / National')

  const selectedSubCatObj = availableSubCats.find((s) => s._id === subCategory)
  const selectedSubCatLabel = selectedSubCatObj
    ? (language === 'hi' ? (selectedSubCatObj.name?.hi || selectedSubCatObj.name?.en) : (selectedSubCatObj.name?.en || selectedSubCatObj.name?.hi))
    : (language === 'hi' ? 'सभी / मुख्य' : 'All / General')

  const filteredLocations = INDIAN_LOCATIONS.filter((l) => {
    if (!locationSearch.trim()) return true
    return l.name.toLowerCase().includes(locationSearch.toLowerCase())
  })

  const locationDisplayText =
    loc.state && loc.district
      ? `${loc.district}, ${loc.state}`
      : loc.state
      ? loc.state
      : scope === 'INTERNATIONAL'
      ? 'International (World)'
      : 'All India (National)'

  return (
    <ScrollView
      style={[styles.safe, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
    >
      {editing && item?.status ? (
        <View style={[styles.statusBanner, { backgroundColor: colors.surfaceContainer, borderColor: colors.primary }]}>
          <Text style={[styles.statusText, { color: colors.textMuted }]}>
            Editing submission · Status: <Text style={{ color: colors.primary, fontWeight: '800' }}>{item.status.replace(/_/g, ' ')}</Text>
          </Text>
        </View>
      ) : null}

      {/* Content Type Selector */}
      <Text style={[styles.label, { color: colors.text }]}>Content Type</Text>
      <View style={styles.typeRow}>
        {TYPES.map((t) => (
          <Pressable
            key={t.key}
            style={[
              styles.typeChip,
              { backgroundColor: colors.surfaceContainer },
              contentType === t.key && { backgroundColor: colors.primary },
            ]}
            onPress={() => setContentType(t.key)}
          >
            <Text style={[styles.typeText, { color: colors.textMuted }, contentType === t.key && styles.typeTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Headline */}
      <Text style={[styles.label, { color: colors.text }]}>Headline *</Text>
      <TextInput
        style={[styles.input, styles.headline, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        value={title}
        onChangeText={setTitle}
        placeholder="Compelling headline (min 5 characters)"
        placeholderTextColor={colors.textLight}
      />

      {/* Standfirst / Summary */}
      <Text style={[styles.label, { color: colors.text }]}>Summary / Standfirst</Text>
      <TextInput
        style={[styles.input, { minHeight: 65, backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        value={summary}
        onChangeText={setSummary}
        placeholder="Brief summary or introductory lead..."
        placeholderTextColor={colors.textLight}
        multiline
      />

      {/* Featured Cover Image */}
      <Text style={[styles.label, { color: colors.text }]}>Featured Cover Image</Text>
      <Pressable
        style={[styles.uploadBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
        onPress={uploadImage}
        disabled={uploadingImage}
      >
        <Ionicons name={uploadingImage ? 'cloud-upload' : 'image'} size={20} color={colors.primary} />
        <Text style={[styles.uploadText, { color: colors.primary }]}>
          {uploadingImage ? 'Uploading image...' : featuredImage ? 'Change Cover Image' : 'Upload Cover Image'}
        </Text>
      </Pressable>

      {featuredImage ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: mediaUrl(featuredImage.url) }} style={styles.preview} resizeMode="cover" />
          <Pressable style={styles.removeImgBtn} onPress={() => setFeaturedImage(null)}>
            <Ionicons name="close" size={18} color="#fff" />
          </Pressable>
        </View>
      ) : null}

      {/* Story Blocks Canvas */}
      {(contentType === 'ARTICLE' || contentType === 'SHORT_NEWS') && (
        <View style={{ marginTop: 14 }}>
          <ArticleBlockEditor blocks={blocks} onChange={setBlocks} />
        </View>
      )}

      {/* Video / Audio Pickers */}
      {(contentType === 'VIDEO' || contentType === 'SHORT_VIDEO') && (
        <>
          <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>Video File</Text>
          <Pressable
            style={[styles.uploadBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
            onPress={() => pickMedia(contentType === 'SHORT_VIDEO' ? 'SHORT_VIDEO' : 'VIDEO')}
          >
            <Ionicons name="videocam" size={20} color={colors.primary} />
            <Text style={[styles.uploadText, { color: colors.primary }]}>
              {mediaUrlState ? 'Video attached ✓ (tap to change)' : 'Upload Video File'}
            </Text>
          </Pressable>
        </>
      )}

      {contentType === 'AUDIO' && (
        <>
          <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>Audio Recording / Podcast</Text>
          <Pressable
            style={[styles.uploadBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
            onPress={() => pickMedia('AUDIO')}
          >
            <Ionicons name="mic" size={20} color={colors.primary} />
            <Text style={[styles.uploadText, { color: colors.primary }]}>
              {mediaUrlState ? 'Audio attached ✓ (tap to change)' : 'Upload Audio File'}
            </Text>
          </Pressable>
        </>
      )}

      {/* Category Selection (Full-width wrapping, NO horizontal scroll) */}
      <Text style={[styles.label, { color: colors.text, marginTop: 22 }]}>Category *</Text>
      <View style={styles.categoryWrap}>
        <Pressable
          style={[
            styles.catChip,
            { backgroundColor: colors.surfaceContainer, borderColor: colors.border },
            !category && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={() => {
            setCategory('')
            setSubCategory('')
          }}
        >
          <Text style={[styles.catChipText, { color: colors.textMuted }, !category && styles.catChipTextActive]}>
            {language === 'hi' ? 'सभी / राष्ट्रीय' : 'All / National'}
          </Text>
        </Pressable>

        {categories.map((cat) => {
          const isSelected = category === cat._id
          const catName = language === 'hi' ? (cat.name?.hi || cat.name?.en) : (cat.name?.en || cat.name?.hi)
          return (
            <Pressable
              key={cat._id}
              style={[
                styles.catChip,
                { backgroundColor: colors.surfaceContainer, borderColor: colors.border },
                isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => {
                setCategory(cat._id)
                setSubCategory('')
              }}
            >
              <Text style={[styles.catChipText, { color: colors.textMuted }, isSelected && styles.catChipTextActive]}>
                {catName}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {/* Dynamic Sub-Category Selection (Full-width wrapping, NO horizontal scroll) */}
      {availableSubCats.length > 0 && (
        <>
          <Text style={[styles.label, { color: colors.text, marginTop: 6 }]}>Sub-Category</Text>
          <View style={styles.subCatWrap}>
            <Pressable
              style={[
                styles.subCatChip,
                { backgroundColor: colors.surfaceContainer, borderColor: colors.border },
                !subCategory && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setSubCategory('')}
            >
              <Text style={[styles.subCatText, { color: colors.textMuted }, !subCategory && styles.subCatTextActive]}>
                {language === 'hi' ? 'सभी / मुख्य' : 'All / General'}
              </Text>
            </Pressable>
            {availableSubCats.map((sub) => {
              const isSubSelected = subCategory === sub._id
              const subName = language === 'hi' ? (sub.name?.hi || sub.name?.en) : (sub.name?.en || sub.name?.hi)
              return (
                <Pressable
                  key={sub._id}
                  style={[
                    styles.subCatChip,
                    { backgroundColor: colors.surfaceContainer, borderColor: colors.border },
                    isSubSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setSubCategory(sub._id)}
                >
                  <Text
                    style={[
                      styles.subCatText,
                      { color: colors.textMuted },
                      isSubSelected && styles.subCatTextActive,
                    ]}
                  >
                    {subName}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </>
      )}

      {/* Location & Scope (Sleek, thin single-row design) */}
      <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Location & Scope</Text>
      <View style={[styles.locationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable
          style={styles.locationChipRow}
          onPress={() => setShowLocationModal(true)}
        >
          <View style={[styles.selectedLocationChip, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
            <Ionicons
              name={scope === 'INTERNATIONAL' ? 'globe-outline' : scope === 'STATE' ? 'business-outline' : 'flag'}
              size={13}
              color={colors.primary}
            />
            <Text style={[styles.selectedLocationText, { color: colors.primary }]}>{locationDisplayText}</Text>
          </View>
        </Pressable>

        <View style={styles.locationActionsRow}>
          {scope !== 'NATIONAL' && (
            <Pressable
              style={[styles.resetLocationBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}
              onPress={() => {
                setScope('NATIONAL')
                setLoc({ state: '', district: '', city: '', locality: '' })
              }}
              hitSlop={6}
            >
              <Ionicons name="refresh" size={12} color={colors.textMuted} />
              <Text style={[styles.resetLocationText, { color: colors.textMuted }]}>Reset</Text>
            </Pressable>
          )}

          <Pressable
            style={[styles.locationChangeBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}
            onPress={() => setShowLocationModal(true)}
          >
            <Ionicons name="search" size={12} color={colors.text} />
            <Text style={[styles.locationChangeText, { color: colors.text }]}>Change</Text>
          </Pressable>
        </View>
      </View>

      {/* Tags */}
      <Text style={[styles.label, { color: colors.text }]}>Tags (comma separated)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        value={tags}
        onChangeText={setTags}
        placeholder="election, development, sports, crime"
        placeholderTextColor={colors.textLight}
      />

      {/* Language */}
      <Text style={[styles.label, { color: colors.text }]}>Article Language</Text>
      <View style={styles.typeRow}>
        <Pressable
          style={[
            styles.typeChip,
            { backgroundColor: colors.surfaceContainer },
            language === 'hi' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setLanguage('hi')}
        >
          <Text style={[styles.typeText, { color: colors.textMuted }, language === 'hi' && styles.typeTextActive]}>
            हिन्दी (Hindi)
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.typeChip,
            { backgroundColor: colors.surfaceContainer },
            language === 'en' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setLanguage('en')}
        >
          <Text style={[styles.typeText, { color: colors.textMuted }, language === 'en' && styles.typeTextActive]}>
            English
          </Text>
        </Pressable>
      </View>

      {/* Action Buttons: Save Draft & Preview */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, styles.btnOutline, { backgroundColor: colors.card, borderColor: colors.primary }]}
          onPress={() => save('DRAFT')}
          disabled={busy}
        >
          <Ionicons name="save-outline" size={17} color={colors.primary} />
          <Text style={[styles.btnOutlineText, { color: colors.primary }]}>Save Draft</Text>
        </Pressable>

        <Pressable
          style={[styles.btn, styles.btnPrimary, { backgroundColor: colors.primary }]}
          onPress={openPreview}
          disabled={busy}
        >
          <Ionicons name="eye-outline" size={18} color="#fff" />
          <Text style={styles.btnPrimaryText}>Preview Article</Text>
        </Pressable>
      </View>

      <Text style={[styles.note, { color: colors.textLight }]}>
        Tap "Preview Article" to verify formatting before sending to the editorial desk for moderation.
      </Text>

      {/* Location Picker Modal */}
      <Modal visible={showLocationModal} transparent animationType="slide" onRequestClose={() => setShowLocationModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Location Scope</Text>
              <Pressable onPress={() => setShowLocationModal(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <View style={[styles.searchBox, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
              <Ionicons name="search" size={16} color={colors.textLight} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                value={locationSearch}
                onChangeText={setLocationSearch}
                placeholder="Search states (e.g. Uttar Pradesh, Bihar)..."
                placeholderTextColor={colors.textLight}
              />
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {filteredLocations.map((locItem) => {
                const isSelected =
                  (locItem.scope === 'NATIONAL' && scope === 'NATIONAL' && !loc.state) ||
                  (locItem.scope === 'INTERNATIONAL' && scope === 'INTERNATIONAL') ||
                  (loc.state === locItem.name)

                return (
                  <Pressable
                    key={locItem.name}
                    style={[
                      styles.modalOption,
                      { borderBottomColor: colors.border },
                      isSelected && { backgroundColor: colors.primarySoft },
                    ]}
                    onPress={() => {
                      if (locItem.scope === 'NATIONAL') {
                        setScope('NATIONAL')
                        setLoc({ state: '', district: '', city: '', locality: '' })
                      } else if (locItem.scope === 'INTERNATIONAL') {
                        setScope('INTERNATIONAL')
                        setLoc({ state: '', district: '', city: '', locality: '' })
                      } else {
                        setScope('STATE')
                        setLoc({ state: locItem.name, district: '', city: '', locality: '' })
                      }
                      setShowLocationModal(false)
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Ionicons
                        name={
                          locItem.scope === 'NATIONAL'
                            ? 'flag-outline'
                            : locItem.scope === 'INTERNATIONAL'
                            ? 'globe-outline'
                            : 'location-outline'
                        }
                        size={18}
                        color={isSelected ? colors.primary : colors.textLight}
                      />
                      <Text style={[styles.modalOptionText, { color: isSelected ? colors.primary : colors.text }]}>
                        {locItem.name}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Realistic Reader Preview Modal */}
      <Modal visible={showPreviewModal} animationType="slide" onRequestClose={() => setShowPreviewModal(false)}>
        <View style={[styles.previewContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.previewNavBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowPreviewModal(false)} style={styles.previewBackBtn} hitSlop={8}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
              <Text style={[styles.previewBackText, { color: colors.text }]}>Back to Edit</Text>
            </Pressable>
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>READER PREVIEW</Text>
            </View>
          </View>

          {/* Article Reader Body */}
          <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 120 }}>
            {/* Category & Date */}
            <View style={styles.previewMetaRow}>
              <View style={[styles.previewCatPill, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.previewCatText, { color: colors.primary }]}>{selectedCatLabel}</Text>
              </View>
              <Text style={[styles.previewDate, { color: colors.textLight }]}>
                {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>

            {/* Headline */}
            <Text style={[styles.previewHeadline, { color: colors.text }]}>{title}</Text>

            {/* Standfirst / Summary */}
            {summary ? <Text style={[styles.previewSummary, { color: colors.textMuted }]}>{summary}</Text> : null}

            {/* Byline & Location */}
            <View style={[styles.previewBylineCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
              <View style={styles.bylineLeft}>
                <View style={[styles.bylineAvatar, { backgroundColor: colors.primarySoft }]}>
                  {user?.avatar ? (
                    <Image source={{ uri: mediaUrl(user.avatar) }} style={styles.avatarFill} />
                  ) : (
                    <Ionicons name="person" size={18} color={colors.primary} />
                  )}
                </View>
                <View>
                  <Text style={[styles.bylineName, { color: colors.text }]}>Reported by {user?.name || 'Aarambh Reporter'}</Text>
                  <Text style={[styles.bylineRole, { color: colors.textMuted }]}>Aarambh News Verified Journalist</Text>
                </View>
              </View>
              <View style={styles.bylineLoc}>
                <Ionicons name="location-sharp" size={13} color={colors.primary} />
                <Text style={[styles.bylineLocText, { color: colors.primary }]}>{locationDisplayText}</Text>
              </View>
            </View>

            {/* Cover Image */}
            {featuredImage?.url ? (
              <View style={styles.previewImgWrap}>
                <Image source={{ uri: mediaUrl(featuredImage.url) }} style={styles.previewCoverImg} resizeMode="cover" />
              </View>
            ) : null}

            {/* Body Blocks */}
            <View style={styles.previewBlocks}>
              {blocks.map((block) => {
                switch (block.type) {
                  case 'HEADING':
                    return (
                      <Text
                        key={block.id}
                        style={[
                          block.level === 'h3' ? styles.previewH3 : styles.previewH2,
                          { color: colors.text },
                        ]}
                      >
                        {block.text}
                      </Text>
                    )
                  case 'QUOTE':
                    return (
                      <View key={block.id} style={[styles.previewQuoteWrap, { borderLeftColor: colors.primary, backgroundColor: colors.surfaceContainer }]}>
                        <Ionicons name="chatbox-ellipses-outline" size={20} color={colors.primary} style={{ marginBottom: 4 }} />
                        <Text style={[styles.previewQuoteText, { color: colors.text }]}>“{block.text}”</Text>
                      </View>
                    )
                  case 'IMAGE':
                    return block.url ? (
                      <View key={block.id} style={styles.previewBlockImgWrap}>
                        <Image source={{ uri: mediaUrl(block.url) }} style={styles.previewBlockImg} resizeMode="cover" />
                        {block.caption ? (
                          <Text style={[styles.previewBlockCaption, { color: colors.textLight }]}>{block.caption}</Text>
                        ) : null}
                      </View>
                    ) : null
                  case 'DIVIDER':
                    return <View key={block.id} style={[styles.previewDivider, { borderColor: colors.border }]} />
                  case 'TEXT':
                  default:
                    return (
                      <Text key={block.id} style={[styles.previewParagraph, { color: colors.text }]}>
                        {block.html || ''}
                      </Text>
                    )
                }
              })}
            </View>

            {/* Tags */}
            {tags ? (
              <View style={styles.previewTagsRow}>
                {tags.split(',').map((t, idx) => (
                  <View key={idx} style={[styles.previewTagPill, { backgroundColor: colors.surfaceContainer }]}>
                    <Text style={[styles.previewTagText, { color: colors.textMuted }]}>#{t.trim()}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>

          {/* Sticky Bottom Submit Bar */}
          <View style={[styles.previewBottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <Pressable
              style={[styles.previewBtnOutline, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => setShowPreviewModal(false)}
            >
              <Text style={[styles.previewBtnOutlineText, { color: colors.text }]}>Edit</Text>
            </Pressable>
            <Pressable
              style={[styles.previewBtnSubmit, { backgroundColor: colors.primary }]}
              onPress={() => save('PENDING_REVIEW')}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#fff" />
                  <Text style={styles.previewBtnSubmitText}>
                    {editing ? 'Submit Changes' : 'Submit for Editorial Review 🚀'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: defaultColors.bg },
  statusBanner: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  blocksHeader: { borderBottomWidth: 1, marginBottom: 12, paddingBottom: 6 },
  blocksHint: { fontSize: 11, marginTop: 4, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    marginBottom: 8,
  },
  headline: { fontSize: 16, fontWeight: '700' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    flexGrow: 1,
    flexBasis: '30%',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: { fontSize: 13, fontWeight: '600' },
  typeTextActive: { color: '#fff' },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 14,
  },
  uploadText: { fontWeight: '700', fontSize: 13 },
  previewWrap: { position: 'relative', marginTop: 10 },
  preview: { width: '100%', height: 170, borderRadius: 12 },
  removeImgBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 14,
    padding: 5,
  },
  selectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 8,
  },
  selectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectorValue: { fontSize: 14, fontWeight: '600' },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 8 },
  categoryRow: { flexDirection: 'row', gap: 8, paddingVertical: 4, marginBottom: 12 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1 },
  catChipText: { fontSize: 12.5, fontWeight: '700' },
  catChipTextActive: { color: '#fff' },
  subCatWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 8 },
  subCatRow: { flexDirection: 'row', gap: 8, paddingVertical: 4, marginBottom: 12 },
  subCatChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  subCatText: { fontSize: 12, fontWeight: '600' },
  subCatTextActive: { color: '#fff', fontWeight: '700' },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  locationChipRow: {
    flex: 1,
    marginRight: 8,
  },
  selectedLocationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  selectedLocationText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  locationActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  locationChangeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resetLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetLocationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 26 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  btnOutline: { borderWidth: 1 },
  btnOutlineText: { fontWeight: '800', fontSize: 14 },
  btnPrimary: {},
  btnPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  note: { textAlign: 'center', fontSize: 12, marginTop: 14 },

  // Modal Styles
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, maxHeight: 520 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: '800' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginVertical: 12 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  modalOptionText: { fontSize: 14, fontWeight: '600' },

  // Reader Preview Styles
  previewContainer: { flex: 1 },
  previewNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  previewBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewBackText: { fontSize: 14, fontWeight: '700' },
  previewBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  previewBadgeText: { fontSize: 10, fontWeight: '800', color: '#D97706' },
  previewMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  previewCatPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  previewCatText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  previewDate: { fontSize: 12 },
  previewHeadline: { fontFamily: fonts.serif[700], fontSize: 24, lineHeight: 32, marginBottom: 10 },
  previewSummary: { fontSize: 15, fontStyle: 'italic', lineHeight: 22, marginBottom: 16 },
  previewBylineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  bylineLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bylineAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarFill: { width: '100%', height: '100%' },
  bylineName: { fontSize: 12, fontWeight: '700' },
  bylineRole: { fontSize: 10 },
  bylineLoc: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bylineLocText: { fontSize: 11, fontWeight: '700' },
  previewImgWrap: { width: '100%', height: 210, borderRadius: 14, overflow: 'hidden', marginBottom: 18 },
  previewCoverImg: { width: '100%', height: '100%' },
  previewBlocks: { gap: 12 },
  previewH2: { fontSize: 19, fontWeight: '800', marginTop: 12, marginBottom: 4 },
  previewH3: { fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 2 },
  previewParagraph: { fontSize: 15, lineHeight: 24 },
  previewQuoteWrap: { borderLeftWidth: 4, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8, marginVertical: 6 },
  previewQuoteText: { fontSize: 16, fontStyle: 'italic', lineHeight: 24 },
  previewBlockImgWrap: { marginVertical: 8 },
  previewBlockImg: { width: '100%', height: 180, borderRadius: 10 },
  previewBlockCaption: { fontSize: 11, textAlign: 'center', marginTop: 4 },
  previewDivider: { borderTopWidth: 1, borderStyle: 'dashed', marginVertical: 12 },
  previewTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 18 },
  previewTagPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  previewTagText: { fontSize: 12 },
  previewBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  previewBtnOutline: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewBtnOutlineText: { fontWeight: '700', fontSize: 14 },
  previewBtnSubmit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  previewBtnSubmitText: { color: '#fff', fontWeight: '800', fontSize: 14 },
})