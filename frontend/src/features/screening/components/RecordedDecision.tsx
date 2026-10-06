import { Alert } from '@ds/composite';
import { Button, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../../app/router/paths';
import type { ApplicationService } from '../../applications/application.types';
import type { ScreeningContent } from '../screening.content';
import type { ScreeningDecisionSummaryDto } from '../screening.types';
import { Panel } from '../../../shared/workspace/Panel';
import styles from './RecordedDecision.module.css';
import { formatDate } from '../../../shared/formatting';

/**
 * The read-only face of a screening decision already taken — shown instead of
 * the decision panel once `decisionPending` is false, so a decided application
 * can still be reviewed (J-05/F6/AC-2: evaluation results stay accessible
 * afterwards) without offering a second decision on the same application.
 *
 * The auto-rejected list is shown explicitly (F5/AC-2): partial acceptance is
 * never silent, in the record any more than in the decision.
 */
function formatServiceList(
  services: readonly ApplicationService[],
  content: ScreeningContent,
  locale: Locale
): string {
  return services.map((service) => content.services[service]).join(locale === 'ar' ? '، ' : ', ');
}

function formatDateTime(iso: string, locale: Locale): string {
  return formatDate(new Date(iso), locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function RecordedDecision({
  decision,
  content,
  locale,
}: {
  readonly decision: ScreeningDecisionSummaryDto;
  readonly content: ScreeningContent;
  readonly locale: Locale;
}) {
  const copy = content.recorded;
  const accepted = decision.kind === 'accept';

  return (
    <Panel shape="inline" title={content.decision.heading} titleId="eh-screening-recorded">
      <Alert
        tone={accepted ? 'success' : 'error'}
        surface="tinted"
        title={accepted ? copy.acceptTitle : copy.rejectTitle}
        role="status"
      >
        {accepted
          ? copy.acceptBody(formatServiceList(decision.acceptedServices, content, locale))
          : copy.rejectBody}
      </Alert>

      <dl className={styles.summary}>
        {decision.acceptedServices.length > 0 && (
          <div className={styles.row}>
            <dt>
              <Typography as="span" variant="text-sm" color="muted">
                {copy.acceptedLabel}
              </Typography>
            </dt>
            <dd>
              <Typography as="span" variant="text-md">
                {formatServiceList(decision.acceptedServices, content, locale)}
              </Typography>
            </dd>
          </div>
        )}
        {decision.autoRejectedServices.length > 0 && (
          <div className={styles.row}>
            <dt>
              <Typography as="span" variant="text-sm" color="muted">
                {copy.autoRejectedLabel}
              </Typography>
            </dt>
            <dd>
              <Typography as="span" variant="text-md">
                {formatServiceList(decision.autoRejectedServices, content, locale)}
              </Typography>
            </dd>
          </div>
        )}
        {decision.exemptedServices.length > 0 && (
          <div className={styles.row}>
            <dt>
              <Typography as="span" variant="text-sm" color="muted">
                {copy.exemptedLabel}
              </Typography>
            </dt>
            <dd>
              <Typography as="span" variant="text-md">
                {formatServiceList(decision.exemptedServices, content, locale)}
              </Typography>
            </dd>
          </div>
        )}
        {decision.rejectionReason != null && (
          <div className={styles.row}>
            <dt>
              <Typography as="span" variant="text-sm" color="muted">
                {copy.reasonLabel}
              </Typography>
            </dt>
            <dd>
              <Typography as="span" variant="text-md">
                {content.rejectionReasons[decision.rejectionReason]}
              </Typography>
            </dd>
          </div>
        )}
      </dl>

      <Typography as="p" variant="text-sm" color="muted">
        {copy.decidedBy(decision.decidedByName, formatDateTime(decision.decidedAt, locale))}
      </Typography>

      <div>
        <Button variant="secondary" size="md" href={expertHubPaths.internalApplications}>
          {copy.backToInbox}
        </Button>
      </div>
    </Panel>
  );
}
