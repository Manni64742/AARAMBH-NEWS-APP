import React, { useContext } from 'react'
import { StyleSheet, Text as NativeText } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { LanguageContext } from '../context/LanguageContext'

type Props = React.ComponentProps<typeof NativeText>

function sanitize(child: any, lang: string): any {
  if (child === null || child === undefined || typeof child === 'boolean') {
    return child
  }
  if (typeof child === 'string' || typeof child === 'number') {
    return child
  }
  if (Array.isArray(child)) {
    return child.map((c) => sanitize(c, lang))
  }
  if (React.isValidElement(child)) {
    return child
  }
  if (typeof child === 'object') {
    // Localized string object { hi, en }
    if (typeof child.hi === 'string' || typeof child.en === 'string') {
      return lang === 'en' ? (child.en || child.hi || '') : (child.hi || child.en || '')
    }
    if (typeof child.name === 'string' || typeof child.title === 'string') {
      return child.name || child.title
    }
    if (typeof child.name === 'object' && child.name !== null) {
      return sanitize(child.name, lang)
    }
    return ''
  }
  return String(child)
}

export const ScaledText: React.FC<Props> = ({ style, children, ...props }) => {
  const { fontScale } = useTheme()
  const langContext = useContext(LanguageContext)
  const lang = langContext?.language || 'hi'

  const flattened = StyleSheet.flatten(style) || {}
  const scaledStyle = {
    ...flattened,
    ...(typeof flattened.fontSize === 'number' ? { fontSize: flattened.fontSize * fontScale } : {}),
    ...(typeof flattened.lineHeight === 'number' ? { lineHeight: flattened.lineHeight * fontScale } : {}),
  }

  const safeChildren = sanitize(children, lang)

  return (
    <NativeText {...props} style={scaledStyle}>
      {safeChildren}
    </NativeText>
  )
}

