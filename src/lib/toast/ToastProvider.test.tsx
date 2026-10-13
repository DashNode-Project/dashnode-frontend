import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast } from './ToastProvider';

function Probe() {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast('Hola toolkit', 'success')}>
      Mostrar
    </button>
  );
}

describe('ToastProvider', () => {
  it('requires provider context', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow();
  });
  it('shows and dismisses a toast', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Mostrar' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Hola toolkit');
    await user.click(screen.getByRole('button', { name: 'Cerrar notificación' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
