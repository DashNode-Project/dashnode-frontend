import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronRight, Layers, MoreHorizontal, Pencil, Plus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { IconActionButton } from '@/components/ui/IconActionButton';
import { TextField } from '@/components/ui/TextField';
import { Avatar } from '@/components/ui/demo-ui';
import { projectStoryReaderPath } from '@/app/paths';
import { listProjectMembers, type ProjectMemberRow } from '@/features/projects/api';
import { ProjectModal } from '@/features/projects/ProjectModal';
import { useAuth } from '@/features/auth/AuthContext';
import { useProjectWorkspace } from '@/features/projects/ProjectWorkspaceContext';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { useToast } from '@/lib/toast/ToastProvider';
import {
  createEpic,
  createStoryTask,
  createUserStory,
  getProjectBacklog,
  updateEpic,
  updateUserStory,
} from './api';
import {
  BACKLOG_MESSAGES,
  EPIC_COLOR_OPTIONS,
  ESTIMATION_MODE_OPTIONS,
  FILTER_PRIORITY_OPTIONS,
  MOSCOW_OPTIONS,
  TASK_TYPE_OPTIONS,
} from './messages';
import {
  assigneeIdsForStory,
  storyPointsLabel,
  tasksForStory,
  visibleProjectMembers,
} from './backlogHelpers';
import { MoscowBadge } from './MoscowBadge';
import type { BacklogTreeDTO, EstimationMode, MoscowPriority, StoryTaskDTO, UserStoryDTO } from './types';
import {
  validateEpicForm,
  validateStoryForm,
  validateTaskName,
} from './validation';

const fieldClass =
  'w-full rounded-md border border-white/10 bg-[#1E1F2B] p-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-blue-500 focus:outline-none';

