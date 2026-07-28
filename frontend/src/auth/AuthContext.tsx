import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabase';

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
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session?.user.id) isolateUserStorage(data.session.user.id);
      setSession(data.session); setLoading(false);
    }).catch(() => { if (active) setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession?.user.id) isolateUserStorage(nextSession.user.id);
      setSession(nextSession); setLoading(false);
    });
    const unauthorized = () => void supabase.auth.refreshSession().then(({ data, error }) => {
      if (error || !data.session) void supabase.auth.signOut({ scope: 'local' });
    });
    window.addEventListener('gabarita:unauthorized', unauthorized);
    return () => { active=false;listener.subscription.unsubscribe();window.removeEventListener('gabarita:unauthorized', unauthorized); };
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
