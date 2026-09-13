import React from 'react'
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { BundleCardData, BundleNewsItem, getLocalizedTag, isOrangeTag } from '../types/bundles'
import { fonts, radius, spacing } from '../theme'
import { ScaledText as Text } from './ScaledText'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'

interface BundleCardProps {
  bundle: BundleCardData
  isSingle?: boolean
  onItemPress: (item: BundleNewsItem) => void
  onViewMore: () => void
}

export const BundleCard: React.FC<BundleCardProps> = ({ bundle, isSingle = false, onItemPress, onViewMore }) => {
  const { colors: tc, isDark } = useTheme()
  const { language } = useLanguage()
  const { width } = useWindowDimensions()
  // When there is only 1 bundle in a section, fill full width (width - 32px padding).
  // When there are 2+ bundles, show a subtle peek of the next card (~36px peek).
  const cardWidth = isSingle ? width - 32 : Math.min(width - 64, 420)

  return (
    <View
      style={[
        styles.cardContainer,
        {
          width: cardWidth,
          marginRight: isSingle ? 0 : 12,
          backgroundColor: tc.card,
          borderColor: tc.border,
        },
      ]}
    >
      {/* Bundle Header - Clean title, NO vertical line bar */}
      <View style={[styles.headerRow, { borderBottomColor: tc.border }]}>
        <Text style={[styles.bundleTitle, { color: tc.text }]} numberOfLines={1}>
          {bundle.title}
        </Text>

        {/* View More Link Button - Remains Aarambh Orange */}
        <Pressable
          onPress={onViewMore}
          style={styles.viewMoreBtn}
          hitSlop={8}
        >
          <Text style={[styles.viewMoreText, { color: tc.primary }]}>
            {language === 'hi' ? 'सभी देखें' : 'VIEW MORE'}
          </Text>
          <Ionicons name="chevron-forward" size={13} color={tc.primary} />
        </Pressable>
      </View>

      {/* 5 News Rows */}
      <View style={styles.listWrap}>
        {bundle.items.map((item, index) => {
          const isLast = index === bundle.items.length - 1
          const localizedTag = getLocalizedTag(item.tag, language)
          const isOrange = isOrangeTag(item.tag)

          return (
            <Pressable
              key={item.id}
              style={[
                styles.newsRow,
                !isLast && [styles.newsRowBorder, { borderBottomColor: tc.border }],
              ]}
              onPress={() => onItemPress(item)}
            >
              {/* Left Details */}
              <View style={styles.textWrap}>
                {/* Badge: Orange for Breaking/Viral/Trending, Blue for topic tags */}
                <View
                  style={[
                    styles.tagBadge,
                    isOrange
                      ? {
                          backgroundColor: isDark ? 'rgba(255, 87, 34, 0.16)' : '#FFF3E0',
                          borderColor: isDark ? 'rgba(255, 87, 34, 0.35)' : '#FFCCBC',
                        }
                      : {
                          backgroundColor: isDark ? 'rgba(30, 58, 138, 0.35)' : '#EFF6FF',
                          borderColor: isDark ? '#1E3A8A' : '#DBEAFE',
                        },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      { color: isOrange ? (isDark ? '#FF7043' : '#E64A19') : (isDark ? '#93C5FD' : '#1D4ED8') },
                    ]}
                    numberOfLines={1}
                  >
                    {localizedTag}
                  </Text>
                </View>

                <Text
                  style={[styles.headline, { color: tc.text }]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.title}
                </Text>
              </View>

              {/* Right Thumbnail */}
              <Image
                source={{ uri: item.imageUrl }}
                style={[styles.thumbnail, { backgroundColor: tc.surfaceVariant, borderColor: tc.border }]}
                contentFit="cover"
                transition={200}
              />
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  bundleTitle: {
    fontFamily: fonts.serif[700],
    fontSize: 17,
    letterSpacing: -0.2,
    flex: 1,
    marginRight: 8,
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewMoreText: {
    fontFamily: fonts.sans[700],
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  listWrap: {
    paddingTop: 2,
  },
  newsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  newsRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  textWrap: {
    flex: 1,
    paddingRight: 12,
    justifyContent: 'center',
  },
  tagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginBottom: 4,
  },
  tagText: {
    fontFamily: fonts.sans[700],
    fontSize: 9.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: fonts.sans[600],
    fontSize: 13.5,
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  thumbnail: {
    width: 76,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 0.5,
  },
})
