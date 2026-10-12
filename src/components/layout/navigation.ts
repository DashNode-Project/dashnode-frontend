import { BookOpen, CalendarDays, CheckSquare, Clock, FolderOpen, User, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Role } from '@/features/auth/types';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  roles: readonly Role[];
}

/**
 * Entries of the main navigation whose features are NOT part of EP-01. They are rendered so the
 * product structure is visible, but pressing them only logs "Funcionalidad en desarrollo, no
 * disponible". The role start screen ("Inicio") is the only functional entry.
 */
export const OUT_OF_SCOPE_NAV: readonly NavItem[] = [
  { id: 'projects', label: 'Proyectos', icon: FolderOpen, roles: ['manager', 'developer'] },
  { id: 'my-tasks', label: 'Mis tareas', icon: CheckSquare, roles: ['manager', 'developer'] },
  { id: 'meetings', label: 'Reuniones', icon: Video, roles: ['manager', 'developer'] },
  { id: 'calendar', label: 'Calendario', icon: CalendarDays, roles: ['manager', 'developer'] },
  { id: 'availability', label: 'Disponibilidad', icon: Clock, roles: ['manager', 'developer'] },
  { id: 'profile', label: 'Perfil', icon: User, roles: ['admin', 'manager', 'developer'] },
  { id: 'manual', label: 'Manual de usuario', icon: BookOpen, roles: ['manager', 'developer'] },
];
