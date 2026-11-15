import { Button } from '@/components/ui/Button';
import { ProjectModal } from '@/features/projects/ProjectModal';
import { DOCUMENTATION_MESSAGES } from '../messages';

interface DeleteDocumentationModalProps {
  isOpen: boolean;
  entryTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

export function DeleteDocumentationModal({
  isOpen,
  entryTitle,
  onClose,
  onConfirm,
  loading,
}: DeleteDocumentationModalProps) {
  if (!isOpen) return null;

  return (
    <ProjectModal
      title="Eliminar entrada de documentación"
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
            onClick={() => void onConfirm()}
          >
            Confirmar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm text-[#F9FAFB]">{DOCUMENTATION_MESSAGES.DELETE_CONFIRMATION}</p>
        {entryTitle ? (
          <p className="rounded-lg border border-white/6 bg-[#0A0B0E] p-2.5 text-xs text-[#9CA3AF]">
            {entryTitle}
          </p>
        ) : null}
      </div>
    </ProjectModal>
  );
}
