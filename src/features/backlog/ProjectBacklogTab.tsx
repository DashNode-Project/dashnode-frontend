import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, Layers, MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Avatar, Badge } from '@/components/ui/demo-ui';
import { listProjectMembers, type ProjectMemberRow } from '@/features/projects/api';
import { ProjectModal } from '@/features/projects/ProjectModal';
import { useAuth } from '@/features/auth/AuthContext';
import { useProjectWorkspace } from '@/features/projects/ProjectWorkspaceContext';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { useToast } from '@/lib/toast/ToastProvider';
import {
  assignStoryPoints,
  assignStoryTask,
  createEpic,
  createStoryTask,
  createUserStory,
  deleteStoryTask,
  getProjectBacklog,
  updateEpic,
  updateStoryTask,
  updateStoryTaskHours,
  updateUserStory,
} from './api';
import {
  BACKLOG_MESSAGES,
  EPIC_COLOR_OPTIONS,
  FIBONACCI_OPTIONS,
  MOSCOW_OPTIONS,
  TASK_TYPE_OPTIONS,
} from './messages';
import type { BacklogTreeDTO, MoscowPriority, StoryTaskDTO, UserStoryDTO } from './types';
import {
  validateEpicForm,
  validateEstimatedHours,
  validateStoryForm,
  validateTaskName,
} from './validation';

const fieldClass =
  'w-full rounded-md border border-white/10 bg-[#1E1F2B] p-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-blue-500 focus:outline-none';

