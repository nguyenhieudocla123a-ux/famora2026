import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, EventTypeIcon } from '../../../shared/ui';
import { colors, eventTypeStyles, spacing, touch } from '../../../shared/theme';
import { EventOccurrence, IsoDate } from '../../../shared/types/domain';
import { formatDayMonth, relativeDays, weekdayName } from '../../../shared/utils/date';
import { formatLunar } from '../../../mocks/lunarMonths';

interface EventRowProps {
  event: EventOccurrence;
  today: IsoDate;
  onPress: () => void;
  /** Show the date line (lists across days) or only time and place (a single day). */
  showDate?: boolean;
}

export function EventRow({ event, today, onPress, showDate = true }: EventRowProps) {
  const type = eventTypeStyles[event.type];
  const when = [
    showDate ? `${weekdayName(event.date)} ${formatDayMonth(event.date)}` : null,
    event.lunar ? formatLunar(event.lunar) : null,
    event.startTime,
  ]
    .filter(Boolean)
    .join(' · ');
  const relative = relativeDays(today, event.date);
  const soon = relative === 'Hôm nay' || relative === 'Ngày mai';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${type.label}: ${event.title}, ${when}, ${relative}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <EventTypeIcon type={event.type} />
      <View style={styles.text}>
        <AppText variant="bodyStrong" numberOfLines={2}>
          {event.title}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {when || event.location}
        </AppText>
      </View>
      {showDate && (
        <AppText variant="label" color={soon ? colors.accent : colors.textSecondary}>
          {relative}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touch.minHeight + 16,
    paddingVertical: spacing.sm,
  },
  pressed: { opacity: 0.7 },
  text: { flex: 1, gap: 2 },
});
