import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ToastProvider } from '@/lib/toast/ToastProvider';
import ProjectDevOpsTab from './ProjectDevOpsTab';
import * as api from './api';
import { DEVOPS_MESSAGES } from './messages';

vi.mock('./api');

describe('ProjectDevOpsTab', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows empty state when not configured and can edit', async () => {
    vi.mocked(api.fetchDevOpsProfile).mockResolvedValue({
      project_id: 'p-1',
      is_configured: false,
      can_edit: true,
      pipeline_stages: [],
      environments: [],
    });

    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/proyectos/p-1/devops']}>
          <Routes>
            <Route path="/proyectos/:projectId/devops" element={<ProjectDevOpsTab />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(DEVOPS_MESSAGES.emptyTitle)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: DEVOPS_MESSAGES.emptyAction })).toBeInTheDocument();
  });

  it('shows profile summary when configured', async () => {
    vi.mocked(api.fetchDevOpsProfile).mockResolvedValue({
      project_id: 'p-1',
      is_configured: true,
      can_edit: true,
      ci_cd_provider: 'GitHub Actions',
      pipeline_stages: [
        {
          order: 1,
          name: 'Lint',
          tool: 'Ruff',
          commands: 'ruff check .',
          trigger_event: 'PR',
          is_required: true,
        },
      ],
      environments: [],
      quality_gates_md: 'Cobertura 80%',
    });

    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/proyectos/p-1/devops']}>
          <Routes>
            <Route path="/proyectos/:projectId/devops" element={<ProjectDevOpsTab />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('GitHub Actions')).toBeInTheDocument();
    });
    expect(screen.getByText('ruff check .')).toBeInTheDocument();
    expect(screen.getByText('Cobertura 80%')).toBeInTheDocument();
  });
});
