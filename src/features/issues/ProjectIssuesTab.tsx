import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import {
  AlertCircle,
  Brain,
  Download,
  FileCode,
  Film,
  Image as ImageIcon,
  Plus,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar, Card } from '@/components/ui/demo-ui';
import { useAuth } from '@/features/auth/AuthContext';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { useToast } from '@/lib/toast/ToastProvider';
import { attachEvidence, createIssue, getIssueDetail, listIssues } from './api';
import { AddEvidenceModal } from './components/AddEvidenceModal';
import { CreateIssueModal } from './components/CreateIssueModal';
import { ISSUE_MESSAGES } from './messages';
import type {
  CreateIssuePayload,
  Evidence,
  Issue,
  IssueDetail,
} from './types';

const SEVERITY_BADGE_STYLE: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  low: 'bg-[#374151] text-[#9CA3AF] border border-white/10',
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'CRÍTICA',
  high: 'ALTA',
  medium: 'MEDIA',
  low: 'BAJA',
};

const STATUS_BADGE_STYLE: Record<string, string> = {
  open: 'bg-[#374151] text-[#9CA3AF]',
  'in-progress': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  resolved: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  closed: 'bg-[#374151] text-[#4B5563]',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Abierto',
  'in-progress': 'En progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

const TYPE_LABELS: Record<string, string> = {
  bug: 'Bug',
  regression: 'Regresión',
  performance: 'Rendimiento',
  security: 'Seguridad',
  ux: 'UX',
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function ProjectIssuesTab() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { user } = useAuth();

  // URL Query Params Synchronization
  const filterStatus = searchParams.get('status') || 'all';
  const filterSeverity = searchParams.get('severity') || 'all';
  const filterType = searchParams.get('type') || 'all';

  const [issues, setIssues] = useState<Issue[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [selectedIssueDetail, setSelectedIssueDetail] = useState<IssueDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [addEvidenceModalOpen, setAddEvidenceModalOpen] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

  // Simulated AI analysis state adhering to DA-08 (Zero automatic mutations)
  const [analyzingEvId, setAnalyzingEvId] = useState<string | null>(null);
  const [aiAnalysisComplete, setAiAnalysisComplete] = useState<Record<string, boolean>>({});

  // Fetch issues list from server
  const fetchIssues = useCallback(
    async (cursor?: string) => {
      if (!projectId) return;
      if (!cursor) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const res = await listIssues(projectId, {
          status: filterStatus !== 'all' ? filterStatus : undefined,
          severity: filterSeverity !== 'all' ? filterSeverity : undefined,
          type: filterType !== 'all' ? filterType : undefined,
          cursor,
          limit: 25,
        });

        if (cursor) {
          setIssues((prev) => [...prev, ...res.items]);
        } else {
          setIssues(res.items);
          if (res.items.length > 0 && !selectedIssueId) {
            setSelectedIssueId(res.items[0].id);
          }
        }
        setNextCursor(res.next_cursor || null);
        setTotalCount(res.total);
      } catch (err: unknown) {
        if (err instanceof ApiError && !isTechnicalFailure(err)) {
          setError(err.message);
          showToast(err.message, 'error');
        } else {
          setError(ISSUE_MESSAGES.GENERIC_ERROR);
          showToast(ISSUE_MESSAGES.GENERIC_ERROR, 'error');
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [projectId, filterStatus, filterSeverity, filterType, selectedIssueId, showToast],
  );

  // Initial and parameter change load
  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Load detail when selected issue changes
  useEffect(() => {
    if (!projectId || !selectedIssueId) {
      setSelectedIssueDetail(null);
      return;
    }

    let isCurrent = true;
    setLoadingDetail(true);

    getIssueDetail(projectId, selectedIssueId)
      .then((detail) => {
        if (isCurrent) {
          setSelectedIssueDetail(detail);
        }
      })
      .catch((err: unknown) => {
        if (isCurrent) {
          if (err instanceof ApiError && !isTechnicalFailure(err)) {
            showToast(err.message, 'error');
          } else {
            showToast(ISSUE_MESSAGES.GENERIC_ERROR, 'error');
          }
        }
      })
      .finally(() => {
        if (isCurrent) setLoadingDetail(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [projectId, selectedIssueId, showToast]);

  // Filter change handlers that update URL query parameters and reset cursor
  const updateFilter = (key: 'status' | 'severity' | 'type', value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    setSearchParams(nextParams);
  };

  const hasActiveFilters = filterStatus !== 'all' || filterSeverity !== 'all' || filterType !== 'all';

  // Handle Create Issue
  const handleCreateIssue = async (payload: CreateIssuePayload) => {
    setSubmittingCreate(true);
    try {
      const res = await createIssue(projectId, payload);
      showToast(res.message || ISSUE_MESSAGES.ISSUE_CREATED, 'success');
      setCreateModalOpen(false);
      await fetchIssues();
      if (res.issue?.id) {
        setSelectedIssueId(res.issue.id);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && !isTechnicalFailure(err)) {
        showToast(err.message, 'error');
      } else {
        showToast(ISSUE_MESSAGES.GENERIC_ERROR, 'error');
      }
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Handle Attach Evidence
  const handleAttachEvidence = async (file: File, title?: string) => {
    if (!selectedIssueId) return;
    setSubmittingEvidence(true);
    try {
      const res = await attachEvidence(projectId, selectedIssueId, file, title);
      showToast(res.message || ISSUE_MESSAGES.EVIDENCE_ATTACHED, 'success');
      setAddEvidenceModalOpen(false);
      // Refresh detail and list
      const refreshedDetail = await getIssueDetail(projectId, selectedIssueId);
      setSelectedIssueDetail(refreshedDetail);
      setIssues((prev) =>
        prev.map((iss) =>
          iss.id === selectedIssueId
            ? { ...iss, evidences_count: refreshedDetail.evidences.length }
            : iss,
        ),
      );
    } catch (err: unknown) {
      if (err instanceof ApiError && !isTechnicalFailure(err)) {
        showToast(err.message, 'error');
      } else {
        showToast(ISSUE_MESSAGES.GENERIC_ERROR, 'error');
      }
      throw err;
    } finally {
      setSubmittingEvidence(false);
    }
  };

  // Run AI Analysis proposal (strictly advisory, no automatic mutations)
  const handleRunAIAnalysis = (evId: string) => {
    setAnalyzingEvId(evId);
    setTimeout(() => {
      setAnalyzingEvId(null);
      setAiAnalysisComplete((prev) => ({ ...prev, [evId]: true }));
      showToast('Propuesta de diagnóstico IA generada. Recuerda validar manualmente.', 'info');
    }, 1500);
  };

  const evTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={14} className="text-blue-400" />;
      case 'video':
        return <Film size={14} className="text-violet-400" />;
      case 'log':
        return <FileCode size={14} className="text-emerald-400" />;
      default:
        return <FileCode size={14} className="text-[#6B7280]" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            aria-label="Filtrar por estado"
            value={filterStatus}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="rounded-lg border border-white/10 bg-[#1E1F2B] px-3 py-1.5 text-sm text-[#F9FAFB] focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="open">Abierto</option>
            <option value="in-progress">En progreso</option>
            <option value="resolved">Resuelto</option>
            <option value="closed">Cerrado</option>
          </select>

          {/* Severity filter */}
          <select
            aria-label="Filtrar por severidad"
            value={filterSeverity}
            onChange={(e) => updateFilter('severity', e.target.value)}
            className="rounded-lg border border-white/10 bg-[#1E1F2B] px-3 py-1.5 text-sm text-[#F9FAFB] focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Todas las severidades</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>

          {/* Type filter */}
          <select
            aria-label="Filtrar por tipo"
            value={filterType}
            onChange={(e) => updateFilter('type', e.target.value)}
            className="rounded-lg border border-white/10 bg-[#1E1F2B] px-3 py-1.5 text-sm text-[#F9FAFB] focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Todos los tipos</option>
            <option value="bug">Bug</option>
            <option value="regression">Regresión</option>
            <option value="performance">Rendimiento</option>
            <option value="security">Seguridad</option>
            <option value="ux">UX</option>
          </select>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5"
        >
          <Plus size={15} />
          <span>Nuevo fix</span>
        </Button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span>Cargando issues…</span>
          </div>
        </div>
      ) : issues.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-3 rounded-full bg-white/5 p-4 text-[#6B7280]">
            <Wrench size={32} />
          </div>
          <h3 className="text-base font-medium text-[#F9FAFB]">
            {hasActiveFilters
              ? ISSUE_MESSAGES.NO_FILTERED_ISSUES
              : ISSUE_MESSAGES.NO_ISSUES_FOUND}
          </h3>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            {hasActiveFilters
              ? 'Intenta ajustar los criterios de búsqueda o limpiar los filtros.'
              : 'Registra un problema técnico o fix para comenzar su seguimiento.'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Left Column: Issue List */}
          <div className="space-y-2 lg:col-span-1">
            {issues.map((iss) => {
              const isSelected = selectedIssueId === iss.id;
              return (
                <div
                  key={iss.id}
                  onClick={() => setSelectedIssueId(iss.id)}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                    isSelected
                      ? 'border-blue-500/50 bg-blue-500/5 shadow-sm'
                      : 'border-white/8 bg-[#12131C] hover:border-white/15'
                  }`}
                >
                  <div className="mb-2 flex items-start gap-2">
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${
                        SEVERITY_BADGE_STYLE[iss.severity] || ''
                      }`}
                    >
                      {SEVERITY_LABELS[iss.severity] || iss.severity.toUpperCase()}
                    </span>
                    <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-xs text-[#9CA3AF]">
                      {TYPE_LABELS[iss.type] || iss.type}
                    </span>
                    <p className="flex-1 text-sm font-medium leading-snug text-[#F9FAFB]">
                      {iss.title}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#6B7280]">
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        STATUS_BADGE_STYLE[iss.status] || ''
                      }`}
                    >
                      {STATUS_LABELS[iss.status] || iss.status}
                    </span>
                    <div className="flex items-center gap-2">
                      {iss.evidences_count > 0 && (
                        <span>{iss.evidences_count} ev.</span>
                      )}
                      <Avatar name={iss.reporter_name} size={20} />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Button */}
            {nextCursor && (
              <div className="pt-2 text-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fetchIssues(nextCursor)}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Cargando más…' : 'Cargar más issues'}
                </Button>
              </div>
            )}
          </div>

          {/* Right Column: Selected Issue Detail */}
          <div className="lg:col-span-2">
            {loadingDetail ? (
              <Card className="flex h-64 items-center justify-center p-6">
                <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  <span>Cargando detalle del issue…</span>
                </div>
              </Card>
            ) : selectedIssueDetail ? (
              <Card className="space-y-6 p-6">
                {/* Header */}
                <div className="space-y-2 border-b border-white/6 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-bold ${
                        SEVERITY_BADGE_STYLE[selectedIssueDetail.severity] || ''
                      }`}
                    >
                      {SEVERITY_LABELS[selectedIssueDetail.severity] ||
                        selectedIssueDetail.severity.toUpperCase()}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_BADGE_STYLE[selectedIssueDetail.status] || ''
                      }`}
                    >
                      {STATUS_LABELS[selectedIssueDetail.status] || selectedIssueDetail.status}
                    </span>
                    <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-[#9CA3AF]">
                      Tipo: {TYPE_LABELS[selectedIssueDetail.type] || selectedIssueDetail.type}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-[#F9FAFB]">
                    {selectedIssueDetail.title}
                  </h2>

                  {selectedIssueDetail.description && (
                    <p className="text-sm leading-relaxed text-[#9CA3AF]">
                      {selectedIssueDetail.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B7280] pt-2">
                    <div className="flex items-center gap-1.5">
                      <span>Reportado por:</span>
                      <span className="font-medium text-[#F9FAFB]">
                        {selectedIssueDetail.reporter_name}
                      </span>
                    </div>
                    {selectedIssueDetail.assignee_name && (
                      <div className="flex items-center gap-1.5">
                        <span>Responsable:</span>
                        <span className="font-medium text-[#F9FAFB]">
                          {selectedIssueDetail.assignee_name}
                        </span>
                      </div>
                    )}
                    <div>
                      <span>Fecha: </span>
                      <span>
                        {new Date(selectedIssueDetail.created_at).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resolution Note if resolved */}
                {selectedIssueDetail.resolution_note && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <p className="text-xs font-semibold text-emerald-400 mb-1">
                      Nota de resolución
                    </p>
                    <p className="text-sm text-[#F9FAFB]">
                      {selectedIssueDetail.resolution_note}
                    </p>
                  </div>
                )}

                {/* Evidences Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                      Evidencias ({selectedIssueDetail.evidences.length})
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setAddEvidenceModalOpen(true)}
                      className="flex items-center gap-1"
                    >
                      <Plus size={13} />
                      <span>Adjuntar evidencia</span>
                    </Button>
                  </div>

                  {selectedIssueDetail.evidences.length === 0 ? (
                    <p className="text-xs text-[#6B7280] py-2">
                      Sin evidencias. Agrega capturas, logs o videos para documentar el problema.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedIssueDetail.evidences.map((ev) => {
                        const isAnalyzing = analyzingEvId === ev.id;
                        const hasAIProposal = aiAnalysisComplete[ev.id];

                        return (
                          <div
                            key={ev.id}
                            className="rounded-lg border border-white/8 bg-[#1A1B26] p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                <div className="mt-0.5 rounded bg-white/5 p-1.5">
                                  {evTypeIcon(ev.file_type)}
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-[#F9FAFB]">
                                    {ev.title || ev.file_name}
                                  </h4>
                                  <p className="text-xs text-[#6B7280]">
                                    {ev.file_name} · {formatBytes(ev.file_size)} · Subido por{' '}
                                    {ev.uploaded_by_name}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleRunAIAnalysis(ev.id)}
                                  disabled={isAnalyzing}
                                  className="flex items-center gap-1 rounded-lg bg-violet-500/20 px-2.5 py-1 text-xs font-medium text-violet-300 hover:bg-violet-500/30 transition-colors disabled:opacity-50"
                                >
                                  <Brain size={12} />
                                  <span>{isAnalyzing ? 'Analizando…' : 'Analizar con IA'}</span>
                                </button>
                                <a
                                  href={ev.download_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-[#9CA3AF] hover:text-[#F9FAFB] hover:border-white/20 transition-colors"
                                >
                                  <Download size={12} />
                                  <span>Descargar</span>
                                </a>
                              </div>
                            </div>

                            {/* Preview for images */}
                            {ev.file_type === 'image' && (
                              <div className="overflow-hidden rounded-lg border border-white/10 bg-black/30 max-h-56 flex items-center justify-center">
                                <img
                                  src={ev.download_url}
                                  alt={ev.title || ev.file_name}
                                  className="max-h-56 object-contain"
                                />
                              </div>
                            )}

                            {/* Preview for videos */}
                            {ev.file_type === 'video' && (
                              <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40 p-2">
                                <video
                                  controls
                                  src={ev.download_url}
                                  className="w-full max-h-56 rounded"
                                >
                                  Tu navegador no soporta el elemento de video.
                                </video>
                              </div>
                            )}

                            {/* Advisory AI Analysis section (Zero automatic mutations DA-08) */}
                            {hasAIProposal && (
                              <div className="mt-2 rounded-lg border border-violet-500/30 bg-violet-500/10 p-3 text-xs space-y-2">
                                <div className="flex items-center gap-1.5 font-semibold text-violet-300">
                                  <Brain size={13} />
                                  <span>Análisis asistido por IA (Propuesta consultiva — Sin mutaciones automáticas)</span>
                                </div>
                                <p className="text-[#D1D5DB]">
                                  <strong>Diagnóstico propuesto:</strong> Se identifican patrones en la evidencia que apuntan a una falla en la capa de datos/servicios. El comportamiento observado requiere validación manual.
                                </p>
                                <div className="text-[#9CA3AF]">
                                  <p className="font-medium text-[#F9FAFB] mb-1">Pasos sugeridos para el desarrollador:</p>
                                  <ol className="list-decimal pl-4 space-y-0.5">
                                    <li>Verificar los parámetros de entrada y logs de auditoría.</li>
                                    <li>Comprobar si el estado previo del recurso es consistente.</li>
                                    <li>Implementar la corrección en código y ejecutar la suite de pruebas.</li>
                                  </ol>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="flex h-64 items-center justify-center p-6 text-sm text-[#6B7280]">
                Selecciona un fix para ver el detalle
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateIssueModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateIssue}
        loading={submittingCreate}
      />

      <AddEvidenceModal
        isOpen={addEvidenceModalOpen}
        onClose={() => setAddEvidenceModalOpen(false)}
        onSubmit={handleAttachEvidence}
        loading={submittingEvidence}
      />
    </div>
  );
}
