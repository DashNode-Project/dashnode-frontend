import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/Button';
import { ProjectModal } from '@/features/projects/ProjectModal';
import { projectStoryReaderPath } from '@/app/paths';
import { UserStoryContent } from './UserStoryContent';
import type { BacklogTreeDTO, UserStoryDTO } from './types';

export function UserStoryPreviewModal({
  projectId,
  story,
  stories,
  tree,
  memberMap,
  onClose,
  onNavigate,
  onEdit,
  canManage,
}: {
  projectId: string;
  story: UserStoryDTO;
  stories: UserStoryDTO[];
  tree: BacklogTreeDTO | null;
  memberMap: Map<string, string>;
  onClose: () => void;
  onNavigate: (story: UserStoryDTO) => void;
  onEdit: () => void;
  canManage: boolean;
}) {
  const index = stories.findIndex((s) => s.id === story.id);
  const prev = index > 0 ? stories[index - 1] : null;
  const next = index >= 0 && index < stories.length - 1 ? stories[index + 1] : null;

  return (
    <ProjectModal
      title="Vista previa de historia"
      onClose={onClose}
      footer={
        <>
          <div className="mr-auto flex gap-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!prev}
              aria-label="Historia anterior"
              onClick={() => prev && onNavigate(prev)}
            >
              <ChevronLeft size={16} aria-hidden />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!next}
              aria-label="Historia siguiente"
              onClick={() => next && onNavigate(next)}
            >
              <ChevronRight size={16} aria-hidden />
            </Button>
          </div>
          <Link
            to={projectStoryReaderPath(projectId, story.id)}
            className="inline-flex items-center gap-1 text-sm text-blue-400 hover:underline"
          >
            <ExternalLink size={14} aria-hidden />
            Ver detalle completo
          </Link>
          {canManage ? (
            <Button type="button" variant="secondary" onClick={onEdit}>
              Editar
            </Button>
          ) : null}
          <Button type="button" onClick={onClose}>
            Cerrar
          </Button>
        </>
      }
    >
      <UserStoryContent story={story} tree={tree} memberMap={memberMap} />
    </ProjectModal>
  );
}
