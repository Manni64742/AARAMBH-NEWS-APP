import React, { useRef, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { Image } from 'expo-image'
import { VideoView, useVideoPlayer } from 'expo-video'
import { Ionicons } from '@expo/vector-icons'
import { ScaledText as Text } from '../ScaledText'
import { contentApi, mediaApi } from '../../api/endpoints'
import { ArticleBlock, ArticleBlockType, ContentItem, MediaLibraryItem } from '../../types'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../api/client'
import { mediaUrl } from '../../config'

const BLOCKS: Array<{ type: ArticleBlockType; label: string; icon: any }> = [
  { type: 'TEXT', label: 'Text', icon: 'document-text-outline' },
  { type: 'HEADING', label: 'Heading', icon: 'text-outline' },
  { type: 'QUOTE', label: 'Quote', icon: 'chatbox-quote-outline' },
  { type: 'IMAGE', label: 'Image', icon: 'image-outline' },
  { type: 'GALLERY', label: 'Gallery', icon: 'images-outline' },
  { type: 'VIDEO', label: 'Video', icon: 'videocam-outline' },
  { type: 'AUDIO', label: 'Audio', icon: 'musical-notes-outline' },
  { type: 'YOUTUBE', label: 'YouTube', icon: 'logo-youtube' },
  { type: 'EMBED', label: 'Embed/Link', icon: 'link-outline' },
  { type: 'ADVERTISEMENT', label: 'Ad Slot', icon: 'megaphone-outline' },
  { type: 'RELATED_STORY', label: 'Related Story', icon: 'newspaper-outline' },
  { type: 'DIVIDER', label: 'Divider', icon: 'remove-outline' },
]

const newBlock = (type: ArticleBlockType): ArticleBlock => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  ...(type === 'TEXT' ? { html: '' } : {}),
  ...(type === 'HEADING' ? { level: 'h2', text: '' } : {}),
  ...(type === 'GALLERY' ? { items: [] } : {}),
})

function VideoThumb({ url }: { url: string }) {
  const player = useVideoPlayer(mediaUrl(url) as any)
  return <VideoView player={player} style={styles.mediaPreview} contentFit="contain" />
}

