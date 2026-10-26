import { apiRequest } from '@/lib/api/client';
import type { CurrentSprintResponse, SprintSummary } from './types';

export async function listProjectSprints(projectId: string): Promise<SprintSummary[]> {
  const res = await apiRequest<{ items: SprintSummary[] }>(`/projects/${projectId}/sprints`);
  return res.items;
}

export async function createSprint(
  projectId: string,
  body: { name: string; goal?: string; start_date: string; end_date: string },
): Promise<{ id: string; message: string; status: string }> {
  return apiRequest(`/projects/${projectId}/sprints`, { method: 'POST', body });
}

export async function startSprint(
  projectId: string,
  sprintId: string,
): Promise<{ message: string; status: string }> {
  return apiRequest(`/projects/${projectId}/sprints/${sprintId}/start`, { method: 'POST' });
}

export async function getCurrentSprint(projectId: string): Promise<CurrentSprintResponse> {
  return apiRequest(`/projects/${projectId}/sprints/current`);
}

export async function assignStoryToSprint(
  projectId: string,
  storyId: string,
  sprintId: string,
): Promise<{ message: string; sprint_total_points: number }> {
  return apiRequest(`/projects/${projectId}/user-stories/${storyId}/sprint`, {
    method: 'PATCH',
    body: { sprint_id: sprintId },
  });
}
