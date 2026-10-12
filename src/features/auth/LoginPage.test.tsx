import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Link, MemoryRouter, useLocation } from 'react-router';
import { AppRoutes } from '@/app/App';
import { PATHS } from '@/app/paths';
import { makeSession, TEST_PASSWORD } from '@/test/factories';
import { apiError, mockFetch, ok } from '@/test/fetchMock';
import type { Role } from './types';

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function renderApp(path: string = PATHS.login) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Link to={PATHS.homeAdmin}>ir-admin</Link>
      <Link to={PATHS.homeManager}>ir-gerente</Link>
      <Link to={PATHS.login}>ir-login</Link>
      <Where />
      <AppRoutes />
    </MemoryRouter>,
  );
}

const submit = () => screen.getByRole('button', { name: 'Iniciar sesión' });

async function typeCredentials(
  user: ReturnType<typeof userEvent.setup>,
  email = 'ana@dominio.com',
  password = TEST_PASSWORD,
) {
  await user.type(await screen.findByLabelText('Correo electrónico'), email);
  await user.type(screen.getByLabelText('Contraseña'), password);
}

describe('HU_DN_01_03 - form (criteria 1 and 2)', () => {
  it('shows the e-mail and password fields, the forgot link and the registration link', async () => {
    renderApp();
    expect(await screen.findByRole('heading', { name: 'Inicio de sesión' })).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toBeRequired();
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: '¿Olvidó su contraseña?' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Registrarme como Gerente' })).toHaveAttribute(
      'href',
      PATHS.register,
    );
  });

  it("disables 'Iniciar sesión' while a field is empty (2.3)", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByLabelText('Contraseña');
    expect(submit()).toBeDisabled();
    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@dominio.com');
    expect(submit()).toBeDisabled();
    await user.type(screen.getByLabelText('Contraseña'), TEST_PASSWORD);
    expect(submit()).toBeEnabled();
  });

  it('can reveal the password (2.2)', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.type(await screen.findByLabelText('Contraseña'), TEST_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text');
  });

  it('validates the e-mail format before calling the server (2.1)', async () => {
    const calls = mockFetch(() => ok({}));
    const user = userEvent.setup();
    renderApp();
    await typeCredentials(user, 'sin-formato');
    await user.click(submit());
    expect(
      await screen.findByText('El correo electrónico ingresado no tiene un formato válido.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toHaveFocus();
    expect(calls).toHaveLength(0);
  });

  it('is accessible', async () => {
    const { container } = renderApp();
    await screen.findByLabelText('Contraseña');
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('HU_DN_01_03 - success by role (criteria 3 and 5)', () => {
  it.each<[Role, string, string]>([
    ['admin', 'Administrador', PATHS.homeAdmin],
    ['manager', 'Gerente', PATHS.homeManager],
    ['developer', 'Desarrollador', PATHS.homeDeveloper],
  ])('sends the %s to their own start screen', async (role, label, path) => {
    const session = makeSession(role);
    const calls = mockFetch(() => ok(session));
    const user = userEvent.setup();
    renderApp();
    await typeCredentials(user, `  ${session.user.email}  `);
    await user.click(submit());

    expect(
      await screen.findByRole('heading', { name: `Bienvenido, ${session.user.name}` }),
    ).toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      url: '/api/v1/auth/login',
      method: 'POST',
      credentials: 'include',
      body: { email: session.user.email, password: TEST_PASSWORD },
    });
    expect(screen.getByTestId('where')).toHaveTextContent(path);
  });

  it('does not leave credentials or tokens in web storage or the DOM', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    mockFetch(() => ok(makeSession('manager')));
    const user = userEvent.setup();
    const { container } = renderApp();
    await typeCredentials(user);
    await user.click(submit());
    await screen.findByRole('heading', { name: /Bienvenido/ });
    expect(setItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(container.innerHTML).not.toContain(TEST_PASSWORD);
  });
});

describe('HU_DN_01_03 - failures (criteria 4, 6 and 7)', () => {
  it.each([
    [401, 'INVALID_CREDENTIALS', 'Credenciales no válidas. Verifique su correo y contraseña.'],
    [
      429,
      'LOGIN_ATTEMPTS_EXCEEDED',
      'Ha superado el número de intentos permitidos. Intente nuevamente más tarde.',
    ],
    [403, 'ACCOUNT_DISABLED', 'Su cuenta está desactivada. Contacte al Administrador.'],
  ])(
    'shows the literal message for %s %s and does not open a session',
    async (status, code, message) => {
      mockFetch(() => apiError(status, code, message));
      const user = userEvent.setup();
      renderApp();
      await typeCredentials(user);
      await user.click(submit());

      expect(await screen.findByRole('alert')).toHaveTextContent(message);
      expect(screen.getByRole('heading', { name: 'Inicio de sesión' })).toBeInTheDocument();
      expect(screen.getByLabelText('Correo electrónico')).toHaveValue('ana@dominio.com');
      expect(screen.getByLabelText('Contraseña')).toHaveValue('');
      expect(screen.getByLabelText('Contraseña')).toHaveFocus();
    },
  );

  it.each([
    ['a server error', () => apiError(500, 'INTERNAL_ERROR', 'x')],
    ['a network failure', () => new TypeError('Failed to fetch')],
    ['an unreadable answer', () => ({ status: 503 })],
  ])('shows the technical message on %s', async (_label, reply) => {
    mockFetch(reply);
    const user = userEvent.setup();
    renderApp();
    await typeCredentials(user);
    await user.click(submit());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No fue posible completar la operación. Intente nuevamente.',
    );
  });

  it('maps a server-side e-mail format error to the e-mail field', async () => {
    mockFetch(() =>
      apiError(400, 'EMAIL_INVALID', 'El correo electrónico ingresado no tiene un formato válido.'),
    );
    const user = userEvent.setup();
    renderApp();
    await typeCredentials(user);
    await user.click(submit());
    expect(
      await screen.findByText('El correo electrónico ingresado no tiene un formato válido.'),
    ).toBeInTheDocument();
  });

  it('prevents a second submission while waiting', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const calls = mockFetch(async () => {
      await gate;
      return ok(makeSession('developer'));
    });
    const user = userEvent.setup();
    renderApp();
    await typeCredentials(user);
    await user.click(submit());
    expect(submit()).toBeDisabled();
    await user.keyboard('{Enter}');
    release();
    await screen.findByRole('heading', { name: /Bienvenido/ });
    expect(calls).toHaveLength(1);
  });
});

describe('HU_DN_01_03 - route guards', () => {
  it('sends a visitor without session from a protected route to the login', async () => {
    renderApp(PATHS.homeManager);
    expect(await screen.findByRole('heading', { name: 'Inicio de sesión' })).toBeInTheDocument();
  });

  it('keeps each role inside its own area and away from the login once authenticated', async () => {
    mockFetch(() => ok(makeSession('manager')));
    const user = userEvent.setup();
    renderApp();
    await typeCredentials(user);
    await user.click(submit());
    await screen.findByRole('heading', { name: /Bienvenido/ });

    await user.click(screen.getByRole('link', { name: 'ir-admin' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Bienvenido/ })).toBeInTheDocument(),
    );
    expect(screen.getByText('Gerente')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'ir-login' }));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Inicio de sesión' })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { name: /Bienvenido/ })).toBeInTheDocument();
  });
});
