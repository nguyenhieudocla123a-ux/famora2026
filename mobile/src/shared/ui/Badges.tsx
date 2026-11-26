import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, eventTypeStyles, iconSize, radius, spacing } from '../theme';
import { EventType, FamilyRole } from '../types/domain';
import { AppText } from './AppText';

const roleStyles: Record<FamilyRole, { label: string; bg: string; fg: string }> = {
  OWNER: { label: 'Chủ nhà', bg: colors.highlightSoft, fg: colors.highlightText },
  ADMIN: { label: 'Quản trị', bg: '#EFE4D2', fg: colors.primary },
  MEMBER: { label: 'Thành viên', bg: colors.surfaceSunken, fg: colors.textSecondary },
};

export const roleLabel = (role: FamilyRole) => roleStyles[role].label;

export function RoleBadge({ role }: { role: FamilyRole }) {
  const s = roleStyles[role];
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <AppText variant="caption" color={s.fg}>
        {s.label}
      </AppText>
    </View>
  );
}

export function EventTypeBadge({ type }: { type: EventType }) {
  const s = eventTypeStyles[type];
  const Icon = s.icon;
  return (
    <View style={[styles.pill, styles.row, { backgroundColor: s.soft }]}>
      <Icon size={iconSize.sm - 2} color={s.color} strokeWidth={2} />
      <AppText variant="caption" color={s.color}>
        {s.label}
      </AppText>
    </View>
  );
}

/** Square icon tile used at the start of event rows. */
export function EventTypeIcon({ type, size = 44 }: { type: EventType; size?: number }) {
  const s = eventTypeStyles[type];
  const Icon = s.icon;
  return (
    <View
      style={[styles.tile, { width: size, height: size, backgroundColor: s.soft }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Icon size={size * 0.5} color={s.color} strokeWidth={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  tile: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
