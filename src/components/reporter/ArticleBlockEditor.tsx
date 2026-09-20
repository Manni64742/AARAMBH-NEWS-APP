import React, { useRef, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { Image } from 'expo-image'
import { VideoView, useVideoPlayer } from 'expo-video'
import { Ionicons } from '@expo/vector-icons'
import { contentApi, mediaApi } from '../../api/endpoints'
import { ArticleBlock, ArticleBlockType, ContentItem, MediaLibraryItem } from '../../types'
import { useTheme } from '../../context/ThemeContext'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../api/client'
import { mediaUrl } from '../../config'
import { AdaptiveImage } from '../AdaptiveImage'

const TOOLBAR_BLOCKS: Array<{ type: ArticleBlockType; label: string; icon: any }> = [
  { type: 'TEXT', label: 'PARAGRAPH', icon: 'document-text-outline' },
  { type: 'HEADING', label: 'HEADING', icon: 'text-outline' },
  { type: 'QUOTE', label: 'QUOTE', icon: 'chatbox-quote-outline' },
  { type: 'IMAGE', label: 'IMAGE', icon: 'image-outline' },
  { type: 'VIDEO', label: 'VIDEO', icon: 'videocam-outline' },
  { type: 'YOUTUBE', label: 'YOUTUBE', icon: 'logo-youtube' },
  { type: 'TABLE', label: 'TABLE', icon: 'grid-outline' },
  { type: 'DIVIDER', label: 'DIVIDER', icon: 'remove-outline' },
]

const newBlock = (type: ArticleBlockType): ArticleBlock => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  ...(type === 'TEXT' ? { html: '' } : {}),
  ...(type === 'HEADING' ? { level: 'h2', text: '' } : {}),
  ...(type === 'GALLERY' ? { items: [] } : {}),
  ...(type === 'TABLE'
    ? {
        tableData: {
          hasHeader: true,
          headers: ['Column 1', 'Column 2', 'Column 3'],
          rows: [
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
          ],
          caption: '',
        },
      }
    : {}),
})

function VideoThumb({ url }: { url: string }) {
  const player = useVideoPlayer(mediaUrl(url) as any)
  return <VideoView player={player} style={styles.mediaPreview} contentFit="contain" />
}

