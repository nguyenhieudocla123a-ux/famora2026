import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, UserPlus } from 'lucide-react-native';
import { AppText, Button, IconButton, Screen, TextField } from '../../../shared/ui';
import { colors, spacing } from '../../../shared/theme';
import { useAppDispatch } from '../../../app/store';
import { register } from '../authSlice';
import { FormError } from '../components/FormError';
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
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { control, handleSubmit, formState, setError } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  // POST /api/auth/register, then sign in: the navigator moves to the app on its own
  const onSubmit = handleSubmit(async values => {
    setServerError(null);
    setSubmitting(true);
    const result = await dispatch(
      register({ fullName: values.fullName.trim(), email: values.email.trim(), password: values.password }),
    );
    setSubmitting(false);
    if (register.rejected.match(result) && result.payload) {
      const err = result.payload;
      if (err.code === 'EMAIL_TAKEN') {
        setError('email', { message: err.message });
        return;
      }
      for (const [field, message] of Object.entries(err.fieldErrors)) {
        if (field === 'email' || field === 'password' || field === 'fullName') {
          setError(field, { message });
        }
      }
      setServerError(err.message);
    }
  });

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

      <FormError message={serverError} />
      <Button label="Tạo tài khoản" icon={UserPlus} onPress={onSubmit} loading={submitting} fullWidth />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingHorizontal: spacing.xl },
  header: { gap: spacing.sm, marginBottom: spacing.sm },
});
