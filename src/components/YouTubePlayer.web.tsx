import React from 'react'
import { StyleSheet, View, Pressable, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ScaledText as Text } from './ScaledText'
import { videoIdFromUrl } from '../utils/youtube'

interface YouTubePlayerProps {
  videoId: string
  showOpenButton?: boolean
}

export function YouTubePlayer({ videoId, showOpenButton = false }: YouTubePlayerProps) {
  const cleanId = videoIdFromUrl(videoId) || videoId?.trim()

  const openInYouTube = () => {
    if (!cleanId) return
    const webUrl = `https://www.youtube.com/watch?v=${cleanId}`
    Linking.openURL(webUrl).catch(() => {})
  }

  if (!cleanId) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="logo-youtube" size={36} color="#e11d48" />
        <Text style={styles.errorTitle}>यह वीडियो YouTube पर उपलब्ध है</Text>
        <Pressable style={styles.errorBtn} onPress={openInYouTube}>
          <Ionicons name="play" size={14} color="#fff" />
          <Text style={styles.errorBtnText}>YouTube में खोलें</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {React.createElement('iframe', {
        src: `https://www.youtube.com/embed/${cleanId}?autoplay=0&playsinline=1&enablejsapi=1&rel=0&modestbranding=1&origin=${typeof window !== 'undefined' ? window.location.origin : 'https://aarambhnews.com'}`,
        title: 'Aarambh News Player',
        style: { width: '100%', height: '100%', border: 0 },
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
        allowFullScreen: true,
      })}
      {showOpenButton && (
        <Pressable style={styles.ytBadge} onPress={openInYouTube} hitSlop={8}>
          <Ionicons name="logo-youtube" size={13} color="#ff0000" />
          <Text style={styles.ytBadgeText}>YouTube में खोलें</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
  },
  ytBadge: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    zIndex: 10,
  },
  ytBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e11d48',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  errorBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
})