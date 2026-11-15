export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IssueType = 'bug' | 'regression' | 'performance' | 'security' | 'ux';
export type IssueStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type EvidenceType = 'image' | 'video' | 'log';

export interface Issue {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  severity: IssueSeverity;
  type: IssueType;
  status: IssueStatus;
  reporter_id: string;
  reporter_name: string;
  assignee_id?: string | null;
  assignee_name?: string | null;
  resolution_note?: string | null;
  resolved_by?: string | null;
  resolved_by_name?: string | null;
  resolved_at?: string | null;
  task_id?: string | null;
  task_name?: string | null;
  task_status?: string | null;
  task_previous_status?: string | null;
  other_open_issues_count?: number;
  version: number;
  created_at: string;
  updated_at: string;
  evidences_count: number;
}

export interface Evidence {
  id: string;
  fix_id: string;
  title?: string | null;
  file_name: string;
  file_type: EvidenceType;
  mime_type: string;
  file_size: number;
  download_url: string;
  thumbnail_url?: string | null;
  duration_seconds?: number | null;
  uploaded_by: string;
  uploaded_by_name: string;
  created_at: string;
}

export interface AIAnalysisSummary {
  id: string;
  evidence_id?: string | null;
  fix_id?: string | null;
  diagnosis?: string | null;
  recommendation?: string | null;
  observations: string[];
  possible_causes: string[];
  suggested_steps: string[];
}

export interface IssueDetail extends Issue {
  evidences: Evidence[];
  ai_analyses: AIAnalysisSummary[];
}

export interface CreateIssuePayload {
  title: string;
  description?: string;
  severity: string;
  type: string;
  idempotency_key?: string;
}

export interface AssignIssuePayload {
  assignee_id: string | null;
  version?: number;
}

export interface ResolveIssuePayload {
  resolution_note: string;
  task_status?: string | null;
  version?: number;
}

export interface CloseIssuePayload {
  task_status?: string | null;
  version?: number;
}

export interface IssueListResponse {
  items: Issue[];
  next_cursor?: string | null;
  total: number;
}

export interface IssueOperationResponse {
  message: string;
  issue: Issue;
  task_unlinked?: boolean;
  task_id?: string | null;
  task_status?: string | null;
  task_message?: string | null;
}

export interface EvidenceOperationResponse {
  message: string;
  evidence: Evidence;
}
