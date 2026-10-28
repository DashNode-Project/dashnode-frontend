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

vi.mock('./api');

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
    created_at: '2026-10-22T14:30:00Z',
    updated_at: '2026-10-22T14:30:00Z',
    can_edit: false,
    can_delete: false,
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
});
