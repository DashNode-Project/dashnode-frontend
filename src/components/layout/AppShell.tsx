import { Outlet } from 'react-router';
import { Logo } from '@/components/ui/Logo';
import { AiAssistantButton, HeaderTools } from './HeaderTools';
import { ShellLayoutProvider } from './ShellLayoutContext';
import { SideNav } from './SideNav';
import { UserMenu } from './UserMenu';

/** Frame of every authenticated view: sticky top bar, fixed sidebar, scrollable main. */
export function AppShell() {
  return (
    <ShellLayoutProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-[#0A0B0E] text-[#F9FAFB]">
        <a href="#main" className="skip-link">
          Saltar al contenido
        </a>
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#0A0B0E]/95 px-4 backdrop-blur sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <HeaderTools />
            <UserMenu />
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          <SideNav />
          <main id="main" className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1400px]">
              <Outlet />
            </div>
          </main>
        </div>
        <AiAssistantButton />
      </div>
    </ShellLayoutProvider>
  );
}
