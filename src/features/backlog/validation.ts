import { BACKLOG_MESSAGES } from './messages';

export function validateEpicForm(name: string): { name?: string } {
  if (!name.trim()) return { name: BACKLOG_MESSAGES.epicNameRequired };
  if (name.trim().length > 100) return { name: BACKLOG_MESSAGES.epicNameRequired };
  return {};
}

export function validateStoryForm(values: {
  title: string;
  userRole: string;
  reason: string;
}): Partial<Record<'title' | 'userRole' | 'reason', string>> {
  const errors: Partial<Record<'title' | 'userRole' | 'reason', string>> = {};
  if (!values.title.trim()) errors.title = BACKLOG_MESSAGES.storyTitleRequired;
  if (!values.userRole.trim()) errors.userRole = BACKLOG_MESSAGES.storyRoleRequired;
  if (!values.reason.trim()) errors.reason = BACKLOG_MESSAGES.storyReasonRequired;
  return errors;
}

export function validateTaskName(name: string): { name?: string } {
  if (!name.trim()) return { name: BACKLOG_MESSAGES.taskNameRequired };
  return {};
}

export function validateEstimatedHours(raw: string): { hours?: string } {
  if (!raw.trim()) return {};
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return { hours: BACKLOG_MESSAGES.estimatedHoursInvalid };
  if (n > 100) return { hours: 'Las horas estimadas no pueden exceder 100.' };
  return {};
}
