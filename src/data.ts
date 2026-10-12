import {
  User, Project, Epic, UserStory, Task, Sprint, Meeting, Document, KnowledgeEntry,
  WeeklyAvailability, Fix, Evidence, AIAnalysis, AuditLog, Notification, AIInteraction, PipelineRun,
} from './types';

const av1: WeeklyAvailability = {
  monday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
  tuesday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
  wednesday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
  thursday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
  friday: [{ start: '09:00', end: '12:00' }],
  saturday: [],
  sunday: [],
};

const av2: WeeklyAvailability = {
  monday: [{ start: '10:00', end: '12:00' }, { start: '14:00', end: '19:00' }],
  tuesday: [{ start: '10:00', end: '12:00' }, { start: '14:00', end: '19:00' }],
  wednesday: [{ start: '14:00', end: '19:00' }],
  thursday: [{ start: '10:00', end: '12:00' }, { start: '14:00', end: '19:00' }],
  friday: [{ start: '10:00', end: '12:00' }, { start: '14:00', end: '17:00' }],
  saturday: [{ start: '10:00', end: '13:00' }],
  sunday: [],
};

const av3: WeeklyAvailability = {
  monday: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
  tuesday: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
  wednesday: [{ start: '08:00', end: '12:00' }],
  thursday: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
  friday: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '16:00' }],
  saturday: [],
  sunday: [],
};

const av4: WeeklyAvailability = {
  monday: [{ start: '09:00', end: '13:00' }, { start: '15:00', end: '19:00' }],
  tuesday: [{ start: '09:00', end: '13:00' }, { start: '15:00', end: '19:00' }],
  wednesday: [{ start: '09:00', end: '13:00' }, { start: '15:00', end: '19:00' }],
  thursday: [{ start: '09:00', end: '13:00' }],
  friday: [{ start: '09:00', end: '13:00' }, { start: '15:00', end: '18:00' }],
  saturday: [{ start: '09:00', end: '12:00' }],
  sunday: [],
};

export const PASSWORDS: Record<string, string> = {
  'andrey@dashnode.dev': 'admin123',
  'jhorman@dashnode.dev': 'manager123',
  'ivan@dashnode.dev': 'dev123',
  'david@dashnode.dev': 'dev123',
  'valentina@dashnode.dev': 'manager123',
  'carlos@dashnode.dev': 'dev123',
};

export const INITIAL_USERS: User[] = [
  {
    id: 'u1', name: 'Andrey', lastName: 'Quiceno', email: 'andrey@dashnode.dev', nickname: 'aquiceno',
    role: 'admin', status: 'active',
    description: 'Administrador de la plataforma DashNode. Gestión global de usuarios, proyectos y configuración del sistema.',
    skills: ['System Administration', 'DevOps', 'Security', 'PostgreSQL', 'Docker'],
    experience: '6 años en ingeniería de software y administración de sistemas.',
    github: 'github.com/aquiceno', linkedin: 'linkedin.com/in/aquiceno',
    projectIds: ['p1', 'p2', 'p3'], lastActivity: '2026-09-29T10:30:00Z', createdAt: '2026-01-15T08:00:00Z', availability: av1,
  },
  {
    id: 'u2', name: 'Jhorman', lastName: 'Gómez', email: 'jhorman@dashnode.dev', nickname: 'jgomez',
    role: 'manager', status: 'active',
    description: 'Product Owner y Gerente de Proyectos. Responsable de la planificación estratégica y gestión del backlog.',
    skills: ['Scrum', 'Product Management', 'Jira', 'React', 'FastAPI'],
    experience: '5 años liderando equipos ágiles de desarrollo de software.',
    github: 'github.com/jgomez', linkedin: 'linkedin.com/in/jgomez',
    projectIds: ['p1', 'p2'], lastActivity: '2026-09-29T09:45:00Z', createdAt: '2026-01-15T08:00:00Z', availability: av2,
  },
  {
    id: 'u3', name: 'Iván', lastName: 'Ausecha', email: 'ivan@dashnode.dev', nickname: 'iausecha',
    role: 'developer', status: 'active',
    description: 'Desarrollador Full-Stack especializado en React y FastAPI. Foco en arquitectura de APIs REST y optimización de rendimiento.',
    skills: ['React', 'TypeScript', 'Python', 'FastAPI', 'PostgreSQL', 'Docker'],
    experience: '4 años de experiencia en desarrollo full-stack.',
    github: 'github.com/iausecha', linkedin: 'linkedin.com/in/iausecha',
    projectIds: ['p1', 'p3'], lastActivity: '2026-09-29T08:20:00Z', createdAt: '2026-01-20T09:00:00Z', availability: av3,
  },
  {
    id: 'u4', name: 'David', lastName: 'Enciso', email: 'david@dashnode.dev', nickname: 'denciso',
    role: 'developer', status: 'active',
    description: 'Desarrollador Backend con énfasis en bases de datos y seguridad. Especialista en SQLAlchemy y JWT.',
    skills: ['Python', 'SQLAlchemy', 'JWT', 'PostgreSQL', 'Redis', 'FastAPI'],
    experience: '3 años como desarrollador backend en proyectos empresariales.',
    github: 'github.com/denciso', linkedin: 'linkedin.com/in/denciso',
    projectIds: ['p1', 'p2'], lastActivity: '2026-09-28T16:55:00Z', createdAt: '2026-02-01T10:00:00Z', availability: av4,
  },
  {
    id: 'u5', name: 'Valentina', lastName: 'Restrepo', email: 'valentina@dashnode.dev', nickname: 'vrestrepo',
    role: 'manager', status: 'active',
    description: 'Gerente del proyecto App Móvil. Especialista en análisis de requerimientos y UX.',
    skills: ['UX Design', 'Figma', 'Scrum', 'Business Analysis', 'React'],
    experience: '5 años en gestión de proyectos de software empresarial.',
    github: 'github.com/vrestrepo', linkedin: 'linkedin.com/in/vrestrepo',
    projectIds: ['p3'], lastActivity: '2026-09-28T14:10:00Z', createdAt: '2026-02-10T11:00:00Z', availability: av1,
  },
  {
    id: 'u6', name: 'Carlos', lastName: 'Montoya', email: 'carlos@dashnode.dev', nickname: 'cmontoya',
    role: 'developer', status: 'inactive',
    description: 'Desarrollador Frontend. Actualmente en pausa por motivos académicos.',
    skills: ['React', 'Vue.js', 'CSS', 'JavaScript'],
    experience: '2 años como desarrollador frontend.',
    github: 'github.com/cmontoya', linkedin: '',
    projectIds: ['p2'], lastActivity: '2026-08-15T11:00:00Z', createdAt: '2026-03-01T09:00:00Z', availability: av2,
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1', name: 'DashNode Platform',
    description: 'Plataforma SaaS para gestión integral de proyectos de software con módulos de Scrum, backlog, métricas e IA.',
    objective: 'Centralizar la gestión de proyectos de software para equipos universitarios y empresariales, integrando Scrum, trazabilidad y asistencia de IA.',
    status: 'active', managerId: 'u2', memberIds: ['u1', 'u2', 'u3', 'u4'],
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    startDate: '2026-03-01', endDate: '2026-12-15', createdAt: '2026-02-28T08:00:00Z',
    tags: ['saas', 'full-stack', 'scrum', 'ai'],
  },
  {
    id: 'p2', name: 'Sistema de Inventarios',
    description: 'Sistema web para gestión de inventario empresarial con reportes en tiempo real, alertas de stock y análisis predictivo.',
    objective: 'Digitalizar y optimizar el proceso de gestión de inventarios para una empresa manufacturera.',
    status: 'active', managerId: 'u2', memberIds: ['u2', 'u4', 'u6'],
    meetingLink: 'https://meet.google.com/xyz-uvwx-yza',
    startDate: '2026-04-15', endDate: '2026-10-30', createdAt: '2026-04-10T09:00:00Z',
    tags: ['erp', 'backend', 'reporting'],
  },
  {
    id: 'p3', name: 'App Móvil de Facturación',
    description: 'Aplicación móvil para facturación electrónica con soporte DIAN, generación de PDF y sincronización con sistemas contables.',
    objective: 'Permitir a pequeñas empresas emitir facturas electrónicas desde dispositivos móviles cumpliendo con los estándares DIAN de Colombia.',
    status: 'planning', managerId: 'u5', memberIds: ['u3', 'u5'],
    meetingLink: 'https://teams.microsoft.com/l/meetup-join/abc',
    startDate: '2026-06-01', endDate: '2026-11-30', createdAt: '2026-05-20T10:00:00Z',
    tags: ['mobile', 'react-native', 'dian', 'billing'],
  },
];

