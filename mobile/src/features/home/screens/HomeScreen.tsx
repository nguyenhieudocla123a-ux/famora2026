import React, { useCallback, useMemo } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  Users,
  Volume2,
  VolumeX,
  type LucideIcon,
} from 'lucide-react-native';
import { AppText, Avatar, Card, Divider } from '../../../shared/ui';
import { Candle } from '../../../shared/ui/family/Ambient';
import { SkyBackground } from '../../../shared/ui/soft/SkyBackground';
import { Appear } from '../../../shared/ui/soft/Appear';
import { PressScale } from '../../../shared/ui/soft/PressScale';
import { stickers, type StickerName } from '../../../shared/ui/soft/art';
import {
  colors,
  fonts,
  iconSize,
  moodOf,
  moods,
  radius,
  shadow,
  spacing,
} from '../../../shared/theme';
import type { DayMood } from '../../../shared/theme';
import { EventOccurrence, IsoDate } from '../../../shared/types/domain';
import { diffDays, formatDayMonth, todayVn } from '../../../shared/utils/date';
import { useSession } from '../../../app/session/SessionContext';
import type { TabScreenProps } from '../../../app/navigation/types';
import { formatLunar, lunarOf } from '../../../mocks/lunarMonths';
import { useGetMembersQuery } from '../../family/api/familyApi';
import { WelcomeCard } from '../components/WelcomeCard';
import { EventRow } from '../../calendar/components/EventRow';
import { eventsOn, upcoming } from '../../calendar/eventQueries';
import { TearOffSheet, SheetDay } from '../components/TearOffSheet';
import { FamilyHero } from '../components/FamilyHero';

function hourVn(): number {
  return new Date(Date.now() + 7 * 3600 * 1000).getUTCHours();
}

function greeting(h: number): string {
  if (h < 11) {
    return 'Chào buổi sáng';
  }
  if (h < 14) {
    return 'Chào buổi trưa';
  }
  if (h < 18) {
    return 'Chào buổi chiều';
  }
  return 'Chào buổi tối';
}

