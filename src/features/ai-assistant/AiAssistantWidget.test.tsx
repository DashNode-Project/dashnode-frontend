import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/errors';
import { escapeHtml } from './escapeHtml';
import { AiAssistantWidget } from './AiAssistantWidget';
import * as aiApi from './api';

vi.mock('./api', () => ({
  fetchChatHistory: vi.fn(async () => ({ messages: [] })),
  postTextGenerate: vi.fn(),
  postVoiceTranscribe: vi.fn(),
  postVoiceProcess: vi.fn(),
}));

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    status: 'authenticated',
    user: {
      id: 'dev-1',
      email: 'dev@dashnode.local',
      name: 'Dev',
      role: 'developer',
    },
    expiresAt: null,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    restoreSession: vi.fn(),
  }),
}));

function renderWidget() {
  return render(
    <MemoryRouter initialEntries={['/inicio/desarrollador']}>
      <AiAssistantWidget />
    </MemoryRouter>,
  );
}

describe('AiAssistantWidget', () => {
  it('escapeHtml neutralizes script tags', () => {
    expect(escapeHtml('<img onerror=alert(1)>')).not.toContain('<img');
  });

  it('opens and closes from the floating control with aria-expanded', async () => {
    const user = userEvent.setup();
    renderWidget();
    const toggle = await waitFor(() =>
      screen.getByRole('button', { name: /Abrir asistente de IA/i }),
    );
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(
      await screen.findByRole('dialog', { name: /Ventana de conversación del asistente/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Cerrar ventana de chat/i }));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('clears PROCESSING after text-generate failure', async () => {
    const user = userEvent.setup();
    vi.mocked(aiApi.postTextGenerate).mockRejectedValueOnce(
      new ApiError(503, {
        code: 'AI_REQUEST_TIMEOUT',
        message: 'timeout',
        fields: {},
      }),
    );
    renderWidget();
    const toggle = await waitFor(() =>
      screen.getByRole('button', { name: /Abrir asistente de IA/i }),
    );
    await user.click(toggle);
    const input = await screen.findByPlaceholderText(/Escriba una consulta/i);
    await user.type(input, 'pregunta abierta');
    await user.click(screen.getByRole('button', { name: /Enviar consulta/i }));
    await waitFor(() => {
      expect(screen.queryByText(/Generando respuesta/i)).not.toBeInTheDocument();
    });
    expect(screen.getByText(/tardó demasiado/i)).toBeInTheDocument();
  });

  it('has no critical a11y violations when open', async () => {
    const user = userEvent.setup();
    const { container } = renderWidget();
    const toggle = await waitFor(() =>
      screen.getByRole('button', { name: /Abrir asistente de IA/i }),
    );
    await user.click(toggle);
    const results = await axe(container);
    expect(results.violations.filter((v) => v.impact === 'critical')).toHaveLength(0);
  });
});
