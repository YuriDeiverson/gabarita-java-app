type SecureLogLevel = 'warn' | 'error';

const errorCategory = (error: unknown) => {
  if (!error || typeof error !== 'object') return typeof error;
  const candidate = error as { name?: unknown; status?: unknown; retryable?: unknown };
  const name = typeof candidate.name === 'string' ? candidate.name : 'UnknownError';
  const status = typeof candidate.status === 'number' ? candidate.status : 0;
  const retryable = candidate.retryable === true ? 'retryable' : 'terminal';
  return `${name}|${status}|${retryable}`;
};

const sha256 = async (value: string) => {
  if (!globalThis.crypto?.subtle) return null;
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};

const emitSecureLog = async (
  level: SecureLogLevel,
  context: string,
  error?: unknown,
) => {
  // The fingerprint deliberately excludes message, stack, request, payload,
  // session, token, user identifiers and all other runtime values.
  const fingerprint = await sha256(`gabarita-client-v1|${context}|${errorCategory(error)}`);
  if (!fingerprint) return;
  const output = `[falha:${fingerprint.slice(0, 16)}]`;
  if (level === 'error') console.error(output);
  else console.warn(output);
};

export const secureWarn = (context: string, error?: unknown) => {
  void emitSecureLog('warn', context, error);
};

export const secureError = (context: string, error?: unknown) => {
  void emitSecureLog('error', context, error);
};
