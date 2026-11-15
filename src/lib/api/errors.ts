/** Error contract of the backend: {"error": {"code", "message", "fields"}}. */
export interface ApiErrorBody {
  code: string;
  message: string;
  fields: Record<string, string>;
}

/** The server answered with a non-2xx status. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.fields = body.fields;
  }
}

/** The request never produced a usable answer (offline, DNS, timeout, aborted, bad payload). */
export class NetworkError extends Error {
  constructor(message = 'Network failure') {
    super(message);
    this.name = 'NetworkError';
  }
}

/** The client aborted the request (timeout or user cancellation). */
export class RequestTimeoutError extends NetworkError {
  constructor(message = 'Request timeout') {
    super(message);
    this.name = 'RequestTimeoutError';
  }
}

/** True when the failure is technical (service down, timeout, 5xx, unreadable answer). */
export function isTechnicalFailure(error: unknown): boolean {
  if (error instanceof RequestTimeoutError) return true;
  if (error instanceof NetworkError) return true;
  if (error instanceof ApiError) return error.status >= 500 || error.code === 'UNEXPECTED_RESPONSE';
  return true;
}

export function parseErrorBody(payload: unknown): ApiErrorBody | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const error = (payload as { error?: unknown }).error;
  if (typeof error !== 'object' || error === null) return null;
  const { code, message, fields } = error as Record<string, unknown>;
  if (typeof code !== 'string' || typeof message !== 'string') return null;
  const safeFields: Record<string, string> = {};
  if (typeof fields === 'object' && fields !== null) {
    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === 'string') safeFields[key] = value;
    }
  }
  return { code, message, fields: safeFields };
}
