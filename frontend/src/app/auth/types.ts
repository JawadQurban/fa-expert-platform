/**
 * Expert Hub authentication contract — the abstraction the whole application
 * authenticates through, independent of any concrete identity provider.
 *
 * Authentication is delegated entirely to Academy SSO (`DECISIONS.md` P-04,
 * BRD `BR-0808`/`NFR-06`) — Expert Hub never manages credentials, passwords, or
 * a login database. This interface lets the app run today against a temporary
 * development placeholder (`devSsoAdapter.ts`) and later swap in the real
 * Academy SSO adapter (INT-01, still-open contract `G16`/`G28`) with no change
 * to the UI, guards, or router.
 */

/**
 * Coarse Expert Hub access role resolved from the SSO session's claims. The
 * BRD's roles (`BR-0801`) collapse, for routing/guard purposes, into three:
 * the baseline `individual` everybody who signs in holds, the self-service
 * `trainer` experience, and the operational `internal` one
 * (`02_INFORMATION_ARCHITECTURE.md` §7). Finer role scoping is enforced later,
 * server-side, by the Expert Hub API.
 *
 * ⚠️ `individual` grants nothing on its own — it is what a person is BEFORE
 * they are anything else, and it exists so that no signed-in person is
 * role-less and every screen has a defined answer for them. Owner ruling,
 * 2026-09-08.
 */
export type ExpertHubRole = 'individual' | 'trainer' | 'internal';

export interface ExpertHubSession {
  readonly userId: string;
  readonly displayName: string;
  readonly roles: readonly ExpertHubRole[];
  /** Epoch milliseconds after which the session is considered expired. */
  readonly expiresAt: number;
}

/** Result of beginning a login: where the browser should go next. For the real
 *  Academy SSO this is an external authorize URL; for the dev placeholder it is
 *  the in-app callback route. */
export interface StartLoginResult {
  readonly redirectTo: string;
}

/** Result of completing a login at the callback. */
export interface CompleteLoginResult {
  readonly session: ExpertHubSession;
  readonly returnUrl: string;
}

/**
 * The pluggable authentication adapter. One implementation exists today
 * (`devSsoAdapter`, temporary/non-production); the real `academySsoAdapter`
 * replaces it once INT-01 is contracted — the `AuthProvider`, guards, and pages
 * depend only on this interface.
 */
export interface ExpertHubAuthAdapter {
  /** Stable identifier of the concrete adapter (surfaced in dev diagnostics). */
  readonly kind: string;
  /** Whether this adapter is a non-production placeholder (drives the dev banner). */
  readonly isPlaceholder: boolean;
  /** Return the current session, or `null` if unauthenticated/expired. */
  getSession(): Promise<ExpertHubSession | null>;
  /** Begin login for a post-login `returnUrl`; resolves where to send the browser. */
  startLogin(returnUrl: string): Promise<StartLoginResult>;
  /** Complete login at the callback from the provider's query parameters. */
  completeLogin(params: URLSearchParams): Promise<CompleteLoginResult>;
  /** Clear the session. */
  logout(): Promise<void>;
}
