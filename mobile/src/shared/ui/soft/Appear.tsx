import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

interface Props {
  /** Position in the screen's reading order; each step waits 70 ms more. */
  index?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/** Fades a block in while it rises 18 dp, once, when the screen mounts. Off under reduced motion. */
export function Appear({ index = 0, style, children }: Props) {
  const reduce = useReducedMotion();
  const p = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (!reduce) {
      p.value = withDelay(60 + index * 70, withTiming(1, { duration: 440, easing: Easing.out(Easing.cubic) }));
    }
  }, [index, p, reduce]);
  const animated = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * 18 }, { scale: 0.97 + p.value * 0.03 }],
  }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