export const INITIAL_EPICS: Epic[] = [
  { id: 'e1', projectId: 'p1', name: 'Autenticación y Seguridad', description: 'Implementación de JWT, RBAC y gestión de sesiones', status: 'completed', color: '#10B981' },
  { id: 'e2', projectId: 'p1', name: 'Gestión de Usuarios', description: 'CRUD completo de usuarios con roles y permisos', status: 'active', color: '#3B82F6' },
  { id: 'e3', projectId: 'p1', name: 'Motor Scrum', description: 'Backlog, épicas, HU, sprints y kanban', status: 'active', color: '#8B5CF6' },
  { id: 'e4', projectId: 'p1', name: 'Módulo de Reuniones', description: 'Agendamiento, disponibilidad y Google Calendar', status: 'active', color: '#F59E0B' },
  { id: 'e5', projectId: 'p1', name: 'Inteligencia Artificial', description: 'IA de voz, análisis multimodal y RAG', status: 'active', color: '#EC4899' },
  { id: 'e6', projectId: 'p2', name: 'Gestión de Productos', description: 'CRUD de productos, categorías y proveedores', status: 'active', color: '#3B82F6' },
  { id: 'e7', projectId: 'p2', name: 'Control de Stock', description: 'Entradas, salidas, alertas y ajustes de inventario', status: 'active', color: '#10B981' },
  { id: 'e8', projectId: 'p3', name: 'Factura Electrónica DIAN', description: 'Generación y envío de facturas electrónicas', status: 'planned', color: '#F59E0B' },
  { id: 'e9', projectId: 'p3', name: 'Autenticación Móvil', description: 'Login, registro y gestión de sesión en móvil', status: 'planned', color: '#8B5CF6' },
];

