import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'

interface AarambhSplashScreenProps {
  onFinish?: () => void
  isReady?: boolean
  minDurationMs?: number
}

export function AarambhSplashScreen({
  onFinish,
  isReady = true,
  minDurationMs = 1800,
}: AarambhSplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.92)).current
  const containerFade = useRef(new Animated.Value(1)).current

  const startTimeRef = useRef(Date.now())
  const hasFinishedRef = useRef(false)

  useEffect(() => {
    // Smooth logo entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start()
  }, [fadeAnim, scaleAnim])

  useEffect(() => {
    if (!isReady || !onFinish || hasFinishedRef.current) return

    const elapsed = Date.now() - startTimeRef.current
    const remainingTime = Math.max(0, minDurationMs - elapsed)

    const timer = setTimeout(() => {
      if (hasFinishedRef.current) return
      hasFinishedRef.current = true

      // Smooth fade-out transition into the app
      Animated.timing(containerFade, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start(() => {
        onFinish()
      })
    }, remainingTime)

    return () => clearTimeout(timer)
  }, [isReady, minDurationMs, onFinish, containerFade])

  return (
    <Animated.View style={[styles.container, { opacity: containerFade }]}>
      <View style={styles.content}>
        {/* Only the clean brand header logo - no loader, no background circle */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require('../../assets/aarambh_news_logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 270,
    height: 100,
  },
})
