import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Brain,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AiRatingControl } from '@/features/ai-assistant/AiRatingControl';
import { ProjectModal } from '@/features/projects/ProjectModal';
import { useToast } from '@/lib/toast/ToastProvider';
import {
  deleteAiAnalysis,
  getAiAnalysisStatus,
  listAiAnalyses,
  rejectAiAnalysis,
  requestAiAnalysis,
  validateAiAnalysis,
} from '../api';
import { AI_ERROR_CODE_MESSAGES, AI_VALIDATION_STATUS_LABELS, ISSUE_MESSAGES } from '../messages';
import type {
  AiAnalysisListItem,
  AiAnalysisResult,
  AiAnalysisStatusResponse,
  Evidence,
} from '../types';

interface AiAnalysisSectionProps {
  projectId: string;
  issueId: string;
  evidences: Evidence[];
  currentUser: { id: string; role: string; name?: string } | null;
}

export function AiAnalysisSection({
  projectId,
  issueId,
  evidences,
  currentUser,
}: AiAnalysisSectionProps) {
  const { showToast } = useToast();

  // Confirmation checkboxes per visual evidence
  const [confirmedByEv, setConfirmedByEv] = useState<Record<string, boolean>>({});

  // Active polling state
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<AiAnalysisStatusResponse | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(null);

  // Stored analyses list
  const [analyses, setAnalyses] = useState<AiAnalysisListItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Deletion modal state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Human validation action state (HU_DN_07_111, HU_DN_07_112)
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const pollTimerRef = useRef<number | null>(null);
  const pollStartRef = useRef<number>(0);

  const visualEvidences = evidences.filter(
    (e) => e.file_type === 'image' || e.file_type === 'video',
  );

  const isPrivileged =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'administrator' ||
    currentUser?.role === 'manager';

  // Load stored analyses
  const loadAnalyses = useCallback(async () => {
    if (!projectId || !issueId) return;
    try {
      const res = await listAiAnalyses(projectId, issueId);
      setAnalyses(res.items || []);
    } catch {
      // Non-intrusive fallback
      setAnalyses([]);
    }
  }, [projectId, issueId]);

  useEffect(() => {
    let cancelled = false;
    if (!projectId || !issueId) return;
    void (async () => {
      try {
        const res = await listAiAnalyses(projectId, issueId);
        if (!cancelled) {
          setAnalyses(res.items || []);
        }
      } catch {
        if (!cancelled) {
          setAnalyses([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingList(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, issueId]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  // Poll analysis status
  const startPolling = useCallback(
    (analysisId: string, evId: string) => {
      setActiveAnalysisId(analysisId);
      setActiveEvidenceId(evId);
      setCurrentError(null);
      pollStartRef.current = Date.now();

      const poll = async () => {
        try {
          const statusRes = await getAiAnalysisStatus(projectId, issueId, analysisId);
          setPollingStatus(statusRes);

          if (statusRes.status === 'DONE') {
            void loadAnalyses();
            return;
          }

          if (statusRes.status === 'FAILED') {
            const msg =
              (statusRes.error_code && AI_ERROR_CODE_MESSAGES[statusRes.error_code]) ||
              statusRes.message ||
              ISSUE_MESSAGES.GENERIC_ERROR;
            setCurrentError(msg);
            return;
          }

          // Timeout check (30s)
          if (Date.now() - pollStartRef.current > 30000) {
            setCurrentError(ISSUE_MESSAGES.AI_TIMEOUT);
            return;
          }

          // Schedule next poll in 2 seconds
          pollTimerRef.current = window.setTimeout(poll, 2000);
        } catch {
          setCurrentError(ISSUE_MESSAGES.AI_PROVIDER_ERROR);
        }
      };

      void poll();
    },
    [projectId, issueId, loadAnalyses],
  );

  // Request analysis
  const handleRequestAnalysis = async (evId: string, forceNew = false) => {
    setIsRequesting(true);
    setCurrentError(null);
    setPollingStatus(null);
    try {
      const res = await requestAiAnalysis(projectId, issueId, {
        evidence_id: evId,
        user_confirmed_no_sensitive_data: true,
        force_new: forceNew,
      });

      if (res.reused) {
        showToast(ISSUE_MESSAGES.AI_REUSED_NOTICE, 'info');
      }

      startPolling(res.analysis_id, evId);
    } catch (err: unknown) {
      const errCode = (err as { code?: string })?.code;
      const errorMsg =
        (errCode && AI_ERROR_CODE_MESSAGES[errCode]) ||
        (err as { message?: string })?.message ||
        ISSUE_MESSAGES.GENERIC_ERROR;
      setCurrentError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setIsRequesting(false);
    }
  };

  // Delete analysis
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await deleteAiAnalysis(projectId, issueId, deleteTargetId);
      showToast(ISSUE_MESSAGES.AI_ANALYSIS_DELETED, 'success');
      setDeleteTargetId(null);
      if (activeAnalysisId === deleteTargetId) {
        setActiveAnalysisId(null);
        setPollingStatus(null);
      }
      await loadAnalyses();
    } catch (err: unknown) {
      const errorMsg = (err as { message?: string })?.message || ISSUE_MESSAGES.GENERIC_ERROR;
      showToast(errorMsg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Human validation handlers (HU_DN_07_111, HU_DN_07_112)
  const handleValidate = async (analysisId: string) => {
    setValidatingId(analysisId);
    try {
      const res = await validateAiAnalysis(projectId, issueId, analysisId);
      showToast(res.message || ISSUE_MESSAGES.AI_VALIDATE_SUCCESS, 'success');
      if (pollingStatus && pollingStatus.analysis_id === analysisId) {
        setPollingStatus((prev) =>
          prev
            ? {
                ...prev,
                validation_status: 'VALIDATED',
                requires_human_validation: false,
                validated_by_name: currentUser?.name || 'Administrador',
                validated_at: new Date().toISOString(),
              }
            : null,
        );
      }
      await loadAnalyses();
    } catch (err: unknown) {
      const errorMsg = (err as { message?: string })?.message || ISSUE_MESSAGES.GENERIC_ERROR;
      showToast(errorMsg, 'error');
    } finally {
      setValidatingId(null);
    }
  };

  const handleReject = async (analysisId: string) => {
    setRejectingId(analysisId);
    try {
      const res = await rejectAiAnalysis(projectId, issueId, analysisId);
      showToast(res.message || ISSUE_MESSAGES.AI_REJECT_SUCCESS, 'success');
      if (pollingStatus && pollingStatus.analysis_id === analysisId) {
        setPollingStatus((prev) =>
          prev
            ? {
                ...prev,
                validation_status: 'REJECTED',
                requires_human_validation: true,
                rejected_by_name: currentUser?.name || 'Administrador',
                rejected_at: new Date().toISOString(),
              }
            : null,
        );
      }
      await loadAnalyses();
    } catch (err: unknown) {
      const errorMsg = (err as { message?: string })?.message || ISSUE_MESSAGES.GENERIC_ERROR;
      showToast(errorMsg, 'error');
    } finally {
      setRejectingId(null);
    }
  };

  const renderResultCard = (
    result: AiAnalysisResult,
    meta?: {
      id?: string;
      interaction_id?: string | null;
      validation_status?: string;
      requires_human_validation?: boolean;
      validated_by_name?: string | null;
      validated_at?: string | null;
    },
  ) => {
    const validationStatus = meta?.validation_status || 'PENDING_VALIDATION';
    const requiresValidation = meta?.requires_human_validation ?? validationStatus !== 'VALIDATED';
    const isValidated = validationStatus === 'VALIDATED';
    const isPending = validationStatus === 'PENDING_VALIDATION';
    const analysisId = meta?.id;

    return (
      <div className="space-y-3 rounded-lg border border-white/10 bg-[#161722] p-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/6 pb-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-400 border border-red-500/30">
              {ISSUE_MESSAGES.AI_UNVERIFIED_LABEL}
            </span>
            <span className="rounded bg-white/5 px-2 py-0.5 text-[11px] text-[#D1D5DB]">
              {AI_VALIDATION_STATUS_LABELS[validationStatus] || validationStatus}
            </span>
          </div>
          <span className="text-[11px] text-[#9CA3AF]">Revisión asistida por IA</span>
        </div>

        {/* HU_DN_07_113 Human Validation Notice */}
        {requiresValidation ? (
          <div
            data-testid="human-validation-notice"
            className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-200"
          >
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-400" />
            <span className="leading-relaxed">{ISSUE_MESSAGES.AI_HUMAN_VALIDATION_NOTICE}</span>
          </div>
        ) : (
          <div
            data-testid="validated-notice"
            className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-200"
          >
            <CheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-400" />
            <span className="leading-relaxed">
              {`Validada por ${meta?.validated_by_name || 'un Administrador'}${
                meta?.validated_at
                  ? ` el ${new Date(meta.validated_at).toLocaleDateString('es-CO')}`
                  : ''
              }.`}
            </span>
          </div>
        )}

        <div className="space-y-1">
          <p className="font-semibold text-[#F9FAFB]">Descripción del problema:</p>
          <p className="leading-relaxed text-[#D1D5DB] whitespace-pre-wrap">
            {result.problem_description}
          </p>
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-[#F9FAFB]">Causa probable:</p>
          <p className="leading-relaxed text-[#D1D5DB] whitespace-pre-wrap">
            {result.probable_cause}
          </p>
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-[#F9FAFB]">Solución sugerida:</p>
          {result.context_sufficient && result.suggested_solution ? (
            <p className="leading-relaxed text-[#D1D5DB] whitespace-pre-wrap">
              {result.suggested_solution}
            </p>
          ) : (
            <p className="italic text-[#9CA3AF]">{ISSUE_MESSAGES.AI_INSUFFICIENT_CONTEXT}</p>
          )}
        </div>

        {/* HU_DN_07_111 & HU_DN_07_112: Human Validation Action Buttons */}
        {isPrivileged && analysisId && (isPending || isValidated) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/6">
            {isPending && (
              <Button
                size="sm"
                disabled={validatingId === analysisId || rejectingId === analysisId}
                onClick={() => void handleValidate(analysisId)}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1"
              >
                <Check size={13} />
                <span>
                  {validatingId === analysisId ? 'Validando…' : ISSUE_MESSAGES.AI_VALIDATE_BTN}
                </span>
              </Button>
            )}

            {(isPending || isValidated) && (
              <Button
                size="sm"
                variant="secondary"
                disabled={validatingId === analysisId || rejectingId === analysisId}
                onClick={() => void handleReject(analysisId)}
                className="flex items-center gap-1 border border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs px-2.5 py-1"
              >
                <XCircle size={13} />
                <span>
                  {rejectingId === analysisId ? 'Rechazando…' : ISSUE_MESSAGES.AI_REJECT_BTN}
                </span>
              </Button>
            )}
          </div>
        )}

        {meta?.interaction_id ? (
          <AiRatingControl interactionId={meta.interaction_id} className="mt-3" />
        ) : null}
      </div>
    );
  };

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-white/8 bg-[#13141E] p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-violet-400" />
          <h3 className="text-sm font-semibold text-[#F9FAFB]">
            Análisis visual con Inteligencia Artificial
          </h3>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void loadAnalyses()}
          className="flex items-center gap-1"
        >
          <RefreshCw size={12} className={loadingList ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </Button>
      </div>

      {/* Visual Evidences Actions */}
      {visualEvidences.length === 0 ? (
        <p className="text-xs text-[#6B7280]">
          Adjunte una imagen o video para habilitar el análisis de IA.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[#9CA3AF]">
            Seleccione una evidencia visual para solicitar el análisis de causa y sugerencia:
          </p>

          {visualEvidences.map((ev) => {
            const isConfirmed = Boolean(confirmedByEv[ev.id]);
            const isCurrentAnalyzing =
              activeEvidenceId === ev.id &&
              (pollingStatus?.status === 'PENDING' ||
                pollingStatus?.status === 'PROCESSING' ||
                isRequesting);

            return (
              <div
                key={ev.id}
                className="space-y-2 rounded-lg border border-white/6 bg-[#1A1B28] p-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-[#F9FAFB]">
                    {ev.title || ev.file_name} ({ev.file_type.toUpperCase()})
                  </span>

                  <Button
                    size="sm"
                    disabled={!isConfirmed || isCurrentAnalyzing || isRequesting}
                    onClick={() => void handleRequestAnalysis(ev.id)}
                    className="flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
                  >
                    <Brain size={13} />
                    <span>{isCurrentAnalyzing ? 'Analizando…' : 'Analizar con IA'}</span>
                  </Button>
                </div>

                {/* Privacy Confirmation Checkbox */}
                <label className="flex items-start gap-2 cursor-pointer text-[#9CA3AF] hover:text-[#D1D5DB] select-none">
                  <input
                    type="checkbox"
                    checked={isConfirmed}
                    onChange={(e) =>
                      setConfirmedByEv((prev) => ({ ...prev, [ev.id]: e.target.checked }))
                    }
                    className="mt-0.5 h-3.5 w-3.5 rounded border-white/20 bg-[#161722] text-violet-600 focus:ring-violet-500"
                  />
                  <span>{ISSUE_MESSAGES.AI_CONFIRMATION_CHECKBOX}</span>
                </label>

                {/* Active Progress for this evidence */}
                {isCurrentAnalyzing && (
                  <div className="flex items-center gap-2 rounded bg-violet-500/10 p-2 text-violet-300">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                    <span>{ISSUE_MESSAGES.AI_PROCESSING_LABEL}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Active Done Result */}
      {pollingStatus?.status === 'DONE' && pollingStatus.result && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
            <Check size={14} />
            <span>Resultado del análisis completado</span>
          </p>
          {renderResultCard(pollingStatus.result, {
            id: pollingStatus.analysis_id,
            interaction_id: pollingStatus.interaction_id,
            validation_status: pollingStatus.validation_status,
            requires_human_validation: pollingStatus.requires_human_validation,
            validated_by_name: pollingStatus.validated_by_name,
            validated_at: pollingStatus.validated_at,
          })}
        </div>
      )}

      {/* Error state with retry */}
      {currentError && (
        <div className="space-y-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-red-400 shrink-0" />
            <span className="font-medium">{currentError}</span>
          </div>
          {activeEvidenceId && (
            <div className="pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void handleRequestAnalysis(activeEvidenceId, true)}
                className="flex items-center gap-1"
              >
                <RefreshCw size={12} />
                <span>Reintentar</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Stored Responses History */}
      <div className="space-y-3 pt-2 border-t border-white/6">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
          Respuestas de IA almacenadas ({analyses.length})
        </h4>

        {analyses.length === 0 ? (
          <p className="text-xs text-[#6B7280] py-1">{ISSUE_MESSAGES.AI_NO_RESPONSES}</p>
        ) : (
          <div className="space-y-2">
            {analyses.map((item) => {
              const canDelete =
                isPrivileged || (currentUser && item.requested_by.id === currentUser.id);
              const isExpanded = expandedId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-white/6 bg-[#161722] p-3 text-xs space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[#F9FAFB]">{item.requested_by.name}</span>
                      <span className="text-[#6B7280]">·</span>
                      <span className="text-[#9CA3AF]">
                        {new Date(item.created_at).toLocaleDateString('es-CO')}
                      </span>
                      <span className="rounded bg-white/5 px-2 py-0.5 text-[11px] text-[#D1D5DB]">
                        {AI_VALIDATION_STATUS_LABELS[item.validation_status] ||
                          item.validation_status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="flex items-center gap-1 text-[11px] py-0.5 px-2"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={12} />
                            <span>Ocultar</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={12} />
                            <span>Ver detalle</span>
                          </>
                        )}
                      </Button>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(item.id)}
                          title="Eliminar respuesta"
                          className="rounded p-1 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[#9CA3AF] line-clamp-2">
                    {item.summary || 'Sin resumen disponible.'}
                  </p>

                  {isExpanded &&
                    item.result &&
                    renderResultCard(item.result, {
                      id: item.id,
                      interaction_id: item.interaction_id,
                      validation_status: item.validation_status,
                      requires_human_validation: item.requires_human_validation,
                      validated_by_name: item.validated_by_name,
                      validated_at: item.validated_at,
                    })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <ProjectModal
          onClose={() => setDeleteTargetId(null)}
          title={ISSUE_MESSAGES.AI_DELETE_CONFIRM_TITLE}
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteTargetId(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => void handleConfirmDelete()}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Eliminando…' : 'Confirmar'}
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-sm text-[#9CA3AF]">
            <p>{ISSUE_MESSAGES.AI_DELETE_CONFIRM_TEXT}</p>
          </div>
        </ProjectModal>
      )}
    </div>
  );
}
