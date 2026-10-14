import { BookOpen, CalendarDays, Clock, FolderOpen, Home, Menu, Users, Video } from 'lucide-react';
import { NavLink } from 'react-router';
import { PATHS } from '@/app/paths';
import { useAuth } from '@/features/auth/AuthContext';
import { homePathFor } from '@/features/auth/roles';
import { notifyUnderDevelopment } from '@/lib/underDevelopment';
import { OUT_OF_SCOPE_NAV } from './navigation';
import { useShellLayout } from './ShellLayoutContext';

const base =
  'flex h-10 shrink-0 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors active:scale-[0.98]';

export function SideNav() {
  const { user } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useShellLayout();
  if (!user) return null;
  const items = OUT_OF_SCOPE_NAV.filter((item) => item.roles.includes(user.role));
  const width = sidebarCollapsed ? 'md:w-[4.25rem]' : 'md:w-60';

  return (
    <nav
      aria-label="Principal"
      className={`sticky top-14 z-30 flex h-[calc(100vh-3.5rem)] shrink-0 flex-col gap-1 overflow-y-auto overflow-x-hidden border-r border-white/10 bg-[#0A0B0E] px-2 py-3 ${width}`}
    >
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
        className={`${base} mb-2 text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB] ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
      >
        <Menu size={20} aria-hidden="true" />
        {!sidebarCollapsed ? <span className="sr-only">Menú</span> : null}
      </button>

      <NavLink
        to={homePathFor(user.role)}
        title="Inicio"
        className={({ isActive }) =>
          `${base} ${sidebarCollapsed ? 'justify-center' : ''} ${
            isActive
              ? 'bg-blue-500/15 text-blue-300'
              : 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]'
          }`
        }
      >
        <Home size={20} aria-hidden="true" />
        {!sidebarCollapsed ? 'Inicio' : null}
      </NavLink>

      {(user.role === 'manager' || user.role === 'developer') && (
        <NavLink
          to={PATHS.projects}
          title="Proyectos"
          className={({ isActive }) =>
            `${base} ${sidebarCollapsed ? 'justify-center' : ''} ${
              isActive
                ? 'bg-blue-500/15 text-blue-300'
                : 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]'
            }`
          }
        >
          <FolderOpen size={20} aria-hidden="true" />
          {!sidebarCollapsed ? 'Proyectos' : null}
        </NavLink>
      )}

      {(user.role === 'admin' || user.role === 'manager') && (
        <NavLink
          to={PATHS.users}
          title="Usuarios"
          className={({ isActive }) =>
            `${base} ${sidebarCollapsed ? 'justify-center' : ''} ${
              isActive
                ? 'bg-blue-500/15 text-blue-300'
                : 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]'
            }`
          }
        >
          <Users size={20} aria-hidden="true" />
          {!sidebarCollapsed ? 'Usuarios' : null}
        </NavLink>
      )}

      {user.role !== 'admin' ? (
        <>
          <NavLink
            to={PATHS.availability}
            title="Disponibilidad"
            className={({ isActive }) =>
              `${base} ${sidebarCollapsed ? 'justify-center' : ''} ${
                isActive
                  ? 'bg-blue-500/15 text-blue-300'
                  : 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]'
              }`
            }
          >
            <Clock size={20} aria-hidden="true" />
            {!sidebarCollapsed ? 'Disponibilidad' : null}
          </NavLink>

          <NavLink
            to={PATHS.meetings}
            title="Reuniones"
            className={({ isActive }) =>
              `${base} ${sidebarCollapsed ? 'justify-center' : ''} ${
                isActive
                  ? 'bg-blue-500/15 text-blue-300'
                  : 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]'
              }`
            }
          >
            <Video size={20} aria-hidden="true" />
            {!sidebarCollapsed ? 'Reuniones' : null}
          </NavLink>

          <NavLink
            to={PATHS.calendar}
            title="Calendario"
            className={({ isActive }) =>
              `${base} ${sidebarCollapsed ? 'justify-center' : ''} ${
                isActive
                  ? 'bg-blue-500/15 text-blue-300'
                  : 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]'
              }`
            }
          >
            <CalendarDays size={20} aria-hidden="true" />
            {!sidebarCollapsed ? 'Calendario' : null}
          </NavLink>
        </>
      ) : null}

      <NavLink
        to={PATHS.userManual}
        title="Manual de usuario"
        className={({ isActive }) =>
          `${base} ${sidebarCollapsed ? 'justify-center' : ''} ${
            isActive
              ? 'bg-blue-500/15 text-blue-300'
              : 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]'
          }`
        }
      >
        <BookOpen size={20} aria-hidden="true" />
        {!sidebarCollapsed ? 'Manual' : null}
      </NavLink>

      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          title={label}
          onClick={() => notifyUnderDevelopment(`nav:${id}`)}
          className={`${base} ${sidebarCollapsed ? 'justify-center' : ''} text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]`}
        >
          <Icon size={20} aria-hidden="true" />
          {!sidebarCollapsed ? label : null}
        </button>
      ))}
    </nav>
  );
}
