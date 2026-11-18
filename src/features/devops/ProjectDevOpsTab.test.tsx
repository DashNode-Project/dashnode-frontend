import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import ProjectDevOpsTab from './ProjectDevOpsTab';
import * as api from './api';

const useAuthMock = vi.fn(() => ({
  user: { id: 'u-1', name: 'Manager', role: 'manager' as const, email: 'm@test.local' },
}));

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('./api');

describe('ProjectDevOpsTab', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthMock.mockReturnValue({
      user: { id: 'u-1', name: 'Manager', role: 'manager', email: 'm@test.local' },
    });
  });

  it('shows empty pipeline and simulated badge', async () => {
    vi.mocked(api.fetchLatestPipeline).mockResolvedValue({
      run_id: null,
      is_simulated: true,
      computed_at: '2026-11-18T12:00:00Z',
      stages: [],
    });

    render(
      <MemoryRouter initialEntries={['/proyectos/p-1/devops']}>
        <Routes>
          <Route path="/proyectos/:projectId/devops" element={<ProjectDevOpsTab />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Pipeline de integración')).toBeInTheDocument();
    });
    expect(screen.getByText('Simulado')).toBeInTheDocument();
    expect(
      screen.getByText('No hay ejecuciones registradas para este proyecto.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Disparar simulación/i })).toBeInTheDocument();
  });

  it('renders stage timeline when a run exists', async () => {
    vi.mocked(api.fetchLatestPipeline).mockResolvedValue({
      run_id: 'run-abcdef12',
      is_simulated: true,
      trigger: 'MANUAL',
      triggered_by: { id: 'u-1', name: 'Manager' },
      created_at: '2026-11-18T12:00:00Z',
      status: 'EXITOSA',
      computed_at: '2026-11-18T12:05:00Z',
      stages: [
        {
          stage: 'LINT',
          status: 'EXITOSA',
          duration_seconds: 12,
          started_at: '2026-11-18T12:00:01Z',
          finished_at: '2026-11-18T12:00:13Z',
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/proyectos/p-1/devops']}>
        <Routes>
          <Route path="/proyectos/:projectId/devops" element={<ProjectDevOpsTab />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Lint')).toBeInTheDocument();
    });
    expect(screen.getByText(/Exitosa · 12 s/)).toBeInTheDocument();
  });

  it('shows load error when fetch fails', async () => {
    vi.mocked(api.fetchLatestPipeline).mockRejectedValue(new Error('network'));

    render(
      <MemoryRouter initialEntries={['/proyectos/p-1/devops']}>
        <Routes>
          <Route path="/proyectos/:projectId/devops" element={<ProjectDevOpsTab />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('No fue posible cargar la información. Intente nuevamente.'),
      ).toBeInTheDocument();
    });
  });
});
