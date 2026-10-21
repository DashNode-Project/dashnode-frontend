import type { BacklogTreeDTO, StoryTaskDTO, UserStoryDTO } from './types';
import type { ProjectMemberRow } from '@/features/projects/api';

export type EstimationMode = 'story' | 'task';

export function visibleProjectMembers(members: ProjectMemberRow[]): ProjectMemberRow[] {
  return members.filter((m) => m.role !== 'admin');
}

export function flattenStories(tree: BacklogTreeDTO | null): UserStoryDTO[] {
  if (!tree) return [];
  return tree.epics.flatMap(({ stories }) => stories);
}

export function tasksForStory(tree: BacklogTreeDTO | null, storyId: string): StoryTaskDTO[] {
  return tree?.tasks_by_story[storyId] ?? [];
}

export function sumTaskStoryPoints(tasks: StoryTaskDTO[]): number {
  return tasks.reduce((acc, t) => acc + (t.story_points ?? 0), 0);
}

export function storyPointsLabel(
  story: UserStoryDTO,
  tasks: StoryTaskDTO[],
): { value: number | null; hint: string } {
  if (story.estimation_mode === 'task') {
    const total = sumTaskStoryPoints(tasks);
    return { value: total > 0 ? total : null, hint: 'Σ tareas' };
  }
  return { value: story.story_points, hint: 'HU' };
}

export function assigneeIdsForStory(tasks: StoryTaskDTO[]): string[] {
  const ids = new Set<string>();
  for (const task of tasks) {
    if (task.assignee_id) ids.add(task.assignee_id);
  }
  return [...ids];
}
