import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabase';
import { getValidSession } from './session';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const OWNER_KEY = 'gabarita_local_owner';

const clearApplicationStorage = () => {
  Object.keys(localStorage).forEach(key => {
    if (!key.startsWith('sb-') && key !== OWNER_KEY) localStorage.removeItem(key);
  });
};

const isolateUserStorage = (userId: string) => {
  const previousOwner = localStorage.getItem(OWNER_KEY);
  if (previousOwner !== userId) clearApplicationStorage();
  localStorage.setItem(OWNER_KEY, userId);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    let active = true;
    void (async () => {
      // Restore the persisted session first so a slow mobile reconnection does
      // not unnecessarily hold the entire application on the login screen.
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) { setLoading(false); return; }

      const persistedSession = data.session;
      if (persistedSession?.user.id) isolateUserStorage(persistedSession.user.id);
      setSession(persistedSession);
      setLoading(false);
      if (!persistedSession) return;

      try {
        const nextSession = await getValidSession();
        if (active) setSession(nextSession);
      } catch {
        // A temporary refresh failure must not discard a known session. API
        // requests will retry renewal when connectivity is available again.
      }
    })();
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT') {
        clearApplicationStorage();
        localStorage.removeItem(OWNER_KEY);
      }
      if (nextSession?.user.id) isolateUserStorage(nextSession.user.id);
      setSession(nextSession); setLoading(false);
    });
    const refreshAfterReturning = () => {
      if (document.visibilityState !== 'visible') return;
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

  const value = useMemo<AuthContextValue>(() => ({
    session, user: session?.user || null, loading, configured: isSupabaseConfigured,
    signOut: async () => {
      await supabase.auth.signOut();
      clearApplicationStorage(); localStorage.removeItem(OWNER_KEY); setSession(null);
    },
  }), [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return value;
};
