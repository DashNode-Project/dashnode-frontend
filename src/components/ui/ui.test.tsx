import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Alert } from './Alert';
import { Button } from './Button';
import { PasswordField } from './PasswordField';
import { TextField } from './TextField';

describe('TextField', () => {
  it('links label, error and hint for assistive technology', async () => {
    const { container, rerender } = render(<TextField label="Correo" hint="Ayuda" />);
    const input = screen.getByLabelText('Correo');
    expect(input).toHaveAccessibleDescription('Ayuda');
    expect(input).not.toHaveAttribute('aria-invalid');

    rerender(<TextField label="Correo" hint="Ayuda" error="Dato inválido" />);
    expect(screen.getByLabelText('Correo')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Correo')).toHaveAccessibleDescription('Dato inválido');
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('PasswordField', () => {
  it('is hidden by default and can be revealed with the keyboard', async () => {
    const user = userEvent.setup();
    const { container } = render(<PasswordField label="Contraseña" />);
    const input = screen.getByLabelText('Contraseña');
    expect(input).toHaveAttribute('type', 'password');

    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('Alert and Button', () => {
  it('announces errors assertively and other statuses politely', () => {
    const { rerender } = render(<Alert variant="error">Falló</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Falló');
    rerender(<Alert variant="success">Listo</Alert>);
    expect(screen.getByRole('status')).toHaveTextContent('Listo');
  });

  it('disables itself while loading', () => {
    render(<Button loading>Enviar</Button>);
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Enviar' })).toHaveAttribute('aria-busy', 'true');
  });
});
