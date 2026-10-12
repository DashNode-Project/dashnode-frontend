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
