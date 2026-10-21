import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/demo-ui';
import { TextField } from '@/components/ui/TextField';
import { ProjectModal } from '@/features/projects/ProjectModal';
import type { ProjectMemberRow } from '@/features/projects/api';
import {
  assignStoryTask,
  assignTaskStoryPoints,
  changeTaskStatus,
  logTaskHours,
  updateStoryTaskHours,
} from './api';
import { BACKLOG_MESSAGES, FIBONACCI_OPTIONS, TASK_STATUS_OPTIONS } from './messages';
import type { StoryTaskDTO, UserStoryDTO } from './types';
import { validateEstimatedHours } from './validation';

const fieldClass =
  'w-full rounded-md border border-white/10 bg-[#1E1F2B] p-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-blue-500 focus:outline-none';

export function TaskWorkModal({
  projectId,
  story,
  task,
  members,
  memberMap,
  canWork,
  submitting,
  setSubmitting,
  onClose,
  onSaved,
  onPreviewStory,
  notifyError,
  showToast,
}: {
  projectId: string;
  story: UserStoryDTO;
  task: StoryTaskDTO;
  members: ProjectMemberRow[];
  memberMap: Map<string, string>;
  canWork: boolean;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onPreviewStory: () => void;
  notifyError: (error: unknown) => void;
  showToast: (message: string, tone: 'success' | 'error' | 'info') => void;
}) {
  const taskModePoints = story.estimation_mode === 'task';

  async function handleAssign(assigneeId: string) {
    setSubmitting(true);
    try {
      const res = await assignStoryTask(task.id, assigneeId || null);
      showToast(res.message, 'success');
      await onSaved();
    } catch (error) {
      notifyError(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleHours(raw: string) {
    const validation = validateEstimatedHours(raw);
    if (validation.hours) {
      showToast(validation.hours, 'error');
      return;
    }
    const value = raw.trim() === '' ? null : Number(raw);
    setSubmitting(true);
    try {
      const res = await updateStoryTaskHours(task.id, value);
      showToast(res.message, 'success');
      await onSaved();
    } catch (error) {
      notifyError(error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTaskPoints(raw: string) {
    const storyPoints = raw === '' ? null : Number(raw);
    setSubmitting(true);
    try {
      const res = await assignTaskStoryPoints(task.id, storyPoints);
      showToast(res.message, 'success');
      await onSaved();
    } catch (error) {
      notifyError(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProjectModal
      title={task.name}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onPreviewStory}>
            <Eye size={15} className="mr-1" aria-hidden />
            Ver HU completa
          </Button>
          <Button type="button" onClick={onClose}>
            Cerrar
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <p className="text-xs text-[#6B7280]">{task.notes || 'Sin notas adicionales.'}</p>

        <label className="block text-xs text-[#9CA3AF]">
          Responsable
          <select
            className={`${fieldClass} mt-1`}
            value={task.assignee_id ?? ''}
            disabled={!canWork || submitting}
            onChange={(e) => void handleAssign(e.target.value)}
          >
            <option value="">Sin asignar</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.name}
              </option>
            ))}
          </select>
          {task.assignee_id && memberMap.get(task.assignee_id) ? (
            <div className="mt-1 flex items-center gap-1.5">
              <Avatar name={memberMap.get(task.assignee_id)!} size={20} />
              <span className="text-xs text-[#9CA3AF]">{memberMap.get(task.assignee_id)}</span>
            </div>
          ) : null}
        </label>

        {taskModePoints ? (
          <label className="block text-xs text-[#9CA3AF]">
            Puntos de sprint (tarea)
            <select
              className={`${fieldClass} mt-1`}
              value={task.story_points?.toString() ?? ''}
              disabled={!canWork || submitting}
              onChange={(e) => void handleTaskPoints(e.target.value)}
            >
              {FIBONACCI_OPTIONS.map((o) => (
                <option key={o.label} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div>
          <TextField
            label="Horas estimadas"
            type="number"
            min={0}
            step={0.5}
            defaultValue={task.estimated_hours ?? ''}
            disabled={!canWork || submitting}
            onBlur={(e) => {
              if (!canWork) return;
              void handleHours(e.target.value);
            }}
          />
        </div>

        {canWork ? (
          <>
            <label className="block text-xs text-[#9CA3AF]">
              Estado
              <select
                className={`${fieldClass} mt-1`}
                value={task.status}
                disabled={submitting || task.status === 'CORRECTION'}
                title={
                  task.status === 'CORRECTION' ? BACKLOG_MESSAGES.correctionLocked : undefined
                }
                onChange={(event) => {
                  const next = event.target.value;
                  if (next === 'CORRECTION') return;
                  setSubmitting(true);
                  void changeTaskStatus(projectId, task.id, next)
                    .then((result) => {
                      showToast(result.message, 'success');
                      return onSaved();
                    })
                    .catch((error) => notifyError(error))
                    .finally(() => setSubmitting(false));
                }}
              >
                {TASK_STATUS_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.value === 'CORRECTION'}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs text-[#9CA3AF]">
              Registrar horas ({task.logged_hours ?? '0'} acumuladas)
              <div className="mt-1 flex gap-2">
                <input
                  type="number"
                  min={0.01}
                  max={24}
                  step={0.01}
                  className={fieldClass}
                  id={`task-work-log-${task.id}`}
                  disabled={submitting}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    const input = event.currentTarget;
                    const raw = Number(input.value);
                    if (!raw || raw <= 0) {
                      showToast(BACKLOG_MESSAGES.hoursPositive, 'error');
                      return;
                    }
                    setSubmitting(true);
                    void logTaskHours(projectId, task.id, { hours_spent: raw })
                      .then((result) => {
                        showToast(result.message, 'success');
                        input.value = '';
                        return onSaved();
                      })
                      .catch((error) => notifyError(error))
                      .finally(() => setSubmitting(false));
                  }}
                />
              </div>
            </label>
          </>
        ) : null}
      </div>
    </ProjectModal>
  );
}
