import React from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import { Image } from 'expo-image'

interface TvLiveIconProps {
  size?: number
  color?: string
  style?: StyleProp<ViewStyle>
}

/**
 * TvLiveIcon: Custom TV icon with top-right "LIVE" badge and stand.
 * Styled in the official Aarambh logo brand orange (#FF5722) palette.
 */
export const TvLiveIcon: React.FC<TvLiveIconProps> = ({
  size = 26,
  style,
}) => {
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Image
        source={require('../../assets/tv_live_icon.png')}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </View>
  )
}

export default TvLiveIcon
