import { apiRequest } from '@/lib/api/client';
import type {
  InteractionDetail,
  InteractionListFilters,
  InteractionListItem,
  InteractionListResponse,
  MetricsByUserItem,
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

type RawSummaryPayload = {
  scope?: string | { type?: string; name?: string; project_id?: string };
  period?: { from: string; to: string; key?: string; timezone?: string };
  summary?: {
    total_interactions?: number;
    average_latency_ms?: number;
    total_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
    audio_duration_ms?: number;
  };
  managed_project_count?: number;
  scope_name?: string;
  total_interactions?: number;
  avg_latency_ms?: number;
  tokens?: { input: number; output: number };
  audio_seconds?: number;
  computed_at?: string;
};

function mapSummaryResponse(body: RawSummaryPayload, projectId?: string): MetricsSummary {
  if (typeof body.total_interactions === 'number' && body.period?.timezone) {
    return body as MetricsSummary;
  }
  const nested = body.summary ?? {};
  const period = body.period ?? { from: '', to: '' };
  const totalTokens = nested.total_tokens ?? 0;
  const inputTokens = nested.input_tokens ?? totalTokens;
  const outputTokens = nested.output_tokens ?? 0;
  const audioSeconds = Math.round((nested.audio_duration_ms ?? 0) / 1000);
  const scope =
    typeof body.scope === 'object' && body.scope?.type
      ? (body.scope as MetricsSummary['scope'])
      : projectId
        ? {
            type: 'PROJECT' as const,
            project_id: projectId,
            name: body.scope_name,
          }
        : {
            type: 'PROJECTS' as const,
            name: String(body.scope ?? 'Proyectos gestionados'),
            project_count: body.managed_project_count,
          };
  return {
    period: {
      from: period.from,
      to: period.to,
      timezone: period.timezone ?? 'UTC',
    },
    scope,
    total_interactions: nested.total_interactions ?? body.total_interactions ?? 0,
    avg_latency_ms: nested.average_latency_ms ?? body.avg_latency_ms ?? 0,
    tokens: body.tokens ?? { input: inputTokens, output: outputTokens },
    audio_seconds: body.audio_seconds ?? audioSeconds,
    computed_at: body.computed_at ?? new Date().toISOString(),
  };
}

type RawByUserItem = {
  user_id?: string;
  user_name?: string;
  interaction_count?: number;
  input_tokens?: number;
  output_tokens?: number;
  average_latency_ms?: number;
  user?: { id: string; name: string };
  interactions?: number;
  last_at?: string | null;
};

function mapByUserResponse(body: {
  items?: RawByUserItem[];
  totals?: { interactions: number };
  next_cursor?: string | null;
}): MetricsByUserResponse {
  const items: MetricsByUserItem[] = (body.items ?? []).map((row) => {
    if (row.user && typeof row.interactions === 'number') {
      return row as MetricsByUserItem;
    }
    return {
      user: { id: row.user_id ?? '', name: row.user_name ?? 'Usuario' },
      interactions: row.interaction_count ?? 0,
      last_at: row.last_at ?? null,
      input_tokens: row.input_tokens,
      output_tokens: row.output_tokens,
      avg_latency_ms: row.average_latency_ms ?? null,
    };
  });
  return {
    items,
    totals: body.totals ?? { interactions: items.reduce((n, i) => n + i.interactions, 0) },
    next_cursor: body.next_cursor ?? null,
  };
}

type RawInteractionRow = Record<string, unknown>;

function mapInteractionRow(row: RawInteractionRow): InteractionListItem {
  if (row.user && typeof row.requested_at === 'string') {
    return row as unknown as InteractionListItem;
  }
  const userId = String(row.user_id ?? '');
  const requestText = String(row.request_text ?? '');
  const responseText = String(row.response_text ?? '');
  const audioMs = Number(row.audio_duration_ms ?? 0);
  return {
    id: String(row.id ?? ''),
    user: { id: userId, name: String(row.user_name ?? 'Usuario') },
    requested_at: String(row.created_at ?? ''),
    source: row.source as InteractionListItem['source'],
    status: row.status as InteractionListItem['status'],
    project: row.project_id
      ? { id: String(row.project_id), name: String(row.project_name ?? 'Proyecto') }
      : null,
    query_preview: requestText.slice(0, 120),
    response_preview: responseText.slice(0, 120),
    latency_ms: row.total_latency_ms != null ? Number(row.total_latency_ms) : null,
    input_tokens: Number(row.input_tokens ?? 0),
    output_tokens: Number(row.output_tokens ?? 0),
    audio_seconds: Math.round(audioMs / 1000),
    rating: row.rating != null ? Number(row.rating) : null,
  };
}

function mapInteractionsResponse(body: {
  items?: RawInteractionRow[];
  next_cursor?: string | null;
}): InteractionListResponse {
  return {
    items: (body.items ?? []).map(mapInteractionRow),
    next_cursor: body.next_cursor ?? null,
  };
}

function mapInteractionDetail(body: Record<string, unknown>): InteractionDetail {
  if (body.query_text && body.user) {
    return body as unknown as InteractionDetail;
  }
  const nested = (body.interaction ?? body) as Record<string, unknown>;
  const audioMs = Number(nested.audio_duration_ms ?? 0);
  return {
    id: String(nested.id ?? ''),
    user: {
      id: String(nested.user_id ?? ''),
      name: String(nested.user_name ?? 'Usuario'),
    },
    requested_at: String(nested.created_at ?? ''),
    completed_at: nested.completed_at ? String(nested.completed_at) : null,
    source: nested.source as InteractionDetail['source'],
    status: nested.status as InteractionDetail['status'],
    project: nested.project_id
      ? { id: String(nested.project_id), name: String(nested.project_name ?? 'Proyecto') }
      : null,
    query_text: String(nested.request_text ?? ''),
    response_text: nested.response_text != null ? String(nested.response_text) : null,
    latency_ms: nested.total_latency_ms != null ? Number(nested.total_latency_ms) : null,
    input_tokens: Number(nested.input_tokens ?? 0),
    output_tokens: Number(nested.output_tokens ?? 0),
    audio_seconds: Math.round(audioMs / 1000),
    rating: nested.rating != null ? Number(nested.rating) : null,
    error_code: nested.error_code != null ? String(nested.error_code) : null,
  };
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
  const raw = await apiRequest<RawSummaryPayload>(`/ai/metrics/summary${query}`);
  return mapSummaryResponse(raw, args.project_id);
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
  const raw = await apiRequest<{ items?: RawByUserItem[]; totals?: { interactions: number } }>(
    `/ai/metrics/by-user${query}`,
  );
  return mapByUserResponse(raw);
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
  const raw = await apiRequest<{ items?: RawInteractionRow[]; next_cursor?: string | null }>(
    `/ai/metrics/interactions${query}`,
  );
  return mapInteractionsResponse(raw);
}

export async function getInteractionDetail(interactionId: string): Promise<InteractionDetail> {
  const raw = await apiRequest<Record<string, unknown>>(`/ai/interactions/${interactionId}`);
  return mapInteractionDetail(raw);
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