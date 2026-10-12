import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { PATHS } from '@/app/paths';
import { mockFetch, ok } from '@/test/fetchMock';
import LandingPage from './LandingPage';

function Probe() {
  return <p data-testid="location">{useLocation().pathname}</p>;
}

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={[PATHS.landing]}>
      <Routes>
        <Route path={PATHS.landing} element={<LandingPage />} />
        <Route path="*" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('HU_DN_01_01 - public presentation page', () => {
  it('shows the full page without any session and without requesting data (criteria 3, 4)', () => {
    const calls = mockFetch(() => ok({}));
    renderLanding();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('DashNode');
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(calls).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('describes the product: name, one-sentence value proposition and main modules (2.3)', () => {
    renderLanding();
    expect(screen.getByText(/Organice proyectos, equipos y trabajo Scrum/)).toBeInTheDocument();
    const modules = within(screen.getByRole('list'));
    for (const title of [
      'Proyectos',
      'Backlog y sprints',
      'Reuniones',
      'Documentación',
      'Issues',
      'Asistente de IA',
    ]) {
      expect(modules.getByRole('heading', { name: title })).toBeInTheDocument();
    }
  });

  it('does not show protected data (criterion 4)', () => {
    renderLanding();
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/dashboard|usuarios registrados|mis tareas/i),
    ).not.toBeInTheDocument();
  });

  it("opens the login screen with the 'Iniciar sesión' button (2.1)", async () => {
    const user = userEvent.setup();
    renderLanding();
    const login = screen.getByRole('link', { name: 'Iniciar sesión' });
    expect(login).toHaveAttribute('href', PATHS.login);
    await user.click(login);
    expect(screen.getByTestId('location')).toHaveTextContent(PATHS.login);
  });

  it("opens the registration screen with the 'Registrarme como Gerente' link (2.2)", async () => {
    const user = userEvent.setup();
    renderLanding();
    const register = screen.getByRole('link', { name: 'Registrarme como Gerente' });
    expect(register).toHaveAttribute('href', PATHS.register);
    await user.click(register);
    expect(screen.getByTestId('location')).toHaveTextContent(PATHS.register);
  });

  it('is operable with the keyboard only', async () => {
    const user = userEvent.setup();
    renderLanding();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Registrarme como Gerente' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByTestId('location')).toHaveTextContent(PATHS.register);
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = renderLanding();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('never touches web storage', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    renderLanding();
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });
});
