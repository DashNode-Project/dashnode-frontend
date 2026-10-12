import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  deactivateUserByAdmin,
  fetchPendingAssignments,
  fetchProfile,
  listAdminUsers,
  reactivateUserByAdmin,
  updateProfile,
} from './api';

describe('auth api — user lifecycle', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls deactivate and pending endpoints', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes('pending-assignments')) {
          return new Response(JSON.stringify({ pending_count: 2 }), { status: 200 });
        }
        if (url.includes('/auth/admin/users') && (!init?.method || init.method === 'GET')) {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        if (url.endsWith('/deactivate')) {
          return new Response(JSON.stringify({ message: 'Usuario desactivado correctamente.' }), {
            status: 200,
          });
        }
        if (url.endsWith('/profile') && init?.method === 'PATCH') {
          return new Response(
            JSON.stringify({
              message: 'Perfil actualizado correctamente.',
              profile: {
                id: '1',
                email: 'a@b.com',
                name: 'Nuevo',
                role: 'admin',
                avatar_url: null,
              },
            }),
            { status: 200 },
          );
        }
        if (url.endsWith('/profile')) {
          return new Response(
            JSON.stringify({
              profile: {
                id: '1',
                email: 'a@b.com',
                name: 'A',
                role: 'admin',
                avatar_url: null,
              },
            }),
            { status: 200 },
          );
        }
        if (url.endsWith('/reactivate')) {
          return new Response(JSON.stringify({ message: 'Usuario reactivado correctamente.' }), {
            status: 200,
          });
        }
        return new Response(null, { status: 404 });
      }),
    );

    await expect(listAdminUsers()).resolves.toEqual([]);
    await expect(deactivateUserByAdmin('u1')).resolves.toMatchObject({
      message: 'Usuario desactivado correctamente.',
    });
    await expect(fetchPendingAssignments('u1')).resolves.toEqual({ pending_count: 2 });
    await expect(reactivateUserByAdmin('u1')).resolves.toMatchObject({
      message: 'Usuario reactivado correctamente.',
    });
    await expect(fetchProfile()).resolves.toMatchObject({ profile: { email: 'a@b.com' } });
    await expect(updateProfile({ name: 'Nuevo', avatar: null })).resolves.toMatchObject({
      profile: { email: 'a@b.com' },
    });
  });
});
