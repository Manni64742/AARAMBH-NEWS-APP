import React, { useState } from 'react'
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native'
import { Image, ImageContentFit } from 'expo-image'
import { useTheme } from '../context/ThemeContext'

export interface AdaptiveImageProps {
  source?: { uri?: string } | string | number | null
  style?: StyleProp<ViewStyle>
  containerStyle?: StyleProp<ViewStyle>
  contentFit?: ImageContentFit
  minHeight?: number
  maxHeight?: number
  borderRadius?: number
  blurRadius?: number
  children?: React.ReactNode
  accessibilityLabel?: string
  priority?: 'low' | 'normal' | 'high'
  transition?: number
  showBlurBackground?: boolean
}

export const AdaptiveImage: React.FC<AdaptiveImageProps> = ({
  source,
  style,
  containerStyle,
  contentFit = 'contain',
  minHeight = 220,
  maxHeight = 500,
  borderRadius = 10,
  blurRadius = 25,
  children,
  accessibilityLabel,
  priority = 'normal',
  transition = 200,
  showBlurBackground = true,
}) => {
  const { colors, isDark } = useTheme()
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)

  if (!source) return null

  const imageSource = (typeof source === 'string' ? { uri: source } : source) as any
  const hasUri = typeof source === 'string' || (typeof source === 'object' && source !== null && 'uri' in source && Boolean(source.uri))

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius,
          backgroundColor: colors.surfaceContainer,
          minHeight,
          maxHeight,
        },
        aspectRatio ? { aspectRatio } : { height: minHeight + 30 },
        containerStyle,
        style,
      ]}
    >
      {/* Blurred background duplicate to elegantly fill sides / top / bottom */}
      {showBlurBackground && hasUri ? (
        <Image
          source={imageSource}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          blurRadius={blurRadius}
          priority="low"
        />
      ) : null}

      {/* Contrast overlay */}
      {showBlurBackground && hasUri ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.42)' : 'rgba(0, 0, 0, 0.20)' },
          ]}
        />
      ) : null}

      {/* Main crisp image with contain so tall or wide images are never cropped */}
      <Image
        source={imageSource}
        style={styles.mainImage}
        contentFit={contentFit}
        priority={priority}
        transition={transition}
        accessibilityLabel={accessibilityLabel}
        onLoad={(e) => {
          if (e.source.width && e.source.height && e.source.height > 0) {
            const ratio = e.source.width / e.source.height
            // Clamp aspect ratio between 0.5 (tall vertical 1:2) and 2.4 (ultra-wide banner)
            const clamped = Math.max(0.5, Math.min(2.4, ratio))
            setAspectRatio(clamped)
          }
        }}
      />

      {/* Watermarks, buttons, caption overlays */}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
})

export default AdaptiveImage
