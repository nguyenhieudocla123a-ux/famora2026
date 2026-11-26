import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarPlus, ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { AppText, Card, Divider, EmptyState, IconButton, Segmented } from '../../../shared/ui';
import { colors, eventTypeOrder, eventTypeStyles, radius, spacing, touch } from '../../../shared/theme';
import { IsoDate } from '../../../shared/types/domain';
import { daysInMonth, formatLongDate, parseIso, toIso, todayVn } from '../../../shared/utils/date';
import { useSession } from '../../../app/session/SessionContext';
import type { TabScreenProps } from '../../../app/navigation/types';
import { MOCK_RANGE, canChiYear, formatLunar, lunarMonthName, lunarOf } from '../../../mocks/lunarMonths';
import { CalendarMode, MonthGrid } from '../components/MonthGrid';
import { EventRow } from '../components/EventRow';
import { eventsInRange, eventsOn, upcoming } from '../eventQueries';

type CalendarView = 'MONTH' | 'UPCOMING';

const monthIndex = (y: number, m: number) => y * 12 + (m - 1);

export function CalendarScreen({ navigation, route }: TabScreenProps<'Calendar'>) {
  const { activeFamily } = useSession();
  const today = todayVn();
  const [selected, setSelected] = useState<IsoDate>(route.params?.date ?? today);
  const [cursor, setCursor] = useState(() => {
    const { y, m } = parseIso(route.params?.date ?? today);
    return { y, m };
  });
  const [mode, setMode] = useState<CalendarMode>('SOLAR');
  const [view, setView] = useState<CalendarView>('MONTH');

  useEffect(() => {
    const date = route.params?.date;
    if (date) {
      const { y, m } = parseIso(date);
      setSelected(date);
      setCursor({ y, m });
      setView('MONTH');
    }
  }, [route.params?.date]);

  const familyId = activeFamily?.id ?? '';
  const from = toIso({ y: cursor.y, m: cursor.m, d: 1 });
  const to = toIso({ y: cursor.y, m: cursor.m, d: daysInMonth(cursor.y, cursor.m) });
  const monthEvents = useMemo(() => eventsInRange(familyId, from, to), [familyId, from, to]);
  const dayEvents = useMemo(() => eventsOn(familyId, selected), [familyId, selected]);
  const upcomingEvents = useMemo(() => upcoming(familyId, today, 90), [familyId, today]);

  const idx = monthIndex(cursor.y, cursor.m);
  const canPrev = idx > monthIndex(MOCK_RANGE.first.y, MOCK_RANGE.first.m);
  const canNext = idx < monthIndex(MOCK_RANGE.last.y, MOCK_RANGE.last.m);
  const shift = (delta: number) => {
    const n = idx + delta;
    const y = Math.floor(n / 12);
    const m = (n % 12) + 1;
    setCursor({ y, m });
    setSelected(toIso({ y, m, d: 1 }));
  };

  const firstLunar = lunarOf(from);
  const lastLunar = lunarOf(to);
  const lunarSubtitle =
    firstLunar && lastLunar
      ? `${capitalize(lunarMonthName(firstLunar.month, firstLunar.leap))}${
          firstLunar.month !== lastLunar.month ? ` – ${lunarMonthName(lastLunar.month, lastLunar.leap)}` : ''
        } năm ${canChiYear(lastLunar.year)}`
      : '';
  const selectedLunar = lunarOf(selected);
  const goToday = () => {
    const { y, m } = parseIso(today);
    setCursor({ y, m });
    setSelected(today);
  };
  const openEvent = (eventId: string, date: IsoDate) => navigation.navigate('EventDetail', { eventId, date });
  const createEvent = () => navigation.navigate('CreateEvent', { date: selected });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <AppText variant="display" color={colors.primary} accessibilityRole="header">
            Lịch gia đình
          </AppText>
          {selected !== today && view === 'MONTH' && (
            <Pressable onPress={goToday} accessibilityRole="button" style={styles.todayBtn} hitSlop={touch.hitSlop}>
              <AppText variant="label" color={colors.accent}>
                Hôm nay
              </AppText>
            </Pressable>
          )}
        </View>

        <Segmented
          accessibilityLabel="Kiểu xem lịch"
          value={view}
          onChange={setView}
          options={[
            { value: 'MONTH', label: 'Theo tháng' },
            { value: 'UPCOMING', label: 'Sắp tới' },
          ]}
        />

        {view === 'MONTH' ? (
          <>
            <Card style={styles.calendarCard}>
              <View style={styles.monthNav}>
                <IconButton icon={ChevronLeft} label="Tháng trước" onPress={() => shift(-1)} disabled={!canPrev} />
                <View style={styles.monthTitle}>
                  <AppText variant="title" align="center" accessibilityRole="header">
                    Tháng {cursor.m}, {cursor.y}
                  </AppText>
                  <AppText variant="caption" align="center" color={colors.accent}>
                    {lunarSubtitle}
                  </AppText>
                </View>
                <IconButton icon={ChevronRight} label="Tháng sau" onPress={() => shift(1)} disabled={!canNext} />
              </View>

              <Segmented
                accessibilityLabel="Số ngày hiển thị lớn"
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'SOLAR', label: 'Dương lịch' },
                  { value: 'LUNAR', label: 'Âm lịch' },
                ]}
              />

              <MonthGrid
                year={cursor.y}
                month={cursor.m}
                today={today}
                selected={selected}
                mode={mode}
                events={monthEvents}
                onSelect={setSelected}
              />

              <View style={styles.legend} accessibilityLabel="Chú thích màu loại sự kiện">
                {eventTypeOrder.map(t => (
                  <View key={t} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: eventTypeStyles[t].color }]} />
                    <AppText variant="caption" color={colors.textSecondary}>
                      {eventTypeStyles[t].label}
                    </AppText>
                  </View>
                ))}
              </View>
            </Card>

            <Card>
              <AppText variant="heading" accessibilityRole="header">
                {formatLongDate(selected)}
              </AppText>
              {selectedLunar && (
                <AppText variant="caption" color={colors.accent}>
                  Ngày {formatLunar(selectedLunar)} · {capitalize(lunarMonthName(selectedLunar.month, selectedLunar.leap))} năm{' '}
                  {canChiYear(selectedLunar.year)}
                </AppText>
              )}
              <View style={styles.dayList}>
                {dayEvents.length === 0 ? (
                  <AppText variant="body" color={colors.textSecondary}>
                    Ngày này chưa có sự kiện.
                  </AppText>
                ) : (
                  dayEvents.map((e, i) => (
                    <View key={e.eventId}>
                      {i > 0 && <Divider />}
                      <EventRow event={e} today={today} showDate={false} onPress={() => openEvent(e.eventId, e.date)} />
                    </View>
                  ))
                )}
              </View>
            </Card>
          </>
        ) : upcomingEvents.length === 0 ? (
          <EmptyState
            icon={CalendarPlus}
            title="Chưa có sự kiện sắp tới"
            body="Thêm ngày giỗ, sinh nhật hay buổi họp mặt để cả nhà cùng được nhắc."
            actionLabel="Thêm sự kiện"
            onAction={createEvent}
          />
        ) : (
          <Card>
            <AppText variant="heading" accessibilityRole="header">
              90 ngày tới
            </AppText>
            {upcomingEvents.map((e, i) => (
              <View key={`${e.eventId}-${e.date}`}>
                {i > 0 && <Divider />}
                <EventRow event={e} today={today} onPress={() => openEvent(e.eventId, e.date)} />
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      <Pressable
        onPress={createEvent}
        accessibilityRole="button"
        accessibilityLabel="Thêm sự kiện"
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Plus size={22} color={colors.textInverse} strokeWidth={2.5} />
        <AppText variant="bodyStrong" color={colors.textInverse}>
          Thêm sự kiện
        </AppText>
      </Pressable>
    </SafeAreaView>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 112 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  todayBtn: { minHeight: touch.minHeight - 8, justifyContent: 'center', paddingHorizontal: spacing.sm },
  calendarCard: { gap: spacing.md, paddingHorizontal: spacing.sm },
  monthNav: { flexDirection: 'row', alignItems: 'center' },
  monthTitle: { flex: 1 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md, rowGap: spacing.xs, paddingHorizontal: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  dayList: { marginTop: spacing.sm },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    elevation: 4,
  },
  fabPressed: { backgroundColor: colors.accentPressed },
});
