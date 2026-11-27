import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** How far it sinks while held; 0.97 for cards, 0.92 for small tiles. */
  depth?: number;
  children: React.ReactNode;
}

/** A pressable that sinks slightly under the finger and springs back: the app's press feedback. */
export function PressScale({ style, depth = 0.97, children, onPressIn, onPressOut, ...rest }: Props) {
  const s = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      style={[style, animated]}
      onPressIn={e => {
        s.value = withSpring(depth, { damping: 18, stiffness: 320 });
        onPressIn?.(e);
      }}
      onPressOut={e => {
        s.value = withSpring(1, { damping: 14, stiffness: 260 });
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
