import { apiFormRequest, apiRequest } from '@/lib/api/client';
import type {
  AssignIssuePayload,
  CloseIssuePayload,
  CreateIssuePayload,
  EvidenceOperationResponse,
  IssueDetail,
  IssueListResponse,
  IssueOperationResponse,
  ResolveIssuePayload,
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
