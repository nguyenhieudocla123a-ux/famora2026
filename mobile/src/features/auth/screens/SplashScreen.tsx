import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../../shared/ui';
import { BrandMark } from '../../../shared/ui/BrandMark';
import { colors, spacing } from '../../../shared/theme';

export function SplashScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.center}>
        <BrandMark size={88} />
        <AppText variant="body" color={colors.textSecondary} align="center">
          Lịch gia đình, nhớ trọn ngày giỗ, ngày vui
        </AppText>
      </View>
      <ActivityIndicator color={colors.primary} style={styles.loader} accessibilityLabel="Đang mở ứng dụng" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  loader: { marginBottom: spacing.xxl },
});
