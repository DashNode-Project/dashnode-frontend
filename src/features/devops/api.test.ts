import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch, ok } from '@/test/fetchMock';
import { fetchLatestPipeline, triggerPipelineRun } from './api';

describe('devops api client', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches latest pipeline for a project', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('GET');
      expect(call.url).toContain('/projects/p-1/devops/pipeline/latest');
      return ok({
        run_id: 'run-1',
        is_simulated: true,
        computed_at: '2026-11-18T12:00:00Z',
        stages: [],
      });
    });
    const res = await fetchLatestPipeline('p-1');
    expect(res.run_id).toBe('run-1');
    expect(res.is_simulated).toBe(true);
  });

  it('triggers a manual pipeline run', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('POST');
      expect(call.url).toContain('/projects/p-2/devops/pipeline/runs');
      return ok({ run_id: 'run-2', created_at: '2026-11-18T12:01:00Z' });
    });
    const res = await triggerPipelineRun('p-2');
    expect(res.run_id).toBe('run-2');
  });
});
