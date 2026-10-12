import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, useLocation } from 'react-router';
import { AppRoutes } from '@/app/App';
import { PATHS } from '@/app/paths';
import { TEST_PASSWORD } from './factories';

export type User = ReturnType<typeof userEvent.setup>;

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

/** Renders the whole application plus a few helper links to navigate without reloading. */
export function renderApp(path: string = PATHS.login, options: { strict?: boolean } = {}) {
  const tree = (
    <MemoryRouter initialEntries={[path]}>
      <nav aria-label="test">
        <Link to={PATHS.landing}>ir-inicio</Link>
        <Link to={PATHS.login}>ir-login</Link>
        <Link to={PATHS.homeAdmin}>ir-admin</Link>
        <Link to={PATHS.homeManager}>ir-gerente</Link>
      </nav>
      <Where />
      <AppRoutes />
    </MemoryRouter>
  );
  return render(options.strict ? <StrictMode>{tree}</StrictMode> : tree);
}

export const currentPath = () => screen.getByTestId('where').textContent;

/** Fills and submits the login form (the caller must have mocked `fetch`). */
export async function signIn(user: User, email = 'ana@dominio.com') {
  await user.type(await screen.findByLabelText('Correo electrónico'), email);
  await user.type(screen.getByLabelText('Contraseña'), TEST_PASSWORD);
  await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
}
