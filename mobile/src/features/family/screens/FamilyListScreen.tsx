import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, KeyRound, Plus, Users } from 'lucide-react-native';
import { AppText, Button, Card, EmptyState, RoleBadge, SectionHeader, TextField } from '../../../shared/ui';
import { colors, iconSize, spacing } from '../../../shared/theme';
import { notConnected } from '../../../shared/utils/notConnected';
import { useSession } from '../../../app/session/SessionContext';
import type { TabScreenProps } from '../../../app/navigation/types';
import { JoinForm, joinSchema } from '../schemas';

export function FamilyListScreen({ navigation }: TabScreenProps<'Families'>) {
  const { families, activeFamily, setActiveFamily } = useSession();
  const { control, handleSubmit, formState, reset } = useForm<JoinForm>({
    resolver: zodResolver(joinSchema),
    defaultValues: { code: '' },
  });

  // Phase 7: POST /api/families/join { code }
  const onJoin = handleSubmit(() => {
    notConnected('Tham gia gia đình');
    reset();
  });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText variant="display" color={colors.primary} accessibilityRole="header">
          Gia đình của bạn
        </AppText>

        {families.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Bạn chưa ở gia đình nào"
            body="Tạo gia đình mới rồi mời người thân, hoặc nhập mã mời bên dưới."
            actionLabel="Tạo gia đình"
            onAction={() => navigation.navigate('CreateFamily')}
          />
        ) : (
          <View style={styles.list}>
            {families.map(f => {
              const active = f.id === activeFamily?.id;
              return (
                <Card
                  key={f.id}
                  onPress={() => navigation.navigate('FamilyDetail', { familyId: f.id })}
                  accessibilityLabel={`${f.name}, ${f.memberCount} thành viên${active ? ', đang xem' : ''}`}
                  style={active ? styles.activeCard : undefined}
                >
                  <View style={styles.cardTop}>
                    <AppText variant="title" style={styles.flex}>
                      {f.name}
                    </AppText>
                    <RoleBadge role={f.myRole} />
                  </View>
                  {f.description && (
                    <AppText variant="body" color={colors.textSecondary}>
                      {f.description}
                    </AppText>
                  )}
                  <View style={styles.cardBottom}>
                    <AppText variant="caption" color={colors.textSecondary}>
                      {f.memberCount} thành viên
                    </AppText>
                    {active ? (
                      <View style={styles.activeTag}>
                        <CheckCircle2 size={iconSize.sm} color={colors.success} />
                        <AppText variant="label" color={colors.success}>
                          Đang xem
                        </AppText>
                      </View>
                    ) : (
                      <Button label="Xem lịch nhà này" variant="ghost" onPress={() => setActiveFamily(f.id)} />
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        <Button label="Tạo gia đình mới" icon={Plus} onPress={() => navigation.navigate('CreateFamily')} fullWidth />

        <View style={styles.section}>
          <SectionHeader title="Có mã mời?" icon={KeyRound} />
          <Card style={styles.joinCard}>
            <Controller
              control={control}
              name="code"
              render={({ field }) => (
                <TextField
                  label="Mã mời từ người thân"
                  placeholder="K7MQ2XHP"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={8}
                  value={field.value}
                  onChangeText={t => field.onChange(t.toUpperCase())}
                  onBlur={field.onBlur}
                  error={formState.errors.code?.message}
                />
              )}
            />
            <Button label="Tham gia gia đình" variant="secondary" onPress={onJoin} />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  list: { gap: spacing.md },
  activeCard: { borderColor: colors.primary, borderWidth: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm, minHeight: 48 },
  activeTag: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  flex: { flex: 1 },
  section: { gap: spacing.sm },
  joinCard: { gap: spacing.md },
});
