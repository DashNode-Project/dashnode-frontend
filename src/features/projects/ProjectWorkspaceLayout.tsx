import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router';
import { useAuth } from '@/features/auth/AuthContext';
import { ApiError, isTechnicalFailure } from '@/lib/api/errors';
import { MESSAGES } from '@/lib/messages';
import { useToast } from '@/lib/toast/ToastProvider';
import { PATHS, projectTabPath } from '@/app/paths';
import { getProject, type ProjectSummary } from './api';
import { ProjectWorkspaceProvider } from './ProjectWorkspaceContext';
import { visibleProjectTabs } from './projectWorkspaceTabs';

export default function ProjectWorkspaceLayout() {
  const { projectId = '' } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [project, setProject] = useState<ProjectSummary | null>(null);
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
        const data = await getProject(projectId);
        if (!cancelled) setProject(data);
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
          {project.manager_name ? (
            <p className="mt-1 text-sm text-[#9CA3AF]">
              Gerente responsable: {project.manager_name}
            </p>
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
              className={({ isActive }) =>
                [
                  'whitespace-nowrap rounded-t-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-b-2 border-blue-500 text-[#F9FAFB]'
                    : 'text-[#9CA3AF] hover:text-[#F9FAFB]',
                ].join(' ')
              }
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
