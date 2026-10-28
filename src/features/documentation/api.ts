import { apiRequest } from '@/lib/api/client';
import type {
  CreateDocumentationPayload,
  DocumentationEntry,
  DocumentationListResponse,
  DocumentationOperationResponse,
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
