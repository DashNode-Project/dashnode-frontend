import { describe, expect, it } from 'vitest';
import { validateCreateSprintForm } from './validation';

describe('validateCreateSprintForm', () => {
  it('requires end date after start', () => {
    const errors = validateCreateSprintForm({
      name: 'Sprint 1',
      goal: '',
      startDate: '2026-11-10',
      endDate: '2026-11-10',
    });
    expect(errors.endDate).toBeTruthy();
  });
});
