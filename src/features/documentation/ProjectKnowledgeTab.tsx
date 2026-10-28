import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import {
  BookOpen,
  Calendar,
  Edit2,
  ExternalLink,
  Filter,
  Pin,
  Plus,
  Search,
  Trash2,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge, Card } from '@/components/ui/demo-ui';
import { useToast } from '@/lib/toast/ToastProvider';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import {
  createDocumentationEntry,
  deleteDocumentationEntry,
  listDocumentationEntries,
  updateDocumentationEntry,
} from './api';
import { DeleteDocumentationModal } from './components/DeleteDocumentationModal';
import { DocumentationDetailModal } from './components/DocumentationDetailModal';
import { DocumentationModal } from './components/DocumentationModal';
import { DOCUMENTATION_MESSAGES } from './messages';
import type { CreateDocumentationPayload, DocumentationEntry } from './types';

export default function ProjectKnowledgeTab() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const { showToast } = useToast();

  const [entries, setEntries] = useState<DocumentationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals state
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DocumentationEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<DocumentationEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<DocumentationEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listDocumentationEntries(projectId);
      setEntries(res.entries || []);
    } catch (err: unknown) {
      if (err instanceof ApiError && !isTechnicalFailure(err)) {
        setError(err.message);
        showToast(err.message, 'error');
      } else {
        setError(DOCUMENTATION_MESSAGES.LOAD_ERROR);
        showToast(DOCUMENTATION_MESSAGES.LOAD_ERROR, 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, showToast]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await listDocumentationEntries(projectId);
        if (cancelled) return;
        setEntries(res.entries || []);
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof ApiError && !isTechnicalFailure(err)) {
          setError(err.message);
          showToast(err.message, 'error');
        } else {
          setError(DOCUMENTATION_MESSAGES.LOAD_ERROR);
          showToast(DOCUMENTATION_MESSAGES.LOAD_ERROR, 'error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, showToast]);

  const handleSave = async (payload: CreateDocumentationPayload) => {
    if (!projectId) return;
    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        const res = await createDocumentationEntry(projectId, payload);
        showToast(res.message || DOCUMENTATION_MESSAGES.ENTRY_CREATED, 'success');
      } else if (modalMode === 'edit' && selectedEntry) {
        const res = await updateDocumentationEntry(projectId, selectedEntry.id, payload);
        showToast(res.message || DOCUMENTATION_MESSAGES.ENTRY_UPDATED, 'success');
      }
      setModalMode(null);
      setSelectedEntry(null);
      await fetchEntries();
    } catch (err: unknown) {
      if (err instanceof ApiError && !isTechnicalFailure(err)) {
        showToast(err.message, 'error');
        throw err;
      } else {
        showToast(DOCUMENTATION_MESSAGES.GENERIC_ERROR, 'error');
        throw new Error(DOCUMENTATION_MESSAGES.GENERIC_ERROR);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId || !deletingEntry) return;
    setSubmitting(true);
    try {
      const res = await deleteDocumentationEntry(projectId, deletingEntry.id);
      showToast(res.message || DOCUMENTATION_MESSAGES.ENTRY_DELETED, 'success');
      setDeletingEntry(null);
      await fetchEntries();
    } catch (err: unknown) {
      if (err instanceof ApiError && !isTechnicalFailure(err)) {
        showToast(err.message, 'error');
      } else {
        showToast(DOCUMENTATION_MESSAGES.GENERIC_ERROR, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Category filter
      if (selectedCategory !== 'all' && entry.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all' && entry.approval_status !== selectedStatus) {
        return false;
      }
      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = entry.title.toLowerCase().includes(term);
        const matchContent = entry.content?.toLowerCase().includes(term) ?? false;
        const matchTags = entry.tags?.toLowerCase().includes(term) ?? false;
        const matchObjective = entry.objective?.toLowerCase().includes(term) ?? false;
        if (!matchTitle && !matchContent && !matchTags && !matchObjective) {
          return false;
        }
      }
      return true;
    });
  }, [entries, selectedCategory, selectedStatus, searchTerm]);

  return (
    <div className="flex flex-col gap-6" data-testid="project-knowledge-tab">
      {/* Header and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#F9FAFB]">Base de conocimiento</h2>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            Documenta soluciones técnicas, patrones y aprendizajes del equipo.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setSelectedEntry(null);
            setModalMode('create');
          }}
          className="gap-2"
          data-testid="create-doc-button"
        >
          <Plus size={16} />
          Nueva entrada
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, contenido o etiqueta…"
            className="h-9 w-full rounded-lg border border-white/10 bg-[#0A0B0E] pl-9 pr-3 text-xs text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[#6B7280]" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filtrar por categoría"
            className="h-9 rounded-lg border border-white/10 bg-[#0A0B0E] px-3 text-xs text-[#F9FAFB] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
          >
            <option value="all">Todas las categorías</option>
            <option value="Técnica">Técnica</option>
            <option value="Funcional">Funcional</option>
            <option value="Reunión">Reunión</option>
            <option value="General">General</option>
            <option value="Prompt">Prompt</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filtrar por estado"
            className="h-9 rounded-lg border border-white/10 bg-[#0A0B0E] px-3 text-xs text-[#F9FAFB] focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
          >
            <option value="all">Todos los estados</option>
            <option value="APPROVED">Aprobadas</option>
            <option value="PENDING">Pendientes</option>
            <option value="REJECTED">Rechazadas</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-xs text-[#9CA3AF]">
          Cargando documentación…
        </div>
      ) : error ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-xs text-red-400">
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={() => void fetchEntries()}>
            Reintentar
          </Button>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div
          className="flex h-56 flex-col items-center justify-center gap-3 rounded-xl border border-white/6 bg-[#12131C] p-6 text-center"
          data-testid="empty-documentation-state"
        >
          <div className="rounded-full bg-white/5 p-3 text-[#6B7280]">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#F9FAFB]">
              {entries.length === 0
                ? DOCUMENTATION_MESSAGES.NO_ENTRIES
                : 'No se encontraron entradas con los filtros aplicados.'}
            </h3>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              {entries.length === 0
                ? 'Documenta soluciones técnicas, patrones y aprendizajes del equipo.'
                : 'Intenta cambiar los términos de búsqueda o filtros.'}
            </p>
          </div>
          {entries.length === 0 ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setSelectedEntry(null);
                setModalMode('create');
              }}
            >
              <Plus size={14} className="mr-1" />
              Nueva entrada
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEntries.map((entry) => {
            const formattedDate = new Date(entry.created_at).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });

            const statusTone =
              entry.approval_status === 'APPROVED'
                ? 'green'
                : entry.approval_status === 'REJECTED'
                  ? 'red'
                  : 'yellow';

            const statusLabel =
              entry.approval_status === 'APPROVED'
                ? 'Aprobada'
                : entry.approval_status === 'REJECTED'
                  ? 'Rechazada'
                  : 'Pendiente';

            return (
              <Card
                key={entry.id}
                className={`flex flex-col justify-between p-4 transition-all duration-150 hover:border-white/15 ${
                  entry.is_pinned ? 'border-amber-500/30 bg-[#161722]' : ''
                }`}
                data-testid={`doc-entry-card-${entry.id}`}
              >
                <div>
                  {/* Card Header: Badges & Actions */}
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {entry.is_pinned ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/25 bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                          <Pin size={11} className="text-amber-400" />
                          Anclado
                        </span>
                      ) : null}
                      <Badge tone="blue">{entry.category}</Badge>
                      <Badge tone={statusTone}>{statusLabel}</Badge>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {entry.can_edit ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEntry(entry);
                            setModalMode('edit');
                          }}
                          className="rounded p-1 text-[#9CA3AF] transition-colors hover:bg-white/5 hover:text-[#F9FAFB]"
                          title="Editar entrada"
                          aria-label={`Editar ${entry.title}`}
                          data-testid={`edit-doc-${entry.id}`}
                        >
                          <Edit2 size={13} />
                        </button>
                      ) : null}
                      {entry.can_delete ? (
                        <button
                          type="button"
                          onClick={() => setDeletingEntry(entry)}
                          className="rounded p-1 text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                          title="Eliminar entrada"
                          aria-label={`Eliminar ${entry.title}`}
                          data-testid={`delete-doc-${entry.id}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="line-clamp-2 text-sm font-semibold text-[#F9FAFB]">
                    <button
                      type="button"
                      onClick={() => setViewingEntry(entry)}
                      className="text-left font-semibold text-[#F9FAFB] hover:text-blue-400 focus:outline-none"
                      title={entry.title}
                    >
                      {entry.title}
                    </button>
                  </h3>

                  {/* Author & Date */}
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-[#6B7280]">
                    <span className="flex items-center gap-1">
                      <User size={11} />
                      {entry.author_name || 'Desconocido'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {formattedDate}
                    </span>
                  </div>

                  {/* Objective (if any) */}
                  {entry.objective ? (
                    <p className="mt-2 line-clamp-2 text-xs italic text-[#9CA3AF]">
                      {entry.objective}
                    </p>
                  ) : null}

                  {/* Content snippet */}
                  {entry.content ? (
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#D1D5DB]">
                      {entry.content}
                    </p>
                  ) : null}
                </div>

                {/* Card Footer: External link and Tags */}
                <div className="mt-3 flex flex-col gap-2 border-t border-white/6 pt-2">
                  {entry.external_url ? (
                    <a
                      href={entry.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline"
                    >
                      <ExternalLink size={11} />
                      Recurso externo
                    </a>
                  ) : null}

                  {entry.tags ? (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .slice(0, 3)
                        .map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-[#9CA3AF]"
                          >
                            #{tag}
                          </span>
                        ))}
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalMode !== null ? (
        <DocumentationModal
          key={selectedEntry ? `edit-${selectedEntry.id}` : 'create'}
          isOpen={true}
          mode={modalMode}
          initialEntry={selectedEntry}
          onClose={() => {
            setModalMode(null);
            setSelectedEntry(null);
          }}
          onSave={handleSave}
          loading={submitting}
        />
      ) : null}

      {/* Delete Confirmation Modal */}
      <DeleteDocumentationModal
        isOpen={deletingEntry !== null}
        entryTitle={deletingEntry?.title || ''}
        onClose={() => setDeletingEntry(null)}
        onConfirm={handleDelete}
        loading={submitting}
      />

      {/* Detail Modal */}
      <DocumentationDetailModal
        isOpen={viewingEntry !== null}
        entry={viewingEntry}
        onClose={() => setViewingEntry(null)}
        onEdit={(e) => {
          setSelectedEntry(e);
          setModalMode('edit');
        }}
        onDelete={(e) => setDeletingEntry(e)}
      />
    </div>
  );
}
