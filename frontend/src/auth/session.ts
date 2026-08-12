import {
  isAuthRefreshDiscardedError,
  isAuthRetryableFetchError,
  type AuthError,
  type Session,
} from '@supabase/supabase-js';
import { supabase } from './supabase';

const ACCESS_TOKEN_REFRESH_MARGIN_MS = 60_000;
const REFRESH_RETRY_DELAYS_MS = [250, 750];

let refreshInFlight: Promise<Session | null> | null = null;
let localSignOutInFlight: Promise<void> | null = null;

const discardInvalidSession = async () => {
  if (!localSignOutInFlight) {
    localSignOutInFlight = supabase.auth
      .signOut({ scope: 'local' })
      .then(() => undefined)
      .finally(() => {
        localSignOutInFlight = null;
      });
  }
  await localSignOutInFlight;
};

const isTemporaryRefreshFailure = (error: AuthError) =>
  isAuthRetryableFetchError(error) || isAuthRefreshDiscardedError(error);

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

const refreshPersistedSession = async (): Promise<Session | null> => {
  for (let attempt = 0; ; attempt += 1) {
    const { data, error } = await supabase.auth.refreshSession();

    if (!error) return data.session;
    if (!isTemporaryRefreshFailure(error)) {
      await discardInvalidSession();
      return null;
    }
    if (attempt >= REFRESH_RETRY_DELAYS_MS.length) throw error;

    // Mobile browsers often resume before the network interface is ready.
    // A short bounded retry avoids treating that transition as a logout.
    await wait(REFRESH_RETRY_DELAYS_MS[attempt]);
  }
};

const renewSession = async (rejectedAccessToken?: string): Promise<Session | null> => {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      if (rejectedAccessToken) {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          if (!isTemporaryRefreshFailure(error)) {
            await discardInvalidSession();
            return null;
          }
          throw error;
        }
        if (data.session?.access_token !== rejectedAccessToken) {
          return data.session;
        }
      }

      const refreshedSession = await refreshPersistedSession();
      if (!refreshedSession) {
        await discardInvalidSession();
        return null;
      }
      return refreshedSession;
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
};

interface ValidSessionOptions {
  forceRefresh?: boolean;
  rejectedAccessToken?: string;
}

/**
 * Returns a session whose access token can be sent to the API.
 *
 * Supabase persists both tokens. This layer adds an explicit preflight check
 * and shares refresh operations between all requests made during page load.
 */
export const getValidSession = async ({
  forceRefresh = false,
  rejectedAccessToken,
}: ValidSessionOptions = {}): Promise<Session | null> => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    if (!isTemporaryRefreshFailure(error)) {
      await discardInvalidSession();
      return null;
    }
    throw error;
  }

  const session = data.session;
  if (!session) return null;

  // Another request may already have renewed the exact token rejected by the
  // backend. In that case the current token is ready and must not be rotated again.
  if (
    forceRefresh &&
    rejectedAccessToken &&
    session.access_token !== rejectedAccessToken
  ) {
    return session;
  }

  const expiresAtMs = (session.expires_at ?? 0) * 1_000;
  const expiresSoon = !expiresAtMs || expiresAtMs <= Date.now() + ACCESS_TOKEN_REFRESH_MARGIN_MS;

  return forceRefresh || expiresSoon ? renewSession(rejectedAccessToken) : session;
};
