import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import {
  ChevronLeft,
  ChevronRight,
  ListTree,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconActionButton } from '@/components/ui/IconActionButton';
import { TextField } from '@/components/ui/TextField';
import { projectStoryReaderPath, projectTabPath } from '@/app/paths';
import { listProjectMembers, type ProjectMemberRow } from '@/features/projects/api';
import { ProjectModal } from '@/features/projects/ProjectModal';
import { useAuth } from '@/features/auth/AuthContext';
import { useProjectWorkspace } from '@/features/projects/ProjectWorkspaceContext';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { useToast } from '@/lib/toast/ToastProvider';
import {
  assignStoryPoints,
  createStoryTask,
  deleteStoryTask,
  getProjectBacklog,
  updateStoryTask,
} from './api';
import { flattenStories, tasksForStory, visibleProjectMembers } from './backlogHelpers';
import { MoscowBadge } from './MoscowBadge';
import { TaskWorkModal } from './TaskWorkModal';
import { UserStoryContent } from './UserStoryContent';
import { BACKLOG_MESSAGES, FIBONACCI_OPTIONS, TASK_TYPE_OPTIONS } from './messages';
import type { BacklogTreeDTO, StoryTaskDTO, UserStoryDTO } from './types';
import { validateTaskName } from './validation';

const fieldClass =
  'w-full rounded-md border border-white/10 bg-[#1E1F2B] p-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-blue-500 focus:outline-none';