export const INITIAL_STORIES: UserStory[] = [
  // p1 – Epic e1: Autenticación
  {
    id: 's1', epicId: 'e1', projectId: 'p1',
    title: 'Login con JWT', description: 'Como usuario quiero autenticarme con email y contraseña para acceder a la plataforma',
    acceptanceCriteria: ['Login funcional con email/contraseña', 'Token JWT válido por 8 horas', 'Manejo de credenciales inválidas'],
    definitionOfDone: ['Endpoint POST /auth/login implementado', 'JWT generado y validado', 'Tests unitarios pasando', 'Code review aprobado'],
    definitionOfReady: ['Criterios de aceptación claros', 'Diseño de pantalla disponible', 'Dependencias identificadas'],
    priority: 'high', points: 5, status: 'completed', sprintId: 'sp1', assigneeId: 'u4', createdAt: '2026-03-05T08:00:00Z',
  },
  {
    id: 's2', epicId: 'e1', projectId: 'p1',
    title: 'Control de roles (RBAC)', description: 'Como sistema debo restringir acceso basado en el rol del usuario autenticado',
    acceptanceCriteria: ['Admin ve todos los módulos', 'Gerente accede a sus proyectos', 'Desarrollador solo ve sus asignaciones'],
    definitionOfDone: ['Middleware RBAC implementado', 'Pruebas de permisos por rol', 'Documentación actualizada'],
    definitionOfReady: ['Roles definidos', 'Matriz de permisos aprobada'],
    priority: 'critical', points: 8, status: 'completed', sprintId: 'sp1', assigneeId: 'u4', createdAt: '2026-03-05T08:00:00Z',
  },
  {
    id: 's2b', epicId: 'e1', projectId: 'p1',
    title: 'Recuperación de contraseña', description: 'Como usuario quiero poder recuperar mi contraseña vía email cuando la olvide',
    acceptanceCriteria: ['Email de recuperación enviado en < 2 min', 'Token de reseteo expira en 1 hora', 'Nueva contraseña cumple política de seguridad'],
    definitionOfDone: ['Endpoint /auth/forgot-password', 'Email template configurado', 'Test de expiración de token'],
    definitionOfReady: ['Proveedor SMTP definido', 'Template de email diseñado'],
    priority: 'medium', points: 5, status: 'todo', sprintId: 'sp3', createdAt: '2026-03-06T08:00:00Z',
  },
  // p1 – Epic e2: Usuarios
  {
    id: 's3', epicId: 'e2', projectId: 'p1',
    title: 'CRUD de Usuarios', description: 'Como admin quiero crear, editar, deshabilitar y eliminar usuarios de la plataforma',
    acceptanceCriteria: ['Crear usuario con rol', 'Editar perfil', 'Deshabilitar acceso', 'Eliminar con confirmación'],
    definitionOfDone: ['Formulario de usuario completo', 'Tabla con filtros y paginación', 'Tests de integración'],
    definitionOfReady: ['Campos de usuario definidos', 'Wireframes aprobados', 'Roles de validación especificados'],
    priority: 'high', points: 8, status: 'in-progress', sprintId: 'sp2', assigneeId: 'u3', createdAt: '2026-03-10T09:00:00Z',
  },
  {
    id: 's4', epicId: 'e2', projectId: 'p1',
    title: 'Perfil de usuario enriquecido', description: 'Como usuario quiero tener un perfil completo con habilidades, experiencia y disponibilidad',
    acceptanceCriteria: ['Campos de perfil profesional', 'Carga de habilidades', 'Configuración de disponibilidad semanal'],
    definitionOfDone: ['Sección de perfil con todos los campos', 'Guardado de disponibilidad', 'Vista de perfil público'],
    definitionOfReady: ['Diseño de perfil aprobado', 'Campos definidos en API'],
    priority: 'medium', points: 5, status: 'in-progress', sprintId: 'sp2', assigneeId: 'u3', createdAt: '2026-03-12T10:00:00Z',
  },
  {
    id: 's4b', epicId: 'e2', projectId: 'p1',
    title: 'Búsqueda y filtrado de usuarios', description: 'Como admin quiero buscar usuarios por nombre, rol o estado para gestión eficiente',
    acceptanceCriteria: ['Búsqueda en tiempo real por nombre', 'Filtro por rol', 'Filtro por estado (activo/inactivo)'],
    definitionOfDone: ['Buscador con debounce', 'Filtros combinables', 'Paginación correcta con filtros activos'],
    definitionOfReady: ['Criterios de búsqueda definidos'],
    priority: 'low', points: 3, status: 'todo', createdAt: '2026-03-14T09:00:00Z',
  },
  // p1 – Epic e3: Motor Scrum
  {
    id: 's5', epicId: 'e3', projectId: 'p1',
    title: 'Product Backlog', description: 'Como gerente quiero gestionar el backlog con épicas, HU, prioridades y puntos de historia',
    acceptanceCriteria: ['Crear/editar épicas', 'Crear HU con criterios de aceptación', 'Priorización drag-and-drop', 'Filtros por épica y estado'],
    definitionOfDone: ['Backlog funcional', 'Estimación en puntos', 'Filtros operativos'],
    definitionOfReady: ['Épicas del proyecto definidas', 'Template de HU acordado'],
    priority: 'high', points: 13, status: 'in-progress', sprintId: 'sp2', assigneeId: 'u3', createdAt: '2026-03-15T08:00:00Z',
  },
  {
    id: 's5b', epicId: 'e3', projectId: 'p1',
    title: 'Kanban board interactivo', description: 'Como equipo queremos visualizar el avance de las tareas en un tablero kanban con drag-and-drop',
    acceptanceCriteria: ['Columnas por estado de tarea', 'Drag-and-drop entre columnas', 'Filtro por asignado'],
    definitionOfDone: ['Board funcional con DnD', 'Estado se guarda en tiempo real', 'Colores por prioridad'],
    definitionOfReady: ['Estados de tarea definidos', 'Diseño aprobado'],
    priority: 'medium', points: 8, status: 'todo', sprintId: 'sp3', createdAt: '2026-03-16T09:00:00Z',
  },
  {
    id: 's5c', epicId: 'e3', projectId: 'p1',
    title: 'Sprint planning y velocity tracking', description: 'Como gerente quiero planificar sprints y hacer seguimiento de la velocidad del equipo',
    acceptanceCriteria: ['Crear sprint con fechas', 'Asignar HU al sprint', 'Calcular velocity automáticamente'],
    definitionOfDone: ['Creación de sprint funcional', 'Gráfico de burndown', 'Velocity calculada al cierre'],
    definitionOfReady: ['Modelo de sprint definido', 'Fórmula de velocity acordada'],
    priority: 'high', points: 8, status: 'todo', sprintId: 'sp3', createdAt: '2026-03-17T09:00:00Z',
  },
  // p1 – Epic e4: Reuniones
  {
    id: 's6', epicId: 'e4', projectId: 'p1',
    title: 'Algoritmo de disponibilidad', description: 'Como gerente quiero calcular franjas libres comunes entre participantes para agendar reuniones',
    acceptanceCriteria: ['Parser de disponibilidad por texto', 'Cálculo de intersecciones libres', 'Visualización de franjas comunes'],
    definitionOfDone: ['Algoritmo de intersección implementado', 'UI de selección de slots', 'Creación de reunión desde slot seleccionado'],
    definitionOfReady: ['Algoritmo de intersección documentado', 'Formato de disponibilidad definido'],
    priority: 'high', points: 8, status: 'in-progress', sprintId: 'sp2', assigneeId: 'u3', createdAt: '2026-03-18T09:00:00Z',
  },
  {
    id: 's6b', epicId: 'e4', projectId: 'p1',
    title: 'Integración con Google Calendar', description: 'Como usuario quiero sincronizar mis reuniones de DashNode con Google Calendar',
    acceptanceCriteria: ['OAuth 2.0 con Google', 'Reunión se crea en Google Calendar al agendar', 'Cancelación se refleja en ambos sistemas'],
    definitionOfDone: ['OAuth configurado', 'Webhook de sincronización', 'Tests E2E de flujo OAuth'],
    definitionOfReady: ['Credenciales de Google API disponibles', 'Flujo OAuth diseñado'],
    priority: 'low', points: 13, status: 'todo', createdAt: '2026-03-19T09:00:00Z',
  },
  // p1 – Epic e5: IA
  {
    id: 's9', epicId: 'e5', projectId: 'p1',
    title: 'Asistente de IA para proyectos', description: 'Como usuario quiero consultar al asistente de IA sobre el estado de mi proyecto',
    acceptanceCriteria: ['Chat contextual al proyecto', 'Respuestas sobre HU, tareas y métricas', 'Sin historial persistente por sesión'],
    definitionOfDone: ['Integración con API de Claude', 'Contexto de proyecto en prompt', 'UI de chat funcional'],
    definitionOfReady: ['API key disponible', 'Prompt base diseñado'],
    priority: 'high', points: 8, status: 'in-progress', sprintId: 'sp2', assigneeId: 'u3', createdAt: '2026-03-20T08:00:00Z',
  },
  {
    id: 's9b', epicId: 'e5', projectId: 'p1',
    title: 'Análisis multimodal de evidencias', description: 'Como desarrollador quiero que la IA analice capturas y logs para diagnosticar bugs',
    acceptanceCriteria: ['Upload de imagen activa análisis', 'Diagnóstico con posibles causas', 'Validación humana requerida antes de aplicar'],
    definitionOfDone: ['Integración multimodal', 'UI de análisis con feedback', 'Métricas de utilidad registradas'],
    definitionOfReady: ['Modelo multimodal definido', 'Flujo de validación humana diseñado'],
    priority: 'medium', points: 5, status: 'todo', sprintId: 'sp3', createdAt: '2026-03-21T08:00:00Z',
  },
  {
    id: 's9c', epicId: 'e5', projectId: 'p1',
    title: 'RAG sobre base de conocimiento', description: 'Como usuario quiero que la IA use la base de conocimiento del proyecto para respuestas más precisas',
    acceptanceCriteria: ['Documentos indexados en vector store', 'Respuestas referencian fuentes', 'Solo conocimiento aprobado se indexa'],
    definitionOfDone: ['Embeddings generados', 'Búsqueda semántica funcional', 'Fuentes visibles en respuesta'],
    definitionOfReady: ['Vector store seleccionado', 'Proceso de aprobación de KB definido'],
    priority: 'medium', points: 13, status: 'todo', createdAt: '2026-03-22T08:00:00Z',
  },
  // p2 – Inventarios
  {
    id: 's7', epicId: 'e6', projectId: 'p2',
    title: 'Catálogo de productos', description: 'Como administrador quiero gestionar el catálogo de productos del inventario',
    acceptanceCriteria: ['CRUD de productos', 'Categorización por tipo', 'Búsqueda y filtros'],
    definitionOfDone: ['Endpoints REST completos', 'UI de catálogo', 'Tests de integración'],
    definitionOfReady: ['Modelo de datos aprobado', 'Categorías definidas'],
    priority: 'critical', points: 8, status: 'in-progress', sprintId: 'sp4', assigneeId: 'u4', createdAt: '2026-04-20T09:00:00Z',
  },
  {
    id: 's8', epicId: 'e7', projectId: 'p2',
    title: 'Alertas de stock mínimo', description: 'Como operador quiero recibir alertas cuando un producto baje del stock mínimo definido',
    acceptanceCriteria: ['Configurar stock mínimo por producto', 'Alerta visual en dashboard', 'Notificación por email'],
    definitionOfDone: ['Lógica de alertas implementada', 'Widget en dashboard', 'Notificaciones configuradas'],
    definitionOfReady: ['Reglas de alerta definidas', 'Canal de notificación decidido'],
    priority: 'high', points: 5, status: 'todo', sprintId: 'sp4', createdAt: '2026-04-22T10:00:00Z',
  },
  {
    id: 's8b', epicId: 'e6', projectId: 'p2',
    title: 'Reportes de inventario', description: 'Como gerente quiero generar reportes de inventario en PDF y Excel',
    acceptanceCriteria: ['Reporte de stock actual', 'Historial de movimientos', 'Exportación a PDF y Excel'],
    definitionOfDone: ['Generador de reportes funcional', 'Exportación a ambos formatos', 'Filtros por fecha y categoría'],
    definitionOfReady: ['Formato de reporte acordado', 'Librería de exportación seleccionada'],
    priority: 'medium', points: 5, status: 'todo', createdAt: '2026-04-23T10:00:00Z',
  },
  {
    id: 's8c', epicId: 'e7', projectId: 'p2',
    title: 'Movimientos de inventario', description: 'Como operador quiero registrar entradas y salidas de productos con trazabilidad',
    acceptanceCriteria: ['Registro de entrada/salida', 'Historial por producto', 'Responsable registrado en cada movimiento'],
    definitionOfDone: ['Formulario de movimiento', 'Log de movimientos con filtros', 'Stock actualizado automáticamente'],
    definitionOfReady: ['Tipos de movimiento definidos'],
    priority: 'high', points: 8, status: 'completed', sprintId: 'sp4', assigneeId: 'u4', createdAt: '2026-04-24T09:00:00Z',
  },
  // p3 – App Móvil
  {
    id: 's10', epicId: 'e8', projectId: 'p3',
    title: 'Generación de factura DIAN', description: 'Como usuario quiero generar facturas electrónicas válidas ante la DIAN',
    acceptanceCriteria: ['Factura en formato XML DIAN', 'Firma electrónica incluida', 'Envío exitoso a DIAN'],
    definitionOfDone: ['Integración DIAN completa', 'Tests con facturas reales en sandbox', 'Manejo de errores DIAN'],
    definitionOfReady: ['Certificado DIAN disponible', 'Ambiente sandbox configurado'],
    priority: 'critical', points: 13, status: 'todo', createdAt: '2026-06-05T09:00:00Z',
  },
  {
    id: 's10b', epicId: 'e9', projectId: 'p3',
    title: 'Login móvil con biometría', description: 'Como usuario móvil quiero autenticarme usando huella o Face ID para mayor seguridad',
    acceptanceCriteria: ['Soporte biométrico iOS y Android', 'Fallback a PIN', 'Token JWT emitido tras auth exitosa'],
    definitionOfDone: ['API biométrica integrada', 'Tests en dispositivos físicos', 'Flujo de fallback funcional'],
    definitionOfReady: ['Librerías biométricas seleccionadas', 'Diseño de flujo aprobado'],
    priority: 'high', points: 8, status: 'todo', createdAt: '2026-06-06T09:00:00Z',
  },
];

