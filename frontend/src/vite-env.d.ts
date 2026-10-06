/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Hackathon backend base URL; empty ⇒ mock adapter (Q2). */
  readonly VITE_API_BASE_URL?: string;
  /** Expert Hub ASP.NET Core API base URL; empty ⇒ backend not connected (P-09). */
  readonly VITE_EXPERT_HUB_API_BASE_URL?: string;
  /** Expert Hub auth mode: `dev-sso` (temporary placeholder) or `academy-sso`. */
  readonly VITE_EXPERT_HUB_AUTH_MODE?: 'dev-sso' | 'academy-sso';
  /** Dev-only: role(s) the SSO placeholder grants on login — `trainer`,
   *  `internal`, or `trainer,internal`. Default `trainer`. */
  readonly VITE_EXPERT_HUB_DEV_ROLE?: string;
  /** **Build-time** base path for the standalone Expert Hub build (baked into
   *  asset URLs). Default `/expert-hub`; set `''` to serve at the domain root. */
  readonly VITE_EXPERT_HUB_BASE_PATH?: string;
  /** Deployment environment label (local-dev fallback for the runtime value). */
  readonly VITE_EXPERT_HUB_ENV?: string;
  /** Public SSO entry URL (local-dev fallback for the runtime value). */
  readonly VITE_EXPERT_HUB_SSO_ENTRY_URL?: string;
  /** Public telemetry endpoint (local-dev fallback for the runtime value). */
  readonly VITE_EXPERT_HUB_TELEMETRY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
