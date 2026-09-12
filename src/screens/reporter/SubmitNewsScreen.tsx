import React, { useEffect, useRef, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ScaledText as Text } from '../../components/ScaledText'
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
import { colors } from '../../theme'
import { useTheme } from '../../context/ThemeContext'
import ArticleBlockEditor from '../../components/reporter/ArticleBlockEditor'

const TYPES: Array<{ key: ContentType; label: string }> = [
  { key: 'ARTICLE', label: 'Article' },
  { key: 'SHORT_NEWS', label: 'Short News' },
  { key: 'VIDEO', label: 'Video' },
  { key: 'SHORT_VIDEO', label: 'Short Video' },
  { key: 'AUDIO', label: 'Audio' },
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
  const [tags, setTags] = useState((item?.tags || []).join(', '))
  const [language, setLanguage] = useState(item?.language || 'hi')
  const [featuredImage, setFeaturedImage] = useState<{ url: string } | null>(item?.featuredImage || null)
  const [mediaUrlState, setMediaUrlState] = useState<{ url: string; kind: 'VIDEO' | 'AUDIO' | 'SHORT_VIDEO' } | null>(null)
  const [loc, setLoc] = useState(
    item?.location?.primary
      ? { state: item.location.primary.state || '', district: item.location.primary.district || '', city: item.location.primary.city || '', locality: item.location.primary.locality || '' }
      : { state: '', district: '', city: '', locality: '' }
  )
  const [states, setStates] = useState<LocationItem[]>([])
  const [busy, setBusy] = useState(false)
  const draftKey = `aarambh_article_draft_${user?._id || 'anon'}`
  const saveTimer = useRef<any>(null)

  useEffect(() => {
    navigation.setOptions({ title: editing ? 'Edit Article' : 'Create Article' })
    categoryApi.list().then(setCategories).catch(() => {})
    locationApi.states().then(setStates).catch(() => {})
    if (!editing && gpsLocation) {
      setLoc((prev) => ({
        state: prev.state || gpsLocation.state || '',
        district: prev.district || gpsLocation.district || '',
        city: prev.city || gpsLocation.city || '',
        locality: prev.locality || gpsLocation.locality || '',
      }))
    }
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
            if (typeof d.tags === 'string') setTags(d.tags)
            if (d.language) setLanguage(d.language)
            if (d.featuredImage) setFeaturedImage(d.featuredImage)
            if (d.mediaUrl) setMediaUrlState(d.mediaUrl)
            if (d.loc) setLoc((prev) => ({ ...prev, ...d.loc }))
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
        JSON.stringify({ title, summary, contentType, category, tags, language, loc, featuredImage, mediaUrl: mediaUrlState, blocks, savedAt: Date.now() })
      ).catch(() => {})
    }, 1500)
    return () => clearTimeout(saveTimer.current)
  }, [title, summary, contentType, category, tags, language, loc, featuredImage, blocks, mediaUrlState])

  const clearDraft = () => AsyncStorage.removeItem(draftKey).catch(() => {})

  const uploadImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 })
      if (result.canceled || !result.assets?.[0]) return
      const file = result.assets[0]
      const res = await mediaApi.upload({ uri: file.uri, name: file.fileName || 'image.jpg', type: file.mimeType || 'image/jpeg' })
      setFeaturedImage({ url: res.url })
      success('Image uploaded')
    } catch (e) {
      error(errorMessage(e, 'Upload failed'))
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

  const save = async (status: 'DRAFT' | 'PENDING_REVIEW') => {
    if (!title.trim() || title.trim().length < 5) {
      error('Title is required (minimum 5 characters)')
      return
    }
    if (!category) {
      error('Please choose a category')
      return
    }
    setBusy(true)
    try {
      const bodyBlocks = blocks.map((b) => ({ ...b }))
      const location: any = {
        primary: { state: loc.state, district: loc.district, city: loc.city, locality: loc.locality },
        scope: loc.district ? 'DISTRICT' : loc.state ? 'STATE' : 'NATIONAL',
      }
      const payload: Record<string, any> = {
        title: title.trim(),
        summary: summary.trim() || undefined,
        bodyBlocks,
        featuredImage: featuredImage || null,
        contentType,
        status,
        category,
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
      const finalStatus = saved.status
      if (finalStatus === 'PUBLISHED') success('Your article is now live 🎉')
      else if (finalStatus === 'PENDING_REVIEW') success('Submitted for review. Admin approval needed before it goes live.')
      else success('Draft saved. You can edit it later from My Submissions.')
      navigation.goBack()
    } catch (e) {
      error(errorMessage(e, 'Failed to submit'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScrollView style={[styles.safe, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
      {editing && item?.status ? (
        <View style={[styles.statusBanner, { backgroundColor: colors.surfaceContainer, borderColor: colors.primary }]}>
          <Text style={[styles.statusText, { color: colors.textMuted }]}>Editing submission · status: <Text style={{ color: colors.primary, fontWeight: '800' }}>{item.status.replace(/_/g, ' ')}</Text></Text>
        </View>
      ) : null}

      <Text style={[styles.label, { color: colors.text }]}>Content Type</Text>
      <View style={styles.typeRow}>
        {TYPES.map((t) => (
          <Pressable key={t.key} style={[styles.typeChip, { backgroundColor: colors.surfaceContainer }, contentType === t.key && { backgroundColor: colors.primary }]} onPress={() => setContentType(t.key)}>
            <Text style={[styles.typeText, { color: colors.textMuted }, contentType === t.key && styles.typeTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Headline *</Text>
      <TextInput style={[styles.input, styles.headline, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={title} onChangeText={setTitle} placeholder="Headline (min 5 characters)" placeholderTextColor={colors.textLight} />

      <Text style={[styles.label, { color: colors.text }]}>Summary</Text>
      <TextInput style={[styles.input, { minHeight: 70, backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={summary} onChangeText={setSummary} placeholder="Short standfirst" placeholderTextColor={colors.textLight} multiline />

      <Text style={[styles.label, { color: colors.text }]}>Featured image</Text>
      <Pressable style={[styles.uploadBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]} onPress={uploadImage}>
        <Ionicons name="image" size={18} color={colors.primary} />
        <Text style={styles.uploadText}>{featuredImage ? 'Image uploaded ✓ (tap to change)' : 'Upload image'}</Text>
      </Pressable>
      {featuredImage ? <Image source={{ uri: mediaUrl(featuredImage.url) }} style={styles.preview} /> : null}

      {contentType === 'ARTICLE' || contentType === 'SHORT_NEWS' ? (
        <>
          <View style={[styles.blocksHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Story blocks</Text>
            <Text style={[styles.blocksHint, { color: colors.textLight }]}>Tap anywhere in a text block, then "Insert here" to split at the cursor</Text>
          </View>
          <ArticleBlockEditor blocks={blocks} onChange={setBlocks} />
        </>
      ) : null}

      {contentType === 'VIDEO' || contentType === 'SHORT_VIDEO' ? (
        <>
          <Text style={[styles.label, { color: colors.text }]}>Video file</Text>
          <Pressable style={[styles.uploadBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]} onPress={() => pickMedia(contentType === 'SHORT_VIDEO' ? 'SHORT_VIDEO' : 'VIDEO')}>
            <Ionicons name="videocam" size={18} color={colors.primary} />
            <Text style={styles.uploadText}>{mediaUrlState ? 'Video uploaded ✓ (tap to change)' : 'Upload video'}</Text>
          </Pressable>
        </>
      ) : null}

      {contentType === 'AUDIO' ? (
        <>
          <Text style={[styles.label, { color: colors.text }]}>Audio file</Text>
          <Pressable style={[styles.uploadBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]} onPress={() => pickMedia('AUDIO')}>
            <Ionicons name="mic" size={18} color={colors.primary} />
            <Text style={styles.uploadText}>{mediaUrlState ? 'Audio uploaded ✓ (tap to change)' : 'Upload audio'}</Text>
          </Pressable>
        </>
      ) : null}

      <Text style={[styles.label, { color: colors.text }]}>Category *</Text>
      <View style={styles.typeRow}>
        {categories.map((cat) => (
          <Pressable key={cat._id} style={[styles.typeChip, { backgroundColor: colors.surfaceContainer }, category === cat._id && { backgroundColor: colors.primary }]} onPress={() => setCategory(cat._id)}>
            <Text style={[styles.typeText, { color: colors.textMuted }, category === cat._id && styles.typeTextActive]}>{cat.name.en}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Location (auto-suggested from GPS — edit if needed)</Text>
      <View style={styles.locRow}>
        <TextInput style={[styles.input, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={loc.state} onChangeText={(v) => setLoc({ ...loc, state: v })} placeholder="State" placeholderTextColor={colors.textLight} />
        <TextInput style={[styles.input, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={loc.district} onChangeText={(v) => setLoc({ ...loc, district: v })} placeholder="District" placeholderTextColor={colors.textLight} />
      </View>
      <View style={styles.locRow}>
        <TextInput style={[styles.input, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={loc.city} onChangeText={(v) => setLoc({ ...loc, city: v })} placeholder="City" placeholderTextColor={colors.textLight} />
        <TextInput style={[styles.input, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={loc.locality} onChangeText={(v) => setLoc({ ...loc, locality: v })} placeholder="Locality" placeholderTextColor={colors.textLight} />
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Tags (comma separated)</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={tags} onChangeText={setTags} placeholder="cricket, gorakhpur, sports" placeholderTextColor={colors.textLight} />

      <Text style={[styles.label, { color: colors.text }]}>Language</Text>
      <View style={styles.typeRow}>
        <Pressable style={[styles.typeChip, { backgroundColor: colors.surfaceContainer }, language === 'hi' && { backgroundColor: colors.primary }]} onPress={() => setLanguage('hi')}>
          <Text style={[styles.typeText, { color: colors.textMuted }, language === 'hi' && styles.typeTextActive]}>हिन्दी</Text>
        </Pressable>
        <Pressable style={[styles.typeChip, { backgroundColor: colors.surfaceContainer }, language === 'en' && { backgroundColor: colors.primary }]} onPress={() => setLanguage('en')}>
          <Text style={[styles.typeText, { color: colors.textMuted }, language === 'en' && styles.typeTextActive]}>English</Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.btn, styles.btnOutline, { backgroundColor: colors.card, borderColor: colors.primary }]} onPress={() => save('DRAFT')} disabled={busy}>
          <Text style={styles.btnOutlineText}>{editing ? 'Save Changes' : 'Save Draft'}</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => save('PENDING_REVIEW')} disabled={busy}>
          <Text style={styles.btnPrimaryText}>{busy ? 'Saving...' : editing ? 'Submit Changes' : 'Submit for Review'}</Text>
        </Pressable>
      </View>
      <Text style={[styles.note, { color: colors.textLight }]}>
        {editing
          ? 'Edits go back for moderation. Approved changes go live.'
          : 'This draft is auto-saved locally on this device. On submit, the system decides — approval may be needed before publishing.'}
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  statusBanner: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 16, marginBottom: 8 },
  blocksHeader: { borderBottomWidth: 1, marginBottom: 10 },
  blocksHint: { fontSize: 11, marginTop: 4, marginBottom: 10 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: colors.text, marginBottom: 8 },
  headline: { fontSize: 16, fontWeight: '700' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: colors.surfaceContainer },
  typeText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  typeTextActive: { color: '#fff' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: 10, paddingVertical: 14, backgroundColor: colors.primarySoft },
  uploadText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  preview: { width: '100%', height: 160, borderRadius: 10, marginTop: 10 },
  locRow: { flexDirection: 'row', gap: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnOutline: { borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.card },
  btnOutlineText: { color: colors.primary, fontWeight: '800' },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: '#fff', fontWeight: '800' },
  note: { textAlign: 'center', color: colors.textLight, fontSize: 12, marginTop: 12 },
})