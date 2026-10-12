import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PATHS } from '@/app/paths';
import { makeSession } from '@/test/factories';
import { mockFetch, ok } from '@/test/fetchMock';
import { renderApp } from '@/test/app';

const sampleUsers = [
  {
    id: 'u1',
    name: 'Ana Gerente',
    email: 'ana@empresa.com',
    role: 'manager',
    is_active: true,
  },
];

describe('Users admin integration', () => {
  it('lists users and opens edit dialog', async () => {
    mockFetch((call) => {
      if (call.url.endsWith('/auth/session') && call.method === 'GET') {
        return ok(makeSession('admin'));
      }
      if (call.url.includes('/auth/admin/users') && call.method === 'GET') {
        return ok(sampleUsers);
      }
      return { status: 404, body: { error: { code: 'NOT_FOUND', message: 'x', fields: {} } } };
    });
    const user = userEvent.setup();
    renderApp(PATHS.users);
    await screen.findByRole('heading', { name: 'Usuarios' });
    expect(await screen.findByText('Ana Gerente')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    expect(screen.getByRole('heading', { name: 'Editar usuario' })).toBeInTheDocument();
  });
});
