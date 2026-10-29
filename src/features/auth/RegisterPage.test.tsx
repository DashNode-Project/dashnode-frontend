import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { MemoryRouter, Route, Routes } from 'react-router';
import { FlashProvider, useIncomingFlash } from '@/app/FlashContext';
import { PATHS } from '@/app/paths';
import { apiError, mockFetch, ok } from '@/test/fetchMock';
import RegisterPage from './RegisterPage';

const VALID = {
  name: 'Ana Pérez',
  email: 'ana@dominio.com',
  password: 'Abcdefg1',
  confirm: 'Abcdefg1',
};

function LoginProbe() {
  const { flash } = useIncomingFlash();
  return (
    <div>
      <p>pantalla de inicio de sesión</p>
      {flash ? <p data-testid="flash">{flash.message}</p> : null}
    </div>
  );
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[PATHS.register]}>
      <FlashProvider>
        <Routes>
          <Route path={PATHS.register} element={<RegisterPage />} />
          <Route path={PATHS.login} element={<LoginProbe />} />
        </Routes>
      </FlashProvider>
    </MemoryRouter>,
  );
}

async function fill(user: ReturnType<typeof userEvent.setup>, values: Partial<typeof VALID>) {
  const merged = { ...VALID, ...values };
  await user.type(screen.getByLabelText('Nombre completo'), merged.name);
  await user.type(screen.getByLabelText('Correo electrónico'), merged.email);
  await user.type(screen.getByLabelText('Contraseña'), merged.password);
  await user.type(screen.getByLabelText('Confirmar contraseña'), merged.confirm);
}

const submitButton = () => screen.getByRole('button', { name: 'Registrarme' });

