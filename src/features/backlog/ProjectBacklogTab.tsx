import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronRight,
  Eye,
  ExternalLink,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
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
  assignStoryPoints,
  createEpic,
  createStoryTask,
  createUserStory,
  deleteStoryTask,
  getProjectBacklog,
  updateEpic,
  updateStoryTask,
  updateUserStory,
} from './api';
import {
  BACKLOG_MESSAGES,
  EPIC_COLOR_OPTIONS,
  ESTIMATION_MODE_OPTIONS,
  FILTER_PRIORITY_OPTIONS,
  FIBONACCI_OPTIONS,
  MOSCOW_OPTIONS,
  TASK_TYPE_OPTIONS,
} from './messages';
import {
  assigneeIdsForStory,
  flattenStories,
  storyPointsLabel,
  tasksForStory,
  visibleProjectMembers,
} from './backlogHelpers';
import { MoscowBadge } from './MoscowBadge';
import { TaskWorkModal } from './TaskWorkModal';
import { UserStoryContent } from './UserStoryContent';
import { UserStoryPreviewModal } from './UserStoryPreviewModal';
import type { BacklogTreeDTO, EstimationMode, MoscowPriority, StoryTaskDTO, UserStoryDTO } from './types';
import {
  validateEpicForm,
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
  const [filterText, setFilterText] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [expandedEpic, setExpandedEpic] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<UserStoryDTO | null>(null);
  const [previewStory, setPreviewStory] = useState<UserStoryDTO | null>(null);
  const [taskWorkTarget, setTaskWorkTarget] = useState<StoryTaskDTO | null>(null);
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

  const [taskModal, setTaskModal] = useState<'create' | 'edit' | null>(null);
  const [taskTarget, setTaskTarget] = useState<StoryTaskDTO | null>(null);
  const [taskForm, setTaskForm] = useState({ name: '', taskType: 'frontend', notes: '' });
  const [taskNameError, setTaskNameError] = useState('');
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<StoryTaskDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const assignableMembers = useMemo(() => visibleProjectMembers(members), [members]);
  const memberMap = useMemo(
    () => new Map(assignableMembers.map((m) => [m.user_id, m.name])),
    [assignableMembers],
  );
  const allStories = useMemo(() => flattenStories(tree), [tree]);

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
      setSelectedStory((prev) => {
        if (!prev) return prev;
        const fresh = flattenStories(backlog).find((s) => s.id === prev.id);
        return fresh ?? prev;
      });
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
    if (!taskWorkTarget || !selectedStory || !tree) return;
    const fresh = tasksForStory(tree, selectedStory.id).find((t) => t.id === taskWorkTarget.id);
    if (fresh) setTaskWorkTarget(fresh);
  }, [tree, selectedStory, taskWorkTarget?.id]);

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
    <div className="space-y-4">
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
                          <th className="hidden px-4 py-2 text-left text-xs font-medium text-[#6B7280] lg:table-cell">
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
                            className={`border-b border-white/4 last:border-0 hover:bg-white/2 ${
                              selectedStory?.id === s.id ? 'bg-white/4' : ''
                            }`}
                          >
                            <td
                              className="cursor-pointer px-4 py-3"
                              onClick={() => setSelectedStory(s)}
                            >
                              <p className="text-sm text-[#F9FAFB]">{s.title}</p>
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
                                {canManage ? (
                                  <IconActionButton
                                    icon={Pencil}
                                    label="Editar historia"
                                    tone="neutral"
                                    onClick={() => openStoryEditor(s)}
                                  />
                                ) : null}
                                <IconActionButton
                                  icon={Eye}
                                  label="Previsualizar historia"
                                  tone="blue"
                                  onClick={() => setPreviewStory(s)}
                                />
                                <IconActionButton
                                  icon={ExternalLink}
                                  label="Abrir historia en pestaña"
                                  tone="neutral"
                                  onClick={() =>
                                    window.open(projectStoryReaderPath(project.id, s.id), '_blank')
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

      {selectedStory && (
        <div className="rounded-xl border border-white/6 bg-[#12131C] p-5 transition-opacity duration-200">
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            {canManage ? (
              <IconActionButton
                icon={Pencil}
                label="Editar historia"
                tone="neutral"
                onClick={() => openStoryEditor(selectedStory)}
              />
            ) : null}
            <IconActionButton
              icon={Eye}
              label="Previsualizar"
              tone="blue"
              onClick={() => setPreviewStory(selectedStory)}
            />
            <IconActionButton
              icon={ExternalLink}
              label="Abrir en pestaña"
              tone="neutral"
              onClick={() =>
                window.open(projectStoryReaderPath(project.id, selectedStory.id), '_blank')
              }
            />
          </div>

          <UserStoryContent story={selectedStory} tree={tree} memberMap={memberMap} compact />

          {canManage && selectedStory.estimation_mode === 'story' ? (
            <div className="mt-4 max-w-xs">
              <label
                htmlFor="backlog-story-points"
                className="mb-1 block text-sm font-medium text-[#F9FAFB]"
              >
                Puntos de historia
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
          ) : null}

          <div className="mt-6 mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[#F9FAFB]">Tareas</h4>
            {canWorkTasks ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setTaskForm({ name: '', taskType: 'frontend', notes: '' });
                  setTaskNameError('');
                  setTaskModal('create');
                }}
              >
                <Plus size={14} className="mr-1" aria-hidden />
                Agregar tarea
              </Button>
            ) : null}
          </div>
          <ul className="space-y-2">
            {tasksForStory(tree, selectedStory.id).map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/6 bg-[#1E1F2B] px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[#F9FAFB]">{task.name}</p>
                  <p className="text-xs text-[#6B7280]">
                    {TASK_TYPE_OPTIONS.find((t) => t.value === task.task_type)?.label ??
                      task.task_type}
                    {task.assignee_id && memberMap.get(task.assignee_id)
                      ? ` · ${memberMap.get(task.assignee_id)}`
                      : ''}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <IconActionButton
                    icon={Eye}
                    label="Ver detalle de tarea"
                    tone="blue"
                    onClick={() => setTaskWorkTarget(task)}
                  />
                  {canWorkTasks ? (
                    <>
                      <IconActionButton
                        icon={Pencil}
                        label="Editar tarea"
                        tone="neutral"
                        onClick={() => {
                          setTaskTarget(task);
                          setTaskForm({
                            name: task.name,
                            taskType: task.task_type,
                            notes: task.notes,
                          });
                          setTaskModal('edit');
                        }}
                      />
                      <IconActionButton
                        icon={Trash2}
                        label="Eliminar tarea"
                        tone="red"
                        onClick={() => setDeleteTaskTarget(task)}
                      />
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {previewStory ? (
        <UserStoryPreviewModal
          projectId={project.id}
          story={previewStory}
          stories={allStories}
          tree={tree}
          memberMap={memberMap}
          canManage={canManage}
          onClose={() => setPreviewStory(null)}
          onNavigate={setPreviewStory}
          onEdit={() => {
            openStoryEditor(previewStory);
            setPreviewStory(null);
          }}
        />
      ) : null}

      {taskWorkTarget && selectedStory ? (
        <TaskWorkModal
          projectId={project.id}
          story={selectedStory}
          task={taskWorkTarget}
          members={assignableMembers}
          memberMap={memberMap}
          canWork={canWorkTasks}
          submitting={submitting}
          setSubmitting={setSubmitting}
          onClose={() => setTaskWorkTarget(null)}
          onSaved={reloadBacklog}
          onPreviewStory={() => setPreviewStory(selectedStory)}
          notifyError={notifyError}
          showToast={showToast}
        />
      ) : null}

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
