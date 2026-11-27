import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { mockNotifications } from '../../mocks/data';
import { AppNotification, FamilySummary, UserProfile } from '../../shared/types/domain';
import { setSoundEnabled } from '../../shared/sound/soundEngine';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../../features/auth/authSlice';
import { useGetFamiliesQuery } from '../../features/family/api/familyApi';

/**
 * What every screen needs about the session. Since Phase 7a the user comes from the auth slice and the
 * families from the API; notifications are still sample data until Phase 7d.
 */
interface SessionValue {
  user: UserProfile | null;
  families: FamilySummary[];
  familiesLoading: boolean;
  activeFamily: FamilySummary | null;
  notifications: AppNotification[];
  unreadCount: number;
  signOut: () => void;
  setActiveFamily: (id: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  /** UI sounds (mõ, chuông, tiếng xé giấy). */
  soundOn: boolean;
  toggleSound: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, status } = useAppSelector(s => s.auth);
  const { data: families = [], isLoading: familiesLoading } = useGetFamiliesQuery(undefined, {
    skip: status !== 'signedIn',
  });
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [soundOn, setSoundOn] = useState(true);
  const toggleSound = useCallback(() => setSoundOn(on => !on), []);
  useEffect(() => setSoundEnabled(soundOn), [soundOn]);

  const signOut = useCallback(() => {
    setActiveFamilyId(null);
    dispatch(logout());
  }, [dispatch]);
  const markRead = useCallback(
    (id: string) => setNotifications(list => list.map(n => (n.id === id ? { ...n, read: true } : n))),
    [],
  );
  const markAllRead = useCallback(() => setNotifications(list => list.map(n => ({ ...n, read: true }))), []);

  // the chosen family, or the first one; a family that disappeared (left, dissolved) falls back to the first
  const activeFamily = families.find(f => f.id === activeFamilyId) ?? families[0] ?? null;

  const value = useMemo<SessionValue>(
    () => ({
      user,
      families,
      familiesLoading,
      activeFamily,
      notifications,
      unreadCount: notifications.filter(n => !n.read).length,
      signOut,
      setActiveFamily: setActiveFamilyId,
      markRead,
      markAllRead,
      soundOn,
      toggleSound,
    }),
    [user, families, familiesLoading, activeFamily, notifications, signOut, markRead, markAllRead, soundOn, toggleSound],
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
