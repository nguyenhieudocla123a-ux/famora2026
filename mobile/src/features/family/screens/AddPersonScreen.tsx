import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react-native';
import { AppText, Button, Card, Screen, SwitchRow, TextField } from '../../../shared/ui';
import { colors, spacing } from '../../../shared/theme';
import { runAction } from '../../../shared/api/runAction';
import type { RootScreenProps } from '../../../app/navigation/types';
import { PersonForm, personSchema } from '../schemas';
import { useCreatePersonMutation } from '../api/familyApi';

/**
 * Adds a relative who has no account: a grandparent who passed away (with the lunar day of death, so the
 * family is reminded of the giỗ every year) or a small child.
 */
export function AddPersonScreen({ route, navigation }: RootScreenProps<'AddPerson'>) {
  const { familyId } = route.params;
  const [createPerson] = useCreatePersonMutation();
  const [saving, setSaving] = useState(false);
  const { control, handleSubmit, formState, watch } = useForm<PersonForm>({
    resolver: zodResolver(personSchema),
    defaultValues: { fullName: '', nickname: '', deceased: false, deathLunarDay: '', deathLunarMonth: '', createAnniversary: true },
  });
  const deceased = watch('deceased');

  const onSubmit = handleSubmit(async v => {
    setSaving(true);
    const hasLunar = v.deceased && v.deathLunarDay !== '' && v.deathLunarMonth !== '';
    const saved = await runAction(() =>
      createPerson({
        familyId,
        fullName: v.fullName.trim(),
        nickname: v.nickname.trim() || undefined,
        deceased: v.deceased,
        deathLunarDay: hasLunar ? Number(v.deathLunarDay) : undefined,
        deathLunarMonth: hasLunar ? Number(v.deathLunarMonth) : undefined,
        createAnniversary: hasLunar && v.createAnniversary,
      }).unwrap(),
    );
    setSaving(false);
    if (saved) {
      navigation.goBack();
    }
  });

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button label="Hủy" variant="secondary" onPress={() => navigation.goBack()} />
          <Button label="Lưu" icon={Check} onPress={onSubmit} loading={saving} style={styles.flex} />
        </View>
      }
    >
      <Controller
        control={control}
        name="fullName"
        render={({ field }) => (
          <TextField
            label="Họ và tên"
            placeholder="Phạm Thị Hòa"
            autoCapitalize="words"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.fullName?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="nickname"
        render={({ field }) => (
          <TextField
            label="Cả nhà gọi là"
            placeholder="Bà nội"
            hint="Không bắt buộc"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.nickname?.message}
          />
        )}
      />
      <Card>
        <Controller
          control={control}
          name="deceased"
          render={({ field }) => (
            <SwitchRow label="Đã khuất" description="Để lưu ngày mất và nhắc ngày giỗ." value={field.value} onChange={field.onChange} />
          )}
        />
      </Card>

      {deceased && (
        <Card style={styles.death}>
          <AppText variant="label">Ngày mất (âm lịch)</AppText>
          <View style={styles.row}>
            <Controller
              control={control}
              name="deathLunarDay"
              render={({ field }) => (
                <View style={styles.flex}>
                  <TextField
                    label="Ngày"
                    placeholder="21"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={formState.errors.deathLunarDay?.message}
                  />
                </View>
              )}
            />
            <Controller
              control={control}
              name="deathLunarMonth"
              render={({ field }) => (
                <View style={styles.flex}>
                  <TextField
                    label="Tháng"
                    placeholder="10"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={formState.errors.deathLunarMonth?.message}
                  />
                </View>
              )}
            />
          </View>
          <AppText variant="caption" color={colors.textSecondary}>
            Năm nào tháng đó chỉ có 29 ngày thì giỗ ngày 30 sẽ được tính vào ngày 29.
          </AppText>
          <Controller
            control={control}
            name="createAnniversary"
            render={({ field }) => (
              <SwitchRow
                label="Thêm ngày giỗ vào lịch"
                description="Tạo sự kiện giỗ hằng năm theo âm lịch và nhắc cả nhà."
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.md },
  death: { gap: spacing.md },
});
