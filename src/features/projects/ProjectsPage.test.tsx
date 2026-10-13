import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/lib/toast/ToastProvider';
import ProjectsPage from './ProjectsPage';
import * as projectsApi from './api';
import { ApiError } from '@/lib/api/errors';
import { PROJECT_MESSAGES } from './messages';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <ProjectsPage />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('HU_DN_02_22 — ProjectsPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    vi.mocked(projectsApi.listProjects).mockResolvedValue([
      {
        id: 'p1',
        name: 'Alpha',
        description: 'Desc',
        owner_id: 'mgr-1',
        manager_id: 'mgr-1',
        priority: 'media',
        tech_stack: ['React'],
        meeting_link: null,
        status: 'planificacion',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ]);
    vi.mocked(projectsApi.listActiveManagers).mockResolvedValue([
      {
        id: 'mgr-1',
        name: 'Gerente',
        email: 'mgr@test.com',
        role: 'manager',
        is_active: true,
      },
    ]);
    vi.mocked(projectsApi.createProject).mockResolvedValue({
      id: 'p-new',
      name: 'Nuevo',
      description: '',
      owner_id: 'mgr-1',
      manager_id: 'mgr-1',
      priority: 'media',
      tech_stack: [],
      meeting_link: null,
      status: 'planificacion',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    });
  });

  it('lists projects and opens create dialog with validation', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Proyectos' })).toBeInTheDocument();
    expect(await screen.findByText('Alpha')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Nuevo proyecto' }));
    expect(await screen.findByRole('heading', { name: 'Crear proyecto' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear proyecto' }));
    expect(await screen.findByText(PROJECT_MESSAGES.nameRequired)).toBeInTheDocument();
  });

  it('creates a project and navigates to detail', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Nuevo proyecto' }));
    await user.type(screen.getByLabelText('Nombre'), 'Nuevo');
    await user.click(screen.getByRole('button', { name: 'Crear proyecto' }));

    await waitFor(() => {
      expect(projectsApi.createProject).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/proyectos/p-new/resumen');
    });
    expect(await screen.findByRole('status')).toHaveTextContent(PROJECT_MESSAGES.created);
  });

  it('filters projects by status', async () => {
    vi.mocked(projectsApi.listProjects).mockResolvedValue([
      {
        id: 'p1',
        name: 'Alpha',
        description: '',
        owner_id: 'mgr-1',
        manager_id: 'mgr-1',
        priority: 'media',
        tech_stack: [],
        meeting_link: null,
        status: 'planificacion',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'p2',
        name: 'Beta',
        description: '',
        owner_id: 'mgr-1',
        manager_id: 'mgr-1',
        priority: 'alta',
        tech_stack: [],
        meeting_link: null,
        status: 'activo',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ]);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Alpha');
    expect(screen.getByText('Beta')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'activo');
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('shows empty state and cancels create dialog', async () => {
    vi.mocked(projectsApi.listProjects).mockResolvedValue([]);
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByText(PROJECT_MESSAGES.noProjectsAssigned)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Crear proyecto' }));
    expect(await screen.findByRole('heading', { name: 'Crear proyecto' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('heading', { name: 'Crear proyecto' })).not.toBeInTheDocument();
  });

  it('toasts when listing managers fails', async () => {
    vi.mocked(projectsApi.listActiveManagers).mockRejectedValue(new Error('network'));
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Nuevo proyecto' }));
    expect(await screen.findByRole('status')).toHaveTextContent(/No fue posible cargar/i);
  });

  it('toasts technical failure when create fails unexpectedly', async () => {
    vi.mocked(projectsApi.createProject).mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Nuevo proyecto' }));
    await user.type(screen.getByLabelText('Nombre'), 'X');
    await user.click(screen.getByRole('button', { name: 'Crear proyecto' }));
    expect(await screen.findByRole('status')).toHaveTextContent(/No fue posible completar/i);
  });

  it('toasts access message when listing projects fails with ApiError', async () => {
    vi.mocked(projectsApi.listProjects).mockRejectedValue(
      new ApiError(403, { code: 'ACCESS_DENIED', message: 'Acceso denegado.', fields: {} }),
    );
    renderPage();
    expect(await screen.findByText('Acceso denegado.')).toBeInTheDocument();
  });

  it('maps server validation fields on create', async () => {
    vi.mocked(projectsApi.createProject).mockRejectedValue(
      new ApiError(400, {
        code: 'PROJECT_VALIDATION',
        message: 'La solicitud no es válida.',
        fields: {
          name: PROJECT_MESSAGES.nameRequired,
          manager_id: PROJECT_MESSAGES.managerRequired,
          meeting_link: PROJECT_MESSAGES.meetingLinkInvalid,
        },
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Nuevo proyecto' }));
    await user.type(screen.getByLabelText('Nombre'), 'Ok');
    await user.type(screen.getByLabelText('Enlace de reunión predeterminado'), 'bad');
    await user.click(screen.getByRole('button', { name: 'Crear proyecto' }));
    expect(await screen.findByText(PROJECT_MESSAGES.meetingLinkInvalid)).toBeInTheDocument();
  });

  it('maps server name and manager field errors on create', async () => {
    vi.mocked(projectsApi.createProject).mockRejectedValue(
      new ApiError(400, {
        code: 'PROJECT_VALIDATION',
        message: 'La solicitud no es válida.',
        fields: {
          name: PROJECT_MESSAGES.nameRequired,
          manager_id: PROJECT_MESSAGES.managerRequired,
        },
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Nuevo proyecto' }));
    await user.type(screen.getByLabelText('Nombre'), 'Valid');
    await user.click(screen.getByRole('button', { name: 'Crear proyecto' }));
    expect(await screen.findByText(PROJECT_MESSAGES.nameRequired)).toBeInTheDocument();
    expect(screen.getByText(PROJECT_MESSAGES.managerRequired)).toBeInTheDocument();
  });
});
