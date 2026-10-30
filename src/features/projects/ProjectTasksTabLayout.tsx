import { NavLink, Outlet, useParams } from 'react-router';
import { PATHS } from '@/app/paths';

const linkBase =
  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500';

export default function ProjectTasksTabLayout() {
  const { projectId = '' } = useParams();
  const prefix = `${PATHS.projects}/${projectId}/tareas`;

  return (
    <div className="space-y-4">
      <div
        className="inline-flex rounded-lg border border-white/10 bg-[#12131C] p-1"
        role="tablist"
        aria-label="Vista de tareas"
      >
        <NavLink
          to={`${prefix}/lista`}
          role="tab"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'bg-blue-600 text-white' : 'text-[#9CA3AF] hover:text-[#F9FAFB]'}`
          }
        >
          Lista
        </NavLink>
        <NavLink
          to={`${prefix}/kanban`}
          role="tab"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'bg-blue-600 text-white' : 'text-[#9CA3AF] hover:text-[#F9FAFB]'}`
          }
        >
          Kanban
        </NavLink>
      </div>
      <Outlet />
    </div>
  );
}