export default function ArticleBlockEditor({
  blocks,
  onChange,
}: {
  blocks: ArticleBlock[]
  onChange: (next: ArticleBlock[]) => void
}) {
  const { colors, isDark } = useTheme()
  const { success, error } = useToast()
  const caretRef = useRef<{ blockId: string; start: number; end: number } | null>(null)
  const [insertAt, setInsertAt] = useState<number | null>(null)
  const [picker, setPicker] = useState<{ kind: 'IMAGE' | 'VIDEO' | 'AUDIO'; onSelect: (url: string, name: string) => void } | null>(null)
  const [pickerItems, setPickerItems] = useState<MediaLibraryItem[]>([])
  const [pickerLoading, setPickerLoading] = useState(false)

  const updateBlock = (index: number, patch: Partial<ArticleBlock>) =>
    onChange(blocks.map((b, i) => (i === index ? { ...b, ...patch } : b)))

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index))
    setInsertAt(null)
  }

  const moveBlock = (index: number, dir: -1 | 1) => {
    const next = index + dir
    if (next < 0 || next >= blocks.length) return
    const copy = [...blocks]
    ;[copy[index], copy[next]] = [copy[next], copy[index]]
    onChange(copy)
  }

  const appendBlock = (type: ArticleBlockType) => {
    onChange([...blocks, newBlock(type)])
    setInsertAt(null)
  }

  const insertBlockAtPosition = (index: number, type: ArticleBlockType) => {
    const copy = [...blocks]
    copy.splice(index, 0, newBlock(type))
    onChange(copy)
    setInsertAt(null)
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

  const mediaRow = (index: number, kind: 'IMAGE' | 'VIDEO' | 'AUDIO', fromLibrary: (url: string) => void) => (
    <View style={styles.mediaContainer}>
      <View style={styles.mediaButtonsRow}>
        <Pressable
          style={[styles.miniBtn, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
          onPress={async () => {
            const url = await uploadFromDevice(kind)
            if (url) updateBlock(index, { url })
          }}
        >
          <Ionicons name={kind === 'IMAGE' ? 'image-outline' : 'videocam-outline'} size={15} color={colors.primary} />
          <Text style={[styles.miniBtnText, { color: colors.primary }]}>Upload</Text>
        </Pressable>
        <Pressable
          style={[styles.miniBtn, { borderColor: colors.border, backgroundColor: colors.surfaceContainer }]}
          onPress={() => pickFromLibrary(kind, (url) => updateBlock(index, { url }))}
        >
          <Ionicons name="albums-outline" size={15} color={colors.textMuted} />
          <Text style={[styles.miniBtnText, { color: colors.textMuted }]}>Library</Text>
        </Pressable>
      </View>
      <TextInput
        style={[styles.input, styles.urlInputFull, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        value={blocks[index].url || ''}
        onChangeText={(v) => updateBlock(index, { url: v })}
        placeholder="Or paste media URL"
        placeholderTextColor={colors.textLight}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  )

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
            placeholder="Write paragraph content here…"
            placeholderTextColor={colors.textLight}
          />
        )
      case 'HEADING':
        return (
          <View>
            <View style={styles.levelRow}>
              {(['h2', 'h3'] as const).map((lvl) => (
                <Pressable
                  key={lvl}
                  style={[
                    styles.levelChip,
                    { backgroundColor: (block.level || 'h2') === lvl ? colors.primary : colors.surfaceContainer },
                  ]}
                  onPress={() => updateBlock(index, { level: lvl })}
                >
                  <Text
                    style={[
                      styles.levelText,
                      { color: (block.level || 'h2') === lvl ? '#fff' : colors.textMuted },
                    ]}
                  >
                    {lvl === 'h2' ? 'Subheading (H2)' : 'Minor Heading (H3)'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={block.text || ''}
              onChangeText={(v) => updateBlock(index, { text: v })}
              placeholder="Enter section heading..."
              placeholderTextColor={colors.textLight}
            />
          </View>
        )
      case 'QUOTE':
        return (
          <TextInput
            style={[styles.quoteBlock, { backgroundColor: colors.surfaceContainer, borderLeftColor: colors.primary, borderColor: colors.border, color: colors.text }]}
            value={block.text || ''}
            onChangeText={(v) => updateBlock(index, { text: v })}
            multiline
            placeholder="“Notable quote or statement…”"
            placeholderTextColor={colors.textLight}
          />
        )
      case 'IMAGE':
      case 'VIDEO':
        return (
          <View style={styles.mediaFields}>
            {mediaRow(index, block.type, (url) => updateBlock(index, { url }))}
            {block.url ? (
              block.type === 'IMAGE' ? (
                <AdaptiveImage source={{ uri: mediaUrl(block.url) || '' }} maxHeight={320} minHeight={180} borderRadius={8} />
              ) : (
                <VideoThumb url={block.url} />
              )
            ) : null}
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={block.caption || ''}
              onChangeText={(v) => updateBlock(index, { caption: v })}
              placeholder="Caption or description (optional)"
              placeholderTextColor={colors.textLight}
            />
          </View>
        )
      case 'YOUTUBE':
        return (
          <View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={block.embedUrl || ''}
              onChangeText={(v) => updateBlock(index, { embedUrl: v })}
              placeholder="Paste YouTube Video URL (e.g. https://youtu.be/...)"
              placeholderTextColor={colors.textLight}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={block.title || ''}
              onChangeText={(v) => updateBlock(index, { title: v })}
              placeholder="Video title or label (optional)"
              placeholderTextColor={colors.textLight}
            />
          </View>
        )
      case 'DIVIDER':
        return (
          <View style={[styles.divider, { borderColor: colors.border }]}>
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>—— Section Separator ——</Text>
          </View>
        )
      case 'TABLE': {
        const table = block.tableData || {
          hasHeader: true,
          headers: ['Column 1', 'Column 2', 'Column 3'],
          rows: [
            ['Data 1', 'Data 2', 'Data 3'],
            ['Data 4', 'Data 5', 'Data 6'],
          ],
          caption: '',
        }
        const colCount = Math.max(
          table.headers?.length || 0,
          ...table.rows.map((r) => r.length),
          1
        )
        const headers = table.headers || Array.from({ length: colCount }, (_, i) => `Col ${i + 1}`)

        const updateCell = (rowIndex: number, colIndex: number, value: string) => {
          const newRows = table.rows.map((row, rIdx) => {
            if (rIdx !== rowIndex) return row
            const newRow = [...row]
            while (newRow.length <= colIndex) newRow.push('')
            newRow[colIndex] = value
            return newRow
          })
          updateBlock(index, { tableData: { ...table, rows: newRows } })
        }

        const updateHeader = (colIndex: number, value: string) => {
          const newHeaders = [...headers]
          while (newHeaders.length <= colIndex) newHeaders.push('')
          newHeaders[colIndex] = value
          updateBlock(index, { tableData: { ...table, headers: newHeaders } })
        }

        const addRow = () => {
          const newRow = Array(colCount).fill('')
          updateBlock(index, { tableData: { ...table, rows: [...table.rows, newRow] } })
        }

        const removeRow = () => {
          if (table.rows.length <= 1) return
          updateBlock(index, { tableData: { ...table, rows: table.rows.slice(0, -1) } })
        }

        const addCol = () => {
          const newHeaders = [...headers, `Col ${colCount + 1}`]
          const newRows = table.rows.map((row) => [...row, ''])
          updateBlock(index, { tableData: { ...table, headers: newHeaders, rows: newRows } })
        }

        const removeCol = () => {
          if (colCount <= 1) return
          const newHeaders = headers.slice(0, -1)
          const newRows = table.rows.map((row) => row.slice(0, -1))
          updateBlock(index, { tableData: { ...table, headers: newHeaders, rows: newRows } })
        }

        return (
          <View style={styles.tableEditorContainer}>
            {/* Caption Input */}
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, marginBottom: 8 }]}
              value={table.caption || ''}
              onChangeText={(v) => updateBlock(index, { tableData: { ...table, caption: v } })}
              placeholder="Table title / caption (optional)"
              placeholderTextColor={colors.textLight}
            />

            {/* Quick Action Controls */}
            <View style={styles.tableControlsRow}>
              <Pressable
                style={[
                  styles.tableControlBtn,
                  { backgroundColor: table.hasHeader !== false ? colors.primary : colors.surfaceContainer },
                ]}
                onPress={() => updateBlock(index, { tableData: { ...table, hasHeader: table.hasHeader === false } })}
              >
                <Ionicons name="text-outline" size={13} color={table.hasHeader !== false ? '#fff' : colors.textMuted} />
                <Text style={[styles.tableControlText, { color: table.hasHeader !== false ? '#fff' : colors.textMuted }]}>
                  {table.hasHeader !== false ? 'Header ON' : 'Header OFF'}
                </Text>
              </Pressable>

              <View style={styles.tableActionGroup}>
                <Pressable style={[styles.tableMiniBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]} onPress={addCol}>
                  <Ionicons name="add" size={13} color={colors.primary} />
                  <Text style={[styles.tableMiniBtnText, { color: colors.text }]}>Col</Text>
                </Pressable>
                {colCount > 1 && (
                  <Pressable style={[styles.tableMiniBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]} onPress={removeCol}>
                    <Ionicons name="remove" size={13} color={colors.danger} />
                    <Text style={[styles.tableMiniBtnText, { color: colors.danger }]}>Col</Text>
                  </Pressable>
                )}
                <Pressable style={[styles.tableMiniBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]} onPress={addRow}>
                  <Ionicons name="add" size={13} color={colors.primary} />
                  <Text style={[styles.tableMiniBtnText, { color: colors.text }]}>Row</Text>
                </Pressable>
                {table.rows.length > 1 && (
                  <Pressable style={[styles.tableMiniBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]} onPress={removeRow}>
                    <Ionicons name="remove" size={13} color={colors.danger} />
                    <Text style={[styles.tableMiniBtnText, { color: colors.danger }]}>Row</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Horizontally Scrollable Table Grid */}
            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScroll}>
              <View style={[styles.tableGrid, { borderColor: colors.border, backgroundColor: colors.card }]}>
                {table.hasHeader !== false && (
                  <View style={[styles.tableHeaderRow, { backgroundColor: colors.surfaceContainer, borderBottomColor: colors.border }]}>
                    <View style={[styles.tableIndexCell, { borderRightColor: colors.border }]}>
                      <Text style={[styles.tableIndexText, { color: colors.textLight }]}>#</Text>
                    </View>
                    {headers.map((h, cIdx) => (
                      <View key={cIdx} style={[styles.tableCellWrap, { borderRightColor: colors.border }]}>
                        <TextInput
                          style={[styles.tableHeaderInput, { color: colors.text }]}
                          value={h}
                          onChangeText={(v) => updateHeader(cIdx, v)}
                          placeholder={`Header ${cIdx + 1}`}
                          placeholderTextColor={colors.textLight}
                        />
                      </View>
                    ))}
                  </View>
                )}

                {table.rows.map((row, rIdx) => (
                  <View key={rIdx} style={[styles.tableRow, { borderBottomColor: colors.border }, rIdx % 2 === 1 && { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
                    <View style={[styles.tableIndexCell, { borderRightColor: colors.border }]}>
                      <Text style={[styles.tableIndexText, { color: colors.textLight }]}>{rIdx + 1}</Text>
                    </View>
                    {Array.from({ length: colCount }).map((_, cIdx) => (
                      <View key={cIdx} style={[styles.tableCellWrap, { borderRightColor: colors.border }]}>
                        <TextInput
                          style={[styles.tableCellInput, { color: colors.text }]}
                          value={row[cIdx] || ''}
                          onChangeText={(v) => updateCell(rIdx, cIdx, v)}
                          placeholder="Cell data"
                          placeholderTextColor={colors.textLight}
                        />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )
      }
      default:
        return null
    }
  }

  return (
    <View style={styles.canvasContainer}>
      {/* Canvas Header */}
      <View style={styles.canvasHeader}>
        <View style={styles.canvasBadge}>
          <Ionicons name="document-text" size={13} color="#2563EB" />
          <Text style={styles.canvasBadgeText}>STORY WRITING CANVAS</Text>
        </View>
        <Text style={[styles.canvasTitle, { color: colors.text }]}>
          {blocks.length === 0 ? 'Story Blocks' : `Story Blocks (${blocks.length})`}
        </Text>
        <Text style={[styles.canvasSubtitle, { color: colors.textMuted }]}>
          Build article content with paragraphs, headings, quotes, images & videos.
        </Text>
      </View>

      {/* Existing Blocks List */}
      {blocks.map((block, index) => {
        const blockLabel = TOOLBAR_BLOCKS.find((o) => o.type === block.type)?.label || block.type
        return (
          <View key={block.id} style={{ marginBottom: 12 }}>
            <View style={[styles.blockWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Block Header */}
              <View style={[styles.blockHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.blockTag}>
                  <Text style={[styles.blockLabel, { color: colors.primary }]}>{blockLabel}</Text>
                  <Text style={[styles.blockIndex, { color: colors.textLight }]}>#{index + 1}</Text>
                </View>

                <View style={styles.blockActions}>
                  <Pressable
                    onPress={() => moveBlock(index, -1)}
                    hitSlop={8}
                    disabled={index === 0}
                    style={[styles.actionBtn, index === 0 && { opacity: 0.3 }]}
                  >
                    <Ionicons name="chevron-up" size={16} color={colors.text} />
                  </Pressable>

                  <Pressable
                    onPress={() => moveBlock(index, 1)}
                    hitSlop={8}
                    disabled={index === blocks.length - 1}
                    style={[styles.actionBtn, index === blocks.length - 1 && { opacity: 0.3 }]}
                  >
                    <Ionicons name="chevron-down" size={16} color={colors.text} />
                  </Pressable>

                  <Pressable onPress={() => removeBlock(index)} hitSlop={8} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </Pressable>
                </View>
              </View>

              {/* Block Content Editor */}
              {renderBlockEditor(block, index)}
            </View>

            {/* Quick Insert Between Blocks */}
            <Pressable
              style={styles.insertBetweenBtn}
              onPress={() => setInsertAt(insertAt === index + 1 ? null : index + 1)}
            >
              <Ionicons name={insertAt === index + 1 ? "close-circle" : "add-circle-outline"} size={15} color={colors.primary} />
              <Text style={[styles.insertBetweenText, { color: colors.primary }]}>
                {insertAt === index + 1 ? "Cancel insertion" : "Insert block here"}
              </Text>
            </Pressable>

            {/* Inserter Toolbox at position */}
            {insertAt === index + 1 && (
              <View style={[styles.toolboxCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
                <Text style={[styles.toolboxTitle, { color: colors.textMuted }]}>CHOOSE BLOCK TYPE TO INSERT</Text>
                <View style={styles.toolboxButtons}>
                  {TOOLBAR_BLOCKS.map((b) => (
                    <Pressable
                      key={b.type}
                      style={[styles.toolBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => insertBlockAtPosition(index + 1, b.type)}
                    >
                      <Ionicons name={b.icon} size={14} color={colors.primary} />
                      <Text style={[styles.toolBtnText, { color: colors.text }]}>{b.label}</Text>
                      <View style={[styles.toolBtnAdd, { backgroundColor: colors.primary }]}>
                        <Ionicons name="add" size={11} color="#fff" />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        )
      })}

      {/* Main Toolbox for adding blocks with Blue Accent Pill Design */}
      <View
        style={[
          styles.toolboxCard,
          {
            backgroundColor: isDark ? '#1C2333' : '#FFFFFF',
            borderColor: isDark ? '#2A364F' : '#DBEAFE',
          },
        ]}
      >
        <View style={styles.toolboxTitleRow}>
          <View style={[styles.toolboxDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={[styles.toolboxTitle, { color: colors.text }]}>
            {blocks.length === 0 ? 'SELECT A BLOCK TO START STORY' : 'ADD NEXT BLOCK TO STORY'}
          </Text>
        </View>
        <View style={styles.toolboxButtons}>
          {TOOLBAR_BLOCKS.map((b) => (
            <Pressable
              key={b.type}
              style={({ pressed }) => [
                styles.toolBtn,
                {
                  backgroundColor: isDark ? '#111622' : '#EFF6FF',
                  borderColor: isDark ? '#222C3F' : '#BFDBFE',
                },
                pressed && { opacity: 0.75, borderColor: '#3B82F6' },
              ]}
              onPress={() => appendBlock(b.type)}
            >
              <Ionicons name={b.icon} size={14} color="#2563EB" />
              <Text style={[styles.toolBtnText, { color: isDark ? '#E2E8F0' : '#1E40AF' }]}>{b.label}</Text>
              <View style={[styles.toolBtnAdd, { backgroundColor: '#2563EB' }]}>
                <Ionicons name="add" size={11} color="#fff" />
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Media Picker Modal */}
      <Modal visible={!!picker} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <View style={styles.sheetBackdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Choose from media library</Text>
              <Pressable onPress={() => setPicker(null)} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 380 }}>
              {pickerLoading ? (
                <Text style={[styles.sheetEmpty, { color: colors.textMuted }]}>Loading media…</Text>
              ) : pickerItems.length === 0 ? (
                <Text style={[styles.sheetEmpty, { color: colors.textMuted }]}>No {picker?.kind.toLowerCase()} files found.</Text>
              ) : (
                pickerItems.map((it) => (
                  <Pressable
                    key={it._id}
                    style={[styles.sheetRow, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      picker?.onSelect(it.url, it.originalName)
                      setPicker(null)
                    }}
                  >
                    <View style={[styles.sheetThumb, { backgroundColor: colors.surfaceContainer }]}>
                      {it.kind === 'IMAGE' ? (
                        <Image source={{ uri: mediaUrl(it.url) }} style={styles.sheetThumbImg} contentFit="cover" />
                      ) : (
                        <Ionicons name="videocam" size={18} color={colors.textMuted} />
                      )}
                    </View>
                    <Text style={[styles.sheetName, { color: colors.text }]} numberOfLines={1}>
                      {it.originalName}
                    </Text>
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
  blockWrap: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  blockTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  blockLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  blockIndex: {
    fontSize: 11,
    fontWeight: '600',
  },
  blockActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    padding: 4,
    borderRadius: 6,
  },
  textBlock: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14.5,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  quoteBlock: {
    minHeight: 75,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  levelRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  levelChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mediaFields: {
    gap: 6,
  },
  mediaContainer: {
    gap: 8,
    marginBottom: 8,
  },
  mediaButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  miniBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  urlInputFull: {
    width: '100%',
    marginBottom: 0,
    fontSize: 13,
  },
  mediaPreview: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginBottom: 8,
  },
  divider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 10,
    alignItems: 'center',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  insertBetweenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
    marginTop: 2,
  },
  insertBetweenText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  canvasContainer: {
    marginTop: 4,
    marginBottom: 10,
  },
  canvasHeader: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  canvasBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  canvasBadgeText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#2563EB',
    letterSpacing: 0.7,
  },
  canvasTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  canvasSubtitle: {
    fontSize: 11.5,
    marginTop: 3,
    lineHeight: 16,
  },
  toolboxCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginTop: 4,
  },
  toolboxTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  toolboxDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  toolboxTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  toolboxButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  toolBtnText: {
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  toolBtnAdd: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingBottom: 24, maxHeight: 460 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: 15, fontWeight: '800' },
  sheetEmpty: { fontSize: 13, textAlign: 'center', padding: 24 },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  sheetThumb: { width: 50, height: 38, borderRadius: 6, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sheetThumbImg: { width: '100%', height: '100%' },
  sheetName: { flex: 1, fontSize: 13, fontWeight: '600' },
  tableEditorContainer: {
    marginTop: 4,
  },
  tableControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  tableControlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tableControlText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tableActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tableMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  tableMiniBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  tableScroll: {
    maxHeight: 280,
  },
  tableGrid: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tableIndexCell: {
    width: 28,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  tableIndexText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tableCellWrap: {
    width: 110,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRightWidth: 1,
    justifyContent: 'center',
  },
  tableHeaderInput: {
    fontSize: 12,
    fontWeight: '700',
    padding: 2,
  },
  tableCellInput: {
    fontSize: 12,
    padding: 2,
  },
})