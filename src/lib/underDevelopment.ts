/** Literal text logged when a control of a feature outside EP-01 is pressed. */
export const UNDER_DEVELOPMENT_MESSAGE = 'Funcionalidad en desarrollo, no disponible';

/**
 * Handler for every control whose feature does not belong to EP-01 (authentication and
 * sessions). It only logs: the feature is not implemented yet and nothing else happens.
 * `feature` identifies the pressed control to ease tracing.
 */
export function notifyUnderDevelopment(feature: string): void {
  console.info(UNDER_DEVELOPMENT_MESSAGE, { feature });
}
