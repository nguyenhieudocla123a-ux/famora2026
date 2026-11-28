import React, { useRef, useState } from 'react';
import { StyleSheet, TextInputInstance } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, UserPlus } from 'lucide-react-native';
import { AppText, Button, Card, IconButton, Screen, TextField } from '../../../shared/ui';
import { SkyBackground } from '../../../shared/ui/soft/SkyBackground';
import { Appear } from '../../../shared/ui/soft/Appear';
import { colors, spacing } from '../../../shared/theme';
import { useAppDispatch } from '../../../app/store';
import { register } from '../authSlice';
import { FormError } from '../components/FormError';
import { GoogleButton, OrDivider } from '../components/GoogleButton';
import { useGoogleSignIn } from '../useGoogleSignIn';
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
  const insets = useSafeAreaInsets();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { googleLoading, signInWithGoogle } = useGoogleSignIn(setServerError);
  // "Next" on the keyboard moves to the following field; "Go" on the last one submits
  const inputs = useRef<(TextInputInstance | null)[]>([]);
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
    <Screen edges={['bottom']} contentStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}>
      <SkyBackground height={360} />
      <IconButton icon={ChevronLeft} label="Quay lại đăng nhập" onPress={() => navigation.goBack()} />
      <Appear style={styles.header}>
        <AppText variant="display" color={colors.primaryDeep} accessibilityRole="header">
          Tạo tài khoản
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Sau khi tạo, bạn có thể lập gia đình mới hoặc nhập mã mời từ người thân.
        </AppText>
      </Appear>

      <Appear index={1}>
        <Card style={styles.form}>
          {fields.map((f, i) => {
            const last = i === fields.length - 1;
            return (
              <Controller
                key={f.name}
                control={control}
                name={f.name}
                render={({ field }) => (
                  <TextField
                    ref={el => {
                      inputs.current[i] = el;
                    }}
                    label={f.label}
                    hint={f.hint}
                    secureTextEntry={f.secure}
                    keyboardType={f.email ? 'email-address' : 'default'}
                    autoCapitalize={f.name === 'fullName' ? 'words' : 'none'}
                    autoComplete={f.email ? 'email' : f.secure ? 'new-password' : 'name'}
                    returnKeyType={last ? 'go' : 'next'}
                    submitBehavior={last ? 'blurAndSubmit' : 'submit'}
                    onSubmitEditing={() => (last ? onSubmit() : inputs.current[i + 1]?.focus())}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={formState.errors[f.name]?.message}
                  />
                )}
              />
            );
          })}

          <FormError message={serverError} />
          <Button
            label="Tạo tài khoản"
            icon={UserPlus}
            onPress={onSubmit}
            loading={submitting}
            disabled={googleLoading}
            fullWidth
          />
          <OrDivider />
          <GoogleButton onPress={signInWithGoogle} loading={googleLoading} disabled={submitting} />
        </Card>
      </Appear>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingHorizontal: spacing.xl },
  header: { gap: spacing.sm },
  form: { gap: spacing.lg, padding: spacing.xl },
});
