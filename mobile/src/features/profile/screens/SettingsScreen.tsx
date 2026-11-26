import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card, Divider, Screen, SectionHeader, Segmented, SwitchRow } from '../../../shared/ui';
import { colors, spacing } from '../../../shared/theme';
import { notConnected } from '../../../shared/utils/notConnected';

/** Phase 7: these settings are saved through PUT /api/users/me/settings. */
export function SettingsScreen() {
  const [remindHour, setRemindHour] = useState(8);
  const [inApp, setInApp] = useState(true);
  const [deathFirst, setDeathFirst] = useState(true);
  const [newEvents, setNewEvents] = useState(true);
  const [calendar, setCalendar] = useState<'SOLAR' | 'LUNAR'>('SOLAR');
  const [dirty, setDirty] = useState(false);
  const touch =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setDirty(true);
    };

  return (
    <Screen
      footer={dirty ? <Button label="Lưu cài đặt" onPress={() => notConnected('Lưu cài đặt')} fullWidth /> : undefined}
    >
      <View style={styles.section}>
        <SectionHeader title="Nhắc nhở" />
        <Card style={styles.card}>
          <View style={styles.option}>
            <AppText variant="bodyStrong">Giờ nhắc mỗi ngày</AppText>
            <Segmented
              accessibilityLabel="Giờ nhắc"
              value={remindHour}
              onChange={touch(setRemindHour)}
              options={[
                { value: 6, label: '6:00' },
                { value: 8, label: '8:00' },
                { value: 19, label: '19:00' },
              ]}
            />
            <AppText variant="caption" color={colors.textSecondary}>
              Tính theo giờ Việt Nam, kể cả khi bạn đang ở nước ngoài.
            </AppText>
          </View>
          <Divider />
          <SwitchRow
            label="Nhắc kỹ ngày giỗ"
            description="Luôn nhắc trước 7 ngày và 3 ngày cho mọi ngày giỗ"
            value={deathFirst}
            onChange={touch(setDeathFirst)}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Thông báo" />
        <Card style={styles.card}>
          <SwitchRow label="Thông báo trong ứng dụng" value={inApp} onChange={touch(setInApp)} />
          <Divider />
          <SwitchRow
            label="Khi có sự kiện mới"
            description="Báo khi người thân thêm sự kiện vào lịch gia đình"
            value={newEvents}
            onChange={touch(setNewEvents)}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Lịch" />
        <Card style={styles.card}>
          <View style={styles.option}>
            <AppText variant="bodyStrong">Số ngày hiển thị lớn</AppText>
            <Segmented
              accessibilityLabel="Lịch mặc định"
              value={calendar}
              onChange={touch(setCalendar)}
              options={[
                { value: 'SOLAR', label: 'Dương lịch' },
                { value: 'LUNAR', label: 'Âm lịch' },
              ]}
            />
          </View>
          <Divider />
          <AppText variant="caption" color={colors.textSecondary} style={styles.note}>
            Cỡ chữ theo cài đặt của điện thoại. Muốn chữ to hơn, hãy tăng cỡ chữ trong phần Cài đặt của máy.
          </AppText>
        </Card>
      </View>

      <AppText variant="caption" color={colors.textSecondary} align="center">
        FamilyHub 0.1.0
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  card: { paddingVertical: spacing.sm },
  option: { gap: spacing.sm, paddingVertical: spacing.sm },
  note: { paddingVertical: spacing.md },
});
