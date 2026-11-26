import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { CalendarDays, Clock, Lock, MapPin, Moon, Pencil, Repeat, Trash2, UserRound, Users } from 'lucide-react-native';
import { AppText, Button, Card, Chip, Divider, EmptyState, EventTypeBadge, EventTypeIcon, Screen } from '../../../shared/ui';
import { colors, iconSize, spacing } from '../../../shared/theme';
import { formatLongDate, relativeDays, todayVn } from '../../../shared/utils/date';
import { notConnected } from '../../../shared/utils/notConnected';
import type { RootScreenProps } from '../../../app/navigation/types';
import { formatLunar } from '../../../mocks/lunarMonths';
import { mockPersons } from '../../../mocks/data';
import { findOccurrence } from '../eventQueries';
import { REMINDER_OPTIONS, reminderLabel } from '../reminders';

export function EventDetailScreen({ route, navigation }: RootScreenProps<'EventDetail'>) {
  const event = findOccurrence(route.params.eventId, route.params.date);
  const [reminders, setReminders] = useState<number[]>(event?.reminderDaysBefore ?? []);
  const [dirty, setDirty] = useState(false);

  if (!event) {
    return (
      <Screen scroll={false}>
        <EmptyState
          icon={CalendarDays}
          title="Không tìm thấy sự kiện"
          body="Sự kiện có thể đã bị xóa, hoặc bạn không còn trong gia đình này."
          actionLabel="Về lịch"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const today = todayVn();
  const persons = (mockPersons[event.familyId] ?? []).filter(p => event.relatedPersonIds.includes(p.id));
  const recurrenceText =
    event.recurrence === 'YEARLY'
      ? event.calendarType === 'LUNAR'
        ? 'Lặp lại hằng năm theo âm lịch'
        : 'Lặp lại hằng năm theo dương lịch'
      : 'Chỉ diễn ra một lần';

  const toggleReminder = (d: number) => {
    setDirty(true);
    setReminders(list => (list.includes(d) ? list.filter(x => x !== d) : [...list, d].sort((a, b) => b - a)));
  };

  const confirmDelete = () =>
    Alert.alert(
      'Xóa sự kiện?',
      `"${event.title}" sẽ bị xóa khỏi lịch của cả gia đình${event.recurrence === 'YEARLY' ? ', kể cả các năm sau' : ''}.`,
      [
        { text: 'Giữ lại', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: () => notConnected('Xóa sự kiện') },
      ],
    );

  return (
    <Screen>
      <Card>
        <View style={styles.hero}>
          <EventTypeIcon type={event.type} size={56} />
          <View style={styles.flex}>
            <EventTypeBadge type={event.type} />
            <AppText variant="title" accessibilityRole="header">
              {event.title}
            </AppText>
          </View>
        </View>
        <AppText variant="bodyStrong" color={colors.accent} style={styles.relative}>
          {relativeDays(today, event.date)}
        </AppText>
      </Card>

      <Card>
        <InfoRow icon={CalendarDays} label="Ngày dương" value={formatLongDate(event.date)} />
        {event.lunar && <InfoRow icon={Moon} label="Ngày âm" value={formatLunar(event.lunar)} />}
        <InfoRow icon={Repeat} label="Lặp lại" value={recurrenceText} />
        <InfoRow icon={Clock} label="Thời gian" value={event.startTime ?? 'Cả ngày'} />
        {event.location && <InfoRow icon={MapPin} label="Địa điểm" value={event.location} />}
        {persons.length > 0 && (
          <InfoRow icon={Users} label="Người liên quan" value={persons.map(p => p.nickname ?? p.fullName).join(', ')} />
        )}
        <InfoRow icon={UserRound} label="Người tạo" value={event.createdByName} last />
      </Card>

      {event.description && (
        <Card>
          <AppText variant="heading" accessibilityRole="header">
            Ghi chú
          </AppText>
          <AppText variant="body" style={styles.note}>
            {event.description}
          </AppText>
        </Card>
      )}

      <Card style={styles.gap}>
        <View>
          <AppText variant="heading" accessibilityRole="header">
            Nhắc tôi
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Chỉ áp dụng cho bạn, nhắc lúc 8:00 sáng giờ Việt Nam.
          </AppText>
        </View>
        <View style={styles.chips}>
          {REMINDER_OPTIONS.map(d => (
            <Chip key={d} label={reminderLabel(d)} selected={reminders.includes(d)} onPress={() => toggleReminder(d)} />
          ))}
        </View>
        {dirty && <Button label="Lưu nhắc nhở" variant="secondary" onPress={() => notConnected('Lưu nhắc nhở')} />}
      </Card>

      {event.canEdit ? (
        <View style={styles.actions}>
          <Button label="Sửa sự kiện" icon={Pencil} onPress={() => notConnected('Sửa sự kiện')} style={styles.flex} />
          <Button label="Xóa" icon={Trash2} variant="danger" onPress={confirmDelete} />
        </View>
      ) : (
        <View style={styles.locked}>
          <Lock size={iconSize.sm} color={colors.textSecondary} />
          <AppText variant="caption" color={colors.textSecondary} style={styles.flex}>
            Ngày lễ do hệ thống tạo nên không sửa được. Sự kiện của gia đình chỉ người tạo hoặc quản trị viên mới sửa được.
          </AppText>
        </View>
      )}
    </Screen>
  );
}

interface InfoRowProps {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  last?: boolean;
}

function InfoRow({ icon: Icon, label, value, last }: InfoRowProps) {
  return (
    <>
      <View style={styles.infoRow} accessible accessibilityLabel={`${label}: ${value}`}>
        <Icon size={iconSize.md} color={colors.primary} />
        <View style={styles.flex}>
          <AppText variant="caption" color={colors.textSecondary}>
            {label}
          </AppText>
          <AppText variant="bodyStrong">{value}</AppText>
        </View>
      </View>
      {!last && <Divider />}
    </>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  flex: { flex: 1, gap: spacing.xs },
  relative: { marginTop: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  note: { marginTop: spacing.xs },
  gap: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md },
  locked: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', paddingHorizontal: spacing.xs },
});
