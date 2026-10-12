import React, { useState } from 'react';
import { ArrowRight, Layers, Users, GitBranch, Video, FileText, BarChart2, Bug, Zap, ChevronRight, Shield, Clock, Target, Activity } from 'lucide-react';
import { useApp } from '../store';
import { Button } from '../components/ui';

const features = [
  { icon: <FolderIcon />, label: 'Gestión de Proyectos', desc: 'Proyectos, épicas, equipos y responsables en una sola vista.' },
  { icon: <GitBranch size={20} />, label: 'Motor Scrum', desc: 'Backlog, sprints, kanban y velocidad de equipo integrados.' },
  { icon: <Users size={20} />, label: 'Equipos', desc: 'Gestión de roles, permisos y carga de trabajo por desarrollador.' },
  { icon: <Video size={20} />, label: 'Reuniones', desc: 'Disponibilidad, agendamiento y Google Calendar integrado.' },
  { icon: <FileText size={20} />, label: 'Documentación', desc: 'Base de conocimiento técnico y documentación funcional versionada.' },
  { icon: <BarChart2 size={20} />, label: 'Indicadores', desc: 'Métricas de sprint, velocidad y burndown en tiempo real.' },
  { icon: <Bug size={20} />, label: 'Issues y Fixes', desc: 'Trazabilidad de problemas, evidencias y soluciones por tarea.' },
  { icon: <Zap size={20} />, label: 'Inteligencia Artificial', desc: 'IA de voz, análisis multimodal, RAG y diagnóstico técnico.' },
];

const mvps = [
  {
    number: 'MVP 1',
    title: 'Administración y Colaboración',
    desc: 'Gestión de usuarios, proyectos, equipos, disponibilidad y reuniones. Base operativa completa.',
    items: ['Usuarios y roles (RBAC)', 'Proyectos y equipos', 'Disponibilidad y agendamiento', 'Reuniones con Google Calendar'],
    color: '#3B82F6',
    status: 'Implementado',
  },
  {
    number: 'MVP 2',
    title: 'Scrum e Inteligencia de Voz',
    desc: 'Product Backlog, sprints, kanban, documentación, métricas e IA de voz integrada.',
    items: ['Product Backlog y épicas', 'Sprints y tablero Kanban', 'Documentación técnica', 'IA de voz (Whisper + TTS)'],
    color: '#8B5CF6',
    status: 'En desarrollo',
  },
  {
    number: 'MVP 3',
    title: 'Diagnóstico Multimodal',
    desc: 'Análisis de imágenes y video, RAG, base de conocimiento y métricas avanzadas de IA.',
    items: ['Análisis de imágenes (multimodal)', 'Procesamiento de video', 'RAG sobre documentación', 'Métricas de IA y calidad'],
    color: '#EC4899',
    status: 'Planificado',
  },
];

const traceability = [
  { label: 'Proyecto', color: '#3B82F6' },
  { label: 'Épica', color: '#8B5CF6' },
  { label: 'Historia de Usuario', color: '#10B981' },
  { label: 'Tarea', color: '#F59E0B' },
  { label: 'Fix / Problema', color: '#EF4444' },
  { label: 'Evidencia', color: '#EC4899' },
];

function FolderIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

