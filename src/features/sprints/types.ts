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

export interface BurndownPoint {
  date: string;
  points: number;
}

export interface SprintBurndownResponse {
  ideal_line: BurndownPoint[];
  actual_line: BurndownPoint[];
}

export interface SprintHistoryItem {
  sprint_id: string;
  name: string;
  start_date: string;
  end_date: string;
  committed_points: number;
  completed_points: number;
  fulfillment_percentage: number;
}

export interface SprintHistoryResponse {
  history: SprintHistoryItem[];
  message?: string;
}

export interface CloseSprintPayload {
  incomplete_stories_destination?: 'BACKLOG';
  incomplete_stories_action?: 'MOVE_TO_SPRINT';
  target_sprint_id?: string;
}
