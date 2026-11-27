import React, { useCallback, useState } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { AppText } from '../../../shared/ui';
import { colors, eventTypeStyles, fonts, moods, moodOf, radius, spacing } from '../../../shared/theme';
import type { DayMood } from '../../../shared/theme';
import { EventOccurrence, IsoDate, LunarDate } from '../../../shared/types/domain';
import { addDays, parseIso, weekdayMon0, weekdayName } from '../../../shared/utils/date';
import { canChiDay, canChiMonth, canChiYear } from '../../../shared/utils/canChi';
import { playSound, SoundName } from '../../../shared/sound/soundEngine';

const PAPER = require('../../../assets/textures/do-paper.jpg');
const MONTH_NAMES = ['Giêng', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Mười một', 'Chạp'];

/** A short family line printed at the foot of each sheet (tục ngữ, ca dao and plain wishes). */
const PROVERBS: Record<DayMood, string[]> = {
  ordinary: ['Gia đình là nơi để trở về', 'Anh em như thể tay chân', 'Một con ngựa đau, cả tàu bỏ cỏ', 'Lá lành đùm lá rách', 'Gia hòa vạn sự hưng', 'Uống nước nhớ nguồn'],
  birthday: ['Chúc mừng sinh nhật, cả nhà thương!', 'Tuổi mới bình an, vạn sự như ý'],
  wedding: ['Thuận vợ thuận chồng, tát biển Đông cũng cạn'],
  holiday: ['Cả nhà sum vầy là vui nhất', 'Gia hòa vạn sự hưng'],
  memorial: ['Cây có cội, nước có nguồn', 'Uống nước nhớ nguồn'],
};

const SOUND_OF: Record<string, SoundName> = { mo: 'mo', chime: 'chime', bell: 'chuong' };

export interface SheetDay {
  date: IsoDate;
  lunar: LunarDate | null;
  events: EventOccurrence[];
}

interface Props {
  startDate: IsoDate;
  getDay: (date: IsoDate) => SheetDay;
  /** Called with the date that is now on top, after a tear. */
  onChange?: (date: IsoDate) => void;
}

const TEAR_UP = -90;
const TEAR_DOWN = 150;

/**
 * Tờ lịch bóc — the tear-off calendar. Drag the top sheet away (up, or pull down) to tear it off;
 * the next day's sheet is already printed underneath. Tap for a small lift and the day's sound.
 */
export function TearOffSheet({ startDate, getDay, onChange }: Props) {
  const [offset, setOffset] = useState(0);
  const reduced = useReducedMotion();
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const lift = useSharedValue(0);
  const gone = useSharedValue(0);

  const current = getDay(addDays(startDate, offset));
  const next = getDay(addDays(startDate, offset + 1));
  const mood = moodOf(current.events.map(e => e.type));

  const advance = useCallback(() => {
    const nextOffset = offset + 1;
    setOffset(nextOffset);
    onChange?.(addDays(startDate, nextOffset));
    tx.value = 0;
    ty.value = 0;
    gone.value = 0;
  }, [offset, onChange, startDate, tx, ty, gone]);

  const tearSound = useCallback(() => playSound('tear', 0.9), []);
  const tapSound = useCallback(() => playSound(SOUND_OF[moods[mood].sound], 0.7), [mood]);

  const pan = Gesture.Pan()
    .activeOffsetY([-12, 12])
    .onUpdate(e => {
      tx.value = e.translationX;
      ty.value = e.translationY;
    })
    .onEnd(e => {
      const up = e.translationY < TEAR_UP || e.velocityY < -900;
      const down = e.translationY > TEAR_DOWN || e.velocityY > 1200;
      if (up || down) {
        runOnJS(tearSound)();
        const duration = reduced ? 1 : 420;
        tx.value = withTiming(tx.value + (e.translationX >= 0 ? 160 : -160), { duration });
        ty.value = withTiming(up ? -620 : 620, { duration, easing: Easing.in(Easing.quad) });
        gone.value = withTiming(1, { duration }, done => {
          if (done) {
            runOnJS(advance)();
          }
        });
      } else {
        tx.value = withSpring(0, { damping: 14, stiffness: 180 });
        ty.value = withSpring(0, { damping: 14, stiffness: 180 });
      }
    });

  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(tapSound)();
    if (!reduced) {
      lift.value = withSequence(withTiming(1, { duration: 120 }), withSpring(0, { damping: 8, stiffness: 160 }));
    }
  });

  const topStyle = useAnimatedStyle(() => ({
    opacity: interpolate(gone.value, [0, 0.7, 1], [1, 1, 0]),
    transform: [
      { translateX: tx.value },
      { translateY: ty.value - lift.value * 8 },
      { rotate: `${interpolate(tx.value, [-220, 220], [-14, 14]) + interpolate(ty.value, [-300, 0, 300], [-10, 0, 6])}deg` },
      { scale: 1 + lift.value * 0.015 },
    ],
  }));

  return (
    <View style={styles.wrap}>
      {/* the block: page edges stacked under the sheets */}
      <View style={[styles.edge, styles.edge3]} />
      <View style={[styles.edge, styles.edge2]} />
      <View style={[styles.edge, styles.edge1]} />
      <View style={StyleSheet.absoluteFill}>
        <Sheet day={next} />
      </View>
      <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
        <Animated.View
          style={[styles.top, topStyle]}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={sheetLabel(current)}
          accessibilityHint="Vuốt lên để xé sang ngày mai"
          accessibilityActions={[{ name: 'increment', label: 'Xé sang ngày mai' }]}
          onAccessibilityAction={() => {
            tearSound();
            advance();
          }}
        >
          <Sheet day={current} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function sheetLabel(day: SheetDay) {
  const { d, m, y } = parseIso(day.date);
  const lunar = day.lunar ? `, âm lịch ${day.lunar.day} tháng ${MONTH_NAMES[day.lunar.month - 1]}` : '';
  const ev = day.events.length ? `, ${day.events.map(e => e.title).join(', ')}` : '';
  return `${weekdayName(day.date)}, ${d} tháng ${m} năm ${y}${lunar}${ev}`;
}

/** One printed sheet. */
function Sheet({ day }: { day: SheetDay }) {
  const { d, m, y } = parseIso(day.date);
  const mood = moodOf(day.events.map(e => e.type));
  const style = moods[mood];
  const isSunday = weekdayMon0(day.date) === 6;
  const red = isSunday || mood === 'holiday';
  const proverbs = PROVERBS[mood];
  const proverb = proverbs[(d + m) % proverbs.length];
  const main = day.events[0];

  return (
    <View style={styles.sheet}>
      <View style={[styles.binding, { backgroundColor: style.binding }]}>
        <View style={styles.staple} />
        <AppText style={[styles.bindingText, { color: style.onBinding }]}>Tháng {m}</AppText>
        <AppText style={[styles.bindingText, { color: style.onBinding }]}>{y}</AppText>
        <View style={[styles.staple, styles.stapleRight]} />
      </View>
      <View style={styles.perforation}>
        {Array.from({ length: 22 }, (_, i) => (
          <View key={i} style={styles.hole} />
        ))}
      </View>
      <ImageBackground source={PAPER} resizeMode="repeat" style={styles.paper} imageStyle={styles.paperTexture}>
        <AppText style={[styles.weekday, { color: red ? colors.inkRed : colors.ink }]}>{weekdayName(day.date)}</AppText>
        <AppText style={[styles.day, { color: red ? colors.inkRed : colors.ink }]} maxFontSizeMultiplier={1}>
          {d}
        </AppText>
        {main ? (
          <View style={[styles.eventPill, { backgroundColor: eventTypeStyles[main.type].soft }]}>
            <AppText variant="label" color={eventTypeStyles[main.type].color} numberOfLines={1}>
              {style.label ? `${style.label} · ` : ''}
              {main.title}
            </AppText>
          </View>
        ) : (
          <View style={styles.eventSpacer} />
        )}
        <View style={styles.lunarRow}>
          <View style={styles.lunarCol}>
            <AppText style={styles.k}>Âm lịch</AppText>
            <AppText style={styles.lunarDay}>{day.lunar ? day.lunar.day : '–'}</AppText>
            <AppText style={styles.s}>{day.lunar ? `tháng ${MONTH_NAMES[day.lunar.month - 1]}${day.lunar.leap ? ' nhuận' : ''}` : ''}</AppText>
          </View>
          <View style={styles.rule} />
          <View style={styles.canChiCol}>
            <AppText style={styles.canChi}>Ngày {canChiDay(day.date)}</AppText>
            {day.lunar && (
              <>
                <AppText style={styles.canChi}>Tháng {canChiMonth(day.lunar.month, day.lunar.year)}</AppText>
                <AppText style={styles.canChi}>Năm {canChiYear(day.lunar.year)}</AppText>
              </>
            )}
          </View>
        </View>
        <AppText style={styles.proverb}>“{proverb}”</AppText>
        <Svg width={34} height={34} style={styles.curl} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Path d="M34 0 L34 34 L0 34 Z" fill={colors.background} />
          <Path d="M34 0 L0 34 C 10 26 22 16 34 0 Z" fill={colors.surfaceSunken} />
        </Svg>
      </ImageBackground>
    </View>
  );
}

const SHEET_RADIUS = 6;

const styles = StyleSheet.create({
  wrap: { minHeight: 452 },
  edge: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 6,
    bottom: 0,
    borderRadius: SHEET_RADIUS,
    backgroundColor: '#EFE5D3',
    borderWidth: 1,
    borderColor: '#DCCDB3',
  },
  edge1: { bottom: -3 },
  edge2: { bottom: -6, left: 6, right: 6 },
  edge3: { bottom: -9, left: 8, right: 8, backgroundColor: '#E6D9C2' },
  top: { flex: 1 },
  sheet: {
    flex: 1,
    borderRadius: SHEET_RADIUS,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    elevation: 6,
    shadowColor: colors.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  binding: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl + 8,
    height: 48,
  },
  bindingText: { fontFamily: fonts.sansSemiBold, fontSize: 15, letterSpacing: 2.4, textTransform: 'uppercase' },
  staple: { position: 'absolute', left: 14, top: 8, width: 4, height: 18, borderRadius: 2, backgroundColor: '#D9D2C6', opacity: 0.85 },
  stapleRight: { left: undefined, right: 14 },
  perforation: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, marginTop: -4, height: 8, zIndex: 2 },
  hole: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E9DCC6' },
  paper: { flex: 1, alignItems: 'center', paddingTop: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: colors.surface },
  paperTexture: { opacity: 0.35 },
  weekday: { fontFamily: fonts.sansSemiBold, fontSize: 17, letterSpacing: 5, textTransform: 'uppercase', marginTop: 4 },
  day: { fontFamily: fonts.display, fontSize: 128, lineHeight: 140, letterSpacing: -3, includeFontPadding: false },
  eventPill: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, maxWidth: '100%', marginTop: -2 },
  eventSpacer: { height: 30 },
  lunarRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#DCCDB3',
    borderStyle: 'dashed',
  },
  lunarCol: { flex: 1, alignItems: 'center' },
  canChiCol: { flex: 1.3, paddingLeft: spacing.md },
  rule: { width: 1, alignSelf: 'stretch', backgroundColor: '#DCCDB3' },
  k: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.accentText },
  lunarDay: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40, color: colors.primaryDeep },
  s: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary },
  canChi: { fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 23, color: colors.text },
  proverb: { fontFamily: fonts.heading, fontSize: 16, lineHeight: 23, color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' },
  curl: { position: 'absolute', right: 0, bottom: 0 },
});
