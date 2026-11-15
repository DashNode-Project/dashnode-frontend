import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ProjectModal } from '@/features/projects/ProjectModal';
import type { KanbanCard } from '../types';

interface TaskBlockModalProps {
  open: boolean;
  onClose: () => void;
  task: KanbanCard | null;
  allTasks: KanbanCard[];
  onSave: (
    taskId: string,
    payload: {
      is_blocked: boolean;
      blocked_reason?: string | null;
      blocked_by_task_id?: string | null;
    },
  ) => Promise<void>;
}

export function TaskBlockModal({ open, onClose, task, allTasks, onSave }: TaskBlockModalProps) {
  const [isBlocked, setIsBlocked] = useState(task?.is_blocked ?? false);
  const [blockedReason, setBlockedReason] = useState(task?.blocked_reason || '');
  const [blockedByTaskId, setBlockedByTaskId] = useState<string>(task?.blocked_by_task_id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open || !task) return null;

  // Other tasks that can be selected as predecessors (excluding self)
  const candidatePredecessors = allTasks.filter((t) => t.id !== task.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onSave(task.id, {
        is_blocked: isBlocked,
        blocked_reason: isBlocked ? blockedReason.trim() || null : null,
        blocked_by_task_id: blockedByTaskId ? blockedByTaskId : null,
      });
      onClose();
    } catch {
      // Handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProjectModal
      title="Gestión de Bloqueos e Impedimentos"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-white/6 bg-[#1E1F2B] p-3 text-sm">
          <p className="text-xs text-[#6B7280]">Tarea seleccionada</p>
          <p className="font-medium text-[#F9FAFB]">{task.name}</p>
          {task.story_title && (
            <p className="mt-0.5 text-xs text-[#9CA3AF]">HU: {task.story_title}</p>
          )}
        </div>

        {/* Impediment toggle */}
        <div className="rounded-lg border border-white/10 bg-[#12131C] p-3">
          <div className="flex items-start gap-3">
            <input
              id="is-blocked-checkbox"
              type="checkbox"
              checked={isBlocked}
              onChange={(e) => setIsBlocked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#1E1F2B] text-red-500 focus:ring-red-500"
            />
            <label htmlFor="is-blocked-checkbox" className="cursor-pointer">
              <span className="text-sm font-medium text-[#F9FAFB]">
                Reportar como impedimento / bloqueada
              </span>
              <p className="text-xs text-[#9CA3AF]">
                Muestra un distintivo de advertencia roja visible para todo el equipo.
              </p>
            </label>
          </div>

          {isBlocked && (
            <div className="mt-3 space-y-1.5">
              <label htmlFor="blocked-reason" className="text-xs font-medium text-[#D1D5DB]">
                Motivo del impedimento
              </label>
              <textarea
                id="blocked-reason"
                rows={2}
                value={blockedReason}
                onChange={(e) => setBlockedReason(e.target.value)}
                placeholder="Describe el motivo del bloqueo (ej. Esperando API externa, falta credenciales...)"
                className="w-full rounded-md border border-white/10 bg-[#1E1F2B] p-2.5 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-red-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Predecessor dependency */}
        <div className="space-y-1.5">
          <label htmlFor="predecessor-select" className="text-sm font-medium text-[#F9FAFB]">
            Dependencia de tarea predecesora
          </label>
          <p className="text-xs text-[#9CA3AF]">
            Si la tarea predecesora no ha sido completada, esta tarea se considerará bloqueada.
          </p>
          <select
            id="predecessor-select"
            value={blockedByTaskId}
            onChange={(e) => setBlockedByTaskId(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-[#1E1F2B] p-2.5 text-sm text-[#F9FAFB] focus:border-blue-500 focus:outline-none"
          >
            <option value="">Sin dependencia predecesora</option>
            {candidatePredecessors.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} [{t.status}]
              </option>
            ))}
          </select>
        </div>
      </form>
    </ProjectModal>
  );
}