export const INITIAL_TASKS: Task[] = [
  // Sprint 1 – completadas
  { id: 't1', storyId: 's1', projectId: 'p1', sprintId: 'sp1', title: 'Endpoint POST /auth/login', description: 'Implementar endpoint de login con validación de credenciales', status: 'completed', assigneeId: 'u4', estimatedHours: 4, loggedHours: 3.5, createdAt: '2026-03-06T09:00:00Z', updatedAt: '2026-03-08T16:00:00Z' },
  { id: 't2', storyId: 's1', projectId: 'p1', sprintId: 'sp1', title: 'Generación y validación de JWT', description: 'Implementar generación de tokens y middleware de validación', status: 'completed', assigneeId: 'u4', estimatedHours: 3, loggedHours: 3, createdAt: '2026-03-06T09:00:00Z', updatedAt: '2026-03-09T14:00:00Z' },
  { id: 't3', storyId: 's2', projectId: 'p1', sprintId: 'sp1', title: 'Middleware RBAC por rol', description: 'Implementar decoradores de autorización por rol', status: 'completed', assigneeId: 'u4', estimatedHours: 6, loggedHours: 7, createdAt: '2026-03-07T09:00:00Z', updatedAt: '2026-03-12T17:00:00Z' },
  // Sprint 2 – en progreso
  { id: 't4', storyId: 's3', projectId: 'p1', sprintId: 'sp2', title: 'Formulario de creación de usuario', description: 'UI para crear nuevo usuario con validación', status: 'in-progress', assigneeId: 'u3', estimatedHours: 5, loggedHours: 3, createdAt: '2026-03-20T09:00:00Z', updatedAt: '2026-03-25T11:00:00Z' },
  { id: 't5', storyId: 's3', projectId: 'p1', sprintId: 'sp2', title: 'Tabla de usuarios con filtros', description: 'Tabla paginada con búsqueda, filtros y acciones', status: 'code-review', assigneeId: 'u3', estimatedHours: 6, loggedHours: 6, createdAt: '2026-03-20T09:00:00Z', updatedAt: '2026-03-24T16:00:00Z' },
  { id: 't5b', storyId: 's3', projectId: 'p1', sprintId: 'sp2', title: 'Tests de integración CRUD usuarios', description: 'Pruebas E2E del módulo de usuarios', status: 'testing', assigneeId: 'u4', estimatedHours: 4, loggedHours: 2, createdAt: '2026-03-21T09:00:00Z', updatedAt: '2026-03-26T10:00:00Z' },
  { id: 't6', storyId: 's4', projectId: 'p1', sprintId: 'sp2', title: 'Sección de habilidades y experiencia', description: 'Formulario para editar perfil profesional', status: 'in-progress', assigneeId: 'u3', estimatedHours: 4, loggedHours: 2, createdAt: '2026-03-22T09:00:00Z', updatedAt: '2026-03-26T10:00:00Z' },
  { id: 't6b', storyId: 's4', projectId: 'p1', sprintId: 'sp2', title: 'Configuración de disponibilidad semanal', description: 'UI de calendario de disponibilidad editable', status: 'fixing', assigneeId: 'u3', estimatedHours: 6, loggedHours: 5, createdAt: '2026-03-23T09:00:00Z', updatedAt: '2026-03-27T14:00:00Z' },
  { id: 't7', storyId: 's6', projectId: 'p1', sprintId: 'sp2', title: 'Parser de texto de disponibilidad', description: 'Algoritmo para parsear texto libre de disponibilidad', status: 'in-progress', assigneeId: 'u3', estimatedHours: 8, loggedHours: 4, createdAt: '2026-03-22T09:00:00Z', updatedAt: '2026-03-27T15:00:00Z' },
  { id: 't8', storyId: 's6', projectId: 'p1', sprintId: 'sp2', title: 'UI de cálculo de franjas libres', description: 'Interfaz de selección de franjas y creación de reunión', status: 'todo', estimatedHours: 5, loggedHours: 0, createdAt: '2026-03-22T09:00:00Z', updatedAt: '2026-03-22T09:00:00Z' },
  { id: 't9b', storyId: 's5', projectId: 'p1', sprintId: 'sp2', title: 'Gestión de épicas y HU', description: 'UI para crear y editar épicas e historias de usuario', status: 'code-review', assigneeId: 'u3', estimatedHours: 8, loggedHours: 8, createdAt: '2026-03-20T09:00:00Z', updatedAt: '2026-03-26T09:00:00Z' },
  { id: 't9c', storyId: 's5', projectId: 'p1', sprintId: 'sp2', title: 'Backlog filtros y ordenamiento', description: 'Filtros por estado, prioridad y épica en el backlog', status: 'todo', estimatedHours: 4, loggedHours: 0, createdAt: '2026-03-20T09:00:00Z', updatedAt: '2026-03-20T09:00:00Z' },
  // Sprint 4 – Inventario
  { id: 't9', storyId: 's7', projectId: 'p2', sprintId: 'sp4', title: 'CRUD productos backend', description: 'Endpoints REST para gestión de productos', status: 'in-progress', assigneeId: 'u4', estimatedHours: 8, loggedHours: 5, createdAt: '2026-04-25T09:00:00Z', updatedAt: '2026-04-29T14:00:00Z' },
  { id: 't10', storyId: 's7', projectId: 'p2', sprintId: 'sp4', title: 'UI catálogo de productos', description: 'Interfaz de tabla y formularios para productos', status: 'todo', estimatedHours: 6, loggedHours: 0, createdAt: '2026-04-25T09:00:00Z', updatedAt: '2026-04-25T09:00:00Z' },
  { id: 't10b', storyId: 's7', projectId: 'p2', sprintId: 'sp4', title: 'Búsqueda y filtros de productos', description: 'Búsqueda en tiempo real y filtros por categoría', status: 'todo', estimatedHours: 3, loggedHours: 0, createdAt: '2026-04-26T09:00:00Z', updatedAt: '2026-04-26T09:00:00Z' },
  { id: 't11', storyId: 's8c', projectId: 'p2', sprintId: 'sp4', title: 'Registro de entrada de productos', description: 'Formulario de entrada de inventario', status: 'completed', assigneeId: 'u4', estimatedHours: 4, loggedHours: 4, createdAt: '2026-04-24T09:00:00Z', updatedAt: '2026-04-28T15:00:00Z' },
  { id: 't12', storyId: 's8c', projectId: 'p2', sprintId: 'sp4', title: 'Historial de movimientos', description: 'Tabla de movimientos con filtros y exportación', status: 'completed', assigneeId: 'u4', estimatedHours: 5, loggedHours: 5, createdAt: '2026-04-24T09:00:00Z', updatedAt: '2026-04-29T11:00:00Z' },
];

export const INITIAL_SPRINTS: Sprint[] = [
  { id: 'sp1', projectId: 'p1', name: 'Sprint 1 – Autenticación', goal: 'Implementar autenticación JWT y RBAC completo', status: 'completed', startDate: '2026-03-04', endDate: '2026-03-17', storyIds: ['s1', 's2'], velocity: 13 },
  { id: 'sp2', projectId: 'p1', name: 'Sprint 2 – Usuarios y Disponibilidad', goal: 'CRUD de usuarios, perfiles y módulo de disponibilidad', status: 'active', startDate: '2026-03-18', endDate: '2026-04-01', storyIds: ['s3', 's4', 's5', 's6', 's9'] },
  { id: 'sp3', projectId: 'p1', name: 'Sprint 3 – Motor Scrum', goal: 'Backlog, épicas, HU y tablero Kanban', status: 'planning', startDate: '2026-10-02', endDate: '2026-10-16', storyIds: ['s2b', 's5b', 's5c', 's9b'] },
  { id: 'sp4', projectId: 'p2', name: 'Sprint 1 – Inventario Base', goal: 'Catálogo de productos y control básico de stock', status: 'active', startDate: '2026-04-22', endDate: '2026-05-06', storyIds: ['s7', 's8', 's8c'] },
];

