import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Ellipse, Path } from 'react-native-svg';

const HEART = 'M12 21C5 16.5 2 12.6 2 8.9 2 5.9 4.4 3.5 7.3 3.5c1.9 0 3.6 1 4.7 2.6 1.1-1.6 2.8-2.6 4.7-2.6 2.9 0 5.3 2.4 5.3 5.4 0 3.7-3 7.6-10 12.1Z';

/** One falling heart: drifts down while swaying; loops forever. */
function FallingHeart({ index, color, height }: { index: number; color: string; height: number }) {
  const progress = useSharedValue(0);
  const seed = useMemo(
    () => ({ left: (index * 37 + 8) % 92, size: 10 + ((index * 7) % 9), sway: 12 + ((index * 11) % 18), dur: 7000 + ((index * 977) % 3500) }),
    [index],
  );
  useEffect(() => {
    progress.value = withDelay(index * 700, withRepeat(withTiming(1, { duration: seed.dur, easing: Easing.linear }), -1, false));
  }, [index, progress, seed.dur]);
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: (p < 0.1 ? p / 0.1 : p > 0.8 ? (1 - p) / 0.2 : 1) * 0.85,
      transform: [
        { translateY: -20 + p * (height + 40) },
        { translateX: Math.sin(p * Math.PI * 3) * seed.sway },
        { rotate: `${Math.sin(p * Math.PI * 2) * 25}deg` },
      ],
    };
  });
  return (
    <Animated.View style={[styles.item, { left: `${seed.left}%` }, style]}>
      <Svg width={seed.size} height={seed.size} viewBox="0 0 24 24">
        <Path d={HEART} fill={color} />
      </Svg>
    </Animated.View>
  );
}

/** Gentle falling hearts over a band (birthdays, weddings, holidays). Not rendered under Reduce Motion. */
export function FallingHearts({ color, height, count = 7 }: { color: string; height: number; count?: number }) {
  const reduced = useReducedMotion();
  if (reduced) {
    return null;
  }
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: count }, (_, i) => (
        <FallingHeart key={i} index={i} color={color} height={height} />
      ))}
    </View>
  );
}

/** A small candle whose flame flickers softly — the quiet sign of a ngày giỗ. */
export function Candle({ size = 34 }: { size?: number }) {
  const reduced = useReducedMotion();
  const flicker = useSharedValue(1);
  useEffect(() => {
    if (reduced) {
      return;
    }
    flicker.value = withRepeat(
      withSequence(
        withTiming(0.86, { duration: 420, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.05, { duration: 360, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.94, { duration: 520, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 300 }),
      ),
      -1,
      false,
    );
  }, [flicker, reduced]);
  const flame = useAnimatedStyle(() => ({ transform: [{ scaleY: flicker.value }, { scaleX: 2 - flicker.value }], opacity: 0.75 + flicker.value * 0.25 }));
  return (
    <View style={{ width: size, height: size * 1.6 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.flame, { width: size, height: size * 0.75 }, flame]}>
        <Svg width={size} height={size * 0.75} viewBox="0 0 24 18">
          <Ellipse cx={12} cy={11} rx={5} ry={7} fill="#FFB93B" opacity={0.35} />
          <Path d="M12 2C9 7 8 10 9.5 13a3 3 0 0 0 5 0C16 10 15 7 12 2Z" fill="#FFB93B" />
          <Path d="M12 7c-1.2 2.4-1.4 4-.6 5.4a1 1 0 0 0 1.2 0c.8-1.4.6-3-.6-5.4Z" fill="#FFF1CF" />
        </Svg>
      </Animated.View>
      <Svg width={size} height={size * 0.85} viewBox="0 0 24 20">
        <Path d="M11.4 0h1.2v3h-1.2z" fill="#1B2B4B" />
        <Path d="M7 3h10v15a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" fill="#FDF6EC" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { position: 'absolute', top: 0 },
  flame: { alignItems: 'center', justifyContent: 'flex-end', transformOrigin: 'bottom' },
});
