import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../../theme';

/**
 * The soft sky behind the main screens: a blue-to-white gradient with two quiet clouds at the top.
 * Purely decorative; it sits under the content and never takes touches.
 */
export function SkyBackground({ height = 420 }: { height?: number }) {
  const [w, setW] = useState(400);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  return (
    <View style={[styles.wrap, { height }]} onLayout={onLayout} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={w} height={height}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.skyTop} />
            <Stop offset="1" stopColor={colors.skyBottom} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={w} height={height} fill="url(#sky)" />
        <Ellipse cx={w * 0.82} cy={height * 0.16} rx={w * 0.2} ry={height * 0.05} fill={colors.cloud} opacity={0.7} />
        <Ellipse cx={w * 0.72} cy={height * 0.19} rx={w * 0.14} ry={height * 0.04} fill={colors.cloud} opacity={0.7} />
        <Ellipse cx={w * 0.12} cy={height * 0.3} rx={w * 0.16} ry={height * 0.035} fill={colors.cloud} opacity={0.55} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, top: 0 },
});
