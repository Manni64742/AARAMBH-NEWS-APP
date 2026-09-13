import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { ScaledText as Text } from '../../components/ScaledText'
import { useTheme } from '../../context/ThemeContext'
import { Image } from 'expo-image'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../api/client'
import { colors, fonts } from '../../theme'
import { APP_NAME, APP_TAGLINE } from '../../config'

export default function LoginScreen({ navigation }: any) {
  const { colors: themeColors } = useTheme()
  const { login } = useAuth()
  const { error, success } = useToast()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!identifier.trim() || !password) {
      error('Enter email/phone and password')
      return
    }
    setBusy(true)
    try {
      const user = await login(identifier.trim(), password)
      success(`Welcome ${user.name}`)
      navigation.goBack()
    } catch (e) {
      error(errorMessage(e, 'Login failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: themeColors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <Image source={require('../../../assets/aarambh_news_logo.png')} style={styles.logo} contentFit="contain" />
          <Text style={[styles.appName, { color: themeColors.text }]}>{APP_NAME}</Text>
          <Text style={[styles.tagline, { color: themeColors.textMuted }]}>{APP_TAGLINE}</Text>
        </View>

        <Text style={[styles.label, { color: themeColors.text }]}>Email or Phone</Text>
        <TextInput
          style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="you@example.com or 98XXXXXXXX"
          placeholderTextColor={themeColors.textLight}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={[styles.label, { color: themeColors.text }]}>Password</Text>
        <TextInput
          style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={themeColors.textLight}
          secureTextEntry
        />

        <Pressable style={[styles.button, busy && styles.buttonDisabled]} onPress={submit} disabled={busy}>
          <Text style={styles.buttonText}>{busy ? 'Signing in...' : 'Sign In'}</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: themeColors.textMuted }]}>New to {APP_NAME}?</Text>
          <Pressable onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Create account</Text>
          </Pressable>
        </View>
        <Text style={[styles.hint, { color: themeColors.textLight }]}>Reporter? Sign in with your reporter credentials.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  logo: { width: 250, height: 92 },
  appName: { fontFamily: fonts.serif[700], fontSize: 24, color: colors.text, marginTop: 6 },
  tagline: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 6 },
  footerText: { color: colors.textMuted, fontSize: 14 },
  footerLink: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  hint: { textAlign: 'center', color: colors.textLight, fontSize: 12, marginTop: 12 },
})
