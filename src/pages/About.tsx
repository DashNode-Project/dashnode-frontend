import React from 'react';
import { ArrowLeft, Layers, ExternalLink } from 'lucide-react';
import { useApp } from '../store';
import { Button, Avatar, Badge } from '../components/ui';

const team = [
  { name: 'Andrey Quiceno', role: 'Administrador · Backend', skills: ['FastAPI', 'PostgreSQL', 'Docker', 'DevOps'], github: 'github.com/aquiceno' },
  { name: 'Jhorman Gómez', role: 'Product Owner · Scrum Master', skills: ['Scrum', 'React', 'FastAPI', 'Product Management'], github: 'github.com/jgomez' },
  { name: 'Iván Ausecha', role: 'Frontend Engineer', skills: ['React', 'TypeScript', 'Tailwind CSS', 'UX'], github: 'github.com/iausecha' },
  { name: 'David Enciso', role: 'Backend Engineer', skills: ['Python', 'SQLAlchemy', 'JWT', 'Redis'], github: 'github.com/denciso' },
];

const stack = [
  { cat: 'Frontend', items: ['React 19', 'TypeScript', 'Tailwind CSS v4', 'Zustand'] },
  { cat: 'Backend', items: ['FastAPI', 'Python 3.12', 'SQLAlchemy', 'Alembic'] },
  { cat: 'Base de datos', items: ['PostgreSQL 16', 'Redis'] },
  { cat: 'Seguridad', items: ['JWT', 'bcrypt', 'RBAC', 'Trivy'] },
  { cat: 'Infraestructura', items: ['Docker', 'GitHub Actions', 'Ruff', 'Pytest'] },
  { cat: 'Inteligencia Artificial', items: ['Ollama', 'Whisper', 'TTS', 'Modelos multimodales'] },
];

export default function About() {
  const { navigate } = useApp();

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#F9FAFB]">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 px-6 h-14 bg-[#0A0B0E]/90 backdrop-blur-sm border-b border-white/6">
        <button onClick={() => navigate({ page: 'landing' })} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#9CA3AF] transition-colors">
          <ArrowLeft size={14} /> Volver
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center"><Layers size={13} className="text-white" /></div>
          <span className="font-bold text-sm">DashNode</span>
        </div>
        <div className="flex-1" />
        <Button size="sm" onClick={() => navigate({ page: 'login' })}>Ingresar</Button>
      </nav>

      <div className="pt-24 pb-16 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="blue" className="mb-4">Proyecto Integrador II</Badge>
          <h1 className="text-3xl font-bold mb-4">Acerca de DashNode</h1>
          <p className="text-[#9CA3AF] max-w-lg mx-auto leading-relaxed">
            DashNode es una plataforma SaaS conceptual desarrollada como Proyecto Integrador II en la Universidad del Valle, Ingeniería de Sistemas y Computación.
          </p>
        </div>

        {/* Context */}
        <div className="bg-[#12131C] border border-white/6 rounded-2xl p-6 mb-8">
          <h2 className="font-bold text-[#F9FAFB] mb-4">Contexto académico</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: 'Institución', value: 'Universidad del Valle' },
              { label: 'Programa', value: 'Ingeniería de Sistemas y Computación' },
              { label: 'Curso', value: 'Proyecto Integrador II' },
              { label: 'Versión', value: '1.0 conceptual' },
              { label: 'Período', value: '2026' },
              { label: 'Metodología', value: 'Scrum · 3 MVPs' },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs text-[#6B7280] mb-0.5">{f.label}</p>
                <p className="text-sm font-medium text-[#F9FAFB]">{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <h2 className="font-bold text-[#F9FAFB] mb-4">Equipo de desarrollo</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {team.map(m => (
            <div key={m.name} className="bg-[#12131C] border border-white/6 rounded-xl p-4 flex items-start gap-3">
              <Avatar name={m.name} size={40} />
              <div className="flex-1">
                <p className="font-semibold text-[#F9FAFB]">{m.name}</p>
                <p className="text-xs text-[#9CA3AF] mb-2">{m.role}</p>
                <div className="flex flex-wrap gap-1">
                  {m.skills.map(s => <Badge key={s} variant="gray">{s}</Badge>)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stack */}
        <h2 className="font-bold text-[#F9FAFB] mb-4">Stack tecnológico</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {stack.map(s => (
            <div key={s.cat} className="bg-[#12131C] border border-white/6 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-2">{s.cat}</p>
              <div className="flex flex-wrap gap-1.5">
                {s.items.map(i => <Badge key={i} variant="gray">{i}</Badge>)}
              </div>
            </div>
          ))}
        </div>

        {/* MVPs description */}
        <h2 className="font-bold text-[#F9FAFB] mb-4">Entregables progresivos</h2>
        <div className="space-y-3">
          {[
            { mvp: 'MVP 1', title: 'Administración y Colaboración', desc: 'Usuarios, roles, proyectos, equipos, disponibilidad, algoritmo de franjas libres y reuniones con Google Calendar.', color: '#3B82F6' },
            { mvp: 'MVP 2', title: 'Scrum e IA de Voz', desc: 'Product Backlog, épicas, historias de usuario, sprints, tablero Kanban, documentación técnica e IA de voz con Whisper y TTS.', color: '#8B5CF6' },
            { mvp: 'MVP 3', title: 'Diagnóstico Multimodal y Conocimiento', desc: 'Análisis de imágenes y video con modelos multimodales, RAG sobre documentación, base de conocimiento técnico y métricas avanzadas de IA.', color: '#EC4899' },
          ].map(m => (
            <div key={m.mvp} className="bg-[#12131C] border border-white/6 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: m.color }} />
              <div className="pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold" style={{ color: m.color }}>{m.mvp}</span>
                  <span className="font-semibold text-[#F9FAFB] text-sm">{m.title}</span>
                </div>
                <p className="text-xs text-[#9CA3AF] leading-relaxed">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button onClick={() => navigate({ page: 'login' })} size="lg">Explorar DashNode</Button>
        </div>
      </div>
    </div>
  );
}
