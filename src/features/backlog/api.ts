import { apiRequest } from '@/lib/api/client';
import type {
  BacklogTreeDTO,
  EpicDTO,
  MoscowPriority,
  StoryTaskDTO,
  StoryTaskType,
  UserStoryDTO,
} from './types';

export async function getProjectBacklog(projectId: string): Promise<BacklogTreeDTO> {
  return apiRequest<BacklogTreeDTO>(`/projects/${projectId}/backlog`);
}

export async function createEpic(
  projectId: string,
  payload: { name: string; description?: string; color?: string | null },
): Promise<EpicDTO & { message: string }> {
  return apiRequest(`/projects/${projectId}/epics`, { method: 'POST', body: payload });
}

export async function updateEpic(
  epicId: string,
  payload: { name: string; description?: string; color?: string | null },
): Promise<EpicDTO & { message: string }> {
  return apiRequest(`/epics/${epicId}`, { method: 'PATCH', body: payload });
}

export async function createUserStory(
  epicId: string,
  payload: {
    title: string;
    user_role: string;
    reason: string;
    acceptance_criteria?: string;
    moscow_priority?: MoscowPriority;
  },
): Promise<UserStoryDTO & { message: string }> {
  return apiRequest(`/epics/${epicId}/user-stories`, { method: 'POST', body: payload });
}

export async function updateUserStory(
  storyId: string,
  payload: {
    title: string;
    user_role: string;
    reason: string;
    acceptance_criteria?: string;
    moscow_priority: MoscowPriority;
    epic_id: string;
  },
): Promise<UserStoryDTO & { message: string }> {
  return apiRequest(`/user-stories/${storyId}`, { method: 'PATCH', body: payload });
}

export async function assignStoryPoints(
  storyId: string,
  storyPoints: number | null,
): Promise<UserStoryDTO & { message: string }> {
  return apiRequest(`/user-stories/${storyId}/story-points`, {
    method: 'PATCH',
    body: { story_points: storyPoints },
  });
}

export async function createStoryTask(
  storyId: string,
  payload: { name: string; task_type: StoryTaskType; notes?: string },
): Promise<StoryTaskDTO & { message: string }> {
  return apiRequest(`/user-stories/${storyId}/tasks`, { method: 'POST', body: payload });
}

export async function updateStoryTask(
  taskId: string,
  payload: { name: string; task_type: StoryTaskType; notes?: string },
): Promise<StoryTaskDTO & { message: string }> {
  return apiRequest(`/story-tasks/${taskId}`, { method: 'PATCH', body: payload });
}

export async function deleteStoryTask(taskId: string): Promise<{ message: string }> {
  return apiRequest(`/story-tasks/${taskId}`, { method: 'DELETE' });
}

export async function assignStoryTask(
  taskId: string,
  assigneeId: string | null,
): Promise<StoryTaskDTO & { message: string }> {
  return apiRequest(`/story-tasks/${taskId}/assignee`, {
    method: 'PATCH',
    body: { assignee_id: assigneeId },
  });
}

export async function updateStoryTaskHours(
  taskId: string,
  estimatedHours: number | null,
): Promise<StoryTaskDTO & { message: string }> {
  return apiRequest(`/story-tasks/${taskId}/estimated-hours`, {
    method: 'PATCH',
    body: { estimated_hours: estimatedHours },
  });
}
