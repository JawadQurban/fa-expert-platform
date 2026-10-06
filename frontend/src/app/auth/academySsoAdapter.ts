import { expertHubConfig } from '../config/expertHubConfig';
import { expertHubPaths } from '../router/paths';
import type {
  CompleteLoginResult,
  ExpertHubAuthAdapter,
  ExpertHubRole,
  ExpertHubSession,
  StartLoginResult,
} from './types';

/**
 * The real Academy SSO adapter — INT-01, implemented as a **BFF client**
 * (`P-163`): the OIDC Authorization Code + PKCE exchange runs entirely in the
 * Expert Hub API, the browser holds only an HttpOnly session cookie, and this
 * adapter never sees a token, a code, or a claim. It speaks to exactly three
 * endpoints:
 *
 * - `GET  {apiBaseUrl}/auth/login?returnUrl=…` — begins the flow (a full-page
 *   navigation, because the provider must see the browser, not a fetch).
 * - `GET  {apiBaseUrl}/auth/session` — the current session, or 401.
 * - `POST {apiBaseUrl}/auth/logout` — ends the local session; the response
 *   names the provider's end-session URL when it supports RP-initiated logout.
 *
 * The API redirects straight back to the validated `returnUrl` after its
 * callback, so in this flow the SPA's own callback route is normally never
 * visited — `completeLogin` exists for interface completeness and resolves via
 * the session endpoint.
 *
 * `credentials: 'include'` on every call: the session is a cookie, and in
 * local development the SPA (:5173) and the API (:5103) are different origins.
 * The API's CORS allow-list is what keeps that a deliberate handshake.
 */

interface SessionWire {
  readonly userId: string;
  readonly displayName: string;
  readonly roles: readonly string[];
  readonly expiresAt: number;
}

function apiUrl(path: string): string {
  // `authApiBaseUrl`, not `apiBaseUrl`: the hybrid demo mode blanks the data
  // base while authentication stays on the real API.
  const base = expertHubConfig.authApiBaseUrl;
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function isExpertHubRole(value: string): value is ExpertHubRole {
  return value === 'individual' || value === 'trainer' || value === 'internal';
}

function toSession(wire: SessionWire): ExpertHubSession {
  return {
    userId: wire.userId,
    displayName: wire.displayName,
    // The API is the authority on roles (`P-J9`); anything unrecognized is
    // dropped rather than guessed at.
    roles: wire.roles.filter(isExpertHubRole),
    expiresAt: wire.expiresAt,
  };
}

async function fetchSession(): Promise<ExpertHubSession | null> {
  try {
    const response = await fetch(apiUrl('auth/session'), {
      credentials: 'include',
      headers: { accept: 'application/json' },
    });
    if (!response.ok) {
      // 401 is the API's word for "no session" — not an error. Anything else
      // (a 5xx, a proxy hiccup) also resolves to "unauthenticated" so the app
      // renders the login screen rather than crashing.
      return null;
    }
    return toSession((await response.json()) as SessionWire);
  } catch {
    // API unreachable — unauthenticated, never a crash.
    return null;
  }
}

export const academySsoAdapter: ExpertHubAuthAdapter = {
  kind: 'academy-sso',
  isPlaceholder: false,

  getSession: fetchSession,

  startLogin(returnUrl: string): Promise<StartLoginResult> {
    // `returnUrl` arrives browser-absolute (guards use `location.pathname`,
    // which already carries the base path), and the API validates it as a
    // relative path — its open-redirect guard, not ours.
    return Promise.resolve({
      redirectTo: `${apiUrl('auth/login')}?returnUrl=${encodeURIComponent(returnUrl)}`,
    });
  },

  async completeLogin(params: URLSearchParams): Promise<CompleteLoginResult> {
    // Normally unreachable in the BFF flow — the API's callback redirects
    // straight to the return URL. If the SPA callback route is visited anyway,
    // the cookie (if the handshake succeeded) is already set: resolve it.
    const session = await fetchSession();
    if (session === null) {
      throw new Error('Academy SSO sign-in did not complete.');
    }
    return { session, returnUrl: params.get('returnUrl') ?? expertHubPaths.home };
  },

  async logout(): Promise<void> {
    try {
      const response = await fetch(apiUrl('auth/logout'), {
        method: 'POST',
        credentials: 'include',
        headers: { accept: 'application/json' },
      });
      if (response.ok) {
        const body = (await response.json()) as { providerLogoutUrl?: string | null };
        if (typeof body.providerLogoutUrl === 'string' && body.providerLogoutUrl !== '') {
          // RP-initiated logout: only a top-level navigation can end the
          // provider's session — a fetch cannot follow it cross-origin.
          window.location.assign(body.providerLogoutUrl);
        }
      }
    } catch {
      // The local session may already be gone (or the API unreachable);
      // logout must never throw at the UI.
    }
  },
};