export default function ProjectBacklogTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { project, canManage } = useProjectWorkspace();
  const { showToast } = useToast();
  const [tree, setTree] = useState<BacklogTreeDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [expandedEpic, setExpandedEpic] = useState<string | null>(null);
  const [createTaskStoryId, setCreateTaskStoryId] = useState<string | null>(null);
  const [members, setMembers] = useState<ProjectMemberRow[]>([]);
  const isMember = members.some((m) => m.user_id === user?.id);
  const canWorkTasks = canManage || isMember;

  const [createEpicOpen, setCreateEpicOpen] = useState(false);
  const [editEpicId, setEditEpicId] = useState<string | null>(null);
  const [epicForm, setEpicForm] = useState({ name: '', description: '', color: '#3B82F6' });
  const [epicErrors, setEpicErrors] = useState<{ name?: string }>({});

  const [addStoryEpicId, setAddStoryEpicId] = useState<string | null>(null);
  const [editStory, setEditStory] = useState<UserStoryDTO | null>(null);
  const [storyForm, setStoryForm] = useState<{
    title: string;
    userRole: string;
    reason: string;
    acceptanceCriteria: string;
    moscow: MoscowPriority;
    epicId: string;
    estimationMode: EstimationMode;
  }>({
    title: '',
    userRole: '',
    reason: '',
    acceptanceCriteria: '',
    moscow: 'must_have',
    epicId: '',
    estimationMode: 'story',
  });
  const [storyErrors, setStoryErrors] = useState<
    Partial<Record<'title' | 'userRole' | 'reason', string>>
  >({});

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ name: '', taskType: 'frontend', notes: '' });
  const [taskNameError, setTaskNameError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const assignableMembers = useMemo(() => visibleProjectMembers(members), [members]);
  const memberMap = useMemo(
    () => new Map(assignableMembers.map((m) => [m.user_id, m.name])),
    [assignableMembers],
  );
  const notifyError = useCallback(
    (error: unknown) => {
      showToast(
        error instanceof ApiError && !isTechnicalFailure(error)
          ? error.message
          : MESSAGES.technicalFailure,
        'error',
      );
    },
    [showToast],
  );

  const reloadBacklog = useCallback(async () => {
    setLoading(true);
    try {
      const [backlog, memberRows] = await Promise.all([
        getProjectBacklog(project.id, {
          q: filterQuery,
          priority: filterPriority,
          assignedTo: filterAssignee,
        }),
        listProjectMembers(project.id),
      ]);
      setTree(backlog);
      setMembers(visibleProjectMembers(memberRows));
      setExpandedEpic((prev) => prev ?? backlog.epics[0]?.epic.id ?? null);
    } catch (error) {
      notifyError(error);
    } finally {
      setLoading(false);
    }
  }, [project.id, notifyError, filterQuery, filterPriority, filterAssignee]);

  useEffect(() => {
    const timer = window.setTimeout(() => setFilterQuery(filterText.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [filterText]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [backlog, memberRows] = await Promise.all([
          getProjectBacklog(project.id, {
            q: filterQuery,
            priority: filterPriority,
            assignedTo: filterAssignee,
          }),
          listProjectMembers(project.id),
        ]);
        if (cancelled) return;
        setTree(backlog);
        setMembers(visibleProjectMembers(memberRows));
        setExpandedEpic((prev) => prev ?? backlog.epics[0]?.epic.id ?? null);
      } catch (error) {
        if (!cancelled) notifyError(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project.id, notifyError, filterQuery, filterPriority, filterAssignee]);

  async function handleCreateEpic() {
    const errors = validateEpicForm(epicForm.name);
    setEpicErrors(errors);
    if (errors.name) return;
    setSubmitting(true);
    try {
      const res = await createEpic(project.id, {
        name: epicForm.name.trim(),
        description: epicForm.description,
        color: epicForm.color,
      });
      showToast(res.message, 'success');
      setCreateEpicOpen(false);
      setEpicForm({ name: '', description: '', color: '#3B82F6' });
      await reloadBacklog();
    } catch (error) {
      if (error instanceof ApiError && error.fields?.name) {
        setEpicErrors({ name: error.fields.name });
      } else {
        notifyError(error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateEpic() {
    if (!editEpicId) return;
    const errors = validateEpicForm(epicForm.name);
    setEpicErrors(errors);
    if (errors.name) return;
    setSubmitting(true);
    try {
      const res = await updateEpic(editEpicId, {
        name: epicForm.name.trim(),
        description: epicForm.description,
        color: epicForm.color,
      });
      showToast(res.message, 'success');
      setEditEpicId(null);
      await reloadBacklog();
    } catch (error) {
      notifyError(error);
    } finally {
      setSubmitting(false);
    }
  }

  function openEditEpic(epicId: string, name: string, description: string, color: string | null) {
    setEpicForm({ name, description, color: color ?? '#3B82F6' });
    setEpicErrors({});
    setEditEpicId(epicId);
  }

  async function handleSaveStory(mode: 'create' | 'edit') {
    const errors = validateStoryForm({
      title: storyForm.title,
      userRole: storyForm.userRole,
      reason: storyForm.reason,
    });
    setStoryErrors(errors);
    if (Object.keys(errors).length) return;
    setSubmitting(true);
    try {
      if (mode === 'create' && addStoryEpicId) {
        const res = await createUserStory(addStoryEpicId, {
          title: storyForm.title.trim(),
          user_role: storyForm.userRole.trim(),
          reason: storyForm.reason.trim(),
          acceptance_criteria: storyForm.acceptanceCriteria,
          moscow_priority: storyForm.moscow,
          estimation_mode: storyForm.estimationMode,
        });
        showToast(res.message, 'success');
        setAddStoryEpicId(null);
      } else if (mode === 'edit' && editStory) {
        const res = await updateUserStory(editStory.id, {
          title: storyForm.title.trim(),
          user_role: storyForm.userRole.trim(),
          reason: storyForm.reason.trim(),
          acceptance_criteria: storyForm.acceptanceCriteria,
          moscow_priority: storyForm.moscow,
          epic_id: storyForm.epicId,
        });
        showToast(res.message, 'success');
        setEditStory(null);
      }
      await reloadBacklog();
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        setStoryErrors({
          title: error.fields.title,
          userRole: error.fields.user_role,
          reason: error.fields.reason,
        });
      } else {
        notifyError(error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function openCreateTaskModal(storyId: string) {
    setCreateTaskStoryId(storyId);
    setTaskForm({ name: '', taskType: 'frontend', notes: '' });
    setTaskNameError('');
    setTaskModalOpen(true);
  }

  async function handleSaveTask() {
    const err = validateTaskName(taskForm.name);
    setTaskNameError(err.name ?? '');
    if (err.name || !createTaskStoryId) return;
    setSubmitting(true);
    try {
      const res = await createStoryTask(createTaskStoryId, {
        name: taskForm.name.trim(),
        task_type: taskForm.taskType as StoryTaskDTO['task_type'],
        notes: taskForm.notes,
      });
      showToast(res.message, 'success');
      setTaskModalOpen(false);
      setCreateTaskStoryId(null);
      await reloadBacklog();
    } catch (error) {
      notifyError(error);
    } finally {
      setSubmitting(false);
    }
  }

  function openStoryEditor(story: UserStoryDTO) {
    setEditStory(story);
    setStoryForm({
      title: story.title,
      userRole: story.user_role,
      reason: story.reason,
      acceptanceCriteria: story.acceptance_criteria,
      moscow: story.moscow_priority,
      epicId: story.epic_id,
      estimationMode: story.estimation_mode,
    });
    setStoryErrors({});
  }

  if (loading && !tree) {
    return (
      <div className="space-y-3 animate-pulse" role="status" aria-label="Cargando backlog">
        <div className="h-10 rounded-lg bg-white/5" />
        <div className="h-32 rounded-xl bg-white/5" />
        <div className="h-32 rounded-xl bg-white/5" />
      </div>
    );
  }

  const epics = tree?.epics ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 via-[#12131C] to-blue-600/10 px-5 py-4 shadow-lg shadow-violet-950/20">
        <div className="flex items-center gap-2">
          <Sparkles className="text-violet-300" size={20} aria-hidden />
          <div>
            <p className="text-sm font-semibold text-[#F9FAFB]">Backlog del proyecto</p>
            <p className="text-xs text-[#9CA3AF]">Gestiona historias, tareas y estimaciones</p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => navigate(`${projectStoryReaderPath(project.id)}?layout=all`)}
        >
          <BookOpen size={15} className="mr-1.5" aria-hidden />
          Ver detalle de todas las HU
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-xs text-[#9CA3AF]">
          Texto
          <input
            className={`${fieldClass} mt-1`}
            value={filterText}
            onChange={(event) => setFilterText(event.target.value)}
            placeholder="Buscar"
          />
        </label>
        <label className="text-xs text-[#9CA3AF]">
          Prioridad
          <select
            className={`${fieldClass} mt-1`}
            value={filterPriority}
            onChange={(event) => setFilterPriority(event.target.value)}
          >
            {FILTER_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value || 'any'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[#9CA3AF]">
          Responsable
          <select
            className={`${fieldClass} mt-1`}
            value={filterAssignee}
            onChange={(event) => setFilterAssignee(event.target.value)}
          >
            <option value="">Todos</option>
            <option value="unassigned">Sin responsable</option>
            {assignableMembers.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setCreateEpicOpen(true)}>
            <Plus size={15} aria-hidden />
            Nueva épica
          </Button>
        </div>
      )}

      {epics.length === 0 ? (
        <div className="rounded-xl border border-white/6 bg-[#12131C] p-8 text-center">
          <Layers className="mx-auto mb-2 text-[#6B7280]" size={22} aria-hidden />
          <p className="font-medium text-[#F9FAFB]">
            {tree?.message ?? BACKLOG_MESSAGES.backlogEmpty}
          </p>
          <p className="text-sm text-[#6B7280]">Crea la primera épica para organizar el backlog.</p>
        </div>
      ) : (
        epics.map(({ epic, stories }) => {
          const isExpanded = expandedEpic === epic.id;
          return (
            <div
              key={epic.id}
              className="overflow-hidden rounded-2xl border border-white/8 bg-[#12131C] shadow-md shadow-black/30 transition hover:border-violet-500/20"
            >
              <div className="flex items-center gap-2 px-4 py-3">
                <button
                  type="button"
                  className="flex flex-1 items-center gap-3 text-left hover:bg-white/2"
                  onClick={() => setExpandedEpic(isExpanded ? null : epic.id)}
                >
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: epic.color ?? '#3B82F6' }}
                  />
                  <span className="flex-1 font-medium text-[#F9FAFB]">{epic.name}</span>
                  <span className="text-xs text-[#6B7280]">{stories.length} HU</span>
                  <ChevronRight
                    size={14}
                    className={`text-[#6B7280] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    aria-hidden
                  />
                </button>
                {canManage && (
                  <button
                    type="button"
                    className="rounded p-1 text-[#9CA3AF] hover:bg-white/8 hover:text-[#F9FAFB]"
                    aria-label="Acciones de épica"
                    onClick={() => openEditEpic(epic.id, epic.name, epic.description, epic.color)}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                )}
              </div>
              {isExpanded && (
                <div className="border-t border-white/6">
                  {stories.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-[#6B7280]">
                      Sin historias en esta épica.
                    </p>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/4">
                          <th className="px-4 py-2 text-left text-xs font-medium text-[#6B7280]">
                            Historia
                          </th>
                          <th className="hidden px-4 py-2 text-left text-xs font-medium text-[#6B7280] sm:table-cell">
                            MoSCoW
                          </th>
                          <th className="hidden px-4 py-2 text-left text-xs font-medium text-[#6B7280] md:table-cell">
                            Puntos
                          </th>
                          <th className="hidden px-4 py-2 text-left text-xs font-medium text-[#6B7280] lg:table-cell">
                            Tareas
                          </th>
                          <th className="hidden px-4 py-2 text-left text-xs font-medium text-[#6B7280] xl:table-cell">
                            Asignados
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-[#6B7280]">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stories.map((s) => {
                          const storyTasks = tasksForStory(tree, s.id);
                          const points = storyPointsLabel(s, storyTasks);
                          const assignees = assigneeIdsForStory(storyTasks);
                          return (
                          <tr
                            key={s.id}
                            className="border-b border-white/4 last:border-0 transition-colors hover:bg-gradient-to-r hover:from-violet-500/5 hover:to-transparent"
                          >
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-[#F9FAFB]">{s.title}</p>
                              <p className="max-w-md truncate text-xs text-[#6B7280]">{s.reason}</p>
                            </td>
                            <td className="hidden px-4 py-3 sm:table-cell">
                              <MoscowBadge priority={s.moscow_priority} />
                            </td>
                            <td className="hidden px-4 py-3 md:table-cell">
                              {points.value !== null ? (
                                <span className="rounded bg-violet-500/20 px-2 py-0.5 font-mono text-xs text-violet-300">
                                  {points.value} pt
                                </span>
                              ) : (
                                <span className="text-xs text-[#6B7280]">—</span>
                              )}
                            </td>
                            <td className="hidden px-4 py-3 lg:table-cell">
                              {storyTasks.length ? (
                                <ol className="max-w-[200px] list-decimal space-y-0.5 pl-4 text-xs text-[#9CA3AF]">
                                  {storyTasks.slice(0, 4).map((t) => (
                                    <li key={t.id} className="truncate">
                                      {t.name}
                                    </li>
                                  ))}
                                  {storyTasks.length > 4 ? (
                                    <li className="list-none pl-0 text-[#6B7280]">
                                      +{storyTasks.length - 4} más
                                    </li>
                                  ) : null}
                                </ol>
                              ) : (
                                <span className="text-xs text-[#6B7280]">Sin tareas</span>
                              )}
                            </td>
                            <td className="hidden px-4 py-3 xl:table-cell">
                              <div className="flex -space-x-1">
                                {assignees.length ? (
                                  assignees.map((id) => (
                                    <Avatar
                                      key={id}
                                      name={memberMap.get(id) ?? '?'}
                                      size={22}
                                    />
                                  ))
                                ) : (
                                  <span className="text-xs text-[#6B7280]">—</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1">
                                {canWorkTasks ? (
                                  <IconActionButton
                                    icon={Plus}
                                    label="Agregar tarea"
                                    tone="emerald"
                                    onClick={() => openCreateTaskModal(s.id)}
                                  />
                                ) : null}
                                {canManage ? (
                                  <IconActionButton
                                    icon={Pencil}
                                    label="Editar historia"
                                    tone="neutral"
                                    onClick={() => openStoryEditor(s)}
                                  />
                                ) : null}
                                <IconActionButton
                                  icon={BookOpen}
                                  label="Ver detalle de la historia"
                                  tone="blue"
                                  onClick={() =>
                                    navigate(projectStoryReaderPath(project.id, s.id))
                                  }
                                />
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                  {canManage && (
                    <div className="border-t border-white/4 px-4 py-2">
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                        onClick={() => {
                          setStoryForm({
                            title: '',
                            userRole: '',
                            reason: '',
                            acceptanceCriteria: '',
                            moscow: 'must_have',
                            epicId: epic.id,
                            estimationMode: 'story',
                          });
                          setStoryErrors({});
                          setAddStoryEpicId(epic.id);
                        }}
                      >
                        <Plus size={12} aria-hidden />
                        Agregar HU
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {createEpicOpen && (
        <ProjectModal
          title="Crear épica"
          onClose={() => setCreateEpicOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreateEpicOpen(false)}>
                Cancelar
              </Button>
              <Button disabled={submitting} onClick={() => void handleCreateEpic()}>
                Crear épica
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <TextField
              label="Nombre de la épica *"
              value={epicForm.name}
              error={epicErrors.name}
              onChange={(e) => setEpicForm((f) => ({ ...f, name: e.target.value }))}
            />
            <div>
              <label htmlFor="create-epic-description" className="mb-1 block text-sm font-medium">
                Descripción
              </label>
              <textarea
                id="create-epic-description"
                className={fieldClass}
                rows={2}
                maxLength={2000}
                value={epicForm.description}
                onChange={(e) => setEpicForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="create-epic-color" className="mb-1 block text-sm font-medium">
                Color / Etiqueta visual
              </label>
              <select
                id="create-epic-color"
                className={fieldClass}
                value={epicForm.color}
                onChange={(e) => setEpicForm((f) => ({ ...f, color: e.target.value }))}
              >
                {EPIC_COLOR_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </ProjectModal>
      )}

      {editEpicId && (
        <ProjectModal
          title="Editar épica"
          onClose={() => setEditEpicId(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditEpicId(null)}>
                Cancelar
              </Button>
              <Button disabled={submitting} onClick={() => void handleUpdateEpic()}>
                Guardar cambios
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <TextField
              label="Nombre *"
              value={epicForm.name}
              error={epicErrors.name}
              onChange={(e) => setEpicForm((f) => ({ ...f, name: e.target.value }))}
            />
            <div>
              <label htmlFor="edit-epic-description" className="mb-1 block text-sm font-medium">
                Descripción
              </label>
              <textarea
                id="edit-epic-description"
                className={fieldClass}
                rows={2}
                value={epicForm.description}
                onChange={(e) => setEpicForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="edit-epic-color" className="mb-1 block text-sm font-medium">
                Color
              </label>
              <select
                id="edit-epic-color"
                className={fieldClass}
                value={epicForm.color}
                onChange={(e) => setEpicForm((f) => ({ ...f, color: e.target.value }))}
              >
                {EPIC_COLOR_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </ProjectModal>
      )}

      {(addStoryEpicId || editStory) && (
        <ProjectModal
          title={editStory ? 'Editar historia de usuario' : 'Nueva historia de usuario'}
          onClose={() => {
            setAddStoryEpicId(null);
            setEditStory(null);
          }}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setAddStoryEpicId(null);
                  setEditStory(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                disabled={submitting}
                onClick={() => void handleSaveStory(editStory ? 'edit' : 'create')}
              >
                {editStory ? 'Guardar cambios' : 'Crear historia'}
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <TextField
              label="Título / Característica *"
              value={storyForm.title}
              error={storyErrors.title}
              onChange={(e) => setStoryForm((f) => ({ ...f, title: e.target.value }))}
            />
            <TextField
              label="Rol del usuario *"
              value={storyForm.userRole}
              error={storyErrors.userRole}
              onChange={(e) => setStoryForm((f) => ({ ...f, userRole: e.target.value }))}
            />
            <TextField
              label="Razón / Resultado *"
              value={storyForm.reason}
              error={storyErrors.reason}
              onChange={(e) => setStoryForm((f) => ({ ...f, reason: e.target.value }))}
            />
            <div>
              <label htmlFor="story-acceptance-criteria" className="mb-1 block text-sm font-medium">
                Criterios de Aceptación
              </label>
              <textarea
                id="story-acceptance-criteria"
                className={fieldClass}
                rows={3}
                value={storyForm.acceptanceCriteria}
                onChange={(e) =>
                  setStoryForm((f) => ({ ...f, acceptanceCriteria: e.target.value }))
                }
              />
            </div>
            {!editStory ? (
              <div>
                <label htmlFor="story-estimation-mode" className="mb-1 block text-sm font-medium">
                  Modo de estimación *
                </label>
                <select
                  id="story-estimation-mode"
                  className={fieldClass}
                  value={storyForm.estimationMode}
                  onChange={(e) =>
                    setStoryForm((f) => ({
                      ...f,
                      estimationMode: e.target.value as EstimationMode,
                    }))
                  }
                >
                  {ESTIMATION_MODE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[#6B7280]">
                  Solo puede elegirse al crear la historia; no se mezclan ambos modos.
                </p>
              </div>
            ) : null}
            <div>
              <label htmlFor="story-moscow" className="mb-1 block text-sm font-medium">
                Prioridad MoSCoW
              </label>
              <select
                id="story-moscow"
                className={fieldClass}
                value={storyForm.moscow}
                onChange={(e) =>
                  setStoryForm((f) => ({
                    ...f,
                    moscow: e.target.value as MoscowPriority,
                  }))
                }
              >
                {MOSCOW_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {editStory && (
              <div>
                <label htmlFor="story-epic-id" className="mb-1 block text-sm font-medium">
                  Épica contenedora
                </label>
                <select
                  id="story-epic-id"
                  className={fieldClass}
                  value={storyForm.epicId}
                  onChange={(e) => setStoryForm((f) => ({ ...f, epicId: e.target.value }))}
                >
                  {epics.map(({ epic }) => (
                    <option key={epic.id} value={epic.id}>
                      {epic.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </ProjectModal>
      )}

      {taskModalOpen && (
        <ProjectModal
          title="Nueva tarea"
          onClose={() => {
            setTaskModalOpen(false);
            setCreateTaskStoryId(null);
          }}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setTaskModalOpen(false);
                  setCreateTaskStoryId(null);
                }}
              >
                Cancelar
              </Button>
              <Button disabled={submitting} onClick={() => void handleSaveTask()}>
                Crear tarea
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <TextField
              label="Nombre / Descripción de la tarea *"
              value={taskForm.name}
              error={taskNameError}
              onChange={(e) => setTaskForm((f) => ({ ...f, name: e.target.value }))}
            />
            <div>
              <label htmlFor="task-type" className="mb-1 block text-sm font-medium">
                Tipo de tarea
              </label>
              <select
                id="task-type"
                className={fieldClass}
                value={taskForm.taskType}
                onChange={(e) => setTaskForm((f) => ({ ...f, taskType: e.target.value }))}
              >
                {TASK_TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="task-notes" className="mb-1 block text-sm font-medium">
                Criterios o notas cubiertas
              </label>
              <textarea
                id="task-notes"
                className={fieldClass}
                rows={2}
                value={taskForm.notes}
                onChange={(e) => setTaskForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
        </ProjectModal>
      )}

    </div>
  );
}
