import React, { forwardRef, useEffect } from 'react'
import { StyleProp, ViewStyle } from 'react-native'

export interface AdWebViewProps {
  html: string
  style?: StyleProp<ViewStyle>
  onMessage?: (event: any) => void
  onShouldStartLoadWithRequest?: (request: any) => boolean
}

export const AdWebView = forwardRef<any, AdWebViewProps>(
  ({ html, onMessage }, _ref) => {
    useEffect(() => {
      if (typeof window === 'undefined' || !onMessage) return

      const handleWindowMessage = (event: MessageEvent) => {
        try {
          if (!event.data) return
          const rawData = typeof event.data === 'string' ? event.data : JSON.stringify(event.data)
          onMessage({
            nativeEvent: {
              data: rawData,
            },
          })
        } catch {
          // ignore
        }
      }

      window.addEventListener('message', handleWindowMessage)
      return () => {
        window.removeEventListener('message', handleWindowMessage)
      }
    }, [onMessage])

    return React.createElement('iframe', {
      srcDoc: html,
      title: 'Advertisement',
      style: {
        flex: 1,
        width: '100%',
        height: '100%',
        border: 0,
        backgroundColor: 'transparent',
        overflow: 'hidden',
      },
      sandbox: 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-forms',
    })
  },
)

AdWebView.displayName = 'AdWebView'
