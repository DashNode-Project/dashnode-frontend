import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from '@/lib/api/client';
import {
  adminRequestPasswordReset,
  confirmPasswordReset,
  createUserByAdmin,
  deactivateUserByAdmin,
  fetchPendingAssignments,
  fetchProfile,
  inviteDeveloper,
  listAdminUsers,
  loginRequest,
  logoutRequest,
  reactivateUserByAdmin,
  registerManager,
  requestPasswordReset,
  sessionRequest,
  updateProfile,
  updateUserByAdmin,
} from './api';

vi.mock('@/lib/api/client', () => ({
  apiRequest: vi.fn(),
  apiFormRequest: vi.fn(),
}));

describe('auth api', () => {
  beforeEach(() => {
    vi.mocked(client.apiRequest).mockResolvedValue({ ok: true });
    vi.mocked(client.apiFormRequest).mockResolvedValue({ profile: { id: '1' } });
  });

  it('calls auth endpoints with expected paths', async () => {
    await registerManager({ name: 'A', email: 'a@t.com', password: 'x', confirm_password: 'x' });
    expect(client.apiRequest).toHaveBeenCalledWith('/auth/register', expect.any(Object));

    await loginRequest({ email: 'a@t.com', password: 'x' });
    expect(client.apiRequest).toHaveBeenCalledWith('/auth/login', expect.any(Object));

    await logoutRequest();
    expect(client.apiRequest).toHaveBeenCalledWith('/auth/logout', { method: 'POST' });

    await sessionRequest();
    expect(client.apiRequest).toHaveBeenCalledWith('/auth/session');

    await requestPasswordReset('a@t.com');
    expect(client.apiRequest).toHaveBeenCalledWith(
      '/auth/password-reset/request',
      expect.any(Object),
    );

    await confirmPasswordReset({ token: 't', password: 'a', confirm_password: 'a' });
    expect(client.apiRequest).toHaveBeenCalledWith(
      '/auth/password-reset/confirm',
      expect.any(Object),
    );
  });

  it('builds admin user list query params', async () => {
    await listAdminUsers({});
    expect(client.apiRequest).toHaveBeenCalledWith('/auth/admin/users');

    await listAdminUsers({ name: '  Ana ', role: ' manager ' });
    expect(client.apiRequest).toHaveBeenCalledWith('/auth/admin/users?name=Ana&role=manager');
  });

  it('calls admin and manager user operations', async () => {
    await adminRequestPasswordReset('u1');
    expect(client.apiRequest).toHaveBeenCalledWith('/auth/admin/users/u1/password-reset', {
      method: 'POST',
    });

    await createUserByAdmin({ name: 'N', email: 'n@t.com', role: 'developer' });
    expect(client.apiRequest).toHaveBeenCalledWith('/auth/admin/users', expect.any(Object));

    await inviteDeveloper({ name: 'D', email: 'd@t.com' });
    expect(client.apiRequest).toHaveBeenCalledWith(
      '/auth/manager/users/invite',
      expect.any(Object),
    );

    await updateUserByAdmin('u1', { name: 'N', email: 'n@t.com', role: 'manager' });
    expect(client.apiRequest).toHaveBeenCalledWith('/auth/admin/users/u1', expect.any(Object));

    await deactivateUserByAdmin('u1');
    expect(client.apiRequest).toHaveBeenCalledWith('/auth/admin/users/u1/deactivate', {
      method: 'POST',
    });

    await reactivateUserByAdmin('u1');
    expect(client.apiRequest).toHaveBeenCalledWith('/auth/admin/users/u1/reactivate', {
      method: 'POST',
    });

    await fetchPendingAssignments('u1');
    expect(client.apiRequest).toHaveBeenCalledWith('/auth/admin/users/u1/pending-assignments');
  });

  it('loads and updates profile', async () => {
    await fetchProfile();
    expect(client.apiRequest).toHaveBeenCalledWith('/auth/profile');

    const file = new File(['x'], 'a.png', { type: 'image/png' });
    await updateProfile({ name: 'Me', avatar: file });
    expect(client.apiFormRequest).toHaveBeenCalledWith('/auth/profile', expect.any(Object));

    await updateProfile({ name: 'Me', avatar: null });
    const formInit = vi.mocked(client.apiFormRequest).mock.calls.at(-1)?.[1];
    expect(formInit?.formData?.get('name')).toBe('Me');
  });
});
