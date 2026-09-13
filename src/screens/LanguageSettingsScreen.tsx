import React from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'
import { useLanguage, AppLanguage } from '../context/LanguageContext'
import { useToast } from '../context/ToastContext'
import { fonts } from '../theme'
import { ScaledText as Text } from '../components/ScaledText'

export default function LanguageSettingsScreen({ navigation }: any) {
  const { colors, isDark } = useTheme()
  const { language, setLanguage } = useLanguage()
  const { success } = useToast()

  const languages: Array<{ code: AppLanguage; title: string; subtitle: string }> = [
    {
      code: 'hi',
      title: 'हिन्दी (Hindi)',
      subtitle: language === 'hi' ? 'ताज़ा ख़बरें, वीडियो और ब्रेकिंग न्यूज़' : 'Latest news, videos and breaking headlines',
    },
    {
      code: 'en',
      title: 'English',
      subtitle: language === 'hi' ? 'प्रमुख समाचार, वीडियो और राष्ट्रीय सुर्खियां' : 'Top stories, videos and live headlines',
    },
  ]

  const onSelect = async (code: AppLanguage) => {
    if (code === language) return
    await setLanguage(code)
    success(code === 'hi' ? 'समाचार भाषा हिन्दी में सेट की गई' : 'News language updated to English')
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
        {language === 'hi' ? 'समाचार भाषा चुनें' : 'Preferred News Language'}
      </Text>

      <View style={styles.listContainer}>
        {languages.map((item) => {
          const isSelected = language === item.code
          return (
            <Pressable
              key={item.code}
              onPress={() => onSelect(item.code)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: isSelected
                    ? (isDark ? 'rgba(255, 87, 34, 0.10)' : 'rgba(255, 87, 34, 0.05)')
                    : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderWidth: isSelected ? 1.5 : 1,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.cardTitle,
                    {
                      color: isSelected ? colors.primary : colors.text,
                      fontFamily: item.code === 'hi' ? fonts.devanagari[700] : fonts.inter[700],
                    },
                  ]}
                >
                  {item.title}
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                  {item.subtitle}
                </Text>
              </View>

              <View
                style={[
                  styles.radioCircle,
                  isSelected
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { borderColor: colors.border },
                ]}
              >
                {isSelected ? (
                  <Ionicons name="checkmark" size={14} color="#ffffff" />
                ) : null}
              </View>
            </Pressable>
          )
        })}
      </View>

      <View style={[styles.noteCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
        <Ionicons name="information-circle-outline" size={18} color={colors.primary} style={{ marginRight: 8, marginTop: 1 }} />
        <Text style={[styles.noteText, { color: colors.textMuted }]}>
          {language === 'hi'
            ? 'आप जब चाहें इसे बदल सकते हैं। ऐप की सभी ताज़ा खबरें और इंटरफ़ेस आपकी चुनी हुई भाषा के अनुसार प्रदर्शित होंगे।'
            : 'You can change this anytime. All news articles, feeds, and interface will be presented in your chosen language.'}
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontFamily: fonts.sans[700],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  listContainer: {
    gap: 10,
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  noteText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
  },
})
