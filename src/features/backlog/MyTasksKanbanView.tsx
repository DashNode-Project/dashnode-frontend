import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/demo-ui';
import { KANBAN_COLUMNS_CONFIG, type KanbanColumnId } from '@/features/kanban/types';
import type { MyTaskItem } from './api';

const COLUMN_ORDER = KANBAN_COLUMNS_CONFIG.map((col) => col.id).filter(
  (id) => id !== 'CORRECTION',
) as KanbanColumnId[];

type Props = {
  tasks: MyTaskItem[];
  busyId: string | null;
  onStatusChange: (task: MyTaskItem, next: string) => void;
};

export function MyTasksKanbanView({ tasks, busyId, onStatusChange }: Props) {
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<KanbanColumnId | null>(null);

  const byStatus = useMemo(() => {
    const map = new Map<KanbanColumnId, MyTaskItem[]>();
    for (const status of COLUMN_ORDER) {
      map.set(status, []);
    }
    for (const task of tasks) {
      const key = (COLUMN_ORDER.includes(task.status as KanbanColumnId)
        ? task.status
        : 'TODO') as KanbanColumnId;
      const bucket = map.get(key) ?? [];
      bucket.push(task);
      map.set(key, bucket);
    }
    return map;
  }, [tasks]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDragTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragEnd = () => {
    setDragTaskId(null);
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetCol: KanbanColumnId) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = dragTaskId || e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== targetCol) {
      onStatusChange(task, targetCol);
    }
    setDragTaskId(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {COLUMN_ORDER.map((status) => {
        const config =
          KANBAN_COLUMNS_CONFIG.find((col) => col.id === status) ??
          KANBAN_COLUMNS_CONFIG[0]!;
        const label = config.label;
        const columnTasks = byStatus.get(status) ?? [];
        const isOver = dragOverCol === status;

        return (
          <div
            key={status}
            className="flex w-64 shrink-0 flex-col rounded-xl border border-white/10 bg-[#12131C]"
            data-testid={`my-tasks-column-${status}`}
            style={{
              borderTopWidth: 3,
              borderTopColor: config.color,
              boxShadow: isOver ? `0 0 0 1px ${config.color}66` : undefined,
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCol(status);
            }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => handleDrop(e, status)}
          >
            <header
              className="border-b border-white/10 px-3 py-2 text-sm font-medium"
              style={{ background: `${config.color}14`, color: config.color }}
            >
              {label}
              <span className="ml-2 text-xs opacity-80">{columnTasks.length}</span>
            </header>
            <ul className="flex min-h-[8rem] flex-col gap-2 p-2">
              {columnTasks.map((task) => (
                <li key={task.id}>
                  <Card
                    draggable={busyId !== task.id && task.status !== 'CORRECTION'}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    className={`space-y-2 p-3 transition-opacity ${
                      dragTaskId === task.id ? 'opacity-50 ring-2 ring-blue-500/40' : ''
                    } ${busyId !== task.id && task.status !== 'CORRECTION' ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  >
                    <p className="text-sm font-medium text-[#F9FAFB]">{task.name}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      {task.user_story.title} · {task.project.name}
                    </p>
                  </Card>
                </li>
              ))}
              {columnTasks.length === 0 ? (
                <li
                  className={`px-2 py-4 text-center text-xs ${
                    isOver ? 'text-[#9CA3AF]' : 'text-[#6B7280]'
                  }`}
                >
                  {isOver ? 'Soltar aquí' : 'Sin tareas'}
                </li>
              ) : null}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
