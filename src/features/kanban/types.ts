export type KanbanColumnId =
  'TODO' | 'IN_PROGRESS' | 'CODE_REVIEW' | 'TESTING' | 'CORRECTION' | 'DONE';

export interface KanbanColumnConfig {
  id: KanbanColumnId;
  label: string;
  color: string;
}

export const KANBAN_COLUMNS_CONFIG: KanbanColumnConfig[] = [
  { id: 'TODO', label: 'Por hacer', color: '#6B7280' },
  { id: 'IN_PROGRESS', label: 'En progreso', color: '#3B82F6' },
  { id: 'CODE_REVIEW', label: 'Code Review', color: '#8B5CF6' },
  { id: 'TESTING', label: 'Testing', color: '#F59E0B' },
  { id: 'CORRECTION', label: 'En corrección', color: '#F97316' },
  { id: 'DONE', label: 'Completado', color: '#10B981' },
];

export interface KanbanCard {
  id: string;
  story_id: string;
  story_title: string;
  name: string;
  task_type: string;
  status: KanbanColumnId;
  assignee_id: string | null;
  assignee_name: string | null;
  estimated_hours: number;
  logged_hours: number;
  is_blocked: boolean;
  blocked_reason: string | null;
  blocked_by_task_id: string | null;
  blocked_by_task_name: string | null;
}

export interface KanbanColumn {
  id: KanbanColumnId;
  label: string;
  wip_limit: number | null;
  tasks: KanbanCard[];
}

export interface KanbanBoardResponse {
  sprint_id: string | null;
  sprint_name: string | null;
  columns: KanbanColumn[];
}

export interface KanbanFilters {
  search: string;
  assigneeId: string;
  storyId: string;
  taskType: string;
}

export interface UpdateWipLimitPayload {
  wip_limit: number | null;
}

export interface UpdateTaskBlockPayload {
  is_blocked: boolean;
  blocked_reason?: string | null;
  blocked_by_task_id?: string | null;
}
