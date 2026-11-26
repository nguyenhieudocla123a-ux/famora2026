import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../shared/ui';
import { colors, eventTypeStyles, radius, spacing } from '../../../shared/theme';
import { EventOccurrence, EventType, IsoDate, LunarDate } from '../../../shared/types/domain';
import { WEEKDAY_SHORT, daysInMonth, formatLongDate, toIso, weekdayMon0 } from '../../../shared/utils/date';
import { lunarOf } from '../../../mocks/lunarMonths';

export type CalendarMode = 'SOLAR' | 'LUNAR';

interface MonthGridProps {
  year: number;
  month: number;
  today: IsoDate;
  selected: IsoDate;
  mode: CalendarMode;
  events: EventOccurrence[];
  onSelect: (date: IsoDate) => void;
}

interface Cell {
  date: IsoDate;
  day: number;
  lunar: LunarDate | null;
  types: EventType[];
  isSunday: boolean;
}

/** Monday-first month grid; each day shows its solar and lunar number and up to three event marks. */
export const MonthGrid = memo(function MonthGridInner({ year, month, today, selected, mode, events, onSelect }: MonthGridProps) {
  const weeks = useMemo(() => {
    const first = toIso({ y: year, m: month, d: 1 });
    const lead = weekdayMon0(first);
    const cells: (Cell | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= daysInMonth(year, month); d++) {
      const date = toIso({ y: year, m: month, d });
      const types = [...new Set(events.filter(e => e.date === date).map(e => e.type))];
      cells.push({ date, day: d, lunar: lunarOf(date), types, isSunday: weekdayMon0(date) === 6 });
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    const rows: (Cell | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }, [year, month, events]);

  return (
    <View accessibilityRole="grid">
      <View style={styles.week}>
        {WEEKDAY_SHORT.map((w, i) => (
          <AppText key={w} variant="caption" align="center" color={i === 6 ? colors.sunday : colors.textSecondary} style={styles.weekday}>
            {w}
          </AppText>
        ))}
      </View>
      {weeks.map((row, r) => (
        <View key={r} style={styles.week}>
          {row.map((cell, c) =>
            cell ? (
              <DayCell
                key={cell.date}
                cell={cell}
                mode={mode}
                isToday={cell.date === today}
                isSelected={cell.date === selected}
                onPress={onSelect}
              />
            ) : (
              <View key={`e${c}`} style={styles.cell} />
            ),
          )}
        </View>
      ))}
    </View>
  );
});

interface DayCellProps {
  cell: Cell;
  mode: CalendarMode;
  isToday: boolean;
  isSelected: boolean;
  onPress: (date: IsoDate) => void;
}

function DayCell({ cell, mode, isToday, isSelected, onPress }: DayCellProps) {
  const { lunar } = cell;
  const lunarLabel = lunar ? (lunar.day === 1 ? `${lunar.day}/${lunar.month}` : String(lunar.day)) : '';
  const isLunarMark = !!lunar && (lunar.day === 1 || lunar.day === 15);
  const big = mode === 'SOLAR' ? String(cell.day) : lunarLabel;
  const small = mode === 'SOLAR' ? lunarLabel : String(cell.day);

  const eventNames = cell.types.map(t => eventTypeStyles[t].label).join(', ');
  const a11y = [
    formatLongDate(cell.date),
    lunar ? `âm lịch ${lunar.day} tháng ${lunar.month}` : null,
    isToday ? 'hôm nay' : null,
    eventNames || null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={() => onPress(cell.date)}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ selected: isSelected }}
      style={({ pressed }) => [
        styles.cell,
        styles.day,
        isToday && styles.today,
        isSelected && styles.selected,
        pressed && !isToday && styles.pressed,
      ]}
    >
      <AppText
        variant="bodyStrong"
        align="center"
        color={isToday ? colors.text : cell.isSunday ? colors.sunday : colors.text}
        style={styles.big}
        maxFontSizeMultiplier={1.3}
      >
        {big}
      </AppText>
      <AppText
        variant="caption"
        align="center"
        color={isToday ? colors.text : isLunarMark || mode === 'LUNAR' ? colors.accent : colors.textSecondary}
        style={styles.small}
        maxFontSizeMultiplier={1.2}
      >
        {small}
      </AppText>
      <View style={styles.marks}>
        {cell.types.slice(0, 3).map(t => (
          <View key={t} style={[styles.mark, { backgroundColor: eventTypeStyles[t].color }]} />
        ))}
      </View>
    </Pressable>
  );
}

const CELL_HEIGHT = 58;

const styles = StyleSheet.create({
  week: { flexDirection: 'row' },
  weekday: { flex: 1, paddingVertical: spacing.xs },
  cell: { flex: 1, height: CELL_HEIGHT, margin: 1 },
  day: {
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  today: { backgroundColor: colors.highlight },
  selected: { borderWidth: 2, borderColor: colors.primary },
  pressed: { backgroundColor: colors.surfaceSunken },
  big: { fontSize: 18, lineHeight: 22 },
  small: { fontSize: 12, lineHeight: 15 },
  marks: { flexDirection: 'row', gap: 3, height: 7, marginTop: 3 },
  mark: { width: 6, height: 6, borderRadius: 3 },
});
