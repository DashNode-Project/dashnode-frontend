import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ISSUE_MESSAGES } from '../messages';
import type { Issue } from '../types';
import { ResolveIssueModal } from './ResolveIssueModal';

const baseIssue: Issue = {
  id: 'iss-1',
  project_id: 'p-1',
  title: 'Falla de validación',
  severity: 'high',
  type: 'bug',
  status: 'open',
  reporter_id: 'dev-1',
  reporter_name: 'Dev One',
  version: 1,
  created_at: '2026-11-10T10:00:00Z',
  updated_at: '2026-11-10T10:00:00Z',
  evidences_count: 0,
};

describe('ResolveIssueModal', () => {
  it('validates required resolution note and submits without task selector for standalone issues', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ResolveIssueModal issue={baseIssue} loading={false} onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    expect(screen.queryByLabelText(/estado de la tarea/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Resolver' }));
    expect(screen.getByRole('alert')).toHaveTextContent(ISSUE_MESSAGES.RESOLUTION_NOTE_REQUIRED);
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/nota de resolución/i), '  Parche aplicado  ');
    await user.click(screen.getByRole('button', { name: 'Resolver' }));

    expect(onSubmit).toHaveBeenCalledWith({
      resolution_note: 'Parche aplicado',
      task_status: undefined,
    });
  });

  it('preselects previous task status and lets user choose restored status when last open issue', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ResolveIssueModal
        issue={{
          ...baseIssue,
          task_id: 'task-1',
          task_name: 'Login OAuth',
          task_status: 'CORRECTION',
          task_previous_status: 'CODE_REVIEW',
          other_open_issues_count: 0,
        }}
        loading={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const statusSelect = screen.getByLabelText(/estado de la tarea/i) as HTMLSelectElement;
    expect(statusSelect).not.toBeDisabled();
    expect(statusSelect.value).toBe('CODE_REVIEW');

    await user.selectOptions(statusSelect, 'TESTING');
    await user.type(screen.getByLabelText(/nota de resolución/i), 'Corregido y listo para QA');
    await user.click(screen.getByRole('button', { name: 'Resolver' }));

    expect(onSubmit).toHaveBeenCalledWith({
      resolution_note: 'Corregido y listo para QA',
      task_status: 'TESTING',
    });
  });

  it('disables task status selector and shows warning when other open issues remain on task', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ResolveIssueModal
        issue={{
          ...baseIssue,
          task_id: 'task-1',
          task_name: 'Login OAuth',
          task_status: 'CORRECTION',
          task_previous_status: null,
          other_open_issues_count: 2,
        }}
        loading={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const statusSelect = screen.getByLabelText(/estado de la tarea/i) as HTMLSelectElement;
    expect(statusSelect).toBeDisabled();
    expect(statusSelect.value).toBe('IN_PROGRESS');
    expect(screen.getByText(ISSUE_MESSAGES.TASK_OTHER_OPEN_ISSUES)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/nota de resolución/i), 'Fix parcial');
    await user.click(screen.getByRole('button', { name: 'Resolver' }));

    expect(onSubmit).toHaveBeenCalledWith({
      resolution_note: 'Fix parcial',
      task_status: undefined,
    });
  });
});
