import { Button } from '@/components/ui/Button';
import { ProjectModal } from '@/features/projects/ProjectModal';
import { NOTIFICATION_MESSAGES } from './messages';

interface DeleteAllNotificationsModalProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteAllNotificationsModal({
  open,
  loading,
  onClose,
  onConfirm,
}: DeleteAllNotificationsModalProps) {
  if (!open) return null;

  return (
    <ProjectModal
      title={NOTIFICATION_MESSAGES.deleteConfirmTitle}
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
            onClick={onConfirm}
          >
            Confirmar
          </Button>
        </>
      }
    >
      <p className="text-sm text-[#F9FAFB]">{NOTIFICATION_MESSAGES.deleteConfirm}</p>
    </ProjectModal>
  );
}
