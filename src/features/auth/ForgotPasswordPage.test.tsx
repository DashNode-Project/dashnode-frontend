import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PATHS } from '@/app/paths';
import { renderApp } from '@/test/app';
import { mockApi, ok } from '@/test/fetchMock';
import { AUTH_MESSAGES } from './messages';

describe('HU_DN_01_06 - request password reset', () => {
  it('shows the form and disables submit while empty', async () => {
    mockApi({});
    renderApp(PATHS.forgotPassword);
    expect(
      await screen.findByRole('heading', { name: 'Restablecer contraseña' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar enlace' })).toBeDisabled();
  });

  it('shows agnostic success from the server', async () => {
    mockApi({
      passwordResetRequest: () => ok({ message: AUTH_MESSAGES.passwordResetRequestSuccess }),
    });
    const user = userEvent.setup();
    renderApp(PATHS.forgotPassword);
    await user.type(await screen.findByLabelText('Correo electrónico'), 'ana@dominio.com');
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }));
    expect(await screen.findByText(AUTH_MESSAGES.passwordResetRequestSuccess)).toBeInTheDocument();
  });

  it('validates e-mail format on the client', async () => {
    mockApi({});
    const user = userEvent.setup();
    renderApp(PATHS.forgotPassword);
    await user.type(await screen.findByLabelText('Correo electrónico'), 'bad');
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }));
    expect(await screen.findByText(AUTH_MESSAGES.emailInvalid)).toBeInTheDocument();
  });
});
