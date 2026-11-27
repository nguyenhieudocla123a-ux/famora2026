import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

/** Soft green hills with two little houses: the landscape at the foot of the splash and sign-in. */
export function Hills({ height = 150 }: { height?: number }) {
  const [w, setW] = useState(400);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const h = height;
  return (
    <View style={[styles.wrap, { height: h }]} onLayout={onLayout} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={w} height={h}>
        <Ellipse cx={w * 0.2} cy={h * 1.05} rx={w * 0.55} ry={h * 0.6} fill="#CDEFD0" />
        <Ellipse cx={w * 0.85} cy={h * 1.1} rx={w * 0.6} ry={h * 0.62} fill="#B9E7BE" />
        {/* left house */}
        <Rect x={w * 0.12} y={h * 0.42} width={w * 0.1} height={h * 0.2} rx={3} fill="#FFFFFF" />
        <Path d={`M ${w * 0.1} ${h * 0.45} L ${w * 0.17} ${h * 0.3} L ${w * 0.24} ${h * 0.45} Z`} fill="#2387E9" />
        <Rect x={w * 0.155} y={h * 0.5} width={w * 0.03} height={h * 0.08} rx={2} fill="#9CC8F5" />
        {/* right house */}
        <Rect x={w * 0.76} y={h * 0.36} width={w * 0.13} height={h * 0.24} rx={3} fill="#FFFFFF" />
        <Path d={`M ${w * 0.735} ${h * 0.39} L ${w * 0.825} ${h * 0.2} L ${w * 0.915} ${h * 0.39} Z`} fill="#2387E9" />
        <Rect x={w * 0.81} y={h * 0.46} width={w * 0.035} height={h * 0.1} rx={2} fill="#9CC8F5" />
        {/* bushes */}
        <Circle cx={w * 0.05} cy={h * 0.7} r={h * 0.14} fill="#8BD48F" />
        <Circle cx={w * 0.95} cy={h * 0.66} r={h * 0.16} fill="#8BD48F" />
        <Circle cx={w * 0.66} cy={h * 0.72} r={h * 0.09} fill="#A5DEA8" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
