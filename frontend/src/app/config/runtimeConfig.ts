/**
 * Expert Hub **runtime** configuration reader.
 *
 * The production Docker image is built **once** and moved unchanged between
 * Development / UAT / Production; the environment-specific values are injected at
 * **container start** into a small `config.js` that sets
 * `window.__EXPERT_HUB_RUNTIME_CONFIG__` *before* the app bootstraps (see
 * `deploy/config.js.template` + `docker-entrypoint.sh`). This reader
 * resolves each value in priority order:
 *
 *   1. runtime `window.__EXPERT_HUB_RUNTIME_CONFIG__` (container / prod),
 *   2. build-time Vite env `import.meta.env.VITE_EXPERT_HUB_*` (local dev),
 *   3. a safe default.
 *
 * ⚠️ Browser-visible only. It must contain the Expert Hub **API base URL** and
 * public auth entry details — never FAST / MTM / ERP / SQL Server credentials or
 * any secret (those live behind the future Expert Hub ASP.NET Core API).
 */

export interface ExpertHubRuntimeConfig {
  /** Expert Hub ASP.NET Core API base URL. Empty ⇒ the versioned mock providers. */
  readonly apiBaseUrl: string;
  /**
   * `mock` keeps the DATA screens on the built-in demo providers even while
   * `apiBaseUrl` is set — the hybrid demo mode (owner ruling 2026-08-30):
   * authentication is real Academy SSO, data is demo until each backend
   * module ships. Anything else (default `api`) serves data from the API.
   */
  readonly dataMode: string;
  /** Deployment environment label (`development` | `uat` | `production` | …). */
  readonly environment: string;
  /** Optional public SSO entry URL (Academy SSO authorize endpoint). */
  readonly ssoEntryUrl: string;
  /** Optional public telemetry endpoint. */
  readonly telemetryUrl: string;

  /* ── OpenID Connect / INT-01 (see `oidcConfig.ts`) ──────────────── *
   *
   * Every one of these is **public by nature**: the client id and scopes travel
   * in the authorize URL, and the issuer and redirect URI are registered with
   * the provider. There is deliberately **no client-secret entry** — a secret
   * placed in this file is served to every browser. If FAST issues one, the
   * client is confidential and its flow belongs in the Expert Hub API.
   */

  /** OIDC issuer URL, from which discovery is derived. */
  readonly oidcIssuer: string;
  /** Explicit discovery document URL, when it is not at the conventional path. */
  readonly oidcDiscoveryUrl: string;
  /** The **public** client id FAST issues. */
  readonly oidcClientId: string;
  /** Space-separated scopes; defaults applied in `oidcConfig.ts`. */
  readonly oidcScopes: string;
  /** Registered redirect URI — must match FAST's registration exactly. */
  readonly oidcRedirectUri: string;
  /** Registered post-logout redirect URI. */
  readonly oidcPostLogoutRedirectUri: string;
  /** Claim carrying role(s) — name and values are `G16`/`G28`, still open. */
  readonly oidcRoleClaim: string;
  /** Claim values mapping to the `internal` role, comma-separated. */
  readonly oidcInternalRoleValues: string;
  /** Claim values mapping to the `trainer` role, comma-separated. */
  readonly oidcTrainerRoleValues: string;
  /** Claim carrying the display name. */
  readonly oidcNameClaim: string;
}

declare global {
  interface Window {
    /** Injected by the container `config.js` before app bootstrap. */
    __EXPERT_HUB_RUNTIME_CONFIG__?: Partial<ExpertHubRuntimeConfig>;
  }
}

function fromWindow(): Partial<ExpertHubRuntimeConfig> {
  if (typeof window === 'undefined') {
    return {};
  }
  const raw = window.__EXPERT_HUB_RUNTIME_CONFIG__;
  return raw != null && typeof raw === 'object' ? raw : {};
}

/**
 * Normalize a candidate value. Rejects empty strings **and** un-substituted
 * templates (e.g. `__EXPERT_HUB_API_BASE_URL__` or `${VITE_…}`) so a container
 * whose entrypoint failed to substitute falls back cleanly instead of using a
 * garbage URL.
 */
