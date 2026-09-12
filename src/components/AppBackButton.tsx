import React from 'react'
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'

interface AppBackButtonProps {
  onPress: () => void
  style?: ViewStyle
  size?: number
  iconColor?: string
}

export function AppBackButton({ onPress, style, size = 34, iconColor }: AppBackButtonProps) {
  const { colors, isDark } = useTheme()

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.65}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        },
        style,
      ]}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <Ionicons
        name="arrow-back"
        size={Math.round(size * 0.53)}
        color={iconColor || colors.text}
      />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
})
