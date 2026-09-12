import React, { useState } from 'react'
import { StyleSheet, View, Pressable, Linking, Platform } from 'react-native'
import { WebView } from 'react-native-webview'
import { Ionicons } from '@expo/vector-icons'
import { ScaledText as Text } from './ScaledText'
import { videoIdFromUrl } from '../utils/youtube'

interface YouTubePlayerProps {
  videoId: string
  showOpenButton?: boolean
}

/**
 * YouTubePlayer for Android & iOS Native.
 *
 * Fixes YouTube Error 152-4 ("This video is unavailable"):
 * 1. Sanitizes video ID cleanly from direct ID or YouTube URL.
 * 2. Uses official https://www.youtube.com/embed/ format with enablejsapi=1 and playsinline=1.
 * 3. Sets baseUrl and origin to the authentic app domain 'https://aarambhnews.com'.
 *    (Setting baseUrl to youtube.com causes YouTube to reject self-framing with Error 152-4).
 * 4. Omits forged Chrome userAgent so Android WebView passes Google Media Integrity & Client Hints checks.
 * 5. Handles embed errors and provides instant 1-tap fallback to the YouTube app.
 */
export function YouTubePlayer({ videoId, showOpenButton = false }: YouTubePlayerProps) {
  const [loadError, setLoadError] = useState(false)
  const cleanId = videoIdFromUrl(videoId) || videoId?.trim()

  const openInYouTube = () => {
    if (!cleanId) return
    const appUrl = `vnd.youtube://${cleanId}`
    const webUrl = `https://www.youtube.com/watch?v=${cleanId}`
    Linking.canOpenURL(appUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(appUrl)
        }
        return Linking.openURL(webUrl)
      })
      .catch(() => Linking.openURL(webUrl))
  }

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background-color: #000000;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .video-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      background: #000000;
    }
    iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: 0;
    }
  </style>
</head>
<body>
  <div class="video-wrapper">
    <iframe
      id="ytplayer"
      src="https://www.youtube.com/embed/${cleanId}?autoplay=1&playsinline=1&enablejsapi=1&rel=0&modestbranding=1&origin=https://aarambhnews.com"
      title="Aarambh News Player"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin"
    ></iframe>
  </div>
  <script>
    window.addEventListener('message', function(e) {
      try {
        var d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (d && (d.event === 'onError' || d.info === 101 || d.info === 150 || d.info === 152)) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', code: d.info }));
          }
        }
      } catch(err) {}
    });
  </script>
</body>
</html>`

  if (loadError || !cleanId) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="logo-youtube" size={36} color="#e11d48" />
        <Text style={styles.errorTitle}>यह वीडियो YouTube पर उपलब्ध है</Text>
        <Pressable style={styles.errorBtn} onPress={openInYouTube}>
          <Ionicons name="play" size={14} color="#fff" />
          <Text style={styles.errorBtnText}>YouTube ऐप में चलाएं</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{
          html: htmlContent,
          baseUrl: 'https://aarambhnews.com',
        }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        androidLayerType="hardware"
        mixedContentMode="always"
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data)
            if (data?.type === 'error') {
              setLoadError(true)
            }
          } catch {}
        }}
        onError={() => setLoadError(true)}
        onHttpError={() => setLoadError(true)}
        style={styles.webView}
      />

      {showOpenButton && (
        <Pressable style={styles.ytBadge} onPress={openInYouTube} hitSlop={8}>
          <Ionicons name="logo-youtube" size={13} color="#ff0000" />
          <Text style={styles.ytBadgeText}>YouTube ऐप में खोलें</Text>
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
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
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