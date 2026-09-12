import React, { Component, ErrorInfo, ReactNode } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { ScaledText as Text } from './ScaledText'
import { Ionicons } from '@expo/vector-icons'
import { colors, fonts, radius, spacing } from '../theme'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught an error]:', error, errorInfo)
  }

  public resetError = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="warning-outline" size={38} color={colors.primary} />
            </View>
            <Text style={styles.title}>कुछ गलत हो गया</Text>
            <Text style={styles.subtitleEn}>Something went wrong</Text>
            <Text style={styles.message}>
              {this.state.error?.message || 'स्क्रीन लोड करने में कोई तकनीकी समस्या आई है।'}
            </Text>

            <TouchableOpacity style={styles.retryBtn} onPress={this.resetError} activeOpacity={0.85}>
              <Ionicons name="refresh-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.retryBtnText}>पुनः लोड करें (Retry)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101114',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1a1c20',
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.serif[700],
    color: '#f4f4f5',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitleEn: {
    fontSize: 13,
    fontFamily: fonts.sans[600],
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontSize: 13,
    fontFamily: fonts.sans[400],
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
    elevation: 2,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: fonts.sans[700],
  },
})

export default ErrorBoundary
