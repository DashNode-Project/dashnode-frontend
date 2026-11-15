import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, RefreshCw, User, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge, Card } from '@/components/ui/demo-ui';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { useToast } from '@/lib/toast/ToastProvider';
import { approveDocumentationEntry, listPendingApprovals, rejectDocumentationEntry } from '../api';
import { DOCUMENTATION_MESSAGES } from '../messages';
import type { DocumentationEntry } from '../types';
import { RejectDocumentationModal } from './RejectDocumentationModal';

interface ApprovalQueueViewProps {
  projectId: string;
  currentUserId?: string;
  onViewEntry?: (entry: DocumentationEntry) => void;
  onQueueUpdated?: () => void;
}

export function ApprovalQueueView({
  projectId,
  currentUserId,
  onViewEntry,
  onQueueUpdated,
}: ApprovalQueueViewProps) {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<DocumentationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectingEntry, setRejectingEntry] = useState<DocumentationEntry | null>(null);

  const fetchQueue = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    setIsAccessDenied(false);
    try {
      const res = await listPendingApprovals(projectId);
      setEntries(res.entries || []);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setIsAccessDenied(true);
          setError(err.message || 'No tiene permisos para acceder a la cola de aprobación.');
          return;
        }
        if (!isTechnicalFailure(err)) {
          setError(err.message);
          showToast(err.message, 'error');
          return;
        }
      }
      setError(DOCUMENTATION_MESSAGES.LOAD_ERROR);
      showToast(DOCUMENTATION_MESSAGES.LOAD_ERROR, 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId, showToast]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await listPendingApprovals(projectId);
        if (cancelled) return;
        setEntries(res.entries || []);
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) {
          setIsAccessDenied(true);
          setError(err.message || 'No tiene permisos para acceder a la cola de aprobación.');
          return;
        }
        setError(DOCUMENTATION_MESSAGES.LOAD_ERROR);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const handleApprove = async (entry: DocumentationEntry) => {
    if (currentUserId && entry.author_id === currentUserId) {
      showToast(DOCUMENTATION_MESSAGES.CANNOT_APPROVE_OWN_ENTRY, 'error');
      return;
    }
    setActionLoadingId(entry.id);
    try {
      const res = await approveDocumentationEntry(projectId, entry.id);
      showToast(res.message || DOCUMENTATION_MESSAGES.ENTRY_APPROVED, 'success');
      await fetchQueue();
      if (onQueueUpdated) onQueueUpdated();
    } catch (err: unknown) {
      if (err instanceof ApiError && !isTechnicalFailure(err)) {
        showToast(err.message, 'error');
      } else {
        showToast(DOCUMENTATION_MESSAGES.GENERIC_ERROR, 'error');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectingEntry) return;
    setActionLoadingId(rejectingEntry.id);
    try {
      const res = await rejectDocumentationEntry(projectId, rejectingEntry.id, reason);
      showToast(res.message || DOCUMENTATION_MESSAGES.ENTRY_REJECTED, 'success');
      setRejectingEntry(null);
      await fetchQueue();
      if (onQueueUpdated) onQueueUpdated();
    } catch (err: unknown) {
      if (err instanceof ApiError && !isTechnicalFailure(err)) {
        showToast(err.message, 'error');
      } else {
        showToast(DOCUMENTATION_MESSAGES.GENERIC_ERROR, 'error');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5" data-testid="approval-queue-view">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#F9FAFB]">
            {DOCUMENTATION_MESSAGES.APPROVAL_QUEUE_TITLE}
          </h3>
          <p className="mt-0.5 text-xs text-[#9CA3AF]">
            Revisa las entradas pendientes registradas por el equipo para aprobarlas o solicitar
            ajustes.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void fetchQueue()}
          disabled={loading}
          iconLeft={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
        >
          Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-xs text-[#9CA3AF]">
          Cargando cola de aprobación…
        </div>
      ) : isAccessDenied ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-xs text-red-300"
          data-testid="approval-queue-access-denied"
        >
          <AlertCircle size={24} className="text-red-400" />
          <p className="font-semibold">{error || 'Acceso no autorizado (HTTP 403 Forbidden)'}</p>
          <p className="text-[#9CA3AF]">
            Esta sección solo está disponible para Administradores y Gerentes del proyecto.
          </p>
        </div>
      ) : error ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-xs text-red-400">
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={() => void fetchQueue()}>
            Reintentar
          </Button>
        </div>
      ) : entries.length === 0 ? (
        <div
          className="flex h-52 flex-col items-center justify-center gap-3 rounded-xl border border-white/6 bg-[#12131C] p-6 text-center"
          data-testid="empty-approval-queue"
        >
          <div className="rounded-full bg-white/5 p-3 text-[#6B7280]">
            <CheckCircle2 size={24} className="text-green-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#F9FAFB]">
              {DOCUMENTATION_MESSAGES.NO_PENDING_ENTRIES}
            </h4>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Todas las entradas de documentación han sido revisadas y procesadas.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => {
            const isOwnEntry = Boolean(currentUserId && entry.author_id === currentUserId);
            const isBusy = actionLoadingId === entry.id;
            const formattedDate = new Date(entry.created_at).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });

            return (
              <Card
                key={entry.id}
                className="flex flex-col justify-between gap-4 p-4 transition-all duration-150 hover:border-white/15 sm:flex-row sm:items-center"
                data-testid={`pending-entry-${entry.id}`}
              >
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="blue">{entry.category}</Badge>
                    <Badge tone="yellow">Pendiente</Badge>
                    {isOwnEntry ? (
                      <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                        Tuya
                      </span>
                    ) : null}
                  </div>

                  <h4 className="text-sm font-semibold text-[#F9FAFB]">
                    {onViewEntry ? (
                      <button
                        type="button"
                        onClick={() => onViewEntry(entry)}
                        className="text-left font-semibold text-[#F9FAFB] hover:text-blue-400 focus:outline-none"
                      >
                        {entry.title}
                      </button>
                    ) : (
                      entry.title
                    )}
                  </h4>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6B7280]">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {entry.author_name || 'Desconocido'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formattedDate}
                    </span>
                  </div>

                  {entry.objective ? (
                    <p className="line-clamp-2 text-xs italic text-[#9CA3AF]">{entry.objective}</p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                  {isOwnEntry ? (
                    <span
                      className="text-[11px] text-amber-400"
                      title={DOCUMENTATION_MESSAGES.CANNOT_APPROVE_OWN_ENTRY}
                    >
                      {DOCUMENTATION_MESSAGES.CANNOT_APPROVE_OWN_ENTRY}
                    </span>
                  ) : null}

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={isOwnEntry || isBusy}
                    loading={isBusy}
                    onClick={() => void handleApprove(entry)}
                    title={
                      isOwnEntry
                        ? DOCUMENTATION_MESSAGES.CANNOT_APPROVE_OWN_ENTRY
                        : 'Aprobar entrada'
                    }
                    data-testid={`approve-btn-${entry.id}`}
                    iconLeft={<CheckCircle2 size={13} />}
                  >
                    Aprobar
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => setRejectingEntry(entry)}
                    data-testid={`reject-btn-${entry.id}`}
                    className="border-red-500/20 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                    iconLeft={<XCircle size={13} className="text-red-400" />}
                  >
                    Rechazar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      <RejectDocumentationModal
        isOpen={rejectingEntry !== null}
        entryTitle={rejectingEntry?.title || ''}
        onClose={() => setRejectingEntry(null)}
        onConfirm={handleRejectConfirm}
        loading={actionLoadingId === rejectingEntry?.id}
      />
    </div>
  );
}
