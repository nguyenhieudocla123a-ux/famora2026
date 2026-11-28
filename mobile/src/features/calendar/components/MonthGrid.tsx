import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../shared/ui';
import { colors, eventTypeStyles, fonts, radius, spacing } from '../../../shared/theme';
import { CalendarCell, EventOccurrence, EventType, IsoDate, LunarDate } from '../../../shared/types/domain';
import { WEEKDAY_SHORT, formatLongDate, weekdayMon0 } from '../../../shared/utils/date';

export type CalendarMode = 'SOLAR' | 'LUNAR';

interface MonthGridProps {
  /** The server's 42-cell grid (Monday first), with lunar dates and holidays. */
  cells: CalendarCell[];
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
  /** A public holiday prints red like a Sunday; any holiday is read out to screen readers. */
  holiday: { name: string; publicHoliday: boolean } | null;
}

/** Monday-first month grid; each day shows its solar and lunar number and up to three event marks. */
export const MonthGrid = memo(function MonthGridInner({ cells, today, selected, mode, events, onSelect }: MonthGridProps) {
  const weeks = useMemo(() => {
    const rows: (Cell | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      const row = cells.slice(i, i + 7);
      if (!row.some(c => c.inMonth)) {
        continue; // the server always sends 6 weeks; drop a trailing week of next month only
      }
      rows.push(
        row.map(c =>
          c.inMonth
            ? {
                date: c.date,
                day: Number(c.date.slice(8, 10)),
                lunar: c.lunar,
                types: [...new Set(events.filter(e => e.date === c.date).map(e => e.type))],
                isSunday: weekdayMon0(c.date) === 6,
                holiday: c.holidays[0] ?? null,
              }
            : null,
        ),
      );
    }
    return rows;
  }, [cells, events]);

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
    cell.holiday?.name ?? null,
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
        isSelected && (isToday ? styles.todaySelected : styles.selected),
        pressed && !isToday && styles.pressed,
      ]}
    >
      <AppText
        variant="bodyStrong"
        align="center"
        color={isToday ? colors.textOnPrimary : cell.isSunday || cell.holiday?.publicHoliday ? colors.sunday : colors.text}
        style={styles.big}
        maxFontSizeMultiplier={1.3}
      >
        {big}
      </AppText>
      <AppText
        variant="caption"
        align="center"
        color={isToday ? colors.textOnPrimary : isLunarMark || mode === 'LUNAR' ? colors.accentText : colors.textSecondary}
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
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  today: { backgroundColor: colors.highlight },
  selected: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primarySoft },
  todaySelected: { borderWidth: 2, borderColor: colors.primaryDeep },
  pressed: { backgroundColor: colors.surfaceSunken },
  big: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 22 },
  small: { fontSize: 12, lineHeight: 15 },
  marks: { flexDirection: 'row', gap: 3, height: 7, marginTop: 3 },
  mark: { width: 6, height: 6, borderRadius: 3 },
});