export const INITIAL_MEETINGS: Meeting[] = [
  { id: 'm1', projectId: 'p1', title: 'Sprint Planning – Sprint 2', description: 'Planificación del Sprint 2', date: '2026-03-17', startTime: '10:00', duration: 60, participantIds: ['u1', 'u2', 'u3', 'u4'], link: 'https://meet.google.com/abc-defg-hij', status: 'completed', creatorId: 'u2', summary: 'Se acordó trabajar en HU s3, s4 y s6. Iván liderará el frontend. David apoya el backend. El equipo estimó 34 puntos para el sprint.', minutesUrl: 'https://docs.google.com/document/d/acta-sp2-planning' },
  { id: 'm2', projectId: 'p1', title: 'Daily Standup – 25/03', date: '2026-03-25', startTime: '09:00', duration: 15, participantIds: ['u2', 'u3', 'u4'], link: 'https://meet.google.com/abc-defg-hij', status: 'completed', creatorId: 'u2', summary: 'Iván reporta avance en tabla de usuarios (60%). David completó JWT. Sin impedimentos activos.' },
  { id: 'm3', projectId: 'p1', title: 'Revisión técnica – Parser de disponibilidad', description: 'Revisión del algoritmo de cálculo de franjas libres comunes', date: '2026-03-28', startTime: '14:00', duration: 45, participantIds: ['u2', 'u3'], link: 'https://meet.google.com/abc-defg-hij', status: 'completed', creatorId: 'u3', summary: 'Se identificó el bug con tildes en el parser. Iván tomará el fix como prioritario. Se definió la estrategia de normalización Unicode.' },
  { id: 'm4', projectId: 'p1', title: 'Sprint Review – Sprint 2', description: 'Revisión de entregables del Sprint 2', date: '2026-10-01', startTime: '10:00', duration: 60, participantIds: ['u1', 'u2', 'u3', 'u4'], link: 'https://meet.google.com/abc-defg-hij', status: 'scheduled', creatorId: 'u2' },
  { id: 'm5', projectId: 'p1', title: 'Sprint Retrospectiva – Sprint 2', date: '2026-10-01', startTime: '11:30', duration: 45, participantIds: ['u2', 'u3', 'u4'], link: 'https://meet.google.com/abc-defg-hij', status: 'scheduled', creatorId: 'u2' },
  { id: 'm6', projectId: 'p1', title: 'Sprint Planning – Sprint 3', date: '2026-10-02', startTime: '10:00', duration: 90, participantIds: ['u1', 'u2', 'u3', 'u4'], link: 'https://meet.google.com/abc-defg-hij', status: 'scheduled', creatorId: 'u2' },
  { id: 'm9', projectId: 'p1', title: 'Sync técnico backend – Dev team', date: '2026-09-26', startTime: '15:00', duration: 30, participantIds: ['u3', 'u4'], link: 'https://meet.google.com/abc-defg-hij', status: 'completed', creatorId: 'u3', summary: 'Iván y David revisaron la estructura del módulo de autenticación. Acordaron patrón Repository para el backend.' },
  { id: 'm7', projectId: 'p2', title: 'Kickoff Sistema de Inventarios', description: 'Reunión inicial del proyecto', date: '2026-04-15', startTime: '09:00', duration: 120, participantIds: ['u2', 'u4', 'u6'], link: 'https://meet.google.com/xyz-uvwx-yza', status: 'completed', creatorId: 'u2', summary: 'Se definió el alcance del MVP1: catálogo, movimientos y reportes básicos. Fecha de entrega: 30 de mayo.', minutesUrl: 'https://docs.google.com/document/d/acta-inv-kickoff' },
  { id: 'm8', projectId: 'p2', title: 'Daily Inventarios – 29/09', date: '2026-09-29', startTime: '09:30', duration: 15, participantIds: ['u2', 'u4'], link: 'https://meet.google.com/xyz-uvwx-yza', status: 'scheduled', creatorId: 'u2' },
];

export const INITIAL_FIXES: Fix[] = [
  {
    id: 'f1', projectId: 'p1', storyId: 's6', taskId: 't7',
    title: 'Parser de disponibilidad no reconoce tildes',
    description: 'El algoritmo de parsing falla silenciosamente cuando el usuario escribe días con tildes (Lunes, Miércoles, etc.). El resultado es que esos días se ignoran del cómputo de disponibilidad.',
    status: 'in-progress', priority: 'high',
    reporterId: 'u3', assigneeId: 'u3',
    estimatedCost: 120000, currency: 'COP',
    solution: 'Aplicar normalización Unicode (NFKD + ASCII) antes del parsing. Regex actualizado para aceptar ambas formas.',
    createdAt: '2026-03-26T10:30:00Z', updatedAt: '2026-03-27T14:00:00Z',
    history: [
      { id: 'fh1', date: '2026-03-26T10:30:00Z', userId: 'u3', action: 'Creación', note: 'Fix reportado desde revisión técnica' },
      { id: 'fh2', date: '2026-03-26T11:00:00Z', userId: 'u2', action: 'Asignación', from: 'Sin asignar', to: 'Iván Ausecha' },
      { id: 'fh3', date: '2026-03-27T09:00:00Z', userId: 'u3', action: 'Cambio de estado', from: 'open', to: 'in-progress', note: 'Iniciando análisis de causa raíz' },
    ],
  },
  {
    id: 'f2', projectId: 'p1', storyId: 's3',
    title: 'Advertencia faltante al eliminar usuario con tareas',
    description: 'El diálogo de confirmación de eliminación de usuario no muestra información sobre las tareas pendientes que quedarán huérfanas.',
    status: 'open', priority: 'medium',
    reporterId: 'u2', assigneeId: 'u3',
    estimatedCost: 80000, currency: 'COP',
    createdAt: '2026-03-25T14:30:00Z', updatedAt: '2026-03-25T14:30:00Z',
    history: [
      { id: 'fh4', date: '2026-03-25T14:30:00Z', userId: 'u2', action: 'Creación', note: 'Reportado durante revisión de código' },
    ],
  },
  {
    id: 'f3', projectId: 'p2', storyId: 's7',
    title: 'Paginación incorrecta en GET /products',
    description: 'El cálculo de OFFSET en SQLAlchemy era incorrecto para páginas > 1. El bug se introducía al mezclar paginación 0-indexed con lógica 1-indexed en el controlador.',
    status: 'resolved', priority: 'high',
    reporterId: 'u4', assigneeId: 'u4',
    estimatedCost: 60000, actualCost: 55000, currency: 'COP',
    costAuthorizerId: 'u2', costNote: 'Aprobado. Prioridad alta por impacto en producción.',
    solution: 'Se corrigió el cálculo de offset: `offset = (page - 1) * limit`. Se agregó test de integración para paginación con datasets grandes.',
    createdAt: '2026-04-28T11:30:00Z', updatedAt: '2026-04-30T16:00:00Z', resolvedAt: '2026-04-30T16:00:00Z',
    history: [
      { id: 'fh5', date: '2026-04-28T11:30:00Z', userId: 'u4', action: 'Creación' },
      { id: 'fh6', date: '2026-04-28T13:00:00Z', userId: 'u2', action: 'Cambio de prioridad', from: 'medium', to: 'high', note: 'Cliente reportó el error en producción' },
      { id: 'fh7', date: '2026-04-29T10:00:00Z', userId: 'u4', action: 'Cambio de estado', from: 'open', to: 'in-progress' },
      { id: 'fh8', date: '2026-04-30T16:00:00Z', userId: 'u4', action: 'Resolución', from: 'in-progress', to: 'resolved', note: 'Solución implementada y tests pasando' },
    ],
  },
  {
    id: 'f4', projectId: 'p1', storyId: 's4', taskId: 't6b',
    title: 'UI de disponibilidad no persiste al recargar',
    description: 'Los cambios de disponibilidad semanal se guardan visualmente pero se pierden al recargar la página. El localStorage no se actualiza correctamente.',
    status: 'in-progress', priority: 'high',
    reporterId: 'u3', assigneeId: 'u3',
    estimatedCost: 90000, currency: 'COP',
    createdAt: '2026-03-27T10:00:00Z', updatedAt: '2026-03-28T09:00:00Z',
    history: [
      { id: 'fh9', date: '2026-03-27T10:00:00Z', userId: 'u3', action: 'Creación', note: 'Detectado en testing manual' },
      { id: 'fh10', date: '2026-03-27T11:00:00Z', userId: 'u3', action: 'Cambio de estado', from: 'open', to: 'in-progress' },
    ],
  },
  {
    id: 'f5', projectId: 'p1', storyId: 's9',
    title: 'Respuesta de IA excede límite de tokens en proyectos grandes',
    description: 'El contexto enviado a la API de Claude incluye todo el estado del proyecto, superando el límite de tokens para proyectos con más de 50 HU.',
    status: 'open', priority: 'critical',
    reporterId: 'u2',
    estimatedCost: 200000, currency: 'COP',
    createdAt: '2026-09-28T14:00:00Z', updatedAt: '2026-09-28T14:00:00Z',
    history: [
      { id: 'fh11', date: '2026-09-28T14:00:00Z', userId: 'u2', action: 'Creación', note: 'Detectado en demo con cliente' },
    ],
  },
  {
    id: 'f6', projectId: 'p2', storyId: 's8c',
    title: 'Stock no se actualiza al registrar salida manual',
    description: 'Al registrar una salida de inventario en el formulario manual, el stock visible en el catálogo no se actualiza hasta recargar la página.',
    status: 'resolved', priority: 'medium',
    reporterId: 'u4', assigneeId: 'u4',
    estimatedCost: 40000, actualCost: 35000, currency: 'COP',
    solution: 'Se agregó invalidación de caché React Query tras mutación de inventario. El stock ahora se actualiza en tiempo real.',
    createdAt: '2026-04-29T09:00:00Z', updatedAt: '2026-04-30T10:00:00Z', resolvedAt: '2026-04-30T10:00:00Z',
    history: [
      { id: 'fh12', date: '2026-04-29T09:00:00Z', userId: 'u4', action: 'Creación' },
      { id: 'fh13', date: '2026-04-29T10:00:00Z', userId: 'u4', action: 'Cambio de estado', from: 'open', to: 'in-progress' },
      { id: 'fh14', date: '2026-04-30T10:00:00Z', userId: 'u4', action: 'Resolución', from: 'in-progress', to: 'resolved' },
    ],
  },
  {
    id: 'f7', projectId: 'p1', storyId: 's5',
    title: 'Drag-and-drop de HU no funciona en Firefox',
    description: 'La funcionalidad de reordenamiento del backlog mediante drag-and-drop no responde correctamente en Firefox 126+.',
    status: 'open', priority: 'low',
    reporterId: 'u3',
    currency: 'COP',
    createdAt: '2026-09-29T08:00:00Z', updatedAt: '2026-09-29T08:00:00Z',
    history: [
      { id: 'fh15', date: '2026-09-29T08:00:00Z', userId: 'u3', action: 'Creación', note: 'Reportado por desarrollador durante prueba cross-browser' },
    ],
  },
];

