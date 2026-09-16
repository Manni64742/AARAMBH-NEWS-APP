import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text as NativeText,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useRoute, useNavigation } from '@react-navigation/native'
import { commentApi, contentApi, interactionApi, reporterApi, userApi } from '../api/endpoints'
import { ArticleBlock, CommentItem, ContentItem, ReporterPublicProfile } from '../types'
import { colors, fonts, fontFor, radius } from '../theme'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { ScaledText as Text } from '../components/ScaledText'
import { useTheme } from '../context/ThemeContext'
import { mediaUrl } from '../config'
import { errorMessage } from '../api/client'
import { NewsCard, SectionHeader } from '../components/NewsCard'
import { AdBanner, showInterstitialIfEnabled } from '../components/AdBanner'
import { YouTubePlayer } from '../components/YouTubePlayer'
import { AppBackButton } from '../components/AppBackButton'
import { videoIdFromUrl } from '../utils/youtube'
import { ArticleWatermark } from '../components/ArticleWatermark'

function formatCommentTime(dateStr?: string | Date) {
  if (!dateStr) return 'Recently'
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffSec < 60) return 'Just now'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  } catch {
    return 'Recently'
  }
}

const stripHtml = (html = '') => html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()

const inlineImageSource = (tag: string) => {
  const match = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)
  return match?.[1] ? mediaUrl(match[1]) : null
}

function TextBlockView({ html = '' }: { html?: string }) {
  const { colors, fontScale } = useTheme()
  const parts = html.split(/(<img\b[^>]*>)/gi)
  const hasInlineImage = parts.some((part) => /^<img\b/i.test(part) && inlineImageSource(part))
  if (!hasInlineImage) {
    const text = stripHtml(html)
    return (
      <NativeText
        style={[
          styles.articleText,
          {
            color: colors.text,
            fontFamily: fontFor(text, 400),
            fontSize: Math.round(18 * fontScale),
            lineHeight: Math.round(30 * fontScale),
          },
        ]}
      >
        {text}
      </NativeText>
    )
  }
  return (
    <View style={styles.articleFlow}>
      {parts.map((part, index) => {
        if (/^<img\b/i.test(part)) {
          const source = inlineImageSource(part)
          return source ? (
            <View key={`image-${index}`} style={styles.inlineImageWrap}>
              <Image source={{ uri: source }} style={styles.inlineImage} contentFit="contain" />
              <ArticleWatermark />
            </View>
          ) : null
        }
        const text = stripHtml(part)
        return text ? (
          <NativeText
            key={`text-${index}`}
            style={[
              styles.articleText,
              {
                color: colors.text,
                fontFamily: fontFor(text, 400),
                fontSize: Math.round(18 * fontScale),
                lineHeight: Math.round(30 * fontScale),
              },
            ]}
          >
            {text}
          </NativeText>
        ) : null
      })}
    </View>
  )
}

