import { readRuntimeConfig } from './runtimeConfig';
import { isOidcConfigured, readOidcConfig } from './oidcConfig';

/**
 * Expert Hub application configuration — the single place that resolves the base
 * route, the Expert Hub API base URL, the environment, and the auth mode for
 * this standalone product (`DECISIONS.md` P-14).
 *
 * Expert Hub is a **standalone application** temporarily co-located in this
 * repository only to reuse the approved Design System. It owns its own shell,
 * router, auth boundary, and product code, and must be independently
 * extractable.
 *
 * Two configuration channels, by design:
 * - **Base path** (`EXPERT_HUB_BASE_PATH`) is **build-time** — it is baked into
 *   the hashed asset URLs, so it must be fixed when the image is built. It is the
 *   single source for every route + link and mirrors the Vite `base`
 *   (`vite.config.ts`). Configurable per deployment *target*
 *   (`/expert-hub/` today, `/` on standalone extraction) via
 *   `VITE_EXPERT_HUB_BASE_PATH`.
 * - **Everything else** (`apiBaseUrl`, `environment`, `ssoEntryUrl`, …) is
 *   **runtime** — resolved from the container-injected `config.js`
 *   (`window.__EXPERT_HUB_RUNTIME_CONFIG__`) so one image serves every
 *   environment (see `runtimeConfig.ts`). Falls back to build-time Vite env in
 *   local dev, then to a safe default.
 *
 * The frontend talks **only** to the future Expert Hub ASP.NET Core API — never
 * to FAST / MTM / ERP / SQL Server / SSO directly (`02C`).
 */

/**
 * Base route prefix for every Expert Hub route (single source of truth). Default
 * `/expert-hub`; set `VITE_EXPERT_HUB_BASE_PATH=''` at build time to serve the
 * standalone product at the domain root. Everything else derives from this — do
 * not hardcode `/expert-hub` anywhere else.
 */
export const EXPERT_HUB_BASE_PATH = import.meta.env.VITE_EXPERT_HUB_BASE_PATH ?? '/expert-hub';

export type ExpertHubAuthMode = 'dev-sso' | 'academy-sso';

/**
 * Every feature module that owns a data service — the names
 * `EXPERT_HUB_DATA_MODE` accepts, and the folder each one lives in.
 *
 * A module goes live the moment its backend ships, one at a time: the flag
 * is a LIST, not a switch, because "the API exists" was never true of the
 * whole product at once (owner ruling 2026-08-31). Anything absent from the
 * list keeps its versioned demo provider, so an unbuilt module shows demo
 * data instead of failing.
 */
export const EXPERT_HUB_MODULES = [
  'access',
  'agreementLifecycle',
  'agreements',
  'applications',
  'assignments',
  'committee',
  'directory',
  'engagements',
  'entitlements',
  'execution',
  'home',
  'identity',
  'internal',
  'interviews',
  'notifications',
  'profile',
  'reRouting',
  'screening',
  'serviceRequests',
  'submissions',
  'trainerSearch',
  'withdrawal',
] as const;

export type ExpertHubModule = (typeof EXPERT_HUB_MODULES)[number];

const runtime = readRuntimeConfig();

/**
 * `mock` (nothing live) · `api` (everything live) · `api:a,b,c` (those
 * modules live, the rest on demo data). An unknown name in the list is
 * ignored rather than throwing — a typo in a deployment env file must not
 * take the product down, and the module simply stays on its demo provider.
 */
function resolveLiveModules(dataMode: string): ReadonlySet<ExpertHubModule> {
  const trimmed = dataMode.trim();
  if (trimmed === '' || trimmed === 'mock') {
    return new Set();
  }
  const [head, list] = trimmed.split(':', 2);
  if (head !== 'api') {
    return new Set();
  }
  if (list == null || list.trim() === '') {
    return new Set(EXPERT_HUB_MODULES);
  }
  const named = new Set(list.split(',').map((name) => name.trim()));
  return new Set(EXPERT_HUB_MODULES.filter((module) => named.has(module)));
}

const liveModules = resolveLiveModules(runtime.dataMode);

