import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { mockFamilies, mockNotifications, mockUser } from '../../mocks/data';
import { AppNotification, FamilySummary, UserProfile } from '../../shared/types/domain';

/**
 * PHASE 2 — UI-only session. Phase 7 replaces it with the Redux auth slice
 * (tokens in react-native-keychain, refresh via Axios interceptor).
 */
interface SessionValue {
  user: UserProfile | null;
  families: FamilySummary[];
  activeFamily: FamilySummary | null;
  notifications: AppNotification[];
  unreadCount: number;
  signIn: () => void;
  signOut: () => void;
  setActiveFamily: (id: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeFamilyId, setActiveFamilyId] = useState<string>(mockFamilies[0].id);
  const [notifications, setNotifications] = useState(mockNotifications);

  const signIn = useCallback(() => setUser(mockUser), []);
  const signOut = useCallback(() => setUser(null), []);
  const markRead = useCallback(
    (id: string) => setNotifications(list => list.map(n => (n.id === id ? { ...n, read: true } : n))),
    [],
  );
  const markAllRead = useCallback(() => setNotifications(list => list.map(n => ({ ...n, read: true }))), []);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      families: mockFamilies,
      activeFamily: mockFamilies.find(f => f.id === activeFamilyId) ?? null,
      notifications,
      unreadCount: notifications.filter(n => !n.read).length,
      signIn,
      signOut,
      setActiveFamily: setActiveFamilyId,
      markRead,
      markAllRead,
    }),
    [user, activeFamilyId, notifications, signIn, signOut, markRead, markAllRead],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return ctx;
}
