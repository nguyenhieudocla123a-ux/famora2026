import { baseApi } from '../../../shared/api/baseApi';
import type { AppNotification } from '../../../shared/types/domain';

/* ---------- server shapes ---------- */

export interface NotificationDto {
  id: number;
  familyId?: number | null;
  type: string;
  title: string;
  body: string;
  refType?: string | null;
  refId?: number | null;
  refDate?: string | null;
  read: boolean;
  createdAt: string;
}

interface PageDto {
  items: NotificationDto[];
  page: number;
  size: number;
  hasNext: boolean;
  unreadCount: number;
}

export interface NotificationPage {
  items: AppNotification[];
  hasNext: boolean;
  unreadCount: number;
}

/** Only a notification about an event (with its day) can open the event screen. */
export const toNotification = (n: NotificationDto): AppNotification => ({
  id: String(n.id),
  type: n.type,
  familyId: n.familyId == null ? undefined : String(n.familyId),
  title: n.title,
  body: n.body,
  createdAt: n.createdAt,
  read: n.read,
  eventId: n.refType === 'EVENT' && n.refId != null ? String(n.refId) : undefined,
  eventDate: n.refType === 'EVENT' && n.refDate ? n.refDate : undefined,
});

const PAGE_SIZE = 50;

/**
 * The bell: the list, the unread count, marking read. New notifications arrive over STOMP
 * (useNotificationSocket), which only tells these queries to fetch again.
 */
export const notificationApi = baseApi.injectEndpoints({
  endpoints: build => ({
    getNotifications: build.query<NotificationPage, void>({
      query: () => ({ url: '/api/notifications', params: { page: 0, size: PAGE_SIZE } }),
      transformResponse: (p: PageDto): NotificationPage => ({
        items: p.items.map(toNotification),
        hasNext: p.hasNext,
        unreadCount: p.unreadCount,
      }),
      providesTags: ['Notifications'],
    }),
    getUnreadCount: build.query<number, void>({
      query: () => '/api/notifications/unread-count',
      transformResponse: (r: { count: number }) => r.count,
      providesTags: ['Notifications'],
    }),

    // Both marks update the screen at once and put it back if the server says no.
    markRead: build.mutation<void, string>({
      query: id => ({ url: `/api/notifications/${id}/read`, method: 'PUT' }),
      async onQueryStarted(id, { dispatch, getState, queryFulfilled }) {
        const list = notificationApi.endpoints.getNotifications.select()(getState() as never).data;
        const wasUnread = list?.items.some(n => n.id === id && !n.read) ?? true;
        const undo = [
          dispatch(
            notificationApi.util.updateQueryData('getNotifications', undefined, draft => {
              const n = draft.items.find(x => x.id === id);
              if (n && !n.read) {
                n.read = true;
                draft.unreadCount = Math.max(0, draft.unreadCount - 1);
              }
            }),
          ),
          dispatch(
            notificationApi.util.updateQueryData('getUnreadCount', undefined, c => (wasUnread ? Math.max(0, c - 1) : c)),
          ),
        ];
        try {
          await queryFulfilled;
        } catch {
          undo.forEach(p => p.undo());
        }
      },
    }),
    markAllRead: build.mutation<void, void>({
      query: () => ({ url: '/api/notifications/read-all', method: 'PUT' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const undo = [
          dispatch(
            notificationApi.util.updateQueryData('getNotifications', undefined, draft => {
              draft.items.forEach(n => {
                n.read = true;
              });
              draft.unreadCount = 0;
            }),
          ),
          dispatch(notificationApi.util.updateQueryData('getUnreadCount', undefined, () => 0)),
        ];
        try {
          await queryFulfilled;
        } catch {
          undo.forEach(p => p.undo());
        }
      },
    }),
  }),
});

export const { useGetNotificationsQuery, useGetUnreadCountQuery, useMarkReadMutation, useMarkAllReadMutation } =
  notificationApi;
