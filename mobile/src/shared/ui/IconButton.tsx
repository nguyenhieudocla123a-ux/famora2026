import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, iconSize, radius, touch } from '../theme';
import { AppText } from './AppText';

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  color?: string;
  badgeCount?: number;
  disabled?: boolean;
}

/** Icon-only control: always 48x48 and always has an accessible name. */
export function IconButton({
  icon: Icon,
  label,
  onPress,
  color = colors.primary,
  badgeCount,
  disabled,
}: IconButtonProps) {
  const hasBadge = typeof badgeCount === 'number' && badgeCount > 0;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={hasBadge ? `${label}, ${badgeCount} chưa đọc` : label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={touch.hitSlop}
      style={({ pressed }) => [styles.base, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Icon size={iconSize.md} color={color} strokeWidth={2} />
      {hasBadge && (
        <View style={styles.badge} importantForAccessibility="no-hide-descendants">
          <AppText variant="caption" color={colors.textInverse} style={styles.badgeText}>
            {badgeCount > 9 ? '9+' : String(badgeCount)}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: touch.minHeight,
    height: touch.minHeight,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.surfaceSunken },
  disabled: { opacity: 0.4 },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 12, lineHeight: 16 },
});
