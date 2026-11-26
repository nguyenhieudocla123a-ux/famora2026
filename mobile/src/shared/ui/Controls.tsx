import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, radius, spacing, touch } from '../theme';
import { AppText } from './AppText';

interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string | number> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  accessibilityLabel: string;
}

/** Two to three mutually exclusive choices (e.g. Dương lịch / Âm lịch). */
export function Segmented<T extends string | number>({ options, value, onChange, accessibilityLabel }: SegmentedProps<T>) {
  return (
    <View style={styles.segment} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map(o => {
        const selected = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            style={[styles.segmentItem, selected && styles.segmentSelected]}
          >
            <AppText variant="label" color={selected ? colors.textOnPrimary : colors.primary}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
}

/** Toggleable chip; selection is shown by fill AND a check mark. */
export function Chip({ label, selected, onPress, icon }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && !selected && styles.chipPressed,
      ]}
    >
      {selected ? <Check size={16} color={colors.textOnPrimary} strokeWidth={2.5} /> : icon}
      <AppText variant="label" color={selected ? colors.textOnPrimary : colors.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

interface SwitchRowProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export function SwitchRow({ label, description, value, onChange }: SwitchRowProps) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      accessibilityHint={description}
      style={styles.switchRow}
    >
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{label}</AppText>
        {description && (
          <AppText variant="caption" color={colors.textSecondary}>
            {description}
          </AppText>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.borderStrong, true: colors.primary }}
        thumbColor={colors.surface}
        importantForAccessibility="no"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.md,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    minHeight: touch.minHeight - 4,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  segmentSelected: { backgroundColor: colors.primary },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    minHeight: touch.minHeight - 4,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipPressed: { backgroundColor: colors.surfaceSunken },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touch.minHeight + 8,
    paddingVertical: spacing.sm,
  },
  flex: { flex: 1, gap: 2 },
});
