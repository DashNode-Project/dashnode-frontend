import { BookOpen, Bot, Bug, FolderKanban, ListChecks, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ProductModule {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

/** Summary of the main modules shown on the public presentation page (HU_DN_01_01, 2.3). */
export const PRODUCT_MODULES: readonly ProductModule[] = [
  {
    id: 'projects',
    title: 'Proyectos',
    description: 'Proyectos, equipos y responsables organizados en un solo lugar.',
    icon: FolderKanban,
  },
  {
    id: 'backlog',
    title: 'Backlog y sprints',
    description:
      'Historias de usuario, épicas y sprints para planificar y dar seguimiento al trabajo.',
    icon: ListChecks,
  },
  {
    id: 'meetings',
    title: 'Reuniones',
    description: 'Disponibilidad del equipo y agendamiento de reuniones.',
    icon: Video,
  },
  {
    id: 'docs',
    title: 'Documentación',
    description: 'Documentación técnica y funcional del proyecto, accesible para todo el equipo.',
    icon: BookOpen,
  },
  {
    id: 'issues',
    title: 'Issues',
    description: 'Trazabilidad de problemas y de sus soluciones hasta la tarea de origen.',
    icon: Bug,
  },
  {
    id: 'ai',
    title: 'Asistente de IA',
    description: 'Consultas y apoyo al diagnóstico técnico con inteligencia artificial.',
    icon: Bot,
  },
];
