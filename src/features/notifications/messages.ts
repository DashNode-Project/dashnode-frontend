/** Literales EP-14 alineados con el contrato del backend y las HU de notificaciones. */
export const NOTIFICATION_MESSAGES = {
  panelTitle: 'Notificaciones',
  empty: 'No tiene notificaciones.',
  unreadOnly: 'Solo no leídas',
  showAll: 'Todas',
  markAllRead: 'Marcar todas como leídas',
  markOneRead: 'Marcar como leída',
  deleteAll: 'Eliminar todas',
  deleteConfirm:
    '¿Está seguro de que desea eliminar todas las notificaciones? Esta acción no se puede deshacer.',
  deleteConfirmTitle: 'Eliminar todas las notificaciones',
  viewAll: 'Ver todas',
  entityNotAvailable: 'El elemento ya no está disponible.',
  entityAccessDenied: 'No tiene acceso a este elemento.',
  notificationNotFound: 'La notificación no existe.',
  rateLimited: 'Demasiadas solicitudes. Intente nuevamente en un momento.',
  loadListFailure: 'No fue posible cargar las notificaciones. Intente nuevamente.',
  markReadFailure: 'No fue posible marcar las notificaciones. Intente nuevamente.',
  deleteFailure: 'No fue posible eliminar las notificaciones. Intente nuevamente.',
  openFailure: 'No fue posible abrir la notificación. Intente nuevamente.',
} as const;

export const ALLOWED_ROUTE_PREFIXES = ['/proyectos/', '/mis-tareas', '/notificaciones'] as const;

export function formatUnreadBadge(count: number): string | null {
  if (count <= 0) return null;
  if (count > 99) return '99+';
  return String(count);
}

export function isAllowedNotificationRoute(route: string): boolean {
  return ALLOWED_ROUTE_PREFIXES.some((prefix) => route.startsWith(prefix));
}