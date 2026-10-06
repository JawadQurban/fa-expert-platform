/**
 * Typed, centralized access to build-time environment variables.
 * Keeps `import.meta.env` lookups out of feature code.
 */
export const env = {
  /** Backend base URL. Empty ⇒ the mock adapter is used (Q2). */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;
