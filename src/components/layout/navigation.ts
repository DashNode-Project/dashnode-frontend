import type { LucideIcon } from 'lucide-react';
import type { Role } from '@/features/auth/types';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  roles: readonly Role[];
}

/** Stubs for modules not yet in MVP. Mis tareas, calendario y manual ya tienen ruta real. */
export const OUT_OF_SCOPE_NAV: readonly NavItem[] = [];
