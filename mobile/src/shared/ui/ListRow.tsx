import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, iconSize, spacing, touch } from '../theme';
import { AppText } from './AppText';

interface ListRowProps {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  danger?: boolean;
  showChevron?: boolean;
}

/** Row inside a grouped card. Rows are separated by hairlines, not nested cards. */
export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  accessibilityLabel,
  danger,
  showChevron = !!onPress,
}: ListRowProps) {
  const content = (
    <>
      {leading}
      <View style={styles.text}>
        <AppText variant="bodyStrong" color={danger ? colors.danger : colors.text}>
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="caption" color={colors.textSecondary}>
            {subtitle}
          </AppText>
        )}
      </View>
      {trailing}
      {showChevron && <ChevronRight size={iconSize.sm} color={colors.textSecondary} />}
    </>
  );
  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}, ${subtitle}` : title)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touch.minHeight + 12,
    paddingVertical: spacing.sm,
  },
  pressed: { opacity: 0.7 },
  text: { flex: 1, gap: 2 },
  divider: { height: 1, backgroundColor: colors.border },
});
