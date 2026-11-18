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

// --- EP-12 AI visual evidence analysis types (HU_DN_07_106 .. HU_DN_07_110) ---

export type AiAnalysisStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
export type AiValidationStatus = 'PENDING_VALIDATION' | 'VALIDATED' | 'REJECTED';

export interface AiAnalysisResult {
  problem_description: string;
  probable_cause: string;
  suggested_solution?: string | null;
  context_sufficient: boolean;
}

export interface RequestAiAnalysisPayload {
  evidence_id?: string;
  user_confirmed_no_sensitive_data: boolean;
  force_new?: boolean;
}

export interface RequestAiAnalysisResponse {
  analysis_id: string;
  status: AiAnalysisStatus;
  reused: boolean;
  message: string;
}

export interface AiAnalysisStatusResponse {
  analysis_id: string;
  interaction_id?: string | null;
  status: AiAnalysisStatus;
  progress_stage?: string | null;
  validation_status: AiValidationStatus;
  requires_human_validation: boolean;
  validated_by_name?: string | null;
  validated_at?: string | null;
  rejected_by_name?: string | null;
  rejected_at?: string | null;
  result?: AiAnalysisResult | null;
  error_code?: string | null;
  message?: string | null;
  retryable: boolean;
  created_at: string;
}

export interface AiAnalysisListItem {
  id: string;
  interaction_id?: string | null;
  requested_by: {
    id: string;
    name: string;
  };
  created_at: string;
  validation_status: AiValidationStatus;
  summary: string;
  requires_human_validation: boolean;
  validated_by_name?: string | null;
  validated_at?: string | null;
  rejected_by_name?: string | null;
  rejected_at?: string | null;
  result?: AiAnalysisResult | null;
  evidence_id?: string | null;
}

export interface ValidateAiAnalysisResponse {
  message: string;
  validation_status: AiValidationStatus;
}

export interface RejectAiAnalysisResponse {
  message: string;
  validation_status: AiValidationStatus;
}

export interface AiAnalysisListResponse {
  items: AiAnalysisListItem[];
  next_cursor?: string | null;
}

export interface EvidenceOperationResponse {
  message: string;
  evidence: Evidence;
}
