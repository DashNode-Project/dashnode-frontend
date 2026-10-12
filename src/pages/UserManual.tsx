// @ts-nocheck
import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Users, FolderOpen, CheckSquare, Calendar, Clock, AlertTriangle, Brain, GitBranch, Search } from 'lucide-react';
import { AppShell } from '../components/Layout';

const SECTIONS = [
  {
    id: 'intro',
    title: 'Introducción',
    icon: <BookOpen size={16} />,
    content: `DashNode es una plataforma integral de gestión de proyectos de software, pensada para equipos que trabajan con metodología Scrum y necesitan trazabilidad completa desde la épica hasta la resolución de errores.

Este manual está dirigido a Gerentes y Desarrolladores. No cubre el módulo de administración de usuarios, que es exclusivo del rol Administrador.`,
  },
  {
    id: 'roles',
    title: 'Roles y permisos',
    icon: <Users size={16} />,
    subsections: [
      {
        title: 'Gerente de Proyecto',
        content: `El Gerente tiene acceso completo a todos los módulos de sus proyectos:
• Crear, editar y archivar proyectos
• Gestionar el equipo (agregar/retirar desarrolladores)
• Crear y priorizar épicas, historias de usuario y sprints
• Asignar tareas a desarrolladores
• Crear reuniones y ver disponibilidad del equipo
• Aprobar conocimiento generado por IA
• Ver métricas de IA, auditoría y pipeline DevOps
• Gestionar fixes: asignar, autorizar costos, cerrar`,
      },
      {
        title: 'Desarrollador',
        content: `El Desarrollador accede a sus proyectos y su trabajo asignado:
• Ver proyectos en los que participa
• Consultar el backlog y sprint activo
• Actualizar estado de sus tareas (en Kanban o en Mis Tareas)
• Crear y reportar issues y fixes
• Agregar evidencias (capturas, logs, videos) a los fixes
• Validar propuestas de la IA
• Ver y proponer entradas de conocimiento (requieren aprobación)
• Registrar su disponibilidad en su Perfil`,
      },
    ],
  },
  {
    id: 'projects',
    title: 'Proyectos',
    icon: <FolderOpen size={16} />,
    content: `Accede desde el menú lateral → Proyectos.`,
    subsections: [
      {
        title: 'Crear un proyecto',
        content: `1. Haz clic en "Nuevo Proyecto"
2. Ingresa nombre, descripción, objetivo y fechas
3. Selecciona el equipo de trabajo
4. Haz clic en "Crear proyecto"

El proyecto creado aparece en tu lista con estado "Planificación". El gerente puede comenzar a agregar épicas e historias de usuario de inmediato.`,
      },
      {
        title: 'Acceder al workspace del proyecto',
        content: `Haz clic en el nombre del proyecto desde la lista. Verás todas las pestañas disponibles:
• Backlog — Épicas y Historias de Usuario
• Sprint — Sprint activo con sus HU, tareas y DoD/DoR
• Kanban — Tablero de tareas arrastrable
• Reuniones — Sesiones del proyecto
• Métricas — Velocidad, burndown, carga de trabajo
• Issues / Fixes — Problemas y soluciones con evidencias
• Conocimiento — Base de conocimiento con aprobación
• DevOps — Pipeline CI/CD y quality gates
• Documentos — Documentación técnica y funcional
• IA — Chat contextual con datos del proyecto`,
      },
      {
        title: 'Exportar e importar proyecto',
        content: `Desde el workspace encontrarás los botones "Exportar" e "Importar":

EXPORTAR: Genera dos archivos JSON descargables:
• project_info.js — datos del proyecto, equipo, objetivos, arquitectura
• backlog.js — épicas, historias, tareas, sprints, DoD/DoR

IMPORTAR: Sube un archivo JSON con el formato del backlog o del proyecto. Solo se puede sobreescribir si el proyecto no tiene sprints activos. Útil para automatizar la carga inicial desde otra herramienta.

Para obtener el formato base vacío, usa los botones "Descargar formato base".`,
      },
    ],
  },
  {
    id: 'scrum',
    title: 'Scrum: Épicas, HU y Sprints',
    icon: <CheckSquare size={16} />,
    subsections: [
      {
        title: 'Épicas',
        content: `Una Épica agrupa historias de usuario relacionadas. Para crear una:
1. Ve a la pestaña Backlog del proyecto
2. Haz clic en "Nueva Épica"
3. Asigna nombre, descripción y color
4. Guarda

Las épicas pueden estar en estado: Planificada, Activa, Completada.`,
      },
      {
        title: 'Historias de Usuario (HU)',
        content: `Las HU son unidades de trabajo valorables para el usuario. Cada HU tiene:
• Descripción en formato "Como [actor] quiero [función] para [beneficio]"
• Criterios de Aceptación (AC): condiciones que determinan si la HU está correctamente implementada
• Definición de Listo (DoR): condiciones que deben cumplirse ANTES de iniciar la HU
• Definición de Hecho (DoD): condiciones que deben cumplirse para considerar la HU COMPLETADA
• Puntos de historia (esfuerzo estimado)
• Prioridad: Critical, High, Medium, Low

Para agregar una HU, haz clic en "Nueva HU" dentro de la épica correspondiente.`,
      },
      {
        title: 'Sprints',
        content: `Un Sprint es un periodo de trabajo de duración fija (generalmente 1-2 semanas). Para crear un sprint:
1. Ve a la pestaña Sprint del proyecto
2. Haz clic en "Nuevo Sprint"
3. Define nombre, objetivo, fechas de inicio y fin
4. Arrastra HU desde el Backlog hacia el Sprint

Vista del Sprint: muestra cada HU con su DoR, DoD y las tareas asociadas. El progreso de la HU se calcula en base al avance de sus tareas.`,
      },
      {
        title: 'Tareas',
        content: `Cada HU puede tener múltiples tareas técnicas. Las tareas son el nivel de granularidad más bajo. Tienen:
• Título y descripción técnica
• Responsable (debe pertenecer al proyecto)
• Horas estimadas y horas registradas
• Estado: Por hacer → En progreso → Code Review → Testing → Completado (o Bloqueado)

El Desarrollador puede actualizar el estado de sus tareas directamente desde el Kanban o desde "Mis Tareas".`,
      },
    ],
  },
  {
    id: 'kanban',
    title: 'Tablero Kanban',
    icon: <CheckSquare size={16} />,
    content: `El Kanban se accede desde la pestaña "Kanban" del workspace del proyecto.

Columnas disponibles:
1. POR HACER — Tareas listas para comenzar
2. EN PROGRESO — Tareas actualmente en desarrollo
3. CODE REVIEW — Esperando revisión de código
4. TESTING — En fase de pruebas
5. COMPLETADO — Tareas finalizadas
6. BLOQUEADO — Tareas con impedimentos

Para mover una tarea: arrástrala y suéltala en la columna destino. El estado se actualiza automáticamente.

Puedes filtrar por miembro del equipo o por sprint usando los selectores de la parte superior.`,
  },
  {
    id: 'meetings',
    title: 'Reuniones y Disponibilidad',
    icon: <Calendar size={16} />,
    subsections: [
      {
        title: 'Crear una reunión',
        content: `Desde el menú lateral → Reuniones o desde la pestaña "Reuniones" del workspace:
1. Haz clic en "Nueva Reunión"
2. Ingresa título, fecha, hora, duración y enlace de Meet
3. Selecciona participantes
4. Guarda — aparecerá en el Calendario

El Gerente puede agregar resúmenes después de cada reunión. Los resúmenes pueden ser públicos (visibles al equipo) o privados.`,
      },
      {
        title: 'Calcular disponibilidad',
        content: `La sección Disponibilidad permite encontrar franjas horarias libres comunes entre los miembros del equipo:

1. Ve a Disponibilidad en el menú lateral
2. Selecciona los participantes, fecha mínima, hora de inicio y fin, y duración mínima de la reunión
3. Haz clic en "Calcular Disponibilidad"
4. El sistema muestra las franjas disponibles en modo visual o lista
5. Selecciona una franja → se abre un overlay para nombrar la reunión y agregar el enlace
6. Haz clic en "Crear Reunión" → aparece en el Calendario

Para registrar tu disponibilidad semanal, ve a tu Perfil → sección Disponibilidad.`,
      },
    ],
  },
  {
    id: 'fixes',
    title: 'Issues y Fixes',
    icon: <AlertTriangle size={16} />,
    subsections: [
      {
        title: '¿Cuándo crear un Issue vs un Fix?',
        content: `• Issue: Problema detectado que aún no tiene solución definida. Se reporta durante desarrollo o QA.
• Fix: Proceso completo de corrección. Incluye evidencias, análisis de IA, solución propuesta y validación.

Los Issues pueden convertirse en Fixes. Un Fix puede estar asociado a una HU, tarea o Issue.`,
      },
      {
        title: 'Ciclo de vida de un Fix',
        content: `OPEN → IN PROGRESS → BLOCKED (si hay impedimentos) → RESOLVED → CLOSED

Para crear un Fix:
1. Ve a la pestaña "Issues / Fixes" del proyecto
2. Haz clic en "Nuevo Fix"
3. Ingresa título, descripción, prioridad y HU/tarea relacionada
4. Adjunta evidencias (capturas, logs, videos)
5. Usa "Analizar con IA" para obtener diagnóstico automático
6. Valida la propuesta de la IA (no se aplica automáticamente)
7. Implementa la solución y documenta el resultado
8. Marca el Fix como Resuelto`,
      },
      {
        title: 'Adjuntar evidencias',
        content: `Un Fix puede tener múltiples evidencias de distintos tipos:
• Captura / Imagen: muestra el error visualmente
• Video: máximo 15 segundos y 20 MB. El sistema valida antes de cargar.
• Log: texto copiado de la consola o servidor
• Enlace: URL a repositorio, ticket externo, etc.
• Texto: descripción del comportamiento esperado vs actual

Cada evidencia puede analizarse con IA individualmente.`,
      },
      {
        title: 'Análisis de IA en Fixes',
        content: `Al seleccionar "Analizar con IA" sobre una evidencia, el sistema simula el siguiente flujo:

Evidencia → Modelo Multimodal → Análisis

El diagnóstico incluye:
• Diagnóstico general
• Evidencia observada
• Posibles causas (lista estructurada)
• Pasos sugeridos (lista ordenada)
• Recomendación

IMPORTANTE: La IA solo propone. El desarrollador debe validar y aprobar cada sugerencia antes de implementar.`,
      },
    ],
  },
  {
    id: 'knowledge',
    title: 'Base de Conocimiento',
    icon: <Brain size={16} />,
    content: `La base de conocimiento almacena aprendizajes técnicos del equipo. Accede desde la pestaña "Conocimiento" del workspace.

Estados del conocimiento:
• PENDIENTE: Propuesto pero no revisado. Puede ser generado por IA o por un developer.
• APROBADO: Revisado y validado por el Gerente. Se considera conocimiento oficial.
• RECHAZADO: No es correcto o no aplica al proyecto.

REGLA FUNDAMENTAL: El conocimiento generado por IA nunca se aprueba automáticamente. El Gerente es quien puede aprobarlo después de revisarlo.

Para proponer una entrada:
1. Haz clic en "Nueva Entrada"
2. Completa título, pregunta, respuesta, fuente y categoría
3. Guarda — queda en estado PENDIENTE para revisión del Gerente`,
  },
  {
    id: 'devops',
    title: 'DevOps y CI/CD',
    icon: <GitBranch size={16} />,
    content: `La pestaña DevOps muestra el estado del pipeline de integración continua del proyecto.

Pipeline de referencia:
Git Push → Pull Request → Lint → Unit Tests → Integration Tests → SonarQube → Build → Deploy

Quality Gates verificados:
• ESLint / Ruff — calidad de código
• MyPy / TypeScript — tipos estáticos
• Pytest / Jest — cobertura de pruebas
• SonarQube — análisis de código
• Trivy — escaneo de seguridad
• Docker Build — construcción del artefacto
• Deploy Staging — despliegue controlado

Los estados posibles de cada paso: Pendiente, Ejecutando, Exitoso, Fallido.

También puedes ver el historial de Pull Requests con su estado, descripción y la HU asociada.`,
  },
  {
    id: 'ai',
    title: 'Asistente de IA',
    icon: <Brain size={16} />,
    content: `DashNode incluye un asistente de IA accesible de dos formas:

1. Widget flotante (botón violeta, esquina inferior derecha): disponible en toda la app. Responde preguntas generales sobre tus proyectos, tareas y reuniones. Soporta entrada de texto y voz simulada.

2. Pestaña "IA" en el workspace del proyecto: chat contextual con datos del proyecto. Útil para preguntas sobre el sprint, equipo, métricas e issues.

RESTRICCIONES DE IA — La IA de DashNode NO puede:
• Modificar código automáticamente
• Aprobar conocimiento por sí misma
• Reasignar responsabilidades críticas
• Eliminar datos
• Desplegar cambios

Toda acción crítica requiere intervención humana.

MODALIDADES disponibles en el módulo de Fixes:
• Texto: pregunta o descripción del problema
• Imagen: análisis de capturas y screenshots
• Video: análisis frame-a-frame de grabaciones de pantalla (máx 15s / 20MB)`,
  },
  {
    id: 'search',
    title: 'Búsqueda y Navegación',
    icon: <Search size={16} />,
    content: `Búsqueda global: Haz clic en el buscador de la barra superior o presiona Ctrl+K (Cmd+K en Mac).

Puedes buscar:
• Proyectos
• Historias de usuario
• Tareas
• Fixes
• Documentos
• Conocimiento
• Usuarios

Los resultados se agrupan por categoría. Al hacer clic en un resultado navegas directamente al elemento.

Mis Tareas: acceso rápido desde el menú lateral para ver todas tus tareas asignadas sin navegar proyecto por proyecto.`,
  },
];

