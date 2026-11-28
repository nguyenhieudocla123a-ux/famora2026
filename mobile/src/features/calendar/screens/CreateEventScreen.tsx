import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react-native';
import {
  AppText,
  Button,
  Card,
  Chip,
  Screen,
  Segmented,
  SelectField,
  SwitchRow,
  TextField,
} from '../../../shared/ui';
import {
  colors,
  eventTypeOrder,
  eventTypeStyles,
  spacing,
} from '../../../shared/theme';
import { EventType } from '../../../shared/types/domain';
import { parseIso, toIso, todayVn } from '../../../shared/utils/date';
import { runAction } from '../../../shared/api/runAction';
import { useSession } from '../../../app/session/SessionContext';
import type { RootScreenProps } from '../../../app/navigation/types';
import { useGetPersonsQuery } from '../../family/api/familyApi';
import {
  EventInput,
  useCreateEventMutation,
  useGetEventQuery,
  useLazyConvertSolarQuery,
  useSetFamilyRemindersMutation,
  useUpdateEventMutation,
} from '../api/calendarApi';
import { CreateEventForm, createEventSchema } from '../schemas';
import { REMINDER_OPTIONS, reminderLabel } from '../reminders';

const YEARLY_BY_DEFAULT: EventType[] = [
  'BIRTHDAY',
  'DEATH_ANNIVERSARY',
  'WEDDING_ANNIVERSARY',
  'HOLIDAY',
];
const range = (a: number, b: number) =>
  Array.from({ length: b - a + 1 }, (_, i) => a + i);
const DAY_OPTIONS = range(1, 31).map(d => ({ value: d, label: String(d) }));
const MONTH_OPTIONS = range(1, 12).map(m => ({
  value: m,
  label: `Tháng ${m}`,
}));
const YEAR_OPTIONS = range(1900, 2100).map(y => ({
  value: y,
  label: String(y),
}));

/** The app's default reminders, as on the server: 7 and 1 days before. */
const DEFAULT_REMINDERS = [7, 1];
const sameSet = (a: number[], b: number[]) =>
  a.length === b.length && a.every(x => b.includes(x));

