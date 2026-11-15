import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/lib/toast/ToastProvider';
import ProjectDetailPage from './ProjectDetailPage';
import ProjectWorkspaceLayout from './ProjectWorkspaceLayout';
import * as projectsApi from './api';
import { PROJECT_MESSAGES } from './messages';

vi.mock('./api');

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'mgr-1',
      email: 'mgr@test.com',
      name: 'Gerente',
      role: 'manager',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
    },
  }),
}));

const sample = {
  id: 'p1',
  name: 'Alpha',
  description: 'Desc',
  owner_id: 'mgr-1',
  manager_id: 'mgr-1',
  priority: 'media' as const,
  tech_stack: ['Go'],
  meeting_link: 'https://meet.example.com/x',
  status: 'planificacion' as const,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

function renderDetail() {
  return render(
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
}

describe('HU_DN_02_23-26 — ProjectDetailPage', () => {
  beforeEach(() => {
    vi.mocked(projectsApi.getProject).mockResolvedValue(sample);
    vi.mocked(projectsApi.updateProject).mockResolvedValue({ ...sample, name: 'Beta' });
    vi.mocked(projectsApi.updateProjectStatus).mockResolvedValue({
      message: PROJECT_MESSAGES.statusUpdated,
    });
    vi.mocked(projectsApi.listActiveManagers).mockResolvedValue([
      { id: 'mgr-1', name: 'Gerente', email: 'mgr@test.com', role: 'manager', is_active: true },
    ]);
    vi.mocked(projectsApi.assignProjectManager).mockResolvedValue({
      message: PROJECT_MESSAGES.managerUpdated,
    });
    vi.mocked(projectsApi.listProjectMembers).mockResolvedValue([
      {
        user_id: 'mgr-1',
        name: 'Gerente',
        email: 'mgr@test.com',
        role: 'manager',
        joined_at: '2026-01-01T00:00:00Z',
      },
    ]);
    vi.mocked(projectsApi.getProjectHealth).mockResolvedValue({
      progress_percent: 0,
      velocity: 0,
      open_issues: 0,
    });
    vi.mocked(projectsApi.listActiveUsers).mockResolvedValue([
      {
        id: 'dev-2',
        name: 'Dev Dos',
        email: 'dev2@test.com',
        role: 'developer',
        is_active: true,
      },
    ]);
    vi.mocked(projectsApi.addProjectMember).mockResolvedValue({
      message: PROJECT_MESSAGES.memberAdded,
    });
  });

  it('shows summary and saves edits', async () => {
    const user = userEvent.setup();
    renderDetail();
    expect(await screen.findByRole('button', { name: 'Editar proyecto' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Editar proyecto' }));
    const nameInput = await screen.findByLabelText('Nombre');
    await user.clear(nameInput);
    await user.type(nameInput, 'Beta');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(projectsApi.updateProject).toHaveBeenCalled());
    expect(await screen.findByRole('status')).toHaveTextContent(PROJECT_MESSAGES.updated);
  });

  it('shows validation when edit name is cleared', async () => {
    const user = userEvent.setup();
    renderDetail();
    await screen.findByRole('button', { name: 'Editar proyecto' });
    await user.click(screen.getByRole('button', { name: 'Editar proyecto' }));
    const nameInput = await screen.findByLabelText('Nombre');
    await user.clear(nameInput);
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText(PROJECT_MESSAGES.nameRequired)).toBeInTheDocument();
  });

  it('renders summary without stack or meeting link', async () => {
    vi.mocked(projectsApi.getProject).mockResolvedValue({
      ...sample,
      tech_stack: [],
      meeting_link: null,
    });
    renderDetail();
    expect(await screen.findByRole('button', { name: 'Editar proyecto' })).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('reverts status and toasts on status update failure', async () => {
    vi.mocked(projectsApi.updateProjectStatus).mockRejectedValue(new Error('fail'));
    const user = userEvent.setup();
    renderDetail();
    await screen.findByRole('button', { name: 'Editar proyecto' });
    const statusSelect = screen.getByLabelText('Estado');
    expect(statusSelect).toHaveValue('planificacion');
    await user.selectOptions(statusSelect, 'activo');
    await waitFor(() => expect(statusSelect).toHaveValue('planificacion'));
    expect(await screen.findByRole('status')).toHaveTextContent(/No fue posible completar/i);
  });

  it('validates empty member selection', async () => {
    const user = userEvent.setup();
    renderDetail();
    await screen.findByRole('button', { name: 'Agregar miembro' });
    await user.click(screen.getByRole('button', { name: 'Agregar miembro' }));
    await user.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(await screen.findByText(PROJECT_MESSAGES.memberUserRequired)).toBeInTheDocument();
  });

  it('shows health indicators and adds a member', async () => {
    const user = userEvent.setup();
    renderDetail();
    await screen.findByRole('button', { name: 'Editar proyecto' });
    expect(await screen.findByText('Progreso')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Agregar miembro' }));
    const memberSelect = screen.getAllByRole('combobox').at(-1);
    if (!memberSelect) throw new Error('member select missing');
    await user.selectOptions(memberSelect, 'dev-2');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));
    await waitFor(() => expect(projectsApi.addProjectMember).toHaveBeenCalledWith('p1', 'dev-2'));
  });

  it('updates status from selector', async () => {
    const user = userEvent.setup();
    renderDetail();
    await screen.findByRole('button', { name: 'Editar proyecto' });
    await user.selectOptions(screen.getByLabelText('Estado'), 'activo');
    await waitFor(() =>
      expect(projectsApi.updateProjectStatus).toHaveBeenCalledWith('p1', 'activo'),
    );
  });
});
