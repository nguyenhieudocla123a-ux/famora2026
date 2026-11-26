import React, { useState } from 'react';
import { Alert, Share, StyleSheet, View } from 'react-native';
import { KeyRound, Share2, XCircle } from 'lucide-react-native';
import { AppText, Button, Card, Divider, Screen, SectionHeader, Segmented } from '../../../shared/ui';
import { colors, fonts, radius, spacing } from '../../../shared/theme';
import { Invitation } from '../../../shared/types/domain';
import { formatDate } from '../../../shared/utils/date';
import { notConnected } from '../../../shared/utils/notConnected';
import { useSession } from '../../../app/session/SessionContext';
import type { RootScreenProps } from '../../../app/navigation/types';
import { mockInvitations } from '../../../mocks/data';
import { can } from '../permissions';

export function InviteMemberScreen({ route }: RootScreenProps<'InviteMember'>) {
  const { familyId } = route.params;
  const { families } = useSession();
  const family = families.find(f => f.id === familyId);
  const [role, setRole] = useState<Invitation['role']>('MEMBER');
  const [days, setDays] = useState(7);
  const [maxUses, setMaxUses] = useState(5);
  const invitations = mockInvitations[familyId] ?? [];
  const isOwner = !!family && can.changeRoles(family.myRole);

  const share = (inv: Invitation) =>
    Share.share({
      message: `Mời bạn vào "${family?.name}" trên FamilyHub. Mở ứng dụng, chọn Gia đình > Có mã mời và nhập mã ${inv.code} (dùng được đến ${formatDate(inv.expiresAt)}).`,
    });

  const revoke = (inv: Invitation) =>
    Alert.alert('Thu hồi mã mời?', `Mã ${inv.code} sẽ không dùng được nữa. Người đã tham gia vẫn ở lại gia đình.`, [
      { text: 'Giữ mã', style: 'cancel' },
      { text: 'Thu hồi', style: 'destructive', onPress: () => notConnected('Thu hồi mã mời') },
    ]);

  return (
    <Screen>
      <AppText variant="body" color={colors.textSecondary}>
        Gửi mã cho người thân qua Zalo, Messenger hoặc tin nhắn. Họ nhập mã trong mục Gia đình để tham gia.
      </AppText>

      {invitations.map(inv => (
        <Card key={inv.code} tone="highlight" style={styles.codeCard}>
          <AppText variant="label" color={colors.highlightText}>
            Mã đang dùng
          </AppText>
          <AppText
            style={styles.code}
            color={colors.primary}
            accessibilityLabel={`Mã mời ${inv.code.split('').join(' ')}`}
            selectable
          >
            {inv.code}
          </AppText>
          <AppText variant="caption" color={colors.text}>
            Vai trò khi vào: {inv.role === 'ADMIN' ? 'Quản trị' : 'Thành viên'} · Đã dùng {inv.usedCount}/{inv.maxUses} lượt · Hết hạn{' '}
            {formatDate(inv.expiresAt)}
          </AppText>
          <View style={styles.actions}>
            <Button label="Gửi mã" icon={Share2} onPress={() => share(inv)} style={styles.flex} />
            <Button label="Thu hồi" icon={XCircle} variant="danger" onPress={() => revoke(inv)} />
          </View>
        </Card>
      ))}

      <View style={styles.section}>
        <SectionHeader title="Tạo mã mới" icon={KeyRound} />
        <Card style={styles.form}>
          {isOwner && (
            <>
              <Option label="Vai trò khi tham gia">
                <Segmented
                  accessibilityLabel="Vai trò khi tham gia"
                  value={role}
                  onChange={setRole}
                  options={[
                    { value: 'MEMBER', label: 'Thành viên' },
                    { value: 'ADMIN', label: 'Quản trị' },
                  ]}
                />
              </Option>
              <Divider />
            </>
          )}
          <Option label="Dùng được trong">
            <Segmented
              accessibilityLabel="Thời hạn mã mời"
              value={days}
              onChange={setDays}
              options={[
                { value: 1, label: '1 ngày' },
                { value: 7, label: '7 ngày' },
                { value: 30, label: '30 ngày' },
              ]}
            />
          </Option>
          <Divider />
          <Option label="Số người dùng tối đa">
            <Segmented
              accessibilityLabel="Số lượt dùng"
              value={maxUses}
              onChange={setMaxUses}
              options={[
                { value: 1, label: '1 người' },
                { value: 5, label: '5 người' },
                { value: 20, label: '20 người' },
              ]}
            />
          </Option>
          {/* Phase 7: POST /api/families/{familyId}/invitations { role, expiresInDays, maxUses } */}
          <Button label="Tạo mã mời" onPress={() => notConnected('Tạo mã mời')} />
        </Card>
      </View>
    </Screen>
  );
}

function Option({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.option}>
      <AppText variant="label">{label}</AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  codeCard: { gap: spacing.sm, alignItems: 'stretch' },
  code: {
    fontFamily: fonts.serif,
    fontSize: 36,
    lineHeight: 46,
    letterSpacing: 6,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  flex: { flex: 1 },
  section: { gap: spacing.sm },
  form: { gap: spacing.md },
  option: { gap: spacing.sm },
});
