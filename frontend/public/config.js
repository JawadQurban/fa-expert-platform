/*
 * Expert Hub RUNTIME configuration — DEFAULT / development values.
 *
 * This file is loaded (as a plain, non-module script) BEFORE the application
 * bundle, and sets `window.__EXPERT_HUB_RUNTIME_CONFIG__`, which the typed reader
 * in `app/config/runtimeConfig.ts` consumes.
 *
 * In the production container this file is REGENERATED from environment variables
 * at container start (see `deploy/config.js.template` +
 * `docker-entrypoint.sh`), so the SAME image serves Development / UAT / Production
 * with no rebuild.
 *
 * ⚠️ Browser-visible only — NEVER put secrets, tokens, or database/credential
 * values here. The frontend knows only the Expert Hub API base URL and public
 * auth entry details.
 */
window.__EXPERT_HUB_RUNTIME_CONFIG__ = {
  // Empty ⇒ the versioned in-memory mock providers (no backend needed).
  apiBaseUrl: '',
  environment: 'development',
  ssoEntryUrl: '',
  telemetryUrl: '',
};
