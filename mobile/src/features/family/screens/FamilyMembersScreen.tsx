import React from 'react';
import { ActionSheetIOS, Alert, Platform, StyleSheet, View } from 'react-native';
import { Flame, MoreVertical, UserPlus } from 'lucide-react-native';
import { AppText, Avatar, Button, Card, Divider, ErrorState, IconButton, ListRow, LoadingState, RoleBadge, Screen, SectionHeader } from '../../../shared/ui';
import { colors, eventTypeStyles, spacing } from '../../../shared/theme';
import { FamilyMember } from '../../../shared/types/domain';
import { formatDate, formatDayMonth } from '../../../shared/utils/date';
import { runAction } from '../../../shared/api/runAction';
import { useSession } from '../../../app/session/SessionContext';
import type { RootScreenProps } from '../../../app/navigation/types';
import { can } from '../permissions';
import {
  useChangeRoleMutation,
  useGetMembersQuery,
  useGetPersonsQuery,
  useRemoveMemberMutation,
  useTransferOwnershipMutation,
} from '../api/familyApi';

export function FamilyMembersScreen({ route, navigation }: RootScreenProps<'FamilyMembers'>) {
  const { familyId } = route.params;
  const { families, user } = useSession();
  const family = families.find(f => f.id === familyId);
  const members = useGetMembersQuery(familyId);
  const persons = useGetPersonsQuery(familyId);
  const [changeRole] = useChangeRoleMutation();
  const [removeMember] = useRemoveMemberMutation();
  const [transferOwnership] = useTransferOwnershipMutation();

  if (members.isLoading || persons.isLoading) {
    return <LoadingState />;
  }
  if (members.isError || persons.isError || !members.data || !persons.data || !family) {
    return (
      <ErrorState
        onRetry={() => {
          members.refetch();
          persons.refetch();
        }}
      />
    );
  }

  const myRole = family.myRole;
  const deceased = persons.data.filter(p => p.isDeceased);
  const relatives = persons.data.filter(p => !p.isDeceased && !p.memberId);

  const confirm = (title: string, body: string, action: string, run: () => void) =>
    Alert.alert(title, body, [
      { text: 'Thôi', style: 'cancel' },
      { text: action, style: 'destructive', onPress: run },
    ]);

  const manage = (m: FamilyMember) => {
    const name = m.nickname ?? m.fullName;
    const options: { label: string; run: () => void; destructive?: boolean }[] = [];
    if (can.changeRoles(myRole) && m.role !== 'OWNER') {
      const next = m.role === 'MEMBER' ? 'ADMIN' : 'MEMBER';
      options.push({
        label: next === 'ADMIN' ? 'Đặt làm quản trị' : 'Chuyển về thành viên',
        run: () => runAction(() => changeRole({ familyId, memberId: m.id, role: next }).unwrap()),
      });
      options.push({
        label: 'Chuyển quyền chủ nhà',
        run: () =>
          confirm(
            'Chuyển quyền chủ nhà?',
            `${name} sẽ thành chủ nhà; bạn trở thành quản trị viên. Chỉ chủ nhà mới chuyển lại được.`,
            'Chuyển quyền',
            () => runAction(() => transferOwnership({ familyId, memberId: m.id }).unwrap()),
          ),
      });
    }
    if (can.removeMember(myRole, m.role)) {
      options.push({
        label: 'Mời ra khỏi gia đình',
        destructive: true,
        run: () =>
          confirm(
            `Mời ${name} ra khỏi gia đình?`,
            'Họ sẽ không còn thấy lịch và nhận nhắc nhở của gia đình. Có thể mời lại bằng mã mời mới.',
            'Mời ra',
            () => runAction(() => removeMember({ familyId, memberId: m.id }).unwrap()),
          ),
      });
    }
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: name,
          options: [...options.map(o => o.label), 'Đóng'],
          cancelButtonIndex: options.length,
          destructiveButtonIndex: options.findIndex(o => o.destructive),
        },
        i => options[i]?.run(),
      );
    } else {
      Alert.alert(name, undefined, [
        ...options.map(o => ({ text: o.label, style: o.destructive ? ('destructive' as const) : ('default' as const), onPress: o.run })),
        { text: 'Đóng', style: 'cancel' as const },
      ]);
    }
  };

  return (
    <Screen>
      <View style={styles.section}>
        <SectionHeader title={`Thành viên (${members.data.length})`} />
        <Card style={styles.listCard}>
          {members.data.map((m, i) => {
            const isMe = m.userId === user?.id;
            const manageable = !isMe && (can.changeRoles(myRole) || can.removeMember(myRole, m.role));
            return (
              <View key={m.id}>
                {i > 0 && <Divider />}
                <ListRow
                  title={`${m.nickname ?? m.fullName}${isMe ? ' (bạn)' : ''}`}
                  subtitle={m.nickname ? m.fullName : `Tham gia ${formatDate(m.joinedAt)}`}
                  leading={<Avatar name={m.fullName} nickname={m.nickname} />}
                  trailing={
                    <View style={styles.trailing}>
                      <RoleBadge role={m.role} />
                      {manageable && <IconButton icon={MoreVertical} label={`Quản lý ${m.nickname ?? m.fullName}`} onPress={() => manage(m)} />}
                    </View>
                  }
                />
              </View>
            );
          })}
        </Card>
        {can.invite(myRole) && (
          <Button
            label="Mời người thân"
            icon={UserPlus}
            variant="secondary"
            onPress={() => navigation.navigate('InviteMember', { familyId })}
          />
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Người đã khuất" icon={Flame} iconColor={eventTypeStyles.DEATH_ANNIVERSARY.color} />
        <AppText variant="caption" color={colors.textSecondary}>
          Lưu ngày mất theo âm lịch để cả nhà được nhắc ngày giỗ hằng năm.
        </AppText>
        <Card style={styles.listCard}>
          {deceased.length === 0 ? (
            <AppText variant="body" color={colors.textSecondary} style={styles.emptyLine}>
              Chưa ghi nhận ai.
            </AppText>
          ) : (
            deceased.map((p, i) => (
              <View key={p.id}>
                {i > 0 && <Divider />}
                <ListRow
                  title={p.nickname ?? p.fullName}
                  subtitle={[
                    p.nickname ? p.fullName : null,
                    p.deathLunar ? `giỗ ${p.deathLunar.day}/${p.deathLunar.month} âm` : null,
                    p.nextAnniversary ? `lần tới ${formatDayMonth(p.nextAnniversary)}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  leading={<Avatar name={p.fullName} nickname={p.nickname} />}
                />
              </View>
            ))
          )}
        </Card>
      </View>

      {relatives.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Người thân chưa có tài khoản" />
          <Card style={styles.listCard}>
            {relatives.map((p, i) => (
              <View key={p.id}>
                {i > 0 && <Divider />}
                <ListRow title={p.nickname ?? p.fullName} subtitle={p.fullName} leading={<Avatar name={p.fullName} nickname={p.nickname} />} />
              </View>
            ))}
          </Card>
        </View>
      )}

      {can.managePersons(myRole) && (
        <Button label="Thêm người thân" variant="ghost" onPress={() => navigation.navigate('AddPerson', { familyId })} />
      )}
      <AppText variant="caption" color={colors.textSecondary} align="center">
        Chỉ chủ nhà đổi được vai trò thành viên.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  listCard: { paddingVertical: spacing.xs },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  emptyLine: { paddingVertical: spacing.md },
});
