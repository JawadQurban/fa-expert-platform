import { Card, ItemIcon } from '@ds/composite';
import { Button, Icon, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../../app/router/paths';
import { formatDate } from '../../../shared/formatting';
import type { InternalContent } from '../internal.content';
import type { DashboardInterviewDto, DashboardRescheduleDto } from '../internal.types';
import styles from '../InternalDashboardPage.module.css';

/**
 * BUG-029 / BUG-028 — the interview side of the staff dashboard: reschedule
 * requests waiting on staff (shown only when there are some — an action list
 * that is empty is noise), then the next confirmed interviews. Each row opens
 * the application's interview page, where the reschedule is handled; this
 * component only reads.
 */
export function InterviewAgenda({
  interviews,
  reschedules,
  content,
  locale,
}: {
  readonly interviews: readonly DashboardInterviewDto[];
  readonly reschedules: readonly DashboardRescheduleDto[];
  readonly content: InternalContent;
  readonly locale: Locale;
}) {
  const copy = content.dashboard.interviews;
  const when = (iso: string) =>
    formatDate(iso, locale, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <>
      {reschedules.length > 0 && (
        <Card className={styles.panelCard}>
          <div className={styles.sectionHead}>
            <ItemIcon
              contained
              icon={<Icon name="alert-circle" size="md" tone="primary" decorative />}
            />
            <Typography as="h2" variant="text-lg" weight="bold">
              {copy.rescheduleHeading}
            </Typography>
          </div>
          <Typography as="p" variant="text-sm" color="muted">
            {copy.rescheduleLead}
          </Typography>
          <ul className={styles.recentList} aria-label={copy.rescheduleHeading}>
            {reschedules.map((row) => (
              <li key={row.applicationId} className={styles.recentRow}>
                <div className={styles.recentMain}>
                  <bdi className={styles.recentName}>{row.applicantName}</bdi>
                  <span className={styles.recentMeta}>
                    <bdi>{row.reference}</bdi> · {copy.requestedAt(when(row.requestedAt))}
                  </span>
                  {row.note != null && (
                    <Typography as="p" variant="text-sm">
                      <bdi>{row.note}</bdi>
                    </Typography>
                  )}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  href={expertHubPaths.internalApplicationInterview(row.applicationId)}
                  aria-label={copy.open(row.applicantName)}
                >
                  {content.inbox.list.open}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className={styles.panelCard}>
        <div className={styles.sectionHead}>
          <ItemIcon
            contained
            icon={<Icon name="co-present" size="md" tone="primary" decorative />}
          />
          <Typography as="h2" variant="text-lg" weight="bold">
            {copy.upcomingHeading}
          </Typography>
        </div>
        {interviews.length === 0 ? (
          <Typography as="p" variant="text-sm" color="muted">
            {copy.upcomingEmpty}
          </Typography>
        ) : (
          <ul className={styles.recentList} aria-label={copy.upcomingHeading}>
            {interviews.map((row) => (
              <li key={row.applicationId} className={styles.recentRow}>
                <div className={styles.recentMain}>
                  <bdi className={styles.recentName}>{row.applicantName}</bdi>
                  <span className={styles.recentMeta}>
                    <time dateTime={row.startsAt}>{when(row.startsAt)}</time> ·{' '}
                    <bdi>{row.reference}</bdi>
                    {row.ticketNumber != null && (
                      <>
                        {' · '}
                        <bdi>{copy.ticket(row.ticketNumber)}</bdi>
                      </>
                    )}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  href={expertHubPaths.internalApplicationInterview(row.applicationId)}
                  aria-label={copy.open(row.applicantName)}
                >
                  {content.inbox.list.open}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
