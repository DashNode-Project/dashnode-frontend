import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { PATHS } from '@/app/paths';
import { currentPath, renderApp, signIn } from '@/test/app';
import { makeSession } from '@/test/factories';
import { apiError, callsTo, mockApi, ok } from '@/test/fetchMock';
import type { Role } from './types';

/** Server double: login succeeds, logout answers with `logout`. */
function server(role: Role, logout: Parameters<typeof mockApi>[0]['logout']) {
  return mockApi({ login: ok(makeSession(role)), logout });
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /Menú de usuario/ }));
}

const logoutOk = () => ok({ message: 'Sesión cerrada correctamente.' });

describe('HU_DN_01_04 - the option (criterion 1)', () => {
  it.each<Role>(['admin', 'manager', 'developer'])(
    "offers 'Cerrar sesión' in the user menu of the %s",
    async (role) => {
      server(role, logoutOk);
      const user = userEvent.setup();
      renderApp();
      await signIn(user);
      await openMenu(user);
      expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
      expect(screen.getByRole('button', { name: /Menú de usuario/ })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    },
  );

  it('closes the menu with Escape and returns the focus to its trigger', async () => {
    server('manager', logoutOk);
    const user = userEvent.setup();
    renderApp();
    await signIn(user);
    await openMenu(user);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Menú de usuario/ })).toHaveFocus();
  });

  it('closes the menu when clicking outside', async () => {
    server('manager', logoutOk);
    const user = userEvent.setup();
    renderApp();
    await signIn(user);
    await openMenu(user);
    await user.click(screen.getByRole('heading', { name: /Bienvenido/ }));
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument();
  });

  it('is accessible and fully keyboard operable', async () => {
    server('developer', logoutOk);
    const user = userEvent.setup();
    const { container } = renderApp();
    await signIn(user);
    await screen.findByRole('heading', { name: /Bienvenido/ });
    expect(await axe(container)).toHaveNoViolations();
    const trigger = screen.getByRole('button', { name: /Menú de usuario/ });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(await axe(container)).toHaveNoViolations();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Permisos y roles' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toHaveFocus();
  });
});

describe('HU_DN_01_04 - success (criteria 3, 4 and 5)', () => {
  it('invalidates the session, returns to the login and shows the literal message', async () => {
    const calls = server('manager', logoutOk);
    const user = userEvent.setup();
    renderApp();
    await signIn(user);
    await openMenu(user);
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByRole('heading', { name: 'Inicio de sesión' })).toBeInTheDocument();
    expect(await screen.findByRole('status')).toHaveTextContent('Sesión cerrada correctamente.');
    const logouts = callsTo(calls, 'logout');
    expect(logouts).toHaveLength(1);
    expect(logouts[0]).toMatchObject({ method: 'POST', credentials: 'include' });
  });

  it('leaves no protected data visible and blocks the previous screens', async () => {
    server('manager', logoutOk);
    const user = userEvent.setup();
    const { container } = renderApp();
    await signIn(user);
    await screen.findByRole('heading', { name: /Bienvenido/ });
    await openMenu(user);
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await screen.findByRole('heading', { name: 'Inicio de sesión' });

    expect(container).not.toHaveTextContent('Mario Gerente');
    expect(container).not.toHaveTextContent('manager@dominio.test');

    await user.click(screen.getByRole('link', { name: 'ir-gerente' }));
    await waitFor(() => expect(currentPath()).toBe(PATHS.login));
    expect(screen.queryByRole('heading', { name: /Bienvenido/ })).not.toBeInTheDocument();
  });

  it('shows the message only once', async () => {
    server('developer', logoutOk);
    const user = userEvent.setup();
    renderApp();
    await signIn(user);
    await openMenu(user);
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await screen.findByText('Sesión cerrada correctamente.');

    await user.click(screen.getByRole('link', { name: 'ir-inicio' }));
    await screen.findByRole('heading', { level: 1, name: /Gestión inteligente/ });
    await user.click(screen.getByRole('link', { name: 'ir-login' }));
    await screen.findByRole('heading', { name: 'Inicio de sesión' });
    expect(screen.queryByText('Sesión cerrada correctamente.')).not.toBeInTheDocument();
  });

  it('allows a new login after logging out', async () => {
    server('admin', logoutOk);
    const user = userEvent.setup();
    renderApp();
    await signIn(user);
    await openMenu(user);
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await screen.findByRole('heading', { name: 'Inicio de sesión' });
    await signIn(user, 'otra@dominio.com');
    expect(await screen.findByRole('heading', { name: /Bienvenido/ })).toBeInTheDocument();
  });
});

describe('HU_DN_01_04 - technical failure (criterion 6)', () => {
  it.each([
    ['a server error', () => apiError(500, 'INTERNAL_ERROR', 'x')],
    ['a network failure', () => new TypeError('Failed to fetch') as never],
  ])('keeps the session and shows the technical message on %s', async (_label, reply) => {
    server('manager', reply);
    const user = userEvent.setup();
    renderApp();
    await signIn(user);
    await openMenu(user);
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No fue posible completar la operación. Intente nuevamente.',
    );
    expect(screen.getByRole('heading', { name: /Bienvenido/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeEnabled();
    expect(currentPath()).toBe(PATHS.homeManager);
  });
});
