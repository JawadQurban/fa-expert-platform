import { useEffect } from 'react';
import { useLocale } from '@i18n/LocaleProvider';
import { expertHubPaths } from '../../app/router/paths';
import { getShellContent } from '../../shared/content/shell.content';
import { SystemMessage } from '../../shared/components/SystemMessage';

/**
 * Temporary placeholder for authenticated Expert Hub routes whose full pages are
 * not built yet (My Applications, Application Details, My Profile, internal
 * home). It exists so those routes — and their guards — are real and testable
 * now, per the recommended route set; each is replaced by its production page
 * during the page-by-page build (`04_PAGE_SPECIFICATIONS.md`).
 */
export default function ComingSoonPage() {
  const { locale } = useLocale();
  const c = getShellContent(locale).comingSoon;

  useEffect(() => {
    document.title = c.eyebrow;
  }, [c.eyebrow]);

  return (
    <SystemMessage
      title={c.eyebrow}
      titleId="eh-coming-soon-title"
      body={c.body}
      actionLabel={c.homeLabel}
      actionHref={expertHubPaths.applications}
    />
  );
}
