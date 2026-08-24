import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabase';
import { getValidSession } from './session';
import {
  AUTH_INACTIVITY_TIMEOUT_MS,
  AUTH_LAST_ACTIVITY_KEY,
  AUTH_LOGOUT_REASON_KEY,
  OWNER_KEY,
  clearApplicationStorage,
  clearPersistedAuth,
  isAuthInactive,
  recordAuthActivity,
} from './inactivity';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_RESTORE_TIMEOUT_MS = 8_000;

type LogoutReason = 'inactivity' | 'restore-timeout';

const restoreSessionWithinLimit = async () => {
  let timeout = 0;
  try {
    return await Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) => {
        timeout = window.setTimeout(
          () => reject(new Error('auth-restore-timeout')),
          AUTH_RESTORE_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    window.clearTimeout(timeout);
  }
};

const isolateUserStorage = (userId: string) => {
  const previousOwner = localStorage.getItem(OWNER_KEY);
  if (previousOwner !== userId) clearApplicationStorage();
  localStorage.setItem(OWNER_KEY, userId);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const finishLocalSignOut = (reason?: LogoutReason) => {
    setSession(null);
    clearApplicationStorage();
    clearPersistedAuth();
    localStorage.removeItem(OWNER_KEY);
    if (reason) sessionStorage.setItem(AUTH_LOGOUT_REASON_KEY, reason);
  };

  const signOutLocally = async (reason?: LogoutReason) => {
    // Start revoking the refresh token, but update the UI immediately. The
    // zero-delay cleanup lets Supabase read the current token first while still
    // guaranteeing that a slow/offline endpoint cannot preserve it locally.
    const signOutRequest = supabase.auth.signOut({ scope: 'local' });
    setSession(null);
    clearApplicationStorage();
    localStorage.removeItem(OWNER_KEY);
    if (reason) sessionStorage.setItem(AUTH_LOGOUT_REASON_KEY, reason);
    window.setTimeout(clearPersistedAuth, 0);
    await signOutRequest.catch(() => undefined);
    clearPersistedAuth();
  };

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    let active = true;
    void (async () => {
      let restored: Awaited<ReturnType<typeof supabase.auth.getSession>>;
      try {
        restored = await restoreSessionWithinLimit();
      } catch {
        if (!active) return;
        finishLocalSignOut('restore-timeout');
        setLoading(false);
        return;
      }
      if (!active) return;
      if (restored.error) { setLoading(false); return; }

      const persistedSession = restored.data.session;
      if (persistedSession?.user.id) isolateUserStorage(persistedSession.user.id);
      if (persistedSession) recordAuthActivity();
      setSession(persistedSession);
      setLoading(false);
      if (!persistedSession) return;

      try {
        const nextSession = await getValidSession();
        if (active) setSession(nextSession);
      } catch {
        // Temporary refresh failures do not discard a session that was
        // already restored. The next API request or reconnect will retry it.
      }
    })();
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT') {
        clearApplicationStorage();
        clearPersistedAuth();
        localStorage.removeItem(OWNER_KEY);
      }
      if (nextSession?.user.id) {
        isolateUserStorage(nextSession.user.id);
        recordAuthActivity();
      }
      setSession(nextSession); setLoading(false);
    });
    const refreshAfterReturning = () => {
      if (document.visibilityState !== 'visible') return;
      if (isAuthInactive()) {
        void signOutLocally('inactivity');
        return;
      }
      recordAuthActivity();
      void getValidSession()
        .then(nextSession => { if (active) setSession(nextSession); })
        .catch(() => {});
    };
    window.addEventListener('focus', refreshAfterReturning);
    window.addEventListener('online', refreshAfterReturning);
    document.addEventListener('visibilitychange', refreshAfterReturning);
    return () => {
      active=false; listener.subscription.unsubscribe();
      window.removeEventListener('focus', refreshAfterReturning);
      window.removeEventListener('online', refreshAfterReturning);
      document.removeEventListener('visibilitychange', refreshAfterReturning);
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    // A visible page counts as presence even while the user is reading without
    // touching the screen. Hidden/closed tabs retain their last presence time.
    const recordPresence = () => recordAuthActivity();
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') recordPresence();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === AUTH_LAST_ACTIVITY_KEY && event.newValue === null) {
        setSession(null);
      }
    };

    recordPresence();
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === 'visible') recordPresence();
      else if (isAuthInactive()) void signOutLocally('inactivity');
    }, Math.min(60_000, Math.max(5_000, AUTH_INACTIVITY_TIMEOUT_MS / 4)));
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [session]);

  const value = useMemo<AuthContextValue>(() => ({
    session, user: session?.user || null, loading, configured: isSupabaseConfigured,
    signOut: () => signOutLocally(),
  }), [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return value;
};
