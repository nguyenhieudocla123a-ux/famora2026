import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { colors, typography, TypographyVariant } from '../theme';

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

/** All text in the app goes through AppText so fonts and scaling stay consistent. */
export function AppText({
  variant = 'body',
  color = colors.text,
  align,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      maxFontSizeMultiplier={1.6}
      style={[typography[variant], { color }, align && { textAlign: align }, styles.base, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false },
});