export const INITIAL_EVIDENCES: Evidence[] = [
  { id: 'ev1', fixId: 'f1', type: 'screenshot', title: 'Parser ignorando Miércoles con tilde', description: 'Output del parser cuando el input contiene "Miércoles"', url: 'https://picsum.photos/seed/ev1/800/450', uploadedBy: 'u3', uploadedAt: '2026-03-26T10:45:00Z' },
  { id: 'ev2', fixId: 'f1', type: 'log', title: 'Log de consola con error de parsing', content: '[PARSER] Input: "Miércoles: 09:00-12:00"\n[PARSER] Normalization failed for: "Miércoles"\n[PARSER] Day "Miércoles" not recognized. Skipping.\n[PARSER] Parsed 0 slots for Wednesday\n[WARNING] User u3 availability for wednesday is empty', uploadedBy: 'u3', uploadedAt: '2026-03-26T10:50:00Z' },
  { id: 'ev3', fixId: 'f1', type: 'text', title: 'Comportamiento esperado vs actual', content: 'ESPERADO: Al ingresar "Miércoles: 09:00-12:00", el slot debe registrarse.\n\nACTUAL: El slot se ignora silenciosamente. La disponibilidad queda vacía sin error visible.', uploadedBy: 'u3', uploadedAt: '2026-03-26T11:00:00Z' },
  { id: 'ev4', fixId: 'f3', type: 'screenshot', title: 'Resultados incorrectos en página 2', description: 'Página 2 muestra los mismos registros que la página 1', url: 'https://picsum.photos/seed/ev4/800/450', uploadedBy: 'u4', uploadedAt: '2026-04-28T11:45:00Z' },
  { id: 'ev5', fixId: 'f3', type: 'log', title: 'Query SQL con offset incorrecto', content: 'SELECT * FROM products LIMIT 20 OFFSET 0  -- página 1\nSELECT * FROM products LIMIT 20 OFFSET 0  -- página 2 (INCORRECTO)\n\n# Root cause controllers/products.py:\noffset = page * limit  # BUG: debería ser (page-1)*limit', uploadedBy: 'u4', uploadedAt: '2026-04-28T12:00:00Z' },
  { id: 'ev6', fixId: 'f4', type: 'text', title: 'Pasos de reproducción', content: '1. Ir a Perfil → Disponibilidad\n2. Agregar franja Lunes 09:00-12:00\n3. Guardar → UI muestra la franja\n4. Recargar página (F5)\n5. La franja desaparece\n\nLocalStorage inspeccionado: el campo "availability" en el objeto de usuario no se actualiza.', uploadedBy: 'u3', uploadedAt: '2026-03-27T10:30:00Z' },
  { id: 'ev7', fixId: 'f5', type: 'log', title: 'Error 400 context too large', content: '[API ERROR] POST /api/ai/chat\nStatus: 400 Bad Request\nBody: {"error": "context_length_exceeded", "message": "Prompt tokens (128450) exceed model maximum (128000)", "model": "claude-sonnet-4"}\n\nContext breakdown:\n  system_prompt: 2341 tokens\n  project_context: 98234 tokens\n  conversation: 2100 tokens\n  user_message: 540 tokens', uploadedBy: 'u2', uploadedAt: '2026-09-28T14:30:00Z' },
  { id: 'ev8', fixId: 'f7', type: 'screenshot', title: 'DnD roto en Firefox', description: 'Captura de Firefox mostrando que el elemento no se arrastra', url: 'https://picsum.photos/seed/ev8/800/450', uploadedBy: 'u3', uploadedAt: '2026-09-29T08:30:00Z' },
];

export const INITIAL_AI_ANALYSES: AIAnalysis[] = [
  {
    id: 'ai1', fixId: 'f1', evidenceId: 'ev1', type: 'image', status: 'completed',
    diagnosis: 'El parser falla al procesar caracteres Unicode fuera del rango ASCII. Los caracteres con diacríticos no son normalizados antes de la comparación.',
    observations: [
      'El input "Miércoles" contiene U+00E9 (é) que no coincide con el regex ASCII',
      'La función de matching usa comparación directa sin normalización',
      'No existe manejo de excepciones para caracteres no reconocidos',
    ],
    possibleCauses: [
      'Regex definido solo para ASCII: /lunes|martes|miercoles|.../i',
      'No se aplica NFKD normalization al input del usuario',
      'Sin fallback para variantes ortográficas',
    ],
    suggestedSteps: [
      'Aplicar NFKD al input: input.normalize("NFKD").replace(/\\p{M}/gu, "")',
      'Actualizar regex: /mi[eé]rcoles/ui',
      'Agregar variantes de todos los días al diccionario',
      'Agregar feedback visual cuando un día no se reconoce',
      'Tests unitarios para todas las variantes ortográficas',
    ],
    recommendation: 'Implementar normalización Unicode en el preprocesamiento del input. Es la solución más robusta y evita recurrencia con otros caracteres especiales.',
    createdAt: '2026-03-26T12:00:00Z',
  },
  {
    id: 'ai2', fixId: 'f5', evidenceId: 'ev7', type: 'text', status: 'completed',
    diagnosis: 'El contexto enviado a la API supera el límite de tokens del modelo. El proyecto serializa la totalidad del estado en el prompt sin truncamiento ni selección inteligente.',
    observations: [
      'El prompt de contexto de proyecto tiene 98,234 tokens para proyectos grandes',
      'No existe paginación ni selección relevante del contexto',
      'El sistema no valida el tamaño del contexto antes de enviar',
    ],
    possibleCauses: [
      'El contexto se construye con JSON.stringify del estado completo',
      'Sin filtrado de entidades irrelevantes para la consulta actual',
      'Sin compresión ni resumen del historial',
    ],
    suggestedSteps: [
      'Implementar selección semántica del contexto relevante',
      'Limitar el contexto a entidades del sprint activo',
      'Agregar validación de tokens antes del envío',
      'Considerar RAG para contexto de proyectos grandes',
    ],
    recommendation: 'Implementar filtrado inteligente del contexto, enviando solo las entidades relevantes para la consulta actual más un resumen del proyecto.',
    createdAt: '2026-09-28T15:00:00Z',
  },
];

