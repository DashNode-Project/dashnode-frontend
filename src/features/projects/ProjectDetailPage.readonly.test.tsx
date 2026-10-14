import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/lib/toast/ToastProvider';
import ProjectDetailPage from './ProjectDetailPage';
import ProjectWorkspaceLayout from './ProjectWorkspaceLayout';
import * as projectsApi from './api';

vi.mock('./api');

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'dev-1',
      email: 'dev@test.com',
      name: 'Dev',
      role: 'developer',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
    },
  }),
}));

describe('ProjectDetailPage readonly developer', () => {
  beforeEach(() => {
    vi.mocked(projectsApi.getProject).mockResolvedValue({
      id: 'p1',
      name: 'Alpha',
      description: 'Desc',
      owner_id: 'mgr-1',
      manager_id: 'mgr-1',
      priority: 'media',
      tech_stack: [],
      meeting_link: null,
      status: 'planificacion',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    });
    vi.mocked(projectsApi.listProjectMembers).mockResolvedValue([]);
    vi.mocked(projectsApi.getProjectHealth).mockResolvedValue({
      progress_percent: 0,
      velocity: 0,
      open_issues: 0,
    });
  });

  it('hides management actions for developers', async () => {
    render(
      <MemoryRouter initialEntries={['/proyectos/p1/resumen']}>
        <ToastProvider>
          <Routes>
            <Route path="/proyectos/:projectId" element={<ProjectWorkspaceLayout />}>
              <Route path="resumen" element={<ProjectDetailPage />} />
            </Route>
          </Routes>
        </ToastProvider>
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('navigation', { name: 'Módulos del proyecto' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar proyecto' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar proyecto' })).not.toBeInTheDocument();
  });
});
