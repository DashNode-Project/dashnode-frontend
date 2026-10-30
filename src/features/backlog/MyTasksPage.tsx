import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Card, SectionHeader } from '@/components/ui/demo-ui';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { useToast } from '@/lib/toast/ToastProvider';
import { changeTaskStatus, listMyTasks, type MyTaskItem } from './api';
import { MyTasksKanbanView } from './MyTasksKanbanView';
import { TASK_STATUS_OPTIONS } from './messages';

type ViewMode = 'list' | 'kanban';

export default function MyTasksPage() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<MyTaskItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listMyTasks({
          projectId: projectId || undefined,
          status: status || undefined,
        });
        if (cancelled) return;
        setTasks(data.tasks);
        setMessage(data.message ?? null);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError && !isTechnicalFailure(err)
              ? err.message
              : MESSAGES.loadFailure,
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, status]);

  async function onStatus(task: MyTaskItem, next: string) {
    if (next === 'CORRECTION' || task.status === 'CORRECTION') {
      showToast('El estado Corrección solo cambia al reportar o resolver un fix.', 'error');
      return;
    }
    setBusyId(task.id);
    try {
      const result = await changeTaskStatus(task.project.id, task.id, next);
      showToast(result.message, 'success');
      setTasks((rows) =>
        rows.map((row) => (row.id === task.id ? { ...row, status: result.status } : row)),
      );
    } catch (err) {
      showToast(
        err instanceof ApiError && !isTechnicalFailure(err)
          ? err.message
          : MESSAGES.technicalFailure,
        'error',
      );
    } finally {
      setBusyId(null);
    }
  }

  const projects = Array.from(
    new Map(tasks.map((task) => [task.project.id, task.project.name])).entries(),
  );

  const viewToggle = (
    <div
      className="inline-flex rounded-lg border border-white/10 bg-[#12131C] p-1"
      role="tablist"
      aria-label="Vista de mis tareas"
    >
      <button
        type="button"
        role="tab"
        aria-selected={viewMode === 'list'}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
        }`}
        onClick={() => setViewMode('list')}
      >
        Lista
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={viewMode === 'kanban'}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
        }`}
        onClick={() => setViewMode('kanban')}
      >
        Kanban
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeader title="Mis tareas" subtitle="Trabajo asignado en todos sus proyectos" />
        {viewToggle}
      </div>
      {error ? <Alert variant="error">{error}</Alert> : null}
      <Card className="flex flex-wrap gap-3 p-4">
        <label className="text-sm text-[#9CA3AF]">
          Proyecto
          <select
            className="mt-1 block rounded-md border border-white/10 bg-[#1E1F2B] px-3 py-2 text-[#F9FAFB]"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="">Todos</option>
            {projects.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-[#9CA3AF]">
          Estado
          <select
            className="mt-1 block rounded-md border border-white/10 bg-[#1E1F2B] px-3 py-2 text-[#F9FAFB]"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Todos</option>
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
      </Card>
      {message ? <p className="text-sm text-[#9CA3AF]">{message}</p> : null}
      {viewMode === 'kanban' ? (
        <MyTasksKanbanView tasks={tasks} busyId={busyId} onStatusChange={(task, next) => void onStatus(task, next)} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/6">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#12131C] text-[#9CA3AF]">
              <tr>
                <th className="px-3 py-2">Tarea</th>
                <th className="px-3 py-2">Historia / Proyecto</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Horas</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t border-white/6">
                  <td className="px-3 py-2 text-[#F9FAFB]">{task.name}</td>
                  <td className="px-3 py-2 text-[#9CA3AF]">
                    {task.user_story.title} · {task.project.name}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      aria-label={`Estado de ${task.name}`}
                      value={task.status}
                      disabled={busyId === task.id || task.status === 'CORRECTION'}
                      title={
                        task.status === 'CORRECTION'
                          ? 'El estado Corrección solo cambia al reportar o resolver un fix.'
                          : undefined
                      }
                      onChange={(event) => void onStatus(task, event.target.value)}
                      className="rounded-md border border-white/10 bg-[#1E1F2B] px-2 py-1"
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
                  </td>
                  <td className="px-3 py-2 text-[#9CA3AF]">
                    {task.logged_hours} / {task.estimated_hours ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
