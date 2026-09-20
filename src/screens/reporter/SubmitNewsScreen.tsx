import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { ScaledText as Text } from '../../components/ScaledText'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { Ionicons } from '@expo/vector-icons'
import { categoryApi, contentApi, locationApi, mediaApi } from '../../api/endpoints'
import {
  ArticleBlock,
  CategoryItem,
  ContentItem,
  ContentType,
  LocationItem,
  PriorityLevel,
  EditorialTone,
  SponsorType,
} from '../../types'
import { useToast } from '../../context/ToastContext'
import { useLocation } from '../../context/LocationContext'
import { useAuth } from '../../context/AuthContext'
import { errorMessage } from '../../api/client'
import { mediaUrl } from '../../config'
import { colors as defaultColors, fonts } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import ArticleBlockEditor from '../../components/reporter/ArticleBlockEditor'
import { ArticleWatermark } from '../../components/ArticleWatermark'
import { AdaptiveImage } from '../../components/AdaptiveImage'

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

const VISIBLE_CATEGORY_LIMIT = 12
const VISIBLE_SUB_CATEGORY_LIMIT = 10

export default function SubmitNewsScreen({ navigation, route }: any) {
  const { success, error } = useToast()
  const { colors, isDark } = useTheme()
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

  // Editorial Flags & Options
  const initialFlags = item?.flags || {}
  const [isBreaking, setIsBreaking] = useState(Boolean(initialFlags.isBreaking))
  const [isFeatured, setIsFeatured] = useState(Boolean(initialFlags.isFeatured))
  const [isExclusive, setIsExclusive] = useState(Boolean(initialFlags.isExclusive))
  const [isLiveCoverage, setIsLiveCoverage] = useState(Boolean(initialFlags.isLiveCoverage))
  const [priority, setPriority] = useState<PriorityLevel>(initialFlags.priority || 'NORMAL')
  const [editorialTone, setEditorialTone] = useState<EditorialTone>(initialFlags.editorialTone || 'NEWS')
  const [isSponsored, setIsSponsored] = useState(Boolean(initialFlags.isSponsored))
  const [sponsorName, setSponsorName] = useState(initialFlags.sponsorName || '')
  const [sendPushNotification, setSendPushNotification] = useState(Boolean(initialFlags.sendPushNotification))
  const [showEditorialOptions, setShowEditorialOptions] = useState(false)

  const [busy, setBusy] = useState(false)
  const draftKey = `aarambh_article_draft_${user?._id || 'anon'}`
  const saveTimer = useRef<any>(null)

  // Modals
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationSearch, setLocationSearch] = useState('')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false)
  const [subCategorySearch, setSubCategorySearch] = useState('')

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
      const contentFallback = bodyBlocks
        .map((b) => {
          if (b.type === 'TEXT') return b.html || ''
          if (b.type === 'HEADING' || b.type === 'QUOTE') return b.text || ''
          if (b.type === 'TABLE' && b.tableData) {
            const parts: string[] = []
            if (b.tableData.caption) parts.push(b.tableData.caption)
            if (b.tableData.headers) parts.push(b.tableData.headers.join(' | '))
            if (b.tableData.rows) b.tableData.rows.forEach((r) => parts.push(r.join(' | ')))
            return parts.join('\n')
          }
          return b.title || b.caption || ''
        })
        .filter(Boolean)
        .join('\n\n')

      const determinedScope =
        loc.district ? 'DISTRICT' : loc.state ? 'STATE' : scope || 'NATIONAL'

      const location: any = {
        primary: { state: loc.state, district: loc.district, city: loc.city, locality: loc.locality },
        scope: determinedScope,
      }
      const payload: Record<string, any> = {
        title: title.trim(),
        summary: summary.trim() || undefined,
        content: contentFallback || undefined,
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
        flags: {
          isBreaking,
          isFeatured,
          isExclusive,
          isLiveCoverage,
          priority,
          editorialTone,
          isSponsored,
          sponsorType: isSponsored ? 'SPONSORED' : 'NONE',
          sponsorName: isSponsored ? sponsorName.trim() || undefined : undefined,
          isPressRelease: editorialTone === 'PRESS_RELEASE',
          sendPushNotification,
          showOnHome: true,
        },
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

  const catName = (c: CategoryItem) =>
    (language === 'hi' ? (c.name?.hi || c.name?.en) : (c.name?.en || c.name?.hi)) || ''

  const catsWithSelectedFirst = category
    ? [...categories.filter((c) => c._id === category), ...categories.filter((c) => c._id !== category)]
    : categories
  const visibleCategories = catsWithSelectedFirst.slice(0, VISIBLE_CATEGORY_LIMIT)
  const showMoreCategoryBtn = categories.length > VISIBLE_CATEGORY_LIMIT
  const filteredCategories = categories.filter((c) => {
    if (!categorySearch.trim()) return true
    return catName(c).toLowerCase().includes(categorySearch.trim().toLowerCase())
  })

  const subsWithSelectedFirst = subCategory
    ? [...availableSubCats.filter((s) => s._id === subCategory), ...availableSubCats.filter((s) => s._id !== subCategory)]
    : availableSubCats
  const visibleSubCats = subsWithSelectedFirst.slice(0, VISIBLE_SUB_CATEGORY_LIMIT)
  const showMoreSubCategoryBtn = availableSubCats.length > VISIBLE_SUB_CATEGORY_LIMIT
  const filteredSubCats = availableSubCats.filter((s) => {
    if (!subCategorySearch.trim()) return true
    const n = (language === 'hi' ? (s.name?.hi || s.name?.en) : (s.name?.en || s.name?.hi)) || ''
    return n.toLowerCase().includes(subCategorySearch.trim().toLowerCase())
  })

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

        {visibleCategories.map((cat) => {
          const isSelected = category === cat._id
          const catNameText = catName(cat)
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
                {catNameText}
              </Text>
            </Pressable>
          )
        })}

        {showMoreCategoryBtn && (
          <Pressable
            style={[styles.catChip, styles.moreChip, { borderColor: colors.primary }]}
            onPress={() => setShowCategoryModal(true)}
          >
            <Ionicons name="add" size={12} color={colors.primary} />
            <Text style={[styles.moreChipText, { color: colors.primary }]}>MORE CATEGORY</Text>
          </Pressable>
        )}
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
            {visibleSubCats.map((sub) => {
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

            {showMoreSubCategoryBtn && (
              <Pressable
                style={[styles.subCatChip, styles.moreChip, { borderColor: colors.primary }]}
                onPress={() => setShowSubCategoryModal(true)}
              >
                <Ionicons name="add" size={12} color={colors.primary} />
                <Text style={[styles.moreChipText, { color: colors.primary }]}>MORE SUB-CATEGORY</Text>
              </Pressable>
            )}
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

      {/* Editorial & Publishing Controls Section */}
      <View style={{ marginTop: 16 }}>
        <Pressable
          style={[
            styles.editorialHeaderBtn,
            { backgroundColor: colors.surfaceContainer, borderColor: colors.border },
          ]}
          onPress={() => setShowEditorialOptions(!showEditorialOptions)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="options-outline" size={18} color={colors.primary} />
            <Text style={[styles.editorialHeaderTitle, { color: colors.text }]}>
              Editorial & Publishing Options
            </Text>
          </View>
          <Ionicons
            name={showEditorialOptions ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textMuted}
          />
        </Pressable>

        {showEditorialOptions && (
          <View
            style={[
              styles.editorialBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {/* 1. Flags */}
            <Text style={[styles.subSectionTitle, { color: colors.text }]}>Placement & Badges</Text>
            <View style={styles.editorialChipsRow}>
              <Pressable
                style={[
                  styles.editorialChip,
                  { borderColor: colors.border, backgroundColor: colors.surfaceContainer },
                  isBreaking && { backgroundColor: '#DC2626', borderColor: '#DC2626' },
                ]}
                onPress={() => {
                  const val = !isBreaking
                  setIsBreaking(val)
                  if (val) setSendPushNotification(true)
                }}
              >
                <Text
                  style={[
                    styles.editorialChipText,
                    { color: colors.text },
                    isBreaking && { color: '#fff', fontWeight: '700' },
                  ]}
                >
                  ⚡ Breaking
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.editorialChip,
                  { borderColor: colors.border, backgroundColor: colors.surfaceContainer },
                  isFeatured && { backgroundColor: '#D97706', borderColor: '#D97706' },
                ]}
                onPress={() => setIsFeatured(!isFeatured)}
              >
                <Text
                  style={[
                    styles.editorialChipText,
                    { color: colors.text },
                    isFeatured && { color: '#fff', fontWeight: '700' },
                  ]}
                >
                  ★ Featured
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.editorialChip,
                  { borderColor: colors.border, backgroundColor: colors.surfaceContainer },
                  isExclusive && { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
                ]}
                onPress={() => setIsExclusive(!isExclusive)}
              >
                <Text
                  style={[
                    styles.editorialChipText,
                    { color: colors.text },
                    isExclusive && { color: '#fff', fontWeight: '700' },
                  ]}
                >
                  💎 Exclusive
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.editorialChip,
                  { borderColor: colors.border, backgroundColor: colors.surfaceContainer },
                  isLiveCoverage && { backgroundColor: '#E11D48', borderColor: '#E11D48' },
                ]}
                onPress={() => setIsLiveCoverage(!isLiveCoverage)}
              >
                <Text
                  style={[
                    styles.editorialChipText,
                    { color: colors.text },
                    isLiveCoverage && { color: '#fff', fontWeight: '700' },
                  ]}
                >
                  🔴 Live
                </Text>
              </Pressable>
            </View>

            {/* 2. Priority */}
            <Text style={[styles.subSectionTitle, { color: colors.text, marginTop: 12 }]}>Story Priority</Text>
            <View style={styles.editorialChipsRow}>
              {[
                { key: 'NORMAL', label: 'Normal' },
                { key: 'HIGH', label: 'High' },
                { key: 'CRITICAL', label: 'Critical' },
              ].map((p) => (
                <Pressable
                  key={p.key}
                  style={[
                    styles.editorialChip,
                    { borderColor: colors.border, backgroundColor: colors.surfaceContainer },
                    priority === p.key && {
                      backgroundColor: p.key === 'CRITICAL' ? '#9F1239' : p.key === 'HIGH' ? '#EA580C' : colors.primary,
                      borderColor: p.key === 'CRITICAL' ? '#9F1239' : p.key === 'HIGH' ? '#EA580C' : colors.primary,
                    },
                  ]}
                  onPress={() => {
                    setPriority(p.key as PriorityLevel)
                    if (p.key === 'CRITICAL') setSendPushNotification(true)
                  }}
                >
                  <Text
                    style={[
                      styles.editorialChipText,
                      { color: colors.text },
                      priority === p.key && { color: '#fff', fontWeight: '700' },
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* 3. Tone */}
            <Text style={[styles.subSectionTitle, { color: colors.text, marginTop: 12 }]}>Content Tone</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {[
                { key: 'NEWS', label: 'News' },
                { key: 'OPINION', label: 'Opinion' },
                { key: 'ANALYSIS', label: 'Analysis' },
                { key: 'INTERVIEW', label: 'Interview' },
                { key: 'EXPLAINER', label: 'Explainer' },
                { key: 'REPORT', label: 'Report' },
                { key: 'PRESS_RELEASE', label: 'Press Release' },
              ].map((t) => (
                <Pressable
                  key={t.key}
                  style={[
                    styles.editorialChip,
                    { borderColor: colors.border, backgroundColor: colors.surfaceContainer },
                    editorialTone === t.key && { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
                  ]}
                  onPress={() => setEditorialTone(t.key as EditorialTone)}
                >
                  <Text
                    style={[
                      styles.editorialChipText,
                      { color: colors.text },
                      editorialTone === t.key && { color: '#fff', fontWeight: '700' },
                    ]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* 4. Sponsored & Notification */}
            <View style={{ marginTop: 12, gap: 8 }}>
              <Pressable
                style={[
                  styles.editorialToggleRow,
                  { backgroundColor: colors.surfaceContainer, borderColor: colors.border },
                  isSponsored && { borderColor: '#10B981' },
                ]}
                onPress={() => setIsSponsored(!isSponsored)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="pricetag-outline" size={16} color={isSponsored ? '#10B981' : colors.textMuted} />
                  <Text style={[styles.editorialToggleText, { color: colors.text }]}>Sponsored / Partner Content</Text>
                </View>
                <Ionicons name={isSponsored ? 'checkbox' : 'square-outline'} size={18} color={isSponsored ? '#10B981' : colors.textMuted} />
              </Pressable>

              {isSponsored && (
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceContainer, borderColor: colors.border, color: colors.text, marginTop: 4 }]}
                  value={sponsorName}
                  onChangeText={setSponsorName}
                  placeholder="Sponsor / Organization Name"
                  placeholderTextColor={colors.textLight}
                />
              )}

              <Pressable
                style={[
                  styles.editorialToggleRow,
                  { backgroundColor: colors.surfaceContainer, borderColor: colors.border },
                  sendPushNotification && { borderColor: '#F59E0B' },
                ]}
                onPress={() => setSendPushNotification(!sendPushNotification)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="notifications-outline" size={16} color={sendPushNotification ? '#F59E0B' : colors.textMuted} />
                  <Text style={[styles.editorialToggleText, { color: colors.text }]}>Send Push Notification Alert</Text>
                </View>
                <Ionicons name={sendPushNotification ? 'checkbox' : 'square-outline'} size={18} color={sendPushNotification ? '#F59E0B' : colors.textMuted} />
              </Pressable>
            </View>
          </View>
        )}
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

      {/* Category Picker Modal (searchable + scrollable) */}
      <Modal visible={showCategoryModal} transparent animationType="slide" onRequestClose={() => setShowCategoryModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Category</Text>
              <Pressable onPress={() => setShowCategoryModal(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <View style={[styles.searchBox, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
              <Ionicons name="search" size={16} color={colors.textLight} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                value={categorySearch}
                onChangeText={setCategorySearch}
                placeholder="Search categories..."
                placeholderTextColor={colors.textLight}
              />
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {filteredCategories.length === 0 && (
                <Text style={[styles.modalEmpty, { color: colors.textMuted }]}>No categories found</Text>
              )}
              {filteredCategories.map((c) => {
                const isCSelected = category === c._id
                return (
                  <Pressable
                    key={c._id}
                    style={[
                      styles.modalOption,
                      { borderBottomColor: colors.border },
                      isCSelected && { backgroundColor: colors.primarySoft },
                    ]}
                    onPress={() => {
                      setCategory(c._id)
                      setSubCategory('')
                      setShowCategoryModal(false)
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Ionicons name="pricetag-outline" size={18} color={isCSelected ? colors.primary : colors.textLight} />
                      <Text style={[styles.modalOptionText, { color: isCSelected ? colors.primary : colors.text }]}>
                        {catName(c)}
                      </Text>
                    </View>
                    {isCSelected && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sub-Category Picker Modal (searchable + scrollable) */}
      <Modal visible={showSubCategoryModal} transparent animationType="slide" onRequestClose={() => setShowSubCategoryModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Sub-Category</Text>
              <Pressable onPress={() => setShowSubCategoryModal(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <View style={[styles.searchBox, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
              <Ionicons name="search" size={16} color={colors.textLight} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                value={subCategorySearch}
                onChangeText={setSubCategorySearch}
                placeholder="Search sub-categories..."
                placeholderTextColor={colors.textLight}
              />
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {filteredSubCats.length === 0 && (
                <Text style={[styles.modalEmpty, { color: colors.textMuted }]}>No sub-categories found</Text>
              )}
              {filteredSubCats.map((s) => {
                const isSSelected = subCategory === s._id
                const subName = language === 'hi' ? (s.name?.hi || s.name?.en) : (s.name?.en || s.name?.hi)
                return (
                  <Pressable
                    key={s._id}
                    style={[
                      styles.modalOption,
                      { borderBottomColor: colors.border },
                      isSSelected && { backgroundColor: colors.primarySoft },
                    ]}
                    onPress={() => {
                      setSubCategory(s._id)
                      setShowSubCategoryModal(false)
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Ionicons name="git-branch-outline" size={18} color={isSSelected ? colors.primary : colors.textLight} />
                      <Text style={[styles.modalOptionText, { color: isSSelected ? colors.primary : colors.text }]}>
                        {subName}
                      </Text>
                    </View>
                    {isSSelected && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
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
            {/* Category & Date & Editorial Badges */}
            <View style={[styles.previewMetaRow, { flexWrap: 'wrap', gap: 6 }]}>
              <View style={[styles.previewCatPill, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.previewCatText, { color: colors.primary }]}>{selectedCatLabel}</Text>
              </View>
              {isBreaking ? (
                <View style={[styles.badgePill, { backgroundColor: '#DC2626' }]}>
                  <Text style={styles.badgePillText}>⚡ BREAKING</Text>
                </View>
              ) : null}
              {isFeatured ? (
                <View style={[styles.badgePill, { backgroundColor: '#D97706' }]}>
                  <Text style={styles.badgePillText}>★ FEATURED</Text>
                </View>
              ) : null}
              {isExclusive ? (
                <View style={[styles.badgePill, { backgroundColor: '#7C3AED' }]}>
                  <Text style={styles.badgePillText}>EXCLUSIVE</Text>
                </View>
              ) : null}
              {isLiveCoverage ? (
                <View style={[styles.badgePill, { backgroundColor: '#E11D48' }]}>
                  <Text style={styles.badgePillText}>🔴 LIVE</Text>
                </View>
              ) : null}
              {priority === 'CRITICAL' ? (
                <View style={[styles.badgePill, { backgroundColor: '#9F1239' }]}>
                  <Text style={styles.badgePillText}>CRITICAL</Text>
                </View>
              ) : null}
              {isSponsored ? (
                <View style={[styles.badgePill, { backgroundColor: '#059669' }]}>
                  <Text style={styles.badgePillText}>
                    SPONSORED {sponsorName ? `· ${sponsorName}` : ''}
                  </Text>
                </View>
              ) : null}
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
              <View style={{ marginVertical: 10 }}>
                <AdaptiveImage
                  source={{ uri: mediaUrl(featuredImage.url) || '' }}
                  maxHeight={480}
                  minHeight={200}
                  borderRadius={10}
                >
                  <ArticleWatermark />
                </AdaptiveImage>
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
                      <View key={block.id} style={{ marginVertical: 10 }}>
                        <AdaptiveImage
                          source={{ uri: mediaUrl(block.url) || '' }}
                          maxHeight={480}
                          minHeight={200}
                          borderRadius={10}
                        >
                          <ArticleWatermark />
                        </AdaptiveImage>
                        {block.caption ? (
                          <Text style={[styles.previewBlockCaption, { color: colors.textLight }]}>{block.caption}</Text>
                        ) : null}
                      </View>
                    ) : null
                  case 'TABLE': {
                    const t = block.tableData
                    if (!t || (!t.headers?.length && !t.rows?.length)) return null
                    return (
                      <View key={block.id} style={{ marginVertical: 14 }}>
                        {t.caption ? (
                          <Text style={[styles.previewTableCaption, { color: colors.text }]}>
                            {t.caption}
                          </Text>
                        ) : null}
                        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.previewTableScroll}>
                          <View style={[styles.previewTableGrid, { borderColor: colors.border, backgroundColor: colors.card }]}>
                            {t.hasHeader !== false && t.headers?.length ? (
                              <View style={[styles.previewTableHeaderRow, { backgroundColor: colors.surfaceContainer, borderBottomColor: colors.border }]}>
                                {t.headers.map((h, i) => (
                                  <View key={i} style={[styles.previewTableCell, { borderRightColor: colors.border }]}>
                                    <Text style={[styles.previewTableHeaderText, { color: colors.text }]}>
                                      {h}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            ) : null}
                            {t.rows?.map((row, rIdx) => (
                              <View
                                key={rIdx}
                                style={[
                                  styles.previewTableRow,
                                  { borderBottomColor: colors.border },
                                  rIdx % 2 === 1 && { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' },
                                  rIdx === t.rows.length - 1 && { borderBottomWidth: 0 },
                                ]}
                              >
                                {row.map((cell, cIdx) => (
                                  <View key={cIdx} style={[styles.previewTableCell, { borderRightColor: colors.border }]}>
                                    <Text style={[styles.previewTableCellText, { color: colors.text }]}>
                                      {cell}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            ))}
                          </View>
                        </ScrollView>
                      </View>
                    )
                  }
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
  modalEmpty: { textAlign: 'center', fontSize: 13, paddingVertical: 18 },
  moreChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'transparent', borderStyle: 'dashed' },
  moreChipText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },

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
  previewBlockImgBox: { position: 'relative', width: '100%', height: 180, borderRadius: 10, overflow: 'hidden' },
  previewBlockImg: { width: '100%', height: '100%' },
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
  editorialHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  editorialHeaderTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 14,
    fontWeight: '700',
  },
  editorialBox: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  subSectionTitle: {
    fontFamily: fonts.inter[600],
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editorialChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  editorialChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  editorialChipText: {
    fontFamily: fonts.inter[600],
    fontSize: 11.5,
  },
  editorialToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  editorialToggleText: {
    fontFamily: fonts.inter[600],
    fontSize: 12,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePillText: {
    color: '#fff',
    fontFamily: fonts.inter[700],
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  previewTableCaption: {
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 13,
  },
  previewTableScroll: {
    borderRadius: 10,
  },
  previewTableGrid: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  previewTableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  previewTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  previewTableCell: {
    minWidth: 100,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRightWidth: 1,
    justifyContent: 'center',
  },
  previewTableHeaderText: {
    fontWeight: '700',
    fontSize: 12,
  },
  previewTableCellText: {
    fontSize: 12,
    lineHeight: 16,
  },
})