function BlockView({ block }: { block: ArticleBlock }) {
  const { colors, fontScale } = useTheme()
  const text = block.type === 'TEXT' ? stripHtml(block.html) : block.text || ''
  if (block.type === 'TEXT')
    return <TextBlockView html={block.html} />
  if (block.type === 'HEADING')
    return (
      <NativeText
        style={[
          styles.blockHeading,
          {
            color: colors.text,
            fontFamily: fontFor(text, 700),
            fontSize: Math.round(21 * fontScale),
            lineHeight: Math.round(29 * fontScale),
          },
        ]}
      >
        {text}
      </NativeText>
    )
  if (block.type === 'QUOTE')
    return (
      <View style={[styles.quote, { backgroundColor: colors.primarySoft, borderLeftColor: colors.primary }]}>
        <NativeText
          style={[
            styles.quoteText,
            {
              color: colors.text,
              fontFamily: fontFor(text, 400),
              fontSize: Math.round(16 * fontScale),
              lineHeight: Math.round(25 * fontScale),
            },
          ]}
        >
          “{text}”
        </NativeText>
      </View>
    )
  if (block.type === 'DIVIDER') return <View style={styles.divider} />
  if (block.type === 'IMAGE')
    return block.url ? (
      <View style={styles.blockImageWrap}>
        <View style={styles.blockImageBox}>
          <Image source={{ uri: mediaUrl(block.url) }} style={styles.blockImage} contentFit="cover" />
          <ArticleWatermark />
        </View>
        {block.caption ? (
          <NativeText style={[styles.blockImageCaption, { color: colors.textMuted }]}>{block.caption}</NativeText>
        ) : null}
      </View>
    ) : null
  if (block.type === 'GALLERY')
    return (
      <View style={styles.gallery}>
        {(block.items || []).map((it) => (
          <View key={it.id} style={styles.galleryImageWrap}>
            <Image source={{ uri: mediaUrl(it.url) }} style={styles.galleryImage} contentFit="cover" />
            <ArticleWatermark compact />
          </View>
        ))}
      </View>
    )
  if (block.type === 'VIDEO') {
    const ytId = videoIdFromUrl(block.url)
    if (ytId) {
      return (
        <View style={styles.blockYtWrap}>
          <YouTubePlayer videoId={ytId} showOpenButton />
        </View>
      )
    }
    const player = useVideoPlayer(block.url ? (mediaUrl(block.url) as any) : null)
    return <VideoView player={player} style={styles.blockVideo} contentFit="contain" />
  }
  if (block.type === 'AUDIO') return null
  if (block.type === 'EMBED') {
    const ytId = videoIdFromUrl(block.embedUrl)
    if (ytId) {
      return (
        <View style={styles.blockYtWrap}>
          <YouTubePlayer videoId={ytId} showOpenButton />
        </View>
      )
    }
    return (
      <Pressable onPress={() => block.embedUrl && Linking.openURL(block.embedUrl).catch(() => {})}>
        <View style={[styles.embed, { backgroundColor: colors.surfaceContainer }]}>
          <Ionicons name="link" size={16} color={colors.primary} />
          <Text style={[styles.embedText, { color: colors.primary }]}>{block.title || block.embedUrl}</Text>
        </View>
      </Pressable>
    )
  }
  if (block.type === 'YOUTUBE') {
    const ytId = videoIdFromUrl(block.embedUrl) || block.embedUrl
    if (ytId) {
      return (
        <View style={styles.blockYtWrap}>
          <YouTubePlayer videoId={ytId} showOpenButton />
          {block.title ? (
            <Text style={[styles.blockYtTitle, { color: colors.textMuted }]}>{block.title}</Text>
          ) : null}
        </View>
      )
    }
    return (
      <Pressable onPress={() => block.embedUrl && Linking.openURL(block.embedUrl).catch(() => {})}>
        <View style={[styles.embed, { backgroundColor: colors.surfaceContainer }]}>
          <Ionicons name="logo-youtube" size={16} color={colors.primary} />
          <Text style={[styles.embedText, { color: colors.primary }]}>{block.title || 'YouTube video'}</Text>
        </View>
      </Pressable>
    )
  }
  if (block.type === 'ADVERTISEMENT')
    return (
      <View style={[styles.embed, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
        <Ionicons name="megaphone-outline" size={16} color={colors.textMuted} />
        <Text style={[styles.embedText, { color: colors.textMuted }]}>{block.caption || (block.adSlot ? `Advertisement · ${block.adSlot}` : 'Advertisement')}</Text>
      </View>
    )
  if (block.type === 'RELATED_STORY')
    return block.relatedTitle ? (
      <Pressable>
        <View style={[styles.embed, { backgroundColor: colors.surfaceContainer }]}>
          <Ionicons name="newspaper-outline" size={16} color={colors.primary} />
          <Text style={[styles.embedText, { color: colors.primary }]}>{block.relatedTitle}</Text>
        </View>
      </Pressable>
    ) : null
  return null
}

export default function NewsDetailScreen() {
  const route = useRoute() as any
  const navigation = useNavigation() as any
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const { success, error } = useToast()
  const { user } = useAuth()
  const { colors: themeColors, fontScale, fontMode, setFontMode, isDark, toggleTheme } = useTheme()
  const [item, setItem] = useState<ContentItem | null>(route.params?.item || null)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [related, setRelated] = useState<ContentItem[]>([])
  const [reporter, setReporter] = useState<ReporterPublicProfile | null>(null)
  const [commentText, setCommentText] = useState('')
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [commentSheetVisible, setCommentSheetVisible] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [fontMenuOpen, setFontMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [captionVisible, setCaptionVisible] = useState(false)
  const captionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const commentScrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    const onShow = (e: any) => {
      const h = e?.endCoordinates?.height || 0
      setKeyboardHeight(h)
      setIsKeyboardVisible(true)
    }

    const onHide = () => {
      setKeyboardHeight(0)
      setIsKeyboardVisible(false)
    }

    const showSub = Keyboard.addListener(showEvent, onShow)
    const hideSub = Keyboard.addListener(hideEvent, onHide)

    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  const toggleCaption = useCallback(() => {
    setCaptionVisible((prev) => {
      const next = !prev
      if (captionTimerRef.current) clearTimeout(captionTimerRef.current)
      if (next) {
        captionTimerRef.current = setTimeout(() => {
          setCaptionVisible(false)
        }, 5000)
      }
      return next
    })
  }, [])

  useEffect(() => {
    return () => {
      if (captionTimerRef.current) clearTimeout(captionTimerRef.current)
    }
  }, [])

  const id = item?._id || route.params?.id

  const refresh = useCallback(async () => {
    if (!id) return
    try {
      const fresh = await contentApi.get(id)
      if (!fresh) return
      setItem(fresh)
      const [c, r] = await Promise.all([
        commentApi.list(id).catch(() => []),
        contentApi.related(fresh).catch(() => ({ data: [] as ContentItem[] })),
      ])
      setComments(c)
      setRelated((r.data || []).filter((x) => x._id !== id).slice(0, 10))
      if (fresh.author?._id) {
        reporterApi.byUser(fresh.author._id).then(setReporter).catch(() => setReporter(null))
      } else {
        setReporter(null)
      }
      if (user) {
        const st = await interactionApi.status(id).catch(() => null)
        if (st) {
          setLiked(st.liked)
          setFavorited(st.favorited)
          setBookmarked(st.bookmarked)
        }
        userApi.recordRead(id).catch(() => {})
      }
    } catch {}
  }, [id, user])

  useEffect(() => {
    refresh()
    contentApi.recordView(id).then(() => refresh()).catch(() => {})
    showInterstitialIfEnabled()
  }, [id])

  const toggle = async (type: 'LIKE' | 'FAVORITE' | 'BOOKMARK') => {
    if (!user) {
      error('Login required')
      navigation.navigate('Login')
      return
    }
    try {
      const res = await interactionApi.toggle(id, type)
      success(res.message || 'Updated')
      refresh()
    } catch (e) {
      error(errorMessage(e))
    }
  }

  const handleSaveToggle = async () => {
    if (!user) {
      error('Please login to save stories')
      navigation.navigate('Login')
      return
    }
    const next = !bookmarked
    setBookmarked(next)
    try {
      const res = await interactionApi.toggle(id, 'BOOKMARK')
      success(next ? 'Article saved to bookmarks' : 'Article removed from saved')
    } catch (e) {
      setBookmarked(!next)
      error(errorMessage(e))
    }
  }

  const handleNativeShare = async () => {
    if (!item) return
    const url = `https://aarambhnews.com/news/${item.slug || item._id}`
    const text = `${item.title}\n\n${url}`
    try {
      await Share.share(
        {
          title: item.title,
          message: text,
          url: Platform.OS === 'ios' ? url : undefined,
        },
        {
          dialogTitle: `Share: ${item.title}`,
        }
      )
    } catch (err) {
      console.warn('Share error:', err)
    }
  }

  const shareMessage = () => `${item?.title}\n\nRead on Aarambh News`

  const shareTo = async (platform: 'whatsapp' | 'facebook' | 'twitter' | 'more', e: any) => {
    e?.stopPropagation?.()
    const text = shareMessage()
    const url = `https://aarambhnews.com/news/${item?.slug || ''}`
    const urls: Record<string, string> = {
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n' + url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    }
    if (platform === 'more') {
      try {
        await Share.share({ message: `${text}\n${url}`, title: item?.title })
      } catch {}
      return
    }
    Linking.openURL(urls[platform]).catch(() =>
      Share.share({ message: `${text}\n${url}`, title: item?.title }).catch(() => {})
    )
  }

  const addComment = async () => {
    if (!commentText.trim()) return
    if (!user) {
      error('Login required to comment')
      navigation.navigate('Login')
      return
    }
    const textToSend = commentText.trim()
    try {
      const added = await commentApi.add(id, textToSend)
      setCommentText('')
      success('Comment added')
      if (added && (added as any)._id) {
        setComments((prev) => [added as any, ...prev])
      }
      refresh()
    } catch (e) {
      error(errorMessage(e))
    }
  }

  const ytVideoId = item ? (item.youtubeId || (item.youtubeUrl ? videoIdFromUrl(item.youtubeUrl) : null)) : null
  const image = item ? mediaUrl(item.featuredImage?.url) : null
  const videoSrc = item ? mediaUrl(item.shortVideoPayload?.videoUrl || item.videoPayload?.videoUrl) : null
  const videoPlayer = useVideoPlayer(item && videoSrc ? (videoSrc as any) : null)

  const insets = useSafeAreaInsets()
  const topInset = insets.top
  const headerTotalHeight = topInset + 48

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0
  const availableHeightAboveKeyboard = screenHeight - keyboardHeight - insets.top - statusBarHeight - 16
  const maxSheetHeight = isKeyboardVisible
    ? Math.max(Math.min(availableHeightAboveKeyboard, 520), 240)
    : Math.min(screenHeight * 0.75, 620)
  const sheetBottomPadding = isKeyboardVisible
    ? (Platform.OS === 'ios' ? 8 : 6)
    : Math.max(insets.bottom, 12)

  if (!item) return null

  const captionText =
    item.imageCaption ||
    item.featuredImage?.caption ||
    item.featuredImage?.alt ||
    (item.featuredImage?.credit ? `फ़ोटो: ${item.featuredImage.credit}` : null) ||
    `${item.title} · (फ़ोटो: Aarambh News Archive / PTI)`

  return (
    <View style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerTotalHeight, paddingBottom: 76 + Math.max(insets.bottom, 12) }}
        scrollIndicatorInsets={{ top: headerTotalHeight }}
      >

        {related.length > 0 ? <View style={[styles.focusStrip, { backgroundColor: themeColors.surfaceContainer, borderBottomColor: themeColors.border }]}>
          <View style={styles.focusLabel}><Text numberOfLines={1} style={[styles.focusLabelText, { color: themeColors.primary }]}>INFO</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.focusCards}>
            {related.slice(0, 6).map((story) => {
              const storyImage = mediaUrl(story.featuredImage?.url)
              return <Pressable key={story._id} style={[styles.focusCard, { width: Math.min(screenWidth * 0.78, 286), backgroundColor: themeColors.card, borderColor: themeColors.border }]} onPress={() => navigation.push('NewsDetail', { item: story })}>
                <Text style={[styles.focusTitle, { color: themeColors.text, fontFamily: fontFor(story.title, 700) }]} numberOfLines={3}>{story.title}</Text>
                {storyImage ? <Image source={{ uri: storyImage }} style={styles.focusImage} contentFit="cover" /> : <View style={[styles.focusPlaceholder, { backgroundColor: themeColors.surfaceVariant, borderColor: themeColors.border }]}><Ionicons name="newspaper-outline" size={20} color={themeColors.textMuted} /></View>}
              </Pressable>
            })}
          </ScrollView>
        </View> : null}

        <View style={styles.body}>
          <View style={styles.metaRow}>
            {item.category?.name ? (
              <View style={[styles.categoryBadgeWrap, { backgroundColor: isDark ? 'rgba(30, 58, 138, 0.35)' : '#EFF6FF', borderColor: isDark ? '#1E3A8A' : '#DBEAFE' }]}>
                <Text style={[styles.categoryBadgeText, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>
                  {item.category.name.hi || item.category.name.en}
                </Text>
              </View>
            ) : null}
            {item.flags?.isBreaking ? (
              <View style={[styles.badgePill, { backgroundColor: '#DC2626' }]}>
                <Text style={styles.badgePillText}>⚡ BREAKING</Text>
              </View>
            ) : null}
            {item.flags?.isFeatured ? (
              <View style={[styles.badgePill, { backgroundColor: '#D97706' }]}>
                <Text style={styles.badgePillText}>★ FEATURED</Text>
              </View>
            ) : null}
            {item.flags?.isExclusive ? (
              <View style={[styles.badgePill, { backgroundColor: '#7C3AED' }]}>
                <Text style={styles.badgePillText}>EXCLUSIVE</Text>
              </View>
            ) : null}
            {item.flags?.isLiveCoverage ? (
              <View style={[styles.badgePill, { backgroundColor: '#E11D48' }]}>
                <Text style={styles.badgePillText}>🔴 LIVE</Text>
              </View>
            ) : null}
            {item.flags?.priority === 'CRITICAL' ? (
              <View style={[styles.badgePill, { backgroundColor: '#9F1239' }]}>
                <Text style={styles.badgePillText}>CRITICAL</Text>
              </View>
            ) : null}
            {item.flags?.isSponsored ? (
              <View style={[styles.badgePill, { backgroundColor: '#059669' }]}>
                <Text style={styles.badgePillText}>
                  SPONSORED {item.flags.sponsorName ? `· ${item.flags.sponsorName}` : ''}
                </Text>
              </View>
            ) : null}
            {item.flags?.isUpdated ? (
              <View style={[styles.badgePill, { backgroundColor: '#0284C7' }]}>
                <Text style={styles.badgePillText}>UPDATED</Text>
              </View>
            ) : null}
          </View>
          {ytVideoId ? (
            <View style={styles.ytHeroWrap}>
              <YouTubePlayer videoId={ytVideoId} showOpenButton />
            </View>
          ) : videoSrc ? (
            <VideoView player={videoPlayer} style={styles.hero} contentFit="contain" />
          ) : image ? (
            <View style={[styles.heroWrap, { backgroundColor: themeColors.surfaceContainer }]}>
              <Image source={{ uri: image }} style={styles.hero} contentFit="cover" transition={200} />
              
              {!captionVisible && (
                <>
                  <ArticleWatermark />
                  <View style={styles.heroControls}>
                    <Pressable
                      style={styles.heroControlBtn}
                      onPress={toggleCaption}
                      hitSlop={8}
                      accessibilityLabel="Image Info"
                    >
                      <Ionicons name="information-circle-outline" size={20} color="#fff" />
                    </Pressable>
                  </View>
                </>
              )}

              {captionVisible && (
                <View style={styles.captionOverlay}>
                  <Text style={[styles.captionText, { fontSize: Math.round(12.5 * fontScale), lineHeight: Math.round(17 * fontScale) }]}>
                    {captionText}
                  </Text>
                  <Pressable
                    style={styles.captionCloseBtn}
                    onPress={() => {
                      if (captionTimerRef.current) clearTimeout(captionTimerRef.current)
                      setCaptionVisible(false)
                    }}
                    hitSlop={10}
                    accessibilityLabel="Close Caption"
                  >
                    <Ionicons name="close-circle" size={22} color="rgba(255, 255, 255, 0.88)" />
                  </Pressable>
                </View>
              )}
            </View>
          ) : null}

          <NativeText style={[styles.title, { color: themeColors.text, fontFamily: fontFor(item.title, 700), fontSize: Math.round(26 * fontScale), lineHeight: Math.round(34 * fontScale) }]}>{item.title}</NativeText>
          {item.summary ? <NativeText style={[styles.summary, { color: themeColors.textMuted, fontFamily: fontFor(item.summary, 400), fontSize: Math.round(16.5 * fontScale), lineHeight: Math.round(25 * fontScale) }]}>{item.summary}</NativeText> : null}

          <View style={[styles.byline, { borderBottomColor: themeColors.border }]}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{(item.author?.name || 'A').charAt(0)}</Text></View>
            <View style={styles.bylineInfo}>
              <Text style={[styles.author, { color: themeColors.text }]}>{item.author?.name || 'Aarambh News'}</Text>
              <Text style={[styles.bylineMeta, { color: themeColors.textMuted }]}>{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : 'Recently'} · {item.location?.primary?.city || item.location?.primary?.state || 'India'}</Text>
              {(item.metrics?.views ?? 0) > 0 ? (
                <View style={styles.viewCountRow}>
                  <Ionicons
                    name="eye-outline"
                    size={14}
                    color={isDark ? '#60A5FA' : '#2563EB'}
                    style={styles.viewEyeIcon}
                  />
                  <Text style={[styles.viewCountText, { color: isDark ? '#93C5FD' : '#2563EB' }]}>
                    {item.metrics!.views! >= 1000 ? `${(item.metrics!.views! / 1000).toFixed(1)}k` : item.metrics!.views!} {item.metrics!.views === 1 ? 'view' : 'views'}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {item.flags?.isCorrection && item.flags?.correctionNote ? (
            <View style={[styles.correctionBox, { backgroundColor: isDark ? '#2D2006' : '#FEF3C7', borderColor: isDark ? '#78350F' : '#F59E0B' }]}>
              <View style={styles.correctionHeader}>
                <Ionicons name="alert-circle" size={15} color={isDark ? '#FBBF24' : '#B45309'} />
                <Text style={[styles.correctionTitle, { color: isDark ? '#FBBF24' : '#B45309' }]}>CORRECTION</Text>
              </View>
              <Text style={[styles.correctionBody, { color: isDark ? '#FDE68A' : '#92400E' }]}>
                {item.flags.correctionNote}
              </Text>
            </View>
          ) : null}

          {(item.bodyBlocks || []).map((block) => (
            <BlockView key={block.id} block={block} />
          ))}
          {!item.bodyBlocks?.length && item.content ? (
            <NativeText style={[styles.articleText, { color: themeColors.text, fontFamily: fontFor(item.content, 400), fontSize: Math.round(18 * fontScale), lineHeight: Math.round(30 * fontScale) }]}>{item.content}</NativeText>
          ) : null}

          {item.tags?.length ? (
            <View style={styles.tags}>
              {item.tags.map((tag) => (
                <Text key={tag} style={styles.tag}>
                  #{tag}
                </Text>
              ))}
            </View>
          ) : null}

          <View style={styles.interactRow}>
            <Pressable style={styles.shareIcon} onPress={() => toggle('LIKE')}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? themeColors.primary : themeColors.textMuted} />
            </Pressable>
            <Pressable style={styles.shareIcon} onPress={() => toggle('FAVORITE')}>
              <Ionicons name={favorited ? 'star' : 'star-outline'} size={20} color={favorited ? '#9a5b00' : themeColors.textMuted} />
            </Pressable>
            <Pressable style={styles.shareIcon} onPress={(e) => shareTo('facebook', e)}>
              <Ionicons name="logo-facebook" size={20} color={themeColors.textMuted} />
            </Pressable>
            <Pressable style={styles.shareIcon} onPress={(e) => shareTo('whatsapp', e)}>
              <Ionicons name="logo-whatsapp" size={20} color={themeColors.textMuted} />
            </Pressable>
            <Pressable style={styles.shareIcon} onPress={(e) => shareTo('twitter', e)}>
              <Ionicons name="logo-twitter" size={20} color={themeColors.textMuted} />
            </Pressable>
            <Pressable style={styles.shareIcon} onPress={(e) => shareTo('more', e)}>
              <Ionicons name="share-social-outline" size={20} color={themeColors.textMuted} />
            </Pressable>
            <Pressable style={styles.commentCount} onPress={() => {}}>
              <Text style={[styles.commentCountText, { color: themeColors.textMuted }]}>{comments.length || 0} comments</Text>
            </Pressable>
          </View>

          {/* AD SLOT */}
          <AdBanner slot="article_bottom" />

          <SectionHeader title="Comments" />
          {comments.length === 0 ? (
            <Text style={[styles.noComments, { color: themeColors.textLight }]}>Be the first to comment</Text>
          ) : (
            comments.map((c) => (
              <View key={c._id} style={styles.comment}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>{(c.userId?.name || 'U').charAt(0)}</Text>
                </View>
                <View style={styles.commentBody}>
                  <Text style={[styles.commentAuthor, { color: themeColors.text }]}>{c.userId?.name}</Text>
                  <Text style={[styles.commentText, { color: themeColors.textMuted }]}>{c.commentText}</Text>
                </View>
              </View>
            ))
          )}
          <View style={styles.commentInputRow}>
            <TextInput
              style={[styles.commentInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a comment..."
              placeholderTextColor={themeColors.textLight}
            />
            <Pressable style={styles.sendBtn} onPress={addComment}>
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          </View>

          {/* Reporter identity card at the end of the story */}
          {reporter ? (
            <View style={[styles.reporterCard, { backgroundColor: themeColors.surfaceContainer, borderColor: themeColors.border }]}>
              <View style={[styles.reporterAvatar, { backgroundColor: themeColors.primary }]}>
                {reporter.photo ? (
                  <Image source={{ uri: mediaUrl(reporter.photo) }} style={styles.reporterPhoto} contentFit="cover" />
                ) : (
                  <Text style={styles.reporterAvatarText}>{(reporter.name || 'R').charAt(0)}</Text>
                )}
              </View>
              <View style={styles.reporterInfo}>
                <Text style={[styles.reporterName, { color: themeColors.text }]}>{reporter.name}</Text>
                <Text style={[styles.reporterMeta, { color: themeColors.textMuted }]}>
                  {[reporter.designation, reporter.badge].filter(Boolean).join(' · ')}
                </Text>
                <Text style={[styles.reporterMeta, { color: themeColors.textMuted }]}>
                  Reporter ID: {reporter.reporterId}
                </Text>
              </View>
              <Ionicons name="shield-checkmark" size={20} color="#2563EB" />
            </View>
          ) : null}
        </View>

        {/* Suggested News — strictly category & subcategory relevant */}
        {related.length > 0 ? (
          <View style={styles.suggestedNewsSection}>
            <View style={{ paddingHorizontal: 16 }}>
              <SectionHeader title="Suggested News" />
            </View>
            {related.map((rel) => (
              <NewsCard key={rel._id} item={rel} compact onPress={() => navigation.push('NewsDetail', { item: rel })} />
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Glossy Translucent / Frosted Glass Top Header */}
      <View
        style={[
          styles.topBar,
          {
            height: headerTotalHeight,
            paddingTop: topInset,
            backgroundColor: Platform.OS === 'web'
              ? (isDark ? 'rgba(26, 28, 32, 0.92)' : 'rgba(255, 255, 255, 0.92)')
              : (isDark ? '#1a1c20' : '#ffffff'),
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <View style={styles.topBarRow}>
          <AppBackButton onPress={() => navigation.goBack()} size={34} style={{ marginRight: 8 }} />
          <Text style={[styles.sectionName, { color: themeColors.text }]} numberOfLines={1}>{item.category?.name?.en || 'News'}</Text>
          <View style={styles.topActions}>
            <Pressable style={styles.actionBtn} onPress={() => { setSettingsOpen((open) => !open); setFontMenuOpen(false); setThemeMenuOpen(false) }}>
              <Ionicons name="ellipsis-vertical" size={20} color={themeColors.text} />
            </Pressable>
          </View>
        </View>
        {settingsOpen ? (
          <View style={[styles.settingsMenu, { top: topInset + 44, backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Pressable style={styles.settingsRow} onPress={() => setFontMenuOpen((open) => !open)}>
              <Ionicons name="text-outline" size={18} color={themeColors.primary} />
              <Text style={[styles.settingsLabel, { color: themeColors.text }]}>Font Size</Text>
              <Text style={[styles.settingsValue, { color: themeColors.textMuted }]}>{fontMode}</Text>
              <Ionicons name={fontMenuOpen ? 'chevron-up' : 'chevron-down'} size={16} color={themeColors.textMuted} />
            </Pressable>
            {fontMenuOpen ? <View style={[styles.choiceGroup, { borderTopColor: themeColors.border }]}>{(['small', 'medium', 'large'] as const).map((mode) => <Pressable key={mode} style={[styles.choiceRow, fontMode === mode && { backgroundColor: themeColors.primarySoft }]} onPress={() => setFontMode(mode)}><Text style={[styles.choiceText, { color: fontMode === mode ? themeColors.primary : themeColors.text }]}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</Text>{fontMode === mode ? <Ionicons name="checkmark" size={17} color={themeColors.primary} /> : null}</Pressable>)}</View> : null}
            <Pressable style={[styles.settingsRow, { borderTopColor: themeColors.border }]} onPress={() => setThemeMenuOpen((open) => !open)}>
              <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={18} color={themeColors.primary} />
              <Text style={[styles.settingsLabel, { color: themeColors.text }]}>Theme</Text>
              <Text style={[styles.settingsValue, { color: themeColors.textMuted }]}>{isDark ? 'Dark' : 'Light'}</Text>
              <Ionicons name={themeMenuOpen ? 'chevron-up' : 'chevron-down'} size={16} color={themeColors.textMuted} />
            </Pressable>
            {themeMenuOpen ? <View style={[styles.choiceGroup, { borderTopColor: themeColors.border }]}>{(['light', 'dark'] as const).map((mode) => <Pressable key={mode} style={[styles.choiceRow, (isDark ? mode === 'dark' : mode === 'light') && { backgroundColor: themeColors.primarySoft }]} onPress={() => { if ((mode === 'dark') !== isDark) toggleTheme() }}><Text style={[styles.choiceText, { color: (isDark ? mode === 'dark' : mode === 'light') ? themeColors.primary : themeColors.text }]}>{mode === 'dark' ? 'Dark Mode' : 'Light Mode'}</Text>{(isDark ? mode === 'dark' : mode === 'light') ? <Ionicons name="checkmark" size={17} color={themeColors.primary} /> : null}</Pressable>)}</View> : null}
          </View>
        ) : null}
      </View>

      {/* Full-Width Bottom Action Bar: [ Share ]      [ 💬 3 ]      [ Save ] */}
      <View
        style={[
          styles.bottomActionBar,
          {
            backgroundColor: isDark ? '#121417' : '#FFFFFF',
            borderTopColor: isDark ? '#252830' : '#E3E2E4',
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}
      >
        <View style={styles.bottomActionInner}>
          {/* Share Action */}
          <Pressable
            style={({ pressed }) => [styles.bottomActionBtn, pressed && styles.actionBtnPressed]}
            onPress={handleNativeShare}
            accessibilityLabel="Share Article"
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 16, right: 16 }}
          >
            <Ionicons name="share-social-outline" size={23} color={themeColors.text} />
          </Pressable>

          {/* Comment Action: clean icon + count side-by-side */}
          <Pressable
            style={({ pressed }) => [styles.bottomActionBtn, pressed && styles.actionBtnPressed]}
            onPress={() => setCommentSheetVisible(true)}
            accessibilityLabel="Article Comments"
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 16, right: 16 }}
          >
            <View style={styles.commentBtnContent}>
              <Ionicons name="chatbubble-ellipses-outline" size={23} color={themeColors.text} />
              <Text style={[styles.bottomCommentCountText, { color: themeColors.text }]}>
                {comments.length}
              </Text>
            </View>
          </Pressable>

          {/* Save / Bookmark Action */}
          <Pressable
            style={({ pressed }) => [styles.bottomActionBtn, pressed && styles.actionBtnPressed]}
            onPress={handleSaveToggle}
            accessibilityLabel={bookmarked ? 'Remove from Saved' : 'Save Article'}
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 16, right: 16 }}
          >
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={23}
              color={bookmarked ? themeColors.primary : themeColors.text}
            />
          </Pressable>
        </View>
      </View>

      {/* Compact Comments Bottom Sheet Modal */}
      <Modal
        visible={commentSheetVisible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => {
          Keyboard.dismiss()
          setCommentSheetVisible(false)
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={0}
          style={styles.commentModalOverlay}
        >
          <Pressable
            style={styles.commentModalBackdrop}
            onPress={() => {
              Keyboard.dismiss()
              setCommentSheetVisible(false)
            }}
            accessibilityLabel="Dismiss comments sheet"
          />
          <View
            style={[
              styles.commentSheetContainer,
              {
                backgroundColor: themeColors.card,
                borderTopColor: themeColors.border,
                paddingBottom: sheetBottomPadding,
                maxHeight: maxSheetHeight,
              },
            ]}
          >
            {/* Handle bar */}
            <View style={styles.sheetHandleWrap}>
              <View style={[styles.sheetHandle, { backgroundColor: themeColors.border }]} />
            </View>

            {/* Sheet Header */}
            <View style={[styles.commentSheetHeader, { borderBottomColor: themeColors.border }]}>
              <View style={styles.commentSheetHeaderLeft}>
                <Ionicons name="chatbubbles-outline" size={20} color={themeColors.primary} />
                <Text style={[styles.commentSheetTitle, { color: themeColors.text }]}>Comments</Text>
                <View style={[styles.commentCountPill, { backgroundColor: themeColors.surfaceVariant }]}>
                  <Text style={[styles.commentCountPillText, { color: themeColors.textMuted }]}>
                    {comments.length}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.commentSheetCloseBtn}
                onPress={() => {
                  Keyboard.dismiss()
                  setCommentSheetVisible(false)
                }}
                hitSlop={10}
                accessibilityLabel="Close comments"
              >
                <Ionicons name="close" size={22} color={themeColors.textMuted} />
              </Pressable>
            </View>

            {/* Comments List */}
            <ScrollView
              ref={commentScrollRef}
              style={styles.commentListScroll}
              contentContainerStyle={styles.commentListContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              showsVerticalScrollIndicator={true}
            >
              {comments.length === 0 ? (
                <View style={styles.emptyCommentsWrap}>
                  <Ionicons name="chatbubble-ellipses-outline" size={44} color={themeColors.textLight} />
                  <Text style={[styles.emptyCommentsTitle, { color: themeColors.text }]}>No comments yet</Text>
                  <Text style={[styles.emptyCommentsSub, { color: themeColors.textMuted }]}>
                    Be the first to share your thoughts on this story!
                  </Text>
                </View>
              ) : (
                comments.map((c) => (
                  <View key={c._id} style={[styles.sheetCommentItem, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                    <View style={[styles.sheetCommentAvatar, { backgroundColor: themeColors.primarySoft }]}>
                      <Text style={[styles.sheetCommentAvatarText, { color: themeColors.primary }]}>
                        {(c.userId?.name || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.sheetCommentBody}>
                      <View style={styles.sheetCommentMetaRow}>
                        <Text style={[styles.sheetCommentAuthor, { color: themeColors.text }]}>
                          {c.userId?.name || 'Reader'}
                        </Text>
                        <Text style={[styles.sheetCommentTime, { color: themeColors.textLight }]}>
                          {formatCommentTime(c.createdAt)}
                        </Text>
                      </View>
                      <Text style={[styles.sheetCommentText, { color: themeColors.text }]}>
                        {c.commentText}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Fixed Comment Input at Bottom of Sheet */}
            <View style={[styles.sheetInputBar, { borderTopColor: themeColors.border, backgroundColor: themeColors.card, paddingBottom: isKeyboardVisible ? 6 : 10 }]}>
              <TextInput
                style={[
                  styles.sheetTextInput,
                  {
                    backgroundColor: themeColors.surfaceVariant,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  },
                ]}
                value={commentText}
                onChangeText={setCommentText}
                placeholder={user ? "Write a comment..." : "Login to write a comment..."}
                placeholderTextColor={themeColors.textLight}
                multiline={false}
                returnKeyType="send"
                onSubmitEditing={addComment}
              />
              <Pressable
                style={[
                  styles.sheetSendBtn,
                  {
                    backgroundColor: commentText.trim() ? themeColors.primary : themeColors.border,
                  },
                ]}
                onPress={addComment}
                disabled={!commentText.trim()}
                accessibilityLabel="Send Comment"
              >
                <Ionicons
                  name="send"
                  size={16}
                  color={commentText.trim() ? '#fff' : themeColors.textLight}
                />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      },
      default: {},
    }),
  },
  topBarRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  sectionName: { flex: 1, fontFamily: fonts.sans[700], fontSize: 16.5, marginLeft: 2 },
  topActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  settingsMenu: { position: 'absolute', top: 44, right: 8, width: 238, borderWidth: 1, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 12, elevation: 8 },
  settingsRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  settingsLabel: { flex: 1, fontFamily: fonts.inter[600], fontSize: 14 },
  settingsValue: { fontFamily: fonts.inter[500], fontSize: 12, textTransform: 'capitalize' },
  choiceGroup: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 4 },
  choiceRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, marginHorizontal: 5, borderRadius: 7 },
  choiceText: { fontFamily: fonts.inter[500], fontSize: 13 },
  focusStrip: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 4 },
  focusLabel: { width: 44, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  focusLabelText: { fontFamily: fonts.inter[700], fontSize: 11, letterSpacing: 0.4, textAlign: 'center', transform: [{ rotate: '-90deg' }] },
  focusCards: { gap: 7, paddingHorizontal: 3 },
  focusCard: { height: 76, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
  focusTitle: { flex: 1, fontFamily: fonts.sans[400], fontSize: 12, fontWeight: '400', lineHeight: 15 },
  focusImage: { width: 58, height: 58, borderRadius: 5 },
  focusPlaceholder: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 5, borderWidth: StyleSheet.hairlineWidth },
  body: { paddingHorizontal: 16, paddingBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  categoryBadgeWrap: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontFamily: fonts.inter[700],
    fontSize: 10.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  breaking: { color: colors.primary, fontFamily: fonts.inter[700], fontSize: 11, letterSpacing: 0.5 },
  category: { color: colors.primaryDark, fontFamily: fonts.inter[600], fontSize: 13 },
  title: { fontFamily: fonts.serif[700], fontSize: 28, color: colors.text, lineHeight: 36, marginTop: 8 },
  summary: { fontFamily: fonts.inter[400], fontSize: 17, color: colors.textMuted, lineHeight: 25, marginTop: 10 },
  byline: { flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 22, paddingBottom: 18, borderBottomWidth: 1 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  bylineInfo: { marginLeft: 10, flex: 1 },
  author: { fontFamily: fonts.inter[600], fontSize: 13, fontWeight: '700', color: colors.text },
  bylineMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  viewCountRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  viewEyeIcon: {
    transform: [{ translateY: Platform.OS === 'android' ? 0.5 : 0 }],
  },
  viewCountText: {
    fontFamily: fonts.inter[500],
    fontSize: 11,
    lineHeight: 15,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  ytHeroWrap: { width: '100%', height: 230, borderRadius: 10, overflow: 'hidden', marginTop: 12, backgroundColor: '#000' },
  heroWrap: { position: 'relative', marginTop: 12, borderRadius: 10, overflow: 'hidden' },
  hero: { width: '100%', height: 250 },
  heroControls: { position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(0,0,0,0.55)', padding: 4, borderRadius: 16 },
  heroControlBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  captionText: {
    flex: 1,
    color: '#f8fafc',
    fontWeight: '400',
  },
  captionCloseBtn: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleText: { fontFamily: fonts.sans[400], fontSize: 18, lineHeight: 30, color: colors.text, marginTop: 18 },
  articleFlow: { marginTop: 18 },
  inlineImageWrap: {
    position: 'relative',
    width: '100%',
    height: 230,
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 10,
  },
  inlineImage: { width: '100%', height: '100%' },
  blockHeading: { fontFamily: fonts.sans[700], fontSize: 20, color: colors.text, marginTop: 22 },
  quote: { borderLeftWidth: 4, borderLeftColor: colors.primary, backgroundColor: colors.primarySoft, padding: 15, marginTop: 16, borderRadius: 8 },
  quoteText: { fontFamily: fonts.inter[400], fontSize: 16, fontStyle: 'italic', color: colors.text, lineHeight: 24 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  blockImageWrap: { marginTop: 14 },
  blockImageBox: {
    position: 'relative',
    width: '100%',
    height: 220,
    borderRadius: 10,
    overflow: 'hidden',
  },
  blockImage: { width: '100%', height: '100%' },
  blockImageCaption: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  galleryImageWrap: {
    position: 'relative',
    width: '48%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
  },
  galleryImage: { width: '100%', height: '100%' },
  blockVideo: { width: '100%', height: 220, marginTop: 14, borderRadius: 10 },
  blockYtWrap: { width: '100%', aspectRatio: 16 / 9, borderRadius: 10, overflow: 'hidden', marginVertical: 14, backgroundColor: '#000' },
  blockYtTitle: { fontSize: 12, marginTop: 6, fontWeight: '500' },
  embed: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: colors.surfaceContainer, borderRadius: 10, marginTop: 14 },
  embedText: { color: colors.primary, fontWeight: '600', fontSize: 13, flex: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tag: { fontFamily: fonts.inter[600], color: colors.textMuted, fontSize: 12, backgroundColor: colors.lightSurface, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 5 },
  interactRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 16, borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: 12 },
  shareIcon: { padding: 2 },
  commentCount: { marginLeft: 'auto' },
  commentCountText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  noComments: { color: colors.textLight, fontSize: 13, paddingVertical: 8 },
  comment: { flexDirection: 'row', marginTop: 12 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' },
  commentAvatarText: { fontWeight: '800', color: colors.textMuted },
  commentBody: { flex: 1, marginLeft: 10 },
  commentAuthor: { fontFamily: fonts.inter[600], fontSize: 13, fontWeight: '700', color: colors.text },
  commentText: { fontFamily: fonts.inter[400], fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  commentInput: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text },
  sendBtn: { backgroundColor: colors.primary, borderRadius: 10, padding: 10 },
  reporterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  reporterAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  reporterPhoto: { width: 48, height: 48 },
  reporterAvatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  reporterInfo: { flex: 1 },
  reporterName: { fontFamily: fonts.inter[700], fontSize: 14, fontWeight: '700' },
  reporterMeta: { fontFamily: fonts.inter[500], fontSize: 12, marginTop: 2 },
  badgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
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
  correctionBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  correctionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  correctionTitle: {
    fontFamily: fonts.inter[700],
    fontSize: 11,
    letterSpacing: 0.5,
  },
  correctionBody: {
    fontFamily: fonts.inter[500],
    fontSize: 12.5,
    lineHeight: 18,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 40,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  bottomActionInner: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  bottomActionBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  bottomCommentCountText: {
    fontFamily: fonts.inter[600],
    fontSize: 14,
    includeFontPadding: false,
  },
  actionBtnPressed: {
    opacity: 0.55,
  },
  suggestedNewsSection: {
    marginTop: 12,
    marginBottom: 20,
  },
  commentModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
  },
  commentModalBackdrop: {
    flex: 1,
  },
  commentSheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  sheetHandle: {
    width: 38,
    height: 4.5,
    borderRadius: 2.5,
  },
  commentSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  commentSheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentSheetTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 17,
    letterSpacing: -0.2,
  },
  commentCountPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  commentCountPillText: {
    fontFamily: fonts.inter[700],
    fontSize: 11.5,
  },
  commentSheetCloseBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentListScroll: {
    flex: 1,
  },
  commentListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyCommentsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyCommentsTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 16,
    marginTop: 6,
  },
  emptyCommentsSub: {
    fontFamily: fonts.inter[400],
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  sheetCommentItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  sheetCommentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCommentAvatarText: {
    fontFamily: fonts.inter[700],
    fontSize: 15,
  },
  sheetCommentBody: {
    flex: 1,
    gap: 3,
  },
  sheetCommentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetCommentAuthor: {
    fontFamily: fonts.inter[700],
    fontSize: 13,
  },
  sheetCommentTime: {
    fontFamily: fonts.inter[400],
    fontSize: 11,
  },
  sheetCommentText: {
    fontFamily: fonts.sans[400],
    fontSize: 14,
    lineHeight: 20,
  },
  sheetInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sheetTextInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 40,
  },
  sheetSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
