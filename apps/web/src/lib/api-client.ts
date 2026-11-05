'use client';

export interface ApiErrorBody {
  code: string;
  message: string;
  fields?: { path: string; message: string }[];
  details?: unknown;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorBody,
  ) {
    super(body.message);
  }
}

let refreshing: Promise<boolean> | null = null;

/** Délai maximal d'un appel : plus long pour l'envoi de fichiers (preuve de virement sur réseau mobile lent). */
const TIMEOUT_MS = 20_000;
const UPLOAD_TIMEOUT_MS = 120_000;
const TIMEOUT_ERROR: ApiErrorBody = { code: 'TIMEOUT', message: 'Le serveur met trop de temps à répondre. Vérifiez votre connexion et réessayez.' };

function timeoutSignal(ms: number): AbortSignal | undefined {
  return typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(ms) : undefined;
}

async function refreshSession(): Promise<boolean> {
  refreshing ??= fetch('/api/auth/refresh', { method: 'POST', headers: { 'x-glaciora-csrf': '1' }, credentials: 'same-origin' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      setTimeout(() => (refreshing = null), 0);
    });
  return refreshing;
}

/**
 * Appel API depuis le navigateur : même origine (proxy Next → API), cookies httpOnly,
 * en-tête anti-CSRF, renouvellement transparent de la session sur 401.
 */
export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('x-glaciora-csrf', '1');
  headers.set('accept', 'application/json');
  let body = init.body;
  if (init.json !== undefined) {
    headers.set('content-type', 'application/json');
    body = JSON.stringify(init.json);
  }
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers, body, credentials: 'same-origin', cache: 'no-store', signal: init.signal ?? timeoutSignal(body instanceof FormData ? UPLOAD_TIMEOUT_MS : TIMEOUT_MS) });
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) throw new ApiError(0, TIMEOUT_ERROR);
    throw new ApiError(0, { code: 'NETWORK', message: 'Connexion impossible. Vérifiez votre réseau et réessayez.' });
  }
  if (res.status === 401 && retry && !path.startsWith('/api/auth/')) {
    if (await refreshSession()) return api<T>(path, init, false);
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => ({}))) as { error?: ApiErrorBody } & T;
  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? { code: 'HTTP_' + res.status, message: 'Une erreur est survenue, réessayez.' });
  }
  return data;
}

export function fieldErrors(err: unknown): Record<string, string> {
  if (!(err instanceof ApiError) || !err.body.fields) return {};
  return Object.fromEntries(err.body.fields.map((f) => [f.path, f.message]));
}
