import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { TrendingRankItem, getLocalizedTag, isOrangeTag } from '../types/bundles'
import { colors, fonts, radius, spacing } from '../theme'
import { ScaledText as Text } from './ScaledText'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'

interface TrendingRankedListProps {
  items: TrendingRankItem[]
  onItemPress: (item: TrendingRankItem) => void
  onViewMore: () => void
}

export const TrendingRankedList: React.FC<TrendingRankedListProps> = ({
  items,
  onItemPress,
  onViewMore,
}) => {
  const { colors: tc, isDark } = useTheme()
  const { language } = useLanguage()

  return (
    <View style={styles.container}>
      {/* List Container Card */}
      <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const localizedTag = getLocalizedTag(item.tag, language)
          const isOrange = isOrangeTag(item.tag)

          return (
            <Pressable
              key={item.id}
              style={[
                styles.itemRow,
                !isLast && [styles.itemBorder, { borderBottomColor: tc.border }],
              ]}
              onPress={() => onItemPress(item)}
            >
              {/* Rank Number - Clean, Single Orange Color (Kept Orange per user request) */}
              <View style={styles.rankWrap}>
                <Text style={[styles.rankNumber, { color: tc.primary }]}>
                  {item.rank}
                </Text>
              </View>

              {/* Title & Metadata */}
              <View style={styles.titleWrap}>
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
                  style={[styles.title, { color: tc.text }]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.title}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={15} color={tc.textMuted} style={styles.chevron} />
            </Pressable>
          )
        })}
      </View>

      {/* Full Width Solid VIEW MORE Button */}
      <Pressable
        style={({ pressed }) => [
          styles.viewMoreBtn,
          {
            backgroundColor: pressed ? '#E64A19' : tc.primary,
          },
        ]}
        onPress={onViewMore}
      >
        <Text style={styles.viewMoreBtnText}>
          {language === 'hi' ? 'सभी ट्रेंडिंग देखें' : 'VIEW MORE TRENDING'}
        </Text>
        <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: 6,
    paddingBottom: 14,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rankWrap: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankNumber: {
    fontFamily: fonts.sans[700],
    fontWeight: '800',
    fontSize: 22,
    letterSpacing: -0.5,
  },
  titleWrap: {
    flex: 1,
    paddingRight: 6,
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
  title: {
    fontFamily: fonts.sans[600],
    fontSize: 13.5,
    lineHeight: 19.5,
    letterSpacing: -0.1,
  },
  chevron: {
    marginLeft: 4,
    opacity: 0.5,
  },
  viewMoreBtn: {
    marginTop: 14,
    width: '100%',
    height: 44,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 2,
  },
  viewMoreBtnText: {
    fontFamily: fonts.sans[700],
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
})
