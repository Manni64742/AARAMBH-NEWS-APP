import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ScaledText as Text } from '../ScaledText'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

export function withReporterGate(Component: React.ComponentType<any>) {
  return function ReporterGated(props: any) {
    return (
      <ReporterGate navigation={props.navigation}>
        <Component {...props} />
      </ReporterGate>
    )
  }
}

export default function ReporterGate({ navigation, children }: { navigation?: any; children: React.ReactNode }) {
  const { user, isReporter } = useAuth()
  const { colors } = useTheme()
  if (isReporter) return <>{children}</>
  return (
    <View style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.icon}>📰</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          {user ? 'Reporter-only feature' : 'Login required'}
        </Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          {user
            ? 'This area is only available to reporters. Your account role does not have access to reporter tools.'
            : 'Sign in to access reporter tools like creating and managing articles.'}
        </Text>
        {!user ? (
          <Pressable style={[styles.btn, { backgroundColor: colors.primary }]} onPress={() => navigation?.navigate('Login')}>
            <Text style={styles.btnText}>Go to Login</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 400, borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center' },
  icon: { fontSize: 34, marginBottom: 10 },
  title: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  body: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  btn: { marginTop: 18, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
})