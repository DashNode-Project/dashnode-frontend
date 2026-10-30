import { Clock, Lock } from 'lucide-react';
import type { KanbanCard as KanbanCardType, KanbanColumnId } from '../types';
import { KANBAN_COLUMNS_CONFIG } from '../types';

interface KanbanCardProps {
  task: KanbanCardType;
  canMove: boolean;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: () => void;
  onMoveTask: (task: KanbanCardType, targetColumn: KanbanColumnId) => void;
  onOpenBlockModal: (task: KanbanCardType) => void;
}

const DEFAULT_TYPE_STYLE = {
  label: 'Otro',
  bg: 'bg-gray-500/15 border-gray-500/30',
  text: 'text-gray-400',
};

const TASK_TYPE_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  frontend: { label: 'Frontend', bg: 'bg-blue-500/15 border-blue-500/30', text: 'text-blue-400' },
  backend: {
    label: 'Backend',
    bg: 'bg-emerald-500/15 border-emerald-500/30',
    text: 'text-emerald-400',
  },
  devops: { label: 'DevOps', bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-400' },
  qa: { label: 'QA', bg: 'bg-violet-500/15 border-violet-500/30', text: 'text-violet-400' },
  design: { label: 'Diseño', bg: 'bg-pink-500/15 border-pink-500/30', text: 'text-pink-400' },
  other: DEFAULT_TYPE_STYLE,
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0] ?? '';
  if (parts.length === 1) return first.substring(0, 2).toUpperCase();
  const second = parts[1] ?? '';
  return ((first[0] ?? '') + (second[0] ?? '')).toUpperCase() || '?';
}

export function KanbanCard({
  task,
  canMove,
  isDragging,
  onDragStart,
  onDragEnd,
  onMoveTask,
  onOpenBlockModal,
}: KanbanCardProps) {
  const typeConfig = TASK_TYPE_STYLES[task.task_type.toLowerCase()] ?? DEFAULT_TYPE_STYLE;

  const hasImpediment = task.is_blocked;
  const hasDependency = Boolean(task.blocked_by_task_id);
  const isBlocked = hasImpediment || hasDependency;

  const blockDetails = hasImpediment
    ? `Impedimento: ${task.blocked_reason || 'Sin motivo especificado'}`
    : hasDependency
      ? `Bloqueada por predecesora: ${task.blocked_by_task_name || 'Tarea no completada'}`
      : '';

  const progressPct =
    task.estimated_hours > 0
      ? Math.min(100, Math.round((task.logged_hours / task.estimated_hours) * 100))
      : 0;

  // Manual move targets: TODO, IN_PROGRESS, CODE_REVIEW, TESTING, DONE (exclude CORRECTION)
  const allowedTargets = KANBAN_COLUMNS_CONFIG.filter((col) => col.id !== 'CORRECTION');

  return (
    <div
      draggable={canMove}
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      data-testid={`kanban-card-${task.id}`}
      className={`group relative rounded-xl border border-white/6 bg-[#12131C] p-3 shadow-sm transition-all hover:border-white/20 ${
        canMove ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      } ${isDragging ? 'scale-95 opacity-50 ring-2 ring-blue-500/50' : ''}`}
    >
      {/* Top row: Task type badge and Block badge */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${typeConfig.bg} ${typeConfig.text}`}
        >
          {typeConfig.label}
        </span>

        {isBlocked && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenBlockModal(task);
            }}
            title={blockDetails}
            aria-label={`Ver bloqueo: ${blockDetails}`}
            className="flex items-center gap-1 rounded-md border border-red-500/40 bg-red-500/20 px-2 py-0.5 text-[11px] font-medium text-red-300 transition-colors hover:bg-red-500/30"
          >
            <Lock size={12} className="text-red-400" aria-hidden="true" />
            <span>Bloqueada</span>
          </button>
        )}
      </div>

      {/* Task Name */}
      <p className="mb-1 text-sm font-medium leading-snug text-[#F9FAFB]">{task.name}</p>

      {/* Parent Story */}
      {task.story_title && (
        <p className="mb-2.5 truncate text-xs text-[#9CA3AF]" title={task.story_title}>
          <span className="text-[#6B7280]">HU:</span> {task.story_title}
        </p>
      )}

      {/* Assignee & Move action */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {task.assignee_name ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600/30 text-[10px] font-semibold text-blue-300">
              {getInitials(task.assignee_name)}
            </div>
            <span className="truncate text-xs text-[#9CA3AF]">{task.assignee_name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[#6B7280]">
            <div className="h-5 w-5 rounded-full border border-dashed border-white/20 bg-white/5" />
            <span className="text-xs">Sin asignar</span>
          </div>
        )}

        {/* Move dropdown ("Mover a...") */}
        {canMove && task.status !== 'CORRECTION' ? (
          <div className="shrink-0">
            <select
              value={task.status}
              aria-label={`Mover tarea ${task.name}`}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onMoveTask(task, e.target.value as KanbanColumnId)}
              className="rounded-md border border-white/10 bg-[#1E1F2B] px-2 py-1 text-xs text-[#D1D5DB] transition-colors focus:border-blue-500 focus:outline-none"
            >
              <option disabled value="">
                Mover a...
              </option>
              {allowedTargets.map((col) => (
                <option key={col.id} value={col.id} disabled={col.id === task.status}>
                  {col.label}
                </option>
              ))}
            </select>
          </div>
        ) : task.status === 'CORRECTION' ? (
          <span
            className="text-[11px] text-[#F97316]"
            title="El estado Corrección solo cambia al reportar o resolver un fix."
          >
            En corrección
          </span>
        ) : null}
      </div>

      {/* Hours progress bar */}
      {task.estimated_hours > 0 && (
        <div className="mt-2.5 border-t border-white/5 pt-2">
          <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
            <span className="flex items-center gap-1 font-mono">
              <Clock size={11} aria-hidden="true" />
              {task.logged_hours}h / {task.estimated_hours}h
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
            <div
              className={`h-full rounded-full transition-all ${
                progressPct > 100
                  ? 'bg-red-500'
                  : progressPct === 100
                    ? 'bg-emerald-500'
                    : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, progressPct)}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick block button if not blocked */}
      {!isBlocked && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenBlockModal(task);
            }}
            className="text-[11px] text-[#6B7280] opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
          >
            Reportar impedimento
          </button>
        </div>
      )}
    </div>
  );
}
