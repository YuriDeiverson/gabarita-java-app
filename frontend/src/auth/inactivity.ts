const DEFAULT_INACTIVITY_MINUTES = 30;
const MIN_INACTIVITY_MINUTES = 5;
const MAX_INACTIVITY_MINUTES = 24 * 60;

export const AUTH_LAST_ACTIVITY_KEY = 'gabarita_auth_last_activity';
export const AUTH_LOGOUT_REASON_KEY = 'gabarita_auth_logout_reason';
export const OWNER_KEY = 'gabarita_local_owner';

const configuredMinutes = Number(import.meta.env.VITE_AUTH_INACTIVITY_MINUTES);
export const AUTH_INACTIVITY_MINUTES = Number.isFinite(configuredMinutes)
  ? Math.min(MAX_INACTIVITY_MINUTES, Math.max(MIN_INACTIVITY_MINUTES, configuredMinutes))
  : DEFAULT_INACTIVITY_MINUTES;
export const AUTH_INACTIVITY_TIMEOUT_MS = AUTH_INACTIVITY_MINUTES * 60_000;

const supabaseAuthStorageKeys = () =>
  Object.keys(localStorage).filter(
    key => key.startsWith('sb-') && key.includes('-auth-token'),
  );

export const clearApplicationStorage = () => {
  Object.keys(localStorage).forEach(key => {
    if (!key.startsWith('sb-') && key !== OWNER_KEY) localStorage.removeItem(key);
  });
};

export const clearPersistedAuth = () => {
  supabaseAuthStorageKeys().forEach(key => localStorage.removeItem(key));
  localStorage.removeItem(AUTH_LAST_ACTIVITY_KEY);
};

export const recordAuthActivity = (now = Date.now()) => {
  localStorage.setItem(AUTH_LAST_ACTIVITY_KEY, String(now));
};

export const isAuthInactive = (now = Date.now()) => {
  const lastActivity = Number(localStorage.getItem(AUTH_LAST_ACTIVITY_KEY));
  return (
    !Number.isFinite(lastActivity) ||
    lastActivity <= 0 ||
    lastActivity > now + 60_000 ||
    now - lastActivity >= AUTH_INACTIVITY_TIMEOUT_MS
  );
};

/**
 * Runs before createClient(). Existing installs without an activity marker are
 * deliberately expired once, avoiding a network refresh of legacy sessions.
 */
export const expireInactiveSessionBeforeClientCreation = () => {
  const callbackParameters = new URLSearchParams(window.location.search);
  const callbackHash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const isAuthCallback =
    callbackParameters.has('code') ||
    callbackParameters.has('error_description') ||
    callbackHash.has('access_token') ||
    callbackHash.has('error_description');
  if (isAuthCallback) return false;

  if (supabaseAuthStorageKeys().length === 0) {
    localStorage.removeItem(AUTH_LAST_ACTIVITY_KEY);
    return false;
  }
  if (!isAuthInactive()) return false;

  clearPersistedAuth();
  clearApplicationStorage();
  localStorage.removeItem(OWNER_KEY);
  sessionStorage.setItem(AUTH_LOGOUT_REASON_KEY, 'inactivity');
  return true;
};
