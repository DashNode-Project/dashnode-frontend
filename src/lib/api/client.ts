import { env } from '@/config/env';
import { ApiError, NetworkError, parseErrorBody } from './errors';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
}

interface FormRequestOptions {
  method?: 'PATCH' | 'POST';
  formData: FormData;
  signal?: AbortSignal;
  timeoutMs?: number;
}

/**
 * Minimal fetch wrapper. The session lives in an HttpOnly cookie managed by the browser, so the
 * only thing this client does is send credentials (`include`) and never touches any token.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, timeoutMs = env.requestTimeoutMs } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
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

/** Multipart requests (e.g. profile avatar upload). */
export async function apiFormRequest<T>(path: string, options: FormRequestOptions): Promise<T> {
  const { method = 'PATCH', formData, signal, timeoutMs = env.requestTimeoutMs } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      method,
      headers: { Accept: 'application/json' },
      credentials: 'include',
      cache: 'no-store',
      body: formData,
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