function AddMenu({ onPick, onClose }: { onPick: (type: ArticleBlockType) => void; onClose: () => void }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.addMenu, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
      <View style={styles.addMenuHeader}>
        <Text style={[styles.addMenuTitle, { color: colors.textMuted }]}>Insert block at position</Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.addChips}>
          {BLOCKS.map((o) => (
            <Pressable key={o.type} style={[styles.addChip, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => onPick(o.type)}>
              <Ionicons name={o.icon} size={15} color={colors.primary} />
              <Text style={[styles.addChipText, { color: colors.text }]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

export default function ArticleBlockEditor({ blocks, onChange }: { blocks: ArticleBlock[]; onChange: (next: ArticleBlock[]) => void }) {
  const { colors } = useTheme()
  const { success, error } = useToast()
  const caretRef = useRef<{ blockId: string; start: number; end: number } | null>(null)
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [picker, setPicker] = useState<{ kind: 'IMAGE' | 'VIDEO' | 'AUDIO'; onSelect: (url: string, name: string) => void } | null>(null)
  const [pickerItems, setPickerItems] = useState<MediaLibraryItem[]>([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const [relatedOptions, setRelatedOptions] = useState<ContentItem[] | null>(null)
  const [relatedLoadingFor, setRelatedLoadingFor] = useState<string | null>(null)

  const updateBlock = (index: number, patch: Partial<ArticleBlock>) =>
    onChange(blocks.map((b, i) => (i === index ? { ...b, ...patch } : b)))

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index))
    setOpenMenu(null)
  }

  const moveBlock = (index: number, dir: -1 | 1) => {
    const next = index + dir
    if (next < 0 || next >= blocks.length) return
    const copy = [...blocks]
    ;[copy[index], copy[next]] = [copy[next], copy[index]]
    onChange(copy)
  }

  const insertBlock = (menuIndex: number, type: ArticleBlockType) => {
    setOpenMenu(null)
    const focused = caretRef.current
    const prevIndex = menuIndex - 1
    const prev = prevIndex >= 0 ? blocks[prevIndex] : undefined
    if (focused && prev && prev.id === focused.blockId && prev.type === 'TEXT' && focused.start === focused.end && focused.start > 0 && focused.start < (prev.html || '').length) {
      const text = prev.html || ''
      const before = { ...prev, html: text.slice(0, focused.start) }
      const after = { ...prev, id: newBlock('TEXT').id, html: text.slice(focused.start) }
      const next: ArticleBlock[] = []
      if (before.html) next.push(before)
      next.push(newBlock(type))
      if (after.html) next.push(after)
      onChange([...blocks.slice(0, prevIndex), ...next, ...blocks.slice(menuIndex)])
    } else {
      onChange([...blocks.slice(0, menuIndex), newBlock(type), ...blocks.slice(menuIndex)])
    }
    caretRef.current = null
  }

  const uploadFromDevice = async (kind: 'IMAGE' | 'VIDEO' | 'AUDIO'): Promise<string | null> => {
    try {
      if (kind === 'IMAGE') {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 })
        if (result.canceled || !result.assets?.[0]) return null
        const file = result.assets[0]
        const res = await mediaApi.upload({ uri: file.uri, name: file.fileName || 'image.jpg', type: file.mimeType || 'image/jpeg' })
        success('Image uploaded')
        return res.url
      }
      const result = await DocumentPicker.getDocumentAsync({ type: kind === 'AUDIO' ? 'audio/*' : 'video/*', copyToCacheDirectory: true })
      if (result.canceled || !result.assets?.[0]) return null
      const file = result.assets[0]
      const res = await mediaApi.upload({ uri: file.uri, name: file.name, type: file.mimeType || (kind === 'AUDIO' ? 'audio/mpeg' : 'video/mp4') })
      success('Media uploaded')
      return res.url
    } catch (e) {
      error(errorMessage(e, 'Upload failed'))
      return null
    }
  }

  const openPicker = (kind: 'IMAGE' | 'VIDEO' | 'AUDIO', onSelect: (url: string, name: string) => void) => {
    setPicker({ kind, onSelect })
    setPickerItems([])
    setPickerLoading(true)
    mediaApi
      .library(kind)
      .then(setPickerItems)
      .catch((e: any) => error(errorMessage(e, 'Failed to load media library')))
      .finally(() => setPickerLoading(false))
  }

  const pickFromLibrary = (kind: 'IMAGE' | 'VIDEO' | 'AUDIO', patch: (url: string) => void) =>
    openPicker(kind, (url) => patch(url))

  const loadRelated = () => {
    if (relatedOptions) return
    contentApi
      .list({ status: 'PUBLISHED', limit: 20 })
      .then((res) => setRelatedOptions(res.data || []))
      .catch(() => error('Failed to load related stories'))
  }

  const mediaRow = (index: number, kind: 'IMAGE' | 'VIDEO' | 'AUDIO', fromLibrary: (url: string) => void) => (
    <View style={styles.mediaRow}>
      <Pressable style={[styles.miniBtn, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]} onPress={async () => {
        const url = await uploadFromDevice(kind)
        if (url) updateBlock(index, { url })
      }}>
        <Ionicons name={kind === 'IMAGE' ? 'image-outline' : kind === 'VIDEO' ? 'videocam-outline' : 'mic-outline'} size={15} color={colors.primary} />
        <Text style={[styles.miniBtnText, { color: colors.primary }]}>Upload</Text>
      </Pressable>
      <Pressable style={[styles.miniBtn, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]} onPress={() => pickFromLibrary(kind, (url) => updateBlock(index, { url }))}>
        <Ionicons name="albums-outline" size={15} color={colors.primary} />
        <Text style={[styles.miniBtnText, { color: colors.primary }]}>Library</Text>
      </Pressable>
      <TextInput
        style={[styles.input, styles.urlInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        value={blocks[index].url || ''}
        onChangeText={(v) => updateBlock(index, { url: v })}
        placeholder="or paste URL"
        placeholderTextColor={colors.textLight}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  )

  const renderMediaPreview = (block: ArticleBlock) => {
    if (!block.url) return null
    if (block.type === 'IMAGE') return <Image source={{ uri: mediaUrl(block.url) }} style={styles.mediaPreview} contentFit="cover" />
    if (block.type === 'VIDEO') return <VideoThumb url={block.url} />
    if (block.type === 'AUDIO')
      return (
        <View style={[styles.audioRow, { backgroundColor: colors.surfaceContainer }]}>
          <Ionicons name="musical-notes" size={18} color={colors.primary} />
          <Text style={[styles.audioLabel, { color: colors.textMuted }]}>Audio uploaded</Text>
        </View>
      )
    return null
  }

  const renderBlockEditor = (block: ArticleBlock, index: number) => {
    switch (block.type) {
      case 'TEXT':
        return (
          <TextInput
            style={[styles.textBlock, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={block.html || ''}
            onChangeText={(v) => updateBlock(index, { html: v })}
            onSelectionChange={(e) => {
              const s = e.nativeEvent.selection
              caretRef.current = { blockId: block.id, start: s.start, end: s.end }
            }}
            multiline
            placeholder="Write the story here…"
            placeholderTextColor={colors.textLight}
          />
        )
      case 'HEADING':
        return (
          <View>
            <View style={styles.levelRow}>
              {(['h2', 'h3'] as const).map((lvl) => (
                <Pressable key={lvl} style={[styles.levelChip, { backgroundColor: colors.surfaceContainer }, (block.level || 'h2') === lvl && { backgroundColor: colors.primary }]} onPress={() => updateBlock(index, { level: lvl })}>
                  <Text style={[styles.levelText, { color: colors.textMuted }, (block.level || 'h2') === lvl && styles.levelTextActive]}>{lvl === 'h2' ? 'Large heading' : 'Small heading'}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={block.text || ''}
              onChangeText={(v) => updateBlock(index, { text: v })}
              placeholder="Heading text"
              placeholderTextColor={colors.textLight}
            />
          </View>
        )
      case 'QUOTE':
        return (
          <TextInput
            style={[styles.quoteBlock, { backgroundColor: colors.primarySoft, borderColor: colors.primary, color: colors.text }]}
            value={block.text || ''}
            onChangeText={(v) => updateBlock(index, { text: v })}
            multiline
            placeholder="Quote text"
            placeholderTextColor={colors.textLight}
          />
        )
      case 'IMAGE':
      case 'VIDEO':
      case 'AUDIO':
        return (
          <View style={styles.mediaFields}>
            {mediaRow(index, block.type, (url) => updateBlock(index, { url }))}
            {renderMediaPreview(block)}
            <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={block.caption || ''} onChangeText={(v) => updateBlock(index, { caption: v })} placeholder="Caption (optional)" placeholderTextColor={colors.textLight} />
            {block.type === 'IMAGE' ? (
              <View style={styles.row2}>
                <TextInput style={[styles.input, styles.flex1, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={block.alt || ''} onChangeText={(v) => updateBlock(index, { alt: v })} placeholder="Alt text" placeholderTextColor={colors.textLight} />
                <TextInput style={[styles.input, styles.flex1, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={block.credit || ''} onChangeText={(v) => updateBlock(index, { credit: v })} placeholder="Credit" placeholderTextColor={colors.textLight} />
              </View>
            ) : null}
          </View>
        )
      case 'GALLERY':
        return (
          <View style={styles.mediaFields}>
            <View style={styles.mediaRow}>
              <Pressable style={[styles.miniBtn, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]} onPress={async () => {
                try {
                  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 8, quality: 0.7 })
                  if (result.canceled || !result.assets?.length) return
                  const items: any[] = []
                  for (const file of result.assets) {
                    const res = await mediaApi.upload({ uri: file.uri, name: file.fileName || 'image.jpg', type: file.mimeType || 'image/jpeg' })
                    items.push({ id: `${Date.now()}-${Math.random()}`, url: res.url })
                  }
                  updateBlock(index, { items: [...(block.items || []), ...items] })
                  success(`${items.length} image${items.length === 1 ? '' : 's'} uploaded`)
                } catch (e) {
                  error(errorMessage(e, 'Gallery upload failed'))
                }
              }}>
                <Ionicons name="images-outline" size={15} color={colors.primary} />
                <Text style={[styles.miniBtnText, { color: colors.primary }]}>Upload images</Text>
              </Pressable>
              <Pressable style={[styles.miniBtn, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]} onPress={() => pickFromLibrary('IMAGE', (url) => updateBlock(index, { items: [...(block.items || []), { id: `${Date.now()}-${Math.random()}`, url }] }))}>
                <Ionicons name="albums-outline" size={15} color={colors.primary} />
                <Text style={[styles.miniBtnText, { color: colors.primary }]}>Library</Text>
              </Pressable>
            </View>
            {(block.items || []).map((it, gi) => (
              <View key={it.id} style={styles.galleryItem}>
                <Image source={{ uri: mediaUrl(it.url) }} style={styles.galleryThumb} contentFit="cover" />
                <TextInput
                  style={[styles.input, styles.flex1, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                  value={it.caption || ''}
                  onChangeText={(caption) => updateBlock(index, { items: (block.items || []).map((x, xi) => (xi === gi ? { ...x, caption } : x)) })}
                  placeholder="Caption"
                  placeholderTextColor={colors.textLight}
                />
                <Pressable onPress={() => updateBlock(index, { items: (block.items || []).filter((_, xi) => xi !== gi) })} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            ))}
          </View>
        )
      case 'YOUTUBE':
        return (
          <View>
            <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={block.embedUrl || ''} onChangeText={(v) => updateBlock(index, { embedUrl: v })} placeholder="YouTube video URL" placeholderTextColor={colors.textLight} autoCapitalize="none" autoCorrect={false} />
            <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={block.title || ''} onChangeText={(v) => updateBlock(index, { title: v })} placeholder="Title (optional)" placeholderTextColor={colors.textLight} />
          </View>
        )
      case 'ADVERTISEMENT':
        return (
          <View>
            <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={block.adSlot || ''} onChangeText={(v) => updateBlock(index, { adSlot: v })} placeholder="Ad slot name (e.g. inline-1, mid-article)" placeholderTextColor={colors.textLight} />
            <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={block.caption || ''} onChangeText={(v) => updateBlock(index, { caption: v })} placeholder="Label (optional)" placeholderTextColor={colors.textLight} />
          </View>
        )
      case 'EMBED':
        return (
          <View>
            <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={block.embedUrl || ''} onChangeText={(v) => updateBlock(index, { embedUrl: v })} placeholder="External link URL" placeholderTextColor={colors.textLight} autoCapitalize="none" autoCorrect={false} />
            <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={block.title || ''} onChangeText={(v) => updateBlock(index, { title: v })} placeholder="Link label" placeholderTextColor={colors.textLight} />
          </View>
        )
      case 'RELATED_STORY':
        return (
          <View>
            <Pressable style={[styles.miniBtn, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]} onPress={() => { setRelatedLoadingFor(block.id); loadRelated() }}>
              <Ionicons name="newspaper-outline" size={15} color={colors.primary} />
              <Text style={[styles.miniBtnText, { color: colors.primary }]}>Choose a published story</Text>
            </Pressable>
            {relatedLoadingFor === block.id && relatedOptions ? (
              <ScrollView style={styles.relatedList} nestedScrollEnabled>
                {relatedOptions.map((opt) => {
                  const active = block.relatedContentId === opt._id
                  return (
                    <Pressable key={opt._id} style={[styles.relatedOption, { backgroundColor: active ? colors.primarySoft : colors.surfaceContainer }, active && { borderColor: colors.primary }]} onPress={() => updateBlock(index, { relatedContentId: opt._id, relatedTitle: opt.title })}>
                      <Text style={[styles.relatedText, { color: active ? colors.primary : colors.text }]} numberOfLines={1}>{opt.title}</Text>
                    </Pressable>
                  )
                })}
              </ScrollView>
            ) : null}
            {block.relatedTitle ? <Text style={[styles.relatedPicked, { color: colors.primary }]}>✓ {block.relatedTitle}</Text> : null}
          </View>
        )
      case 'DIVIDER':
        return (
          <View style={[styles.divider, { borderColor: colors.border }]}>
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>—— divider ——</Text>
          </View>
        )
      default:
        return null
    }
  }

  return (
    <View>
      {openMenu === 0 ? <AddMenu onPick={(t) => insertBlock(0, t)} onClose={() => setOpenMenu(null)} /> : null}
      {blocks.map((block, index) => (
        <View key={block.id} style={styles.blockWrap}>
          <View style={styles.blockHeader}>
            <Text style={[styles.blockLabel, { color: colors.textMuted }]}>{BLOCKS.find((o) => o.type === block.type)?.label || block.type}</Text>
            <View style={styles.blockActions}>
              <Pressable onPress={() => moveBlock(index, -1)} hitSlop={8} disabled={index === 0}><Ionicons name="chevron-up" size={18} color={index === 0 ? colors.textLight : colors.text} /></Pressable>
              <Pressable onPress={() => moveBlock(index, 1)} hitSlop={8} disabled={index === blocks.length - 1}><Ionicons name="chevron-down" size={18} color={index === blocks.length - 1 ? colors.textLight : colors.text} /></Pressable>
              <Pressable onPress={() => removeBlock(index)} hitSlop={8}><Ionicons name="trash-outline" size={18} color={colors.danger} /></Pressable>
            </View>
          </View>
          {renderBlockEditor(block, index)}
          <Pressable style={[styles.inserter, { borderColor: colors.border }]} onPress={() => setOpenMenu(index + 1)}>
            <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
            <Text style={[styles.inserterText, { color: colors.textMuted }]}>Insert here</Text>
            {openMenu === index + 1 ? <AddMenu onPick={(t) => insertBlock(index + 1, t)} onClose={() => setOpenMenu(null)} /> : null}
          </Pressable>
        </View>
      ))}
      {blocks.length === 0 ? (
        <Pressable style={[styles.inserter, { borderColor: colors.border }]} onPress={() => setOpenMenu(blocks.length)}>
          <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
          <Text style={[styles.inserterText, { color: colors.textMuted }]}>Start writing — add your first block</Text>
          {openMenu === blocks.length ? <AddMenu onPick={(t) => insertBlock(blocks.length, t)} onClose={() => setOpenMenu(null)} /> : null}
        </Pressable>
      ) : null}

      <Modal visible={!!picker} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <View style={styles.sheetBackdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Choose from media library</Text>
              <Pressable onPress={() => setPicker(null)} hitSlop={8}><Ionicons name="close" size={20} color={colors.textMuted} /></Pressable>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              {pickerLoading ? (
                <Text style={[styles.sheetEmpty, { color: colors.textMuted }]}>Loading media…</Text>
              ) : pickerItems.length === 0 ? (
                <Text style={[styles.sheetEmpty, { color: colors.textMuted }]}>No {picker?.kind.toLowerCase()} files uploaded yet. Upload from your device instead.</Text>
              ) : (
                pickerItems.map((it) => (
                  <Pressable key={it._id} style={[styles.sheetRow, { borderBottomColor: colors.border }]} onPress={() => { picker?.onSelect(it.url, it.originalName); setPicker(null) }}>
                    <View style={[styles.sheetThumb, { backgroundColor: colors.surfaceContainer }]}>
                      {it.kind === 'IMAGE' ? (
                        <Image source={{ uri: mediaUrl(it.url) }} style={styles.sheetThumbImg} contentFit="cover" />
                      ) : it.kind === 'VIDEO' ? (
                        <Ionicons name="videocam" size={18} color={colors.textMuted} />
                      ) : (
                        <Ionicons name="musical-note" size={18} color={colors.textMuted} />
                      )}
                    </View>
                    <Text style={[styles.sheetName, { color: colors.text }]} numberOfLines={1}>{it.originalName}</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  blockWrap: { marginBottom: 6 },
  blockHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  blockLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  blockActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  textBlock: { minHeight: 120, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, lineHeight: 22, textAlignVertical: 'top' },
  quoteBlock: { minHeight: 80, borderWidth: 1, borderLeftWidth: 4, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 17, lineHeight: 22, textAlignVertical: 'top' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 6 },
  flex1: { flex: 1 },
  row2: { flexDirection: 'row', gap: 8 },
  levelRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  levelChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
  levelText: { fontSize: 12, fontWeight: '700' },
  levelTextActive: { color: '#fff' },
  mediaFields: { gap: 0 },
  mediaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  miniBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  miniBtnText: { fontSize: 12, fontWeight: '800' },
  urlInput: { flex: 1, minWidth: 120 },
  mediaPreview: { width: '100%', height: 150, borderRadius: 10, marginBottom: 6 },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginBottom: 6 },
  audioLabel: { fontSize: 13, fontWeight: '700' },
  galleryItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  galleryThumb: { width: 56, height: 44, borderRadius: 8 },
  divider: { borderTopWidth: 1, borderStyle: 'dashed', paddingVertical: 8, alignItems: 'center' },
  dividerText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  inserter: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, marginTop: 10 },
  inserterText: { fontSize: 12, fontWeight: '700' },
  addMenu: { borderWidth: 1, borderRadius: 10, padding: 8, marginTop: 8 },
  addMenuHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2, marginBottom: 6 },
  addMenuTitle: { fontSize: 11, fontWeight: '700' },
  addChips: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  addChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 18, paddingHorizontal: 11, paddingVertical: 7 },
  addChipText: { fontSize: 12, fontWeight: '700' },
  relatedList: { maxHeight: 180, borderWidth: 1, borderRadius: 10, marginTop: 4 },
  relatedOption: { paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 8, margin: 4 },
  relatedText: { fontSize: 13, fontWeight: '600' },
  relatedPicked: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingBottom: 24, maxHeight: 520 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  sheetTitle: { fontSize: 15, fontWeight: '800' },
  sheetEmpty: { fontSize: 13, textAlign: 'center', padding: 24 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  sheetThumb: { width: 52, height: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sheetThumbImg: { width: '100%', height: '100%' },
  sheetName: { flex: 1, fontSize: 13, fontWeight: '600' },
})