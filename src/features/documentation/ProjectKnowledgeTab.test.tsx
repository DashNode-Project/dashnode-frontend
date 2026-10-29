import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ToastProvider } from '@/lib/toast/ToastProvider';
import { ApiError } from '@/lib/api/errors';
import ProjectKnowledgeTab from './ProjectKnowledgeTab';
import * as docApi from './api';
import { DOCUMENTATION_MESSAGES } from './messages';
import type { DocumentationEntry } from './types';

import type { Role } from '@/features/auth/types';

vi.mock('./api');

const useAuthMock = vi.fn(() => ({
  user: {
    id: 'user-manager-1',
    name: 'Manager User',
    email: 'manager@example.com',
    role: 'manager' as Role,
  },
}));

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

const sampleEntries: DocumentationEntry[] = [
  {
    id: 'doc-1',
    project_id: 'p-1',
    author_id: 'dev-1',
    author_name: 'Developer One',
    title: 'Guía de Arquitectura Hexagonal',
    category: 'Técnica',
    objective: 'Estandarizar capas de dominio y puertos',
    tags: 'arquitectura, backend, ddd',
    content: 'Reglas estrictas de dependencias hacia el centro.',
    external_url: 'https://docs.dashnode.io/arch',
    approval_status: 'APPROVED',
    is_pinned: true,
    is_visible_to_devs: true,
    rejection_reason: null,
    created_at: '2026-10-20T10:00:00Z',
    updated_at: '2026-10-20T10:00:00Z',
    can_edit: true,
    can_delete: true,
  },
  {
    id: 'doc-2',
    project_id: 'p-1',
    author_id: 'dev-2',
    author_name: 'Developer Two',
    title: 'Minuta de Reunión de Inicio',
    category: 'Reunión',
    objective: 'Acuerdos de sprint planning',
    tags: 'sprint, kick-off',
    content: 'Se acordó utilizar ramas por épica.',
    external_url: null,
    approval_status: 'PENDING',
    is_pinned: false,
    is_visible_to_devs: false,
    rejection_reason: null,
    created_at: '2026-10-22T14:30:00Z',
    updated_at: '2026-10-22T14:30:00Z',
    can_edit: false,
    can_delete: false,
  },
  {
    id: 'doc-3',
    project_id: 'p-1',
    author_id: 'user-manager-1',
    author_name: 'Manager User',
    title: 'Estándares de Código Rechazados',
    category: 'Técnica',
    objective: 'Estilo TypeScript estricto',
    tags: 'estándares, linter',
    content: 'Configuración de eslint y prettier.',
    external_url: null,
    approval_status: 'REJECTED',
    is_pinned: false,
    is_visible_to_devs: false,
    rejection_reason: 'Faltan reglas para componentes React y hooks.',
    created_at: '2026-10-25T11:00:00Z',
    updated_at: '2026-10-25T11:00:00Z',
    can_edit: true,
    can_delete: true,
  },
];

function renderKnowledgeTab(projectId = 'p-1') {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[`/proyectos/${projectId}/conocimiento`]}>
        <Routes>
          <Route path="/proyectos/:projectId/conocimiento" element={<ProjectKnowledgeTab />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );
}

