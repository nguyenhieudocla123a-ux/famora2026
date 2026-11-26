import React, { useMemo } from 'react';
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
import { colors, eventTypeOrder, eventTypeStyles, spacing } from '../../../shared/theme';
import { EventType } from '../../../shared/types/domain';
import { parseIso, todayVn } from '../../../shared/utils/date';
import { notConnected } from '../../../shared/utils/notConnected';
import { useSession } from '../../../app/session/SessionContext';
import type { RootScreenProps } from '../../../app/navigation/types';
import { lunarOf } from '../../../mocks/lunarMonths';
import { mockPersons } from '../../../mocks/data';
import { CreateEventForm, createEventSchema } from '../schemas';
import { REMINDER_OPTIONS, reminderLabel } from '../reminders';

const YEARLY_BY_DEFAULT: EventType[] = ['BIRTHDAY', 'DEATH_ANNIVERSARY', 'WEDDING_ANNIVERSARY', 'HOLIDAY'];
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const DAY_OPTIONS = range(1, 31).map(d => ({ value: d, label: String(d) }));
const MONTH_OPTIONS = range(1, 12).map(m => ({ value: m, label: `Tháng ${m}` }));
const YEAR_OPTIONS = range(1900, 2100).map(y => ({ value: y, label: String(y) }));

export function CreateEventScreen({ route, navigation }: RootScreenProps<'CreateEvent'>) {
  const { activeFamily } = useSession();
  const initial = parseIso(route.params?.date ?? todayVn());
  const persons = mockPersons[activeFamily?.id ?? ''] ?? [];

  const { control, handleSubmit, setValue, formState } = useForm<CreateEventForm>({
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
      reminders: [1],
    },
  });
  const calendarType = useWatch({ control, name: 'calendarType' });
  const errors = formState.errors;

  const onTypeChange = (t: EventType) => {
    setValue('type', t);
    setValue('yearly', YEARLY_BY_DEFAULT.includes(t));
    if (t === 'DEATH_ANNIVERSARY') {
      setValue('calendarType', 'LUNAR'); // ngày giỗ thường tính theo âm lịch
    }
  };

  const onCalendarTypeChange = (next: 'SOLAR' | 'LUNAR') => {
    // Keep the same day the user had picked, expressed in the other calendar (Phase 7: backend converts).
    const date = `${initial.y}-${String(initial.m).padStart(2, '0')}-${String(initial.d).padStart(2, '0')}`;
    const lunar = lunarOf(date);
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

  // Phase 7: POST /api/families/{familyId}/events
  const onSubmit = handleSubmit(() => notConnected('Thêm sự kiện'));

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
          <Button label="Hủy" variant="secondary" onPress={() => navigation.goBack()} />
          <Button label="Lưu sự kiện" icon={Check} onPress={onSubmit} style={styles.flex} />
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
                options={calendarType === 'LUNAR' ? DAY_OPTIONS.slice(0, 30) : DAY_OPTIONS}
                onChange={field.onChange}
                error={errors.day?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="month"
            render={({ field }) => (
              <SelectField label="Tháng" value={field.value} options={MONTH_OPTIONS} onChange={field.onChange} />
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
              Ngày 30 âm mà năm đó tháng chỉ có 29 ngày sẽ được tính vào ngày cuối tháng.
            </AppText>
          </>
        )}
        <Controller
          control={control}
          name="yearly"
          render={({ field }) => (
            <SwitchRow
              label="Lặp lại hằng năm"
              description={calendarType === 'LUNAR' ? 'Tự tính lại ngày dương mỗi năm theo âm lịch' : undefined}
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
                      onPress={() => field.onChange(on ? field.value.filter(x => x !== p.id) : [...field.value, p.id])}
                    />
                  );
                })}
              </View>
            )}
          />
        </View>
      )}

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
                    onPress={() => field.onChange(on ? field.value.filter(x => x !== d) : [...field.value, d])}
                  />
                );
              })}
            </View>
          )}
        />
        <AppText variant="caption" color={colors.textSecondary}>
          Mỗi người vẫn có thể đổi giờ nhắc riêng của mình.
        </AppText>
      </View>

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
