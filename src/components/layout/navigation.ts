import { CheckSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Role } from '@/features/auth/types';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  roles: readonly Role[];
}

/** Stubs for modules not yet in MVP (Mis tareas). Calendario y Manual ya tienen ruta. */
export const OUT_OF_SCOPE_NAV: readonly NavItem[] = [
  { id: 'my-tasks', label: 'Mis tareas', icon: CheckSquare, roles: ['manager', 'developer'] },
];
