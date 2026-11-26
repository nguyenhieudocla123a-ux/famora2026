import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, KeyRound, LogOut, Pencil, Settings } from 'lucide-react-native';
import { AppText, Avatar, Card, Divider, ListRow } from '../../../shared/ui';
import { colors, iconSize, radius, spacing } from '../../../shared/theme';
import { formatDate } from '../../../shared/utils/date';
import { notConnected } from '../../../shared/utils/notConnected';
import { useSession } from '../../../app/session/SessionContext';
import type { TabScreenProps } from '../../../app/navigation/types';

export function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
  const { user, families, signOut } = useSession();
  if (!user) {
    return null;
  }

  const confirmSignOut = () =>
    Alert.alert('Đăng xuất?', 'Bạn sẽ không nhận được nhắc nhở trên máy này cho đến khi đăng nhập lại.', [
      { text: 'Ở lại', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: signOut },
    ]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="display" color={colors.primary} accessibilityRole="header">
          Cá nhân
        </AppText>

        <Card style={styles.profile}>
          <View>
            <Avatar name={user.fullName} size={96} />
            {/* Phase 7: POST /api/users/me/avatar (multipart, ≤ 2 MB, jpg/png/webp) */}
            <Pressable
              onPress={() => notConnected('Đổi ảnh đại diện')}
              accessibilityRole="button"
              accessibilityLabel="Đổi ảnh đại diện"
              style={styles.camera}
              hitSlop={8}
            >
              <Camera size={iconSize.sm} color={colors.textOnPrimary} />
            </Pressable>
          </View>
          <AppText variant="title" align="center">
            {user.fullName}
          </AppText>
          <AppText variant="body" color={colors.textSecondary} align="center">
            {user.email}
          </AppText>
          {user.dateOfBirth && (
            <AppText variant="caption" color={colors.textSecondary}>
              Sinh ngày {formatDate(user.dateOfBirth)} · {families.length} gia đình
            </AppText>
          )}
        </Card>

        <Card style={styles.menu}>
          <ListRow
            title="Sửa thông tin cá nhân"
            leading={<Pencil size={iconSize.md} color={colors.primary} />}
            onPress={() => notConnected('Sửa thông tin cá nhân')}
          />
          <Divider />
          <ListRow
            title="Đổi mật khẩu"
            leading={<KeyRound size={iconSize.md} color={colors.primary} />}
            onPress={() => notConnected('Đổi mật khẩu')}
          />
          <Divider />
          <ListRow
            title="Cài đặt"
            subtitle="Nhắc nhở, lịch, thông báo"
            leading={<Settings size={iconSize.md} color={colors.primary} />}
            onPress={() => navigation.navigate('Settings')}
          />
        </Card>

        <Card style={styles.menu}>
          <ListRow
            title="Đăng xuất"
            danger
            showChevron={false}
            leading={<LogOut size={iconSize.md} color={colors.danger} />}
            onPress={confirmSignOut}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  profile: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl },
  camera: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: { paddingVertical: spacing.xs },
});
