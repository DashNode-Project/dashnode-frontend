import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '@/features/auth/api';
import { NetworkError } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { USER_MESSAGES } from '@/features/users/messages';
import ProfilePage from './ProfilePage';
import { ApiError } from '@/lib/api/errors';

const applySessionUser = vi.fn();

vi.mock('@/features/auth/api', () => ({
  fetchProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      email: 'dev@test.com',
      name: 'Dev',
      role: 'developer',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
    },
    applySessionUser,
  }),
}));

describe('HU_DN_01_21 — ProfilePage', () => {
  beforeEach(() => {
    vi.mocked(authApi.fetchProfile).mockResolvedValue({
      profile: {
        id: '1',
        email: 'dev@test.com',
        name: 'Dev Original',
        role: 'developer',
        avatar_url: null,
      },
    });
    vi.mocked(authApi.updateProfile).mockResolvedValue({
      message: USER_MESSAGES.profileUpdated,
      profile: {
        id: '1',
        email: 'dev@test.com',
        name: 'Dev Actualizado',
        role: 'developer',
        avatar_url: '/api/v1/auth/profile/avatar',
      },
    });
  });

  it('loads profile and saves a new name', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    expect(await screen.findByLabelText('Nombre completo')).toHaveValue('Dev Original');
    await user.clear(screen.getByLabelText('Nombre completo'));
    await user.type(screen.getByLabelText('Nombre completo'), 'Dev Actualizado');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(screen.getByText(USER_MESSAGES.profileUpdated)).toBeInTheDocument());
    expect(applySessionUser).toHaveBeenCalled();
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

  it('shows API error banner on profile update failure', async () => {
    vi.mocked(authApi.updateProfile).mockRejectedValue(
      new ApiError(400, { code: 'SERVER', message: 'Error del servidor', fields: {} }),
    );
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    await screen.findByLabelText('Nombre completo');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Error del servidor')).toBeInTheDocument();
  });

  it('shows avatar validation from API', async () => {
    vi.mocked(authApi.updateProfile).mockRejectedValue(
      new ApiError(400, {
        code: 'AVATAR_INVALID',
        message: USER_MESSAGES.avatarInvalid,
        fields: {},
      }),
    );
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    await screen.findByLabelText('Nombre completo');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText(USER_MESSAGES.avatarInvalid)).toBeInTheDocument();
  });
});