export default function UserManual() {
  const [expanded, setExpanded] = useState<string[]>(['intro', 'roles']);
  const [search, setSearch] = useState('');

  const toggle = (id: string) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filtered = search
    ? SECTIONS.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        (s.content || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.subsections || []).some(ss => ss.title.toLowerCase().includes(search.toLowerCase()) || ss.content.toLowerCase().includes(search.toLowerCase()))
      )
    : SECTIONS;

  return (
    <AppShell title="Manual de Usuario">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <BookOpen size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#F9FAFB]">Manual de Usuario</h1>
            <p className="text-sm text-[#6B7280]">DashNode — Guía para Gerentes y Desarrolladores</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar en el manual..."
            className="w-full bg-[#1E1F2B] border border-white/8 rounded-xl h-10 pl-9 pr-4 text-sm text-[#F9FAFB] placeholder:text-[#4B5563] focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Quick links */}
        {!search && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {SECTIONS.filter(s => ['roles', 'scrum', 'fixes', 'ai'].includes(s.id)).map(s => (
              <button
                key={s.id}
                onClick={() => { setExpanded(prev => prev.includes(s.id) ? prev : [...prev, s.id]); document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth' }); }}
                className="bg-[#1E1F2B] border border-white/8 rounded-xl p-3 text-left hover:bg-white/5 transition-colors"
              >
                <div className="text-[#6B7280] mb-1">{s.icon}</div>
                <p className="text-xs font-medium text-[#F9FAFB]">{s.title}</p>
              </button>
            ))}
          </div>
        )}

        {/* Sections */}
        <div className="space-y-2">
          {filtered.map(section => {
            const isOpen = expanded.includes(section.id);
            return (
              <div key={section.id} id={`section-${section.id}`} className="bg-[#12131C] border border-white/8 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/3 transition-colors text-left"
                  onClick={() => toggle(section.id)}
                >
                  <span className="text-[#6B7280] shrink-0">{section.icon}</span>
                  <span className="flex-1 text-sm font-medium text-[#F9FAFB]">{section.title}</span>
                  {isOpen ? <ChevronDown size={16} className="text-[#6B7280]" /> : <ChevronRight size={16} className="text-[#6B7280]" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-white/6 pt-4">
                    {section.content && (
                      <p className="text-sm text-[#D1D5DB] leading-relaxed whitespace-pre-line mb-4">{section.content}</p>
                    )}
                    {section.subsections?.map((sub, i) => (
                      <div key={i} className="mb-5 last:mb-0">
                        <h3 className="text-sm font-semibold text-[#F9FAFB] mb-2 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                          {sub.title}
                        </h3>
                        <p className="text-sm text-[#9CA3AF] leading-relaxed whitespace-pre-line pl-7">{sub.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#6B7280]">
            <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
            <p>Sin resultados para "{search}"</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 border border-white/6 rounded-xl p-4 text-center">
          <p className="text-xs text-[#4B5563]">DashNode v3.0 — Manual de Usuario para Gerentes y Desarrolladores</p>
          <p className="text-xs text-[#4B5563] mt-1">Para soporte de administración, contacta al administrador del sistema.</p>
        </div>
      </div>
    </AppShell>
  );
}
