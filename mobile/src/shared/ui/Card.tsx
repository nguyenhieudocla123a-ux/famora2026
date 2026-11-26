import React from 'react';
import { Pressable, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface CardProps extends ViewProps {
  onPress?: () => void;
  accessibilityLabel?: string;
  tone?: 'default' | 'highlight' | 'primary';
  style?: ViewStyle;
}

const tones = {
  default: { backgroundColor: colors.surface, borderColor: colors.border },
  highlight: { backgroundColor: colors.highlightSoft, borderColor: colors.highlight },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
};

/** The app's one card style. A card with onPress becomes a single button for screen readers. */
export function Card({ onPress, accessibilityLabel, tone = 'default', style, children, ...rest }: CardProps) {
  const base = [styles.card, tones[tone], style];
  if (!onPress) {
    return (
      <View style={base} {...rest}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed && tone === 'default' && styles.pressed]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  pressed: { backgroundColor: colors.surfaceSunken },
});
