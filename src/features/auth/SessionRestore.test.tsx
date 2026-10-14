import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PATHS } from '@/app/paths';
import { currentPath, renderApp } from '@/test/app';
import { makeSession } from '@/test/factories';
import { apiError, callsTo, mockApi, ok } from '@/test/fetchMock';
import type { Role } from './types';

const EXPIRED = 'Su sesión ha expirado. Inicie sesión nuevamente.';
const LOAD_FAILURE = 'No fue posible cargar la información. Intente nuevamente.';

describe('HU_DN_01_05 - reload with a valid session (criteria 3 and 5)', () => {
  it.each<[Role, string]>([
    ['admin', PATHS.homeAdmin],
    ['manager', PATHS.homeManager],
    ['developer', PATHS.homeDeveloper],
  ])('keeps the %s authenticated in the same view', async (role, path) => {
    const session = makeSession(role);
    const calls = mockApi({ session: ok(session) });
    renderApp(path);

    expect(
      await screen.findByRole('heading', { name: `Bienvenido, ${session.user.name}` }),
    ).toBeInTheDocument();
    expect(currentPath()).toBe(path);
    expect(screen.queryByRole('heading', { name: 'Inicio de sesión' })).not.toBeInTheDocument();
    const checks = callsTo(calls, 'session');
    expect(checks).toHaveLength(1);
    expect(checks[0]).toMatchObject({ url: '/api/v1/auth/session', credentials: 'include' });
  });

  it('asks the server once even when React runs effects twice (StrictMode)', async () => {
    const calls = mockApi({ session: ok(makeSession('manager')) });
    renderApp(PATHS.homeManager, { strict: true });
    await screen.findByRole('heading', { name: /Bienvenido/ });
    expect(callsTo(calls, 'session')).toHaveLength(1);
  });

  it('sends a restored user who opens another role area to their own home', async () => {
    mockApi({ session: ok(makeSession('developer')) });
    renderApp(PATHS.homeAdmin);
    await screen.findByRole('heading', { name: /Bienvenido/ });
    expect(currentPath()).toBe(PATHS.homeDeveloper);
  });

  it('sends a restored user who opens the login to their own home', async () => {
    mockApi({ session: ok(makeSession('admin')) });
    renderApp(PATHS.login);
    await screen.findByRole('heading', { name: /Bienvenido/ });
    expect(currentPath()).toBe(PATHS.homeAdmin);
  });

  it('shows the validation progress instead of protected content while checking', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    mockApi({
      session: async () => {
        await gate;
        return ok(makeSession('manager'));
      },
    });
    renderApp(PATHS.homeManager);
    expect(await screen.findByText('Verificando sesión…')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Bienvenido/ })).not.toBeInTheDocument();
    release();
    expect(await screen.findByRole('heading', { name: /Bienvenido/ })).toBeInTheDocument();
  });
});

describe('HU_DN_01_05 - expired or missing session (criterion 6)', () => {
  it("redirects to the login with 'Su sesión ha expirado. Inicie sesión nuevamente.'", async () => {
    mockApi({ session: apiError(401, 'SESSION_EXPIRED', EXPIRED) });
    renderApp(PATHS.homeManager);
    expect(await screen.findByRole('heading', { name: 'Inicio de sesión' })).toBeInTheDocument();
    expect(currentPath()).toBe(PATHS.login);
    expect(screen.getByRole('status')).toHaveTextContent(EXPIRED);
    expect(screen.queryByRole('heading', { name: /Bienvenido/ })).not.toBeInTheDocument();
  });

  it('shows the expiry message only once', async () => {
    mockApi({ session: apiError(401, 'SESSION_EXPIRED', EXPIRED) });
    const user = userEvent.setup();
    renderApp(PATHS.homeManager);
    await screen.findByText(EXPIRED);
    await user.click(screen.getByRole('link', { name: 'ir-inicio' }));
    await screen.findByRole('heading', { level: 1, name: /Gestión inteligente/ });
    await user.click(screen.getByRole('link', { name: 'ir-login' }));
    await screen.findByRole('heading', { name: 'Inicio de sesión' });
    expect(screen.queryByText(EXPIRED)).not.toBeInTheDocument();
  });

  it('redirects silently when there was never a session', async () => {
    mockApi({});
    renderApp(PATHS.homeDeveloper);
    expect(await screen.findByRole('heading', { name: 'Inicio de sesión' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('explains a disabled account found while restoring the session', async () => {
    const message = 'Su cuenta está desactivada. Contacte al Administrador.';
    mockApi({ session: apiError(403, 'ACCOUNT_DISABLED', message) });
    renderApp(PATHS.homeManager);
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(currentPath()).toBe(PATHS.login);
  });

  it('also reports an expired session when the visitor opens the login directly', async () => {
    mockApi({ session: apiError(401, 'SESSION_EXPIRED', EXPIRED) });
    renderApp(PATHS.login);
    expect(await screen.findByText(EXPIRED)).toBeInTheDocument();
  });

  it('ends the session at the expiry instant without any request and shows the message', async () => {
    const soon = new Date(Date.now() + 400).toISOString();
    mockApi({ session: ok(makeSession('manager', soon)) });
    renderApp(PATHS.homeManager);
    await screen.findByRole('heading', { name: /Bienvenido/ });
    expect(await screen.findByRole('heading', { name: 'Inicio de sesión' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(EXPIRED);
    expect(currentPath()).toBe(PATHS.login);
  });
});

describe('HU_DN_01_05 - technical failure (criterion 6)', () => {
  it.each([
    ['a server error', apiError(500, 'INTERNAL_ERROR', 'x')],
    ['a network failure', new TypeError('Failed to fetch')],
    ['a gateway error without body', { status: 502 }],
  ])('shows the load-failure message on %s and recovers on retry', async (_label, reply) => {
    let healthy = false;
    mockApi({ session: () => (healthy ? ok(makeSession('manager')) : reply) });
    const user = userEvent.setup();
    renderApp(PATHS.homeManager);

    expect(await screen.findByRole('alert')).toHaveTextContent(LOAD_FAILURE);
    expect(screen.queryByRole('heading', { name: /Bienvenido/ })).not.toBeInTheDocument();
    expect(currentPath()).toBe(PATHS.homeManager);

    healthy = true;
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { name: /Bienvenido/ })).toBeInTheDocument();
  });

  it('does not block the login form when the check fails there', async () => {
    mockApi({ session: apiError(500, 'INTERNAL_ERROR', 'x') });
    renderApp(PATHS.login);
    expect(await screen.findByLabelText('Correo electrónico')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});

describe('HU_DN_01_05 - what the browser keeps (criterion 4)', () => {
  it('never writes to web storage and never reads credentials from it', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    mockApi({ session: ok(makeSession('manager')) });
    renderApp(PATHS.homeManager);
    await screen.findByRole('heading', { name: /Bienvenido/ });
    expect(setItem).not.toHaveBeenCalled();
    expect(getItem).not.toHaveBeenCalled();
  });

  it('does not render the session token or any password-like data', async () => {
    const session = makeSession('manager');
    mockApi({ session: ok(session) });
    const { container } = renderApp(PATHS.homeManager);
    await screen.findByRole('heading', { name: /Bienvenido/ });
    expect(container.innerHTML).not.toMatch(/password|token|dashnode_session/i);
  });

  it('does not ask for the session on the public landing page', async () => {
    const calls = mockApi({});
    renderApp(PATHS.landing);
    await screen.findByRole('heading', { level: 1, name: /Gestión inteligente/ });
    expect(calls).toHaveLength(0);
  });
});
