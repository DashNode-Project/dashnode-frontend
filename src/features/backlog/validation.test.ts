import { describe, expect, it } from 'vitest';
import { BACKLOG_MESSAGES } from './messages';
import {
  validateEpicForm,
  validateEstimatedHours,
  validateStoryForm,
  validateTaskName,
} from './validation';

describe('backlog validation', () => {
  it('requires epic name with literal message', () => {
    expect(validateEpicForm('')).toEqual({ name: BACKLOG_MESSAGES.epicNameRequired });
  });

  it('requires story fields', () => {
    expect(validateStoryForm({ title: '', userRole: 'Rol', reason: 'Razón' }).title).toBe(
      BACKLOG_MESSAGES.storyTitleRequired,
    );
  });

  it('requires task name', () => {
    expect(validateTaskName('  ').name).toBe(BACKLOG_MESSAGES.taskNameRequired);
  });

  it('validates estimated hours', () => {
    expect(validateEstimatedHours('0').hours).toBe(BACKLOG_MESSAGES.estimatedHoursInvalid);
    expect(validateEstimatedHours('2')).toEqual({});
  });
});
