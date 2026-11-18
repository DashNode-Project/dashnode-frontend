import { apiFormRequest, apiRequest } from '@/lib/api/client';
import type {
  AiAnalysisListResponse,
  AiAnalysisStatusResponse,
  AssignIssuePayload,
  CloseIssuePayload,
  CreateIssuePayload,
  EvidenceOperationResponse,
  IssueDetail,
  IssueListResponse,
  IssueOperationResponse,
  RejectAiAnalysisResponse,
  RequestAiAnalysisPayload,
  RequestAiAnalysisResponse,
  ResolveIssuePayload,
  ValidateAiAnalysisResponse,
} from './types';

export interface ListIssuesFilterParams {
  status?: string;
  severity?: string;
  type?: string;
  cursor?: string;
  limit?: number;
}

export async function listIssues(
  projectId: string,
  params: ListIssuesFilterParams = {},
): Promise<IssueListResponse> {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') {
    query.set('status', params.status);
  }
  if (params.severity && params.severity !== 'all') {
    query.set('severity', params.severity);
  }
  if (params.type && params.type !== 'all') {
    query.set('type', params.type);
  }
  if (params.cursor) {
    query.set('cursor', params.cursor);
  }
  if (params.limit) {
    query.set('limit', String(params.limit));
  }

  const qs = query.toString();
  const path = `/projects/${projectId}/issues${qs ? `?${qs}` : ''}`;
  return apiRequest<IssueListResponse>(path);
}

function buildCreateIssueBody(payload: CreateIssuePayload) {
  return {
    title: payload.title,
    description: payload.description || undefined,
    severity: payload.severity,
    type: payload.type,
    idempotency_key: payload.idempotency_key,
  };
}

function buildIdempotencyHeaders(
  payload: CreateIssuePayload,
  idempotencyKey?: string,
): Record<string, string> | undefined {
  const key = idempotencyKey || payload.idempotency_key;
  return key ? { 'Idempotency-Key': key } : undefined;
}

export async function createIssue(
  projectId: string,
  payload: CreateIssuePayload,
  idempotencyKey?: string,
): Promise<IssueOperationResponse> {
  return apiRequest<IssueOperationResponse>(`/projects/${projectId}/issues`, {
    method: 'POST',
    body: buildCreateIssueBody(payload),
    headers: buildIdempotencyHeaders(payload, idempotencyKey),
  });
}

export async function reportTaskFix(
  projectId: string,
  taskId: string,
  payload: CreateIssuePayload,
  idempotencyKey?: string,
): Promise<IssueOperationResponse> {
  return apiRequest<IssueOperationResponse>(`/projects/${projectId}/tasks/${taskId}/report-fix`, {
    method: 'POST',
    body: buildCreateIssueBody(payload),
    headers: buildIdempotencyHeaders(payload, idempotencyKey),
  });
}

export async function getIssueDetail(projectId: string, issueId: string): Promise<IssueDetail> {
  return apiRequest<IssueDetail>(`/projects/${projectId}/issues/${issueId}`);
}

export async function assignIssue(
  projectId: string,
  issueId: string,
  payload: AssignIssuePayload,
): Promise<IssueOperationResponse> {
  return apiRequest<IssueOperationResponse>(`/projects/${projectId}/issues/${issueId}/assignee`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function resolveIssue(
  projectId: string,
  issueId: string,
  payload: ResolveIssuePayload,
): Promise<IssueOperationResponse> {
  return apiRequest<IssueOperationResponse>(`/projects/${projectId}/issues/${issueId}/resolve`, {
    method: 'POST',
    body: payload,
  });
}

export async function closeIssue(
  projectId: string,
  issueId: string,
  payload: CloseIssuePayload = {},
): Promise<IssueOperationResponse> {
  return apiRequest<IssueOperationResponse>(`/projects/${projectId}/issues/${issueId}/close`, {
    method: 'POST',
    body: payload,
  });
}

export async function attachEvidence(
  projectId: string,
  issueId: string,
  file: File,
  title?: string,
): Promise<EvidenceOperationResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (title && title.trim()) {
    formData.append('title', title.trim());
  }

  return apiFormRequest<EvidenceOperationResponse>(
    `/projects/${projectId}/issues/${issueId}/evidences`,
    {
      method: 'POST',
      formData,
    },
  );
}

// --- EP-12 AI visual evidence analysis endpoints (HU_DN_07_106 .. HU_DN_07_110) ---

export async function requestAiAnalysis(
  projectId: string,
  issueId: string,
  payload: RequestAiAnalysisPayload,
): Promise<RequestAiAnalysisResponse> {
  return apiRequest<RequestAiAnalysisResponse>(
    `/projects/${projectId}/issues/${issueId}/ai-analyses`,
    {
      method: 'POST',
      body: {
        evidence_id: payload.evidence_id,
        user_confirmed_no_sensitive_data: payload.user_confirmed_no_sensitive_data,
        force_new: payload.force_new ?? false,
      },
    },
  );
}

export async function getAiAnalysisStatus(
  projectId: string,
  issueId: string,
  analysisId: string,
): Promise<AiAnalysisStatusResponse> {
  return apiRequest<AiAnalysisStatusResponse>(
    `/projects/${projectId}/issues/${issueId}/ai-analyses/${analysisId}`,
  );
}

export async function listAiAnalyses(
  projectId: string,
  issueId: string,
  limit = 20,
  cursor?: string,
): Promise<AiAnalysisListResponse> {
  const query = new URLSearchParams();
  if (limit) query.set('limit', String(limit));
  if (cursor) query.set('cursor', cursor);
  const qs = query.toString();
  return apiRequest<AiAnalysisListResponse>(
    `/projects/${projectId}/issues/${issueId}/ai-analyses${qs ? `?${qs}` : ''}`,
  );
}

export async function deleteAiAnalysis(
  projectId: string,
  issueId: string,
  analysisId: string,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `/projects/${projectId}/issues/${issueId}/ai-analyses/${analysisId}`,
    {
      method: 'DELETE',
    },
  );
}

// --- EP-12 Human validation endpoints (HU_DN_07_111, HU_DN_07_112) ---

export async function validateAiAnalysis(
  projectId: string,
  issueId: string,
  analysisId: string,
): Promise<ValidateAiAnalysisResponse> {
  return apiRequest<ValidateAiAnalysisResponse>(
    `/projects/${projectId}/issues/${issueId}/ai-analyses/${analysisId}/validate`,
    {
      method: 'POST',
    },
  );
}

export async function rejectAiAnalysis(
  projectId: string,
  issueId: string,
  analysisId: string,
  reason?: string,
): Promise<RejectAiAnalysisResponse> {
  return apiRequest<RejectAiAnalysisResponse>(
    `/projects/${projectId}/issues/${issueId}/ai-analyses/${analysisId}/reject`,
    {
      method: 'POST',
      body: reason ? { reason } : undefined,
    },
  );
}