export const INITIAL_DOCUMENTS: Document[] = [
  { id: 'd1', projectId: 'p1', title: 'Arquitectura del Sistema', url: 'https://drive.google.com/file/d/architecture-dashnode', description: 'Diagrama de arquitectura de tres capas: React/FastAPI/PostgreSQL', category: 'technical', authorId: 'u1', isPublic: true, createdAt: '2026-03-02T09:00:00Z', updatedAt: '2026-03-15T14:00:00Z' },
  { id: 'd2', projectId: 'p1', title: 'Manual de Usuario – Disponibilidad', url: 'https://docs.google.com/document/d/manual-disponibilidad', description: 'Guía para registrar disponibilidad semanal y agendar reuniones', category: 'functional', authorId: 'u2', isPublic: true, createdAt: '2026-03-20T11:00:00Z', updatedAt: '2026-03-20T11:00:00Z' },
  { id: 'd3', projectId: 'p1', title: 'Esquema de Base de Datos', url: 'https://drive.google.com/file/d/db-schema-dashnode', description: 'ERD completo de entidades: User, Project, Epic, Story, Task, Fix, Evidence', category: 'technical', authorId: 'u1', isPublic: true, createdAt: '2026-03-05T09:00:00Z', updatedAt: '2026-09-01T14:00:00Z' },
  { id: 'd4', projectId: 'p1', title: 'Guía de Estándares de Código', url: 'https://docs.google.com/document/d/code-standards', description: 'TypeScript strict mode, PEP 8 + Black para Python, Conventional Commits', category: 'technical', authorId: 'u2', isPublic: true, createdAt: '2026-03-10T10:00:00Z', updatedAt: '2026-03-10T10:00:00Z' },
  { id: 'd5', projectId: 'p1', title: 'Acta Sprint 1', url: 'https://docs.google.com/document/d/acta-sprint1', description: 'Acta de retrospectiva del Sprint 1 – Autenticación y RBAC', category: 'meeting', authorId: 'u2', isPublic: false, createdAt: '2026-03-18T09:00:00Z', updatedAt: '2026-03-18T09:00:00Z' },
  { id: 'd6', projectId: 'p1', title: 'Prompt: Generación de criterios de aceptación', url: 'https://docs.google.com/document/d/prompt-ac-generator', description: 'Prompt base para generar AC de historias de usuario usando Claude', category: 'prompt', authorId: 'u2', isPublic: true, createdAt: '2026-03-10T11:00:00Z', updatedAt: '2026-03-10T11:00:00Z' },
  { id: 'd7', projectId: 'p1', title: 'Prompt: Diagnóstico de bugs con evidencia', url: 'https://docs.google.com/document/d/prompt-bug-diagnosis', description: 'Prompt multimodal para diagnóstico de bugs con capturas de pantalla', category: 'prompt', authorId: 'u3', isPublic: true, createdAt: '2026-03-26T13:00:00Z', updatedAt: '2026-03-26T13:00:00Z' },
  { id: 'd8', projectId: 'p2', title: 'Especificación Módulo Inventario', url: 'https://docs.google.com/document/d/spec-inventario', description: 'Entidades: Producto, Categoría, Movimiento. APIs REST documentadas', category: 'functional', authorId: 'u2', isPublic: true, createdAt: '2026-04-16T10:00:00Z', updatedAt: '2026-04-20T09:00:00Z' },
  { id: 'd9', projectId: 'p2', title: 'Esquema BD Inventarios', url: 'https://drive.google.com/file/d/db-schema-inventarios', description: 'ERD del sistema de inventario con relaciones y constraints', category: 'technical', authorId: 'u4', isPublic: true, createdAt: '2026-04-17T10:00:00Z', updatedAt: '2026-04-17T10:00:00Z' },
];

export const INITIAL_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'k1', projectId: 'p1', title: 'Configuración de JWT en FastAPI',
    question: '¿Cómo implementar autenticación JWT en FastAPI?',
    content: 'Usar python-jose con algoritmo HS256. SECRET_KEY en .env. Access tokens 30 min, refresh tokens 7 días con rotación.',
    answer: 'Usar python-jose con HS256, almacenar SECRET_KEY en .env, implementar refresh token rotation.',
    source: 'Documentación FastAPI + experiencia del equipo',
    category: 'Backend', tags: ['fastapi', 'jwt', 'security', 'python'],
    authorId: 'u4', approvalStatus: 'approved', approvedBy: 'u2', approvedAt: '2026-03-12T10:00:00Z',
    aiGenerated: false, createdAt: '2026-03-10T09:00:00Z',
  },
  {
    id: 'k2', projectId: 'p1', title: 'Patrón Repository con SQLAlchemy',
    question: '¿Cuál es la mejor forma de estructurar el acceso a datos con SQLAlchemy 2.0?',
    content: 'El patrón Repository abstrae el acceso a datos. En SQLAlchemy 2.0 usar Session con nueva sintaxis de select(). Exponer: get_by_id, get_all, create, update, delete.',
    source: 'SQLAlchemy docs + equipo DashNode',
    category: 'Backend', tags: ['sqlalchemy', 'patterns', 'database', 'python'],
    authorId: 'u4', approvalStatus: 'approved', approvedBy: 'u2', approvedAt: '2026-03-17T09:00:00Z',
    aiGenerated: false, createdAt: '2026-03-15T14:00:00Z',
  },
  {
    id: 'k3', projectId: 'p1', title: 'Normalización Unicode en Python',
    question: '¿Cómo manejar tildes y diacríticos en strings de Python?',
    content: 'Usar unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii"). En regex usar re.UNICODE.',
    answer: 'Aplicar NFKD normalization antes de cualquier comparación de strings.',
    source: 'Generado por IA durante análisis de Fix f1',
    category: 'Backend', tags: ['python', 'unicode', 'parsing', 'i18n'],
    authorId: 'u3', approvalStatus: 'pending',
    aiGenerated: true, createdAt: '2026-03-26T12:30:00Z',
  },
  {
    id: 'k4', projectId: 'p1', title: 'Gestión de context length en Claude API',
    question: '¿Cómo evitar exceder el límite de tokens al enviar contexto de proyecto a Claude?',
    content: 'Implementar selección semántica del contexto: enviar solo entidades del sprint activo + resumen del proyecto. Validar tokens antes del envío usando tokenizer. Para proyectos grandes, usar RAG.',
    answer: 'Filtrar contexto por relevancia semántica, validar tokens pre-envío, considerar RAG para proyectos > 50 HU.',
    source: 'Generado por IA durante análisis de Fix f5',
    category: 'IA', tags: ['claude', 'tokens', 'context', 'rag'],
    authorId: 'u2', approvalStatus: 'pending',
    aiGenerated: true, createdAt: '2026-09-28T15:30:00Z',
  },
  {
    id: 'k5', projectId: 'p2', title: 'Paginación correcta en SQLAlchemy',
    question: '¿Cómo implementar paginación correcta en SQLAlchemy?',
    content: 'Usar `offset = (page - 1) * limit`. La API de paginación debe ser 1-indexed. Siempre ordenar antes de paginar (ORDER BY) para resultados deterministas.',
    answer: 'offset = (page - 1) * limit con ORDER BY obligatorio.',
    source: 'Fix f3 resuelto por David Enciso',
    category: 'Backend', tags: ['sqlalchemy', 'pagination', 'database', 'python'],
    authorId: 'u4', approvalStatus: 'approved', approvedBy: 'u2', approvedAt: '2026-05-01T09:00:00Z',
    aiGenerated: false, createdAt: '2026-04-30T17:00:00Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'al1', userId: 'u2', action: 'CREATE', entity: 'Sprint', entityId: 'sp2', projectId: 'p1', after: '{"name":"Sprint 2","status":"planning"}', result: 'success', createdAt: '2026-03-17T08:00:00Z' },
  { id: 'al2', userId: 'u2', action: 'UPDATE_STATUS', entity: 'Sprint', entityId: 'sp2', projectId: 'p1', before: '{"status":"planning"}', after: '{"status":"active"}', result: 'success', createdAt: '2026-03-18T09:00:00Z' },
  { id: 'al3', userId: 'u2', action: 'ASSIGN', entity: 'Task', entityId: 't4', projectId: 'p1', before: '{"assigneeId":null}', after: '{"assigneeId":"u3"}', result: 'success', createdAt: '2026-03-20T09:30:00Z' },
  { id: 'al4', userId: 'u3', action: 'UPDATE_STATUS', entity: 'Task', entityId: 't4', projectId: 'p1', before: '{"status":"todo"}', after: '{"status":"in-progress"}', result: 'success', createdAt: '2026-03-22T10:00:00Z' },
  { id: 'al5', userId: 'u3', action: 'CREATE', entity: 'Fix', entityId: 'f1', projectId: 'p1', result: 'success', createdAt: '2026-03-26T10:30:00Z' },
  { id: 'al6', userId: 'u4', action: 'RESOLVE', entity: 'Fix', entityId: 'f3', projectId: 'p2', before: '{"status":"in-progress"}', after: '{"status":"resolved"}', result: 'success', createdAt: '2026-04-30T16:00:00Z' },
  { id: 'al7', userId: 'u2', action: 'APPROVE', entity: 'Knowledge', entityId: 'k2', projectId: 'p1', result: 'success', createdAt: '2026-03-17T09:00:00Z' },
  { id: 'al8', userId: 'u2', action: 'CREATE', entity: 'Meeting', entityId: 'm4', projectId: 'p1', result: 'success', createdAt: '2026-09-27T10:00:00Z' },
  { id: 'al9', userId: 'u3', action: 'CREATE', entity: 'Fix', entityId: 'f4', projectId: 'p1', result: 'success', createdAt: '2026-03-27T10:00:00Z' },
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n1', userId: 'u3', type: 'assignment', title: 'Nueva tarea asignada', message: 'Se te asignó: "Formulario de creación de usuario" en Sprint 2', read: false, projectId: 'p1', entityId: 't4', createdAt: '2026-03-20T09:30:00Z' },
  { id: 'n2', userId: 'u3', type: 'fix', title: 'Fix asignado', message: 'Jhorman asignó el fix "Parser de disponibilidad" a tu nombre', read: false, projectId: 'p1', entityId: 'f1', createdAt: '2026-03-26T11:00:00Z' },
  { id: 'n3', userId: 'u4', type: 'fix', title: 'Fix resuelto', message: 'Cerraste el fix "Paginación incorrecta en GET /products". Buen trabajo.', read: true, projectId: 'p2', entityId: 'f3', createdAt: '2026-04-30T16:05:00Z' },
  { id: 'n4', userId: 'u2', type: 'sprint', title: 'Sprint próximo a vencer', message: 'Sprint 2 termina en 3 días. Revisa el estado de las historias.', read: false, projectId: 'p1', entityId: 'sp2', createdAt: '2026-09-29T08:00:00Z' },
  { id: 'n5', userId: 'u3', type: 'meeting', title: 'Reunión programada', message: 'Sprint Review el 01/10 a las 10:00 hs.', read: false, projectId: 'p1', entityId: 'm4', createdAt: '2026-09-28T16:00:00Z' },
  { id: 'n6', userId: 'u4', type: 'meeting', title: 'Reunión programada', message: 'Daily Inventarios el 29/09 a las 09:30', read: true, projectId: 'p2', entityId: 'm8', createdAt: '2026-09-28T18:00:00Z' },
  { id: 'n7', userId: 'u3', type: 'ai', title: 'Análisis IA completado', message: 'El análisis de la evidencia "Parser ignorando Miércoles" está listo.', read: false, projectId: 'p1', entityId: 'f1', createdAt: '2026-03-26T12:05:00Z' },
  { id: 'n8', userId: 'u2', type: 'document', title: 'Conocimiento pendiente de aprobación', message: 'Iván propuso una entrada sobre Unicode. Requiere tu aprobación.', read: false, projectId: 'p1', entityId: 'k3', createdAt: '2026-03-26T12:35:00Z' },
  { id: 'n9', userId: 'u2', type: 'fix', title: 'Fix crítico abierto', message: 'Se reportó fix CRÍTICO: "Respuesta de IA excede límite de tokens". Revisar.', read: false, projectId: 'p1', entityId: 'f5', createdAt: '2026-09-28T14:05:00Z' },
];

