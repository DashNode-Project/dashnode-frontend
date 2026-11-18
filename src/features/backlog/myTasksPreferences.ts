/* eslint-disable no-restricted-properties -- EP-04: non-sensitive UI filter/view preferences. */
export type MyTasksViewMode = 'list' | 'table' | 'kanban';

const PROJECT_FILTER_KEY = 'dashnode.my-tasks.project-filter.v1';
const VIEW_MODE_KEY = 'dashnode.my-tasks.view-mode.v1';

export function readMyTasksProjectFilter(): string {
  try {
    return window.localStorage.getItem(PROJECT_FILTER_KEY) ?? '';
  } catch {
    return '';
  }
}

export function writeMyTasksProjectFilter(projectId: string): void {
  try {
    if (projectId) {
      window.localStorage.setItem(PROJECT_FILTER_KEY, projectId);
    } else {
      window.localStorage.removeItem(PROJECT_FILTER_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export function readMyTasksViewMode(): MyTasksViewMode {
  try {
    const raw = window.localStorage.getItem(VIEW_MODE_KEY);
    if (raw === 'list' || raw === 'table' || raw === 'kanban') return raw;
  } catch {
    /* ignore */
  }
  return 'table';
}

export function writeMyTasksViewMode(mode: MyTasksViewMode): void {
  try {
    window.localStorage.setItem(VIEW_MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}
