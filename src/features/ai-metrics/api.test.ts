import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch, ok } from '@/test/fetchMock';
import {
  getMetricsByUser,
  getMetricsSummary,
  listInteractions,
  putInteractionRating,
} from './api';

describe('ai-metrics api client', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches summary with period and project', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('GET');
      expect(call.url).toContain('/ai/metrics/summary');
      expect(call.url).toContain('period=7d');
      expect(call.url).toContain('project_id=p-1');
      return ok({
        period: { from: '2026-11-09T00:00:00Z', to: '2026-11-16T23:59:59Z', timezone: 'America/Bogota' },
        scope: { type: 'PROJECT', project_id: 'p-1', name: 'DashNode' },
        total_interactions: 2,
        avg_latency_ms: 900,
        tokens: { input: 100, output: 40 },
        audio_seconds: 0,
        computed_at: '2026-11-16T10:00:00Z',
      });
    });

    const res = await getMetricsSummary({ period: '7d', project_id: 'p-1' });
    expect(res.total_interactions).toBe(2);
  });

  it('maps nested legacy summary payload from backend', async () => {
    mockFetch(() =>
      ok({
        scope: 'managed_projects',
        period: { key: '7d', from: '2026-11-11T00:00:00Z', to: '2026-11-18T00:00:00Z' },
        summary: { total_interactions: 3, average_latency_ms: 250, total_tokens: 90 },
      }),
    );
    const res = await getMetricsSummary({ period: '7d', project_id: 'p-1' });
    expect(res.total_interactions).toBe(3);
    expect(res.avg_latency_ms).toBe(250);
    expect(res.scope.type).toBe('PROJECT');
  });

  it('lists interactions with filters and limit 25', async () => {
    mockFetch((call) => {
      expect(call.url).toContain('/ai/metrics/interactions');
      expect(call.url).toContain('limit=25');
      expect(call.url).toContain('user_id=u-2');
      expect(call.url).toContain('source=ASSISTANT_TEXT');
      return ok({ items: [], next_cursor: null });
    });

    await listInteractions({
      project_id: 'p-1',
      user_id: 'u-2',
      source: 'ASSISTANT_TEXT',
      limit: 25,
    });
  });

  it('fetches by-user metrics', async () => {
    mockFetch((call) => {
      expect(call.url).toContain('/ai/metrics/by-user');
      return ok({ items: [], totals: { interactions: 0 }, next_cursor: null });
    });
    await getMetricsByUser({ period: '30d', project_id: 'p-1' });
  });

  it('puts interaction rating score', async () => {
    mockFetch((call) => {
      expect(call.method).toBe('PUT');
      expect(call.url).toContain('/ai/interactions/int-1/rating');
      const body = call.body as { score: number };
      expect(body.score).toBe(4);
      return ok({ message: 'Gracias por su valoración.', score: 4 });
    });
    const res = await putInteractionRating('int-1', 4);
    expect(res.score).toBe(4);
  });
});