export const INITIAL_AI_INTERACTIONS: AIInteraction[] = [
  { id: 'aii1', projectId: 'p1', userId: 'u3', activity: 'Análisis de evidencia de imagen', model: 'claude-sonnet-4', prompt: 'Analiza esta captura del error del parser de disponibilidad', aiResult: 'El parser falla por falta de normalización Unicode...', humanResult: 'Confirmado. El regex necesita actualización.', finalResult: 'Fix implementado: normalización NFKD aplicada.', accepted: true, modified: true, rejected: false, estimatedTimeSavedMin: 45, actualTimeSavedMin: 40, errorsIntroduced: 0, perceivedUtility: 5, createdAt: '2026-03-26T12:00:00Z' },
  { id: 'aii2', projectId: 'p1', userId: 'u2', activity: 'Generación de criterios de aceptación', model: 'claude-sonnet-4', prompt: 'Genera criterios de aceptación para la HU de CRUD de usuarios', aiResult: 'AC: 1. Crear usuario con rol. 2. Editar perfil. 3. Deshabilitar...', humanResult: 'Se ajustaron 2 criterios y se eliminó 1.', finalResult: 'Criterios de aceptación finales aprobados.', accepted: true, modified: true, rejected: false, estimatedTimeSavedMin: 20, actualTimeSavedMin: 15, errorsIntroduced: 0, perceivedUtility: 4, createdAt: '2026-03-10T10:00:00Z' },
  { id: 'aii3', projectId: 'p2', userId: 'u4', activity: 'Diagnóstico de bug de paginación', model: 'claude-sonnet-4', prompt: 'Analiza el log de este query SQL y propón la corrección', aiResult: 'El offset debe ser (page-1)*limit, no page*limit...', humanResult: 'Correcto. Se aplicó la corrección.', finalResult: 'Bug resuelto. Test de regresión agregado.', accepted: true, modified: false, rejected: false, estimatedTimeSavedMin: 30, actualTimeSavedMin: 35, errorsIntroduced: 0, perceivedUtility: 5, createdAt: '2026-04-28T14:00:00Z' },
  { id: 'aii4', projectId: 'p1', userId: 'u3', activity: 'Sugerencia de arquitectura de componentes', model: 'claude-sonnet-4', prompt: '¿Cómo estructurar el componente de disponibilidad?', aiResult: 'Sugiero separar: AvailabilityGrid, SlotSelector, MeetingCreator...', humanResult: 'Rechazada. Prefiero mantener todo en un componente para MVP.', finalResult: 'Estructura simplificada adoptada.', accepted: false, modified: false, rejected: true, estimatedTimeSavedMin: 15, errorsIntroduced: 0, perceivedUtility: 2, createdAt: '2026-03-22T15:00:00Z' },
  { id: 'aii5', projectId: 'p1', userId: 'u2', activity: 'Diagnóstico context overflow IA', model: 'claude-sonnet-4', prompt: 'Analiza este log de error de tokens y propón solución de arquitectura', aiResult: 'Implementar RAG con selección semántica del contexto relevante...', humanResult: 'Buena propuesta. Requiere evaluación de vector store.', finalResult: 'Pendiente de implementación.', accepted: true, modified: false, rejected: false, estimatedTimeSavedMin: 60, actualTimeSavedMin: 50, errorsIntroduced: 0, perceivedUtility: 4, createdAt: '2026-09-28T15:00:00Z' },
];

export const INITIAL_PIPELINE_RUNS: PipelineRun[] = [
  {
    id: 'pr1', projectId: 'p1', branch: 'feat/hu-03-crud-usuarios', commit: 'a4f2c8e', author: 'Iván Ausecha',
    message: 'feat(HU-03): implementar tabla de usuarios con filtros',
    status: 'success', startedAt: '2026-03-24T16:00:00Z', completedAt: '2026-03-24T16:08:22Z',
    steps: [
      { id: 'ps1', name: 'Git Push', status: 'success', duration: 2 },
      { id: 'ps2', name: 'Pull Request', status: 'success', duration: 5 },
      { id: 'ps3', name: 'ESLint / Ruff', status: 'success', duration: 18 },
      { id: 'ps4', name: 'Unit Tests', status: 'success', duration: 45 },
      { id: 'ps5', name: 'SonarQube', status: 'success', duration: 62 },
      { id: 'ps6', name: 'Docker Build', status: 'success', duration: 89 },
      { id: 'ps7', name: 'Deploy Staging', status: 'success', duration: 34 },
    ],
  },
  {
    id: 'pr2', projectId: 'p1', branch: 'fix/parser-unicode', commit: 'b7e1d3f', author: 'Iván Ausecha',
    message: 'fix(parser): normalización unicode para días con tildes',
    status: 'failed', startedAt: '2026-03-27T14:30:00Z', completedAt: '2026-03-27T14:38:11Z',
    steps: [
      { id: 'ps8', name: 'Git Push', status: 'success', duration: 2 },
      { id: 'ps9', name: 'Pull Request', status: 'success', duration: 4 },
      { id: 'ps10', name: 'ESLint / Ruff', status: 'success', duration: 16 },
      { id: 'ps11', name: 'Unit Tests', status: 'failed', duration: 38, log: 'FAILED tests/test_parser.py::test_parse_wednesday_accented\n  AssertionError: Expected 1 slot, got 0\n  Input: "Miércoles: 09:00-12:00"\n  Parser result: []\n  Fix in progress...' },
      { id: 'ps12', name: 'SonarQube', status: 'skipped' },
      { id: 'ps13', name: 'Docker Build', status: 'skipped' },
      { id: 'ps14', name: 'Deploy Staging', status: 'skipped' },
    ],
  },
  {
    id: 'pr3', projectId: 'p2', branch: 'fix/pagination-offset', commit: 'c2a9f1b', author: 'David Enciso',
    message: 'fix(products): corregir offset de paginación en GET /products',
    status: 'success', startedAt: '2026-04-30T10:00:00Z', completedAt: '2026-04-30T10:09:47Z',
    steps: [
      { id: 'ps15', name: 'Git Push', status: 'success', duration: 1 },
      { id: 'ps16', name: 'Pull Request', status: 'success', duration: 6 },
      { id: 'ps17', name: 'Ruff / MyPy', status: 'success', duration: 22 },
      { id: 'ps18', name: 'Unit Tests', status: 'success', duration: 58 },
      { id: 'ps19', name: 'Integration Tests', status: 'success', duration: 95 },
      { id: 'ps20', name: 'SonarQube', status: 'success', duration: 71 },
      { id: 'ps21', name: 'Deploy Staging', status: 'success', duration: 41 },
    ],
  },
];
