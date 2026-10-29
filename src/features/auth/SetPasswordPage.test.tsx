import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PATHS } from '@/app/paths';
import { currentPath, renderApp } from '@/test/app';
import { TEST_PASSWORD } from '@/test/factories';
import { apiError, mockApi, ok } from '@/test/fetchMock';
import { AUTH_MESSAGES } from './messages';

describe('HU_DN_01_07 - set password via link', () => {
  it('shows invalid link banner when token is missing', async () => {
    mockApi({});
    renderApp(PATHS.setPassword);
    expect(await screen.findByText(AUTH_MESSAGES.invalidOrExpiredLink)).toBeInTheDocument();
  });

  it('establishes password and redirects to login with success flash', async () => {
    mockApi({
      passwordResetConfirm: () => ok({ message: AUTH_MESSAGES.passwordSetSuccess }),
    });
    const user = userEvent.setup();
    renderApp(`${PATHS.setPassword}?token=abc123`);
    await user.type(await screen.findByLabelText('Nueva contraseña'), TEST_PASSWORD);
    await user.type(screen.getByLabelText('Confirmar contraseña'), TEST_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    expect(await screen.findByRole('heading', { name: 'Inicio de sesión' })).toBeInTheDocument();
    expect(currentPath()).toBe(PATHS.login);
    expect(await screen.findByText(AUTH_MESSAGES.passwordSetSuccess)).toBeInTheDocument();
  });

  it('shows expired link message from the server', async () => {
    mockApi({
      passwordResetConfirm: () =>
        apiError(400, 'INVALID_OR_EXPIRED_LINK', AUTH_MESSAGES.invalidOrExpiredLink),
    });
    const user = userEvent.setup();
    renderApp(`${PATHS.setPassword}?token=used`);
    await user.type(await screen.findByLabelText('Nueva contraseña'), TEST_PASSWORD);
    await user.type(screen.getByLabelText('Confirmar contraseña'), TEST_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    expect(await screen.findByText(AUTH_MESSAGES.invalidOrExpiredLink)).toBeInTheDocument();
  });
});
