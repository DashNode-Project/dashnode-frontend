import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch, ok } from '@/test/fetchMock';
import { fetchDevOpsProfile, upsertDevOpsProfile } from './api';

describe('devops api client', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches devops profile', async () => {
    mockFetch((call) => {
      expect(call.url).toContain('/projects/p-1/devops');
      expect(call.method).toBe('GET');
      return ok({
        project_id: 'p-1',
        is_configured: false,
        can_edit: true,
        pipeline_stages: [],
        environments: [],
      });
    });
    const res = await fetchDevOpsProfile('p-1');
    expect(res.is_configured).toBe(false);
  });

  it('upserts devops profile', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('PUT');
      expect(call.url).toContain('/projects/p-2/devops');
      return ok({
        project_id: 'p-2',
        is_configured: true,
        can_edit: true,
        pipeline_stages: [],
        environments: [],
      });
    });
    const res = await upsertDevOpsProfile('p-2', {
      change_summary: 'Init',
      pipeline_stages: [],
      environments: [],
    });
    expect(res.is_configured).toBe(true);
  });
});
