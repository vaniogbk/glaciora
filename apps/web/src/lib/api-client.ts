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
  const res = await fetch(path, { ...init, headers, body, credentials: 'same-origin', cache: 'no-store' });
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
