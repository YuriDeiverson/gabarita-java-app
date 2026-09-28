import { auth } from './firebase';
import type { User } from 'firebase/auth';

const ACCESS_TOKEN_REFRESH_MARGIN_MS = 60_000;

let refreshInFlight: Promise<string | null> | null = null;

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

const renewToken = async (rejectedAccessToken?: string): Promise<string | null> => {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return null;

      try {
        const token = await currentUser.getIdToken(true);
        return token;
      } catch (error) {
        console.error('Failed to refresh token:', error);
        await auth.signOut();
        return null;
      }
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

interface Session {
  user: User;
  access_token: string;
}

/**
 * Returns a session whose access token can be sent to the API.
 *
 * Firebase automatically handles token refresh. This layer adds an explicit
 * preflight check and shares refresh operations between all requests made
 * during page load.
 */
export const getValidSession = async ({
  forceRefresh = false,
  rejectedAccessToken,
}: ValidSessionOptions = {}): Promise<Session | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  const token = await currentUser.getIdToken();
  if (!token) return null;

  // Another request may already have renewed the exact token rejected by the
  // backend. In that case the current token is ready and must not be rotated again.
  if (
    forceRefresh &&
    rejectedAccessToken &&
    token !== rejectedAccessToken
  ) {
    return { user: currentUser, access_token: token };
  }

  // Firebase tokens are typically valid for 1 hour. Force refresh if requested
  // or if the token was rejected by the backend.
  if (forceRefresh || rejectedAccessToken) {
    const newToken = await renewToken(rejectedAccessToken);
    if (!newToken) return null;
    return { user: currentUser, access_token: newToken };
  }

  return { user: currentUser, access_token: token };
};
