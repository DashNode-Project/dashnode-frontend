import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, NetworkError } from './errors';
import { apiFormRequest, apiRequest } from './client';

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts JSON with credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );
    const result = await apiRequest<{ ok: boolean }>('/auth/ping', {
      method: 'POST',
      body: { a: 1 },
    });
    expect(result.ok).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/ping'),
      expect.objectContaining({ credentials: 'include', method: 'POST' }),
    );
  });

  it('sends multipart form data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ saved: true }), { status: 200 })),
    );
    const formData = new FormData();
    formData.set('name', 'Test');
    const result = await apiFormRequest<{ saved: boolean }>('/auth/profile', {
      formData,
    });
    expect(result.saved).toBe(true);
    const init = vi.mocked(fetch).mock.calls[0]?.[1];
    expect(init?.body).toBeInstanceOf(FormData);
  });

  it('throws NetworkError when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    await expect(apiRequest('/auth/session')).rejects.toBeInstanceOf(NetworkError);
  });

  it('throws when success response has no JSON body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 200 })),
    );
    await expect(apiRequest('/projects')).rejects.toBeInstanceOf(ApiError);
  });

  it('supports DELETE requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ message: 'ok' }), { status: 200 })),
    );
    await apiRequest('/projects/p1', { method: 'DELETE' });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/p1'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('posts multipart with POST and handles empty error bodies', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 502, statusText: 'Bad Gateway' })),
    );
    const formData = new FormData();
    await expect(
      apiFormRequest('/auth/profile', { method: 'POST', formData }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('throws ApiError when multipart upload fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              error: { code: 'AVATAR_INVALID', message: 'invalid', fields: {} },
            }),
            { status: 400 },
          ),
      ),
    );
    const formData = new FormData();
    await expect(apiFormRequest('/auth/profile', { formData })).rejects.toBeInstanceOf(ApiError);
  });
});
