import React from 'react';
import { ActionSheetIOS, Alert, Platform, StyleSheet, View } from 'react-native';
import { Flame, MoreVertical, UserPlus } from 'lucide-react-native';
import { AppText, Avatar, Button, Card, Divider, ErrorState, IconButton, ListRow, LoadingState, RoleBadge, Screen, SectionHeader } from '../../../shared/ui';
import { colors, eventTypeStyles, spacing } from '../../../shared/theme';
import { FamilyMember } from '../../../shared/types/domain';
import { formatDate } from '../../../shared/utils/date';
import { notConnected } from '../../../shared/utils/notConnected';
import { useSession } from '../../../app/session/SessionContext';
import type { RootScreenProps } from '../../../app/navigation/types';
import { mockMembers, mockPersons } from '../../../mocks/data';
import { useMockResource } from '../../../mocks/useMockResource';
import { can } from '../permissions';

export function FamilyMembersScreen({ route, navigation }: RootScreenProps<'FamilyMembers'>) {
  const { familyId } = route.params;
  const { families, user } = useSession();
  const family = families.find(f => f.id === familyId);
  const { status, data, reload } = useMockResource(() => ({
    members: mockMembers[familyId] ?? [],
    persons: mockPersons[familyId] ?? [],
  }));

  if (status === 'loading') {
    return <LoadingState />;
  }
  if (status === 'error' || !data || !family) {
    return <ErrorState onRetry={reload} />;
  }

  const myRole = family.myRole;
  const deceased = data.persons.filter(p => p.isDeceased);
  const relatives = data.persons.filter(p => !p.isDeceased && !p.memberId);

  const manage = (m: FamilyMember) => {
    const options: { label: string; run: () => void; destructive?: boolean }[] = [];
    if (can.changeRoles(myRole) && m.role !== 'OWNER') {
      options.push(
        m.role === 'MEMBER'
          ? { label: 'Đặt làm quản trị', run: () => notConnected('Đổi vai trò') }
          : { label: 'Chuyển về thành viên', run: () => notConnected('Đổi vai trò') },
      );
      options.push({ label: 'Chuyển quyền chủ nhà', run: () => notConnected('Chuyển quyền chủ nhà') });
    }
    if (can.removeMember(myRole, m.role)) {
      options.push({ label: 'Mời ra khỏi gia đình', destructive: true, run: () => notConnected('Xóa thành viên') });
    }
    const title = m.nickname ?? m.fullName;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title,
          options: [...options.map(o => o.label), 'Đóng'],
          cancelButtonIndex: options.length,
          destructiveButtonIndex: options.findIndex(o => o.destructive),
        },
        i => options[i]?.run(),
      );
    } else {
      Alert.alert(title, undefined, [
        ...options.map(o => ({ text: o.label, style: o.destructive ? ('destructive' as const) : ('default' as const), onPress: o.run })),
        { text: 'Đóng', style: 'cancel' as const },
      ]);
    }
  };

  return (
    <Screen>
      <View style={styles.section}>
        <SectionHeader title={`Thành viên (${data.members.length})`} />
        <Card style={styles.listCard}>
          {data.members.map((m, i) => {
            const isMe = m.userId === user?.id;
            const manageable = !isMe && (can.changeRoles(myRole) || can.removeMember(myRole, m.role));
            return (
              <View key={m.id}>
                {i > 0 && <Divider />}
                <ListRow
                  title={`${m.nickname ?? m.fullName}${isMe ? ' (bạn)' : ''}`}
                  subtitle={m.nickname ? m.fullName : `Tham gia ${formatDate(m.joinedAt)}`}
                  leading={<Avatar name={m.fullName} nickname={m.nickname} face={isMe ? "bo" : undefined} />}
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
                  subtitle={`${p.fullName}${p.deathLunar ? ` · giỗ ${p.deathLunar.day}/${p.deathLunar.month} âm` : ''}`}
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
        <Button label="Thêm người thân" variant="ghost" onPress={() => notConnected('Thêm người thân')} />
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
