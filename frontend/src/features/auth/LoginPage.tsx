import { useEffect, useRef, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '@ds/primitives/Button';
import { Typography } from '@ds/primitives/Typography/Typography';
import { Alert } from '@ds/composite';
import { Container, Section } from '@ds/layout';
import { useLocale } from '@i18n/LocaleProvider';
import { expertHubPaths } from '../../app/router/paths';
import { useExpertHubAuth } from '../../app/auth/AuthProvider';
import { consumeSessionExpiredFlag } from '../../app/auth/devSsoAdapter';
import { getShellContent } from '../../shared/content/shell.content';
import styles from './AuthPages.module.css';

/**
 * Expert Hub login page (`/expert-hub/login`). **Academy SSO is the only way
 * in** (`P-177`, owner ruling 2026-08-30): the page renders exactly one
 * sign-in action, which begins the SSO flow via `startSso(returnUrl)` — no
 * credential form, no password, no login database (`DECISIONS.md` P-04,
 * `BR-0808`), and no development persona picker.
 *
 * **Portal-first, silent (`P-178`)**: FAST's model is that users sign in on
 * the Academy testing portal and are then sent to Expert Hub; the portal
 * login leaves a session at the STS, so when the real adapter is active this
 * page **auto-starts** the SSO handshake — the STS recognizes the session and
 * returns without showing a second login screen. A user who arrives with no
 * STS session simply sees FAST's own login instead. The button stays as the
 * visible fallback (a blocked redirect, a failed handshake).
 *
 * While the development placeholder adapter is active (no API/OIDC client
 * configured — `P-168`), nothing auto-starts; the same single button performs
 * the placeholder sign-in and a visible notice says so; the placeholder's
 * role comes from `VITE_EXPERT_HUB_DEV_ROLE`, never from a control here.
 *
 * Return-URL handling: `?returnUrl=` (set by the route guards) is carried
 * through the flow so the user lands back on the page they attempted after
 * signing in. Session-expiry: a one-shot flag surfaces a "session expired"
 * notice when the guard bounced an expired session here.
 */
export default function LoginPage() {
  const { locale } = useLocale();
  const c = getShellContent(locale).login;
  const [params] = useSearchParams();
  const { startSso, isPlaceholderAuth, isAuthenticated } = useExpertHubAuth();
  const [sessionExpired] = useState(() => consumeSessionExpiredFlag());
  // Default to the role-resolved entry: staff land internal, trainers on
  // Portal Home. A guard-supplied ?returnUrl= still wins.
  const returnUrl = params.get('returnUrl') ?? expertHubPaths.home;

  useEffect(() => {
    document.title = c.documentTitle;
  }, [c.documentTitle]);

  /**
   * P-178 — the silent handshake, attempted once per visit to this page. Real
   * adapter only: auto-starting the placeholder would sign the tests (and any
   * dev build) in by merely rendering the page.
   */
  const attemptedAutoSso = useRef(false);
  useEffect(() => {
    if (isPlaceholderAuth || isAuthenticated || attemptedAutoSso.current) {
      return;
    }
    attemptedAutoSso.current = true;
    void startSso(returnUrl);
  }, [isPlaceholderAuth, isAuthenticated, startSso, returnUrl]);

  // Already signed in? Skip the login page and go to the return target.
  if (isAuthenticated) {
    return <Navigate to={returnUrl} replace />;
  }

  return (
    <Section aria-labelledby="eh-login-title">
      <Container size="prose">
        <div className={styles.stack}>
          <Typography as="h1" id="eh-login-title" variant="display-md">
            {c.title}
          </Typography>

          {sessionExpired && (
            <Alert tone="warning" surface="tinted">
              {c.sessionExpiredNotice}
            </Alert>
          )}

          <Typography as="p" variant="text-lg" color="muted">
            {c.body}
          </Typography>

          {isPlaceholderAuth ? (
            <Alert tone="info" surface="tinted" title="Development build">
              {c.devNotice}
            </Alert>
          ) : (
            <Alert tone="info" surface="tinted" role="status">
              {c.redirectingNotice}
            </Alert>
          )}

          <div className={styles.actions}>
            <Button variant="primary" size="lg" onClick={() => void startSso(returnUrl)}>
              {c.ssoButtonLabel}
            </Button>
            <Button variant="tertiary" size="lg" href={expertHubPaths.landing}>
              {c.backHomeLabel}
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
