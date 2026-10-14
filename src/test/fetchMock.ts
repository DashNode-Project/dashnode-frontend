import { vi } from 'vitest';

export interface RecordedCall {
  url: string;
  method: string;
  body: unknown;
  credentials: RequestCredentials | undefined;
  headers: Record<string, string>;
}

export type MockReply = { status: number; body?: unknown } | Error;

type Handler = (call: RecordedCall) => MockReply | Promise<MockReply>;

export function apiError(
  status: number,
  code: string,
  message: string,
  fields: Record<string, string> = {},
): MockReply {
  return { status, body: { error: { code, message, fields } } };
}

export function ok(body: unknown, status = 200): MockReply {
  return { status, body };
}

/** Replaces `fetch` with a handler and returns the list of recorded calls. */
export function mockFetch(handler: Handler): RecordedCall[] {
  const calls: RecordedCall[] = [];
  const fake = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: RecordedCall = {
      url: String(input),
      method: init?.method ?? 'GET',
      body: typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined,
      credentials: init?.credentials,
      headers: (init?.headers ?? {}) as Record<string, string>,
    };
    calls.push(call);
    const reply = await handler(call);
    if (reply instanceof Error) throw reply;
    return new Response(reply.body === undefined ? null : JSON.stringify(reply.body), {
      status: reply.status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fake);
  return calls;
}

type Route = MockReply | ((call: RecordedCall) => MockReply | Promise<MockReply>);

const ENDPOINTS = {
  session: { method: 'GET', suffix: '/auth/session' },
  login: { method: 'POST', suffix: '/auth/login' },
  logout: { method: 'POST', suffix: '/auth/logout' },
  register: { method: 'POST', suffix: '/auth/register' },
  passwordResetRequest: { method: 'POST', suffix: '/auth/password-reset/request' },
  passwordResetConfirm: { method: 'POST', suffix: '/auth/password-reset/confirm' },
  adminUsers: { method: 'GET', suffix: '/auth/admin/users' },
  adminPasswordReset: { method: 'POST', suffix: '/auth/admin/users/' },
} as const;

export type Endpoint = keyof typeof ENDPOINTS;

/**
 * Route-based API double. Unlisted endpoints answer 404 except `session`, which defaults to
 * "no session" because every protected or guest screen asks the server about it.
 */
export function mockApi(routes: Partial<Record<Endpoint, Route>>): RecordedCall[] {
  const withDefaults: Partial<Record<Endpoint, Route>> = {
    session: apiError(401, 'NOT_AUTHENTICATED', 'Debe iniciar sesión para continuar.'),
    ...routes,
  };
  return mockFetch((call) => {
    for (const [name, endpoint] of Object.entries(ENDPOINTS)) {
      const pathMatch =
        call.url.endsWith(endpoint.suffix) ||
        (endpoint.suffix.endsWith('/') && call.url.includes(endpoint.suffix));
      if (call.method === endpoint.method && pathMatch) {
        const route = withDefaults[name as Endpoint];
        if (route === undefined) break;
        return typeof route === 'function' ? route(call) : route;
      }
    }
    if (call.method === 'GET' && call.url.endsWith('/projects')) {
      return ok([]);
    }
    if (call.method === 'GET' && call.url.includes('/availability/meetings')) {
      return ok([]);
    }
    return apiError(404, 'NOT_FOUND', 'Not found');
  });
}

/** Calls made to one endpoint. */
export function callsTo(calls: RecordedCall[], endpoint: Endpoint): RecordedCall[] {
  const { method, suffix } = ENDPOINTS[endpoint];
  return calls.filter((call) => call.method === method && call.url.endsWith(suffix));
}
