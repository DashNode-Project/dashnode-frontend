import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { PATHS } from '@/app/paths';
import { Logo } from '@/components/ui/Logo';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** Frame shared by the public authentication screens. */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0A0B0E] text-[#F9FAFB]">
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <header className="flex h-14 items-center justify-between border-b border-white/10 px-6">
        <Link to={PATHS.landing} aria-label="DashNode, ir al inicio">
          <Logo />
        </Link>
        <Link
          to={PATHS.landing}
          className="inline-flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-[#F9FAFB]"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Volver al inicio
        </Link>
      </header>
      <main id="main" className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <h1 className="mb-1 text-xl font-bold">{title}</h1>
          <p className="mb-6 text-sm text-[#9CA3AF]">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
