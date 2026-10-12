import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { PATHS } from '@/app/paths';
import { UNDER_DEVELOPMENT_MESSAGE } from '@/lib/underDevelopment';
import { currentPath, renderApp, signIn } from '@/test/app';
import { makeSession } from '@/test/factories';
import { mockApi, ok } from '@/test/fetchMock';
import type { Role } from '@/features/auth/types';

const EXPECTED_NAV: Record<Role, string[]> = {
  admin: [],
  manager: [
    'Proyectos',
    'Mis tareas',
    'Reuniones',
    'Calendario',
    'Disponibilidad',
    'Manual de usuario',
  ],
  developer: [
    'Proyectos',
    'Mis tareas',
    'Reuniones',
    'Calendario',
    'Disponibilidad',
    'Manual de usuario',
  ],
};

async function authenticated(role: Role) {
  mockApi({ session: ok(makeSession(role)) });
  const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
  renderApp(
    role === 'admin'
      ? PATHS.homeAdmin
      : role === 'manager'
        ? PATHS.homeManager
        : PATHS.homeDeveloper,
  );
  await screen.findByRole('heading', { name: /Bienvenido/ });
  return info;
}

describe('features outside EP-01 log "Funcionalidad en desarrollo, no disponible"', () => {
  it('uses the literal message', () => {
    expect(UNDER_DEVELOPMENT_MESSAGE).toBe('Funcionalidad en desarrollo, no disponible');
  });

  it.each<Role>(['admin', 'manager', 'developer'])(
    'every out-of-scope navigation entry of the %s only logs the notice',
    async (role) => {
      const info = await authenticated(role);
      const user = userEvent.setup();
      const nav = screen.getByRole('navigation', { name: 'Principal' });
      const buttons = nav.querySelectorAll('button');
      expect([...buttons].map((button) => button.textContent)).toEqual(EXPECTED_NAV[role]);

      for (const button of buttons) {
        info.mockClear();
        const before = currentPath();
        await user.click(button);
        expect(info).toHaveBeenCalledTimes(1);
        expect(info.mock.calls[0]?.[0]).toBe(UNDER_DEVELOPMENT_MESSAGE);
        expect(currentPath()).toBe(before);
      }
    },
  );

  it('exposes Usuarios as a real route for admin and manager', async () => {
    await authenticated('admin');
    const users = screen.getByRole('link', { name: 'Usuarios' });
    expect(users).toHaveAttribute('href', PATHS.users);
  });

  it('keeps the role start screen as the only working navigation entry', async () => {
    await authenticated('manager');
    const home = screen.getByRole('link', { name: 'Inicio' });
    expect(home).toHaveAttribute('href', PATHS.homeManager);
    expect(home).toHaveAttribute('aria-current', 'page');
  });

  it('search, notifications and the AI assistant only log the notice', async () => {
    const info = await authenticated('developer');
    const user = userEvent.setup();
    for (const name of ['Buscar', 'Notificaciones', 'Asistente de IA']) {
      info.mockClear();
      await user.click(screen.getByRole('button', { name }));
      expect(info).toHaveBeenCalledTimes(1);
      expect(info.mock.calls[0]?.[0]).toBe(UNDER_DEVELOPMENT_MESSAGE);
    }
  });

  it('the administrator has no notifications control', async () => {
    await authenticated('admin');
    expect(screen.queryByRole('button', { name: 'Notificaciones' })).not.toBeInTheDocument();
  });

  it("'¿Olvidó su contraseña?' navigates to the reset request screen (HU_DN_01_06)", async () => {
    mockApi({});
    const user = userEvent.setup();
    renderApp(PATHS.login);
    await user.click(await screen.findByRole('link', { name: '¿Olvidó su contraseña?' }));
    expect(
      await screen.findByRole('heading', { name: 'Restablecer contraseña' }),
    ).toBeInTheDocument();
    expect(currentPath()).toBe(PATHS.forgotPassword);
  });

  it('the authenticated shell has no accessibility violations', async () => {
    await authenticated('manager');
    // The "region" rule is skipped: the test harness (helper links) lives outside the app landmarks.
    const results = await axe(document.body, { rules: { region: { enabled: false } } });
    expect(results).toHaveNoViolations();
  });

  it('still logs in and out normally with the new shell', async () => {
    mockApi({ login: ok(makeSession('admin')) });
    const user = userEvent.setup();
    renderApp();
    await signIn(user);
    expect(await screen.findByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
  });
});
