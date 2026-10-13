import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { ProjectFormFields } from './ProjectsPage';
import type { ProjectFormValues } from './validation';

function Harness({
  showManager,
  showStatusReadonly,
}: {
  showManager: boolean;
  showStatusReadonly?: boolean;
}) {
  const [form, setForm] = useState<ProjectFormValues>({
    name: '',
    description: '',
    priority: 'media',
    techStackInput: '',
    meetingLink: '',
    managerId: '',
  });
  return (
    <ProjectFormFields
      form={form}
      setForm={setForm}
      fieldErrors={{ managerId: 'Debe asignar un gerente responsable.' }}
      managers={[{ id: 'm1', name: 'Manager One' }]}
      showManager={showManager}
      showStatusReadonly={showStatusReadonly}
    />
  );
}

describe('ProjectFormFields', () => {
  it('renders manager and readonly status when enabled', () => {
    render(<Harness showManager showStatusReadonly />);
    expect(screen.getByText('Gerente responsable')).toBeInTheDocument();
    expect(screen.getByText('Debe asignar un gerente responsable.')).toBeInTheDocument();
    expect(screen.getByLabelText('Estado')).toHaveValue('Planificación');
  });

  it('hides manager block when showManager is false', () => {
    render(<Harness showManager={false} />);
    expect(screen.queryByText('Gerente responsable')).not.toBeInTheDocument();
  });

  it('updates form fields on change', async () => {
    const user = userEvent.setup();
    render(<Harness showManager={false} />);
    await user.type(screen.getByLabelText('Nombre'), 'Proyecto');
    await user.type(screen.getByLabelText('Descripción'), 'Detalle');
    await user.selectOptions(screen.getByLabelText('Prioridad'), 'alta');
    await user.type(screen.getByLabelText('Stack tecnológico'), 'React, Go');
    await user.type(
      screen.getByLabelText('Enlace de reunión predeterminado'),
      'https://meet.test/x',
    );
    expect(screen.getByLabelText('Nombre')).toHaveValue('Proyecto');
  });
});
