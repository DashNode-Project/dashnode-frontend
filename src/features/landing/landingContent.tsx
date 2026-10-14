import { BarChart2, Bug, FileText, GitBranch, Users, Video, Zap } from 'lucide-react';

function FolderIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export interface LandingFeature {
  icon: React.ReactNode;
  label: string;
  desc: string;
}

export const LANDING_FEATURES: readonly LandingFeature[] = [
  {
    icon: <FolderIcon />,
    label: 'Gestión de Proyectos',
    desc: 'Proyectos, épicas, equipos y responsables en una sola vista.',
  },
  {
    icon: <GitBranch size={20} />,
    label: 'Motor Scrum',
    desc: 'Backlog, sprints, kanban y velocidad de equipo integrados.',
  },
  {
    icon: <Users size={20} />,
    label: 'Equipos',
    desc: 'Gestión de roles, permisos y carga de trabajo por desarrollador.',
  },
  {
    icon: <Video size={20} />,
    label: 'Reuniones',
    desc: 'Disponibilidad, agendamiento y Google Calendar integrado.',
  },
  {
    icon: <FileText size={20} />,
    label: 'Documentación',
    desc: 'Base de conocimiento técnico y documentación funcional versionada.',
  },
  {
    icon: <BarChart2 size={20} />,
    label: 'Indicadores',
    desc: 'Métricas de sprint, velocidad y burndown en tiempo real.',
  },
  {
    icon: <Bug size={20} />,
    label: 'Issues y Fixes',
    desc: 'Trazabilidad de problemas, evidencias y soluciones por tarea.',
  },
  {
    icon: <Zap size={20} />,
    label: 'Inteligencia Artificial',
    desc: 'IA de voz, análisis multimodal, RAG y diagnóstico técnico.',
  },
];

export interface LandingMvp {
  number: string;
  title: string;
  desc: string;
  items: readonly string[];
  color: string;
  status: string;
}

export const LANDING_MVPS: readonly LandingMvp[] = [
  {
    number: 'MVP 1',
    title: 'Administración y Colaboración',
    desc: 'Gestión de usuarios, proyectos, equipos, disponibilidad y reuniones. Base operativa completa.',
    items: [
      'Usuarios y roles (RBAC)',
      'Proyectos y equipos',
      'Disponibilidad y agendamiento',
      'Reuniones con Google Calendar',
    ],
    color: '#3B82F6',
    status: 'Implementado',
  },
  {
    number: 'MVP 2',
    title: 'Scrum e Inteligencia de Voz',
    desc: 'Product Backlog, sprints, kanban, documentación, métricas e IA de voz integrada.',
    items: [
      'Product Backlog y épicas',
      'Sprints y tablero Kanban',
      'Documentación técnica',
      'IA de voz (Whisper + TTS)',
    ],
    color: '#8B5CF6',
    status: 'En desarrollo',
  },
  {
    number: 'MVP 3',
    title: 'Diagnóstico Multimodal',
    desc: 'Análisis de imágenes y video, RAG, base de conocimiento y métricas avanzadas de IA.',
    items: [
      'Análisis de imágenes (multimodal)',
      'Procesamiento de video',
      'RAG sobre documentación',
      'Métricas de IA y calidad',
    ],
    color: '#EC4899',
    status: 'Planificado',
  },
];

export const LANDING_TRACEABILITY: readonly { label: string; color: string }[] = [
  { label: 'Proyecto', color: '#3B82F6' },
  { label: 'Épica', color: '#8B5CF6' },
  { label: 'Historia de Usuario', color: '#10B981' },
  { label: 'Tarea', color: '#F59E0B' },
  { label: 'Fix / Problema', color: '#EF4444' },
  { label: 'Evidencia', color: '#EC4899' },
];

export const AUTH_PANEL_BULLETS = [
  'Proyectos, épicas y sprints',
  'Disponibilidad y agendamiento',
  'Tablero Kanban y métricas',
  'IA multimodal y RAG',
] as const;