/** A sticker that fits the day; none on a ngày giỗ. */
function stickerFor(mood: DayMood, h: number): StickerName | null {
  switch (mood) {
    case 'memorial':
      return null;
    case 'birthday':
      return 'yeah';
    case 'wedding':
      return 'yeuThuong';
    case 'holiday':
      return 'om';
    default:
      if (h >= 21 || h < 5) {
        return 'nguNgon';
      }
      return h < 11 ? 'coLen' : h < 17 ? 'tuyetVoi' : 'om';
  }
}

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const insets = useSafeAreaInsets();
  const {
    user,
    activeFamily,
    familiesLoading,
    unreadCount,
    soundOn,
    toggleSound,
  } = useSession();
  const today = todayVn();
  const h = hourVn();
  const familyId = activeFamily?.id ?? '';
  const firstName = useMemo(
    () => user?.fullName.split(' ').pop() ?? '',
    [user],
  );
  const { data: members = [] } = useGetMembersQuery(familyId, {
    skip: !familyId,
  });
  // a brand-new account belongs to no family yet: welcome them instead of showing an empty family card
  const noFamily = !familiesLoading && !activeFamily;

  const getDay = useCallback(
    (date: IsoDate): SheetDay => ({
      date,
      lunar: lunarOf(date),
      events: eventsOn(familyId, date),
    }),
    [familyId],
  );
  const mood = moodOf(eventsOn(familyId, today).map(e => e.type));
  const sticker = stickerFor(mood, h);
  const nextMemorial = upcoming(familyId, today, 120, ['DEATH_ANNIVERSARY'])[0];
  const others = upcoming(familyId, today, 30)
    .filter(e => e.type !== 'DEATH_ANNIVERSARY')
    .slice(0, 3);
  const open = (e: EventOccurrence) =>
    navigation.navigate('EventDetail', { eventId: e.eventId, date: e.date });

  const actions: QuickActionProps[] = [
    {
      icon: CalendarDays,
      label: 'Lịch\ncả nhà',
      tint: colors.primary,
      soft: colors.primarySoft,
      onPress: () => navigation.navigate('Calendar'),
    },
    {
      icon: Users,
      label: 'Thành\nviên',
      tint: colors.primaryDeep,
      soft: '#E4ECFB',
      onPress: () => navigation.navigate('FamilyMembers', { familyId }),
    },
    {
      icon: Bell,
      label: 'Nhắc\nnhở',
      tint: colors.goldText,
      soft: colors.goldSoft,
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      icon: CalendarPlus,
      label: 'Thêm\nsự kiện',
      tint: colors.danger,
      soft: colors.dangerSoft,
      onPress: () => navigation.navigate('CreateEvent', { date: today }),
    },
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SkyBackground height={460 + insets.top} />

        <Appear style={styles.header}>
          <Avatar name={user?.fullName ?? ''} face="bo" size={52} ring />
          <View style={styles.flex}>
            <AppText variant="caption" color={colors.textSecondary}>
              {greeting(h)},
            </AppText>
            <AppText
              style={styles.name}
              accessibilityRole="header"
              numberOfLines={1}
            >
              {firstName}
            </AppText>
          </View>
          <RoundIcon
            icon={soundOn ? Volume2 : VolumeX}
            label={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
            onPress={toggleSound}
            muted={!soundOn}
          />
          <RoundIcon
            icon={Bell}
            label="Thông báo"
            onPress={() => navigation.navigate('Notifications')}
            badge={unreadCount}
          />
        </Appear>

        {noFamily ? (
          <Appear index={1}>
            <WelcomeCard
              onCreate={() => navigation.navigate('CreateFamily')}
              onJoin={() => navigation.navigate('Main', { screen: 'Families' })}
            />
          </Appear>
        ) : (
          <>
            <Appear index={1}>
              <FamilyHero
                mood={mood}
                familyName={activeFamily?.name ?? ''}
                memberCount={activeFamily?.memberCount ?? members.length}
                members={members}
                onSwitchFamily={() =>
                  navigation.navigate('Main', { screen: 'Families' })
                }
                onOpenMembers={() =>
                  navigation.navigate('FamilyMembers', { familyId })
                }
              />
            </Appear>

            <Appear index={2} style={styles.actions}>
              {actions.map(a => (
                <QuickAction key={a.label} {...a} />
              ))}
            </Appear>
          </>
        )}

        <Appear index={3} style={styles.sectionHead}>
          <View style={styles.flex}>
            <AppText variant="title" accessibilityRole="header">
              Tờ lịch hôm nay
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Vuốt lên để xé sang ngày mai
            </AppText>
          </View>
          {sticker && (
            <Image
              source={stickers[sticker]}
              style={styles.sticker}
              resizeMode="contain"
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          )}
        </Appear>
        <Appear index={4} style={styles.sheet}>
          <TearOffSheet startDate={today} getDay={getDay} />
        </Appear>

        {nextMemorial && (
          <Appear index={5}>
            <MemorialCard
              event={nextMemorial}
              today={today}
              onPress={() => open(nextMemorial)}
            />
          </Appear>
        )}

        <Appear index={6} style={styles.sectionHead}>
          <AppText
            variant="title"
            accessibilityRole="header"
            style={styles.flex}
          >
            Sắp tới trong nhà
          </AppText>
          <PressScale
            onPress={() => navigation.navigate('Calendar')}
            accessibilityRole="link"
            hitSlop={10}
            style={styles.link}
          >
            <AppText variant="label" color={colors.primary}>
              Mở lịch
            </AppText>
            <ChevronRight size={iconSize.sm} color={colors.primary} />
          </PressScale>
        </Appear>
        <Appear index={7}>
          <Card style={styles.list}>
            {others.length === 0 ? (
              <AppText
                variant="body"
                color={colors.textSecondary}
                style={styles.empty}
              >
                Không có sự kiện nào trong 30 ngày tới.
              </AppText>
            ) : (
              others.map((e, i) => (
                <View key={`${e.eventId}-${e.date}`}>
                  {i > 0 && <Divider />}
                  <EventRow event={e} today={today} onPress={() => open(e)} />
                </View>
              ))
            )}
          </Card>
        </Appear>
      </ScrollView>
    </View>
  );
}

interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  tint: string;
  soft: string;
  onPress: () => void;
}

/** One of the four shortcuts under the family card. */
function QuickAction({
  icon: Icon,
  label,
  tint,
  soft,
  onPress,
}: QuickActionProps) {
  return (
    <PressScale
      onPress={onPress}
      depth={0.93}
      accessibilityRole="button"
      accessibilityLabel={label.replace('\n', ' ')}
      style={styles.action}
    >
      <View style={[styles.actionIcon, { backgroundColor: soft }]}>
        <Icon size={22} color={tint} strokeWidth={2.2} />
      </View>
      <AppText style={styles.actionLabel} numberOfLines={2}>
        {label}
      </AppText>
    </PressScale>
  );
}

interface RoundIconProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  badge?: number;
  muted?: boolean;
}

/** A white round button for the header; 48 dp, with a badge for unread counts. */
function RoundIcon({
  icon: Icon,
  label,
  onPress,
  badge = 0,
  muted,
}: RoundIconProps) {
  const has = badge > 0;
  return (
    <PressScale
      onPress={onPress}
      depth={0.9}
      accessibilityRole="button"
      accessibilityLabel={has ? `${label}, ${badge} chưa đọc` : label}
      style={styles.round}
    >
      <Icon
        size={iconSize.md}
        color={muted ? colors.textSecondary : colors.primary}
        strokeWidth={2}
      />
      {has && (
        <View
          style={styles.badge}
          importantForAccessibility="no-hide-descendants"
        >
          <AppText style={styles.badgeText}>
            {badge > 9 ? '9+' : String(badge)}
          </AppText>
        </View>
      )}
    </PressScale>
  );
}

/** A calm slate card with a candle: the next ngày giỗ. */
function MemorialCard({
  event,
  today,
  onPress,
}: {
  event: EventOccurrence;
  today: IsoDate;
  onPress: () => void;
}) {
  const days = diffDays(today, event.date);
  return (
    <PressScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ngày giỗ sắp tới: ${event.title}, còn ${days} ngày`}
      style={styles.memorial}
    >
      <View style={styles.candle}>
        <Candle size={26} />
      </View>
      <View style={styles.flex}>
        <AppText variant="caption" color={moods.memorial.onBandMuted}>
          Ngày giỗ sắp tới
        </AppText>
        <AppText style={styles.memorialTitle}>{event.title}</AppText>
        <AppText variant="caption" color={moods.memorial.onBandMuted}>
          {`${event.lunar ? formatLunar(event.lunar) : ''} · ${formatDayMonth(
            event.date,
          )}${event.startTime ? ` · ${event.startTime}` : ''}`}
        </AppText>
      </View>
      <View style={styles.countdown}>
        <AppText style={styles.countNum}>{days}</AppText>
        <AppText style={styles.countLbl}>ngày</AppText>
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    color: colors.text,
  },
  round: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.text,
  },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 17,
    color: colors.text,
    textAlign: 'center',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  sticker: { width: 64, height: 64 },
  sheet: { marginHorizontal: spacing.xs },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 44 },
  memorial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: moods.memorial.band,
    ...shadow.card,
  },
  candle: { width: 40, alignItems: 'center' },
  memorialTitle: {
    fontFamily: fonts.display,
    fontSize: 21,
    lineHeight: 27,
    color: moods.memorial.onBand,
  },
  countdown: {
    alignItems: 'center',
    minWidth: 56,
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  countNum: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 26,
    color: colors.text,
  },
  countLbl: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.text },
  list: { paddingVertical: spacing.xs },
  empty: { paddingVertical: spacing.md },
});
