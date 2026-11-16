import { apiRequest } from '@/lib/api/client';
import type {
  InteractionDetail,
  InteractionListFilters,
  InteractionListResponse,
  MetricsByUserResponse,
  MetricsPeriod,
  MetricsSummary,
  PutRatingResponse,
} from './types';

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function getMetricsSummary(args: {
  period?: MetricsPeriod;
  from?: string;
  to?: string;
  project_id?: string;
}): Promise<MetricsSummary> {
  const query = buildQuery({
    period: args.period ?? '7d',
    from: args.from,
    to: args.to,
    project_id: args.project_id,
  });
  return apiRequest<MetricsSummary>(`/ai/metrics/summary${query}`);
}

export async function getMetricsByUser(args: {
  period?: MetricsPeriod;
  from?: string;
  to?: string;
  project_id?: string;
  limit?: number;
  cursor?: string | null;
}): Promise<MetricsByUserResponse> {
  const query = buildQuery({
    period: args.period ?? '7d',
    from: args.from,
    to: args.to,
    project_id: args.project_id,
    limit: args.limit ?? 25,
    cursor: args.cursor ?? undefined,
  });
  return apiRequest<MetricsByUserResponse>(`/ai/metrics/by-user${query}`);
}

export async function listInteractions(
  filters: InteractionListFilters,
): Promise<InteractionListResponse> {
  const query = buildQuery({
    project_id: filters.project_id,
    user_id: filters.user_id,
    source: filters.source || undefined,
    status: filters.status || undefined,
    from: filters.from,
    to: filters.to,
    min_rating: filters.min_rating,
    period: filters.period,
    limit: filters.limit ?? 25,
    cursor: filters.cursor ?? undefined,
  });
  return apiRequest<InteractionListResponse>(`/ai/metrics/interactions${query}`);
}

export async function getInteractionDetail(interactionId: string): Promise<InteractionDetail> {
  return apiRequest<InteractionDetail>(`/ai/metrics/interactions/${interactionId}`);
}

export async function putInteractionRating(
  interactionId: string,
  score: number,
): Promise<PutRatingResponse> {
  return apiRequest<PutRatingResponse>(`/ai/interactions/${interactionId}/rating`, {
    method: 'PUT',
    body: { score },
  });
}