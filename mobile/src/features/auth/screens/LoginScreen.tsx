import React, { useRef, useState } from 'react';
import { StyleSheet, TextInputInstance } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react-native';
import { AppText, Button, Card, Screen, TextField } from '../../../shared/ui';
import { BrandLogo } from '../../../shared/ui/family/Brand';
import { SkyBackground } from '../../../shared/ui/soft/SkyBackground';
import { Appear } from '../../../shared/ui/soft/Appear';
import { colors, spacing } from '../../../shared/theme';
import { useSession } from '../../../app/session/SessionContext';
import type { RootScreenProps } from '../../../app/navigation/types';
import { LoginForm, loginSchema } from '../schemas';

export function LoginScreen({ navigation }: RootScreenProps<'Login'>) {
  const { signIn } = useSession();
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<TextInputInstance>(null);
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit, formState } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // PHASE 2: a valid form opens the app with sample data. Phase 7 calls POST /api/auth/login.
  const onSubmit = handleSubmit(() => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      signIn();
    }, 500);
  });

  return (
    <Screen edges={['bottom']} contentStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}>
      <SkyBackground height={380} />
      <Appear style={styles.header}>
        <BrandLogo width={210} />
        <AppText variant="body" color={colors.textSecondary} align="center">
          Đăng nhập để xem lịch chung và nhận nhắc nhở của cả nhà
        </AppText>
      </Appear>

      <Appear index={1}>
      <Card style={styles.form}>

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label="Email"
            placeholder="ten@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            ref={passwordRef}
            label="Mật khẩu"
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => onSubmit()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.password?.message}
          />
        )}
      />

      <Button label="Đăng nhập" icon={LogIn} onPress={onSubmit} loading={submitting} fullWidth />
      </Card>
      </Appear>

      <Appear index={2} style={styles.footer}>
        <AppText variant="body" color={colors.textSecondary}>
          Chưa có tài khoản?
        </AppText>
        <Button label="Tạo tài khoản" variant="ghost" onPress={() => navigation.navigate('Register')} />
      </Appear>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl },
  header: { alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs },
  form: { gap: spacing.lg, padding: spacing.xl },
  footer: { alignItems: 'center', marginTop: spacing.sm },
});
