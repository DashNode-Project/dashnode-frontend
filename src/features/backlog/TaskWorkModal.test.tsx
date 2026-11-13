import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as issuesApi from '@/features/issues/api';
import { ISSUE_MESSAGES } from '@/features/issues/messages';
import { TaskWorkModal } from './TaskWorkModal';
import type { StoryTaskDTO, UserStoryDTO } from './types';

vi.mock('@/features/issues/api');

const useAuthMock = vi.fn(() => ({
  user: {
    id: 'dev-1',
    name: 'Dev One',
    email: 'dev1@dashnode.io',
    role: 'developer',
  },
}));

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

const story: UserStoryDTO = {
  id: 'hu-1',
  epic_id: 'ep-1',
  project_id: 'p-1',
  title: 'HU Login',
  user_role: 'Usuario',
  reason: 'Iniciar sesión',
  acceptance_criteria: '',
  moscow_priority: 'must_have',
  story_points: 5,
  estimation_mode: 'story',
  sprint_id: 'sp-1',
  sort_order: 1,
  created_at: '2026-11-01T10:00:00Z',
  updated_at: '2026-11-01T10:00:00Z',
};

const baseTask: StoryTaskDTO = {
  id: 'task-1',
  user_story_id: 'hu-1',
  project_id: 'p-1',
  name: 'Validar token JWT',
  task_type: 'backend',
  notes: '',
  status: 'IN_PROGRESS',
  assignee_id: 'dev-1',
  estimated_hours: '4',
  story_points: null,
  logged_hours: '1',
  label: '',
  created_at: '2026-11-01T10:00:00Z',
  updated_at: '2026-11-01T10:00:00Z',
};

describe('TaskWorkModal report fix integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({
      user: {
        id: 'dev-1',
        name: 'Dev One',
        email: 'dev1@dashnode.io',
        role: 'developer',
      },
    });
  });

  it('opens Reportar fix prefilled with Fix: <task.name> and calls reportTaskFix', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn().mockResolvedValue(undefined);
    const showToast = vi.fn();

    vi.mocked(issuesApi.reportTaskFix).mockResolvedValueOnce({
      message: ISSUE_MESSAGES.TASK_FIX_REPORTED,
      task_status: 'CORRECTION',
      issue: {
        id: 'fix-1',
        project_id: 'p-1',
        title: 'Fix: Validar token JWT',
        severity: 'high',
        type: 'bug',
        status: 'open',
        reporter_id: 'dev-1',
        reporter_name: 'Dev One',
        version: 1,
        created_at: '2026-11-10T10:00:00Z',
        updated_at: '2026-11-10T10:00:00Z',
        evidences_count: 0,
      },
    });

    render(
      <TaskWorkModal
        projectId="p-1"
        story={story}
        task={baseTask}
        members={[]}
        memberMap={new Map()}
        canWork={true}
        submitting={false}
        setSubmitting={vi.fn()}
        onClose={vi.fn()}
        onSaved={onSaved}
        notifyError={vi.fn()}
        showToast={showToast}
      />,
    );

    await user.click(screen.getByRole('button', { name: /reportar fix/i }));

    const titleInput = screen.getByLabelText(/título \*/i) as HTMLInputElement;
    expect(titleInput.value).toBe('Fix: Validar token JWT');

    await user.type(screen.getByLabelText(/descripción/i), 'Falla al verificar expiración');
    await user.selectOptions(screen.getByLabelText(/severidad \*/i), 'high');
    await user.click(screen.getAllByRole('button', { name: 'Reportar fix' }).at(-1)!);

    await waitFor(() => {
      expect(issuesApi.reportTaskFix).toHaveBeenCalledWith(
        'p-1',
        'task-1',
        expect.objectContaining({
          title: 'Fix: Validar token JWT',
          description: 'Falla al verificar expiración',
          severity: 'high',
          type: 'bug',
        }),
      );
      expect(showToast).toHaveBeenCalledWith(ISSUE_MESSAGES.TASK_FIX_REPORTED, 'success');
      expect(onSaved).toHaveBeenCalled();
    });
  });

  it('hides Reportar fix when developer is not the task assignee', () => {
    render(
      <TaskWorkModal
        projectId="p-1"
        story={story}
        task={{ ...baseTask, assignee_id: 'dev-2' }}
        members={[]}
        memberMap={new Map()}
        canWork={true}
        submitting={false}
        setSubmitting={vi.fn()}
        onClose={vi.fn()}
        onSaved={vi.fn().mockResolvedValue(undefined)}
        notifyError={vi.fn()}
        showToast={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /reportar fix/i })).not.toBeInTheDocument();
  });
});
