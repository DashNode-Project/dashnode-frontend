import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/lib/toast/ToastProvider';
import ProjectDetailPage from './ProjectDetailPage';
import * as projectsApi from './api';
import { PROJECT_MESSAGES } from './messages';

vi.mock('./api');

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-1',
      email: 'admin@test.com',
      name: 'Admin',
      role: 'admin',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
    },
  }),
}));

const sample = {
  id: 'p1',
  name: 'Alpha',
  description: 'Desc',
  owner_id: 'admin-1',
  manager_id: 'mgr-1',
  priority: 'media' as const,
  tech_stack: [],
  meeting_link: null,
  status: 'planificacion' as const,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('HU_DN_02_26 — admin delete', () => {
  beforeEach(() => {
    vi.mocked(projectsApi.getProject).mockResolvedValue(sample);
    vi.mocked(projectsApi.deleteProject).mockResolvedValue({ message: PROJECT_MESSAGES.deleted });
    vi.stubGlobal('location', { href: '' });
  });

  it('confirms project deletion', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/proyectos/p1']}>
        <ToastProvider>
          <Routes>
            <Route path="/proyectos/:projectId" element={<ProjectDetailPage />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { name: 'Alpha' });
    await user.click(screen.getByRole('button', { name: 'Eliminar proyecto' }));
    expect(await screen.findByText(PROJECT_MESSAGES.deleteConfirm)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(projectsApi.deleteProject).toHaveBeenCalledWith('p1'));
  });
});
