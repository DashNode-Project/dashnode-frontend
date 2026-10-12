import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from './App';

describe('AppRoutes', () => {
  it('serves the landing page at the root without a session', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /Gestión inteligente/,
    );
  });

  it('shows a not-found page for unknown routes', async () => {
    render(
      <MemoryRouter initialEntries={['/no-existe']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Página no encontrada' }),
    ).toBeInTheDocument();
  });
});
