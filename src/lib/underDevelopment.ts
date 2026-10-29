/** Literal text logged when a control of a feature outside EP-01 is pressed. */
export const UNDER_DEVELOPMENT_MESSAGE = 'Funcionalidad en desarrollo, no disponible';

export const UNDER_DEVELOPMENT_EVENT = 'dashnode:under-development';

type ToastListener = (message: string, variant: 'info') => void;

let toastListener: ToastListener | null = null;

/** Wire ToastProvider to under-development notices (called once from App). */
export function registerUnderDevelopmentToast(listener: ToastListener): () => void {
  toastListener = listener;
  return () => {
    toastListener = null;
  };
}

/**
 * Handler for controls whose feature is not implemented yet. Logs for tracing and shows a
 * transient toolkit toast (right side, auto-dismiss).
 */
export function notifyUnderDevelopment(feature: string): void {
  console.info(UNDER_DEVELOPMENT_MESSAGE, { feature });
  toastListener?.(UNDER_DEVELOPMENT_MESSAGE, 'info');
  window.dispatchEvent(new CustomEvent(UNDER_DEVELOPMENT_EVENT, { detail: { feature } }));
}
