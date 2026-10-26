import { apiRequest } from '@/lib/api/client';
import type {
  CloseSprintPayload,
  CurrentSprintResponse,
  SprintBurndownResponse,
  SprintHistoryResponse,
  SprintSummary,
} from './types';

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

export async function getSprintBurndown(
  projectId: string,
  sprintId: string,
): Promise<SprintBurndownResponse> {
  return apiRequest(`/projects/${projectId}/sprints/${sprintId}/burndown`);
}

export async function closeSprint(
  projectId: string,
  sprintId: string,
  body: CloseSprintPayload = {},
): Promise<{ message: string; status: string; moved_stories_count: number }> {
  return apiRequest(`/projects/${projectId}/sprints/${sprintId}/close`, {
    method: 'POST',
    body,
  });
}

export async function getSprintHistory(projectId: string): Promise<SprintHistoryResponse> {
  return apiRequest(`/projects/${projectId}/sprints/history`);
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
