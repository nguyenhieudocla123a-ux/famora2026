import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Bell, BellRing } from 'lucide-react-native';
import { AppText, Button, EmptyState, ErrorState, LoadingState } from '../../../shared/ui';
import { colors, iconSize, radius, spacing } from '../../../shared/theme';
import { AppNotification } from '../../../shared/types/domain';
import { useSession } from '../../../app/session/SessionContext';
import type { RootScreenProps } from '../../../app/navigation/types';
import { useGetNotificationsQuery, useMarkAllReadMutation, useMarkReadMutation } from '../api/notificationApi';

function timeAgo(iso: string): string {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) {
    return 'Vừa xong';
  }
  if (diffMin < 60) {
    return `${diffMin} phút trước`;
  }
  const h = Math.round(diffMin / 60);
  if (h < 24) {
    return `${h} giờ trước`;
  }
  const d = Math.round(h / 24);
  return d === 1 ? 'Hôm qua' : `${d} ngày trước`;
}

/** Header action; shown only while something is unread. */
function MarkAllReadButton() {
  const { unreadCount } = useSession();
  const [markAllRead] = useMarkAllReadMutation();
  if (unreadCount === 0) {
    return null;
  }
  return <Button label="Đọc hết" variant="ghost" onPress={() => markAllRead()} style={styles.headerBtn} />;
}

/** Passed to the stack's `headerRight` option (kept at module level so it is a stable component). */
export const renderMarkAllRead = () => <MarkAllReadButton />;

export function NotificationCenterScreen({ navigation }: RootScreenProps<'Notifications'>) {
  const { families, activeFamily, setActiveFamily } = useSession();
  // new items arrive by STOMP (useNotificationSocket), which refetches this list
  const { data, isLoading, isError, refetch, isFetching } = useGetNotificationsQuery();
  const [markRead] = useMarkReadMutation();
  const notifications = data?.items ?? [];

  const open = (n: AppNotification) => {
    if (!n.read) {
      markRead(n.id);
    }
    if (!n.eventId || !n.eventDate) {
      return;
    }
    // the event screen reads the active family: switch to the notification's family if it is still ours
    if (n.familyId && n.familyId !== activeFamily?.id) {
      if (!families.some(f => f.id === n.familyId)) {
        return;
      }
      setActiveFamily(n.familyId);
    }
    navigation.navigate('EventDetail', { eventId: n.eventId, date: n.eventDate });
  };

  if (isLoading) {
    return <LoadingState />;
  }
  if (isError && !data) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <FlatList
      style={styles.root}
      refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => { refetch(); }} colors={[colors.accent]} />}
      contentContainerStyle={notifications.length === 0 ? styles.emptyContent : styles.content}
      data={notifications}
      keyExtractor={n => n.id}
      ItemSeparatorComponent={Separator}
      ListEmptyComponent={
        <EmptyState
          icon={Bell}
          title="Chưa có thông báo"
          body="Khi sắp đến ngày giỗ, sinh nhật hay buổi họp mặt, nhắc nhở sẽ hiện ở đây."
        />
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => open(item)}
          accessibilityRole="button"
          accessibilityLabel={`${item.read ? '' : 'Chưa đọc. '}${item.title}. ${item.body}`}
          style={({ pressed }) => [styles.item, !item.read && styles.unread, pressed && styles.pressed]}
        >
          <View style={[styles.icon, !item.read && styles.iconUnread]}>
            <BellRing size={iconSize.md} color={item.read ? colors.textSecondary : colors.accent} />
          </View>
          <View style={styles.text}>
            <AppText variant={item.read ? 'body' : 'bodyStrong'}>{item.title}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {item.body}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {timeAgo(item.createdAt)}
            </AppText>
          </View>
          {!item.read && <View style={styles.dot} />}
        </Pressable>
      )}
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  emptyContent: { flexGrow: 1 },
  headerBtn: { minHeight: 40, paddingHorizontal: spacing.sm },
  item: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unread: { borderColor: colors.highlight, backgroundColor: colors.highlightSoft },
  pressed: { opacity: 0.75 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconUnread: { backgroundColor: colors.surface },
  text: { flex: 1, gap: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, marginTop: 6 },
  separator: { height: spacing.sm },
});