export const expertHubConfig = {
  basePath: EXPERT_HUB_BASE_PATH,
  /**
   * The API base every service uses when it is live. **No longer blanked by
   * the data mode** — which module is live is now `isModuleLive` below, so
   * the base URL stays a base URL and one flag stopped meaning two things.
   */
  apiBaseUrl: runtime.apiBaseUrl,
  /** The API base AUTHENTICATION uses. Same value; kept as its own name
   *  because authentication is live even when every data module is not. */
  authApiBaseUrl: runtime.apiBaseUrl,
  /** `mock` while no module is live, `api` once any is — a coarse label for
   *  diagnostics; the per-module truth is `isModuleLive`. */
  dataMode: liveModules.size === 0 ? 'mock' : 'api',
  /** The modules serving real data, for diagnostics and the dev banner. */
  liveModules: [...liveModules],
  /** Deployment environment label (runtime): `development` | `uat` | `production`. */
  environment: runtime.environment,
  /** Optional public SSO entry URL (runtime). */
  ssoEntryUrl: runtime.ssoEntryUrl,
  /** Optional public telemetry endpoint (runtime). */
  telemetryUrl: runtime.telemetryUrl,
  /**
   * `dev-sso` uses the temporary, non-production SSO placeholder adapter;
   * `academy-sso` is the real INT-01 flow — which lives in the **API**
   * (`P-163`, BFF): the browser talks to `{apiBaseUrl}/auth/*` and holds only
   * an HttpOnly cookie.
   *
   * **Resolved from the configuration, not from a separate switch.** Academy
   * SSO requires *both* a reachable API (`apiBaseUrl` — it runs the exchange)
   * and a configured OIDC client (`oidcConfig.ts` — deployments set both
   * together in `deploy/env/*.env`). Anything less fails closed to
   * the placeholder, because a half-configured client fails in ways that look
   * like an outage. `VITE_EXPERT_HUB_AUTH_MODE` still forces the mode for
   * local work.
   */
  authMode:
    import.meta.env.VITE_EXPERT_HUB_AUTH_MODE ??
    (runtime.apiBaseUrl !== '' && isOidcConfigured() ? 'academy-sso' : 'dev-sso'),
  /** The resolved OIDC client (INT-01). Empty values ⇒ not yet registered. */
  oidc: readOidcConfig(),
  /**
   * **Dev-only.** Which role(s) the SSO *placeholder* grants on login —
   * comma-separated: `trainer`, `internal`, or `trainer,internal`. Default
   * `trainer` (so the internal-role guard stays demonstrable). Set
   * `VITE_EXPERT_HUB_DEV_ROLE=internal` (or `trainer,internal`) in
   * `frontend/.env.local` to reach the staff pages. Ignored entirely once the
   * real `academy-sso` adapter is active — role comes from SSO claims then.
   */
  devRoles: import.meta.env.VITE_EXPERT_HUB_DEV_ROLE ?? 'trainer',
  isDev: import.meta.env.DEV,
} as const;

/**
 * Does this module serve real data? Every feature service asks this instead
 * of inspecting the API base URL, so one module going live never implies
 * another has.
 *
 * A reachable API is still required: with no `apiBaseUrl` configured (local
 * work, an unconfigured deployment) nothing is live, whatever the list says.
 */
export function isModuleLive(module: ExpertHubModule): boolean {
  return expertHubConfig.apiBaseUrl !== '' && liveModules.has(module);
}

/**
 * The only environments where a demo provider or the placeholder sign-in may
 * run. Everything else — `uat`, `production`, or a label nobody expected —
 * must be wired to the real API and the real sign-in.
 */
const MOCK_ALLOWED_ENVIRONMENTS: ReadonlySet<string> = new Set(['development', 'test']);

/**
 * UAT safety — what would make this deployment SILENTLY simulate the product:
 * no API (every module on demo data), the development sign-in placeholder, or
 * modules left off `EXPERT_HUB_DATA_MODE`. Outside the mock-allowed
 * environments the app refuses to start and names the keys — names only,
 * never a value.
 *
 * `identity` is not counted: with an API and no live identity backend it
 * already fails closed on its own (`identityProviderKind`, RB-01).
 */
export function deploymentProblems(signals: {
  readonly environment: string;
  readonly apiBaseUrl: string;
  readonly liveModules: readonly ExpertHubModule[];
  readonly authMode: string;
}): readonly string[] {
  if (MOCK_ALLOWED_ENVIRONMENTS.has(signals.environment)) {
    return [];
  }
  const problems: string[] = [];
  if (signals.apiBaseUrl === '') {
    problems.push(
      `EXPERT_HUB_API_BASE_URL is empty — demo data is not allowed in "${signals.environment}".`
    );
  }
  if (signals.authMode !== 'academy-sso') {
    problems.push(
      `Sign-in is not configured (EXPERT_HUB_API_BASE_URL + EXPERT_HUB_OIDC_ISSUER / EXPERT_HUB_OIDC_CLIENT_ID) — the development sign-in placeholder is not allowed in "${signals.environment}".`
    );
  }
  const onDemoData = EXPERT_HUB_MODULES.filter(
    (module) => module !== 'identity' && !signals.liveModules.includes(module)
  );
  if (signals.apiBaseUrl !== '' && onDemoData.length > 0) {
    problems.push(
      `EXPERT_HUB_DATA_MODE leaves these modules on demo data: ${onDemoData.join(', ')}.`
    );
  }
  return problems;
}
