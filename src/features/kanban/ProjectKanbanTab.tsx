import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Kanban as KanbanIcon,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';
import { useProjectWorkspace } from '@/features/projects/ProjectWorkspaceContext';
import { ApiError } from '@/lib/api/errors';
import { useToast } from '@/lib/toast/ToastProvider';
import { changeTaskStatus, getKanbanBoard, updateColumnWipLimit, updateTaskBlock } from './api';
import { KanbanCard } from './components/KanbanCard';
import { KanbanFilterBar } from './components/KanbanFilterBar';
import { TaskBlockModal } from './components/TaskBlockModal';
import { WipLimitModal } from './components/WipLimitModal';
import { KANBAN_MESSAGES } from './messages';
import type {
  KanbanBoardResponse,
  KanbanCard as KanbanCardType,
  KanbanColumn,
  KanbanColumnId,
  KanbanFilters,
  UpdateTaskBlockPayload,
} from './types';
import { KANBAN_COLUMNS_CONFIG } from './types';

export default function ProjectKanbanTab() {
  const { project, canManage, isAdmin } = useProjectWorkspace();
  const { user } = useAuth();
  const { showToast } = useToast();

  const isManagerOrAdmin =
    canManage || isAdmin || user?.role === 'admin' || user?.role === 'manager';
  const isDeveloper = user?.role === 'developer';
  const currentUserId = user?.id;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [board, setBoard] = useState<KanbanBoardResponse | null>(null);

  // Drag & drop state
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<KanbanColumnId | null>(null);

  // Modals state
  const [wipModalCol, setWipModalCol] = useState<KanbanColumn | null>(null);
  const [blockModalTask, setBlockModalTask] = useState<KanbanCardType | null>(null);

  // Filters state
  const [filters, setFilters] = useState<KanbanFilters>({
    search: '',
    assigneeId: 'all',
    storyId: 'all',
    taskType: 'all',
  });

  const loadBoard = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await getKanbanBoard(project.id);
      setBoard(data);
    } catch {
      setLoadError(KANBAN_MESSAGES.LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getKanbanBoard(project.id);
        if (cancelled) return;
        setBoard(data);
      } catch {
        if (cancelled) return;
        setLoadError(KANBAN_MESSAGES.LOAD_ERROR);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  // All cards flattened from current board
  const allCards = useMemo(() => {
    if (!board) return [];
    return board.columns.flatMap((c) => c.tasks);
  }, [board]);

  // Filter cards per column
  const filteredColumns = useMemo(() => {
    if (!board) return [];

    const searchLower = filters.search.trim().toLowerCase();

    return board.columns.map((col) => {
      const filteredTasks = col.tasks.filter((task) => {
        // Free text search
        if (searchLower) {
          const matchTitle = task.name.toLowerCase().includes(searchLower);
          const matchStory = task.story_title?.toLowerCase().includes(searchLower);
          const matchReason = task.blocked_reason?.toLowerCase().includes(searchLower);
          if (!matchTitle && !matchStory && !matchReason) return false;
        }

        // Assignee filter
        if (filters.assigneeId !== 'all' && task.assignee_id !== filters.assigneeId) {
          return false;
        }

        // Story filter
        if (filters.storyId !== 'all' && task.story_id !== filters.storyId) {
          return false;
        }

        // Task type filter
        if (
          filters.taskType !== 'all' &&
          task.task_type.toLowerCase() !== filters.taskType.toLowerCase()
        ) {
          return false;
        }

        return true;
      });

      return {
        ...col,
        tasks: filteredTasks,
      };
    });
  }, [board, filters]);

  const totalFilteredCount = useMemo(() => {
    return filteredColumns.reduce((sum, col) => sum + col.tasks.length, 0);
  }, [filteredColumns]);

  // Determine if a user can move a specific task
  const canMoveTask = useCallback(
    (task: KanbanCardType) => {
      if (isManagerOrAdmin) return true;
      if (isDeveloper && task.assignee_id === currentUserId) return true;
      return false;
    },
    [isManagerOrAdmin, isDeveloper, currentUserId],
  );

  // Transition a task to another column with rollback
  const handleMoveTask = async (task: KanbanCardType, targetColId: KanbanColumnId) => {
    if (task.status === targetColId) return;

    // Restriction check: developer only moves own tasks
    if (isDeveloper && task.assignee_id !== currentUserId) {
      showToast(KANBAN_MESSAGES.OWN_TASKS_ONLY, 'error');
      return;
    }

    // Restriction check: manual move to or from CORRECTION is prohibited
    if (task.status === 'CORRECTION' || targetColId === 'CORRECTION') {
      showToast(KANBAN_MESSAGES.CORRECTION_RESTRICTED, 'error');
      return;
    }

    if (!board) return;

    // Optimistic update
    const previousBoard = board;
    const previousStatus = task.status;

    setBoard((prev) => {
      if (!prev) return prev;
      const updatedCard = { ...task, status: targetColId };
      return {
        ...prev,
        columns: prev.columns.map((col) => {
          if (col.id === previousStatus) {
            return { ...col, tasks: col.tasks.filter((t) => t.id !== task.id) };
          }
          if (col.id === targetColId) {
            return { ...col, tasks: [...col.tasks, updatedCard] };
          }
          return col;
        }),
      };
    });

    try {
      const res = await changeTaskStatus(project.id, task.id, targetColId);
      showToast(res.message || KANBAN_MESSAGES.TASK_STATUS_UPDATED, 'success');
    } catch (err) {
      // Rollback on rejection
      setBoard(previousBoard);
      const message =
        err instanceof ApiError && err.message ? err.message : KANBAN_MESSAGES.LOAD_ERROR;
      showToast(message, 'error');
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDragTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragEnd = () => {
    setDragTaskId(null);
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetColId: KanbanColumnId) => {
    e.preventDefault();
    setDragOverCol(null);

    const taskId = dragTaskId || e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = allCards.find((t) => t.id === taskId);
    if (task) {
      handleMoveTask(task, targetColId);
    }
    setDragTaskId(null);
  };

  // WIP Limit Save
  const handleSaveWipLimit = async (columnId: KanbanColumnId, wipLimit: number | null) => {
    try {
      const res = await updateColumnWipLimit(project.id, columnId, wipLimit);
      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((col) =>
            col.id === columnId ? { ...col, wip_limit: res.wip_limit } : col,
          ),
        };
      });
      showToast(res.message || KANBAN_MESSAGES.WIP_LIMIT_UPDATED, 'success');
    } catch (err) {
      showToast(KANBAN_MESSAGES.WIP_LIMIT_FAILED, 'error');
      throw err;
    }
  };

  // Block status save
  const handleSaveBlockStatus = async (taskId: string, payload: UpdateTaskBlockPayload) => {
    try {
      const res = await updateTaskBlock(project.id, taskId, payload);
      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((col) => ({
            ...col,
            tasks: col.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    is_blocked: res.is_blocked,
                    blocked_reason: res.blocked_reason || null,
                    blocked_by_task_id: res.blocked_by_task_id || null,
                  }
                : t,
            ),
          })),
        };
      });
      showToast(res.message || KANBAN_MESSAGES.BLOCK_STATUS_UPDATED, 'success');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : KANBAN_MESSAGES.LOAD_ERROR;
      showToast(msg, 'error');
      throw err;
    }
  };

  // Render: Loading
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center" role="status">
        <RefreshCw size={24} className="animate-spin text-blue-400" aria-hidden="true" />
        <span className="ml-3 text-sm text-[#9CA3AF]">Cargando tablero Kanban…</span>
      </div>
    );
  }

  // Render: Error
  if (loadError || !board) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
        <AlertCircle size={32} className="mx-auto mb-2 text-red-400" aria-hidden="true" />
        <p className="text-sm font-medium text-red-300">
          {loadError || KANBAN_MESSAGES.LOAD_ERROR}
        </p>
        <Button onClick={loadBoard} variant="secondary" size="sm" className="mt-4">
          <RefreshCw size={14} className="mr-1.5" aria-hidden="true" />
          Reintentar
        </Button>
      </div>
    );
  }

  // Render: No active sprint
  if (!board.sprint_id) {
    return (
      <div className="rounded-xl border border-white/6 bg-[#12131C] p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-[#6B7280]">
          <KanbanIcon size={28} aria-hidden="true" />
        </div>
        <h3 className="mb-1 text-base font-semibold text-[#F9FAFB]">Tablero Kanban</h3>
        <p className="mx-auto max-w-md text-sm text-[#9CA3AF]">
          {KANBAN_MESSAGES.NO_ACTIVE_SPRINT}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header bar with Sprint info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/6 pb-3">
        <div className="flex items-center gap-2">
          <KanbanIcon size={20} className="text-blue-400" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold text-[#F9FAFB]">
              Tablero Kanban: {board.sprint_name || 'Sprint Activo'}
            </h2>
            <p className="text-xs text-[#9CA3AF]">
              Sprint activo del proyecto · Seguimiento de flujo y trabajo en progreso
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <KanbanFilterBar
        filters={filters}
        onChange={setFilters}
        cards={allCards}
        filteredCount={totalFilteredCount}
      />

      {/* Global empty state when filters exclude all cards */}
      {allCards.length > 0 && totalFilteredCount === 0 && (
        <div className="rounded-xl border border-white/6 bg-[#12131C] p-8 text-center">
          <p className="text-sm text-[#9CA3AF]">{KANBAN_MESSAGES.NO_MATCHING_CARDS}</p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-3"
            onClick={() =>
              setFilters({ search: '', assigneeId: 'all', storyId: 'all', taskType: 'all' })
            }
          >
            Restablecer filtros
          </Button>
        </div>
      )}

      {/* Columns Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
        {filteredColumns.map((col) => {
          const config = KANBAN_COLUMNS_CONFIG.find((c) => c.id === col.id) || {
            color: '#6B7280',
          };
          const isOver = dragOverCol === col.id;
          const isWipExceeded = col.wip_limit !== null && col.tasks.length > col.wip_limit;

          return (
            <div
              key={col.id}
              data-testid={`kanban-column-${col.id}`}
              className="flex w-[280px] shrink-0 flex-col rounded-xl border border-white/6 bg-[#0E0F17] p-2.5 transition-colors"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverCol(col.id);
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="mb-2 flex items-center justify-between gap-1.5 px-1 py-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: config.color }}
                  />
                  <h3 className="truncate text-sm font-semibold text-[#F9FAFB]">{col.label}</h3>
                  <span className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-xs text-[#9CA3AF]">
                    {col.tasks.length}
                    {col.wip_limit !== null && (
                      <span className="text-[#6B7280]">/{col.wip_limit}</span>
                    )}
                  </span>
                </div>

                {isManagerOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setWipModalCol(col)}
                    title="Configurar límite WIP"
                    aria-label={`Configurar límite WIP para ${col.label}`}
                    className="rounded p-1 text-[#6B7280] transition-colors hover:bg-white/5 hover:text-[#F9FAFB]"
                  >
                    <Settings size={14} aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Soft WIP limit warning badge */}
              {isWipExceeded && (
                <div
                  data-testid={`wip-warning-${col.id}`}
                  className="mb-2 flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-300"
                >
                  <AlertTriangle size={13} className="shrink-0 text-amber-400" aria-hidden="true" />
                  <span className="truncate">
                    {KANBAN_MESSAGES.wipExceeded(col.tasks.length, col.wip_limit!)}
                  </span>
                </div>
              )}

              {/* Cards Drop Zone */}
              <div
                className={`flex min-h-[220px] flex-1 flex-col gap-2.5 rounded-lg p-1 transition-colors ${
                  isOver ? 'border border-dashed border-white/20 bg-white/5' : ''
                }`}
              >
                {col.tasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    canMove={canMoveTask(task)}
                    isDragging={dragTaskId === task.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onMoveTask={handleMoveTask}
                    onOpenBlockModal={setBlockModalTask}
                  />
                ))}

                {col.tasks.length === 0 && (
                  <div
                    className={`flex h-28 items-center justify-center rounded-lg border border-dashed transition-colors ${
                      isOver
                        ? 'border-white/30 bg-white/5 text-[#9CA3AF]'
                        : 'border-white/5 text-[#4B5563]'
                    }`}
                  >
                    <span className="text-xs">{isOver ? 'Soltar aquí' : 'Sin tareas'}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* WIP Limit Modal */}
      {wipModalCol && (
        <WipLimitModal
          key={wipModalCol.id}
          open={true}
          onClose={() => setWipModalCol(null)}
          columnId={wipModalCol.id}
          columnLabel={wipModalCol.label}
          currentWipLimit={wipModalCol.wip_limit}
          onSave={handleSaveWipLimit}
        />
      )}

      {/* Task Block / Impediment Modal */}
      {blockModalTask && (
        <TaskBlockModal
          key={blockModalTask.id}
          open={true}
          onClose={() => setBlockModalTask(null)}
          task={blockModalTask}
          allTasks={allCards}
          onSave={handleSaveBlockStatus}
        />
      )}
    </div>
  );
}