export default function Landing() {
  const { navigate } = useApp();

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#F9FAFB]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14 bg-[#0A0B0E]/90 backdrop-blur-sm border-b border-white/6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
            <Layers size={16} className="text-white" />
          </div>
          <span className="font-bold text-sm">DashNode</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-[#9CA3AF]">
          <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Capacidades</button>
          <button onClick={() => document.getElementById('mvps')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">MVPs</button>
          <button onClick={() => navigate({ page: 'about' })} className="hover:text-white transition-colors">Acerca de</button>
        </div>
        <Button size="sm" onClick={() => navigate({ page: 'login' })}>Ingresar</Button>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute top-32 left-1/3 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 text-xs text-blue-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Proyecto Integrador II · Universidad del Valle
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#F9FAFB] leading-tight mb-5">
            Gestión inteligente de<br />
            <span className="text-blue-400">proyectos de software</span>
          </h1>
          <p className="text-lg text-[#9CA3AF] max-w-xl mx-auto mb-8 leading-relaxed">
            Centraliza proyectos, equipos, Scrum, reuniones, documentación y diagnóstico con IA en una plataforma profesional diseñada para equipos de desarrollo.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button size="lg" onClick={() => navigate({ page: 'login' })} iconRight={<ArrowRight size={16} />}>
              Ingresar a DashNode
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Conocer la plataforma
            </Button>
          </div>
        </div>

        {/* Fake app preview */}
        <div className="relative max-w-4xl mx-auto mt-16">
          <div className="bg-[#12131C] border border-white/8 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 bg-[#0A0B0E] border-b border-white/6">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="ml-2 text-xs text-[#6B7280]">DashNode · Workspace · DashNode Platform</span>
            </div>
            <div className="flex">
              <div className="w-44 bg-[#0A0B0E] border-r border-white/6 p-3 flex flex-col gap-1">
                {['Dashboard', 'Usuarios', 'Proyectos', 'Reuniones', 'Calendario'].map((item, i) => (
                  <div key={item} className={`h-7 rounded-md px-2 flex items-center text-xs ${i === 0 ? 'bg-blue-500/15 text-blue-400' : 'text-[#6B7280]'}`}>{item}</div>
                ))}
              </div>
              <div className="flex-1 p-4">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[['Proyectos', '3', '#3B82F6'], ['Reuniones', '8', '#8B5CF6'], ['Tareas activas', '12', '#10B981'], ['Issues', '3', '#F59E0B']].map(([label, val, color]) => (
                    <div key={label} className="bg-[#1E1F2B] rounded-lg p-3 border border-white/6">
                      <p className="text-xs text-[#6B7280]">{label}</p>
                      <p className="text-xl font-bold mt-1" style={{ color }}>{val}</p>
                    </div>
                  ))}
                </div>
                <div className="h-24 bg-[#1E1F2B] rounded-lg border border-white/6 flex items-center justify-center">
                  <span className="text-xs text-[#6B7280]">Actividad reciente · Sprint 2 activo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-blue-400 uppercase tracking-widest mb-3">Capacidades</p>
            <h2 className="text-3xl font-bold text-[#F9FAFB]">Todo lo que tu equipo necesita</h2>
            <p className="text-[#9CA3AF] mt-3 max-w-lg mx-auto">Desde la planificación hasta el diagnóstico técnico, DashNode cubre todo el ciclo de vida del proyecto.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map(f => (
              <div key={f.label} className="bg-[#12131C] border border-white/6 rounded-xl p-4 hover:border-white/12 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3 group-hover:bg-blue-500/15 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-sm text-[#F9FAFB] mb-1">{f.label}</h3>
                <p className="text-xs text-[#9CA3AF] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MVPs */}
      <section id="mvps" className="py-20 px-6 bg-[#070809]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-3">Roadmap</p>
            <h2 className="text-3xl font-bold text-[#F9FAFB]">Tres MVPs, una plataforma</h2>
            <p className="text-[#9CA3AF] mt-3">Implementación progresiva con entregas de valor desde el primer sprint.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {mvps.map(mvp => (
              <div key={mvp.number} className="bg-[#12131C] border border-white/6 rounded-xl p-5 hover:border-white/12 transition-colors relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: mvp.color }} />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full border" style={{ color: mvp.color, borderColor: `${mvp.color}30`, background: `${mvp.color}10` }}>{mvp.number}</span>
                  <span className="text-xs text-[#6B7280]">{mvp.status}</span>
                </div>
                <h3 className="font-bold text-[#F9FAFB] mb-2">{mvp.title}</h3>
                <p className="text-xs text-[#9CA3AF] mb-4 leading-relaxed">{mvp.desc}</p>
                <ul className="flex flex-col gap-2">
                  {mvp.items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                      <span className="w-1 h-1 rounded-full shrink-0" style={{ background: mvp.color }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Traceability */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-medium text-emerald-400 uppercase tracking-widest mb-3">Trazabilidad</p>
          <h2 className="text-3xl font-bold text-[#F9FAFB] mb-4">Jerarquía conectada de extremo a extremo</h2>
          <p className="text-[#9CA3AF] mb-12 max-w-lg mx-auto">Cada evidencia de problema se rastrea hasta su proyecto de origen. Sin información perdida.</p>
          <div className="flex items-center justify-center flex-wrap gap-2">
            {traceability.map((item, i) => (
              <React.Fragment key={item.label}>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center" style={{ borderColor: item.color, background: `${item.color}12` }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  </div>
                  <span className="text-xs font-medium text-[#9CA3AF]" style={{ color: item.color }}>{item.label}</span>
                </div>
                {i < traceability.length - 1 && (
                  <ChevronRight size={16} className="text-[#374151] mb-4" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-[#070809]">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Layers size={28} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-[#F9FAFB] mb-4">Listo para empezar</h2>
          <p className="text-[#9CA3AF] mb-8">Accede con las credenciales de demostración y explora todas las funcionalidades.</p>
          <Button size="lg" onClick={() => navigate({ page: 'login' })} iconRight={<ArrowRight size={16} />} className="mx-auto">
            Ingresar a DashNode
          </Button>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            {[['admin@dashnode.dev', 'admin123', 'Admin'], ['jhorman@dashnode.dev', 'manager123', 'Gerente'], ['ivan@dashnode.dev', 'dev123', 'Dev']].map(([email, pass, role]) => (
              <div key={email} className="bg-[#12131C] border border-white/6 rounded-lg p-3">
                <p className="text-xs font-bold text-[#F9FAFB] mb-1">{role}</p>
                <p className="text-xs text-blue-400 font-mono break-all">{email}</p>
                <p className="text-xs text-[#6B7280] font-mono">{pass}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/6 px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center">
                  <Layers size={13} className="text-white" />
                </div>
                <span className="font-bold text-sm">DashNode</span>
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed">Plataforma inteligente para gestión y seguimiento de proyectos de software.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#F9FAFB] uppercase tracking-wide mb-3">Producto</h4>
              <ul className="flex flex-col gap-2">
                {['Capacidades', 'MVPs', 'Trazabilidad', 'Seguridad'].map(l => (
                  <li key={l} className="text-xs text-[#6B7280] hover:text-[#9CA3AF] cursor-pointer">{l}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#F9FAFB] uppercase tracking-wide mb-3">Equipo</h4>
              <ul className="flex flex-col gap-2">
                {['Andrey Quiceno', 'Jhorman Gómez', 'Iván Ausecha', 'David Enciso'].map(n => (
                  <li key={n} className="text-xs text-[#6B7280]">{n}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#F9FAFB] uppercase tracking-wide mb-3">Institución</h4>
              <ul className="flex flex-col gap-2">
                <li className="text-xs text-[#6B7280]">Universidad del Valle</li>
                <li className="text-xs text-[#6B7280]">Ingeniería de Sistemas y Computación</li>
                <li className="text-xs text-[#6B7280]">Proyecto Integrador II</li>
                <li className="text-xs text-[#6B7280]">v1.0 conceptual</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/6 pt-6 flex items-center justify-between">
            <p className="text-xs text-[#6B7280]">© 2026 DashNode · Universidad del Valle</p>
            <button onClick={() => navigate({ page: 'about' })} className="text-xs text-[#6B7280] hover:text-[#9CA3AF] transition-colors">Acerca del proyecto</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
