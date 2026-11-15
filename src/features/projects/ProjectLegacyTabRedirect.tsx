import { Navigate, useParams } from 'react-router';
import { projectTabPath } from '@/app/paths';

type Target = 'tareas/lista' | 'tareas/kanban';

export function ProjectLegacyTabRedirect({ target }: { target: Target }) {
  const { projectId = '' } = useParams();
  if (!projectId) return null;
  return <Navigate to={projectTabPath(projectId, target)} replace />;
}
