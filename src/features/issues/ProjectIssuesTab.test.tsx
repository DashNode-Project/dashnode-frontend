import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ToastProvider } from '@/lib/toast/ToastProvider';
import ProjectIssuesTab from './ProjectIssuesTab';
import * as issuesApi from './api';
import { ISSUE_MESSAGES } from './messages';
import type { Evidence, Issue, IssueDetail } from './types';
import type { Role } from '@/features/auth/types';

vi.mock('./api');

const useAuthMock = vi.fn(() => ({
  user: {
    id: 'user-dev-1',
    name: 'Developer One',
    email: 'dev@example.com',
    role: 'developer' as Role,
  },
}));

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

const sampleIssue: Issue = {
  id: 'iss-1',
  project_id: 'p-1',
  title: 'Error de carga en Dashboard',
  description: 'Los gráficos no renderizan en Safari',
  severity: 'critical',
  type: 'bug',
  status: 'open',
  reporter_id: 'user-dev-1',
  reporter_name: 'Developer One',
  assignee_id: null,
  assignee_name: null,
  resolution_note: null,
  resolved_at: null,
  created_at: '2026-11-07T10:00:00Z',
  updated_at: '2026-11-07T10:00:00Z',
  evidences_count: 1,
};

const sampleEvidence: Evidence = {
  id: 'ev-1',
  fix_id: 'iss-1',
  title: 'Captura del fallo en Safari',
  file_name: 'safari_bug.png',
  file_type: 'image',
  mime_type: 'image/png',
  file_size: 2048,
  download_url:
    '/api/v1/projects/p-1/issues/iss-1/evidences/ev-1/content?signature=sig123&expires=999999',
  thumbnail_url:
    '/api/v1/projects/p-1/issues/iss-1/evidences/ev-1/content?signature=sig123&expires=999999',
  duration_seconds: null,
  uploaded_by: 'user-dev-1',
  uploaded_by_name: 'Developer One',
  created_at: '2026-11-07T10:05:00Z',
};

const sampleDetail: IssueDetail = {
  ...sampleIssue,
  evidences: [sampleEvidence],
  ai_analyses: [],
};

function renderTab(initialPath = '/proyectos/p-1/issues') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ToastProvider>
        <Routes>
          <Route path="/proyectos/:projectId/issues" element={<ProjectIssuesTab />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('ProjectIssuesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when project has no issues', async () => {
    vi.mocked(issuesApi.listIssues).mockResolvedValueOnce({
      items: [],
      next_cursor: null,
      total: 0,
    });

    renderTab();

    expect(await screen.findByText(ISSUE_MESSAGES.NO_ISSUES_FOUND)).toBeInTheDocument();
    expect(screen.getByText('Nuevo fix')).toBeInTheDocument();
  });

  it('renders empty state when filters return no matches', async () => {
    vi.mocked(issuesApi.listIssues).mockResolvedValueOnce({
      items: [],
      next_cursor: null,
      total: 0,
    });

    renderTab('/proyectos/p-1/issues?status=resolved');

    expect(await screen.findByText(ISSUE_MESSAGES.NO_FILTERED_ISSUES)).toBeInTheDocument();
  });

  it('renders issues list and displays detail of selected issue', async () => {
    vi.mocked(issuesApi.listIssues).mockResolvedValueOnce({
      items: [sampleIssue],
      next_cursor: null,
      total: 1,
    });
    vi.mocked(issuesApi.getIssueDetail).mockResolvedValueOnce(sampleDetail);

    renderTab();

    expect(
      (await screen.findAllByText('Error de carga en Dashboard')).length,
    ).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText('Captura del fallo en Safari')).toBeInTheDocument();
    expect(screen.getAllByText('CRÍTICA').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Abierto').length).toBeGreaterThanOrEqual(1);
  });

  it('opens CreateIssueModal and creates an issue', async () => {
    const user = userEvent.setup();
    vi.mocked(issuesApi.listIssues).mockResolvedValue({
      items: [],
      next_cursor: null,
      total: 0,
    });
    vi.mocked(issuesApi.getIssueDetail).mockResolvedValue(sampleDetail);
    vi.mocked(issuesApi.createIssue).mockResolvedValueOnce({
      message: ISSUE_MESSAGES.ISSUE_CREATED,
      issue: sampleIssue,
    });

    renderTab();

    const newFixBtn = await screen.findByRole('button', { name: /nuevo fix/i });
    await user.click(newFixBtn);

    expect(screen.getByRole('dialog', { name: /nuevo fix/i })).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/título \*/i);
    await user.type(titleInput, 'Error de autenticación');

    const descInput = screen.getByLabelText(/descripción/i);
    await user.type(descInput, 'Detalle del problema');

    const submitBtn = screen.getByRole('button', { name: 'Crear fix' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(issuesApi.createIssue).toHaveBeenCalledWith(
        'p-1',
        expect.objectContaining({
          title: 'Error de autenticación',
          description: 'Detalle del problema',
        }),
      );
    });
  });

  it('opens AddEvidenceModal and attaches evidence', async () => {
    const user = userEvent.setup();
    vi.mocked(issuesApi.listIssues).mockResolvedValue({
      items: [sampleIssue],
      next_cursor: null,
      total: 1,
    });
    vi.mocked(issuesApi.getIssueDetail).mockResolvedValue(sampleDetail);
    vi.mocked(issuesApi.attachEvidence).mockResolvedValueOnce({
      message: ISSUE_MESSAGES.EVIDENCE_ATTACHED,
      evidence: sampleEvidence,
    });

    renderTab();

    const addEvBtn = await screen.findByRole('button', { name: /adjuntar evidencia/i });
    await user.click(addEvBtn);

    expect(screen.getByRole('dialog', { name: /adjuntar evidencia/i })).toBeInTheDocument();

    const file = new File(['fake image bytes'], 'screenshot.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/archivo \*/i);
    await user.upload(fileInput, file);

    const titleInput = screen.getByLabelText(/título \(opcional\)/i);
    await user.type(titleInput, 'Foto de error');

    const submitBtn = screen.getByRole('button', { name: 'Adjuntar' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(issuesApi.attachEvidence).toHaveBeenCalledWith(
        'p-1',
        'iss-1',
        expect.any(File),
        'Foto de error',
      );
    });
  });

  it('applies filters and syncs with query parameters', async () => {
    const user = userEvent.setup();
    vi.mocked(issuesApi.listIssues).mockResolvedValue({
      items: [sampleIssue],
      next_cursor: null,
      total: 1,
    });
    vi.mocked(issuesApi.getIssueDetail).mockResolvedValue(sampleDetail);

    renderTab();

    const statusSelect = await screen.findByLabelText(/filtrar por estado/i);
    await user.selectOptions(statusSelect, 'open');

    await waitFor(() => {
      expect(issuesApi.listIssues).toHaveBeenCalledWith(
        'p-1',
        expect.objectContaining({
          status: 'open',
        }),
      );
    });
  });
});
