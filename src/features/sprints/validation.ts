import { SPRINT_MESSAGES } from './messages';

export interface CreateSprintForm {
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
}

export function validateCreateSprintForm(form: CreateSprintForm): Partial<Record<keyof CreateSprintForm, string>> {
  const errors: Partial<Record<keyof CreateSprintForm, string>> = {};
  if (!form.name.trim()) errors.name = SPRINT_MESSAGES.nameRequired;
  else if (form.name.trim().length > 100) errors.name = SPRINT_MESSAGES.nameRequired;
  if (!form.startDate) errors.startDate = SPRINT_MESSAGES.startRequired;
  if (!form.endDate) errors.endDate = SPRINT_MESSAGES.endRequired;
  if (form.startDate && form.endDate && form.endDate <= form.startDate) {
    errors.endDate = SPRINT_MESSAGES.endAfterStart;
  }
  if (form.goal.trim().length > 500) {
    errors.goal = 'El objetivo del sprint no puede superar 500 caracteres.';
  }
  return errors;
}

export function defaultEndDate(startDate: string): string {
  if (!startDate) return '';
  const start = new Date(`${startDate}T12:00:00`);
  start.setDate(start.getDate() + 14);
  return start.toISOString().slice(0, 10);
}

export function minStartDate(): string {
  return new Date().toISOString().slice(0, 10);
}
