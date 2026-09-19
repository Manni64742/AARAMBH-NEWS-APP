import React, { forwardRef } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { WebView } from 'react-native-webview'

export interface AdWebViewProps {
  html: string
  style?: StyleProp<ViewStyle>
  onMessage?: (event: any) => void
  onShouldStartLoadWithRequest?: (request: any) => boolean
}

export const AdWebView = forwardRef<WebView, AdWebViewProps>(
  ({ html, style, onMessage, onShouldStartLoadWithRequest }, ref) => {
    return (
      <WebView
        ref={ref}
        source={{ html }}
        style={style || { flex: 1, backgroundColor: 'transparent' }}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    )
  },
)

AdWebView.displayName = 'AdWebView'
