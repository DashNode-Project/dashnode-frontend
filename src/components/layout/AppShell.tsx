import { Outlet } from 'react-router';
import { Logo } from '@/components/ui/Logo';
import { AiAssistantButton, HeaderTools } from './HeaderTools';
import { SideNav } from './SideNav';
import { UserMenu } from './UserMenu';

/** Frame of every authenticated view: top bar, main navigation and the main region. */
export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0A0B0E] text-[#F9FAFB]">
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <HeaderTools />
          <UserMenu />
        </div>
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <SideNav />
        <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
          <Outlet />
        </main>
      </div>
      <AiAssistantButton />
    </div>
  );
}