describe('ProjectKnowledgeTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({
      user: {
        id: 'user-manager-1',
        name: 'Manager User',
        email: 'manager@example.com',
        role: 'manager' as Role,
      },
    });
    vi.mocked(docApi.listPendingApprovals).mockResolvedValue({
      entries: [sampleEntries[1]!],
      message: null,
    });
  });

  it('HU_DN_06_80: renders entries list with pinned badge and role-based permissions', async () => {
    vi.mocked(docApi.listDocumentationEntries).mockResolvedValue({
      entries: sampleEntries,
      message: null,
    });

    renderKnowledgeTab();

    expect(screen.getByText('Cargando documentación…')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Guía de Arquitectura Hexagonal')).toBeInTheDocument();
      expect(screen.getByText('Minuta de Reunión de Inicio')).toBeInTheDocument();
    });

    // Pinned entry shows 'Anclado'
    expect(screen.getByText('Anclado')).toBeInTheDocument();

    // Check action buttons based on can_edit and can_delete
    expect(screen.getByTestId('edit-doc-doc-1')).toBeInTheDocument();
    expect(screen.getByTestId('delete-doc-doc-1')).toBeInTheDocument();

    // doc-2 cannot be edited or deleted by this actor
    expect(screen.queryByTestId('edit-doc-doc-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delete-doc-doc-2')).not.toBeInTheDocument();
  });

  it('HU_DN_06_80: renders empty state when no entries exist', async () => {
    vi.mocked(docApi.listDocumentationEntries).mockResolvedValue({
      entries: [],
      message: DOCUMENTATION_MESSAGES.NO_ENTRIES,
    });

    renderKnowledgeTab();

    await waitFor(() => {
      expect(screen.getByTestId('empty-documentation-state')).toBeInTheDocument();
      expect(screen.getByText(DOCUMENTATION_MESSAGES.NO_ENTRIES)).toBeInTheDocument();
    });
  });

  it('HU_DN_06_77: opens create modal, validates required fields, external resource notice, and creates entry', async () => {
    const user = userEvent.setup();
    vi.mocked(docApi.listDocumentationEntries).mockResolvedValue({
      entries: [],
      message: DOCUMENTATION_MESSAGES.NO_ENTRIES,
    });
    vi.mocked(docApi.createDocumentationEntry).mockResolvedValue({
      message: DOCUMENTATION_MESSAGES.ENTRY_CREATED,
      entry: sampleEntries[0] ?? null,
    });

    renderKnowledgeTab();

    await waitFor(() => {
      expect(screen.getByTestId('create-doc-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('create-doc-button'));

    expect(screen.getByText('Nueva entrada de documentación')).toBeInTheDocument();

    // Fill in title
    const titleInput = screen.getByLabelText('Título');
    await user.type(titleInput, 'Guía de Pruebas');

    // Fill in URL and verify external notice appears
    const urlInput = screen.getByLabelText('Enlace externo');
    await user.type(urlInput, 'https://example.com/docs');

    expect(screen.getByText(DOCUMENTATION_MESSAGES.EXTERNAL_RESOURCE_NOTICE)).toBeInTheDocument();

    // Submit form
    await user.click(screen.getByRole('button', { name: 'Registrar entrada' }));

    await waitFor(() => {
      expect(docApi.createDocumentationEntry).toHaveBeenCalledWith(
        'p-1',
        expect.objectContaining({
          title: 'Guía de Pruebas',
          category: 'Técnica',
          external_url: 'https://example.com/docs',
        }),
      );
    });
  });

  it('HU_DN_06_78: edits entry and shows status reset notice if editing an approved entry', async () => {
    const user = userEvent.setup();
    vi.mocked(docApi.listDocumentationEntries).mockResolvedValue({
      entries: sampleEntries,
      message: null,
    });
    vi.mocked(docApi.updateDocumentationEntry).mockResolvedValue({
      message: DOCUMENTATION_MESSAGES.ENTRY_UPDATED,
      entry: sampleEntries[0] ?? null,
    });

    renderKnowledgeTab();

    await waitFor(() => {
      expect(screen.getByTestId('edit-doc-doc-1')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('edit-doc-doc-1'));

    expect(screen.getByText('Editar entrada de documentación')).toBeInTheDocument();
    expect(screen.getByText(DOCUMENTATION_MESSAGES.STATUS_RESET_NOTICE)).toBeInTheDocument();

    const titleInput = screen.getByLabelText('Título');
    await user.clear(titleInput);
    await user.type(titleInput, 'Guía Hexagonal Actualizada');

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(docApi.updateDocumentationEntry).toHaveBeenCalledWith(
        'p-1',
        'doc-1',
        expect.objectContaining({
          title: 'Guía Hexagonal Actualizada',
        }),
      );
    });
  });

  it('HU_DN_06_79: deletes entry with exact confirmation prompt', async () => {
    const user = userEvent.setup();
    vi.mocked(docApi.listDocumentationEntries).mockResolvedValue({
      entries: sampleEntries,
      message: null,
    });
    vi.mocked(docApi.deleteDocumentationEntry).mockResolvedValue({
      message: DOCUMENTATION_MESSAGES.ENTRY_DELETED,
      entry: null,
    });

    renderKnowledgeTab();

    await waitFor(() => {
      expect(screen.getByTestId('delete-doc-doc-1')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('delete-doc-doc-1'));

    expect(screen.getByText(DOCUMENTATION_MESSAGES.DELETE_CONFIRMATION)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(docApi.deleteDocumentationEntry).toHaveBeenCalledWith('p-1', 'doc-1');
    });
  });

  it('HU_DN_06_81: handles access denied error gracefully', async () => {
    vi.mocked(docApi.listDocumentationEntries).mockRejectedValue(
      new ApiError(403, {
        code: 'ACCESS_DENIED',
        message: DOCUMENTATION_MESSAGES.ENTRY_ACCESS_DENIED,
        fields: {},
      }),
    );

    renderKnowledgeTab();

    await waitFor(() => {
      expect(
        screen.getAllByText(DOCUMENTATION_MESSAGES.ENTRY_ACCESS_DENIED).length,
      ).toBeGreaterThan(0);
    });
  });

  it('HU_DN_06_82: allows Manager to toggle visibility of approved documentation for developers', async () => {
    const user = userEvent.setup();
    vi.mocked(docApi.listDocumentationEntries).mockResolvedValue({
      entries: sampleEntries,
      message: null,
    });
    vi.mocked(docApi.toggleDocumentationVisibility).mockResolvedValue({
      message: DOCUMENTATION_MESSAGES.VISIBILITY_UPDATED,
      entry: { ...sampleEntries[0]!, is_visible_to_devs: false },
    });

    renderKnowledgeTab();

    await waitFor(() => {
      expect(screen.getByTestId('toggle-visibility-doc-1')).toBeInTheDocument();
    });

    expect(screen.getByTestId('toggle-visibility-doc-1')).toHaveTextContent('Visible para devs');

    await user.click(screen.getByTestId('toggle-visibility-doc-1'));

    await waitFor(() => {
      expect(docApi.toggleDocumentationVisibility).toHaveBeenCalledWith('p-1', 'doc-1', false);
    });
  });

  it('HU_DN_06_83: renders approval queue subtab with pending entries for Manager', async () => {
    const user = userEvent.setup();
    vi.mocked(docApi.listDocumentationEntries).mockResolvedValue({
      entries: sampleEntries,
      message: null,
    });
    vi.mocked(docApi.listPendingApprovals).mockResolvedValue({
      entries: [sampleEntries[1]!],
      message: null,
    });

    renderKnowledgeTab();

    await waitFor(() => {
      expect(screen.getByTestId('subtab-approval-queue')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('subtab-approval-queue'));

    await waitFor(() => {
      expect(screen.getByTestId('pending-entry-doc-2')).toBeInTheDocument();
      expect(screen.getByText('Minuta de Reunión de Inicio')).toBeInTheDocument();
      expect(screen.getByText('Developer Two')).toBeInTheDocument();
      expect(screen.getByTestId('approve-btn-doc-2')).toBeInTheDocument();
      expect(screen.getByTestId('reject-btn-doc-2')).toBeInTheDocument();
    });
  });

  it('HU_DN_06_83: displays empty state message when approval queue has no entries', async () => {
    const user = userEvent.setup();
    vi.mocked(docApi.listDocumentationEntries).mockResolvedValue({
      entries: sampleEntries,
      message: null,
    });
    vi.mocked(docApi.listPendingApprovals).mockResolvedValue({
      entries: [],
      message: null,
    });

    renderKnowledgeTab();

    await waitFor(() => {
      expect(screen.getByTestId('subtab-approval-queue')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('subtab-approval-queue'));

    await waitFor(() => {
      expect(screen.getByTestId('empty-approval-queue')).toBeInTheDocument();
      expect(screen.getByText(DOCUMENTATION_MESSAGES.NO_PENDING_ENTRIES)).toBeInTheDocument();
    });
  });

  it('HU_DN_06_84: approves documentation entry and enforces RN-DOC-01 self-approval prevention', async () => {
    const user = userEvent.setup();
    const ownPendingEntry: DocumentationEntry = {
      ...sampleEntries[1]!,
      id: 'doc-own',
      author_id: 'user-manager-1',
      title: 'Minuta propia del Manager',
    };

    vi.mocked(docApi.listDocumentationEntries).mockResolvedValue({
      entries: sampleEntries,
      message: null,
    });
    vi.mocked(docApi.listPendingApprovals).mockResolvedValue({
      entries: [sampleEntries[1]!, ownPendingEntry],
      message: null,
    });
    vi.mocked(docApi.approveDocumentationEntry).mockResolvedValue({
      message: DOCUMENTATION_MESSAGES.ENTRY_APPROVED,
      entry: { ...sampleEntries[1]!, approval_status: 'APPROVED' },
    });

    renderKnowledgeTab();

    await waitFor(() => {
      expect(screen.getByTestId('subtab-approval-queue')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('subtab-approval-queue'));

    await waitFor(() => {
      expect(screen.getByTestId('approve-btn-doc-2')).toBeEnabled();
      expect(screen.getByTestId('approve-btn-doc-own')).toBeDisabled();
      expect(
        screen.getAllByText(DOCUMENTATION_MESSAGES.CANNOT_APPROVE_OWN_ENTRY).length,
      ).toBeGreaterThan(0);
    });

    // Approve non-own entry
    await user.click(screen.getByTestId('approve-btn-doc-2'));

    await waitFor(() => {
      expect(docApi.approveDocumentationEntry).toHaveBeenCalledWith('p-1', 'doc-2');
    });
  });

  it('HU_DN_06_85: rejects documentation entry with feedback modal', async () => {
    const user = userEvent.setup();
    vi.mocked(docApi.listDocumentationEntries).mockResolvedValue({
      entries: sampleEntries,
      message: null,
    });
    vi.mocked(docApi.listPendingApprovals).mockResolvedValue({
      entries: [sampleEntries[1]!],
      message: null,
    });
    vi.mocked(docApi.rejectDocumentationEntry).mockResolvedValue({
      message: DOCUMENTATION_MESSAGES.ENTRY_REJECTED,
      entry: {
        ...sampleEntries[1]!,
        approval_status: 'REJECTED',
        rejection_reason: 'Faltan detalles de arquitectura',
      },
    });

    renderKnowledgeTab();

    await waitFor(() => {
      expect(screen.getByTestId('subtab-approval-queue')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('subtab-approval-queue'));

    await waitFor(() => {
      expect(screen.getByTestId('reject-btn-doc-2')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('reject-btn-doc-2'));

    expect(screen.getByText('Rechazar entrada de documentación')).toBeInTheDocument();

    const textarea = screen.getByLabelText('Motivo de rechazo');
    await user.type(textarea, 'Faltan detalles de arquitectura');

    await user.click(screen.getByTestId('confirm-reject-btn'));

    await waitFor(() => {
      expect(docApi.rejectDocumentationEntry).toHaveBeenCalledWith(
        'p-1',
        'doc-2',
        'Faltan detalles de arquitectura',
      );
    });
  });

  it('HU_DN_06_86: author can view rejection feedback and resubmit rejected entry', async () => {
    const user = userEvent.setup();
    vi.mocked(docApi.listDocumentationEntries).mockResolvedValue({
      entries: sampleEntries,
      message: null,
    });
    vi.mocked(docApi.resubmitDocumentationEntry).mockResolvedValue({
      message: DOCUMENTATION_MESSAGES.ENTRY_RESUBMITTED,
      entry: { ...sampleEntries[2]!, approval_status: 'PENDING' },
    });

    renderKnowledgeTab();

    await waitFor(() => {
      expect(screen.getByText('Estándares de Código Rechazados')).toBeInTheDocument();
    });

    // Verify rejection feedback is visible on the card
    expect(screen.getByTestId('rejection-feedback-doc-3')).toHaveTextContent(
      'Faltan reglas para componentes React y hooks.',
    );

    // Click resubmit button on the card
    expect(screen.getByTestId('resubmit-doc-doc-3')).toBeInTheDocument();
    await user.click(screen.getByTestId('resubmit-doc-doc-3'));

    // Modal opens in resubmit mode with prior feedback
    expect(screen.getByText('Reenviar entrada a aprobación')).toBeInTheDocument();
    expect(screen.getByText('Motivo del rechazo anterior:')).toBeInTheDocument();

    // Edit and submit
    const titleInput = screen.getByLabelText('Título');
    await user.clear(titleInput);
    await user.type(titleInput, 'Estándares de Código v2 Corregidos');

    await user.click(screen.getByTestId('submit-doc-modal-btn'));

    await waitFor(() => {
      expect(docApi.resubmitDocumentationEntry).toHaveBeenCalledWith(
        'p-1',
        'doc-3',
        expect.objectContaining({
          title: 'Estándares de Código v2 Corregidos',
        }),
      );
    });
  });

  it('filters entries by search query and category', async () => {
    const user = userEvent.setup();
    vi.mocked(docApi.listDocumentationEntries).mockResolvedValue({
      entries: sampleEntries,
      message: null,
    });

    renderKnowledgeTab();

    await waitFor(() => {
      expect(screen.getByText('Guía de Arquitectura Hexagonal')).toBeInTheDocument();
      expect(screen.getByText('Minuta de Reunión de Inicio')).toBeInTheDocument();
    });

    // Search query
    const searchInput = screen.getByPlaceholderText('Buscar por título, contenido o etiqueta…');
    await user.type(searchInput, 'Hexagonal');

    expect(screen.getByText('Guía de Arquitectura Hexagonal')).toBeInTheDocument();
    expect(screen.queryByText('Minuta de Reunión de Inicio')).not.toBeInTheDocument();

    // Clear search
    await user.clear(searchInput);

    // Filter by Category
    const categorySelect = screen.getByLabelText('Filtrar por categoría');
    await user.selectOptions(categorySelect, 'Reunión');

    expect(screen.queryByText('Guía de Arquitectura Hexagonal')).not.toBeInTheDocument();
    expect(screen.getByText('Minuta de Reunión de Inicio')).toBeInTheDocument();
  });

  it('HU_DN_06_87: allows Admin and Manager to pin and unpin documentation entries with highlight and notification', async () => {
    const user = userEvent.setup();
    vi.mocked(docApi.listDocumentationEntries).mockResolvedValue({
      entries: sampleEntries,
      message: null,
    });
    vi.mocked(docApi.toggleDocumentationPin).mockResolvedValueOnce({
      message: DOCUMENTATION_MESSAGES.ENTRY_PINNED,
      entry: { ...sampleEntries[1]!, is_pinned: true },
    });

    renderKnowledgeTab();

    await waitFor(() => {
      expect(screen.getByText('Minuta de Reunión de Inicio')).toBeInTheDocument();
    });

    // doc-2 is initially unpinned: action button says "Anclar al inicio"
    const pinBtn = screen.getByTestId('toggle-pin-doc-doc-2');
    expect(pinBtn).toHaveAttribute('title', DOCUMENTATION_MESSAGES.PIN_ACTION);

    // Manager clicks to pin doc-2
    await user.click(pinBtn);

    await waitFor(() => {
      expect(docApi.toggleDocumentationPin).toHaveBeenCalledWith('p-1', 'doc-2');
      expect(screen.getByText(DOCUMENTATION_MESSAGES.ENTRY_PINNED)).toBeInTheDocument();
    });

    // Unpin action mock
    vi.mocked(docApi.toggleDocumentationPin).mockResolvedValueOnce({
      message: DOCUMENTATION_MESSAGES.ENTRY_UNPINNED,
      entry: { ...sampleEntries[1]!, is_pinned: false },
    });

    // Action button now says "Desanclar"
    expect(pinBtn).toHaveAttribute('title', DOCUMENTATION_MESSAGES.UNPIN_ACTION);
    await user.click(pinBtn);

    await waitFor(() => {
      expect(screen.getByText(DOCUMENTATION_MESSAGES.ENTRY_UNPINNED)).toBeInTheDocument();
    });
  });

  it('HU_DN_06_89: pins entry to the top of the list and restores normal order without form', async () => {
    const user = userEvent.setup();
    // sampleEntries has doc-1 (pinned, older) and doc-2 (unpinned, newer)
    vi.mocked(docApi.listDocumentationEntries).mockResolvedValue({
      entries: sampleEntries,
      message: null,
    });
    vi.mocked(docApi.toggleDocumentationPin).mockResolvedValue({
      message: DOCUMENTATION_MESSAGES.ENTRY_PINNED_SHORT,
      entry: { ...sampleEntries[1]!, is_pinned: true },
    });

    renderKnowledgeTab();

    await waitFor(() => {
      expect(screen.getByText('Guía de Arquitectura Hexagonal')).toBeInTheDocument();
    });

    // Initial order: doc-1 is pinned, so doc-1 appears first in the list
    const cardsBefore = screen.getAllByTestId(/^doc-entry-card-/);
    expect(cardsBefore[0]).toHaveAttribute('data-testid', 'doc-entry-card-doc-1');

    // Pin doc-2 without opening any modal/form
    const pinBtn = screen.getByTestId('toggle-pin-doc-doc-2');
    await user.click(pinBtn);

    await waitFor(() => {
      expect(docApi.toggleDocumentationPin).toHaveBeenCalledWith('p-1', 'doc-2');
    });

    // Verification: doc-2 is now pinned, and since doc-2 is newer than doc-1, both are pinned and doc-2 is at top
    const cardsAfter = screen.getAllByTestId(/^doc-entry-card-/);
    expect(cardsAfter[0]).toHaveAttribute('data-testid', 'doc-entry-card-doc-2');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('HU_DN_06_87 & HU_DN_06_89: Developer cannot pin or unpin entries', async () => {
    useAuthMock.mockReturnValue({
      user: {
        id: 'dev-1',
        name: 'Developer User',
        email: 'dev@example.com',
        role: 'developer' as const,
      },
    });

    vi.mocked(docApi.listDocumentationEntries).mockResolvedValue({
      entries: sampleEntries,
      message: null,
    });

    renderKnowledgeTab();

    await waitFor(() => {
      expect(screen.getByText('Guía de Arquitectura Hexagonal')).toBeInTheDocument();
    });

    // Developer should not see the pin toggle button
    expect(screen.queryByTestId('toggle-pin-doc-doc-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('toggle-pin-doc-doc-2')).not.toBeInTheDocument();
  });

  it('HU_DN_06_87 & HU_DN_06_89: shows generic error on technical failure without altering data', async () => {
    const user = userEvent.setup();
    vi.mocked(docApi.listDocumentationEntries).mockResolvedValue({
      entries: sampleEntries,
      message: null,
    });
    vi.mocked(docApi.toggleDocumentationPin).mockRejectedValue(new Error('Network error'));

    renderKnowledgeTab();

    await waitFor(() => {
      expect(screen.getByText('Minuta de Reunión de Inicio')).toBeInTheDocument();
    });

    const pinBtn = screen.getByTestId('toggle-pin-doc-doc-2');
    await user.click(pinBtn);

    await waitFor(() => {
      expect(screen.getByText(DOCUMENTATION_MESSAGES.GENERIC_ERROR)).toBeInTheDocument();
    });
  });
});
