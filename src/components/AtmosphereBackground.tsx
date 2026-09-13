import React from 'react'
import { Dimensions, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { useTheme } from '../context/ThemeContext'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

/**
 * Static Watermark Background for Onboarding / Location screens
 * Renders the Aarambh outline watermark without any animation or rotation.
 */
export function AtmosphereBackground() {
  const { isDark } = useTheme()

  // Sized neatly: subtle and compact in the lower section of the screen
  const watermarkWidth = Math.min(Math.round(SCREEN_WIDTH * 0.54), 210)
  const watermarkHeight = Math.round(watermarkWidth / 2.097)

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.watermarkWrap}>
        <Image
          source={require('../../assets/aarambh_news_watermarklogo.png')}
          style={[
            styles.watermarkImage,
            {
              width: watermarkWidth,
              height: watermarkHeight,
              tintColor: isDark ? 'rgba(255, 255, 255, 0.16)' : undefined,
              opacity: isDark ? 0.14 : 0.11,
            },
          ]}
          contentFit="contain"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    zIndex: 0,
  },
  watermarkWrap: {
    position: 'absolute',
    bottom: 82,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermarkImage: {
    // Pure static watermark
  },
})
