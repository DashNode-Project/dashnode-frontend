import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Role } from '@/features/auth/types';
import * as authApi from '@/features/auth/api';
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
  createUserByAdmin: vi.fn(),
  inviteDeveloper: vi.fn(),
  updateUserByAdmin: vi.fn(),
  adminRequestPasswordReset: vi.fn(),
}));

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

describe('UsersPage', () => {
  beforeEach(() => {
    vi.mocked(authApi.listAdminUsers).mockResolvedValue([]);
    vi.mocked(authApi.createUserByAdmin).mockResolvedValue({
      message: USER_MESSAGES.userCreated,
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
    await user.type(screen.getByLabelText('Búsqueda por nombre'), 'zzz');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    expect(await screen.findByText(USER_MESSAGES.filterEmpty)).toBeInTheDocument();
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
    vi.mocked(authApi.inviteDeveloper).mockResolvedValue({ message: USER_MESSAGES.inviteSent });
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
    expect(await screen.findByText(USER_MESSAGES.inviteSent)).toBeInTheDocument();
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
    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    const nameInput = screen.getByLabelText('Nombre completo');
    await user.clear(nameInput);
    await user.type(nameInput, 'Robert');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText(USER_MESSAGES.userUpdated)).toBeInTheDocument();
  });
});
