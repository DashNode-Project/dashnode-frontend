import { Avatar } from '@/components/ui/demo-ui';
import { MoscowBadge } from './MoscowBadge';
import { storyPointsLabel, tasksForStory, type EstimationMode } from './backlogHelpers';
import type { BacklogTreeDTO, UserStoryDTO } from './types';
import { TASK_TYPE_OPTIONS } from './messages';

export function UserStoryContent({
  story,
  tree,
  memberMap,
  compact = false,
  hideTasks = false,
}: {
  story: UserStoryDTO;
  tree: BacklogTreeDTO | null;
  memberMap: Map<string, string>;
  compact?: boolean;
  hideTasks?: boolean;
}) {
  const tasks = tasksForStory(tree, story.id);
  const points = storyPointsLabel(story, tasks);

  return (
    <article className={compact ? 'space-y-3' : 'space-y-4'}>
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <MoscowBadge priority={story.moscow_priority} />
          {points.value !== null ? (
            <span className="rounded bg-violet-500/20 px-2 py-0.5 font-mono text-xs text-violet-300">
              {points.value} pt · {points.hint}
            </span>
          ) : (
            <span className="text-xs text-[#6B7280]">Sin estimación ({points.hint})</span>
          )}
          <span className="text-xs text-[#6B7280]">
            Modo: {story.estimation_mode === 'task' ? 'por tarea' : 'por historia'}
          </span>
        </div>
        <h2 className={compact ? 'text-lg font-semibold text-[#F9FAFB]' : 'text-xl font-semibold text-[#F9FAFB]'}>
          {story.title}
        </h2>
      </header>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">Rol</dt>
          <dd className="mt-1 text-sm text-[#F9FAFB]">{story.user_role}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Razón / resultado
          </dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm text-[#9CA3AF]">{story.reason}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Criterios de aceptación
          </dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm text-[#9CA3AF]">
            {story.acceptance_criteria?.trim() ? story.acceptance_criteria : '—'}
          </dd>
        </div>
      </dl>

      {!hideTasks && tasks.length > 0 ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-[#F9FAFB]">Tareas ({tasks.length})</h3>
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="rounded-lg border border-white/6 bg-[#1E1F2B]/80 px-3 py-2 text-sm"
              >
                <p className="font-medium text-[#F9FAFB]">{task.name}</p>
                <p className="text-xs text-[#6B7280]">
                  {TASK_TYPE_OPTIONS.find((t) => t.value === task.task_type)?.label ?? task.task_type}
                  {task.estimated_hours ? ` · ${task.estimated_hours} h est.` : ''}
                  {task.logged_hours ? ` · ${task.logged_hours} h registradas` : ''}
                  {story.estimation_mode === 'task' && task.story_points
                    ? ` · ${task.story_points} pt`
                    : ''}
                </p>
                {task.assignee_id && memberMap.get(task.assignee_id) ? (
                  <div className="mt-1 flex items-center gap-1.5">
                    <Avatar name={memberMap.get(task.assignee_id)!} size={18} />
                    <span className="text-xs text-[#9CA3AF]">{memberMap.get(task.assignee_id)}</span>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

export function estimationModeLabel(mode: EstimationMode): string {
  return mode === 'task' ? 'Estimar por tarea (puntos en cada tarea)' : 'Estimar en la historia (puntos únicos)';
}
