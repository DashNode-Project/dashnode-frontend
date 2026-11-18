import { AlertCircle, CheckCircle2, CircleDashed, Loader2, MinusCircle, Play } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useAuth } from '@/features/auth/AuthContext';
import { fetchLatestPipeline, triggerPipelineRun, type LatestPipelineResponse } from './api';

const LOAD_FAILURE = 'No fue posible cargar la información. Intente nuevamente.';
const EMPTY = 'No hay ejecuciones registradas para este proyecto.';

const STAGE_LABELS: Record<string, string> = {
  LINT: 'Lint',
  TEST: 'Test',
  BUILD: 'Build',
  DEPLOY: 'Deploy',
};

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_EJECUCION: 'En ejecución',
  EXITOSA: 'Exitosa',
  FALLIDA: 'Fallida',
  OMITIDA: 'Omitida',
};

function statusIcon(status: string) {
  switch (status) {
    case 'EXITOSA':
      return <CheckCircle2 size={18} className="text-emerald-400" aria-hidden />;
    case 'FALLIDA':
      return <AlertCircle size={18} className="text-rose-400" aria-hidden />;
    case 'EN_EJECUCION':
      return <Loader2 size={18} className="animate-spin text-sky-400" aria-hidden />;
    case 'OMITIDA':
      return <MinusCircle size={18} className="text-amber-300" aria-hidden />;
    default:
      return <CircleDashed size={18} className="text-[#9CA3AF]" aria-hidden />;
  }
}

export default function ProjectDevOpsTab() {
  const { projectId = '' } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<LatestPipelineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const payload = await fetchLatestPipeline(projectId);
      setData(payload);
    } catch {
      setError(LOAD_FAILURE);
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const payload = await fetchLatestPipeline(projectId);
        if (!cancelled) setData(payload);
      } catch {
        if (!cancelled) setError(LOAD_FAILURE);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    const running = data?.stages.some((stage) => stage.status === 'EN_EJECUCION');
    if (!running) return;
    const timer = window.setInterval(() => {
      void refresh();
    }, 5000);
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [data?.stages, refresh]);

  const canTrigger = user?.role === 'admin' || user?.role === 'manager';

  const onTrigger = async () => {
    if (!canTrigger) return;
    setBusy(true);
    try {
      await triggerPipelineRun(projectId);
      await refresh();
    } catch {
      setError(LOAD_FAILURE);
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6 text-sm text-rose-200">
        {error}
      </div>
    );
  }

  const empty = !data?.run_id || data.stages.length === 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-[#F9FAFB]">Pipeline de integración</h1>
            <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-200">
              Simulado
            </span>
          </div>
          {data?.run_id ? (
            <p className="mt-1 text-sm text-[#9CA3AF]">
              Ejecución {data.run_id.slice(0, 8)} · {data.triggered_by?.name ?? 'Semilla inicial'} ·{' '}
              {data.created_at ? new Date(data.created_at).toLocaleString('es-CO') : '—'} ·{' '}
              {data.status ? (STATUS_LABELS[data.status] ?? data.status) : '—'}
            </p>
          ) : null}
        </div>
        {empty && canTrigger ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onTrigger()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-[#F9FAFB] hover:bg-white/10 disabled:opacity-60"
          >
            <Play size={16} aria-hidden />
            Disparar simulación
          </button>
        ) : null}
      </header>

      {empty ? (
        <div className="rounded-xl border border-white/10 bg-[#12131C] p-8 text-center text-sm text-[#9CA3AF]">
          {EMPTY}
        </div>
      ) : (
        <ol className="grid gap-4 md:grid-cols-4">
          {data?.stages.map((stage, index) => (
            <li
              key={stage.stage}
              className="relative rounded-xl border border-white/10 bg-[#12131C] p-4"
            >
              {index < (data?.stages.length ?? 0) - 1 ? (
                <span
                  className="absolute right-0 top-1/2 hidden h-px w-4 translate-x-full bg-white/15 md:block"
                  aria-hidden
                />
              ) : null}
              <div className="flex items-center gap-2 text-sm font-medium text-[#F9FAFB]">
                {statusIcon(stage.status)}
                <span>{STAGE_LABELS[stage.stage] ?? stage.stage}</span>
              </div>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                {STATUS_LABELS[stage.status] ?? stage.status} · {stage.duration_seconds} s
              </p>
              {stage.skip_reason ? (
                <p className="mt-2 text-xs text-amber-200/90">{stage.skip_reason}</p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
