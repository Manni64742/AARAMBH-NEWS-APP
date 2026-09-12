import React from 'react'
import { StyleSheet, Text as NativeText } from 'react-native'
import { useTheme } from '../context/ThemeContext'

type Props = React.ComponentProps<typeof NativeText>

export const ScaledText: React.FC<Props> = ({ style, ...props }) => {
  const { fontScale } = useTheme()
  const flattened = StyleSheet.flatten(style) || {}
  const scaledStyle = {
    ...flattened,
    ...(typeof flattened.fontSize === 'number' ? { fontSize: flattened.fontSize * fontScale } : {}),
    ...(typeof flattened.lineHeight === 'number' ? { lineHeight: flattened.lineHeight * fontScale } : {}),
  }
  return <NativeText {...props} style={scaledStyle} />
}
