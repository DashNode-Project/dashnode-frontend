import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Layers } from 'lucide-react';
import { PATHS } from '@/app/paths';
import { Logo } from '@/components/ui/Logo';
import { AUTH_PANEL_BULLETS } from '@/features/landing/landingContent';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** Frame shared by the public authentication screens (marketing panel on large screens). */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#0A0B0E] text-[#F9FAFB]">
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>

      <div className="hidden flex-1 flex-col justify-between border-r border-white/6 bg-[#070809] p-10 lg:flex">
        <div>
          <Link to={PATHS.landing} className="mb-12 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
              <Layers size={17} className="text-white" aria-hidden="true" />
            </div>
            <span className="font-bold">DashNode</span>
          </Link>
          <h2 className="mb-4 text-2xl font-bold leading-tight">
            Gestión inteligente de proyectos de software
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-[#9CA3AF]">
            Centraliza tu equipo, backlog, sprints, reuniones y diagnóstico con IA en una plataforma
            profesional.
          </p>
          <ul className="flex flex-col gap-3">
            {AUTH_PANEL_BULLETS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-[#9CA3AF]">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-white/10 px-6 lg:hidden">
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
    </div>
  );
}
