import React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { Image } from 'expo-image'

interface ArticleWatermarkProps {
  compact?: boolean
  style?: ViewStyle
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
}

/**
 * Professional, subtle watermark logo overlay for published article images.
 * Uses the official Aarambh News splash-icon / watermark outline logo.
 */
export const ArticleWatermark: React.FC<ArticleWatermarkProps> = ({
  compact = false,
  style,
  position = 'top-left',
}) => {
  const positionStyle =
    position === 'bottom-left'
      ? styles.posBottomLeft
      : position === 'bottom-right'
      ? styles.posBottomRight
      : position === 'top-left'
      ? styles.posTopLeft
      : styles.posTopRight

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        positionStyle,
        compact && styles.containerCompact,
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image
        source={require('../../assets/splash-icon.png')}
        style={[styles.logo, compact && styles.logoCompact]}
        contentFit="contain"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'rgba(15, 23, 42, 0.40)',
    paddingHorizontal: 5,
    paddingVertical: 2.5,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  containerCompact: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  posBottomLeft: {
    bottom: 8,
    left: 8,
  },
  posBottomRight: {
    bottom: 8,
    right: 8,
  },
  posTopLeft: {
    top: 8,
    left: 8,
  },
  posTopRight: {
    top: 8,
    right: 8,
  },
  logo: {
    width: 44,
    height: 22, // 2:1 aspect ratio matching splash-icon.png (1774 x 887)
    tintColor: '#FFFFFF',
    opacity: 0.88,
  },
  logoCompact: {
    width: 36,
    height: 18,
    opacity: 0.82,
  },
})

export default ArticleWatermark
