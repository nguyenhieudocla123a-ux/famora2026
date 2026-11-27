import React from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { CloudOff, type LucideIcon } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { art } from './soft/art';
import { Appear } from './soft/Appear';

export function LoadingState({ label = 'Đang tải…' }: { label?: string }) {
  return (
    <View style={styles.center} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText variant="body" color={colors.textSecondary}>
        {label}
      </AppText>
    </View>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({ message = 'Không tải được dữ liệu. Kiểm tra kết nối mạng rồi thử lại.', onRetry }: ErrorStateProps) {
  return (
    <View style={styles.center}>
      <CloudOff size={40} color={colors.textSecondary} strokeWidth={1.75} />
      <AppText variant="body" align="center" color={colors.text}>
        {message}
      </AppText>
      <Button label="Thử lại" variant="secondary" onPress={onRetry} />
    </View>
  );
}

interface EmptyStateProps {
  /** Small icon; leave it out to show the illustrated calendar instead. */
  icon?: LucideIcon;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, body, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Appear style={styles.center}>
      {Icon ? (
        <View style={styles.iconTile}>
          <Icon size={32} color={colors.primary} strokeWidth={1.75} />
        </View>
      ) : (
        <Image source={art.emptyCalendar} style={styles.art} resizeMode="contain" accessibilityElementsHidden importantForAccessibility="no" />
      )}
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      <AppText variant="body" align="center" color={colors.textSecondary}>
        {body}
      </AppText>
      {actionLabel && onAction && <Button label={actionLabel} onPress={onAction} />}
    </Appear>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  art: { width: 176, height: 136, marginBottom: spacing.xs },
  iconTile: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
});
