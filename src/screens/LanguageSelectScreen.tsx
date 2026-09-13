import React, { useState } from 'react'
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
  StatusBar,
} from 'react-native'
import { ScaledText as Text } from '../components/ScaledText'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../context/ThemeContext'
import { useLanguage, AppLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext'
import { fonts } from '../theme'

interface Props {
  navigation: any
}

export default function LanguageSelectScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const { language: currentLang, completeLanguageOnboarding } = useLanguage()
  const [selectedLang, setSelectedLang] = useState<AppLanguage>(currentLang || 'hi')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canGoBack = navigation.canGoBack()

  const handleContinue = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await completeLanguageOnboarding(selectedLang)
      if (canGoBack) {
        navigation.goBack()
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      }
    } catch {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.content, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 24) }]}>
        {canGoBack && (
          <Pressable
            style={[
              styles.backButton,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
            ]}
            onPress={() => navigation.goBack()}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
        )}

        {/* Brand Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/aarambh_news_logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={[styles.title, { color: colors.text }]}>
            Choose Your Language
          </Text>
          <Text style={[styles.titleHindi, { color: colors.primary }]}>
            अपनी पसंदीदा भाषा चुनें
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Select the language you want to read and watch news in. You can change this anytime in settings.
          </Text>
        </View>

        {/* Language Cards */}
        <View style={styles.cardsContainer}>
          {SUPPORTED_LANGUAGES.map((item) => {
            const isSelected = selectedLang === item.code
            return (
              <Pressable
                key={item.code}
                onPress={() => setSelectedLang(item.code)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: isSelected
                      ? (isDark ? 'rgba(255, 87, 34, 0.10)' : 'rgba(255, 87, 34, 0.05)')
                      : colors.card,
                    borderColor: isSelected ? colors.primary : colors.surfaceVariant,
                    transform: [{ scale: pressed ? 0.985 : 1 }],
                  },
                ]}
              >
                <View style={{ flex: 1, paddingRight: 14 }}>
                  <View style={styles.langNameContainer}>
                    <Text
                      style={[
                        styles.nativeLabel,
                        { color: isSelected ? colors.primary : colors.text },
                        item.code === 'hi' ? styles.devanagariFont : styles.latinFont,
                      ]}
                    >
                      {item.nativeLabel}
                    </Text>
                    <Text style={[styles.englishLabel, { color: colors.textMuted }]}>
                      ({item.label})
                    </Text>
                  </View>
                  <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                    {item.code === 'hi'
                      ? 'ताज़ा ख़बरें, वीडियो और ब्रेकिंग न्यूज़'
                      : 'Top stories, videos and live headlines'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.radioCircle,
                    isSelected && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  {isSelected ? (
                    <Ionicons name="checkmark" size={14} color="#ffffff" />
                  ) : (
                    <View style={[styles.radioInner, { borderColor: colors.surfaceVariant }]} />
                  )}
                </View>
              </Pressable>
            )
          })}
        </View>

        {/* Bottom CTA Button */}
        <View style={styles.footer}>
          <Pressable
            onPress={handleContinue}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.continueButton,
              {
                backgroundColor: colors.primary,
                opacity: pressed || isSubmitting ? 0.9 : 1,
              },
            ]}
          >
            <Text style={styles.continueText}>
              {canGoBack
                ? selectedLang === 'hi'
                  ? 'भाषा सुरक्षित करें (Save)'
                  : 'Save Language (सुरक्षित करें)'
                : selectedLang === 'hi'
                  ? 'जारी रखें / Continue'
                  : 'Continue / आगे बढ़ें'}
            </Text>
            <Ionicons
              name={canGoBack ? 'checkmark' : 'arrow-forward'}
              size={18}
              color="#ffffff"
              style={styles.continueIcon}
            />
          </Pressable>

          <Text style={[styles.hintText, { color: colors.textLight }]}>
            {selectedLang === 'hi'
              ? 'आप इसे बाद में प्रोफ़ाइल ➔ सेटिंग्स में कभी भी बदल सकते हैं'
              : 'You can change language anytime from Profile ➔ Settings'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 26,
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 154,
    height: 42,
    marginBottom: 12,
  },
  title: {
    fontSize: 19,
    fontFamily: fonts.sans[700],
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  titleHindi: {
    fontSize: 15,
    fontFamily: fonts.devanagari[700],
    textAlign: 'center',
    marginTop: 3,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fonts.sans[400],
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 6,
    maxWidth: 290,
  },
  cardsContainer: {
    gap: 12,
    marginVertical: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  langNameContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  nativeLabel: {
    fontSize: 20,
  },
  devanagariFont: {
    fontFamily: fonts.devanagari[700],
  },
  latinFont: {
    fontFamily: fonts.sans[700],
  },
  englishLabel: {
    fontSize: 13,
    fontFamily: fonts.sans[500],
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardDivider: {
    height: 1,
    marginVertical: 10,
  },
  cardDescription: {
    fontSize: 12,
    fontFamily: fonts.sans[400],
    lineHeight: 16.5,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fonts.sans[600],
  },
  footer: {
    marginBottom: 8,
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  continueText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: fonts.sans[700],
  },
  continueIcon: {
    marginLeft: 8,
  },
  hintText: {
    fontSize: 11.5,
    fontFamily: fonts.sans[400],
    marginTop: 12,
    textAlign: 'center',
  },
})
