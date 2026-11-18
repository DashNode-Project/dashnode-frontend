import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import {
  Activity,
  AudioLines,
  Clock,
  Coins,
  RefreshCw,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/demo-ui';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { useToast } from '@/lib/toast/ToastProvider';
import { useProjectWorkspace } from '@/features/projects/ProjectWorkspaceContext';
import {
  getInteractionDetail,
  getMetricsByUser,
  getMetricsSummary,
  listInteractions,
} from './api';
import {
  AI_METRICS_MESSAGES,
  INTERACTION_SOURCE_LABELS,
  INTERACTION_STATUS_LABELS,
  METRICS_PERIOD_LABELS,
} from './messages';
import type {
  InteractionDetail,
  InteractionListItem,
  MetricsByUserItem,
  MetricsPeriod,
  MetricsSummary,
} from './types';

const PAGE_SIZE = 25;

function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-CO').format(n);
}

function formatLatency(ms: number): string {
  return `${formatNumber(ms)} ms`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatComputedAt(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function scopeLabel(summary: MetricsSummary | null, projectName?: string): string {
  if (!summary) return '—';
  if (summary.scope.type === 'GLOBAL') return AI_METRICS_MESSAGES.scopeGlobal;
  if (summary.scope.type === 'PROJECT' && (summary.scope.name || projectName)) {
    return AI_METRICS_MESSAGES.scopeProject(summary.scope.name || projectName || '—');
  }
  const count = summary.scope.project_count ?? 0;
  return AI_METRICS_MESSAGES.scopeProjects(count);
}

export default function ProjectAiMetricsTab() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const { project } = useProjectWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const period = (searchParams.get('period') as MetricsPeriod) || '7d';
  const filterUserId = searchParams.get('user_id') || '';
  const filterSource = searchParams.get('source') || '';
  const filterStatus = searchParams.get('status') || '';
  const filterFrom = searchParams.get('from') || '';
  const filterTo = searchParams.get('to') || '';
  const filterMinRating = searchParams.get('min_rating') || '';

  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [byUser, setByUser] = useState<MetricsByUserItem[]>([]);
  const [interactions, setInteractions] = useState<InteractionListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingByUser, setLoadingByUser] = useState(true);
  const [loadingRegistry, setLoadingRegistry] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<InteractionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const periodArgs = useMemo(
    () => ({
      period,
      from: period === 'custom' ? filterFrom || undefined : undefined,
      to: period === 'custom' ? filterTo || undefined : undefined,
      project_id: projectId || undefined,
    }),
    [period, filterFrom, filterTo, projectId],
  );

  const patchParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([key, value]) => {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const loadRegistry = useCallback(
    async (cursor?: string | null) => {
      if (cursor) setLoadingMore(true);
      else setLoadingRegistry(true);
      try {
        const res = await listInteractions({
          ...periodArgs,
          user_id: filterUserId || undefined,
          source: (filterSource as InteractionListItem['source']) || undefined,
          status: (filterStatus as InteractionListItem['status']) || undefined,
          from: filterFrom || undefined,
          to: filterTo || undefined,
          min_rating: filterMinRating ? Number(filterMinRating) : undefined,
          limit: PAGE_SIZE,
          cursor: cursor ?? undefined,
        });
        if (cursor) {
          setInteractions((prev) => [...prev, ...(res.items || [])]);
        } else {
          setInteractions(res.items || []);
        }
        setNextCursor(res.next_cursor ?? null);
      } catch {
        if (!cursor) setInteractions([]);
        setNextCursor(null);
      } finally {
        setLoadingRegistry(false);
        setLoadingMore(false);
      }
    },
    [periodArgs, filterUserId, filterSource, filterStatus, filterFrom, filterTo, filterMinRating],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingSummary(true);
      setLoadingByUser(true);
      setLoadingRegistry(true);
      try {
        const [summaryRes, byUserRes, registryRes] = await Promise.all([
          getMetricsSummary(periodArgs),
          getMetricsByUser({ ...periodArgs, limit: 25 }),
          listInteractions({
            ...periodArgs,
            user_id: filterUserId || undefined,
            source: (filterSource as InteractionListItem['source']) || undefined,
            status: (filterStatus as InteractionListItem['status']) || undefined,
            from: filterFrom || undefined,
            to: filterTo || undefined,
            min_rating: filterMinRating ? Number(filterMinRating) : undefined,
            limit: PAGE_SIZE,
          }),
        ]);
        if (cancelled) return;
        setSummary(summaryRes);
        setError(null);
        setByUser(byUserRes.items || []);
        setInteractions(registryRes.items || []);
        setNextCursor(registryRes.next_cursor ?? null);
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof ApiError && !isTechnicalFailure(err)) {
          setError(err.message);
          showToast(err.message, 'error');
        } else {
          setError(AI_METRICS_MESSAGES.loadFailure);
          showToast(AI_METRICS_MESSAGES.loadFailure, 'error');
        }
        setSummary(null);
        setByUser([]);
        setInteractions([]);
        setNextCursor(null);
      } finally {
        if (!cancelled) {
          setLoadingSummary(false);
          setLoadingByUser(false);
          setLoadingRegistry(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    periodArgs,
    filterUserId,
    filterSource,
    filterStatus,
    filterFrom,
    filterTo,
    filterMinRating,
    refreshKey,
    showToast,
  ]);

  const onRefresh = () => setRefreshKey((k) => k + 1);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await getInteractionDetail(id);
      setDetail(res);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === 'RETENTION_EXPIRED') {
        showToast(AI_METRICS_MESSAGES.retentionExpired, 'error');
      } else if (err instanceof ApiError && err.status === 404) {
        showToast(AI_METRICS_MESSAGES.notFound, 'error');
      } else {
        showToast(AI_METRICS_MESSAGES.loadFailure, 'error');
      }
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const filterByUser = (userId: string) => {
    patchParams({ user_id: userId });
  };

  const kpiCards = [
    {
      label: 'Interacciones',
      value: summary ? formatNumber(summary.total_interactions) : '—',
      icon: Sparkles,
      color: 'text-violet-400',
    },
    {
      label: 'Latencia promedio',
      value: summary ? formatLatency(summary.avg_latency_ms) : '—',
      sub:
        summary?.median_latency_ms !== null && summary?.median_latency_ms !== undefined
          ? `(mediana ${formatLatency(summary.median_latency_ms)})`
          : undefined,
      icon: Clock,
      color: 'text-blue-400',
    },
    {
      label: 'Tokens entrada',
      value: summary ? formatNumber(summary.tokens.input) : '—',
      icon: Coins,
      color: 'text-emerald-400',
    },
    {
      label: 'Tokens salida',
      value: summary ? formatNumber(summary.tokens.output) : '—',
      icon: Coins,
      color: 'text-teal-400',
    },
    {
      label: 'Audio transcrito',
      value: summary ? `${formatNumber(summary.audio_seconds)} s` : '—',
      icon: AudioLines,
      color: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#F9FAFB] flex items-center gap-2">
            <Activity size={18} className="text-violet-400" />
            {AI_METRICS_MESSAGES.sectionSummary}
          </h2>
          <p className="mt-1 text-xs text-[#9CA3AF]">{scopeLabel(summary, project.name)}</p>
          {summary?.computed_at ? (
            <p className="text-[11px] text-[#6B7280]">
              {AI_METRICS_MESSAGES.computedAt(formatComputedAt(summary.computed_at))}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Periodo"
            value={period}
            onChange={(e) => patchParams({ period: e.target.value })}
            className="rounded-lg border border-white/10 bg-[#1A1B28] px-3 py-1.5 text-xs text-[#E5E7EB]"
          >
            {Object.entries(METRICS_PERIOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {period === 'custom' ? (
            <>
              <input
                type="date"
                aria-label={AI_METRICS_MESSAGES.filterFrom}
                value={filterFrom}
                onChange={(e) => patchParams({ from: e.target.value })}
                className="rounded-lg border border-white/10 bg-[#1A1B28] px-2 py-1.5 text-xs text-[#E5E7EB]"
              />
              <input
                type="date"
                aria-label={AI_METRICS_MESSAGES.filterTo}
                value={filterTo}
                onChange={(e) => patchParams({ to: e.target.value })}
                className="rounded-lg border border-white/10 bg-[#1A1B28] px-2 py-1.5 text-xs text-[#E5E7EB]"
              />
            </>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            className="flex items-center gap-1"
          >
            <RefreshCw size={14} className={loadingSummary ? 'animate-spin' : ''} />
            {AI_METRICS_MESSAGES.refresh}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpiCards.map((card) => (
          <Card key={card.label} className="border-white/8 bg-[#1E1F2B] p-4">
            <div className="flex items-center gap-2 text-[#9CA3AF]">
              <card.icon size={14} className={card.color} />
              <span className="text-[11px] font-medium uppercase tracking-wide">{card.label}</span>
            </div>
            <p className={`mt-2 text-2xl font-bold ${card.color}`}>{card.value}</p>
            {card.sub ? <p className="text-[10px] text-[#6B7280]">{card.sub}</p> : null}
            {summary && summary.total_interactions === 0 ? (
              <p className="mt-1 text-[10px] text-[#6B7280]">{AI_METRICS_MESSAGES.emptyPeriod}</p>
            ) : null}
          </Card>
        ))}
      </div>

      <section className="space-y-3 rounded-xl border border-white/8 bg-[#13141E] p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#F9FAFB]">
          <Users size={16} className="text-violet-400" />
          {AI_METRICS_MESSAGES.sectionByUser}
        </h3>
        {loadingByUser ? (
          <p className="text-xs text-[#9CA3AF]">Cargando…</p>
        ) : byUser.length === 0 ? (
          <p className="text-xs text-[#6B7280]">{AI_METRICS_MESSAGES.emptyInteractions}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 text-left text-[#6B7280]">
                  <th className="py-2 pr-3 font-medium">Usuario</th>
                  <th className="py-2 pr-3 font-medium">Interacciones</th>
                  <th className="py-2 pr-3 font-medium">Última</th>
                  <th className="py-2 pr-3 font-medium">Tokens</th>
                  <th className="py-2 font-medium">Latencia prom.</th>
                </tr>
              </thead>
              <tbody>
                {byUser.map((row) => (
                  <tr
                    key={row.user.id}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                    onClick={() => filterByUser(row.user.id)}
                  >
                    <td className="py-2 pr-3 text-[#F9FAFB]">{row.user.name}</td>
                    <td className="py-2 pr-3 text-violet-300">{row.interactions}</td>
                    <td className="py-2 pr-3 text-[#9CA3AF]">
                      {row.last_at ? formatDateTime(row.last_at) : '—'}
                    </td>
                    <td className="py-2 pr-3 text-[#9CA3AF]">
                      {formatNumber(row.input_tokens ?? 0)}
                    </td>
                    <td className="py-2 text-[#9CA3AF]">
                      {row.avg_latency_ms !== null && row.avg_latency_ms !== undefined
                        ? formatLatency(row.avg_latency_ms)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-white/8 bg-[#13141E] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[#F9FAFB]">
            {AI_METRICS_MESSAGES.sectionRegistry}
          </h3>
          <p className="text-[10px] text-[#6B7280]">{AI_METRICS_MESSAGES.exportDisabledNote}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            aria-label={AI_METRICS_MESSAGES.filterType}
            value={filterSource}
            onChange={(e) => patchParams({ source: e.target.value || null })}
            className="rounded-lg border border-white/10 bg-[#1A1B28] px-2 py-1 text-xs text-[#E5E7EB]"
          >
            <option value="">{AI_METRICS_MESSAGES.filterAll}</option>
            {Object.entries(INTERACTION_SOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label={AI_METRICS_MESSAGES.filterStatus}
            value={filterStatus}
            onChange={(e) => patchParams({ status: e.target.value || null })}
            className="rounded-lg border border-white/10 bg-[#1A1B28] px-2 py-1 text-xs text-[#E5E7EB]"
          >
            <option value="">{AI_METRICS_MESSAGES.filterAll}</option>
            {Object.entries(INTERACTION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={5}
            placeholder={AI_METRICS_MESSAGES.filterMinRating}
            aria-label={AI_METRICS_MESSAGES.filterMinRating}
            value={filterMinRating}
            onChange={(e) => patchParams({ min_rating: e.target.value || null })}
            className="w-36 rounded-lg border border-white/10 bg-[#1A1B28] px-2 py-1 text-xs text-[#E5E7EB]"
          />
          {filterUserId ? (
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg border border-violet-500/40 bg-violet-500/10 px-2 py-1 text-[11px] text-violet-200"
              onClick={() => patchParams({ user_id: null })}
            >
              {AI_METRICS_MESSAGES.filterUser}
              <X size={12} />
            </button>
          ) : null}
        </div>

        {loadingRegistry ? (
          <p className="text-xs text-[#9CA3AF]">Cargando…</p>
        ) : interactions.length === 0 ? (
          <p className="text-xs text-[#6B7280]">{AI_METRICS_MESSAGES.emptyInteractions}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 text-left text-[#6B7280]">
                  <th className="py-2 pr-2 font-medium">Fecha</th>
                  <th className="py-2 pr-2 font-medium">Usuario</th>
                  <th className="py-2 pr-2 font-medium">Tipo</th>
                  <th className="py-2 pr-2 font-medium">Estado</th>
                  <th className="py-2 pr-2 font-medium">Consulta</th>
                  <th className="py-2 pr-2 font-medium">Latencia</th>
                  <th className="py-2 font-medium">Valoración</th>
                </tr>
              </thead>
              <tbody>
                {interactions.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                    onClick={() => void openDetail(row.id)}
                  >
                    <td className="py-2 pr-2 text-[#9CA3AF] whitespace-nowrap">
                      {formatDateTime(row.requested_at)}
                    </td>
                    <td className="py-2 pr-2 text-[#F9FAFB]">{row.user.name}</td>
                    <td className="py-2 pr-2 text-[#D1D5DB]">
                      {INTERACTION_SOURCE_LABELS[row.source] ?? row.source}
                    </td>
                    <td className="py-2 pr-2 text-[#D1D5DB]">
                      {INTERACTION_STATUS_LABELS[row.status] ?? row.status}
                    </td>
                    <td className="py-2 pr-2 max-w-[220px] truncate text-[#9CA3AF]">
                      {row.query_preview || '—'}
                    </td>
                    <td className="py-2 pr-2 text-[#9CA3AF]">
                      {row.latency_ms !== null && row.latency_ms !== undefined
                        ? formatLatency(row.latency_ms)
                        : '—'}
                    </td>
                    <td className="py-2 text-violet-300">{row.rating ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {nextCursor ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={loadingMore}
            onClick={() => void loadRegistry(nextCursor)}
          >
            {AI_METRICS_MESSAGES.loadMore}
          </Button>
        ) : null}
      </section>

      {(detail || detailLoading) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-white/10 bg-[#12131C] shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h4 className="text-sm font-semibold text-[#F9FAFB]">{AI_METRICS_MESSAGES.viewFull}</h4>
            <button
              type="button"
              aria-label={AI_METRICS_MESSAGES.closeDetail}
              onClick={() => setDetail(null)}
              className="rounded-lg p-1 text-[#9CA3AF] hover:bg-white/5 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 text-xs space-y-4">
            {detailLoading && !detail ? (
              <p className="text-[#9CA3AF]">Cargando…</p>
            ) : null}
            {detail ? (
              <>
                <p className="text-[10px] text-[#6B7280]">{AI_METRICS_MESSAGES.detailHelp}</p>
                <div className="flex flex-wrap gap-2 text-[#9CA3AF]">
                  <span>{detail.user.name}</span>
                  <span>·</span>
                  <span>{formatDateTime(detail.requested_at)}</span>
                  <span>·</span>
                  <span>{INTERACTION_SOURCE_LABELS[detail.source]}</span>
                </div>
                <div>
                  <p className="mb-1 font-medium text-[#E5E7EB]">{AI_METRICS_MESSAGES.queryColumn}</p>
                  <pre className="whitespace-pre-wrap rounded-lg border border-white/10 bg-black/20 p-2 text-[#D1D5DB]">
                    {detail.query_text}
                  </pre>
                </div>
                <div>
                  <p className="mb-1 font-medium text-[#E5E7EB]">
                    {AI_METRICS_MESSAGES.responseColumn}
                  </p>
                  <pre className="whitespace-pre-wrap rounded-lg border border-white/10 bg-black/20 p-2 text-[#D1D5DB]">
                    {detail.response_text || '—'}
                  </pre>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[#9CA3AF]">
                  <span>Proyecto: {detail.project?.name ?? AI_METRICS_MESSAGES.noProject}</span>
                  <span>
                    Tokens: {detail.input_tokens} / {detail.output_tokens}
                  </span>
                  <span>Audio: {detail.audio_seconds} s</span>
                  <span>
                    Latencia:{' '}
                    {detail.latency_ms !== null && detail.latency_ms !== undefined
                      ? formatLatency(detail.latency_ms)
                      : '—'}
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}