import { apiRequest } from '@/lib/api/client';
import type {
  KanbanBoardResponse,
  KanbanColumnId,
  UpdateTaskBlockPayload,
  UpdateWipLimitPayload,
} from './types';

interface RawBackendCard {
  id: string;
  title?: string;
  name?: string;
  task_type: string;
  status: KanbanColumnId;
  assignee_id: string | null;
  assignee_name: string | null;
  user_story_id?: string;
  story_id?: string;
  user_story_title?: string;
  story_title?: string;
  estimated_hours: number;
  logged_hours: number;
  is_blocked: boolean;
  blocked_reason: string | null;
  blocked_by_task_id: string | null;
  blocked_by_task_title?: string | null;
  blocked_by_task_name?: string | null;
}

interface RawBackendColumn {
  id: KanbanColumnId;
  name?: string;
  label?: string;
  wip_limit: number | null;
  cards?: RawBackendCard[];
  tasks?: RawBackendCard[];
}

interface RawBackendBoardResponse {
  active_sprint?: { id: string; name: string } | null;
  sprint_id?: string | null;
  sprint_name?: string | null;
  columns: RawBackendColumn[];
}

export async function getKanbanBoard(projectId: string): Promise<KanbanBoardResponse> {
  const raw = await apiRequest<RawBackendBoardResponse>(`/projects/${projectId}/kanban`);
  return {
    sprint_id: raw.sprint_id ?? raw.active_sprint?.id ?? null,
    sprint_name: raw.sprint_name ?? raw.active_sprint?.name ?? null,
    columns: (raw.columns || []).map((col) => {
      const cardList = col.tasks ?? col.cards ?? [];
      return {
        id: col.id,
        label: col.label ?? col.name ?? col.id,
        wip_limit: col.wip_limit,
        tasks: cardList.map((c) => ({
          id: c.id,
          name: c.name ?? c.title ?? '',
          task_type: c.task_type,
          status: c.status,
          assignee_id: c.assignee_id,
          assignee_name: c.assignee_name,
          story_id: c.story_id ?? c.user_story_id ?? '',
          story_title: c.story_title ?? c.user_story_title ?? '',
          estimated_hours: c.estimated_hours ?? 0,
          logged_hours: c.logged_hours ?? 0,
          is_blocked: Boolean(c.is_blocked),
          blocked_reason: c.blocked_reason ?? null,
          blocked_by_task_id: c.blocked_by_task_id ?? null,
          blocked_by_task_name: c.blocked_by_task_name ?? c.blocked_by_task_title ?? null,
        })),
      };
    }),
  };
}

export async function updateColumnWipLimit(
  projectId: string,
  columnId: KanbanColumnId,
  wipLimit: number | null,
): Promise<{ column_id: string; wip_limit: number | null; message: string }> {
  const body: UpdateWipLimitPayload = { wip_limit: wipLimit };
  return apiRequest<{ column_id: string; wip_limit: number | null; message: string }>(
    `/projects/${projectId}/kanban/columns/${columnId}/wip`,
    {
      method: 'PUT',
      body,
    },
  );
}

export async function changeTaskStatus(
  projectId: string,
  taskId: string,
  status: KanbanColumnId,
): Promise<{ id: string; status: string; message: string }> {
  return apiRequest<{ id: string; status: string; message: string }>(
    `/projects/${projectId}/tasks/${taskId}/status`,
    {
      method: 'PATCH',
      body: { status },
    },
  );
}

export async function updateTaskBlock(
  projectId: string,
  taskId: string,
  payload: UpdateTaskBlockPayload,
): Promise<{
  id: string;
  is_blocked: boolean;
  blocked_reason?: string | null;
  blocked_by_task_id?: string | null;
  message: string;
}> {
  return apiRequest<{
    id: string;
    is_blocked: boolean;
    blocked_reason?: string | null;
    blocked_by_task_id?: string | null;
    message: string;
  }>(`/projects/${projectId}/tasks/${taskId}/block`, {
    method: 'PATCH',
    body: payload,
  });
}
