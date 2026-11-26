import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, iconSize, spacing, touch } from '../theme';
import { AppText } from './AppText';

interface SectionHeaderProps {
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, icon: Icon, iconColor = colors.primary, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.title}>
        {Icon && <Icon size={iconSize.md} color={iconColor} strokeWidth={2} />}
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
      </View>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={touch.hitSlop}
          style={styles.action}
        >
          <AppText variant="label" color={colors.accent}>
            {actionLabel}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  action: { minHeight: touch.minHeight - 8, justifyContent: 'center', paddingLeft: spacing.md },
});