function clean(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed === '' || /^__[A-Z0-9_]+__$/.test(trimmed) || trimmed.startsWith('${')) {
    return undefined;
  }
  return trimmed;
}

export function readRuntimeConfig(): ExpertHubRuntimeConfig {
  const win = fromWindow();
  const env = import.meta.env;
  return {
    apiBaseUrl: clean(win.apiBaseUrl) ?? clean(env.VITE_EXPERT_HUB_API_BASE_URL) ?? '',
    dataMode: clean(win.dataMode) ?? clean(env.VITE_EXPERT_HUB_DATA_MODE) ?? 'api',
    environment:
      clean(win.environment) ??
      clean(env.VITE_EXPERT_HUB_ENV) ??
      (env.DEV ? 'development' : 'production'),
    ssoEntryUrl: clean(win.ssoEntryUrl) ?? clean(env.VITE_EXPERT_HUB_SSO_ENTRY_URL) ?? '',
    telemetryUrl: clean(win.telemetryUrl) ?? clean(env.VITE_EXPERT_HUB_TELEMETRY_URL) ?? '',
    oidcIssuer: clean(win.oidcIssuer) ?? clean(env.VITE_EXPERT_HUB_OIDC_ISSUER) ?? '',
    oidcDiscoveryUrl:
      clean(win.oidcDiscoveryUrl) ?? clean(env.VITE_EXPERT_HUB_OIDC_DISCOVERY_URL) ?? '',
    oidcClientId: clean(win.oidcClientId) ?? clean(env.VITE_EXPERT_HUB_OIDC_CLIENT_ID) ?? '',
    oidcScopes: clean(win.oidcScopes) ?? clean(env.VITE_EXPERT_HUB_OIDC_SCOPES) ?? '',
    oidcRedirectUri:
      clean(win.oidcRedirectUri) ?? clean(env.VITE_EXPERT_HUB_OIDC_REDIRECT_URI) ?? '',
    oidcPostLogoutRedirectUri:
      clean(win.oidcPostLogoutRedirectUri) ??
      clean(env.VITE_EXPERT_HUB_OIDC_POST_LOGOUT_REDIRECT_URI) ??
      '',
    oidcRoleClaim: clean(win.oidcRoleClaim) ?? clean(env.VITE_EXPERT_HUB_OIDC_ROLE_CLAIM) ?? '',
    oidcInternalRoleValues:
      clean(win.oidcInternalRoleValues) ??
      clean(env.VITE_EXPERT_HUB_OIDC_INTERNAL_ROLE_VALUES) ??
      '',
    oidcTrainerRoleValues:
      clean(win.oidcTrainerRoleValues) ?? clean(env.VITE_EXPERT_HUB_OIDC_TRAINER_ROLE_VALUES) ?? '',
    oidcNameClaim: clean(win.oidcNameClaim) ?? clean(env.VITE_EXPERT_HUB_OIDC_NAME_CLAIM) ?? '',
  };
}

/**
 * Validate the resolved config at startup. Nothing is *strictly required* — the
 * app runs against the in-memory mock when `apiBaseUrl` is empty — but any value
 * that IS provided must be well-formed, so a misconfigured container fails loudly
 * (safe error state) instead of silently calling a broken endpoint.
 */
export function validateRuntimeConfig(config: ExpertHubRuntimeConfig): readonly string[] {
  const problems: string[] = [];
  const isUrlLike = (value: string) => value.startsWith('/') || /^https?:\/\//.test(value);

  if (config.apiBaseUrl !== '' && !isUrlLike(config.apiBaseUrl)) {
    problems.push(
      `apiBaseUrl must be an absolute URL or a root-relative path, got "${config.apiBaseUrl}".`
    );
  }
  if (config.ssoEntryUrl !== '' && !isUrlLike(config.ssoEntryUrl)) {
    problems.push(`ssoEntryUrl must be an absolute URL or a root-relative path.`);
  }
  return problems;
}
