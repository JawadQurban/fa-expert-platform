import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { expertHubConfig } from '../config/expertHubConfig';
import { academySsoAdapter } from './academySsoAdapter';
import { devSsoAdapter } from './devSsoAdapter';
import type { ExpertHubAuthAdapter, ExpertHubRole, ExpertHubSession } from './types';

/**
 * Expert Hub authentication provider — owns the session state for the whole
 * Expert Hub application and mediates every login/logout through the pluggable
 * `ExpertHubAuthAdapter`. Mounted once, inside the Expert Hub root layout (never
 * in the shared Hackathon provider tree), so authentication is entirely a
 * property of this standalone product.
 *
 * The concrete adapter is injectable (default: the temporary `devSsoAdapter`);
 * swapping in the real Academy SSO adapter later requires no change here. Tests
 * inject a stub adapter and/or seed a session directly.
 */

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

interface ExpertHubAuthContextValue {
  readonly status: AuthStatus;
  readonly session: ExpertHubSession | null;
  readonly isAuthenticated: boolean;
  readonly isPlaceholderAuth: boolean;
  // Declared as arrow-function properties (not method signatures) so consumers
  // can safely destructure them without `unbound-method` complaints.
  readonly hasRole: (role: ExpertHubRole) => boolean;
  /** Begin login and send the browser to the provider (dev: the in-app callback). */
  readonly startSso: (returnUrl: string) => Promise<void>;
  /** Finalize login at the callback; resolves the post-login return URL. */
  readonly completeSso: (params: URLSearchParams) => Promise<string>;
  readonly logout: () => Promise<void>;
}

const AuthContext = createContext<ExpertHubAuthContextValue | null>(null);

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * The adapter the configuration selects: the real Academy SSO BFF client once
 * an API and an OIDC client are both configured (`authMode`, `P-163`), the
 * development placeholder until then — so the swap the placeholder always
 * promised is an env-file edit, not a code change.
 */
const configuredAdapter: ExpertHubAuthAdapter =
  expertHubConfig.authMode === 'academy-sso' ? academySsoAdapter : devSsoAdapter;

interface AuthProviderProps {
  readonly children: ReactNode;
  /** Override the adapter (a stub in tests). */
  readonly adapter?: ExpertHubAuthAdapter;
  /** Seed an initial session (tests only) — skips the async `getSession` probe. */
  readonly initialSession?: ExpertHubSession | null;
}

export function AuthProvider({
  children,
  adapter = configuredAdapter,
  initialSession,
}: AuthProviderProps) {
  const navigate = useNavigate();
  const [session, setSession] = useState<ExpertHubSession | null>(initialSession ?? null);
  const [status, setStatus] = useState<AuthStatus>(
    initialSession === undefined ? 'unknown' : initialSession ? 'authenticated' : 'unauthenticated'
  );

  // Probe the adapter for an existing session on mount (unless one was seeded).
  useEffect(() => {
    if (initialSession !== undefined) {
      return;
    }
    let active = true;
    void adapter.getSession().then((existing) => {
      if (!active) {
        return;
      }
      setSession(existing);
      setStatus(existing ? 'authenticated' : 'unauthenticated');
    });
    return () => {
      active = false;
    };
  }, [adapter, initialSession]);

  const startSso = useCallback(
    async (returnUrl: string) => {
      const { redirectTo } = await adapter.startLogin(returnUrl);
      if (isExternalUrl(redirectTo)) {
        // Real Academy SSO: leave the SPA for the external authorize endpoint.
        window.location.assign(redirectTo);
      } else {
        // react-router's navigate returns a promise (view transitions) — discard it.
        void navigate(redirectTo, { replace: true });
      }
    },
    [adapter, navigate]
  );

  const completeSso = useCallback(
    async (params: URLSearchParams) => {
      const { session: next, returnUrl } = await adapter.completeLogin(params);
      setSession(next);
      setStatus('authenticated');
      return returnUrl;
    },
    [adapter]
  );

  const logout = useCallback(async () => {
    await adapter.logout();
    setSession(null);
    setStatus('unauthenticated');
  }, [adapter]);

  const hasRole = useCallback(
    (role: ExpertHubRole) => session?.roles.includes(role) ?? false,
    [session]
  );

  const value = useMemo<ExpertHubAuthContextValue>(
    () => ({
      status,
      session,
      isAuthenticated: status === 'authenticated',
      isPlaceholderAuth: adapter.isPlaceholder,
      hasRole,
      startSso,
      completeSso,
      logout,
    }),
    [status, session, adapter.isPlaceholder, hasRole, startSso, completeSso, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useExpertHubAuth(): ExpertHubAuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useExpertHubAuth must be used within an <AuthProvider>.');
  }
  return ctx;
}
