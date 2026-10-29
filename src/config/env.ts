const DEFAULT_API_BASE_URL = '/api/v1';

function readApiBaseUrl(value: string | undefined): string {
  const trimmed = value?.trim();
  const base = trimmed ? trimmed : DEFAULT_API_BASE_URL;
  return base.replace(/\/+$/, '');
}

export const env = {
  /** Base path of the backend API. Relative by default so cookies stay first-party. */
  apiBaseUrl: readApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  /** Milliseconds after which an API call is considered a technical failure. */
  requestTimeoutMs: 15_000,
  /** AI assistant calls (Gemini can take over a minute). */
  aiRequestTimeoutMs: 190_000,
} as const;
