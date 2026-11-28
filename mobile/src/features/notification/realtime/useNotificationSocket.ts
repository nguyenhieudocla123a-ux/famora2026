import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Client } from '@stomp/stompjs';
import { WS_URL } from '../../../shared/api/config';
import { apiClient } from '../../../shared/api/client';
import { baseApi } from '../../../shared/api/baseApi';
import { playSound } from '../../../shared/sound/soundEngine';
import { useAppDispatch } from '../../../app/store';

/** The one queue the server lets a user subscribe to (see StompAuthInterceptor). */
export const NOTIFICATION_QUEUE = '/user/queue/notifications';

/**
 * While signed in, keeps a STOMP connection to /ws so a new notification shows up at once:
 * - CONNECT carries a fresh access token (the server checks it only then);
 * - a dropped connection retries every 5 s, each time with a fresh token;
 * - a message only tells the notification queries to fetch again (the REST list stays the one truth)
 *   and rings the bell;
 * - coming back to the app refetches, in case something arrived while the socket was asleep.
 */
export function useNotificationSocket(enabled: boolean) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const refresh = () => dispatch(baseApi.util.invalidateTags(['Notifications']));

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      // React Native's WebSocket drops the NULL that ends a text frame; these two settings work around it
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      beforeConnect: async () => {
        try {
          const token = await apiClient.freshAccessToken();
          client.connectHeaders = { Authorization: `Bearer ${token}` };
        } catch {
          // server unreachable: this attempt fails and the client tries again later
        }
      },
      onConnect: () => {
        client.subscribe(NOTIFICATION_QUEUE, () => {
          playSound('chuong', 0.6);
          refresh();
        });
        refresh(); // whatever arrived while disconnected
      },
    });
    client.activate();

    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refresh();
      }
    });

    return () => {
      sub.remove();
      client.deactivate();
    };
  }, [enabled, dispatch]);
}
