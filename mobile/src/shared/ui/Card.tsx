import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme';
import { PressScale } from './soft/PressScale';

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

/** The app's one card style: white, 24 dp corners, a soft blue lift; it sinks a little when pressed. A card with onPress becomes a single button for screen readers. */
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
    <PressScale onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={base} {...rest}>
      {children}
    </PressScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadow.card,
  },
});
