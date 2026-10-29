import { PATHS } from '@/app/paths';
import type { Role } from './types';

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  developer: 'Desarrollador',
};

const HOME_BY_ROLE: Record<Role, string> = {
  admin: PATHS.homeAdmin,
  manager: PATHS.homeManager,
  developer: PATHS.homeDeveloper,
};

/** Start screen of each role (HU_DN_01_03, criterion 5). */
export function homePathFor(role: Role): string {
  return HOME_BY_ROLE[role];
}
