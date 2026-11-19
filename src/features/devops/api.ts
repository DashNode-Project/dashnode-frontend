import { apiRequest } from '@/lib/api/client';
import type { DevOpsProfile, DevOpsRevision, UpsertDevOpsPayload } from './types';

export async function fetchDevOpsProfile(projectId: string): Promise<DevOpsProfile> {
  return apiRequest<DevOpsProfile>(`/projects/${projectId}/devops`);
}

export async function upsertDevOpsProfile(
  projectId: string,
  payload: UpsertDevOpsPayload,
): Promise<DevOpsProfile> {
  return apiRequest<DevOpsProfile>(`/projects/${projectId}/devops`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function listDevOpsRevisions(
  projectId: string,
  params?: { limit?: number; offset?: number },
): Promise<{ items: DevOpsRevision[]; limit: number; offset: number }> {
  const query = new URLSearchParams();
  if (params?.limit !== undefined && params.limit !== null)
    query.set('limit', String(params.limit));
  if (params?.offset !== undefined && params.offset !== null)
    query.set('offset', String(params.offset));
  const suffix = query.size ? `?${query.toString()}` : '';
  return apiRequest(`/projects/${projectId}/devops/revisions${suffix}`);
}
