import React, { useEffect, useRef, useState } from 'react'
import { FlatList, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { ContentItem } from '../types'
import { colors, fonts, fontFor, radius, spacing } from '../theme'
import { mediaUrl } from '../config'
import { ScaledText as Text } from './ScaledText'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'

const timeAgo = (iso?: string) => {
  if (!iso) return ''
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export const NewsSlider: React.FC<{
  items: ContentItem[]
  onPress: (item: ContentItem) => void
  title?: string
  autoPlayMs?: number
}> = ({ items, onPress, title = 'Headlines', autoPlayMs = 3500 }) => {
  const { colors: tc } = useTheme()
  const { language } = useLanguage()
  const { width } = useWindowDimensions()
  const listRef = useRef<FlatList<ContentItem>>(null)
  const [index, setIndex] = useState(0)
  const cardWidth = Math.max(width - spacing.lg * 2, 300)
  const cardMargin = spacing.md

  useEffect(() => {
    if (items.length < 2) return
    const timer = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % items.length
        listRef.current?.scrollToOffset({ offset: next * (cardWidth + cardMargin), animated: true })
        return next
      })
    }, autoPlayMs)
    return () => clearInterval(timer)
  }, [items.length, cardWidth, cardMargin, autoPlayMs])

  if (!items.length) return null

  return (
    <View>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: tc.text }]}>{title}</Text>
          <View style={styles.sliderBadge}>
            <Ionicons name="images-outline" size={11} color="#fff" />
            <Text style={styles.sliderBadgeText}>SLIDER</Text>
          </View>
        </View>
        <Text style={[styles.counter, { color: tc.textMuted }]}>{`${index + 1}/${items.length}`}</Text>
      </View>
      <FlatList
        ref={listRef}
        data={items}
        horizontal
        pagingEnabled={false}
        keyExtractor={(item) => item._id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={cardWidth + cardMargin}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / (cardWidth + cardMargin))
          setIndex(Math.max(0, Math.min(items.length - 1, i)))
        }}
        renderItem={({ item }) => {
          const image = mediaUrl(item.featuredImage?.url)
          return (
            <Pressable
              onPress={() => onPress(item)}
              style={[styles.card, { width: cardWidth, backgroundColor: tc.card, borderColor: tc.border }]}
            >
              <View style={styles.imageWrap}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.image} contentFit="cover" transition={250} />
                ) : (
                  <View style={[styles.image, { backgroundColor: tc.surfaceContainer }]} />
                )}
                {item.flags?.isBreaking ? (
                  <View style={[styles.breakingBadge, { backgroundColor: tc.primary }]}>
                    <Ionicons name="flash" size={10} color="#fff" />
                    <Text style={styles.breakingText}>{language === 'hi' ? 'ब्रेकिंग' : 'BREAKING'}</Text>
                  </View>
                ) : null}
                <View style={styles.timeBadge}>
                  <Ionicons name="time-outline" size={11} color="#fff" />
                  <Text style={styles.timeText}>{timeAgo(item.publishedAt)}</Text>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {language === 'hi'
                      ? (item.category?.name?.hi || item.category?.name?.en || 'समाचार')
                      : (item.category?.name?.en || item.category?.name?.hi || 'News')}
                  </Text>
                </View>
              </View>
              <View style={styles.body}>
                <Text
                  style={[styles.headline, { color: tc.text, fontFamily: fontFor(item.title, 700) }]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                {item.summary ? (
                  <Text
                    style={[styles.summary, { color: tc.textMuted, fontFamily: fontFor(item.summary, 400) }]}
                    numberOfLines={2}
                  >
                    {item.summary}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          )
        }}
      />
      <View style={styles.dotsRow}>
        {items.map((it, i) => (
          <Pressable
            key={it._id}
            onPress={() => {
              setIndex(i)
              listRef.current?.scrollToOffset({ offset: i * (cardWidth + cardMargin), animated: true })
            }}
            hitSlop={6}
          >
            <View
              style={[
                styles.dot,
                i === index
                  ? { backgroundColor: tc.primary, width: 16, height: 5, borderRadius: 3 }
                  : { backgroundColor: tc.surfaceVariant, width: 5, height: 5, borderRadius: 2.5 },
              ]}
            />
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  counter: { fontFamily: fonts.inter[600], fontSize: 12 },
  title: { fontFamily: fonts.sans[700], fontSize: 18, color: colors.text },
  sliderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  sliderBadgeText: { fontFamily: fonts.inter[700], fontSize: 9, color: '#fff', letterSpacing: 0.6 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, paddingTop: 2 },
  card: {
    marginRight: spacing.md,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 185 },
  breakingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radius.pill,
    zIndex: 2,
  },
  breakingText: { fontFamily: fonts.devanagari[700], fontSize: 10, color: '#fff', letterSpacing: 0.4 },
  timeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radius.pill,
    zIndex: 2,
  },
  timeText: { fontFamily: fonts.inter[500], fontSize: 10, color: '#fff' },
  categoryBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: '#1E3A8A', // Highlight royal navy blue
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: radius.sm,
    zIndex: 2,
  },
  categoryText: { fontFamily: fonts.sans[700], fontSize: 10, color: '#fff', letterSpacing: 0.4 },
  body: { padding: spacing.md },
  headline: {
    fontFamily: fonts.sans[700],
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  summary: { fontSize: 12.5, lineHeight: 18, color: colors.textMuted, marginTop: 4 },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: spacing.sm,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
})