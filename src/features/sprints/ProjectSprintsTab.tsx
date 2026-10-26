import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { ProjectModal } from '@/features/projects/ProjectModal';
import { useProjectWorkspace } from '@/features/projects/ProjectWorkspaceContext';
import { getProjectBacklog } from '@/features/backlog/api';
import type { UserStoryDTO } from '@/features/backlog/types';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { useToast } from '@/lib/toast/ToastProvider';
import {
  assignStoryToSprint,
  closeSprint,
  createSprint,
  getCurrentSprint,
  getSprintBurndown,
  getSprintHistory,
  listProjectSprints,
  startSprint,
} from './api';
import { SprintBurndownChart } from './SprintBurndownChart';
import { SPRINT_MESSAGES } from './messages';
import type {
  BurndownPoint,
  CurrentSprintMetrics,
  SprintHistoryItem,
  SprintSummary,
} from './types';
import {
  defaultEndDate,
  minStartDate,
  validateCreateSprintForm,
  type CreateSprintForm,
} from './validation';

const fieldClass =
  'w-full rounded-md border border-white/10 bg-[#1E1F2B] p-3 text-sm text-[#F9FAFB] focus:border-blue-500 focus:outline-none';

function SprintStatusBadge({ status }: { status: SprintSummary['status'] }) {
  const styles =
    status === 'ACTIVE'
      ? 'bg-emerald-500/20 text-emerald-400'
      : status === 'CLOSED'
        ? 'bg-[#374151] text-[#9CA3AF]'
        : 'bg-violet-500/20 text-violet-300';
  const label = status === 'ACTIVE' ? 'Activo' : status === 'CLOSED' ? 'Cerrado' : 'Planificado';
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>{label}</span>;
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-blue-500 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function CurrentSprintPanel({ sprint }: { sprint: CurrentSprintMetrics }) {
  const alert = sprint.days_remaining < 2 && sprint.progress_percentage < 50;
  return (
    <div
      className={`mb-6 rounded-xl border p-5 ${
        alert ? 'border-red-500/40 bg-red-500/5' : 'border-violet-500/30 bg-violet-500/5'
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <Target size={18} className="text-violet-400" />
        <h2 className="text-lg font-semibold text-[#F9FAFB]">Sprint activo: {sprint.name}</h2>
      </div>
      {sprint.goal ? <p className="mb-3 text-sm text-[#9CA3AF]">{sprint.goal}</p> : null}
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-[#6B7280]">
        <span>{sprint.days_remaining} días restantes</span>
        <span>
          {sprint.completed_points}/{sprint.total_points} pts completados
        </span>
        <span>{sprint.pending_points} pts pendientes</span>
      </div>
      <div className="flex items-center gap-3">
        <ProgressBar value={sprint.completed_points} max={sprint.total_points || 1} />
        <span className="text-sm font-bold text-blue-400">{sprint.progress_percentage}%</span>
      </div>
    </div>
  );
}

export default function ProjectSprintsTab() {
  const { project, canManage } = useProjectWorkspace();
  const { showToast } = useToast();
  const [sprints, setSprints] = useState<SprintSummary[]>([]);
  const [current, setCurrent] = useState<CurrentSprintMetrics | null>(null);
  const [noActiveMessage, setNoActiveMessage] = useState<string | null>(null);
  const [stories, setStories] = useState<UserStoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [startTarget, setStartTarget] = useState<SprintSummary | null>(null);
  const [assignFor, setAssignFor] = useState<SprintSummary | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [form, setForm] = useState<CreateSprintForm>({
    name: '',
    goal: '',
    startDate: minStartDate(),
    endDate: defaultEndDate(minStartDate()),
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CreateSprintForm, string>>>({});
  const [burndownIdeal, setBurndownIdeal] = useState<BurndownPoint[]>([]);
  const [burndownActual, setBurndownActual] = useState<BurndownPoint[]>([]);
  const [history, setHistory] = useState<SprintHistoryItem[]>([]);
  const [historyMessage, setHistoryMessage] = useState<string | null>(null);
  const [closeTarget, setCloseTarget] = useState<SprintSummary | null>(null);
  const [closeDest, setCloseDest] = useState<'BACKLOG' | 'SPRINT'>('BACKLOG');
  const [closeTargetSprintId, setCloseTargetSprintId] = useState('');
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const hasActiveSprint = useMemo(() => sprints.some((s) => s.status === 'ACTIVE'), [sprints]);

  const unassignedStories = useMemo(() => stories.filter((s) => !s.sprint_id), [stories]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, currentRes, tree, historyRes] = await Promise.all([
        listProjectSprints(project.id),
        getCurrentSprint(project.id),
        getProjectBacklog(project.id),
        getSprintHistory(project.id),
      ]);
      setSprints(list);
      setCurrent(currentRes.sprint);
      setNoActiveMessage(currentRes.message ?? null);
      setHistory(historyRes.history);
      setHistoryMessage(historyRes.message ?? null);
      if (currentRes.sprint) {
        const burndown = await getSprintBurndown(project.id, currentRes.sprint.id);
        setBurndownIdeal(burndown.ideal_line);
        setBurndownActual(burndown.actual_line);
      } else {
        setBurndownIdeal([]);
        setBurndownActual([]);
      }
      const flat: UserStoryDTO[] = tree.epics.flatMap((row) => row.stories);
      setStories(flat);
      const active = list.find((s) => s.status === 'ACTIVE');
      setExpanded((prev) => prev ?? active?.id ?? list[0]?.id ?? null);
    } catch (error) {
      showToast(
        error instanceof ApiError && !isTechnicalFailure(error)
          ? error.message
          : MESSAGES.loadFailure,
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [project.id, showToast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [list, currentRes, tree, historyRes] = await Promise.all([
          listProjectSprints(project.id),
          getCurrentSprint(project.id),
          getProjectBacklog(project.id),
          getSprintHistory(project.id),
        ]);
        if (cancelled) return;
        setSprints(list);
        setCurrent(currentRes.sprint);
        setNoActiveMessage(currentRes.message ?? null);
        setHistory(historyRes.history);
        setHistoryMessage(historyRes.message ?? null);
        if (currentRes.sprint) {
          const burndown = await getSprintBurndown(project.id, currentRes.sprint.id);
          if (cancelled) return;
          setBurndownIdeal(burndown.ideal_line);
          setBurndownActual(burndown.actual_line);
        } else {
          setBurndownIdeal([]);
          setBurndownActual([]);
        }
        const flat: UserStoryDTO[] = tree.epics.flatMap((row) => row.stories);
        setStories(flat);
        const active = list.find((s) => s.status === 'ACTIVE');
        setExpanded((prev) => prev ?? active?.id ?? list[0]?.id ?? null);
      } catch (error) {
        if (!cancelled) {
          showToast(
            error instanceof ApiError && !isTechnicalFailure(error)
              ? error.message
              : MESSAGES.loadFailure,
            'error',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project.id, showToast]);

  const handleCreate = async () => {
    const errors = validateCreateSprintForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;
    try {
      const res = await createSprint(project.id, {
        name: form.name.trim(),
        goal: form.goal.trim() || undefined,
        start_date: form.startDate,
        end_date: form.endDate,
      });
      showToast(res.message || SPRINT_MESSAGES.created, 'success');
      setCreateOpen(false);
      setForm({
        name: '',
        goal: '',
        startDate: minStartDate(),
        endDate: defaultEndDate(minStartDate()),
      });
      await load();
    } catch (error) {
      showToast(
        error instanceof ApiError && !isTechnicalFailure(error)
          ? error.message
          : MESSAGES.technicalFailure,
        'error',
      );
    }
  };

  const handleStart = async () => {
    if (!startTarget) return;
    try {
      const res = await startSprint(project.id, startTarget.id);
      showToast(res.message, 'success');
      setStartTarget(null);
      await load();
    } catch (error) {
      showToast(
        error instanceof ApiError && !isTechnicalFailure(error)
          ? error.message
          : MESSAGES.technicalFailure,
        'error',
      );
    }
  };

  const planningSprints = useMemo(() => sprints.filter((s) => s.status === 'PLANNING'), [sprints]);

  const closeSummary = useMemo(() => {
    if (!closeTarget) {
      return { completePts: 0, incompletePts: 0, hasIncomplete: false };
    }
    if (current && current.id === closeTarget.id) {
      return {
        completePts: current.completed_points,
        incompletePts: current.pending_points,
        hasIncomplete: current.pending_points > 0,
      };
    }
    const inSprint = stories.filter((s) => s.sprint_id === closeTarget.id);
    const pts = inSprint.reduce((a, s) => a + (s.story_points ?? 0), 0);
    return { completePts: 0, incompletePts: pts, hasIncomplete: inSprint.length > 0 };
  }, [closeTarget, current, stories]);

  const handleClose = async () => {
    if (!closeTarget) return;
    try {
      const payload = closeSummary.hasIncomplete
        ? closeDest === 'SPRINT' && closeTargetSprintId
          ? {
              incomplete_stories_action: 'MOVE_TO_SPRINT' as const,
              target_sprint_id: closeTargetSprintId,
            }
          : { incomplete_stories_destination: 'BACKLOG' as const }
        : {};
      const res = await closeSprint(project.id, closeTarget.id, payload);
      showToast(res.message, 'success');
      setCloseTarget(null);
      await load();
    } catch (error) {
      showToast(
        error instanceof ApiError && !isTechnicalFailure(error)
          ? error.message
          : MESSAGES.technicalFailure,
        'error',
      );
    }
  };

  const handleAssign = async () => {
    if (!assignFor || !selectedStoryId) return;
    try {
      const res = await assignStoryToSprint(project.id, selectedStoryId, assignFor.id);
      showToast(res.message, 'success');
      setAssignFor(null);
      setSelectedStoryId('');
      await load();
    } catch (error) {
      showToast(
        error instanceof ApiError && !isTechnicalFailure(error)
          ? error.message
          : MESSAGES.technicalFailure,
        'error',
      );
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-[#9CA3AF]" role="status">
        Cargando sprints…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {current ? (
        <>
          <CurrentSprintPanel sprint={current} />
          {canManage ? (
            <div className="mb-4 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  const active = sprints.find((s) => s.status === 'ACTIVE');
                  if (active) {
                    setCloseTarget(active);
                    setCloseDest('BACKLOG');
                    setCloseTargetSprintId('');
                  }
                }}
              >
                {SPRINT_MESSAGES.finishSprint}
              </Button>
            </div>
          ) : null}
          {burndownIdeal.length ? (
            <div className="mb-6">
              <SprintBurndownChart ideal={burndownIdeal} actual={burndownActual} />
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-lg border border-white/10 bg-[#12131C] p-4 text-sm text-[#9CA3AF]">
          {noActiveMessage ?? SPRINT_MESSAGES.noActive}
        </div>
      )}

      {canManage ? (
        <div className="flex justify-end">
          <Button iconLeft={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
            {SPRINT_MESSAGES.createSprint}
          </Button>
        </div>
      ) : null}

      {sprints.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
          <Target size={28} className="mx-auto mb-2 text-violet-400" />
          <p className="font-medium text-[#F9FAFB]">Sin sprints</p>
          <p className="text-sm text-[#6B7280]">
            Crea el primer sprint para comenzar la planificación.
          </p>
        </div>
      ) : (
        sprints.map((sprint) => {
          const sprintStories = stories.filter((st) => st.sprint_id === sprint.id);
          const isOpen = expanded === sprint.id;
          const canStart =
            canManage && sprint.status === 'PLANNING' && sprint.story_count > 0 && !hasActiveSprint;
          const startDisabled =
            canManage &&
            sprint.status === 'PLANNING' &&
            (hasActiveSprint || sprint.story_count === 0);

          return (
            <div
              key={sprint.id}
              className="overflow-hidden rounded-xl border border-white/10 bg-[#12131C]"
            >
              <div className="p-5">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      className="mt-1 text-[#6B7280] hover:text-[#F9FAFB]"
                      onClick={() => setExpanded(isOpen ? null : sprint.id)}
                      aria-expanded={isOpen}
                    >
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-[#F9FAFB]">{sprint.name}</h3>
                        <SprintStatusBadge status={sprint.status} />
                      </div>
                      {sprint.goal ? <p className="text-xs text-[#9CA3AF]">{sprint.goal}</p> : null}
                    </div>
                  </div>
                  {canManage && sprint.status === 'PLANNING' ? (
                    <span
                      title={
                        startDisabled && hasActiveSprint
                          ? SPRINT_MESSAGES.activeSprintTooltip
                          : undefined
                      }
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!canStart}
                        onClick={() => setStartTarget(sprint)}
                      >
                        {SPRINT_MESSAGES.startSprint}
                      </Button>
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-[#6B7280]">
                  {sprint.start_date} → {sprint.end_date} · {sprint.story_count} HU ·{' '}
                  {sprint.total_points} pt
                </p>
              </div>
              {isOpen ? (
                <div className="border-t border-white/6 px-5 py-3">
                  {canManage ? (
                    <div className="mb-3 flex justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        iconLeft={<Plus size={13} />}
                        onClick={() => {
                          setAssignFor(sprint);
                          setSelectedStoryId('');
                        }}
                      >
                        Asignar HU al sprint
                      </Button>
                    </div>
                  ) : null}
                  {sprintStories.length === 0 ? (
                    <p className="py-4 text-center text-sm text-[#6B7280]">
                      Sin historias en este sprint.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {sprintStories.map((st) => (
                        <li
                          key={st.id}
                          className="rounded-md border border-white/6 px-3 py-2 text-sm text-[#F9FAFB]"
                        >
                          {st.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          );
        })
      )}

      {createOpen ? (
        <ProjectModal
          title={SPRINT_MESSAGES.createTitle}
          onClose={() => setCreateOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                {SPRINT_MESSAGES.cancel}
              </Button>
              <Button onClick={() => void handleCreate()}>{SPRINT_MESSAGES.save}</Button>
            </>
          }
        >
          <div className="space-y-4">
            <TextField
              label="Nombre del sprint"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={formErrors.name}
              maxLength={100}
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sprint-goal" className="text-sm font-medium text-[#F9FAFB]">
                Objetivo del sprint
              </label>
              <textarea
                id="sprint-goal"
                value={form.goal}
                onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                rows={3}
                maxLength={500}
                className={fieldClass}
              />
              {formErrors.goal ? <p className="text-xs text-red-400">{formErrors.goal}</p> : null}
            </div>
            <TextField
              label="Fecha de inicio"
              type="date"
              min={minStartDate()}
              value={form.startDate}
              onChange={(e) => {
                const startDate = e.target.value;
                setForm((f) => ({
                  ...f,
                  startDate,
                  endDate: f.endDate || defaultEndDate(startDate),
                }));
              }}
              error={formErrors.startDate}
            />
            <TextField
              label="Fecha de fin"
              type="date"
              min={form.startDate || minStartDate()}
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              error={formErrors.endDate}
            />
          </div>
        </ProjectModal>
      ) : null}

      {startTarget ? (
        <ProjectModal
          title={SPRINT_MESSAGES.startConfirmTitle}
          onClose={() => setStartTarget(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setStartTarget(null)}>
                {SPRINT_MESSAGES.cancel}
              </Button>
              <Button onClick={() => void handleStart()}>{SPRINT_MESSAGES.confirmStart}</Button>
            </>
          }
        >
          <p className="text-sm text-[#9CA3AF]">
            Confirmar inicio de <strong className="text-[#F9FAFB]">{startTarget.name}</strong> (
            {startTarget.start_date} → {startTarget.end_date}) con {startTarget.story_count}{' '}
            historias y {startTarget.total_points} puntos planificados.
          </p>
        </ProjectModal>
      ) : null}

      <section className="mt-8 border-t border-white/10 pt-6">
        <h2 className="mb-3 text-lg font-semibold text-[#F9FAFB]">
          {SPRINT_MESSAGES.historyTitle}
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-[#6B7280]">{historyMessage ?? SPRINT_MESSAGES.noHistory}</p>
        ) : (
          history.map((item) => {
            const open = expandedHistory === item.sprint_id;
            return (
              <div
                key={item.sprint_id}
                className="mb-2 rounded-lg border border-white/10 bg-[#12131C] p-4"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left"
                  onClick={() => setExpandedHistory(open ? null : item.sprint_id)}
                >
                  <div>
                    <p className="font-medium text-[#F9FAFB]">{item.name}</p>
                    <p className="text-xs text-[#6B7280]">
                      {item.start_date} → {item.end_date} · {item.completed_points}/
                      {item.committed_points} pts ({item.fulfillment_percentage}%)
                    </p>
                  </div>
                  {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {open ? (
                  <p className="mt-2 text-xs text-[#9CA3AF]">
                    Historias completadas en este sprint (puntos entregados: {item.completed_points}
                    ).
                  </p>
                ) : null}
              </div>
            );
          })
        )}
      </section>

      {closeTarget ? (
        <ProjectModal
          title={SPRINT_MESSAGES.closeTitle}
          onClose={() => setCloseTarget(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setCloseTarget(null)}>
                {SPRINT_MESSAGES.cancel}
              </Button>
              <Button onClick={() => void handleClose()}>{SPRINT_MESSAGES.confirmClose}</Button>
            </>
          }
        >
          <p className="mb-3 text-sm text-[#9CA3AF]">
            Completadas: {closeSummary.completePts} pts · Pendientes: {closeSummary.incompletePts}{' '}
            pts en {closeTarget.name}.
          </p>
          {closeSummary.hasIncomplete ? (
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={closeDest === 'BACKLOG'}
                  onChange={() => setCloseDest('BACKLOG')}
                />
                {SPRINT_MESSAGES.moveToBacklog}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={closeDest === 'SPRINT'}
                  onChange={() => setCloseDest('SPRINT')}
                  disabled={planningSprints.length === 0}
                />
                {SPRINT_MESSAGES.moveToSprint}
              </label>
              {closeDest === 'SPRINT' ? (
                <select
                  className={fieldClass}
                  value={closeTargetSprintId}
                  onChange={(e) => setCloseTargetSprintId(e.target.value)}
                >
                  <option value="">Seleccione sprint destino</option>
                  {planningSprints
                    .filter((s) => s.id !== closeTarget.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-emerald-400">Todas las historias están completadas.</p>
          )}
        </ProjectModal>
      ) : null}

      {assignFor ? (
        <ProjectModal
          title="Asignar historia al sprint"
          onClose={() => setAssignFor(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setAssignFor(null)}>
                {SPRINT_MESSAGES.cancel}
              </Button>
              <Button disabled={!selectedStoryId} onClick={() => void handleAssign()}>
                {SPRINT_MESSAGES.assignHu}
              </Button>
            </>
          }
        >
          <label
            htmlFor="assign-story-select"
            className="mb-1 block text-sm font-medium text-[#F9FAFB]"
          >
            Historia de usuario
          </label>
          <select
            id="assign-story-select"
            className={fieldClass}
            value={selectedStoryId}
            onChange={(e) => setSelectedStoryId(e.target.value)}
          >
            <option value="">Seleccione una HU del backlog</option>
            {unassignedStories.map((st) => (
              <option key={st.id} value={st.id}>
                {st.title}
              </option>
            ))}
          </select>
        </ProjectModal>
      ) : null}
    </div>
  );
}
