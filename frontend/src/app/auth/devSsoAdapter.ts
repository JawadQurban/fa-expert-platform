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
 * ⚠️ TEMPORARY, NON-PRODUCTION development SSO placeholder. ⚠️
 *
 * This adapter exists ONLY so the Expert Hub frontend authentication
 * architecture (login action, callback, guards, return-URL handling,
 * session-expiry) can be built and demonstrated before the real Academy SSO
 * (INT-01) contract is available (`G16`/`G28`). It **must be replaced** by an
 * `academySsoAdapter` implementing the same `ExpertHubAuthAdapter` interface —
 * the `AuthProvider`, guards, router, and pages depend only on that interface,
 * so the swap changes nothing else.
 *
 * It is NOT authentication: it takes no credentials, has no password/login
 * database, and simply establishes a mock session in `sessionStorage` on
 * "login". Do not ship it. The login page shows a visible development notice
 * whenever a placeholder adapter is active, and offers no persona picker
 * (`P-177`) — the placeholder's role comes from `VITE_EXPERT_HUB_DEV_ROLE`.
 */

const SESSION_KEY = 'expert-hub:dev-session';
const RETURN_URL_KEY = 'expert-hub:dev-return-url';
const EXPIRED_FLAG_KEY = 'expert-hub:session-expired';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours — a dev convenience, not a security control.

/** Identity presented for the dev session (dev display only). */
const PERSONA_IDENTITY = {
  trainer: { userId: 'dev-trainer', displayName: 'مدرب تجريبي' },
  internal: { userId: 'dev-internal', displayName: 'موظف تجريبي' },
} as const;

function safeStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

/**
 * Dev-only role resolution — `VITE_EXPERT_HUB_DEV_ROLE` (accepts `trainer`,
 * `internal`, or `trainer,internal`), defaulting to `trainer`. The login
 * page's persona picker is gone (`P-177`: the sign-in surface is SSO only);
 * which experience a dev build opens is environment configuration.
 */
function resolveDevRoles(): ExpertHubRole[] {
  const parsed = String(expertHubConfig.devRoles)
    .split(',')
    .map((role) => role.trim())
    .filter((role): role is ExpertHubRole => role === 'trainer' || role === 'internal');
  return parsed.length > 0 ? parsed : ['trainer'];
}

function readSession(store: Storage): ExpertHubSession | null {
  const raw = store.getItem(SESSION_KEY);
  if (raw == null) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as ExpertHubSession;
    if (typeof parsed.expiresAt !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export const devSsoAdapter: ExpertHubAuthAdapter = {
  kind: 'dev-sso-placeholder',
  isPlaceholder: true,

  getSession(): Promise<ExpertHubSession | null> {
    const store = safeStorage();
    if (store == null) {
      return Promise.resolve(null);
    }
    const session = readSession(store);
    if (session == null) {
      return Promise.resolve(null);
    }
    if (session.expiresAt <= Date.now()) {
      // Distinguish an *expired* session from never having logged in, so the
      // login page can show the "session expired" notice (return-URL handling
      // + session-expiry behavior).
      store.removeItem(SESSION_KEY);
      store.setItem(EXPIRED_FLAG_KEY, '1');
      return Promise.resolve(null);
    }
    return Promise.resolve(session);
  },

  startLogin(returnUrl: string): Promise<StartLoginResult> {
    const store = safeStorage();
    store?.setItem(RETURN_URL_KEY, returnUrl);
    store?.removeItem(EXPIRED_FLAG_KEY);
    // A real SSO adapter returns the external authorize URL here; the dev
    // placeholder bounces straight to the in-app callback, imitating the
    // provider's redirect-back without any external identity provider.
    return Promise.resolve({ redirectTo: expertHubPaths.authCallback });
  },

  completeLogin(_params: URLSearchParams): Promise<CompleteLoginResult> {
    const store = safeStorage();
    const returnUrl = store?.getItem(RETURN_URL_KEY) ?? expertHubPaths.home;
    const roles = resolveDevRoles();
    // If this dev session is internal-only, present a staff identity; otherwise
    // keep the trainer identity (a combined trainer+internal dev stays a trainer).
    const internalOnly = roles.includes('internal') && !roles.includes('trainer');
    const identity = PERSONA_IDENTITY[internalOnly ? 'internal' : 'trainer'];
    const session: ExpertHubSession = {
      userId: identity.userId,
      displayName: identity.displayName,
      roles,
      expiresAt: Date.now() + SESSION_TTL_MS,
    };
    store?.setItem(SESSION_KEY, JSON.stringify(session));
    store?.removeItem(RETURN_URL_KEY);
    store?.removeItem(EXPIRED_FLAG_KEY);
    return Promise.resolve({ session, returnUrl });
  },

  logout(): Promise<void> {
    const store = safeStorage();
    store?.removeItem(SESSION_KEY);
    store?.removeItem(RETURN_URL_KEY);
    return Promise.resolve();
  },
};

/** Whether the last `getSession()` cleared an *expired* session (one-shot,
 *  consumed by the login page to show the session-expired notice). */
export function consumeSessionExpiredFlag(): boolean {
  const store = safeStorage();
  if (store == null) {
    return false;
  }
  const flagged = store.getItem(EXPIRED_FLAG_KEY) === '1';
  if (flagged) {
    store.removeItem(EXPIRED_FLAG_KEY);
  }
  return flagged;
}
