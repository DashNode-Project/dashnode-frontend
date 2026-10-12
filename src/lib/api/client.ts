import { env } from '@/config/env';
import { ApiError, NetworkError, parseErrorBody } from './errors';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Minimal fetch wrapper. The session lives in an HttpOnly cookie managed by the browser, so the
 * only thing this client does is send credentials (`include`) and never touches any token.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.requestTimeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      method,
      headers,
      credentials: 'include',
      cache: 'no-store',
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new NetworkError();
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onAbort);
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const parsed = parseErrorBody(payload);
    throw new ApiError(
      response.status,
      parsed ?? { code: 'UNEXPECTED_RESPONSE', message: '', fields: {} },
    );
  }
  if (payload === null) {
    throw new ApiError(response.status, { code: 'UNEXPECTED_RESPONSE', message: '', fields: {} });
  }
  return payload as T;
}
