import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loading } from '@ds/composite';
import { useLocale } from '@i18n/LocaleProvider';
import { expertHubPaths, loginWithReturn } from '../router/paths';
import { getShellContent } from '../../shared/content/shell.content';
import type { ExpertHubRole } from './types';
import { useExpertHubAuth } from './AuthProvider';

/**
 * Route guards for the Expert Hub authenticated area. Composed as pathless
 * parent routes in the Expert Hub router (`routes.tsx`) — they render `<Outlet/>`
 * for permitted users and redirect otherwise. All behavior is owned by the
 * Expert Hub boundary; the redirect targets come from the Expert Hub path
 * registry, and the session state from the Expert Hub `AuthProvider`.
 */

/** Requires an authenticated session. Unauthenticated users are sent to the
 *  Expert Hub login page with a `returnUrl`, so they come back to the page they
 *  attempted after signing in (return-URL handling). */
export function RequireAuth() {
  const { status } = useExpertHubAuth();
  const location = useLocation();
  const { locale } = useLocale();

  if (status === 'unknown') {
    // Session probe in flight — a brief, accessible busy state (never a flash of
    // the login page before the session resolves).
    return (
      <div style={{ display: 'grid', placeItems: 'center', minBlockSize: '40vh' }}>
        <Loading label={getShellContent(locale).callback.signingIn} />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    const returnUrl = `${location.pathname}${location.search}`;
    return <Navigate to={loginWithReturn(returnUrl)} replace />;
  }

  return <Outlet />;
}

/** The role-resolved entry. The IA resolves `/expert-hub` by role, and
 *  `/expert-hub/home` is that entry today (`paths.ts`): a session holding the
 *  trainer role gets Portal Home (EH-TP-01); a staff-only session — internal
 *  role without trainer — is taken to the internal dashboard (EH-INT-01)
 *  instead of a trainer surface that means nothing to them. Nested under
 *  `RequireAuth`, so a session always exists here. */
export function ResolveHomeByRole() {
  const { hasRole } = useExpertHubAuth();
  if (hasRole('internal') && !hasRole('trainer')) {
    return <Navigate to={expertHubPaths.internal} replace />;
  }
  return <Outlet />;
}

/** Requires a specific role (nested under `RequireAuth`). Authenticated users
 *  lacking the role are sent to the Expert Hub unauthorized page. The prop is
 *  named `requiredRole` (not `role`) so jsx-a11y does not mistake it for a DOM
 *  ARIA role. */
export function RequireRole({ requiredRole }: { readonly requiredRole: ExpertHubRole }) {
  const { hasRole } = useExpertHubAuth();
  if (!hasRole(requiredRole)) {
    return <Navigate to={expertHubPaths.unauthorized} replace />;
  }
  return <Outlet />;
}

/**
 * The areas that belong to a trainer.
 *
 * The trainer role is granted from the Academy's own record at sign-in, and the
 * owner's ruling of 2026-09-08 is that holding it means «already [an] approved
 * trainer». Somebody holding only the baseline `individual` role has their home
 * page and their own applications, and these areas would have nothing to show
 * them.
 *
 * ⚠️ <b>Hiding the tab is not enough.</b> A bookmark, a link in an email or a
 * typed URL ignores the header entirely. The guard is where the rule holds; the
 * nav is only how it is communicated.
 *
 * Sent home rather than to the unauthorized page: nothing has gone wrong and
 * nobody is forbidden — home is where their application and their next step
 * are.
 */
export function RequireTrainer() {
  const { hasRole } = useExpertHubAuth();
  if (!hasRole('trainer')) {
    return <Navigate to={expertHubPaths.home} replace />;
  }
  return <Outlet />;
}
