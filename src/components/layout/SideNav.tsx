import { Home } from 'lucide-react';
import { NavLink } from 'react-router';
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
