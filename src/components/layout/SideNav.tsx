import { Clock, FolderOpen, Home, User, Users, Video } from 'lucide-react';
import { NavLink } from 'react-router';
import { PATHS } from '@/app/paths';
import { useAuth } from '@/features/auth/AuthContext';
import { homePathFor } from '@/features/auth/roles';
import { notifyUnderDevelopment } from '@/lib/underDevelopment';
import { OUT_OF_SCOPE_NAV } from './navigation';

const base =
  'flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors';

/** Main navigation: the role start screen plus the (not yet available) product areas. */
export function SideNav() {
  const { user } = useAuth();
  if (!user) return null;
  const items = OUT_OF_SCOPE_NAV.filter((item) => item.roles.includes(user.role));

  return (
    <nav
      aria-label="Principal"
      className="flex gap-1 overflow-x-auto border-b border-white/10 px-3 py-2 md:w-56 md:shrink-0 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:px-2 md:py-4"
    >
      <NavLink
        to={homePathFor(user.role)}
        className={({ isActive }) =>
          `${base} ${isActive ? 'bg-blue-500/15 text-blue-300' : 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]'}`
        }
      >
        <Home size={16} aria-hidden="true" />
        Inicio
      </NavLink>
      {user.role === 'admin' || user.role === 'manager' || user.role === 'developer' ? (
        <NavLink
          to={PATHS.projects}
          className={({ isActive }) =>
            `${base} ${isActive ? 'bg-blue-500/15 text-blue-300' : 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]'}`
          }
        >
          <FolderOpen size={16} aria-hidden="true" />
          Proyectos
        </NavLink>
      ) : null}
      {user.role === 'admin' || user.role === 'manager' ? (
        <NavLink
          to={PATHS.users}
          className={({ isActive }) =>
            `${base} ${isActive ? 'bg-blue-500/15 text-blue-300' : 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]'}`
          }
        >
          <Users size={16} aria-hidden="true" />
          Usuarios
        </NavLink>
      ) : null}
      <NavLink
        to={PATHS.profile}
        className={({ isActive }) =>
          `${base} ${isActive ? 'bg-blue-500/15 text-blue-300' : 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]'}`
        }
      >
        <User size={16} aria-hidden="true" />
        Perfil
      </NavLink>
      <NavLink
        to={PATHS.availability}
        className={({ isActive }) =>
          `${base} ${isActive ? 'bg-blue-500/15 text-blue-300' : 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]'}`
        }
      >
        <Clock size={16} aria-hidden="true" />
        Disponibilidad
      </NavLink>
      <NavLink
        to={PATHS.meetings}
        className={({ isActive }) =>
          `${base} ${isActive ? 'bg-blue-500/15 text-blue-300' : 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]'}`
        }
      >
        <Video size={16} aria-hidden="true" />
        Reuniones
      </NavLink>
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => notifyUnderDevelopment(`nav:${id}`)}
          className={`${base} text-[#9CA3AF] hover:bg-white/5 hover:text-[#F9FAFB]`}
        >
          <Icon size={16} aria-hidden="true" />
          {label}
        </button>
      ))}
    </nav>
  );
}
