import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, UserPlus } from 'lucide-react-native';
import { AppText, Button, IconButton, Screen, TextField } from '../../../shared/ui';
import { colors, spacing } from '../../../shared/theme';
import { notConnected } from '../../../shared/utils/notConnected';
import type { RootScreenProps } from '../../../app/navigation/types';
import { RegisterForm, registerSchema } from '../schemas';

type Field = keyof RegisterForm;

const fields: { name: Field; label: string; hint?: string; secure?: boolean; email?: boolean }[] = [
  { name: 'fullName', label: 'Họ và tên' },
  { name: 'email', label: 'Email', email: true },
  { name: 'password', label: 'Mật khẩu', secure: true, hint: 'Ít nhất 8 ký tự, có chữ và số' },
  { name: 'confirmPassword', label: 'Nhập lại mật khẩu', secure: true },
];

export function RegisterScreen({ navigation }: RootScreenProps<'Register'>) {
  const { control, handleSubmit, formState } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  // Phase 7: POST /api/auth/register, then sign in.
  const onSubmit = handleSubmit(() => notConnected('Tạo tài khoản'));

  return (
    <Screen edges={['top', 'bottom']} contentStyle={styles.content}>
      <IconButton icon={ChevronLeft} label="Quay lại đăng nhập" onPress={() => navigation.goBack()} />
      <View style={styles.header}>
        <AppText variant="display" color={colors.primary} accessibilityRole="header">
          Tạo tài khoản
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Sau khi tạo, bạn có thể lập gia đình mới hoặc nhập mã mời từ người thân.
        </AppText>
      </View>

      {fields.map(f => (
        <Controller
          key={f.name}
          control={control}
          name={f.name}
          render={({ field }) => (
            <TextField
              label={f.label}
              hint={f.hint}
              secureTextEntry={f.secure}
              keyboardType={f.email ? 'email-address' : 'default'}
              autoCapitalize={f.name === 'fullName' ? 'words' : 'none'}
              autoComplete={f.email ? 'email' : f.secure ? 'new-password' : 'name'}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={formState.errors[f.name]?.message}
            />
          )}
        />
      ))}

      <Button label="Tạo tài khoản" icon={UserPlus} onPress={onSubmit} fullWidth />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingHorizontal: spacing.xl },
  header: { gap: spacing.sm, marginBottom: spacing.sm },
});
