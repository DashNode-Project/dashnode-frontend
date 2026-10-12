import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { PATHS } from '@/app/paths';
import { mockFetch, ok } from '@/test/fetchMock';
import LandingPage from './LandingPage';
import { PRODUCT_MODULES } from './modules';

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
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Gestión inteligente/);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(calls).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('describes the product and main capability modules (2.3)', () => {
    renderLanding();
    expect(screen.getByText(/Centraliza proyectos, equipos, Scrum/)).toBeInTheDocument();
    const features = within(screen.getByRole('list', { name: 'Todo lo que tu equipo necesita' }));
    for (const title of ['Gestión de Proyectos', 'Motor Scrum', 'Indicadores']) {
      expect(features.getByRole('heading', { name: title })).toBeInTheDocument();
    }
  });

  it('does not show live protected account data (criterion 4)', () => {
    renderLanding();
    expect(screen.queryByText(/@dashnode\.dev/)).not.toBeInTheDocument();
    expect(screen.queryByText(/admin123|manager123|dev123/)).not.toBeInTheDocument();
  });

  it("opens the login screen with the navbar 'Iniciar sesión' link (2.1)", async () => {
    const user = userEvent.setup();
    renderLanding();
    const loginLinks = screen.getAllByRole('link', { name: 'Iniciar sesión' });
    expect(loginLinks[0]).toHaveAttribute('href', PATHS.login);
    await user.click(loginLinks[0]!);
    expect(screen.getByTestId('location')).toHaveTextContent(PATHS.login);
  });

  it('opens the registration screen from the CTA (2.2)', async () => {
    const user = userEvent.setup();
    renderLanding();
    const register = screen.getByRole('link', { name: /Registrarme como Gerente/ });
    expect(register).toHaveAttribute('href', PATHS.register);
    await user.click(register);
    expect(screen.getByTestId('location')).toHaveTextContent(PATHS.register);
  });

  it('is operable with the keyboard only', async () => {
    const user = userEvent.setup();
    renderLanding();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveFocus();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = renderLanding();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('keeps the module catalog export for documentation parity', () => {
    expect(PRODUCT_MODULES.length).toBeGreaterThanOrEqual(6);
  });

  it('never touches web storage', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    renderLanding();
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });
});
