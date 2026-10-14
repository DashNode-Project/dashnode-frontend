import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '@/features/auth/api';
import { NetworkError } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { USER_MESSAGES } from '@/features/users/messages';
import ProfilePage from './ProfilePage';

const applySessionUser = vi.fn();

const useAuthMock = vi.fn();

vi.mock('@/features/auth/api', () => ({
  fetchProfile: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
}));

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

const baseProfile = {
  id: '1',
  email: 'dev@test.com',
  name: 'Jhorman',
  role: 'developer',
  is_active: true,
  created_at: '2026-01-15T00:00:00Z',
  avatar_url: null as string | null,
  details: {
    last_name: 'Gómez',
    nickname: 'jgomez',
    description: 'Desarrollador.',
    experience: '',
    skills: ['React'],
    github: 'github.com/jgomez',
    linkedin: '',
    availability_text: '',
  },
};

describe('HU_DN_01_21 — ProfilePage', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      user: {
        id: '1',
        email: 'dev@test.com',
        name: 'Dev',
        role: 'developer',
        is_active: true,
        created_at: '2026-01-15T00:00:00Z',
      },
      applySessionUser,
    });
    vi.mocked(authApi.fetchProfile).mockResolvedValue({ profile: baseProfile });
    vi.mocked(authApi.updateProfile).mockResolvedValue({
      message: USER_MESSAGES.profileUpdated,
      profile: { ...baseProfile, name: 'Jhorman Actualizado' },
    });
    vi.mocked(authApi.changePassword).mockResolvedValue({
      message: 'Contraseña actualizada correctamente.',
      profile: baseProfile,
    });
  });

  it('loads demo-style header and personal info tab', async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: /Jhorman Gómez/i })).toBeInTheDocument();
    expect(screen.getAllByText('@jgomez').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('tab', { name: /Información personal/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Cambiar contraseña/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Habilidades/i })).toBeInTheDocument();
  });

  it('saves profile from edit mode', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: /Editar perfil/i }));
    const nameInput = screen.getByLabelText(/^Nombre$/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Jhorman Actualizado');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() =>
      expect(authApi.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Jhorman Actualizado' }),
      ),
    );
    expect(await screen.findByText(USER_MESSAGES.profileUpdated)).toBeInTheDocument();
  });

  it('changes password from dedicated tab', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('tab', { name: /Cambiar contraseña/i }));
    await user.type(screen.getByLabelText('Contraseña actual'), 'Actual123');
    await user.type(screen.getByLabelText('Nueva contraseña'), 'NuevaClave9');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'NuevaClave9');
    await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    await waitFor(() => expect(authApi.changePassword).toHaveBeenCalled());
  });

  it('shows load failure when profile request fails', async () => {
    vi.mocked(authApi.fetchProfile).mockRejectedValue(new NetworkError());
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    expect(await screen.findByText(MESSAGES.loadFailure)).toBeInTheDocument();
  });

  it('shows only personal and password tabs for admin', async () => {
    useAuthMock.mockReturnValue({
      user: {
        id: 'a1',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'admin',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
      },
      applySessionUser,
    });
    vi.mocked(authApi.fetchProfile).mockResolvedValue({
      profile: {
        ...baseProfile,
        role: 'admin',
        name: 'Admin',
        details: {},
      },
    });
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Información personal/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Cambiar contraseña/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Habilidades/i })).not.toBeInTheDocument();
  });
});
