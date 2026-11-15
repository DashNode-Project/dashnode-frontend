import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ProjectModal } from '@/features/projects/ProjectModal';
import type { KanbanColumnId } from '../types';

interface WipLimitModalProps {
  open: boolean;
  onClose: () => void;
  columnId: KanbanColumnId | null;
  columnLabel: string;
  currentWipLimit: number | null;
  onSave: (columnId: KanbanColumnId, wipLimit: number | null) => Promise<void>;
}

export function WipLimitModal({
  open,
  onClose,
  columnId,
  columnLabel,
  currentWipLimit,
  onSave,
}: WipLimitModalProps) {
  const [noLimit, setNoLimit] = useState<boolean>(currentWipLimit === null);
  const [limitValue, setLimitValue] = useState<string>(
    currentWipLimit !== null ? String(currentWipLimit) : '3',
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open || !columnId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let parsedLimit: number | null = null;
    if (!noLimit) {
      const num = parseInt(limitValue, 10);
      if (isNaN(num) || num < 1) {
        setError('El límite WIP debe ser un número entero mayor a 0.');
        return;
      }
      parsedLimit = num;
    }

    try {
      setIsSubmitting(true);
      await onSave(columnId, parsedLimit);
      onClose();
    } catch {
      // Error is handled in the parent with toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProjectModal
      title={`Configurar límite WIP: ${columnLabel}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : 'Guardar límite'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-[#9CA3AF]">
          Define la cantidad máxima recomendada de tareas concurrentes en la columna{' '}
          <strong className="text-[#F9FAFB]">{columnLabel}</strong>.
        </p>

        <div className="flex items-center gap-2">
          <input
            id="no-wip-limit"
            type="checkbox"
            checked={noLimit}
            onChange={(e) => setNoLimit(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-[#1E1F2B] text-blue-500 focus:ring-blue-500"
          />
          <label htmlFor="no-wip-limit" className="text-sm font-medium text-[#F9FAFB]">
            Sin límite (ilimitado)
          </label>
        </div>

        {!noLimit && (
          <div className="space-y-1.5">
            <label htmlFor="wip-limit-input" className="text-sm font-medium text-[#F9FAFB]">
              Límite de trabajo en progreso (WIP)
            </label>
            <input
              id="wip-limit-input"
              type="number"
              min="1"
              step="1"
              value={limitValue}
              onChange={(e) => setLimitValue(e.target.value)}
              placeholder="Ej. 3"
              className="w-full rounded-md border border-white/10 bg-[#1E1F2B] p-2.5 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-blue-500 focus:outline-none"
            />
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </ProjectModal>
  );
}
