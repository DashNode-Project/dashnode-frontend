import { describe, expect, it } from 'vitest';
import { apiRequest } from './client';
import { ApiError, NetworkError, isTechnicalFailure, parseErrorBody } from './errors';
import { apiError, mockFetch, ok } from '@/test/fetchMock';

describe('apiRequest', () => {
  it('sends credentials, JSON and never caches', async () => {
    const calls = mockFetch(() => ok({ hello: 'world' }));
    const result = await apiRequest<{ hello: string }>('/ping', { method: 'POST', body: { a: 1 } });
    expect(result).toEqual({ hello: 'world' });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      url: '/api/v1/ping',
      method: 'POST',
      body: { a: 1 },
      credentials: 'include',
    });
    expect(calls[0]?.headers['Content-Type']).toBe('application/json');
  });

  it('does not add a content type to bodiless requests', async () => {
    const calls = mockFetch(() => ok({}));
    await apiRequest('/ping');
    expect(calls[0]?.headers['Content-Type']).toBeUndefined();
  });

  it('turns an error contract into ApiError', async () => {
    mockFetch(() => apiError(409, 'EMAIL_ALREADY_REGISTERED', 'Mensaje', { email: 'x' }));
    const error = await apiRequest('/x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 409,
      code: 'EMAIL_ALREADY_REGISTERED',
      message: 'Mensaje',
      fields: { email: 'x' },
    });
  });

  it('maps an unreadable error answer to UNEXPECTED_RESPONSE', async () => {
    mockFetch(() => ({ status: 502 }));
    const error = await apiRequest('/x').catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 502, code: 'UNEXPECTED_RESPONSE' });
    expect(isTechnicalFailure(error)).toBe(true);
  });

  it('rejects an empty success answer', async () => {
    mockFetch(() => ({ status: 200 }));
    await expect(apiRequest('/x')).rejects.toMatchObject({ code: 'UNEXPECTED_RESPONSE' });
  });

  it('turns transport failures into NetworkError', async () => {
    mockFetch(() => new TypeError('Failed to fetch'));
    await expect(apiRequest('/x')).rejects.toBeInstanceOf(NetworkError);
  });
});

describe('error helpers', () => {
  it('classifies failures', () => {
    expect(isTechnicalFailure(new NetworkError())).toBe(true);
    expect(isTechnicalFailure(new ApiError(500, parseErrorBody(body(500))!))).toBe(true);
    expect(isTechnicalFailure(new ApiError(401, parseErrorBody(body(401))!))).toBe(false);
    expect(isTechnicalFailure(new Error('boom'))).toBe(true);
  });

  it('ignores malformed bodies and non-string fields', () => {
    expect(parseErrorBody(null)).toBeNull();
    expect(parseErrorBody({ error: 'x' })).toBeNull();
    expect(parseErrorBody({ error: { code: 1, message: 'm' } })).toBeNull();
    expect(
      parseErrorBody({ error: { code: 'C', message: 'm', fields: { a: 'b', c: 3 } } }),
    ).toEqual({ code: 'C', message: 'm', fields: { a: 'b' } });
    expect(parseErrorBody({ error: { code: 'C', message: 'm' } })).toEqual({
      code: 'C',
      message: 'm',
      fields: {},
    });
  });
});

function body(status: number) {
  return { error: { code: `E${status}`, message: 'm', fields: {} } };
}