/** Creates an event, or edits one when opened with an eventId (the form is filled from the server). */
export function CreateEventScreen({
  route,
  navigation,
}: RootScreenProps<'CreateEvent'>) {
  const { activeFamily } = useSession();
  const familyId = activeFamily?.id ?? '';
  const editId = route.params?.eventId;
  const initial = parseIso(route.params?.date ?? todayVn());
  const { data: persons = [] } = useGetPersonsQuery(familyId, {
    skip: !familyId,
  });
  const { data: editing } = useGetEventQuery(
    { familyId, eventId: editId ?? '' },
    { skip: !familyId || !editId },
  );
  const [convertSolar] = useLazyConvertSolarQuery();
  const [createEvent] = useCreateEventMutation();
  const [updateEvent] = useUpdateEventMutation();
  const [setFamilyReminders] = useSetFamilyRemindersMutation();
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, setValue, formState, reset, setError } =
    useForm<CreateEventForm>({
      resolver: zodResolver(createEventSchema),
      defaultValues: {
        title: '',
        type: 'FAMILY_EVENT',
        calendarType: 'SOLAR',
        day: initial.d,
        month: initial.m,
        year: initial.y,
        leapMonth: false,
        yearly: false,
        startTime: '',
        location: '',
        description: '',
        relatedPersonIds: [],
        reminders: DEFAULT_REMINDERS,
      },
    });

  useLayoutEffect(() => {
    navigation.setOptions({ title: editId ? 'Sửa sự kiện' : 'Thêm sự kiện' });
  }, [navigation, editId]);

  // edit mode: fill the form once the event arrives
  useEffect(() => {
    if (!editing) {
      return;
    }
    const solar = editing.solarDate ? parseIso(editing.solarDate) : null;
    const lunar = editing.calendarType === 'LUNAR';
    reset({
      title: editing.title,
      type: editing.type,
      calendarType: editing.calendarType,
      day: lunar ? editing.lunarDay ?? 1 : solar?.d ?? 1,
      month: lunar ? editing.lunarMonth ?? 1 : solar?.m ?? 1,
      year: lunar ? editing.lunarYear ?? initial.y : solar?.y ?? initial.y,
      leapMonth: editing.lunarLeapMonth,
      yearly: editing.recurrence === 'YEARLY',
      startTime: editing.startTime ?? '',
      location: editing.location ?? '',
      description: editing.description ?? '',
      relatedPersonIds: editing.personIds,
      reminders: DEFAULT_REMINDERS,
    });
    // initial.y only fills a missing year
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, reset]);
  const calendarType = useWatch({ control, name: 'calendarType' });
  const errors = formState.errors;

  const onTypeChange = (t: EventType) => {
    setValue('type', t);
    setValue('yearly', YEARLY_BY_DEFAULT.includes(t));
    if (t === 'DEATH_ANNIVERSARY') {
      setValue('calendarType', 'LUNAR'); // ngày giỗ thường tính theo âm lịch
    }
  };

  const onCalendarTypeChange = async (next: 'SOLAR' | 'LUNAR') => {
    // keep the day that was opened, expressed in the other calendar: the server converts it
    const lunar =
      next === 'LUNAR'
        ? (await convertSolar(toIso(initial), true)).data
        : undefined;
    if (next === 'LUNAR' && lunar) {
      setValue('day', lunar.day);
      setValue('month', lunar.month);
      setValue('year', lunar.year);
      setValue('leapMonth', lunar.leap);
    } else if (next === 'SOLAR') {
      setValue('day', initial.d);
      setValue('month', initial.m);
      setValue('year', initial.y);
      setValue('leapMonth', false);
    }
    setValue('calendarType', next);
  };

  const onSubmit = handleSubmit(async v => {
    const lunar = v.calendarType === 'LUNAR';
    const body: EventInput = {
      type: v.type,
      title: v.title.trim(),
      description: v.description.trim() || undefined,
      location: v.location.trim() || undefined,
      calendarType: v.calendarType,
      solarDate: lunar ? undefined : toIso({ y: v.year, m: v.month, d: v.day }),
      lunarDay: lunar ? v.day : undefined,
      lunarMonth: lunar ? v.month : undefined,
      lunarYear: lunar ? v.year : undefined,
      lunarLeapMonth: lunar ? v.leapMonth : false,
      startTime: v.startTime.trim() || undefined,
      recurrence: v.yearly ? 'YEARLY' : 'NONE',
      personIds: v.relatedPersonIds.map(Number),
      version: editing?.version,
    };
    setSaving(true);
    const saved = await runAction(
      () =>
        editId
          ? updateEvent({ familyId, eventId: editId, body }).unwrap()
          : createEvent({ familyId, body }).unwrap(),
      e => {
        if (e.code === 'INVALID_LUNAR_DATE' || e.code === 'DATE_OUT_OF_RANGE') {
          setError('day', { message: e.message });
          return true;
        }
        return false;
      },
    );
    // a new event with other reminders than the default: save them as the family-wide setting
    if (saved && !editId && !sameSet(v.reminders, DEFAULT_REMINDERS)) {
      await runAction(() =>
        setFamilyReminders({
          familyId,
          eventId: saved.id,
          offsets: v.reminders,
        }).unwrap(),
      );
    }
    setSaving(false);
    if (saved) {
      navigation.goBack();
    }
  });

  const typeChips = useMemo(
    () =>
      eventTypeOrder.map(t => {
        const s = eventTypeStyles[t];
        return { t, s, Icon: s.icon };
      }),
    [],
  );

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button
            label="Hủy"
            variant="secondary"
            onPress={() => navigation.goBack()}
          />
          <Button
            label="Lưu sự kiện"
            icon={Check}
            onPress={onSubmit}
            loading={saving}
            style={styles.flex}
          />
        </View>
      }
    >
      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <TextField
            label="Tên sự kiện"
            placeholder="Giỗ ông nội"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.title?.message}
          />
        )}
      />

      <View style={styles.group}>
        <AppText variant="label">Loại sự kiện</AppText>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <View style={styles.chips}>
              {typeChips.map(({ t, s, Icon }) => (
                <Chip
                  key={t}
                  label={s.label}
                  selected={field.value === t}
                  onPress={() => onTypeChange(t)}
                  icon={<Icon size={16} color={s.color} />}
                />
              ))}
            </View>
          )}
        />
      </View>

      <Card style={styles.group}>
        <AppText variant="heading" accessibilityRole="header">
          Ngày diễn ra
        </AppText>
        <Segmented
          accessibilityLabel="Loại lịch"
          value={calendarType}
          onChange={onCalendarTypeChange}
          options={[
            { value: 'SOLAR', label: 'Dương lịch' },
            { value: 'LUNAR', label: 'Âm lịch' },
          ]}
        />
        <View style={styles.dateRow}>
          <Controller
            control={control}
            name="day"
            render={({ field }) => (
              <SelectField
                label="Ngày"
                value={field.value}
                options={
                  calendarType === 'LUNAR'
                    ? DAY_OPTIONS.slice(0, 30)
                    : DAY_OPTIONS
                }
                onChange={field.onChange}
                error={errors.day?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="month"
            render={({ field }) => (
              <SelectField
                label="Tháng"
                value={field.value}
                options={MONTH_OPTIONS}
                onChange={field.onChange}
              />
            )}
          />
        </View>
        <Controller
          control={control}
          name="year"
          render={({ field }) => (
            <SelectField
              label={calendarType === 'LUNAR' ? 'Năm âm lịch' : 'Năm'}
              value={field.value}
              options={YEAR_OPTIONS}
              onChange={field.onChange}
            />
          )}
        />
        {calendarType === 'LUNAR' && (
          <>
            <Controller
              control={control}
              name="leapMonth"
              render={({ field }) => (
                <SwitchRow
                  label="Tháng nhuận"
                  description="Chỉ bật khi ngày gốc rơi vào tháng nhuận. Các năm sau vẫn nhắc theo tháng thường."
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <AppText variant="caption" color={colors.textSecondary}>
              Ngày 30 âm mà năm đó tháng chỉ có 29 ngày sẽ được tính vào ngày
              cuối tháng.
            </AppText>
          </>
        )}
        <Controller
          control={control}
          name="yearly"
          render={({ field }) => (
            <SwitchRow
              label="Lặp lại hằng năm"
              description={
                calendarType === 'LUNAR'
                  ? 'Tự tính lại ngày dương mỗi năm theo âm lịch'
                  : undefined
              }
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </Card>

      <Controller
        control={control}
        name="startTime"
        render={({ field }) => (
          <TextField
            label="Giờ bắt đầu"
            placeholder="10:00"
            hint="Để trống nếu diễn ra cả ngày"
            keyboardType="numbers-and-punctuation"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.startTime?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="location"
        render={({ field }) => (
          <TextField
            label="Địa điểm"
            placeholder="Nhà thờ họ, Nam Định"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.location?.message}
          />
        )}
      />

      {persons.length > 0 && (
        <View style={styles.group}>
          <AppText variant="label">Người liên quan</AppText>
          <Controller
            control={control}
            name="relatedPersonIds"
            render={({ field }) => (
              <View style={styles.chips}>
                {persons.map(p => {
                  const on = field.value.includes(p.id);
                  return (
                    <Chip
                      key={p.id}
                      label={p.nickname ?? p.fullName}
                      selected={on}
                      onPress={() =>
                        field.onChange(
                          on
                            ? field.value.filter(x => x !== p.id)
                            : [...field.value, p.id],
                        )
                      }
                    />
                  );
                })}
              </View>
            )}
          />
        </View>
      )}

      {!editId && (
        <View style={styles.group}>
          <AppText variant="label">Nhắc cả nhà</AppText>
          <Controller
            control={control}
            name="reminders"
            render={({ field }) => (
              <View style={styles.chips}>
                {REMINDER_OPTIONS.map(d => {
                  const on = field.value.includes(d);
                  return (
                    <Chip
                      key={d}
                      label={reminderLabel(d)}
                      selected={on}
                      onPress={() =>
                        field.onChange(
                          on
                            ? field.value.filter(x => x !== d)
                            : [...field.value, d],
                        )
                      }
                    />
                  );
                })}
              </View>
            )}
          />
          <AppText variant="caption" color={colors.textSecondary}>
            Nhắc lúc 8:00 sáng. Mỗi người vẫn có thể chọn nhắc riêng trong chi
            tiết sự kiện.
          </AppText>
        </View>
      )}

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextField
            label="Ghi chú"
            placeholder="Mỗi nhà góp một món, có mặt trước 9 giờ"
            multiline
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.description?.message}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dateRow: { flexDirection: 'row', gap: spacing.md },
  footer: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
