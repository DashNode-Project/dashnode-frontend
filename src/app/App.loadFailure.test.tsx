import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from './App';

// Simulates the code of the landing screen failing to download (offline, deploy in progress...).
vi.mock('@/features/landing/LandingPage', () => {
  throw new Error('chunk failed');
});

describe('HU_DN_01_01 - technical failure (criterion 6)', () => {
  it("shows 'No fue posible cargar la información. Intente nuevamente.' when the page cannot load", async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No fue posible cargar la información. Intente nuevamente.',
    );
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('offers a retry action', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(reload).toHaveBeenCalledOnce();
  });
});
