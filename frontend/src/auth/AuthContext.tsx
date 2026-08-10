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
const LAST_ACTIVITY_KEY = 'gabarita_last_activity_at';
const MAX_INACTIVITY_MS = 12 * 60 * 60 * 1_000;

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
    let loggingOutForInactivity = false;
    const lastActivityAt = () => Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0);
    const isInactive = () => {
      const last = lastActivityAt();
      return last > 0 && Date.now() - last >= MAX_INACTIVITY_MS;
    };
    const endForInactivity = async () => {
      if (loggingOutForInactivity) return;
      loggingOutForInactivity = true;
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
          await globalThis.fetch(`${apiBase}/study/sessions/expire-inactive`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${data.session.access_token}` },
          });
        }
      } catch {
        // A limpeza local continua necessária mesmo se o servidor estiver indisponível.
      }
      await supabase.auth.signOut({ scope: 'local' });
      clearApplicationStorage(); localStorage.removeItem(OWNER_KEY);
      if (active) { setSession(null); setLoading(false); }
    };
    const registerActivity = () => {
      if (isInactive()) { void endForInactivity(); return; }
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    };
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session && isInactive()) { void endForInactivity(); return; }
      if (data.session?.user.id) isolateUserStorage(data.session.user.id);
      if (data.session && !lastActivityAt()) localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      setSession(data.session); setLoading(false);
    }).catch(() => { if (active) setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (nextSession && isInactive()) { void endForInactivity(); return; }
      if (nextSession?.user.id) isolateUserStorage(nextSession.user.id);
      if (nextSession && (event === 'SIGNED_IN' || !lastActivityAt())) localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      setSession(nextSession); setLoading(false);
    });
    const unauthorized = () => void supabase.auth.refreshSession().then(({ data, error }) => {
      if (error || !data.session) void supabase.auth.signOut({ scope: 'local' });
    });
    window.addEventListener('gabarita:unauthorized', unauthorized);
    const activityEvents: Array<keyof WindowEventMap> = ['pointerdown','keydown','touchstart','scroll'];
    activityEvents.forEach(event => window.addEventListener(event, registerActivity, { passive: true }));
    const visibilityChange = () => { if (document.visibilityState === 'visible' && isInactive()) void endForInactivity(); };
    document.addEventListener('visibilitychange', visibilityChange);
    const inactivityCheck = window.setInterval(() => { if (isInactive()) void endForInactivity(); }, 60_000);
    return () => {
      active=false; listener.subscription.unsubscribe(); window.removeEventListener('gabarita:unauthorized', unauthorized);
      activityEvents.forEach(event => window.removeEventListener(event, registerActivity));
      document.removeEventListener('visibilitychange', visibilityChange); window.clearInterval(inactivityCheck);
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
