import { useEffect } from 'react';
import { useLocale } from '@i18n/LocaleProvider';
import { expertHubPaths } from '../../app/router/paths';
import { getShellContent } from '../../shared/content/shell.content';
import { SystemMessage } from '../../shared/components/SystemMessage';

/**
 * Expert Hub unauthorized page (`/expert-hub/unauthorized`). Shown when an
 * authenticated user reaches a route their role cannot access (via
 * `RequireRole`). Distinct from not-found: the resource exists, the user lacks
 * permission.
 */
export default function UnauthorizedPage() {
  const { locale } = useLocale();
  const c = getShellContent(locale).unauthorized;

  useEffect(() => {
    document.title = c.documentTitle;
  }, [c.documentTitle]);

  return (
    <SystemMessage
      title={c.title}
      titleId="eh-unauthorized-title"
      body={c.body}
      actionLabel={c.homeLabel}
      actionHref={expertHubPaths.landing}
      // The resource exists and this person may not see it — 403, not 404.
      code="403"
    />
  );
}
