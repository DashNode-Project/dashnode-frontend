import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch, ok } from '@/test/fetchMock';
import { fetchCommandCatalog } from './api';

describe('commands api client', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches command catalog', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('GET');
      expect(call.url.endsWith('/commands')).toBe(true);
      return ok({
        catalog_version: 'cmd-v1.0.0',
        commands: [],
        projects: [],
      });
    });
    const res = await fetchCommandCatalog();
    expect(res.catalog_version).toBe('cmd-v1.0.0');
  });
});
