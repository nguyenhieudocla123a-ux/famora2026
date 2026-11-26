import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, CalendarDays, Cake, ChevronRight, Flame, House, Sparkles } from 'lucide-react-native';
import { AppText, Button, Card, Divider, ErrorState, IconButton, LoadingState, SectionHeader } from '../../../shared/ui';
import { colors, eventTypeStyles, iconSize, spacing } from '../../../shared/theme';
import { EventOccurrence, EventType } from '../../../shared/types/domain';
import { formatLongDate, todayVn } from '../../../shared/utils/date';
import { useSession } from '../../../app/session/SessionContext';
import { roleLabel } from '../../../shared/ui/Badges';
import type { TabScreenProps } from '../../../app/navigation/types';
import { formatLunar, lunarOf } from '../../../mocks/lunarMonths';
import { useMockResource } from '../../../mocks/useMockResource';
import { EventRow } from '../../calendar/components/EventRow';
import { eventsOn, upcoming } from '../../calendar/eventQueries';

const OTHER_TYPES: EventType[] = ['WEDDING_ANNIVERSARY', 'FAMILY_EVENT', 'IMPORTANT_DAY', 'HOLIDAY'];

function greeting(): string {
  const h = new Date(Date.now() + 7 * 3600 * 1000).getUTCHours();
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

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const { user, activeFamily, unreadCount } = useSession();
  const today = todayVn();
  const familyId = activeFamily?.id ?? '';
  const { status, data, reload } = useMockResource(() => ({
    today: eventsOn(familyId, today),
    deaths: upcoming(familyId, today, 60, ['DEATH_ANNIVERSARY']),
    birthdays: upcoming(familyId, today, 60, ['BIRTHDAY']),
    others: upcoming(familyId, today, 30, OTHER_TYPES),
  }));
  const lunarToday = lunarOf(today);
  const firstName = useMemo(() => user?.fullName.split(' ').pop() ?? '', [user]);

  const open = (e: EventOccurrence) => navigation.navigate('EventDetail', { eventId: e.eventId, date: e.date });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <AppText variant="caption" color={colors.textSecondary}>
              {formatLongDate(today)}
              {lunarToday ? ` · ${formatLunar(lunarToday)}` : ''}
            </AppText>
            <AppText variant="display" color={colors.primary} accessibilityRole="header">
              {greeting()}, {firstName}
            </AppText>
          </View>
          <IconButton icon={Bell} label="Thông báo" badgeCount={unreadCount} onPress={() => navigation.navigate('Notifications')} />
        </View>

        {activeFamily && (
          <Card
            tone="primary"
            onPress={() => navigation.navigate('FamilyDetail', { familyId: activeFamily.id })}
            accessibilityLabel={`Gia đình đang xem: ${activeFamily.name}. Mở chi tiết gia đình`}
          >
            <View style={styles.familyRow}>
              <House size={iconSize.lg} color={colors.highlight} />
              <View style={styles.flex}>
                <AppText variant="title" color={colors.textOnPrimary}>
                  {activeFamily.name}
                </AppText>
                <AppText variant="caption" color={colors.highlight}>
                  {activeFamily.memberCount} thành viên · Bạn là {roleLabel(activeFamily.myRole).toLowerCase()}
                </AppText>
              </View>
              <ChevronRight size={iconSize.md} color={colors.textOnPrimary} />
            </View>
          </Card>
        )}

        {status === 'loading' && <LoadingState />}
        {status === 'error' && <ErrorState onRetry={reload} />}
        {status === 'success' && data && (
          <>
            <Card tone="highlight">
              <AppText variant="label" color={colors.highlightText}>
                Hôm nay
              </AppText>
              {data.today.length === 0 ? (
                <AppText variant="body" style={styles.todayText}>
                  {data.deaths[0] || data.birthdays[0]
                    ? 'Hôm nay nhà mình không có sự kiện nào. Xem các ngày sắp tới bên dưới.'
                    : 'Hôm nay nhà mình không có sự kiện nào.'}
                </AppText>
              ) : (
                data.today.map(e => <EventRow key={e.eventId} event={e} today={today} showDate={false} onPress={() => open(e)} />)
              )}
            </Card>

            <EventSection
              title="Ngày giỗ sắp tới"
              icon={Flame}
              color={eventTypeStyles.DEATH_ANNIVERSARY.color}
              events={data.deaths}
              empty="Không có ngày giỗ nào trong 60 ngày tới."
              today={today}
              onOpen={open}
            />
            <EventSection
              title="Sinh nhật sắp tới"
              icon={Cake}
              color={eventTypeStyles.BIRTHDAY.color}
              events={data.birthdays}
              empty="Không có sinh nhật nào trong 60 ngày tới."
              today={today}
              onOpen={open}
            />
            <EventSection
              title="Sự kiện quan trọng"
              icon={Sparkles}
              color={colors.primary}
              events={data.others}
              empty="Không có sự kiện nào trong 30 ngày tới."
              today={today}
              onOpen={open}
            />

            <Button
              label="Mở lịch gia đình"
              icon={CalendarDays}
              variant="secondary"
              onPress={() => navigation.navigate('Calendar')}
              fullWidth
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface EventSectionProps {
  title: string;
  icon: typeof Flame;
  color: string;
  events: EventOccurrence[];
  empty: string;
  today: string;
  onOpen: (e: EventOccurrence) => void;
}

function EventSection({ title, icon, color, events, empty, today, onOpen }: EventSectionProps) {
  return (
    <View style={styles.section}>
      <SectionHeader title={title} icon={icon} iconColor={color} />
      <Card style={styles.listCard}>
        {events.length === 0 ? (
          <AppText variant="body" color={colors.textSecondary} style={styles.emptyLine}>
            {empty}
          </AppText>
        ) : (
          events.slice(0, 3).map((e, i) => (
            <View key={`${e.eventId}-${e.date}`}>
              {i > 0 && <Divider />}
              <EventRow event={e} today={today} onPress={() => onOpen(e)} />
            </View>
          ))
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  flex: { flex: 1 },
  familyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  todayText: { marginTop: spacing.xs },
  section: { gap: spacing.sm },
  listCard: { paddingVertical: spacing.xs },
  emptyLine: { paddingVertical: spacing.md },
});
