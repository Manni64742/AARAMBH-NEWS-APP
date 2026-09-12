import React, { useEffect, useState } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { MarketIndexItem } from '../types'
import { fonts, radius } from '../theme'
import { useTheme } from '../context/ThemeContext'
import { ScaledText as Text } from './ScaledText'

const TICKER_SPEED = 48
const ITEM_GAP = 10

const UP = '#16a34a'
const DOWN = '#dc2626'

function TickerPill({ item }: { item: MarketIndexItem }) {
  const { colors: tc } = useTheme()
  const up = item.change >= 0
  const deltaColor = up ? UP : DOWN
  return (
    <View style={[styles.pill, { backgroundColor: tc.card, borderColor: tc.border }]}>
      <Text style={[styles.symbol, { color: tc.primaryDark, fontFamily: fonts.inter[700] }]}>{item.symbol}</Text>
      <Text style={[styles.value, { color: tc.text, fontFamily: fonts.inter[700] }]}>{item.value.toFixed(2)}</Text>
      <View style={styles.deltaWrap}>
        <Text style={[styles.arrow, { color: deltaColor, fontFamily: fonts.inter[700] }]}>{up ? '▲' : '▼'}</Text>
        <Text style={[styles.delta, { color: deltaColor, fontFamily: fonts.inter[600] }]}>
          {up ? '+' : ''}{item.change.toFixed(2)}
        </Text>
        <Text style={[styles.deltaPct, { color: tc.textMuted, fontFamily: fonts.inter[500] }]}>
          {up ? '+' : ''}{item.changePct.toFixed(2)}%
        </Text>
      </View>
    </View>
  )
}

export default function MarketTicker({ items }: { items: MarketIndexItem[] }) {
  const { colors: tc } = useTheme()
  const [copyWidth, setCopyWidth] = useState(0)
  const [pos] = useState<Animated.Value>(() => new Animated.Value(0))

  useEffect(() => {
    if (!items.length || !copyWidth) return
    pos.setValue(0)
    const anim = Animated.loop(
      Animated.timing(pos, {
        toValue: -copyWidth,
        duration: (copyWidth / TICKER_SPEED) * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    )
    anim.start()
    return () => anim.stop()
  }, [copyWidth, items, pos])

  if (!items.length) return null

  const renderRow = (key: string) => (
    <View key={key} style={styles.row} {...(key === 'a' ? { onLayout: (e: any) => setCopyWidth(e.nativeEvent.layout.width) } : {})}>
      {items.map((item) => (
        <TickerPill key={item._id} item={item} />
      ))}
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: tc.bg, borderColor: tc.border }]}>
      <Animated.View style={[styles.track, { transform: [{ translateX: pos }] }]}>
        {renderRow('a')}
        {renderRow('b')}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  track: { flexDirection: 'row' },
  row: { flexDirection: 'row', alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: ITEM_GAP,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  symbol: { fontSize: 12, letterSpacing: 0.3 },
  value: { fontSize: 13 },
  deltaWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  arrow: { fontSize: 10 },
  delta: { fontSize: 12 },
  deltaPct: { fontSize: 11 },
})