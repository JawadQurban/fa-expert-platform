import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loading } from '@ds/composite';
import { Typography } from '@ds/primitives/Typography/Typography';
import { Container, Section } from '@ds/layout';
import { useLocale } from '@i18n/LocaleProvider';
import { expertHubPaths } from '../../app/router/paths';
import { useExpertHubAuth } from '../../app/auth/AuthProvider';
import { getShellContent } from '../../shared/content/shell.content';
import { SystemMessage } from '../../shared/components/SystemMessage';
import styles from './AuthPages.module.css';

/**
 * Expert Hub SSO callback (`/expert-hub/auth/callback`). The provider redirects
 * here after authentication; this page finalizes the session via
 * `completeSso(params)` and forwards the user to their return URL. With the real
 * Academy SSO this exchanges the authorization code; with the dev placeholder it
 * finalizes the mock session. A ref-guard ensures it processes exactly once
 * (safe under React StrictMode's double-invoked effects).
 */
export default function AuthCallbackPage() {
  const { locale } = useLocale();
  const c = getShellContent(locale).callback;
  const { completeSso } = useExpertHubAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  const processed = useRef(false);

  useEffect(() => {
    document.title = c.documentTitle;
  }, [c.documentTitle]);

  useEffect(() => {
    if (processed.current) {
      return;
    }
    processed.current = true;
    let active = true;
    void completeSso(params)
      .then((returnUrl) => {
        if (active) {
          void navigate(returnUrl, { replace: true });
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });
    return () => {
      active = false;
    };
    // Run once on mount — completeSso/navigate are stable; `params` is read at
    // mount only (the provider's redirect query does not change afterward).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) {
    return (
      <SystemMessage
        title={c.failedTitle}
        titleId="eh-callback-error-title"
        body={c.failedBody}
        actionLabel={c.retryLabel}
        actionHref={expertHubPaths.login}
      />
    );
  }

  return (
    <Section aria-labelledby="eh-callback-title">
      <Container size="prose">
        <div className={styles.stack}>
          <Loading label={c.signingIn} />
          <Typography as="p" id="eh-callback-title" variant="text-lg" color="muted">
            {c.signingIn}
          </Typography>
        </div>
      </Container>
    </Section>
  );
}
