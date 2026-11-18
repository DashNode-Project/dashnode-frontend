export type MetricsPeriod = 'today' | '7d' | '30d' | 'month' | 'custom';

export type InteractionSource =
  | 'ASSISTANT_TEXT'
  | 'ASSISTANT_VOICE'
  | 'ISSUE_ANALYSIS'
  | 'METRICS_QUERY';

export type InteractionStatus = 'PENDING' | 'SUCCESS' | 'ERROR' | 'CANCELLED';

export interface MetricsScope {
  type: 'GLOBAL' | 'PROJECTS' | 'PROJECT';
  project_count?: number;
  project_id?: string | null;
  name?: string | null;
}

export interface MetricsPeriodRange {
  from: string;
  to: string;
  timezone: string;
}

export interface MetricsSummary {
  period: MetricsPeriodRange;
  scope: MetricsScope;
  total_interactions: number;
  avg_latency_ms: number;
  median_latency_ms?: number | null;
  tokens: { input: number; output: number };
  audio_seconds: number;
  cost?: {
    real_usd: number;
    reference_usd: number | null;
    is_estimate: boolean;
  };
  computed_at: string;
  data_freshness?: string;
}

export interface MetricsByUserItem {
  user: { id: string; name: string };
  interactions: number;
  last_at: string | null;
  input_tokens?: number;
  output_tokens?: number;
  avg_latency_ms?: number | null;
}

export interface MetricsByUserResponse {
  items: MetricsByUserItem[];
  totals: { interactions: number };
  next_cursor?: string | null;
}

export interface InteractionUserRef {
  id: string;
  name: string;
}

export interface InteractionProjectRef {
  id: string;
  name: string;
}

export interface InteractionListItem {
  id: string;
  user: InteractionUserRef;
  requested_at: string;
  source: InteractionSource;
  status: InteractionStatus;
  project: InteractionProjectRef | null;
  query_preview: string;
  response_preview: string;
  latency_ms: number | null;
  input_tokens: number;
  output_tokens: number;
  audio_seconds: number;
  rating: number | null;
}

export interface InteractionListResponse {
  items: InteractionListItem[];
  next_cursor?: string | null;
}

export interface InteractionDetail {
  id: string;
  user: InteractionUserRef;
  requested_at: string;
  completed_at?: string | null;
  source: InteractionSource;
  status: InteractionStatus;
  project: InteractionProjectRef | null;
  query_text: string;
  response_text: string | null;
  latency_ms: number | null;
  input_tokens: number;
  output_tokens: number;
  audio_seconds: number;
  rating: number | null;
  error_code?: string | null;
}

export interface InteractionListFilters {
  project_id?: string;
  user_id?: string;
  source?: InteractionSource | '';
  status?: InteractionStatus | '';
  from?: string;
  to?: string;
  min_rating?: number;
  limit?: number;
  cursor?: string | null;
  period?: MetricsPeriod;
}

export interface PutRatingResponse {
  message: string;
  score: number;
}