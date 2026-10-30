import { useEffect, useState } from 'react';
import { listProjectMembers, type ProjectMemberRow } from './api';
import { useProjectWorkspace } from './ProjectWorkspaceContext';
import { Avatar, Card } from '@/components/ui/demo-ui';
export default function ProjectTeamTab() {
  const { project } = useProjectWorkspace();
  const [members, setMembers] = useState<ProjectMemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await listProjectMembers(project.id);
        if (!cancelled) setMembers(rows);
      } catch {
        if (!cancelled) setMembers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-[#F9FAFB]">Equipo</h2>
      {loading ? (
        <p className="text-sm text-[#9CA3AF]">Cargando miembros…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {project.manager_name ? (
            <Card className="flex items-center gap-3 p-4 ring-1 ring-blue-500/20">
              <Avatar name={project.manager_name} size={40} />
              <div>
                <p className="font-medium text-[#F9FAFB]">{project.manager_name}</p>
                <p className="text-xs text-blue-300">Gerente del proyecto</p>
              </div>
            </Card>
          ) : null}
          {members.map((m) => (
            <Card key={m.user_id} className="flex items-center gap-3 p-4">
              <Avatar name={m.name} size={40} />
              <div className="min-w-0">
                <p className="truncate font-medium text-[#F9FAFB]">{m.name}</p>
                <p className="truncate text-xs text-[#9CA3AF]">{m.email}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
