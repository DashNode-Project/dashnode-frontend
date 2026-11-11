import { apiFormRequest, apiRequest } from '@/lib/api/client';
import type {
  CreateIssuePayload,
  EvidenceOperationResponse,
  IssueDetail,
  IssueListResponse,
  IssueOperationResponse,
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

export async function createIssue(
  projectId: string,
  payload: CreateIssuePayload,
  idempotencyKey?: string,
): Promise<IssueOperationResponse> {
  const headers: Record<string, string> = {};
  if (idempotencyKey || payload.idempotency_key) {
    headers['Idempotency-Key'] = idempotencyKey || payload.idempotency_key || '';
  }

  return apiRequest<IssueOperationResponse>(`/projects/${projectId}/issues`, {
    method: 'POST',
    body: {
      title: payload.title,
      description: payload.description || undefined,
      severity: payload.severity,
      type: payload.type,
      idempotency_key: payload.idempotency_key,
    },
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  });
}

export async function getIssueDetail(projectId: string, issueId: string): Promise<IssueDetail> {
  return apiRequest<IssueDetail>(`/projects/${projectId}/issues/${issueId}`);
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