export default function UserStoryReaderPage() {
  const { projectId = '', storyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { project, canManage } = useProjectWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();
  const layout = searchParams.get('layout') === 'all' ? 'all' : 'single';
  const { showToast } = useToast();
  const [tree, setTree] = useState<BacklogTreeDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<ProjectMemberRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [taskFormOpen, setTaskFormOpen] = useState<'create' | 'edit' | null>(null);
  const [taskFormStoryId, setTaskFormStoryId] = useState<string | null>(null);
  const [taskEditTarget, setTaskEditTarget] = useState<StoryTaskDTO | null>(null);
  const [taskForm, setTaskForm] = useState({ name: '', taskType: 'frontend', notes: '' });
  const [taskNameError, setTaskNameError] = useState('');
  const [taskWorkTarget, setTaskWorkTarget] = useState<{
    story: UserStoryDTO;
    task: StoryTaskDTO;
  } | null>(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<StoryTaskDTO | null>(null);

  const isMember = members.some((m) => m.user_id === user?.id);
  const canWorkTasks = canManage || isMember;
  const memberMap = useMemo(() => new Map(members.map((m) => [m.user_id, m.name])), [members]);

  const reload = useCallback(async () => {
    if (!projectId) return;
    const [backlog, memberRows] = await Promise.all([
      getProjectBacklog(projectId),
      listProjectMembers(projectId),
    ]);
    setTree(backlog);
    setMembers(visibleProjectMembers(memberRows));
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await reload();
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
  }, [reload, showToast]);

  const stories = useMemo(() => flattenStories(tree), [tree]);
  const activeId = storyId ?? stories[0]?.id;
  const index = stories.findIndex((s) => s.id === activeId);
  const current = index >= 0 ? stories[index] : stories[0];

  function goTo(story: UserStoryDTO) {
    const qs = searchParams.toString();
    navigate(`${projectStoryReaderPath(projectId, story.id)}${qs ? `?${qs}` : ''}`);
  }

  function openCreateTask(story: UserStoryDTO) {
    setTaskFormStoryId(story.id);
    setTaskEditTarget(null);
    setTaskForm({ name: '', taskType: 'frontend', notes: '' });
    setTaskNameError('');
    setTaskFormOpen('create');
  }

  function openEditTaskContent(story: UserStoryDTO, task: StoryTaskDTO) {
    setTaskFormStoryId(story.id);
    setTaskEditTarget(task);
    setTaskForm({ name: task.name, taskType: task.task_type, notes: task.notes });
    setTaskNameError('');
    setTaskFormOpen('edit');
  }

  async function saveTaskForm() {
    const err = validateTaskName(taskForm.name);
    setTaskNameError(err.name ?? '');
    if (err.name || !taskFormStoryId) return;
    setSubmitting(true);
    try {
      if (taskFormOpen === 'create') {
        const res = await createStoryTask(taskFormStoryId, {
          name: taskForm.name.trim(),
          task_type: taskForm.taskType as StoryTaskDTO['task_type'],
          notes: taskForm.notes,
        });
        showToast(res.message, 'success');
      } else if (taskFormOpen === 'edit' && taskEditTarget) {
        const res = await updateStoryTask(taskEditTarget.id, {
          name: taskForm.name.trim(),
          task_type: taskForm.taskType as StoryTaskDTO['task_type'],
          notes: taskForm.notes,
        });
        showToast(res.message, 'success');
      }
      setTaskFormOpen(null);
      await reload();
    } catch (error) {
      showToast(
        error instanceof ApiError && !isTechnicalFailure(error)
          ? error.message
          : MESSAGES.technicalFailure,
        'error',
      );
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
      await reload();
    } catch (error) {
      showToast(
        error instanceof ApiError && !isTechnicalFailure(error)
          ? error.message
          : MESSAGES.technicalFailure,
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStoryPoints(story: UserStoryDTO, raw: string) {
    const storyPoints = raw === '' ? null : Number(raw);
    setSubmitting(true);
    try {
      const res = await assignStoryPoints(story.id, storyPoints);
      showToast(res.message, 'success');
      await reload();
    } catch (error) {
      showToast(
        error instanceof ApiError && !isTechnicalFailure(error)
          ? error.message
          : MESSAGES.technicalFailure,
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function renderStoryCard(story: UserStoryDTO, highlight: boolean) {
    const tasks = tasksForStory(tree, story.id);
    return (
      <article
        key={story.id}
        id={story.id}
        className={`scroll-mt-6 overflow-hidden rounded-2xl border bg-gradient-to-br from-[#141522] via-[#12131C] to-[#0D0E14] shadow-lg transition-all duration-300 ${
          highlight
            ? 'border-violet-500/40 shadow-violet-900/30 ring-1 ring-violet-400/20'
            : 'border-white/8 shadow-black/40'
        }`}
      >
        <div className="border-b border-white/6 bg-gradient-to-r from-violet-600/10 via-transparent to-blue-600/10 px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="text-violet-300" size={18} aria-hidden />
            <MoscowBadge priority={story.moscow_priority} />
          </div>
        </div>
        <div className="p-6">
          <UserStoryContent story={story} tree={tree} memberMap={memberMap} hideTasks />

          {canManage && story.estimation_mode === 'story' ? (
            <div className="mt-5 max-w-xs rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <label
                htmlFor={`points-${story.id}`}
                className="mb-1 block text-sm font-medium text-violet-200"
              >
                Puntos de historia
              </label>
              <select
                id={`points-${story.id}`}
                className={fieldClass}
                value={story.story_points?.toString() ?? ''}
                disabled={submitting}
                onChange={(e) => void handleStoryPoints(story, e.target.value)}
              >
                {FIBONACCI_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#9CA3AF]">
                <ListTree size={16} aria-hidden />
                Tareas ({tasks.length})
              </h3>
              {canWorkTasks ? (
                <Button size="sm" variant="secondary" onClick={() => openCreateTask(story)}>
                  <Plus size={14} className="mr-1" aria-hidden />
                  Nueva tarea
                </Button>
              ) : null}
            </div>
            <ul className="space-y-2">
              {tasks.map((task, i) => (
                <li
                  key={task.id}
                  className="group flex items-center gap-3 rounded-xl border border-white/6 bg-[#1A1B26]/90 px-4 py-3 transition hover:border-blue-500/30 hover:bg-[#1E2030]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-xs font-bold text-blue-300">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#F9FAFB]">{task.name}</p>
                    <p className="text-xs text-[#6B7280]">
                      {TASK_TYPE_OPTIONS.find((t) => t.value === task.task_type)?.label ??
                        task.task_type}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-90 transition group-hover:opacity-100">
                    {canWorkTasks ? (
                      <>
                        <IconActionButton
                          icon={Pencil}
                          label="Editar contenido de la tarea"
                          tone="neutral"
                          onClick={() => openEditTaskContent(story, task)}
                        />
                        <IconActionButton
                          icon={Wrench}
                          label="Gestionar tarea (horas, estado, responsable)"
                          tone="blue"
                          onClick={() => setTaskWorkTarget({ story, task })}
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
              {tasks.length === 0 ? (
                <li className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-[#6B7280]">
                  Sin tareas. Agrega la primera para desglosar esta historia.
                </li>
              ) : null}
            </ul>
          </section>
        </div>
      </article>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse" role="status">
        <div className="h-10 rounded-xl bg-white/5" />
        <div className="h-64 rounded-2xl bg-white/5" />
      </div>
    );
  }

  if (!tree || stories.length === 0) {
    return (
      <p className="text-sm text-[#9CA3AF]">
        No hay historias para mostrar.{' '}
        <Link to={projectTabPath(projectId, 'tareas/lista')} className="text-blue-400 hover:underline">
          Volver a tareas
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-[#12131C]/80 px-4 py-3 backdrop-blur-sm">
        <Link
          to={projectTabPath(projectId, 'tareas/lista')}
          className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
        >
          ← Volver a tareas
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={layout === 'single' ? 'primary' : 'secondary'}
            onClick={() => setSearchParams({ layout: 'single' })}
          >
            Una a una
          </Button>
          <Button
            type="button"
            size="sm"
            variant={layout === 'all' ? 'primary' : 'secondary'}
            onClick={() => {
              navigate(`${projectStoryReaderPath(projectId)}?layout=all`);
            }}
          >
            Todas (scroll)
          </Button>
        </div>
      </div>

      {layout === 'all' ? (
        <div className="space-y-8">{stories.map((story) => renderStoryCard(story, false))}</div>
      ) : current ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-white/6 bg-[#12131C] px-4 py-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={index <= 0}
              aria-label="Historia anterior"
              onClick={() => {
                if (index > 0) goTo(stories[index - 1]!);
              }}
            >
              <ChevronLeft size={16} aria-hidden />
            </Button>
            <span className="text-xs font-medium text-[#9CA3AF]">
              Historia {index + 1} de {stories.length}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={index < 0 || index >= stories.length - 1}
              aria-label="Historia siguiente"
              onClick={() => {
                if (index >= 0 && index < stories.length - 1) goTo(stories[index + 1]!);
              }}
            >
              <ChevronRight size={16} aria-hidden />
            </Button>
          </div>
          {renderStoryCard(current, true)}
        </div>
      ) : null}

      {taskFormOpen ? (
        <ProjectModal
          title={taskFormOpen === 'create' ? 'Nueva tarea' : 'Editar contenido de la tarea'}
          onClose={() => setTaskFormOpen(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setTaskFormOpen(null)}>
                Cancelar
              </Button>
              <Button disabled={submitting} onClick={() => void saveTaskForm()}>
                Guardar
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <TextField
              label="Nombre / descripción *"
              value={taskForm.name}
              error={taskNameError}
              onChange={(e) => setTaskForm((f) => ({ ...f, name: e.target.value }))}
            />
            <div>
              <label htmlFor="reader-task-type" className="mb-1 block text-sm font-medium">
                Tipo
              </label>
              <select
                id="reader-task-type"
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
              <label htmlFor="reader-task-notes" className="mb-1 block text-sm font-medium">
                Notas / criterios
              </label>
              <textarea
                id="reader-task-notes"
                className={fieldClass}
                rows={3}
                value={taskForm.notes}
                onChange={(e) => setTaskForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
        </ProjectModal>
      ) : null}

      {taskWorkTarget ? (
        <TaskWorkModal
          projectId={project.id}
          story={taskWorkTarget.story}
          task={
            tasksForStory(tree, taskWorkTarget.story.id).find(
              (t) => t.id === taskWorkTarget.task.id,
            ) ?? taskWorkTarget.task
          }
          members={members}
          memberMap={memberMap}
          canWork={canWorkTasks}
          submitting={submitting}
          setSubmitting={setSubmitting}
          onClose={() => setTaskWorkTarget(null)}
          onSaved={reload}
          notifyError={(error) =>
            showToast(
              error instanceof ApiError && !isTechnicalFailure(error)
                ? error.message
                : MESSAGES.technicalFailure,
              'error',
            )
          }
          showToast={showToast}
        />
      ) : null}

      {deleteTaskTarget ? (
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
      ) : null}
    </div>
  );
}
