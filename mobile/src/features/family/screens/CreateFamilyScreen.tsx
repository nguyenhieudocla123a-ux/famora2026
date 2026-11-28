import React, { useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react-native';
import { AppText, Button, Card, Screen, SwitchRow, TextField } from '../../../shared/ui';
import { colors, spacing } from '../../../shared/theme';
import { runAction } from '../../../shared/api/runAction';
import { useSession } from '../../../app/session/SessionContext';
import type { RootScreenProps } from '../../../app/navigation/types';
import { CreateFamilyForm, createFamilySchema } from '../schemas';
import { useCreateFamilyMutation, useUpdateFamilyMutation } from '../api/familyApi';

/** Creates a family (the creator becomes OWNER), or edits one when opened with a familyId. */
export function CreateFamilyScreen({ navigation, route }: RootScreenProps<'CreateFamily'>) {
  const editId = route.params?.familyId;
  const { families, setActiveFamily } = useSession();
  const editing = editId ? families.find(f => f.id === editId) : undefined;
  const [createFamily] = useCreateFamilyMutation();
  const [updateFamily] = useUpdateFamilyMutation();
  const [saving, setSaving] = useState(false);
  const { control, handleSubmit, formState, setError } = useForm<CreateFamilyForm>({
    resolver: zodResolver(createFamilySchema),
    defaultValues: {
      name: editing?.name ?? '',
      description: editing?.description ?? '',
      memberCanCreateEvents: editing?.memberCanCreateEvents ?? true,
    },
  });

  useLayoutEffect(() => {
    navigation.setOptions({ title: editId ? 'Sửa thông tin gia đình' : 'Tạo gia đình' });
  }, [navigation, editId]);

  const onSubmit = handleSubmit(async values => {
    setSaving(true);
    const body = { name: values.name.trim(), description: values.description.trim(), memberCanCreateEvents: values.memberCanCreateEvents };
    const saved = await runAction(
      () => (editId ? updateFamily({ familyId: editId, ...body }).unwrap() : createFamily(body).unwrap()),
      e => {
        const name = e.fieldErrors.name;
        if (name) {
          setError('name', { message: name });
          return true;
        }
        return false;
      },
    );
    setSaving(false);
    if (!saved) {
      return;
    }
    if (editId) {
      navigation.goBack();
    } else {
      setActiveFamily(saved.id);
      navigation.replace('FamilyDetail', { familyId: saved.id });
    }
  });

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button label="Hủy" variant="secondary" onPress={() => navigation.goBack()} />
          <Button
            label={editId ? 'Lưu' : 'Tạo gia đình'}
            icon={Check}
            onPress={onSubmit}
            loading={saving}
            style={styles.flex}
          />
        </View>
      }
    >
      {!editId && (
        <AppText variant="body" color={colors.textSecondary}>
          Bạn sẽ là chủ nhà của gia đình này. Sau khi tạo, hãy mời người thân bằng mã mời.
        </AppText>
      )}
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextField
            label="Tên gia đình"
            placeholder="Gia đình họ Nguyễn"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.name?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextField
            label="Giới thiệu ngắn"
            placeholder="Nhà nội ở Nam Định và các cháu"
            hint="Không bắt buộc"
            multiline
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.description?.message}
          />
        )}
      />
      <Card>
        <Controller
          control={control}
          name="memberCanCreateEvents"
          render={({ field }) => (
            <SwitchRow
              label="Thành viên được thêm sự kiện"
              description="Tắt nếu chỉ muốn chủ nhà và quản trị viên thêm sự kiện vào lịch."
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
