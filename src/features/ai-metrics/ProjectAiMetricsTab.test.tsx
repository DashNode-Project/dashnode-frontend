import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ToastProvider } from '@/lib/toast/ToastProvider';
import ProjectAiMetricsTab from './ProjectAiMetricsTab';
import * as api from './api';
import { AI_METRICS_MESSAGES } from './messages';

vi.mock('./api');

describe('ProjectAiMetricsTab', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getMetricsSummary).mockResolvedValue({
      period: { from: '2026-11-09T00:00:00Z', to: '2026-11-16T23:59:59Z', timezone: 'America/Bogota' },
      scope: { type: 'PROJECT', project_id: 'p-1', name: 'DashNode' },
      total_interactions: 3,
      avg_latency_ms: 1200,
      tokens: { input: 50, output: 20 },
      audio_seconds: 4,
      computed_at: '2026-11-16T12:00:00Z',
    });
    vi.mocked(api.getMetricsByUser).mockResolvedValue({
      items: [
        {
          user: { id: 'u-1', name: 'Ana' },
          interactions: 3,
          last_at: '2026-11-16T10:00:00Z',
          input_tokens: 50,
          avg_latency_ms: 1200,
        },
      ],
      totals: { interactions: 3 },
      next_cursor: null,
    });
    vi.mocked(api.listInteractions).mockResolvedValue({ items: [], next_cursor: null });
  });

  it('renders KPI summary and sections', async () => {
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/proyectos/p-1/metricas-ia']}>
          <Routes>
            <Route path="/proyectos/:projectId/metricas-ia" element={<ProjectAiMetricsTab />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(AI_METRICS_MESSAGES.sectionSummary)).toBeInTheDocument();
    });

    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Alcance: proyecto DashNode')).toBeInTheDocument();
    expect(screen.getByText(AI_METRICS_MESSAGES.sectionByUser)).toBeInTheDocument();
    expect(screen.getByText(AI_METRICS_MESSAGES.sectionRegistry)).toBeInTheDocument();
    expect(screen.getByText(AI_METRICS_MESSAGES.emptyInteractions)).toBeInTheDocument();
  });
});