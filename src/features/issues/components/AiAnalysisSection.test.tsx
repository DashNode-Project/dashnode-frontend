import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../api';
import { ISSUE_MESSAGES } from '../messages';
import type { Evidence } from '../types';
import { AiAnalysisSection } from './AiAnalysisSection';

vi.mock('../api');

const mockToast = vi.fn();
vi.mock('@/lib/toast/ToastProvider', () => ({
  useToast: () => ({ showToast: mockToast }),
}));

const mockEvidences: Evidence[] = [
  {
    id: 'ev-img-1',
    fix_id: 'iss-1',
    file_name: 'capture.png',
    file_type: 'image',
    mime_type: 'image/png',
    file_size: 1024,
    download_url: '/api/v1/projects/p-1/issues/iss-1/evidences/ev-img-1/download',
    uploaded_by: 'dev-1',
    uploaded_by_name: 'Dev One',
    created_at: '2026-11-12T10:00:00Z',
  },
];

describe('AiAnalysisSection (EP-12)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listAiAnalyses).mockResolvedValue({ items: [] });
  });

  it('HU_DN_07_106: requires confirmation checkbox before enabling Analizar con IA button', async () => {
    const user = userEvent.setup();
    render(
      <AiAnalysisSection
        projectId="p-1"
        issueId="iss-1"
        evidences={mockEvidences}
        currentUser={{ id: 'dev-1', role: 'developer' }}
      />,
    );

    const btn = screen.getByRole('button', { name: /analizar con ia/i });
    expect(btn).toBeDisabled();

    const checkbox = screen.getByLabelText(ISSUE_MESSAGES.AI_CONFIRMATION_CHECKBOX);
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(btn).toBeEnabled();
  });

  it('HU_DN_07_106 & 107: requests analysis, displays processing indicator and unverified red badge result', async () => {
    const user = userEvent.setup();
    vi.mocked(api.requestAiAnalysis).mockResolvedValue({
      analysis_id: 'ana-1',
      status: 'PENDING',
      reused: false,
      message: ISSUE_MESSAGES.AI_PROCESSING_LABEL,
    });
    vi.mocked(api.getAiAnalysisStatus).mockResolvedValue({
      analysis_id: 'ana-1',
      status: 'DONE',
      validation_status: 'PENDING_VALIDATION',
      requires_human_validation: true,
      retryable: false,
      created_at: '2026-11-12T10:01:00Z',
      result: {
        problem_description: 'Error visual en renderizado de grilla.',
        probable_cause: 'Falta de key en iterador de React.',
        suggested_solution: 'Agregar key única al elemento mapeado.',
        context_sufficient: true,
      },
    });

    render(
      <AiAnalysisSection
        projectId="p-1"
        issueId="iss-1"
        evidences={mockEvidences}
        currentUser={{ id: 'dev-1', role: 'developer' }}
      />,
    );

    await user.click(screen.getByLabelText(ISSUE_MESSAGES.AI_CONFIRMATION_CHECKBOX));
    await user.click(screen.getByRole('button', { name: /analizar con ia/i }));

    expect(api.requestAiAnalysis).toHaveBeenCalledWith('p-1', 'iss-1', {
      evidence_id: 'ev-img-1',
      user_confirmed_no_sensitive_data: true,
      force_new: false,
    });

    await waitFor(() => {
      expect(screen.getByText(ISSUE_MESSAGES.AI_UNVERIFIED_LABEL)).toBeInTheDocument();
      expect(screen.getByText('Error visual en renderizado de grilla.')).toBeInTheDocument();
      expect(screen.getByText('Falta de key en iterador de React.')).toBeInTheDocument();
      expect(screen.getByText('Agregar key única al elemento mapeado.')).toBeInTheDocument();
    });
  });

  it('HU_DN_07_107: shows insufficient context fallback message when context_sufficient is false', async () => {
    const user = userEvent.setup();
    vi.mocked(api.requestAiAnalysis).mockResolvedValue({
      analysis_id: 'ana-no-ctx',
      status: 'PENDING',
      reused: false,
      message: ISSUE_MESSAGES.AI_PROCESSING_LABEL,
    });
    vi.mocked(api.getAiAnalysisStatus).mockResolvedValue({
      analysis_id: 'ana-no-ctx',
      status: 'DONE',
      validation_status: 'PENDING_VALIDATION',
      requires_human_validation: true,
      retryable: false,
      created_at: '2026-11-12T10:02:00Z',
      result: {
        problem_description: 'Evidencia borrosa.',
        probable_cause: 'Sin texto legible.',
        suggested_solution: null,
        context_sufficient: false,
      },
    });

    render(
      <AiAnalysisSection
        projectId="p-1"
        issueId="iss-1"
        evidences={mockEvidences}
        currentUser={{ id: 'dev-1', role: 'developer' }}
      />,
    );

    await user.click(screen.getByLabelText(ISSUE_MESSAGES.AI_CONFIRMATION_CHECKBOX));
    await user.click(screen.getByRole('button', { name: /analizar con ia/i }));

    await waitFor(() => {
      expect(screen.getByText(ISSUE_MESSAGES.AI_INSUFFICIENT_CONTEXT)).toBeInTheDocument();
    });
  });

  it('HU_DN_07_108: shows empty state when no stored AI responses exist', async () => {
    vi.mocked(api.listAiAnalyses).mockResolvedValue({ items: [] });
    render(
      <AiAnalysisSection
        projectId="p-1"
        issueId="iss-1"
        evidences={mockEvidences}
        currentUser={{ id: 'dev-1', role: 'developer' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(ISSUE_MESSAGES.AI_NO_RESPONSES)).toBeInTheDocument();
    });
  });

  it('HU_DN_07_109: allows requester to delete stored response with confirmation modal', async () => {
    const user = userEvent.setup();
    vi.mocked(api.listAiAnalyses).mockResolvedValue({
      items: [
        {
          id: 'ana-to-del',
          requested_by: { id: 'dev-1', name: 'Dev One' },
          created_at: '2026-11-12T10:00:00Z',
          validation_status: 'PENDING_VALIDATION',
          summary: 'Resumen de análisis previo.',
          requires_human_validation: true,
          evidence_id: 'ev-img-1',
        },
      ],
    });
    vi.mocked(api.deleteAiAnalysis).mockResolvedValue({
      message: ISSUE_MESSAGES.AI_ANALYSIS_DELETED,
    });

    render(
      <AiAnalysisSection
        projectId="p-1"
        issueId="iss-1"
        evidences={mockEvidences}
        currentUser={{ id: 'dev-1', role: 'developer' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Resumen de análisis previo.')).toBeInTheDocument();
    });

    const delBtn = screen.getByTitle('Eliminar respuesta');
    await user.click(delBtn);

    expect(screen.getByText(ISSUE_MESSAGES.AI_DELETE_CONFIRM_TITLE)).toBeInTheDocument();
    expect(screen.getByText(ISSUE_MESSAGES.AI_DELETE_CONFIRM_TEXT)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Confirmar' });
    await user.click(confirmBtn);

    expect(api.deleteAiAnalysis).toHaveBeenCalledWith('p-1', 'iss-1', 'ana-to-del');
  });

  it('HU_DN_07_110: shows specific error message and Reintentar button on failure', async () => {
    const user = userEvent.setup();
    vi.mocked(api.requestAiAnalysis).mockResolvedValue({
      analysis_id: 'ana-failed',
      status: 'PENDING',
      reused: false,
      message: ISSUE_MESSAGES.AI_PROCESSING_LABEL,
    });
    vi.mocked(api.getAiAnalysisStatus).mockResolvedValue({
      analysis_id: 'ana-failed',
      status: 'FAILED',
      validation_status: 'PENDING_VALIDATION',
      requires_human_validation: true,
      error_code: 'AI_TIMEOUT',
      message: ISSUE_MESSAGES.AI_TIMEOUT,
      retryable: true,
      created_at: '2026-11-12T10:00:00Z',
    });

    render(
      <AiAnalysisSection
        projectId="p-1"
        issueId="iss-1"
        evidences={mockEvidences}
        currentUser={{ id: 'dev-1', role: 'developer' }}
      />,
    );

    await user.click(screen.getByLabelText(ISSUE_MESSAGES.AI_CONFIRMATION_CHECKBOX));
    await user.click(screen.getByRole('button', { name: /analizar con ia/i }));

    await waitFor(() => {
      expect(screen.getByText(ISSUE_MESSAGES.AI_TIMEOUT)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    });

    // Click Reintentar calls requestAiAnalysis with force_new = true
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(api.requestAiAnalysis).toHaveBeenCalledWith('p-1', 'iss-1', {
      evidence_id: 'ev-img-1',
      user_confirmed_no_sensitive_data: true,
      force_new: true,
    });
  });

  it('HU_DN_07_111 & HU_DN_07_112: privileged users can validate and reject pending AI response', async () => {
    const user = userEvent.setup();
    vi.mocked(api.listAiAnalyses).mockResolvedValue({
      items: [
        {
          id: 'ana-pending-1',
          requested_by: { id: 'dev-1', name: 'Dev One' },
          created_at: '2026-11-12T10:00:00Z',
          validation_status: 'PENDING_VALIDATION',
          summary: 'Propuesta de análisis pendiente.',
          requires_human_validation: true,
          result: {
            problem_description: 'Error visual en modal.',
            probable_cause: 'Z-index incorrecto.',
            suggested_solution: 'Aumentar z-index a 50.',
            context_sufficient: true,
          },
        },
      ],
    });
    vi.mocked(api.validateAiAnalysis).mockResolvedValue({
      message: ISSUE_MESSAGES.AI_VALIDATE_SUCCESS,
      validation_status: 'VALIDATED',
    });
    vi.mocked(api.rejectAiAnalysis).mockResolvedValue({
      message: ISSUE_MESSAGES.AI_REJECT_SUCCESS,
      validation_status: 'REJECTED',
    });

    render(
      <AiAnalysisSection
        projectId="p-1"
        issueId="iss-1"
        evidences={mockEvidences}
        currentUser={{ id: 'mgr-1', role: 'manager', name: 'Manager User' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Propuesta de análisis pendiente.')).toBeInTheDocument();
    });

    // Expand details
    await user.click(screen.getByRole('button', { name: 'Ver detalle' }));

    // Buttons Validar and Rechazar are visible for privileged users
    const valBtn = screen.getByRole('button', { name: ISSUE_MESSAGES.AI_VALIDATE_BTN });
    const rejBtn = screen.getByRole('button', { name: ISSUE_MESSAGES.AI_REJECT_BTN });
    expect(valBtn).toBeInTheDocument();
    expect(rejBtn).toBeInTheDocument();

    // Click Validar
    await user.click(valBtn);
    expect(api.validateAiAnalysis).toHaveBeenCalledWith('p-1', 'iss-1', 'ana-pending-1');
  });

  it('HU_DN_07_111: developer does not see Validar or Rechazar buttons', async () => {
    const user = userEvent.setup();
    vi.mocked(api.listAiAnalyses).mockResolvedValue({
      items: [
        {
          id: 'ana-pending-dev',
          requested_by: { id: 'dev-1', name: 'Dev One' },
          created_at: '2026-11-12T10:00:00Z',
          validation_status: 'PENDING_VALIDATION',
          summary: 'Propuesta para desarrollador.',
          requires_human_validation: true,
          result: {
            problem_description: 'Fallo de interfaz.',
            probable_cause: 'Estilo faltante.',
            suggested_solution: 'Revisar CSS.',
            context_sufficient: true,
          },
        },
      ],
    });

    render(
      <AiAnalysisSection
        projectId="p-1"
        issueId="iss-1"
        evidences={mockEvidences}
        currentUser={{ id: 'dev-1', role: 'developer', name: 'Developer User' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Propuesta para desarrollador.')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Ver detalle' }));

    // Validar and Rechazar buttons MUST NOT be visible for developer
    expect(
      screen.queryByRole('button', { name: ISSUE_MESSAGES.AI_VALIDATE_BTN }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: ISSUE_MESSAGES.AI_REJECT_BTN }),
    ).not.toBeInTheDocument();
  });

  it('HU_DN_07_113: displays human validation notice when unvalidated and validated note when validated', async () => {
    const user = userEvent.setup();
    vi.mocked(api.listAiAnalyses).mockResolvedValue({
      items: [
        {
          id: 'ana-notice-1',
          requested_by: { id: 'dev-1', name: 'Dev One' },
          created_at: '2026-11-12T10:00:00Z',
          validation_status: 'PENDING_VALIDATION',
          summary: 'Propuesta pendiente de validación.',
          requires_human_validation: true,
          result: {
            problem_description: 'Fallo visual detectado.',
            probable_cause: 'Componente desfasado.',
            suggested_solution: 'Ajustar padding.',
            context_sufficient: true,
          },
        },
      ],
    });

    const { rerender } = render(
      <AiAnalysisSection
        projectId="p-1"
        issueId="iss-1"
        evidences={mockEvidences}
        currentUser={{ id: 'dev-1', role: 'developer' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Propuesta pendiente de validación.')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Ver detalle' }));

    // Notice text must be exact literal
    expect(screen.getByText(ISSUE_MESSAGES.AI_HUMAN_VALIDATION_NOTICE)).toBeInTheDocument();

    // Rerender with validated status
    vi.mocked(api.listAiAnalyses).mockResolvedValue({
      items: [
        {
          id: 'ana-notice-1',
          requested_by: { id: 'dev-1', name: 'Dev One' },
          created_at: '2026-11-12T10:00:00Z',
          validation_status: 'VALIDATED',
          summary: 'Propuesta validada.',
          requires_human_validation: false,
          validated_by_name: 'Admin Global',
          validated_at: '2026-11-15T12:00:00Z',
          result: {
            problem_description: 'Fallo visual detectado.',
            probable_cause: 'Componente desfasado.',
            suggested_solution: 'Ajustar padding.',
            context_sufficient: true,
          },
        },
      ],
    });

    rerender(
      <AiAnalysisSection
        projectId="p-1"
        issueId="iss-1"
        evidences={mockEvidences}
        currentUser={{ id: 'dev-1', role: 'developer' }}
      />,
    );

    // Click refresh
    await user.click(screen.getByRole('button', { name: /actualizar/i }));

    await waitFor(() => {
      expect(screen.getByText(/Validada por Admin Global el/)).toBeInTheDocument();
    });
  });

  it('HU_DN_07_112: manager can reject a previously validated response and warning notice reappears', async () => {
    const user = userEvent.setup();
    vi.mocked(api.listAiAnalyses).mockResolvedValue({
      items: [
        {
          id: 'ana-val-to-rej',
          requested_by: { id: 'dev-1', name: 'Dev One' },
          created_at: '2026-11-12T10:00:00Z',
          validation_status: 'VALIDATED',
          summary: 'Propuesta validada previamente.',
          requires_human_validation: false,
          validated_by_name: 'Admin Boss',
          validated_at: '2026-11-14T09:00:00Z',
          result: {
            problem_description: 'Error en selector.',
            probable_cause: 'Id duplicado.',
            suggested_solution: 'Usar data-testid.',
            context_sufficient: true,
          },
        },
      ],
    });
    vi.mocked(api.rejectAiAnalysis).mockResolvedValue({
      message: ISSUE_MESSAGES.AI_REJECT_SUCCESS,
      validation_status: 'REJECTED',
    });

    render(
      <AiAnalysisSection
        projectId="p-1"
        issueId="iss-1"
        evidences={mockEvidences}
        currentUser={{ id: 'mgr-1', role: 'manager', name: 'Manager Bob' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Propuesta validada previamente.')).toBeInTheDocument();
    });

    // Expand detail
    await user.click(screen.getByRole('button', { name: 'Ver detalle' }));

    // Validated response should offer the 'Rechazar' button to managers, but NOT 'Validar'
    expect(
      screen.queryByRole('button', { name: ISSUE_MESSAGES.AI_VALIDATE_BTN }),
    ).not.toBeInTheDocument();
    const rejectBtn = screen.getByRole('button', { name: ISSUE_MESSAGES.AI_REJECT_BTN });
    expect(rejectBtn).toBeInTheDocument();

    await user.click(rejectBtn);
    expect(api.rejectAiAnalysis).toHaveBeenCalledWith('p-1', 'iss-1', 'ana-val-to-rej');
    expect(mockToast).toHaveBeenCalledWith(ISSUE_MESSAGES.AI_REJECT_SUCCESS, 'success');
  });

  it('Stress & Security: renders malicious XSS payload safely as escaped text', async () => {
    const user = userEvent.setup();
    const xssPayload = '<script>alert("xss")</script><img src=x onerror=alert(1)>';
    vi.mocked(api.listAiAnalyses).mockResolvedValue({
      items: [
        {
          id: 'ana-xss',
          requested_by: { id: 'dev-1', name: 'Dev One' },
          created_at: '2026-11-12T10:00:00Z',
          validation_status: 'PENDING_VALIDATION',
          summary: xssPayload,
          requires_human_validation: true,
          result: {
            problem_description: xssPayload,
            probable_cause: xssPayload,
            suggested_solution: xssPayload,
            context_sufficient: true,
          },
        },
      ],
    });

    const { container } = render(
      <AiAnalysisSection
        projectId="p-1"
        issueId="iss-1"
        evidences={mockEvidences}
        currentUser={{ id: 'dev-1', role: 'developer' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(xssPayload)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Ver detalle' }));

    // Verify no actual script or img elements were injected into the DOM
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img[src="x"]')).toBeNull();
  });

  it('Edge case: renders fallback message when context is insufficient', async () => {
    const user = userEvent.setup();
    vi.mocked(api.listAiAnalyses).mockResolvedValue({
      items: [
        {
          id: 'ana-no-context',
          requested_by: { id: 'dev-1', name: 'Dev One' },
          created_at: '2026-11-12T10:00:00Z',
          validation_status: 'PENDING_VALIDATION',
          summary: 'Contexto insuficiente.',
          requires_human_validation: true,
          result: {
            problem_description: 'Problema ambiguo.',
            probable_cause: 'Causa no determinada.',
            suggested_solution: null,
            context_sufficient: false,
          },
        },
      ],
    });

    render(
      <AiAnalysisSection
        projectId="p-1"
        issueId="iss-1"
        evidences={mockEvidences}
        currentUser={{ id: 'dev-1', role: 'developer' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Contexto insuficiente.')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Ver detalle' }));
    expect(screen.getByText(ISSUE_MESSAGES.AI_INSUFFICIENT_CONTEXT)).toBeInTheDocument();
  });
});
