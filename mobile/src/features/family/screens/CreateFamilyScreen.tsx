import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react-native';
import { AppText, Button, Card, Screen, SwitchRow, TextField } from '../../../shared/ui';
import { colors, spacing } from '../../../shared/theme';
import { notConnected } from '../../../shared/utils/notConnected';
import type { RootScreenProps } from '../../../app/navigation/types';
import { CreateFamilyForm, createFamilySchema } from '../schemas';

export function CreateFamilyScreen({ navigation }: RootScreenProps<'CreateFamily'>) {
  const { control, handleSubmit, formState } = useForm<CreateFamilyForm>({
    resolver: zodResolver(createFamilySchema),
    defaultValues: { name: '', description: '', memberCanCreateEvents: true },
  });

  // Phase 7: POST /api/families — the creator becomes OWNER in the same transaction.
  const onSubmit = handleSubmit(() => notConnected('Tạo gia đình'));

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button label="Hủy" variant="secondary" onPress={() => navigation.goBack()} />
          <Button label="Tạo gia đình" icon={Check} onPress={onSubmit} style={styles.flex} />
        </View>
      }
    >
      <AppText variant="body" color={colors.textSecondary}>
        Bạn sẽ là chủ nhà của gia đình này. Sau khi tạo, hãy mời người thân bằng mã mời.
      </AppText>
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
