import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Role } from '@/features/auth/types';
import * as authApi from '@/features/auth/api';
import { ApiError, NetworkError } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { USER_MESSAGES } from './messages';
import UsersPage from './UsersPage';

const sessionUser = {
  id: '1',
  email: 'admin@test.com',
  name: 'Admin',
  role: 'admin' as Role,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
};

const useAuthMock = vi.fn(() => ({
  user: sessionUser,
  expiresAt: '2026-01-01T08:00:00Z',
  loading: false,
}));

vi.mock('@/features/auth/api', () => ({
  listAdminUsers: vi.fn(),
  listManagerDevelopers: vi.fn(),
  createUserByAdmin: vi.fn(),
  inviteDeveloper: vi.fn(),
  updateUserByAdmin: vi.fn(),
  adminRequestPasswordReset: vi.fn(),
  deactivateUserByAdmin: vi.fn(),
  reactivateUserByAdmin: vi.fn(),
  deactivateDeveloperByManager: vi.fn(),
  reactivateDeveloperByManager: vi.fn(),
  fetchPendingAssignments: vi.fn(),
}));

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

describe('UsersPage', () => {
  beforeEach(() => {
    vi.mocked(authApi.listAdminUsers).mockResolvedValue([]);
    vi.mocked(authApi.listManagerDevelopers).mockResolvedValue([]);
    vi.mocked(authApi.createUserByAdmin).mockResolvedValue({
      message: USER_MESSAGES.userCreated,
    });
    vi.mocked(authApi.fetchPendingAssignments).mockResolvedValue({ pending_count: 0 });
    vi.mocked(authApi.deactivateUserByAdmin).mockResolvedValue({
      message: USER_MESSAGES.userDeactivated,
    });
    vi.mocked(authApi.reactivateUserByAdmin).mockResolvedValue({
      message: USER_MESSAGES.userReactivated,
    });
  });

  it('shows admin heading and create action', async () => {
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'admin' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Usuarios' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nuevo usuario/i })).toBeInTheDocument();
  });

  it('shows empty list message when there are no users', async () => {
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'admin' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/No hay usuarios registrados/i)).toBeInTheDocument();
  });

  it('opens create user dialog', async () => {
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'admin' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: /Nuevo usuario/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Crear usuario' })).toBeInTheDocument();
  });

  it('submits create user form', async () => {
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'admin' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: /Nuevo usuario/i }));
    await user.type(screen.getByLabelText('Nombre completo'), 'Nuevo');
    await user.type(screen.getByLabelText('Correo electrónico'), 'nuevo@empresa.com');
    await user.click(screen.getByRole('button', { name: 'Crear usuario' }));
    await waitFor(() =>
      expect(authApi.createUserByAdmin).toHaveBeenCalledWith({
        name: 'Nuevo',
        email: 'nuevo@empresa.com',
        role: 'developer',
      }),
    );
    expect(await screen.findByText(USER_MESSAGES.userCreated)).toBeInTheDocument();
  });

  it('filters admin list when a role tab is selected', async () => {
    vi.mocked(authApi.listAdminUsers).mockResolvedValue([
      {
        id: '1',
        name: 'Bob',
        email: 'bob@empresa.com',
        role: 'developer',
        is_active: true,
      },
      {
        id: '2',
        name: 'Lead',
        email: 'lead@empresa.com',
        role: 'manager',
        is_active: true,
      },
    ]);
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'admin' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    await screen.findByText('Bob');
    await user.click(screen.getByRole('tab', { name: /Gerentes/i }));
    expect(screen.getByText('Lead')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('renders user rows when list returns data', async () => {
    vi.mocked(authApi.listAdminUsers).mockResolvedValue([
      {
        id: '1',
        name: 'Bob',
        email: 'bob@empresa.com',
        role: 'developer',
        is_active: true,
      },
    ]);
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'admin' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('opens password reset confirmation', async () => {
    vi.mocked(authApi.listAdminUsers).mockResolvedValue([
      {
        id: '1',
        name: 'Bob',
        email: 'bob@empresa.com',
        role: 'developer',
        is_active: true,
      },
    ]);
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'admin' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: 'Restablecer contraseña' }));
    expect(screen.getByRole('heading', { name: 'Restablecer contraseña' })).toBeInTheDocument();
  });

  it('shows filter empty message after applying filters', async () => {
    vi.mocked(authApi.listAdminUsers).mockResolvedValue([]);
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'admin' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    await screen.findByText(USER_MESSAGES.emptyList);
    await user.type(screen.getByPlaceholderText(/Buscar por nombre/i), 'zzz');
    await waitFor(() => {
      expect(screen.getByText(USER_MESSAGES.filterEmpty)).toBeInTheDocument();
    });
  });

  it('shows invite developer for manager', async () => {
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'manager' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('button', { name: /Invitar Desarrollador/i }),
    ).toBeInTheDocument();
  });

  it('submits manager invite', async () => {
    vi.mocked(authApi.inviteDeveloper).mockResolvedValue({
      message: USER_MESSAGES.inviteSent,
      user_id: 'dev-new',
    });
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'manager' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: /Invitar Desarrollador/i }));
    await user.type(screen.getByLabelText('Nombre completo'), 'Dev');
    await user.type(screen.getByLabelText('Correo electrónico'), 'dev@empresa.com');
    await user.click(screen.getByRole('button', { name: 'Enviar invitación' }));
    expect(await screen.findByText(new RegExp(USER_MESSAGES.inviteSent))).toBeInTheDocument();
    expect(screen.queryByText(/Contraseña inicial/i)).not.toBeInTheDocument();
  });

  it('submits edit user form', async () => {
    vi.mocked(authApi.listAdminUsers).mockResolvedValue([
      {
        id: '1',
        name: 'Bob',
        email: 'bob@empresa.com',
        role: 'developer',
        is_active: true,
      },
    ]);
    vi.mocked(authApi.updateUserByAdmin).mockResolvedValue({
      message: USER_MESSAGES.userUpdated,
      user: {
        id: '1',
        name: 'Robert',
        email: 'bob@empresa.com',
        role: 'developer',
        is_active: true,
      },
    });
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'admin' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: 'Editar usuario' }));
    const nameInput = screen.getByLabelText('Nombre completo');
    await user.clear(nameInput);
    await user.type(nameInput, 'Robert');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText(USER_MESSAGES.userUpdated)).toBeInTheDocument();
  });

  it('confirms user deactivation with pending tasks notice', async () => {
    vi.mocked(authApi.listAdminUsers).mockResolvedValue([
      {
        id: '2',
        name: 'Carlos',
        email: 'carlos@empresa.com',
        role: 'developer',
        is_active: true,
      },
    ]);
    vi.mocked(authApi.fetchPendingAssignments).mockResolvedValue({ pending_count: 3 });
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'admin' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: 'Desactivar usuario' }));
    expect(await screen.findByText(USER_MESSAGES.pendingTasksNotice(3))).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByText(USER_MESSAGES.userDeactivated)).toBeInTheDocument();
  });

  it('reactivates an inactive user', async () => {
    vi.mocked(authApi.listAdminUsers).mockResolvedValue([
      {
        id: '3',
        name: 'Inactivo',
        email: 'off@empresa.com',
        role: 'developer',
        is_active: false,
      },
    ]);
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'admin' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: 'Reactivar usuario' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByText(USER_MESSAGES.userReactivated)).toBeInTheDocument();
  });

  it('shows blocked message when admin cannot deactivate target', async () => {
    vi.mocked(authApi.listAdminUsers).mockResolvedValue([
      {
        id: '9',
        name: 'Self',
        email: 'self@empresa.com',
        role: 'admin',
        is_active: true,
      },
    ]);
    vi.mocked(authApi.deactivateUserByAdmin).mockRejectedValue(
      new ApiError(400, {
        code: 'SELF_DEACTIVATE_BLOCKED',
        message: USER_MESSAGES.selfDeactivateBlocked,
        fields: {},
      }),
    );
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'admin' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: 'Desactivar usuario' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByText(USER_MESSAGES.selfDeactivateBlocked)).toBeInTheDocument();
  });

  it('shows pending load failure for API errors in deactivate dialog', async () => {
    vi.mocked(authApi.listAdminUsers).mockResolvedValue([
      {
        id: '2',
        name: 'Carlos',
        email: 'carlos@empresa.com',
        role: 'developer',
        is_active: true,
      },
    ]);
    vi.mocked(authApi.fetchPendingAssignments).mockRejectedValue(
      new ApiError(500, { code: 'SERVER', message: 'x', fields: {} }),
    );
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'admin' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: 'Desactivar usuario' }));
    expect(await screen.findByText(USER_MESSAGES.pendingLoadFailure)).toBeInTheDocument();
  });

  it('shows pending load failure in deactivate dialog', async () => {
    vi.mocked(authApi.listAdminUsers).mockResolvedValue([
      {
        id: '2',
        name: 'Carlos',
        email: 'carlos@empresa.com',
        role: 'developer',
        is_active: true,
      },
    ]);
    vi.mocked(authApi.fetchPendingAssignments).mockRejectedValue(new NetworkError());
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'admin' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: 'Desactivar usuario' }));
    expect(await screen.findByText(USER_MESSAGES.pendingLoadFailure)).toBeInTheDocument();
  });

  it('shows manager deactivate blocked message', async () => {
    vi.mocked(authApi.listAdminUsers).mockResolvedValue([
      {
        id: '5',
        name: 'Lead',
        email: 'lead@empresa.com',
        role: 'manager',
        is_active: true,
      },
    ]);
    vi.mocked(authApi.deactivateUserByAdmin).mockRejectedValue(
      new ApiError(400, {
        code: 'MANAGER_DEACTIVATE_BLOCKED',
        message: USER_MESSAGES.managerDeactivateBlocked,
        fields: {},
      }),
    );
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'admin' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: 'Desactivar usuario' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByText(USER_MESSAGES.managerDeactivateBlocked)).toBeInTheDocument();
  });

  it('shows technical failure on deactivate error', async () => {
    vi.mocked(authApi.listAdminUsers).mockResolvedValue([
      {
        id: '2',
        name: 'Carlos',
        email: 'carlos@empresa.com',
        role: 'developer',
        is_active: true,
      },
    ]);
    vi.mocked(authApi.deactivateUserByAdmin).mockRejectedValue(new NetworkError());
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'admin' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: 'Desactivar usuario' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByText(MESSAGES.technicalFailure)).toBeInTheDocument();
  });

  it('shows reactivate validation message from API', async () => {
    vi.mocked(authApi.listAdminUsers).mockResolvedValue([
      {
        id: '3',
        name: 'Inactivo',
        email: 'off@empresa.com',
        role: 'developer',
        is_active: false,
      },
    ]);
    vi.mocked(authApi.reactivateUserByAdmin).mockRejectedValue(
      new ApiError(400, {
        code: 'REACTIVATE_NOT_INACTIVE',
        message: 'Solo se pueden reactivar usuarios desactivados.',
        fields: {},
      }),
    );
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'admin' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: 'Reactivar usuario' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(
      await screen.findByText('Solo se pueden reactivar usuarios desactivados.'),
    ).toBeInTheDocument();
  });

  it('filters manager developers with live search', async () => {
    vi.mocked(authApi.listManagerDevelopers).mockResolvedValue([
      {
        id: 'd1',
        name: 'Alice Dev',
        email: 'alice@empresa.com',
        status: 'active',
        is_active: true,
      },
      {
        id: 'd2',
        name: 'Zorro Dev',
        email: 'z@empresa.com',
        status: 'active',
        is_active: true,
      },
    ]);
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'manager' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    await screen.findByText('Alice Dev');
    await user.type(screen.getByPlaceholderText(/Buscar desarrollador/i), 'Alice');
    await waitFor(() => {
      expect(screen.getByText('Alice Dev')).toBeInTheDocument();
      expect(screen.queryByText('Zorro Dev')).not.toBeInTheDocument();
    });
  });

  it('lists manager developers with invitation status badges', async () => {
    vi.mocked(authApi.listManagerDevelopers).mockResolvedValue([
      {
        id: 'd1',
        name: 'Dev One',
        email: 'dev@empresa.com',
        status: 'pending',
        is_active: false,
      },
      {
        id: 'd2',
        name: 'Dev Two',
        email: 'dev2@empresa.com',
        status: 'active',
        is_active: true,
      },
    ]);
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'manager' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Dev One')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Completado')).toBeInTheDocument();
  });

  it('shows load failure when manager cannot load developers', async () => {
    vi.mocked(authApi.listManagerDevelopers).mockRejectedValue(new NetworkError());
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'manager' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText(MESSAGES.loadFailure)).toBeInTheDocument();
  });

  it('manager reactivates an inactive developer', async () => {
    vi.mocked(authApi.listManagerDevelopers).mockResolvedValue([
      {
        id: 'd3',
        name: 'Dev Off',
        email: 'off@empresa.com',
        status: 'inactive',
        is_active: false,
      },
    ]);
    vi.mocked(authApi.reactivateDeveloperByManager).mockResolvedValue({
      message: USER_MESSAGES.userReactivated,
    });
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'manager' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: 'Reactivar desarrollador' }));
    await waitFor(() => expect(authApi.reactivateDeveloperByManager).toHaveBeenCalledWith('d3'));
  });

  it('manager deactivates an active developer from the team table', async () => {
    vi.mocked(authApi.listManagerDevelopers).mockResolvedValue([
      {
        id: 'd2',
        name: 'Dev Two',
        email: 'dev2@empresa.com',
        status: 'active',
        is_active: true,
      },
    ]);
    vi.mocked(authApi.deactivateDeveloperByManager).mockResolvedValue({
      message: USER_MESSAGES.userDeactivated,
    });
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'manager' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: 'Desactivar desarrollador' }));
    await waitFor(() => expect(authApi.deactivateDeveloperByManager).toHaveBeenCalledWith('d2'));
  });

  it('shows technical failure on reactivate error', async () => {
    vi.mocked(authApi.listAdminUsers).mockResolvedValue([
      {
        id: '3',
        name: 'Inactivo',
        email: 'off@empresa.com',
        role: 'developer',
        is_active: false,
      },
    ]);
    vi.mocked(authApi.reactivateUserByAdmin).mockRejectedValue(new NetworkError());
    useAuthMock.mockReturnValue({
      user: { ...sessionUser, role: 'admin' },
      expiresAt: '2026-01-01T08:00:00Z',
      loading: false,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: 'Reactivar usuario' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByText(MESSAGES.technicalFailure)).toBeInTheDocument();
  });
});
