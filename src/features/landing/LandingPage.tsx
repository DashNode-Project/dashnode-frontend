import { ArrowRight, ChevronRight, Layers } from 'lucide-react';
import { Link } from 'react-router';
import { PATHS } from '@/app/paths';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { LANDING_FEATURES, LANDING_MVPS, LANDING_TRACEABILITY } from './landingContent';

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Public presentation page (HU_DN_01_01). Static content only; no protected data.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#F9FAFB]">
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>

      <nav className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-white/6 bg-[#0A0B0E]/90 px-6 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500">
            <Layers size={16} className="text-white" aria-hidden="true" />
          </div>
          <span className="text-sm font-bold">DashNode</span>
        </div>
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 text-sm text-[#9CA3AF] md:flex">
          <button
            type="button"
            onClick={() => scrollTo('features')}
            className="transition-colors hover:text-white"
          >
            Capacidades
          </button>
          <button
            type="button"
            onClick={() => scrollTo('mvps')}
            className="transition-colors hover:text-white"
          >
            MVPs
          </button>
          <button
            type="button"
            onClick={() => scrollTo('about')}
            className="transition-colors hover:text-white"
          >
            Acerca de
          </button>
        </div>
        <ButtonLink to={PATHS.login} size="sm">
          Iniciar sesión
        </ButtonLink>
      </nav>

      <main id="main">
        <section
          aria-labelledby="hero-title"
          className="relative overflow-hidden px-6 pb-20 pt-28 text-center"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-20 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-500/5 blur-3xl" />
            <div className="absolute left-1/3 top-32 h-72 w-72 rounded-full bg-violet-500/5 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-3xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400"
                aria-hidden="true"
              />
              Proyecto Integrador II · Universidad del Valle
            </p>
            <h1 id="hero-title" className="mb-5 text-4xl font-bold leading-tight md:text-5xl">
              Gestión inteligente de
              <br />
              <span className="text-blue-400">proyectos de software</span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-[#9CA3AF]">
              Centraliza proyectos, equipos, Scrum, reuniones, documentación y diagnóstico con IA en
              una plataforma profesional diseñada para equipos de desarrollo.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <ButtonLink to={PATHS.login} size="lg">
                Ingresar a DashNode
                <ArrowRight size={16} aria-hidden="true" />
              </ButtonLink>
              <button
                type="button"
                onClick={() => scrollTo('features')}
                className="inline-flex h-11 items-center rounded-lg border border-white/10 px-4 text-sm font-medium text-[#F9FAFB] hover:border-white/20"
              >
                Conocer la plataforma
              </button>
            </div>
          </div>

          <div className="relative mx-auto mt-16 max-w-4xl">
            <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#12131C] shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/6 bg-[#0A0B0E] px-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                <span className="ml-2 text-xs text-[#6B7280]">
                  DashNode · Workspace · DashNode Platform
                </span>
              </div>
              <div className="flex">
                <div className="flex w-44 flex-col gap-1 border-r border-white/6 bg-[#0A0B0E] p-3">
                  {['Dashboard', 'Usuarios', 'Proyectos', 'Reuniones', 'Calendario'].map(
                    (item, i) => (
                      <div
                        key={item}
                        className={`flex h-7 items-center rounded-md px-2 text-xs ${
                          i === 0 ? 'bg-blue-500/15 text-blue-400' : 'text-[#6B7280]'
                        }`}
                      >
                        {item}
                      </div>
                    ),
                  )}
                </div>
                <div className="flex-1 p-4">
                  <div className="mb-4 grid grid-cols-4 gap-3">
                    {(
                      [
                        ['Proyectos', '3', '#3B82F6'],
                        ['Reuniones', '8', '#8B5CF6'],
                        ['Tareas activas', '12', '#10B981'],
                        ['Issues', '3', '#F59E0B'],
                      ] as const
                    ).map(([label, val, color]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-white/6 bg-[#1E1F2B] p-3"
                      >
                        <p className="text-xs text-[#6B7280]">{label}</p>
                        <p className="mt-1 text-xl font-bold" style={{ color }}>
                          {val}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex h-24 items-center justify-center rounded-lg border border-white/6 bg-[#1E1F2B]">
                    <span className="text-xs text-[#6B7280]">
                      Actividad reciente · Sprint 2 activo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-blue-400">
                Capacidades
              </p>
              <h2 id="features-title" className="text-3xl font-bold">
                Todo lo que tu equipo necesita
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-[#9CA3AF]">
                Desde la planificación hasta el diagnóstico técnico, DashNode cubre todo el ciclo de
                vida del proyecto.
              </p>
            </div>
            <ul aria-labelledby="features-title" className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {LANDING_FEATURES.map((f) => (
                <li
                  key={f.label}
                  className="group rounded-xl border border-white/6 bg-[#12131C] p-4 transition-colors hover:border-white/12"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 transition-colors group-hover:bg-blue-500/15">
                    {f.icon}
                  </div>
                  <h3 className="mb-1 text-sm font-semibold">{f.label}</h3>
                  <p className="text-xs leading-relaxed text-[#9CA3AF]">{f.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="mvps" className="bg-[#070809] px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-violet-400">
                Roadmap
              </p>
              <h2 className="text-3xl font-bold">Tres MVPs, una plataforma</h2>
              <p className="mt-3 text-[#9CA3AF]">
                Implementación progresiva con entregas de valor desde el primer sprint.
              </p>
            </div>
            <ul className="grid gap-5 md:grid-cols-3">
              {LANDING_MVPS.map((mvp) => (
                <li
                  key={mvp.number}
                  className="relative overflow-hidden rounded-xl border border-white/6 bg-[#12131C] p-5 transition-colors hover:border-white/12"
                >
                  <div
                    className="absolute left-0 right-0 top-0 h-0.5"
                    style={{ background: mvp.color }}
                  />
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className="rounded-full border px-2 py-0.5 text-xs font-bold"
                      style={{
                        color: mvp.color,
                        borderColor: `${mvp.color}30`,
                        background: `${mvp.color}10`,
                      }}
                    >
                      {mvp.number}
                    </span>
                    <span className="text-xs text-[#6B7280]">{mvp.status}</span>
                  </div>
                  <h3 className="mb-2 font-bold">{mvp.title}</h3>
                  <p className="mb-4 text-xs leading-relaxed text-[#9CA3AF]">{mvp.desc}</p>
                  <ul className="flex flex-col gap-2">
                    {mvp.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                        <span
                          className="h-1 w-1 shrink-0 rounded-full"
                          style={{ background: mvp.color }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-emerald-400">
              Trazabilidad
            </p>
            <h2 className="mb-4 text-3xl font-bold">Jerarquía conectada de extremo a extremo</h2>
            <p className="mx-auto mb-12 max-w-lg text-[#9CA3AF]">
              Cada evidencia de problema se rastrea hasta su proyecto de origen. Sin información
              perdida.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {LANDING_TRACEABILITY.map((item, i) => (
                <span key={item.label} className="inline-flex items-center gap-2">
                  <span className="flex flex-col items-center gap-2">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2"
                      style={{ borderColor: item.color, background: `${item.color}12` }}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                    </span>
                    <span className="text-xs font-medium" style={{ color: item.color }}>
                      {item.label}
                    </span>
                  </span>
                  {i < LANDING_TRACEABILITY.length - 1 ? (
                    <ChevronRight size={16} className="mb-4 text-[#374151]" aria-hidden="true" />
                  ) : null}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#070809] px-6 py-20">
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500">
              <Layers size={28} className="text-white" aria-hidden="true" />
            </div>
            <h2 className="mb-4 text-3xl font-bold">Listo para empezar</h2>
            <p className="mb-8 text-[#9CA3AF]">
              Cree su cuenta de Gerente y comience a organizar proyectos con su equipo.
            </p>
            <ButtonLink to={PATHS.register} size="lg" className="mx-auto">
              Registrarme como Gerente
              <ArrowRight size={16} aria-hidden="true" />
            </ButtonLink>
          </div>
        </section>
      </main>

      <footer id="about" className="border-t border-white/6 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500">
                  <Layers size={13} className="text-white" aria-hidden="true" />
                </div>
                <span className="text-sm font-bold">DashNode</span>
              </div>
              <p className="text-xs leading-relaxed text-[#6B7280]">
                Plataforma inteligente para gestión y seguimiento de proyectos de software.
              </p>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#F9FAFB]">
                Producto
              </p>
              <ul className="flex flex-col gap-2 text-xs text-[#6B7280]">
                {['Capacidades', 'MVPs', 'Trazabilidad', 'Seguridad'].map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#F9FAFB]">
                Equipo
              </p>
              <ul className="flex flex-col gap-2 text-xs text-[#6B7280]">
                {['Andrey Quiceno', 'Jhorman Gómez', 'Iván Ausecha', 'David Enciso'].map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#F9FAFB]">
                Institución
              </p>
              <ul className="flex flex-col gap-2 text-xs text-[#6B7280]">
                <li>Universidad del Valle</li>
                <li>Ingeniería de Sistemas y Computación</li>
                <li>Proyecto Integrador II</li>
                <li>v1.0 conceptual</li>
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-white/6 pt-6">
            <p className="text-xs text-[#6B7280]">© 2026 DashNode · Universidad del Valle</p>
            <Link
              to="#about"
              className="text-xs text-[#6B7280] transition-colors hover:text-[#9CA3AF]"
            >
              Acerca del proyecto
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
