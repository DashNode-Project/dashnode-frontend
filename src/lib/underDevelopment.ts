/** Literal text logged when a control of a feature outside EP-01 is pressed. */
export const UNDER_DEVELOPMENT_MESSAGE = 'Funcionalidad en desarrollo, no disponible';

export const UNDER_DEVELOPMENT_EVENT = 'dashnode:under-development';

/**
 * Handler for every control whose feature does not belong to EP-01 (authentication and
 * sessions). Logs for tracing and raises a dismissible in-app notice.
 */
export function notifyUnderDevelopment(feature: string): void {
  console.info(UNDER_DEVELOPMENT_MESSAGE, { feature });
  window.dispatchEvent(new CustomEvent(UNDER_DEVELOPMENT_EVENT, { detail: { feature } }));
}
