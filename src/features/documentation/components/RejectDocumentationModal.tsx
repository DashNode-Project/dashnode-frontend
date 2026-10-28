import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ProjectModal } from '@/features/projects/ProjectModal';

interface RejectDocumentationModalProps {
  isOpen: boolean;
  entryTitle: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  loading: boolean;
}

export function RejectDocumentationModal({
  isOpen,
  entryTitle,
  onClose,
  onConfirm,
  loading,
}: RejectDocumentationModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm(reason.trim());
  };

  return (
    <ProjectModal
      title="Rechazar entrada de documentación"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={loading}
            disabled={loading}
            onClick={() => void handleConfirm()}
            data-testid="confirm-reject-btn"
          >
            Confirmar rechazo
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[#F9FAFB]">
          Indique las observaciones o motivos por los cuales se rechaza esta entrada. El autor podrá
          consultar la retroalimentación, corregirla y reenviarla a aprobación.
        </p>

        {entryTitle ? (
          <p className="rounded-lg border border-white/6 bg-[#0A0B0E] p-2.5 text-xs text-[#9CA3AF]">
            {entryTitle}
          </p>
        ) : null}

        <label className="flex flex-col gap-1 text-xs text-[#9CA3AF]">
          <span className="font-medium text-[#F9FAFB]">Motivo de rechazo (opcional)</span>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej. Faltan ejemplos prácticos de uso o clarificar el paso 3..."
            aria-label="Motivo de rechazo"
            className="rounded-lg border border-white/10 bg-[#0A0B0E] p-3 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/30"
          />
        </label>
      </div>
    </ProjectModal>
  );
}