describe('HU_DN_01_02 - form (criteria 1 and 2)', () => {
  it('contains the four fields and no role selector (2.5)', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Registro de Gerente' })).toBeInTheDocument();
    for (const label of [
      'Nombre completo',
      'Correo electrónico',
      'Contraseña',
      'Confirmar contraseña',
    ]) {
      expect(screen.getByLabelText(label)).toBeRequired();
    }
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/rol/i)).not.toBeInTheDocument();
  });

  it("keeps 'Registrarme' disabled while a required field is empty (2.6)", async () => {
    const user = userEvent.setup();
    renderPage();
    expect(submitButton()).toBeDisabled();
    await user.type(screen.getByLabelText('Nombre completo'), VALID.name);
    await user.type(screen.getByLabelText('Correo electrónico'), VALID.email);
    await user.type(screen.getByLabelText('Contraseña'), VALID.password);
    expect(submitButton()).toBeDisabled();
    await user.type(screen.getByLabelText('Confirmar contraseña'), VALID.confirm);
    expect(submitButton()).toBeEnabled();
    await user.clear(screen.getByLabelText('Nombre completo'));
    expect(submitButton()).toBeDisabled();
  });

  it('hides passwords by default and offers a show/hide button (2.3)', async () => {
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Confirmar contraseña')).toHaveAttribute('type', 'password');
    await user.click(screen.getAllByRole('button', { name: 'Mostrar contraseña' })[0]!);
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text');
  });

  it("'Iniciar sesión' returns to the login without saving (2.7)", async () => {
    const calls = mockFetch(() => ok({}));
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Nombre completo'), VALID.name);
    await user.click(screen.getByRole('link', { name: 'Iniciar sesión' }));
    expect(screen.getByText('pantalla de inicio de sesión')).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('has no detectable accessibility violations, also with errors shown', async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    expect(await axe(container)).toHaveNoViolations();
    await fill(user, { email: 'mal' });
    await user.click(submitButton());
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('HU_DN_01_02 - client validations (2.1 - 2.4)', () => {
  it.each([
    [{ name: '   ' }, 'El nombre completo es obligatorio.'],
    [{ email: 'sin-formato' }, 'El correo electrónico ingresado no tiene un formato válido.'],
    [
      { password: 'corta1', confirm: 'corta1' },
      'La contraseña no cumple los requisitos mínimos de seguridad.',
    ],
    [
      { password: 'soloLetras', confirm: 'soloLetras' },
      'La contraseña no cumple los requisitos mínimos de seguridad.',
    ],
    [{ confirm: 'Abcdefg2' }, 'Las contraseñas no coinciden.'],
  ])('shows the literal message for %j without calling the server', async (override, message) => {
    const calls = mockFetch(() => ok({}));
    const user = userEvent.setup();
    renderPage();
    await fill(user, override);
    await user.click(submitButton());
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('moves focus to the first invalid field', async () => {
    const user = userEvent.setup();
    renderPage();
    await fill(user, { email: 'mal', confirm: 'otra1234' });
    await user.click(submitButton());
    await waitFor(() => expect(screen.getByLabelText('Correo electrónico')).toHaveFocus());
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears a field error as soon as the user edits it', async () => {
    const user = userEvent.setup();
    renderPage();
    await fill(user, { email: 'mal' });
    await user.click(submitButton());
    expect(await screen.findByText(/formato válido/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Correo electrónico'), 'x');
    expect(screen.queryByText(/formato válido/)).not.toBeInTheDocument();
  });

  it('validates a field when leaving it with content', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Correo electrónico'), 'mal');
    await user.tab();
    expect(await screen.findByText(/formato válido/)).toBeInTheDocument();
  });
});

describe('HU_DN_01_02 - success (criterion 5)', () => {
  it('sends the data without any role, then redirects to the login with the success message', async () => {
    const calls = mockFetch(() =>
      ok({ message: 'ignored', user: { id: '1', email: VALID.email } }, 201),
    );
    const user = userEvent.setup();
    renderPage();
    await fill(user, { email: '  ana@dominio.com  ' });
    await user.click(submitButton());

    expect(await screen.findByTestId('flash')).toHaveTextContent(
      'Su cuenta de Gerente ha sido registrada correctamente. Puede iniciar sesión.',
    );
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      url: '/api/v1/auth/register',
      method: 'POST',
      credentials: 'include',
      body: {
        name: 'Ana Pérez',
        email: 'ana@dominio.com',
        password: 'Abcdefg1',
        confirm_password: 'Abcdefg1',
      },
    });
    expect(calls[0]?.body).not.toHaveProperty('role');
  });

  it('prevents double submission while the request is in flight', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const calls = mockFetch(async () => {
      await gate;
      return ok({ message: 'x', user: {} }, 201);
    });
    const user = userEvent.setup();
    renderPage();
    await fill(user, {});
    await user.click(submitButton());
    expect(submitButton()).toBeDisabled();
    await user.keyboard('{Enter}');
    release();
    await screen.findByTestId('flash');
    expect(calls).toHaveLength(1);
  });
});

describe('HU_DN_01_02 - server answers (criteria 3, 4 and 6)', () => {
  it('shows the duplicated e-mail message on the e-mail field', async () => {
    mockFetch(() =>
      apiError(
        409,
        'EMAIL_ALREADY_REGISTERED',
        'Ya existe una cuenta registrada con este correo electrónico.',
      ),
    );
    const user = userEvent.setup();
    renderPage();
    await fill(user, {});
    await user.click(submitButton());
    expect(
      await screen.findByText('Ya existe una cuenta registrada con este correo electrónico.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toHaveAccessibleDescription(
      'Ya existe una cuenta registrada con este correo electrónico.',
    );
    expect(screen.getByLabelText('Nombre completo')).toHaveValue(VALID.name);
  });

  it.each([
    ['NAME_REQUIRED', 'El nombre completo es obligatorio.'],
    ['PASSWORD_WEAK', 'La contraseña no cumple los requisitos mínimos de seguridad.'],
    ['PASSWORD_MISMATCH', 'Las contraseñas no coinciden.'],
    ['EMAIL_INVALID', 'El correo electrónico ingresado no tiene un formato válido.'],
  ])('maps the server code %s to its field', async (code, message) => {
    mockFetch(() => apiError(400, code, message));
    const user = userEvent.setup();
    renderPage();
    await fill(user, {});
    await user.click(submitButton());
    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it.each([
    [400, 'REQUIRED_FIELDS', 'Todos los campos obligatorios deben ser diligenciados.'],
    [403, 'ROLE_NOT_ALLOWED', 'El registro público solo está disponible para el rol Gerente.'],
  ])('shows the form-level message for %s %s', async (status, code, message) => {
    mockFetch(() => apiError(status, code, message));
    const user = userEvent.setup();
    renderPage();
    await fill(user, {});
    await user.click(submitButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });

  it.each([
    ['a server error', () => apiError(500, 'INTERNAL_ERROR', 'interno')],
    ['an unreadable answer', () => ({ status: 502 })],
    ['an unknown client error', () => apiError(403, 'ORIGIN_NOT_ALLOWED', 'otro')],
    ['a network failure', () => new TypeError('Failed to fetch')],
  ])('shows the technical message on %s and keeps the data', async (_label, reply) => {
    mockFetch(reply);
    const user = userEvent.setup();
    renderPage();
    await fill(user, {});
    await user.click(submitButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No fue posible completar la operación. Intente nuevamente.',
    );
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue(VALID.email);
    expect(submitButton()).toBeEnabled();
  });

  it('never prints the password to the console', async () => {
    const spies = [
      vi.spyOn(console, 'log'),
      vi.spyOn(console, 'info'),
      vi.spyOn(console, 'warn'),
      vi.spyOn(console, 'error'),
    ];
    mockFetch(() => apiError(500, 'INTERNAL_ERROR', 'x'));
    const user = userEvent.setup();
    renderPage();
    await fill(user, {});
    await user.click(submitButton());
    await screen.findByRole('alert');
    for (const spy of spies) expect(JSON.stringify(spy.mock.calls)).not.toContain(VALID.password);
  });
});
