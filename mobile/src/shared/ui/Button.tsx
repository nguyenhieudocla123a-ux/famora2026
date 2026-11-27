import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, iconSize, radius, spacing, touch } from '../theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
}

const palette: Record<Variant, { bg: string; pressed: string; fg: string; border?: string }> = {
  primary: { bg: colors.primary, pressed: colors.primaryPressed, fg: colors.textOnPrimary },
  secondary: { bg: colors.surface, pressed: colors.surfaceSunken, fg: colors.primary, border: colors.borderStrong },
  danger: { bg: colors.surface, pressed: colors.dangerSoft, fg: colors.danger, border: colors.danger },
  ghost: { bg: 'transparent', pressed: colors.surfaceSunken, fg: colors.primary },
};

/**
 * The app's one button family. Press feedback is a color change only, so the layout never shifts.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityHint,
}: ButtonProps) {
  const p = palette[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      android_ripple={{ color: p.pressed }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: pressed ? p.pressed : p.bg },
        p.border && { borderColor: p.border, borderWidth: 1 },
        fullWidth && styles.fullWidth,
        inactive && styles.inactive,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={p.fg} />
        ) : (
          Icon && <Icon size={iconSize.md} color={p.fg} strokeWidth={2} />
        )}
        <AppText variant="bodyStrong" color={p.fg}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch.minHeight + 4,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fullWidth: { alignSelf: 'stretch' },
  inactive: { opacity: 0.55 },
});
