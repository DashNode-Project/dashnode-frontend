export type MoscowPriority = 'must_have' | 'should_have' | 'could_have' | 'wont_have';

export type StoryTaskType =
  'frontend' | 'backend' | 'bd' | 'qa' | 'seguridad' | 'devops' | 'documentacion' | 'ux_ui';

export interface EpicDTO {
  id: string;
  project_id: string;
  name: string;
  description: string;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserStoryDTO {
  id: string;
  epic_id: string;
  project_id: string;
  title: string;
  user_role: string;
  reason: string;
  acceptance_criteria: string;
  moscow_priority: MoscowPriority;
  story_points: number | null;
  sprint_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StoryTaskDTO {
  id: string;
  user_story_id: string;
  project_id: string;
  name: string;
  task_type: StoryTaskType;
  notes: string;
  status: string;
  assignee_id: string | null;
  estimated_hours: string | null;
  logged_hours?: string;
  label?: string;
  created_at: string;
  updated_at: string;
}

export interface BacklogTreeDTO {
  epics: { epic: EpicDTO; stories: UserStoryDTO[] }[];
  tasks_by_story: Record<string, StoryTaskDTO[]>;
  message?: string | null;
}
