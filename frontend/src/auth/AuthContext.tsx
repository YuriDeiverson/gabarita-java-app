import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { isFirebaseConfigured, auth } from './firebase';
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

interface Session {
  user: User;
  access_token: string;
  expires_in?: number;
}

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

const restoreSessionWithinLimit = async (): Promise<User | null> => {
  let timeout = 0;
  try {
    return await Promise.race([
      new Promise<User | null>((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe();
          resolve(user);
        });
      }),
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
    const signOutRequest = auth.signOut();
    setSession(null);
    clearApplicationStorage();
    localStorage.removeItem(OWNER_KEY);
    if (reason) sessionStorage.setItem(AUTH_LOGOUT_REASON_KEY, reason);
    window.setTimeout(clearPersistedAuth, 0);
    await signOutRequest.catch(() => undefined);
    clearPersistedAuth();
  };

  useEffect(() => {
    if (!isFirebaseConfigured) { setLoading(false); return; }
    let active = true;
    void (async () => {
      let restoredUser: User | null;
      try {
        restoredUser = await restoreSessionWithinLimit();
      } catch {
        if (!active) return;
        finishLocalSignOut('restore-timeout');
        setLoading(false);
        return;
      }
      if (!active) return;

      if (restoredUser?.uid) isolateUserStorage(restoredUser.uid);
      if (restoredUser) {
        recordAuthActivity();
        const token = await restoredUser.getIdToken();
        setSession({ user: restoredUser, access_token: token });
      }
      setLoading(false);
    })();

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!active) return;
      
      if (!user) {
        clearApplicationStorage();
        clearPersistedAuth();
        localStorage.removeItem(OWNER_KEY);
        setSession(null);
      } else {
        if (user.uid) {
          isolateUserStorage(user.uid);
          recordAuthActivity();
        }
        const token = await user.getIdToken();
        setSession({ user, access_token: token });
      }
      setLoading(false);
    });

    const refreshAfterReturning = () => {
      if (document.visibilityState !== 'visible') return;
      if (isAuthInactive()) {
        void signOutLocally('inactivity');
        return;
      }
      recordAuthActivity();
      const currentUser = auth.currentUser;
      if (currentUser) {
        currentUser.getIdToken().then(token => {
          if (active) setSession({ user: currentUser, access_token: token });
        }).catch(() => {});
      }
    };
    window.addEventListener('focus', refreshAfterReturning);
    window.addEventListener('online', refreshAfterReturning);
    document.addEventListener('visibilitychange', refreshAfterReturning);
    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener('focus', refreshAfterReturning);
      window.removeEventListener('online', refreshAfterReturning);
      document.removeEventListener('visibilitychange', refreshAfterReturning);
    };
  }, []);

  useEffect(() => {
    if (!session) return;

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
    session, user: session?.user || null, loading, configured: isFirebaseConfigured,
    signOut: () => signOutLocally(),
  }), [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return value;
};
