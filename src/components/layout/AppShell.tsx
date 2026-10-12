import { Outlet } from 'react-router';
import { Logo } from '@/components/ui/Logo';
import { UserMenu } from './UserMenu';

/** Frame of every authenticated view: top bar with the user menu and the main region. */
export function AppShell() {
  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#F9FAFB]">
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <header className="flex h-14 items-center justify-between border-b border-white/10 px-4 sm:px-6">
        <Logo />
        <UserMenu />
      </header>
      <main id="main" className="mx-auto max-w-3xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
