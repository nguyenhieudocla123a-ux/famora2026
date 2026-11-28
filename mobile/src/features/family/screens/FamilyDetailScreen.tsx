import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { CalendarDays, LogOut, Pencil, Trash2, UserPlus, Users } from 'lucide-react-native';
import { AppText, Button, Card, Divider, EmptyState, ListRow, RoleBadge, Screen, SectionHeader } from '../../../shared/ui';
import { colors, iconSize, spacing } from '../../../shared/theme';
import { todayVn } from '../../../shared/utils/date';
import { runAction } from '../../../shared/api/runAction';
import { useDissolveFamilyMutation, useLeaveFamilyMutation } from '../api/familyApi';
import { useSession } from '../../../app/session/SessionContext';
import type { RootScreenProps } from '../../../app/navigation/types';
import { EventRow } from '../../calendar/components/EventRow';
import { upcoming } from '../../calendar/eventQueries';
import { can } from '../permissions';

export function FamilyDetailScreen({ route, navigation }: RootScreenProps<'FamilyDetail'>) {
  const { families, setActiveFamily } = useSession();
  const family = families.find(f => f.id === route.params.familyId);
  const [leaveFamily] = useLeaveFamilyMutation();
  const [dissolveFamily] = useDissolveFamilyMutation();

  if (!family) {
    return (
      <Screen scroll={false}>
        <EmptyState
          icon={Users}
          title="Không xem được gia đình này"
          body="Gia đình có thể đã giải tán, hoặc bạn không còn là thành viên."
          actionLabel="Quay lại"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const today = todayVn();
  const events = upcoming(family.id, today, 30);
  const role = family.myRole;

  const openCalendar = () => {
    setActiveFamily(family.id);
    navigation.navigate('Main', { screen: 'Calendar' });
  };

  // after leaving or dissolving, the family list reloads (cache tag) and we go back to it
  const leave = async () => {
    if (await runAction(() => leaveFamily(family.id).unwrap().then(() => true))) {
      navigation.navigate('Main', { screen: 'Families' });
    }
  };
  const dissolve = async () => {
    if (await runAction(() => dissolveFamily(family.id).unwrap().then(() => true))) {
      navigation.navigate('Main', { screen: 'Families' });
    }
  };

  const confirmLeave = () =>
    Alert.alert('Rời gia đình?', `Bạn sẽ không còn thấy lịch và nhận nhắc nhở của ${family.name}.`, [
      { text: 'Ở lại', style: 'cancel' },
      { text: 'Rời gia đình', style: 'destructive', onPress: leave },
    ]);

  const confirmDisband = () =>
    Alert.alert(
      'Giải tán gia đình?',
      `Mọi thành viên sẽ mất quyền xem lịch của ${family.name}. Lịch sử vẫn được lưu trên máy chủ.`,
      [
        { text: 'Giữ gia đình', style: 'cancel' },
        { text: 'Giải tán', style: 'destructive', onPress: dissolve },
      ],
    );

  return (
    <Screen>
      <Card>
        <View style={styles.titleRow}>
          <AppText variant="display" color={colors.primary} style={styles.flex} accessibilityRole="header">
            {family.name}
          </AppText>
          <RoleBadge role={role} />
        </View>
        {family.description && (
          <AppText variant="body" color={colors.textSecondary}>
            {family.description}
          </AppText>
        )}
        <View style={styles.stats}>
          <Stat value={family.memberCount} label="thành viên" />
          <Stat value={events.length} label="sự kiện 30 ngày tới" />
        </View>
      </Card>

      <Card style={styles.menu}>
        <ListRow
          title="Lịch gia đình"
          leading={<CalendarDays size={iconSize.md} color={colors.primary} />}
          onPress={openCalendar}
        />
        <Divider />
        <ListRow
          title="Thành viên và người thân"
          subtitle={`${family.memberCount} thành viên`}
          leading={<Users size={iconSize.md} color={colors.primary} />}
          onPress={() => navigation.navigate('FamilyMembers', { familyId: family.id })}
        />
        {can.invite(role) && (
          <>
            <Divider />
            <ListRow
              title="Mời người thân"
              subtitle="Tạo mã mời để người thân tham gia"
              leading={<UserPlus size={iconSize.md} color={colors.primary} />}
              onPress={() => navigation.navigate('InviteMember', { familyId: family.id })}
            />
          </>
        )}
        {can.editFamily(role) && (
          <>
            <Divider />
            <ListRow
              title="Sửa thông tin gia đình"
              leading={<Pencil size={iconSize.md} color={colors.primary} />}
              onPress={() => navigation.navigate('CreateFamily', { familyId: family.id })}
            />
          </>
        )}
      </Card>

      <View style={styles.section}>
        <SectionHeader title="30 ngày tới" />
        <Card style={styles.listCard}>
          {events.length === 0 ? (
            <AppText variant="body" color={colors.textSecondary} style={styles.emptyLine}>
              Chưa có sự kiện nào trong 30 ngày tới.
            </AppText>
          ) : (
            events.map((e, i) => (
              <View key={`${e.eventId}-${e.date}`}>
                {i > 0 && <Divider />}
                <EventRow event={e} today={today} onPress={() => navigation.navigate('EventDetail', { eventId: e.eventId, date: e.date })} />
              </View>
            ))
          )}
        </Card>
      </View>

      {can.leave(role) && <Button label="Rời gia đình" icon={LogOut} variant="danger" onPress={confirmLeave} />}
      {can.disband(role) && (
        <>
          <Button label="Giải tán gia đình" icon={Trash2} variant="danger" onPress={confirmDisband} />
          <AppText variant="caption" color={colors.textSecondary} align="center">
            Chủ nhà muốn rời gia đình cần chuyển quyền chủ nhà cho người khác trước.
          </AppText>
        </>
      )}
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="display" color={colors.accent}>
        {value}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.xs },
  flex: { flex: 1 },
  stats: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.md },
  stat: { gap: 0 },
  menu: { paddingVertical: spacing.xs },
  section: { gap: spacing.sm },
  listCard: { paddingVertical: spacing.xs },
  emptyLine: { paddingVertical: spacing.md },
});
