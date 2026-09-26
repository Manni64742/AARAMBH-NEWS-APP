import React, { useState, useRef } from 'react'
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
  contentFit = 'cover',
  borderRadius = 10,
  children,
  accessibilityLabel,
  priority = 'normal',
  transition = 150,
}) => {
  const { colors } = useTheme()
  // Default to standard 16:9 landscape aspect ratio so initial layout never jumps or oscillates
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9)
  const loadedRef = useRef<boolean>(false)

  if (!source) return null

  const imageSource = (typeof source === 'string' ? { uri: source } : source) as any

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius,
          backgroundColor: colors.surfaceContainer,
          aspectRatio,
        },
        containerStyle,
        style,
      ]}
    >
      <Image
        source={imageSource}
        style={styles.mainImage}
        contentFit={contentFit}
        priority={priority}
        transition={transition}
        accessibilityLabel={accessibilityLabel}
        onLoad={(e) => {
          if (loadedRef.current) return
          if (e.source.width && e.source.height && e.source.height > 0) {
            const ratio = e.source.width / e.source.height
            // Clamp aspect ratio cleanly between 0.75 (3:4 portrait) and 2.1 (widescreen)
            const clamped = Math.max(0.75, Math.min(2.1, ratio))
            loadedRef.current = true
            setAspectRatio((prev) => {
              if (Math.abs(prev - clamped) < 0.05) return prev
              return clamped
            })
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
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
})

export default AdaptiveImage
