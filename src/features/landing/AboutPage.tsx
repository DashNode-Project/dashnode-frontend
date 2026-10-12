import { ArrowLeft, Layers } from 'lucide-react';
import { Link } from 'react-router';
import { PATHS } from '@/app/paths';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { LandingFooter } from './LandingFooter';

const team = [
  {
    name: 'Andrey Quiceno',
    role: 'Administrador · Backend',
    skills: ['FastAPI', 'PostgreSQL', 'Docker', 'DevOps'],
  },
  {
    name: 'Jhorman Gómez',
    role: 'Product Owner · Scrum Master',
    skills: ['Scrum', 'React', 'FastAPI', 'Product Management'],
  },
  {
    name: 'Iván Ausecha',
    role: 'Frontend Engineer',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'UX'],
  },
  {
    name: 'David Enciso',
    role: 'Backend Engineer',
    skills: ['Python', 'SQLAlchemy', 'JWT', 'Redis'],
  },
];

const stack = [
  { cat: 'Frontend', items: ['React 19', 'TypeScript', 'Tailwind CSS v4', 'React Router'] },
  { cat: 'Backend', items: ['FastAPI', 'Python 3.12', 'SQLAlchemy', 'Alembic'] },
  { cat: 'Base de datos', items: ['PostgreSQL 16'] },
  { cat: 'Seguridad', items: ['Sesiones HttpOnly', 'Argon2id', 'RBAC'] },
  { cat: 'Infraestructura', items: ['Docker', 'GitHub Actions', 'Ruff', 'Pytest'] },
  { cat: 'Inteligencia Artificial', items: ['Ollama', 'Whisper', 'TTS', 'Modelos multimodales'] },
];

const mvps = [
  {
    mvp: 'MVP 1',
    title: 'Administración y Colaboración',
    desc: 'Usuarios, roles, proyectos, equipos, disponibilidad, algoritmo de franjas libres y reuniones con Google Calendar.',
    color: '#3B82F6',
  },
  {
    mvp: 'MVP 2',
    title: 'Scrum e IA de Voz',
    desc: 'Product Backlog, épicas, historias de usuario, sprints, tablero Kanban, documentación técnica e IA de voz con Whisper y TTS.',
    color: '#8B5CF6',
  },
  {
    mvp: 'MVP 3',
    title: 'Diagnóstico Multimodal y Conocimiento',
    desc: 'Análisis de imágenes y video con modelos multimodales, RAG sobre documentación, base de conocimiento técnico y métricas avanzadas de IA.',
    color: '#EC4899',
  },
];

/** Public «Acerca de» page (demo parity). */
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#F9FAFB]">
      <nav className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center gap-4 border-b border-white/6 bg-[#0A0B0E]/90 px-6 backdrop-blur-sm">
        <Link
          to={PATHS.landing}
          className="flex items-center gap-1.5 text-sm text-[#6B7280] transition-colors hover:text-[#9CA3AF]"
        >
          <ArrowLeft size={14} aria-hidden="true" /> Volver
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500">
            <Layers size={13} className="text-white" aria-hidden="true" />
          </div>
          <span className="text-sm font-bold">DashNode</span>
        </div>
        <div className="flex-1" />
        <ButtonLink to={PATHS.login} size="sm">
          Iniciar sesión
        </ButtonLink>
      </nav>

      <main className="mx-auto max-w-4xl px-6 pb-16 pt-24">
        <div className="mb-12 text-center">
          <p className="mb-4 inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
            Proyecto Integrador II
          </p>
          <h1 className="mb-4 text-3xl font-bold">Acerca de DashNode</h1>
          <p className="mx-auto max-w-lg leading-relaxed text-[#9CA3AF]">
            DashNode es una plataforma SaaS conceptual desarrollada como Proyecto Integrador II en
            la Universidad del Valle, Ingeniería de Sistemas y Computación.
          </p>
        </div>

        <section className="mb-8 rounded-2xl border border-white/6 bg-[#12131C] p-6">
          <h2 className="mb-4 font-bold">Contexto académico</h2>
          <dl className="grid gap-4 sm:grid-cols-3">
            {[
              ['Institución', 'Universidad del Valle'],
              ['Programa', 'Ingeniería de Sistemas y Computación'],
              ['Curso', 'Proyecto Integrador II'],
              ['Versión', '1.0 conceptual'],
              ['Período', '2026'],
              ['Metodología', 'Scrum · 3 MVPs'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="mb-0.5 text-xs text-[#6B7280]">{label}</dt>
                <dd className="text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <h2 className="mb-4 font-bold">Equipo de desarrollo</h2>
        <ul className="mb-8 grid gap-4 sm:grid-cols-2">
          {team.map((m) => (
            <li key={m.name} className="rounded-xl border border-white/6 bg-[#12131C] p-4">
              <p className="font-semibold">{m.name}</p>
              <p className="mb-2 text-xs text-[#9CA3AF]">{m.role}</p>
              <div className="flex flex-wrap gap-1">
                {m.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-white/10 bg-[#0A0B0E] px-2 py-0.5 text-xs text-[#9CA3AF]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>

        <h2 className="mb-4 font-bold">Stack tecnológico</h2>
        <ul className="mb-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {stack.map((s) => (
            <li key={s.cat} className="rounded-xl border border-white/6 bg-[#12131C] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-400">
                {s.cat}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {s.items.map((i) => (
                  <span
                    key={i}
                    className="rounded-full border border-white/10 bg-[#0A0B0E] px-2 py-0.5 text-xs text-[#9CA3AF]"
                  >
                    {i}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>

        <h2 className="mb-4 font-bold">Entregables progresivos</h2>
        <ul className="space-y-3">
          {mvps.map((m) => (
            <li
              key={m.mvp}
              className="relative overflow-hidden rounded-xl border border-white/6 bg-[#12131C] p-4"
            >
              <div
                className="absolute bottom-0 left-0 top-0 w-0.5"
                style={{ background: m.color }}
              />
              <div className="pl-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-bold" style={{ color: m.color }}>
                    {m.mvp}
                  </span>
                  <span className="text-sm font-semibold">{m.title}</span>
                </div>
                <p className="text-xs leading-relaxed text-[#9CA3AF]">{m.desc}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center">
          <ButtonLink to={PATHS.login} size="lg">
            Explorar DashNode
          </ButtonLink>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