export default function ProjectBacklogTab() {
  const { user } = useAuth();
  const { project, canManage } = useProjectWorkspace();
  const { showToast } = useToast();
  const [tree, setTree] = useState<BacklogTreeDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedEpic, setExpandedEpic] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<UserStoryDTO | null>(null);
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
  }>({
    title: '',
    userRole: '',
    reason: '',
    acceptanceCriteria: '',
    moscow: 'must_have',
    epicId: '',
  });
  const [storyErrors, setStoryErrors] = useState<
    Partial<Record<'title' | 'userRole' | 'reason', string>>
  >({});

  const [taskModal, setTaskModal] = useState<'create' | 'edit' | null>(null);
  const [taskTarget, setTaskTarget] = useState<StoryTaskDTO | null>(null);
  const [taskForm, setTaskForm] = useState({ name: '', taskType: 'frontend', notes: '' });
  const [taskNameError, setTaskNameError] = useState('');
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<StoryTaskDTO | null>(null);
  const [hoursDraft, setHoursDraft] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.user_id, m.name])), [members]);

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
        getProjectBacklog(project.id),
        listProjectMembers(project.id),
      ]);
      setTree(backlog);
      setMembers(memberRows);
      setExpandedEpic((prev) => prev ?? backlog.epics[0]?.epic.id ?? null);
    } catch (error) {
      notifyError(error);
    } finally {
      setLoading(false);
    }
  }, [project.id, notifyError]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [backlog, memberRows] = await Promise.all([
          getProjectBacklog(project.id),
          listProjectMembers(project.id),
        ]);
        if (cancelled) return;
        setTree(backlog);
        setMembers(memberRows);
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
  }, [project.id, notifyError]);

  const tasksForStory = (storyId: string): StoryTaskDTO[] => tree?.tasks_by_story[storyId] ?? [];

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
        if (selectedStory?.id === res.id) setSelectedStory(res);
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

  async function handleStoryPoints(storyId: string, raw: string) {
    const storyPoints = raw === '' ? null : Number(raw);
    setSubmitting(true);
    try {
      const res = await assignStoryPoints(storyId, storyPoints);
      showToast(res.message, 'success');
      if (selectedStory?.id === storyId) setSelectedStory(res);
      await reloadBacklog();
    } catch (error) {
      notifyError(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveTask() {
    const err = validateTaskName(taskForm.name);
    setTaskNameError(err.name ?? '');
    if (err.name || !selectedStory) return;
    setSubmitting(true);
    try {
      if (taskModal === 'create') {
        const res = await createStoryTask(selectedStory.id, {
          name: taskForm.name.trim(),
          task_type: taskForm.taskType as StoryTaskDTO['task_type'],
          notes: taskForm.notes,
        });
        showToast(res.message, 'success');
      } else if (taskModal === 'edit' && taskTarget) {
        const res = await updateStoryTask(taskTarget.id, {
          name: taskForm.name.trim(),
          task_type: taskForm.taskType as StoryTaskDTO['task_type'],
          notes: taskForm.notes,
        });
        showToast(res.message, 'success');
      }
      setTaskModal(null);
      setTaskTarget(null);
      await reloadBacklog();
    } catch (error) {
      notifyError(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDeleteTask() {
    if (!deleteTaskTarget) return;
    setSubmitting(true);
    try {
      const res = await deleteStoryTask(deleteTaskTarget.id);
      showToast(res.message, 'success');
      setDeleteTaskTarget(null);
      await reloadBacklog();
    } catch (error) {
      notifyError(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssign(taskId: string, assigneeId: string) {
    setSubmitting(true);
    try {
      const res = await assignStoryTask(taskId, assigneeId || null);
      showToast(res.message, 'success');
      await reloadBacklog();
    } catch (error) {
      notifyError(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function saveHours(taskId: string) {
    const raw = hoursDraft[taskId] ?? '';
    const validation = validateEstimatedHours(raw);
    if (validation.hours) {
      showToast(validation.hours, 'error');
      return;
    }
    const value = raw.trim() === '' ? null : Number(raw);
    setSubmitting(true);
    try {
      const res = await updateStoryTaskHours(taskId, value);
      showToast(res.message, 'success');
      await reloadBacklog();
    } catch (error) {
      notifyError(error);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !tree) {
    return (
      <p className="text-sm text-[#9CA3AF]" role="status">
        Cargando backlog…
      </p>
    );
  }

  const epics = tree?.epics ?? [];

  return (
    <div className="space-y-4">
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
          <p className="font-medium text-[#F9FAFB]">Sin épicas</p>
          <p className="text-sm text-[#6B7280]">Crea la primera épica para organizar el backlog.</p>
        </div>
      ) : (
        epics.map(({ epic, stories }) => {
          const isExpanded = expandedEpic === epic.id;
          return (
            <div
              key={epic.id}
              className="overflow-hidden rounded-xl border border-white/6 bg-[#12131C]"
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
                        </tr>
                      </thead>
                      <tbody>
                        {stories.map((s) => (
                          <tr
                            key={s.id}
                            className={`cursor-pointer border-b border-white/4 last:border-0 hover:bg-white/2 ${
                              selectedStory?.id === s.id ? 'bg-white/4' : ''
                            }`}
                            onClick={() => setSelectedStory(s)}
                          >
                            <td className="px-4 py-3">
                              <p className="text-sm text-[#F9FAFB]">{s.title}</p>
                              <p className="max-w-md truncate text-xs text-[#6B7280]">{s.reason}</p>
                            </td>
                            <td className="hidden px-4 py-3 sm:table-cell">
                              <Badge>{s.moscow_priority.replace('_', ' ')}</Badge>
                            </td>
                            <td className="hidden px-4 py-3 md:table-cell">
                              {s.story_points !== null ? (
                                <span className="rounded bg-violet-500/20 px-2 py-0.5 font-mono text-xs text-violet-300">
                                  {s.story_points} pt
                                </span>
                              ) : (
                                <span className="text-xs text-[#6B7280]">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
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

      {selectedStory && (
        <div className="rounded-xl border border-white/6 bg-[#12131C] p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-[#F9FAFB]">{selectedStory.title}</h3>
              <p className="text-sm text-[#9CA3AF]">
                {selectedStory.user_role} — {selectedStory.reason}
              </p>
            </div>
            {canManage && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditStory(selectedStory);
                  setStoryForm({
                    title: selectedStory.title,
                    userRole: selectedStory.user_role,
                    reason: selectedStory.reason,
                    acceptanceCriteria: selectedStory.acceptance_criteria,
                    moscow: selectedStory.moscow_priority,
                    epicId: selectedStory.epic_id,
                  });
                  setStoryErrors({});
                }}
              >
                Editar
              </Button>
            )}
          </div>

          {canManage && (
            <div className="mb-4 max-w-xs">
              <label
                htmlFor="backlog-story-points"
                className="mb-1 block text-sm font-medium text-[#F9FAFB]"
              >
                Puntos de Historia
              </label>
              <select
                id="backlog-story-points"
                className={fieldClass}
                value={selectedStory.story_points?.toString() ?? ''}
                disabled={submitting}
                onChange={(e) => void handleStoryPoints(selectedStory.id, e.target.value)}
              >
                {FIBONACCI_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[#F9FAFB]">Tareas</h4>
            {canWorkTasks && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setTaskForm({ name: '', taskType: 'frontend', notes: '' });
                  setTaskNameError('');
                  setTaskModal('create');
                }}
              >
                Agregar tarea
              </Button>
            )}
          </div>
          <ul className="space-y-3">
            {tasksForStory(selectedStory.id).map((task) => (
              <li
                key={task.id}
                className="rounded-lg border border-white/6 bg-[#1E1F2B] p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-[#F9FAFB]">{task.name}</p>
                    <p className="text-xs text-[#6B7280]">
                      {TASK_TYPE_OPTIONS.find((t) => t.value === task.task_type)?.label ??
                        task.task_type}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canWorkTasks && (
                      <button
                        type="button"
                        className="text-xs text-blue-400 hover:underline"
                        onClick={() => {
                          setTaskTarget(task);
                          setTaskForm({
                            name: task.name,
                            taskType: task.task_type,
                            notes: task.notes,
                          });
                          setTaskModal('edit');
                        }}
                      >
                        Editar
                      </button>
                    )}
                    {canWorkTasks && (
                      <button
                        type="button"
                        className="text-xs text-red-400 hover:underline"
                        onClick={() => setDeleteTaskTarget(task)}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor={`task-assignee-${task.id}`}
                      className="mb-1 block text-xs text-[#9CA3AF]"
                    >
                      Responsable
                    </label>
                    <select
                      id={`task-assignee-${task.id}`}
                      className={fieldClass}
                      value={task.assignee_id ?? ''}
                      disabled={submitting}
                      onChange={(e) => void handleAssign(task.id, e.target.value)}
                    >
                      <option value="">Sin asignar</option>
                      {members.map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    {task.assignee_id && memberMap.get(task.assignee_id) && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <Avatar name={memberMap.get(task.assignee_id)!} size={20} />
                        <span className="text-xs text-[#9CA3AF]">
                          {memberMap.get(task.assignee_id)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor={`task-hours-${task.id}`}
                      className="mb-1 block text-xs text-[#9CA3AF]"
                    >
                      Horas estimadas
                    </label>
                    <div className="flex gap-2">
                      <input
                        id={`task-hours-${task.id}`}
                        type="number"
                        min="0"
                        step="0.5"
                        className={fieldClass}
                        value={hoursDraft[task.id] ?? task.estimated_hours ?? ''}
                        onChange={(e) =>
                          setHoursDraft((prev) => ({ ...prev, [task.id]: e.target.value }))
                        }
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={submitting}
                        onClick={() => void saveHours(task.id)}
                      >
                        Guardar
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
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

      {taskModal && (
        <ProjectModal
          title={taskModal === 'create' ? 'Agregar tarea' : 'Editar tarea'}
          onClose={() => {
            setTaskModal(null);
            setTaskTarget(null);
          }}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setTaskModal(null);
                  setTaskTarget(null);
                }}
              >
                Cancelar
              </Button>
              <Button disabled={submitting} onClick={() => void handleSaveTask()}>
                Guardar tarea
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

      {deleteTaskTarget && (
        <ProjectModal
          title="Eliminar tarea"
          onClose={() => setDeleteTaskTarget(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteTaskTarget(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                disabled={submitting}
                onClick={() => void confirmDeleteTask()}
              >
                Confirmar
              </Button>
            </>
          }
        >
          <p className="text-sm text-[#9CA3AF]">{BACKLOG_MESSAGES.taskDeleteConfirm}</p>
        </ProjectModal>
      )}
    </div>
  );
}
