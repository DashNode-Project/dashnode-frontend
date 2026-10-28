import { apiRequest } from '@/lib/api/client';
import type {
  CreateDocumentationPayload,
  DocumentationEntry,
  DocumentationListResponse,
  DocumentationOperationResponse,
  ResubmitDocumentationPayload,
  UpdateDocumentationPayload,
} from './types';

export async function listDocumentationEntries(
  projectId: string,
): Promise<DocumentationListResponse> {
  return apiRequest<DocumentationListResponse>(`/projects/${projectId}/documentation`);
}

export async function createDocumentationEntry(
  projectId: string,
  body: CreateDocumentationPayload,
): Promise<DocumentationOperationResponse> {
  return apiRequest<DocumentationOperationResponse>(`/projects/${projectId}/documentation`, {
    method: 'POST',
    body,
  });
}

export async function updateDocumentationEntry(
  projectId: string,
  entryId: string,
  body: UpdateDocumentationPayload,
): Promise<DocumentationOperationResponse> {
  return apiRequest<DocumentationOperationResponse>(
    `/projects/${projectId}/documentation/${entryId}`,
    {
      method: 'PUT',
      body,
    },
  );
}

export async function deleteDocumentationEntry(
  projectId: string,
  entryId: string,
): Promise<DocumentationOperationResponse> {
  return apiRequest<DocumentationOperationResponse>(
    `/projects/${projectId}/documentation/${entryId}`,
    {
      method: 'DELETE',
    },
  );
}

export async function getDocumentationEntry(
  projectId: string,
  entryId: string,
): Promise<DocumentationEntry> {
  return apiRequest<DocumentationEntry>(`/projects/${projectId}/documentation/${entryId}`);
}

export async function toggleDocumentationVisibility(
  projectId: string,
  entryId: string,
  isVisibleToDevs: boolean,
): Promise<DocumentationOperationResponse> {
  return apiRequest<DocumentationOperationResponse>(
    `/projects/${projectId}/documentation/${entryId}/visibility`,
    {
      method: 'PATCH',
      body: { is_visible_to_devs: isVisibleToDevs },
    },
  );
}

export async function listPendingApprovals(projectId: string): Promise<DocumentationListResponse> {
  return apiRequest<DocumentationListResponse>(
    `/projects/${projectId}/documentation/pending-approvals`,
  );
}

export async function approveDocumentationEntry(
  projectId: string,
  entryId: string,
): Promise<DocumentationOperationResponse> {
  return apiRequest<DocumentationOperationResponse>(
    `/projects/${projectId}/documentation/${entryId}/approve`,
    {
      method: 'POST',
    },
  );
}

export async function rejectDocumentationEntry(
  projectId: string,
  entryId: string,
  rejectionReason?: string,
): Promise<DocumentationOperationResponse> {
  return apiRequest<DocumentationOperationResponse>(
    `/projects/${projectId}/documentation/${entryId}/reject`,
    {
      method: 'POST',
      body: { rejection_reason: rejectionReason },
    },
  );
}

export async function resubmitDocumentationEntry(
  projectId: string,
  entryId: string,
  body?: ResubmitDocumentationPayload,
): Promise<DocumentationOperationResponse> {
  return apiRequest<DocumentationOperationResponse>(
    `/projects/${projectId}/documentation/${entryId}/resubmit`,
    {
      method: 'POST',
      body: body || {},
    },
  );
}
