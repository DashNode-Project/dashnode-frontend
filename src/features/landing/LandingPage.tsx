import { ArrowRight, UserPlus } from 'lucide-react';
import { Link } from 'react-router';
import { PATHS } from '@/app/paths';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Logo } from '@/components/ui/Logo';
import { PRODUCT_MODULES } from './modules';

/**
 * Public presentation page (HU_DN_01_01). It is fully static: it never requests nor renders
 * protected data (projects, users, session) and works without a session.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#F9FAFB]">
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>

      <header className="flex h-14 items-center border-b border-white/10 px-6">
        <Logo />
      </header>

      <main id="main">
        <section aria-labelledby="hero-title" className="px-6 pb-16 pt-20 text-center">
          <div className="mx-auto max-w-3xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
              Proyecto Integrador II · Universidad del Valle
            </p>
            <h1 id="hero-title" className="mb-5 text-4xl font-bold leading-tight md:text-5xl">
              <span className="block">DashNode</span>
              <span className="block text-blue-400">
                Gestión inteligente de proyectos de software
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-[#9CA3AF]">
              Organice proyectos, equipos y trabajo Scrum en una sola plataforma, con documentación
              y asistencia de IA.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <ButtonLink to={PATHS.login} size="lg">
                Iniciar sesión
                <ArrowRight size={16} aria-hidden="true" />
              </ButtonLink>
              <Link
                to={PATHS.register}
                className="inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium text-blue-300 underline underline-offset-4 hover:text-blue-200"
              >
                <UserPlus size={16} aria-hidden="true" />
                Registrarme como Gerente
              </Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="modules-title" className="px-6 pb-24">
          <div className="mx-auto max-w-5xl">
            <h2 id="modules-title" className="mb-2 text-center text-2xl font-bold">
              Todo lo que su equipo necesita
            </h2>
            <p className="mx-auto mb-10 max-w-lg text-center text-sm text-[#9CA3AF]">
              Los módulos principales de la plataforma.
            </p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PRODUCT_MODULES.map(({ id, title, description, icon: Icon }) => (
                <li
                  key={id}
                  className="rounded-xl border border-white/10 bg-[#12131C] p-5 transition-colors hover:border-white/20"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <h3 className="mb-1 text-sm font-semibold">{title}</h3>
                  <p className="text-sm leading-relaxed text-[#9CA3AF]">{description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-[#9CA3AF]">
        © 2026 DashNode · Universidad del Valle · Ingeniería de Sistemas y Computación
      </footer>
    </div>
  );
}
