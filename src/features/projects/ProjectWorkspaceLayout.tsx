import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router';
import { useAuth } from '@/features/auth/AuthContext';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { useToast } from '@/lib/toast/ToastProvider';
import { PATHS, projectTabPath } from '@/app/paths';
import { Avatar } from '@/components/ui/demo-ui';
import { getProject, listProjectMembers, type ProjectSummary } from './api';
import { ProjectWorkspaceProvider } from './ProjectWorkspaceContext';
import { visibleProjectTabs } from './projectWorkspaceTabs';

export default function ProjectWorkspaceLayout() {
  const { projectId = '' } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      setProject(await getProject(projectId));
    } catch (error) {
      showToast(
        error instanceof ApiError && !isTechnicalFailure(error)
          ? error.message
          : MESSAGES.loadFailure,
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, showToast]);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [data, members] = await Promise.all([
          getProject(projectId),
          listProjectMembers(projectId),
        ]);
        if (!cancelled) {
          setProject(data);
          setTeamNames(members.filter((m) => m.role !== 'admin').map((m) => m.name));
        }
      } catch (error) {
        if (cancelled) return;
        showToast(
          error instanceof ApiError && !isTechnicalFailure(error)
            ? error.message
            : MESSAGES.loadFailure,
          'error',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, showToast]);

  if (loading || !project || !user) {
    return (
      <p className="text-sm text-[#9CA3AF]" role="status">
        Cargando proyecto…
      </p>
    );
  }

  const canManage =
    user.role === 'admin' || (user.role === 'manager' && project.manager_id === user.id);
  const isAdmin = user.role === 'admin';
  const tabs = visibleProjectTabs(user.role);

  return (
    <ProjectWorkspaceProvider value={{ project, reload: load, canManage, isAdmin }}>
      <div>
        <Link
          to={PATHS.projects}
          className="mb-4 inline-block text-sm text-blue-400 hover:underline"
        >
          ← Proyectos
        </Link>
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-[#F9FAFB]">{project.name}</h1>
          {teamNames.length ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#6B7280]">Equipo:</span>
              <div className="flex -space-x-1">
                {teamNames.map((name) => (
                  <Avatar key={name} name={name} size={28} />
                ))}
              </div>
            </div>
          ) : project.manager_name ? (
            <p className="mt-1 text-sm text-[#9CA3AF]">Gerente: {project.manager_name}</p>
          ) : null}
        </div>
        <nav
          className="mb-6 flex gap-1 overflow-x-auto border-b border-white/10 pb-px"
          aria-label="Módulos del proyecto"
        >
          {tabs.map((tab) => (
            <NavLink
              key={tab.segment}
              to={projectTabPath(projectId, tab.segment)}
              className={({ isActive }) => {
                const tabActive =
                  tab.segment === 'backlog'
                    ? location.pathname.includes(`${PATHS.projects}/${projectId}/backlog`)
                    : isActive;
                return [
                  'whitespace-nowrap rounded-t-md px-3 py-2 text-sm font-medium transition-colors',
                  tabActive
                    ? 'border-b-2 border-blue-500 text-[#F9FAFB]'
                    : 'text-[#9CA3AF] hover:text-[#F9FAFB]',
                ].join(' ');
              }}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </ProjectWorkspaceProvider>
  );
}
