import React, { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native'
import { colors } from '../theme'
import { ScaledText as Text } from './ScaledText'
import { useTheme } from '../context/ThemeContext'

interface AarambhLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number
  color?: string
  label?: string
  style?: ViewStyle
  fullScreen?: boolean
}

const SIZES = {
  sm: 22,
  md: 34,
  lg: 44,
  xl: 58,
}

const STROKES = {
  sm: 2.5,
  md: 3.2,
  lg: 3.8,
  xl: 4.6,
}

export function AarambhLoader({
  size = 'md',
  color,
  label,
  style,
  fullScreen = false,
}: AarambhLoaderProps) {
  const { colors: tc, isDark } = useTheme()
  const spinValue = useRef(new Animated.Value(0)).current
  const pulseValue = useRef(new Animated.Value(0.75)).current

  const dimension = typeof size === 'number' ? size : SIZES[size] || SIZES.md
  const stroke = typeof size === 'number' ? Math.max(2.5, Math.round((size / 11) * 10) / 10) : STROKES[size] || STROKES.md
  const brandRed = color || colors.primary || '#e11d48'

  useEffect(() => {
    // Ultra smooth continuous 360 rotation
    const spinAnim = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 850,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    )

    // Gentle core dot breathing pulse
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.15,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0.75,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    )

    spinAnim.start()
    pulseAnim.start()

    return () => {
      spinAnim.stop()
      pulseAnim.stop()
    }
  }, [spinValue, pulseValue])

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const coreSize = Math.max(5, Math.round(dimension * 0.22))

  const spinner = (
    <View style={[styles.container, style]}>
      <View style={{ width: dimension, height: dimension, alignItems: 'center', justifyContent: 'center' }}>
        {/* Subtle background track */}
        <View
          style={[
            styles.track,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
              borderWidth: stroke,
              borderColor: isDark ? 'rgba(225, 29, 72, 0.18)' : 'rgba(225, 29, 72, 0.12)',
            },
          ]}
        />
        {/* Spinning Brand Red Ring */}
        <Animated.View
          style={[
            styles.spinnerArc,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
              borderWidth: stroke,
              borderColor: 'transparent',
              borderTopColor: brandRed,
              borderRightColor: brandRed,
              transform: [{ rotate: spin }],
            },
          ]}
        />
        {/* Subtle center pulsing core */}
        <Animated.View
          style={[
            styles.coreDot,
            {
              width: coreSize,
              height: coreSize,
              borderRadius: coreSize / 2,
              backgroundColor: brandRed,
              transform: [{ scale: pulseValue }],
            },
          ]}
        />
      </View>
      {label ? (
        <Text style={[styles.label, { color: tc.textMuted || colors.secondary }]}>{label}</Text>
      ) : null}
    </View>
  )

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: tc.background || colors.bg }]}>
        {spinner}
      </View>
    )
  }

  return spinner
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
  },
  spinnerArc: {
    position: 'absolute',
  },
  coreDot: {
    position: 'absolute',
  },
  label: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
})
