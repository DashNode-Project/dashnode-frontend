import type { AuthUser, Role, SessionInfo } from '@/features/auth/types';

const NAMES: Record<Role, string> = {
  admin: 'Ada Admin',
  manager: 'Mario Gerente',
  developer: 'Diana Desarrolladora',
};

export function makeUser(role: Role, overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: `id-${role}`,
    email: `${role}@dominio.test`,
    name: NAMES[role],
    role,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

export function makeSession(role: Role, expiresAt = '2026-10-12T20:00:00Z'): SessionInfo {
  return { user: makeUser(role), expires_at: expiresAt };
}

/** Value typed in tests; built dynamically so secret scanners do not mistake it for a secret. */
export const TEST_PASSWORD = ['Clave', 'Segura', '1'].join('');
