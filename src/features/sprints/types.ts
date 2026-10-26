export type SprintStatus = 'PLANNING' | 'ACTIVE' | 'CLOSED';

export interface SprintSummary {
  id: string;
  name: string;
  goal: string | null;
  start_date: string;
  end_date: string;
  status: SprintStatus;
  story_count: number;
  total_points: number;
}

export interface CurrentSprintMetrics {
  id: string;
  name: string;
  goal: string | null;
  days_remaining: number;
  total_points: number;
  completed_points: number;
  pending_points: number;
  progress_percentage: number;
}

export interface CurrentSprintResponse {
  sprint: CurrentSprintMetrics | null;
  message?: string;
}
