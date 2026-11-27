import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Plus, RotateCcw } from 'lucide-react-native';
import { AppText, Card, Divider, EmptyState, Segmented } from '../../../shared/ui';
import { colors, eventTypeOrder, eventTypeStyles, fonts, moodOf, moods, radius, shadow, spacing } from '../../../shared/theme';
import { Candle, FallingHearts } from '../../../shared/ui/family/Ambient';
import { SkyBackground } from '../../../shared/ui/soft/SkyBackground';
import { Appear } from '../../../shared/ui/soft/Appear';
import { PressScale } from '../../../shared/ui/soft/PressScale';
import { playSound } from '../../../shared/sound/soundEngine';
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
  const insets = useSafeAreaInsets();
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
  // the selected day's card takes its mood: a candle on a giỗ, falling hearts on a birthday
  const selectedMood = moodOf(dayEvents.map(e => e.type));
  const mood = moods[selectedMood];
  const onSelectDay = (date: IsoDate) => {
    setSelected(date);
    const m = moodOf(eventsOn(familyId, date).map(e => e.type));
    const cue = moods[m].sound;
    playSound(cue === 'bell' ? 'chuong' : cue, m === 'ordinary' ? 0.6 : 0.8);
  };
  const goToday = () => {
    const { y, m } = parseIso(today);
    setCursor({ y, m });
    setSelected(today);
  };
  const openEvent = (eventId: string, date: IsoDate) => navigation.navigate('EventDetail', { eventId, date });
  const createEvent = () => navigation.navigate('CreateEvent', { date: selected });

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]} showsVerticalScrollIndicator={false}>
        <SkyBackground height={360 + insets.top} />

        <Appear style={styles.header}>
          <View style={styles.flex}>
            <AppText style={styles.title} accessibilityRole="header">
              Lịch gia đình
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {activeFamily?.name}
            </AppText>
          </View>
          {selected !== today && view === 'MONTH' && (
            <PressScale onPress={goToday} depth={0.92} accessibilityRole="button" accessibilityLabel="Về hôm nay" style={styles.todayBtn}>
              <RotateCcw size={16} color={colors.primary} strokeWidth={2.2} />
              <AppText variant="label" color={colors.primary}>
                Hôm nay
              </AppText>
            </PressScale>
          )}
          <PressScale onPress={createEvent} depth={0.9} accessibilityRole="button" accessibilityLabel="Thêm sự kiện" style={styles.addBtn}>
            <Plus size={24} color={colors.textOnPrimary} strokeWidth={2.5} />
          </PressScale>
        </Appear>

        <Appear index={1}>
          <Segmented
            accessibilityLabel="Kiểu xem lịch"
            value={view}
            onChange={setView}
            options={[
              { value: 'MONTH', label: 'Theo tháng' },
              { value: 'UPCOMING', label: 'Sắp tới' },
            ]}
          />
        </Appear>

        {view === 'MONTH' ? (
          <>
            <Appear index={2} style={styles.calendarCard}>
              {/* the blue top of a wall calendar, with its two rings */}
              <View style={styles.calTop}>
                <View style={[styles.ring, styles.ringLeft]} />
                <View style={[styles.ring, styles.ringRight]} />
                <PressScale onPress={() => shift(-1)} disabled={!canPrev} depth={0.88} accessibilityRole="button" accessibilityLabel="Tháng trước" style={[styles.navBtn, !canPrev && styles.disabled]}>
                  <ChevronLeft size={22} color={colors.textOnPrimary} strokeWidth={2.5} />
                </PressScale>
                <View style={styles.monthTitle}>
                  <AppText style={styles.monthText} accessibilityRole="header">
                    Tháng {cursor.m} · {cursor.y}
                  </AppText>
                  <AppText style={styles.monthLunar} numberOfLines={1}>
                    {lunarSubtitle}
                  </AppText>
                </View>
                <PressScale onPress={() => shift(1)} disabled={!canNext} depth={0.88} accessibilityRole="button" accessibilityLabel="Tháng sau" style={[styles.navBtn, !canNext && styles.disabled]}>
                  <ChevronRight size={22} color={colors.textOnPrimary} strokeWidth={2.5} />
                </PressScale>
              </View>

              <View style={styles.calBody}>
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
                  onSelect={onSelectDay}
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
              </View>
            </Appear>

            <Appear index={3} style={styles.dayCard}>
              <View style={[styles.dayTop, { backgroundColor: mood.band }]}>
                {mood.effect === 'petals' && <FallingHearts color={mood.petal} height={92} count={5} />}
                <View style={styles.flex}>
                  {mood.label && (
                    <View style={[styles.moodPill, { backgroundColor: mood.binding }]}>
                      <AppText style={[styles.moodText, { color: mood.onBinding }]}>{mood.label}</AppText>
                    </View>
                  )}
                  <AppText style={[styles.dayTitle, { color: mood.onBand }]} accessibilityRole="header">
                    {formatLongDate(selected)}
                  </AppText>
                  {selectedLunar && (
                    <AppText variant="caption" color={mood.onBandMuted}>
                      Ngày {formatLunar(selectedLunar)} · {capitalize(lunarMonthName(selectedLunar.month, selectedLunar.leap))} năm{' '}
                      {canChiYear(selectedLunar.year)}
                    </AppText>
                  )}
                </View>
                {mood.effect === 'candle' && <Candle size={30} />}
              </View>
              <View style={styles.dayList}>
                {dayEvents.length === 0 ? (
                  <AppText variant="body" color={colors.textSecondary} style={styles.noEvents}>
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
            </Appear>
          </>
        ) : upcomingEvents.length === 0 ? (
          <Card>
            <EmptyState
              title="Chưa có sự kiện nào"
              body="Hãy thêm sự kiện để không bỏ lỡ những khoảnh khắc quan trọng của cả nhà."
              actionLabel="Thêm sự kiện"
              onAction={createEvent}
            />
          </Card>
        ) : (
          <Appear index={2}>
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
          </Appear>
        )}
      </ScrollView>
    </View>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.text },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.float,
  },
  calendarCard: { borderRadius: radius.xxl, backgroundColor: colors.surface, ...shadow.card },
  calTop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  ring: { position: 'absolute', top: -8, width: 10, height: 22, borderRadius: 5, backgroundColor: colors.primaryDeep, borderWidth: 2, borderColor: colors.surface },
  ringLeft: { left: '24%' },
  ringRight: { right: '24%' },
  navBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  disabled: { opacity: 0.35 },
  monthTitle: { flex: 1, alignItems: 'center' },
  monthText: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, color: colors.textOnPrimary },
  monthLunar: { fontFamily: fonts.sansMedium, fontSize: 13, lineHeight: 18, color: '#DCEAFE' },
  calBody: { padding: spacing.md, gap: spacing.md },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md, rowGap: spacing.xs, paddingHorizontal: spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  dayCard: { borderRadius: radius.xxl, backgroundColor: colors.surface, overflow: 'hidden', ...shadow.card },
  dayTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, minHeight: 92, overflow: 'hidden' },
  moodPill: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2, marginBottom: spacing.xs },
  moodText: { fontFamily: fonts.sansSemiBold, fontSize: 12, lineHeight: 16 },
  dayTitle: { fontFamily: fonts.heading, fontSize: 19, lineHeight: 25 },
  dayList: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  noEvents: { paddingVertical: spacing.md },
});
