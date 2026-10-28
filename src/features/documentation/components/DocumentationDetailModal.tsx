import { ExternalLink, Pin, User, Calendar, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProjectModal } from '@/features/projects/ProjectModal';
import { Badge } from '@/components/ui/demo-ui';
import type { DocumentationEntry } from '../types';

interface DocumentationDetailModalProps {
  isOpen: boolean;
  entry: DocumentationEntry | null;
  onClose: () => void;
  onEdit?: (entry: DocumentationEntry) => void;
  onDelete?: (entry: DocumentationEntry) => void;
}

export function DocumentationDetailModal({
  isOpen,
  entry,
  onClose,
  onEdit,
  onDelete,
}: DocumentationDetailModalProps) {
  if (!isOpen || !entry) return null;

  const formattedDate = new Date(entry.created_at).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const statusTone =
    entry.approval_status === 'APPROVED'
      ? 'green'
      : entry.approval_status === 'REJECTED'
        ? 'red'
        : 'yellow';

  const statusLabel =
    entry.approval_status === 'APPROVED'
      ? 'Aprobada'
      : entry.approval_status === 'REJECTED'
        ? 'Rechazada'
        : 'Pendiente';

  return (
    <ProjectModal
      title="Detalle de documentación"
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex gap-2">
            {entry.can_edit && onEdit ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(entry);
                }}
              >
                <Edit2 size={13} className="mr-1" />
                Editar
              </Button>
            ) : null}
            {entry.can_delete && onDelete ? (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => {
                  onClose();
                  onDelete(entry);
                }}
              >
                <Trash2 size={13} className="mr-1" />
                Eliminar
              </Button>
            ) : null}
          </div>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 text-sm text-[#F9FAFB]">
        <div className="flex flex-wrap items-center gap-2">
          {entry.is_pinned ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/25 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
              <Pin size={12} className="text-amber-400" />
              Anclado
            </span>
          ) : null}
          <Badge tone="blue">{entry.category}</Badge>
          <Badge tone={statusTone}>{statusLabel}</Badge>
        </div>

        <h2 className="text-xl font-semibold text-[#F9FAFB]">{entry.title}</h2>

        <div className="flex flex-wrap items-center gap-4 text-xs text-[#9CA3AF]">
          <span className="flex items-center gap-1">
            <User size={13} />
            {entry.author_name || 'Desconocido'}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={13} />
            {formattedDate}
          </span>
        </div>

        {entry.approval_status === 'REJECTED' && entry.rejection_reason ? (
          <div className="flex flex-col gap-1 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-300">
            <span className="font-semibold text-red-200">Motivo de rechazo:</span>
            <p className="whitespace-pre-wrap text-red-300/90">{entry.rejection_reason}</p>
          </div>
        ) : null}

        {entry.objective ? (
          <div className="rounded-lg border border-white/6 bg-[#0A0B0E] p-3 text-xs">
            <span className="font-semibold text-[#9CA3AF]">Objetivo: </span>
            <span className="text-[#F9FAFB]">{entry.objective}</span>
          </div>
        ) : null}

        {entry.tags ? (
          <div className="flex flex-wrap gap-1.5">
            {entry.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
              .map((tag) => (
                <span key={tag} className="rounded bg-white/5 px-2 py-0.5 text-xs text-[#9CA3AF]">
                  #{tag}
                </span>
              ))}
          </div>
        ) : null}

        {entry.content ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#9CA3AF]">Contenido:</span>
            <div className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-lg border border-white/6 bg-[#0A0B0E] p-3 text-xs leading-relaxed text-[#F9FAFB]">
              {entry.content}
            </div>
          </div>
        ) : null}

        {entry.external_url ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#9CA3AF]">Recurso externo:</span>
            <a
              href={entry.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 underline hover:text-blue-300"
            >
              <ExternalLink size={13} />
              {entry.external_url}
            </a>
          </div>
        ) : null}
      </div>
    </ProjectModal>
  );
}
