import { useEffect } from 'react';
import { useLocale } from '@i18n/LocaleProvider';
import { expertHubPaths } from '../../app/router/paths';
import { getShellContent } from '../../shared/content/shell.content';
import { SystemMessage } from '../../shared/components/SystemMessage';

/**
 * Expert Hub not-found page — the catch-all for unknown paths **inside** the
 * Expert Hub subtree. Owned by the Expert Hub boundary (never the Hackathon
 * `NotFound`), so an unknown `/expert-hub/*` path stays within this product's
 * own shell and 404, and does not fall through to the Hackathon route tree.
 */
export default function ExpertHubNotFoundPage() {
  const { locale } = useLocale();
  const c = getShellContent(locale).notFound;

  useEffect(() => {
    document.title = c.documentTitle;
  }, [c.documentTitle]);

  return (
    <SystemMessage
      title={c.title}
      titleId="eh-not-found-title"
      body={c.body}
      actionLabel={c.homeLabel}
      actionHref={expertHubPaths.landing}
      code="404"
    />
  );
}
