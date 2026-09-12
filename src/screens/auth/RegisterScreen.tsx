import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { ScaledText as Text } from '../../components/ScaledText'
import { useTheme } from '../../context/ThemeContext'
import { authApi } from '../../api/endpoints'
import { errorMessage, setToken } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors } from '../../theme'

export default function RegisterScreen({ navigation }: any) {
  const { colors: themeColors } = useTheme()
  const { error, success } = useToast()
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!name.trim() || !identifier.trim() || password.length < 6) {
      error('Fill all fields (password min 6 chars)')
      return
    }
    setBusy(true)
    try {
      const res = await authApi.register({ name: name.trim(), identifier: identifier.trim(), password })
      await setToken(res.data.tokens.accessToken)
      await AsyncStorage.setItem('aarambh_user', JSON.stringify(res.data.user))
      success('Account created')
      await login(identifier.trim(), password).catch(() => res.data.user)
      navigation.goBack()
    } catch (e) {
      error(errorMessage(e, 'Registration failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: themeColors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.label, { color: themeColors.text }]}>Full Name</Text>
        <TextInput style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={themeColors.textLight} />

        <Text style={[styles.label, { color: themeColors.text }]}>Email or Phone</Text>
        <TextInput
          style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="you@example.com or 98XXXXXXXX"
          placeholderTextColor={themeColors.textLight}
          autoCapitalize="none"
        />

        <Text style={[styles.label, { color: themeColors.text }]}>Password</Text>
        <TextInput style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]} value={password} onChangeText={setPassword} placeholder="Min 6 characters" placeholderTextColor={themeColors.textLight} secureTextEntry />

        <Pressable style={[styles.button, busy && styles.buttonDisabled]} onPress={submit} disabled={busy}>
          <Text style={styles.buttonText}>{busy ? 'Creating...' : 'Create Account'}</Text>
        </Pressable>

        <Text style={[styles.hint, { color: themeColors.textMuted }]}>
          Want to become a reporter? Create an account first, then apply from the Reporter section.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 24, paddingTop: 32 },
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
  button: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: 16, lineHeight: 18 },
})
