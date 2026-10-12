import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { PATHS } from '@/app/paths';
import { renderApp } from '@/test/app';
import { makeSession } from '@/test/factories';
import { mockApi, ok } from '@/test/fetchMock';

describe('HU_DN_01_20 — permissions matrix', () => {
  it('renders the read-only matrix for authenticated users', async () => {
    mockApi({ session: ok(makeSession('developer')) });
    renderApp(PATHS.permissions);
    expect(await screen.findByRole('heading', { name: 'Permisos y roles' })).toBeInTheDocument();
    expect(screen.getByText('Iniciar y cerrar sesión')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });
});
