import { apiRequest } from '@/lib/api/client';
import type {
  BacklogTreeDTO,
  EpicDTO,
  MoscowPriority,
  StoryTaskDTO,
  StoryTaskType,
  UserStoryDTO,
} from './types';

export interface BacklogQuery {
  q?: string;
  priority?: string;
  assignedTo?: string;
  label?: string;
}

export async function getProjectBacklog(
  projectId: string,
  query: BacklogQuery = {},
): Promise<BacklogTreeDTO> {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.priority) params.set('priority', query.priority);
  if (query.assignedTo) params.set('assignedTo', query.assignedTo);
  if (query.label) params.set('label', query.label);
  const suffix = params.size ? `?${params.toString()}` : '';
  return apiRequest<BacklogTreeDTO>(`/projects/${projectId}/backlog/tree${suffix}`);
}

export async function logTaskHours(
  projectId: string,
  taskId: string,
  payload: { hours_spent: number; comment?: string },
): Promise<{ message: string; total_logged_hours: string }> {
  return apiRequest(`/projects/${projectId}/tasks/${taskId}/time-logs`, {
    method: 'POST',
    body: payload,
  });
}

export async function changeTaskStatus(
  projectId: string,
  taskId: string,
  status: string,
): Promise<{ message: string; status: string }> {
  return apiRequest(`/projects/${projectId}/tasks/${taskId}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

export interface MyTaskItem {
  id: string;
  name: string;
  project: { id: string; name: string };
  user_story: { id: string; title: string };
  status: string;
  estimated_hours: string | null;
  logged_hours: string;
}

export async function listMyTasks(query: { projectId?: string; status?: string } = {}): Promise<{
  tasks: MyTaskItem[];
  message?: string | null;
}> {
  const params = new URLSearchParams();
  if (query.projectId) params.set('projectId', query.projectId);
  if (query.status) params.set('status', query.status);
  const suffix = params.size ? `?${params.toString()}` : '';
  return apiRequest(`/users/me/tasks${suffix}`);
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
    estimation_mode?: 'story' | 'task';
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

export async function assignTaskStoryPoints(
  taskId: string,
  storyPoints: number | null,
): Promise<StoryTaskDTO & { message: string }> {
  return apiRequest(`/story-tasks/${taskId}/story-points`, {
    method: 'PATCH',
    body: { story_points: storyPoints },
  });
}
