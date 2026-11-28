import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { CalendarDays, Clock, Lock, MapPin, Moon, Pencil, Repeat, Trash2, UserRound, Users } from 'lucide-react-native';
import { AppText, Button, Card, Chip, Divider, EmptyState, EventTypeBadge, EventTypeIcon, LoadingState, Screen } from '../../../shared/ui';
import { colors, iconSize, spacing } from '../../../shared/theme';
import { formatLongDate, relativeDays, todayVn } from '../../../shared/utils/date';
import { formatLunar } from '../../../shared/utils/lunarFormat';
import { runAction } from '../../../shared/api/runAction';
import { useSession } from '../../../app/session/SessionContext';
import type { RootScreenProps } from '../../../app/navigation/types';
import { useGetMembersQuery, useGetPersonsQuery } from '../../family/api/familyApi';
import {
  useConvertSolarQuery,
  useDeleteEventMutation,
  useGetEventQuery,
  useGetRemindersQuery,
  useSetMyRemindersMutation,
} from '../api/calendarApi';
import { REMINDER_OPTIONS, reminderLabel } from '../reminders';

export function EventDetailScreen({ route, navigation }: RootScreenProps<'EventDetail'>) {
  const { eventId, date } = route.params;
  const { activeFamily, user } = useSession();
  const familyId = activeFamily?.id ?? '';
  const eventQuery = useGetEventQuery({ familyId, eventId }, { skip: !familyId });
  const reminderQuery = useGetRemindersQuery({ familyId, eventId }, { skip: !familyId });
  const { data: members = [] } = useGetMembersQuery(familyId, { skip: !familyId });
  const { data: persons = [] } = useGetPersonsQuery(familyId, { skip: !familyId });
  const { data: lunar } = useConvertSolarQuery(date);
  const [deleteEvent] = useDeleteEventMutation();
  const [setMyReminders] = useSetMyRemindersMutation();
  const [reminders, setReminders] = useState<number[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // start from what applies to me (mine, else the family's, else the default)
  const effective = reminderQuery.data?.effective.offsets;
  useEffect(() => {
    if (effective && !dirty) {
      setReminders(effective);
    }
  }, [effective, dirty]);

  if (eventQuery.isLoading) {
    return <LoadingState />;
  }
  const event = eventQuery.data;
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
  const related = persons.filter(p => event.personIds.includes(p.id));
  const creator = members.find(m => m.userId === event.createdBy);
  const myRole = activeFamily?.myRole;
  // the server checks again; this only decides which buttons to show
  const canEdit = myRole === 'OWNER' || myRole === 'ADMIN' || event.createdBy === user?.id;
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

  const saveReminders = async () => {
    setSaving(true);
    const ok = await runAction(() => setMyReminders({ familyId, eventId, offsets: reminders }).unwrap().then(() => true));
    setSaving(false);
    if (ok) {
      setDirty(false);
    }
  };

  const confirmDelete = () =>
    Alert.alert(
      'Xóa sự kiện?',
      `"${event.title}" sẽ bị xóa khỏi lịch của cả gia đình${event.recurrence === 'YEARLY' ? ', kể cả các năm sau' : ''}.`,
      [
        { text: 'Giữ lại', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            if (await runAction(() => deleteEvent({ familyId, eventId }).unwrap().then(() => true))) {
              navigation.goBack();
            }
          },
        },
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
        <AppText variant="bodyStrong" color={colors.accentText} style={styles.relative}>
          {relativeDays(today, date)}
        </AppText>
      </Card>

      <Card>
        <InfoRow icon={CalendarDays} label="Ngày dương" value={formatLongDate(date)} />
        {lunar && <InfoRow icon={Moon} label="Ngày âm" value={formatLunar(lunar)} />}
        <InfoRow icon={Repeat} label="Lặp lại" value={recurrenceText} />
        <InfoRow icon={Clock} label="Thời gian" value={event.startTime ?? 'Cả ngày'} />
        {event.location && <InfoRow icon={MapPin} label="Địa điểm" value={event.location} />}
        {related.length > 0 && (
          <InfoRow icon={Users} label="Người liên quan" value={related.map(p => p.nickname ?? p.fullName).join(', ')} />
        )}
        <InfoRow
          icon={UserRound}
          label="Người tạo"
          value={creator ? creator.nickname ?? creator.fullName : 'Thành viên đã rời gia đình'}
          last
        />
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
            Chỉ áp dụng cho bạn, nhắc lúc {reminderQuery.data?.effective.time ?? '08:00'} giờ Việt Nam. Bỏ chọn hết để
            tắt nhắc.
          </AppText>
        </View>
        <View style={styles.chips}>
          {REMINDER_OPTIONS.map(d => (
            <Chip key={d} label={reminderLabel(d)} selected={reminders.includes(d)} onPress={() => toggleReminder(d)} />
          ))}
        </View>
        {dirty && <Button label="Lưu nhắc nhở" variant="secondary" onPress={saveReminders} loading={saving} />}
      </Card>

      {canEdit ? (
        <View style={styles.actions}>
          <Button
            label="Sửa sự kiện"
            icon={Pencil}
            onPress={() => navigation.navigate('CreateEvent', { eventId: event.id })}
            style={styles.flex}
          />
          <Button label="Xóa" icon={Trash2} variant="danger" onPress={confirmDelete} />
        </View>
      ) : (
        <View style={styles.locked}>
          <Lock size={iconSize.sm} color={colors.textSecondary} />
          <AppText variant="caption" color={colors.textSecondary} style={styles.flex}>
            Chỉ người tạo sự kiện, chủ nhà hoặc quản trị viên mới sửa được sự kiện này.
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
