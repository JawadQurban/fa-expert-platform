import { Card, ItemIcon } from '@ds/composite';
import { Button, Icon, Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../../app/router/paths';
import { formatDate } from '../../../shared/formatting';
import type { InternalContent } from '../internal.content';
import type { DashboardDeclinedOfferDto } from '../internal.types';
import styles from '../InternalDashboardPage.module.css';

/**
 * BUG-047 (J-22) — trainers who declined an assignment offer on a request the
 * caller follows, and where the seat went: on to the next candidate, or back
 * to the matching engine. Shown only when there are some; each row opens the
 * request. Read-only, like `InterviewAgenda`.
 */
export function DeclinedOffers({
  rows,
  content,
  locale,
}: {
  readonly rows: readonly DashboardDeclinedOfferDto[];
  readonly content: InternalContent;
  readonly locale: Locale;
}) {
  if (rows.length === 0) return null;
  const copy = content.dashboard.declinedOffers;
  const when = (iso: string) =>
    formatDate(iso, locale, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <Card className={styles.panelCard}>
      <div className={styles.sectionHead}>
        <ItemIcon
          contained
          icon={<Icon name="alert-circle" size="md" tone="primary" decorative />}
        />
        <Typography as="h2" variant="text-lg" weight="bold">
          {copy.heading}
        </Typography>
      </div>
      <Typography as="p" variant="text-sm" color="muted">
        {copy.lead}
      </Typography>
      <ul className={styles.recentList} aria-label={copy.heading}>
        {rows.map((row) => (
          <li
            key={`${row.requestId}-${String(row.slotNumber)}-${row.declinedAt}`}
            className={styles.recentRow}
          >
            <div className={styles.recentMain}>
              <bdi className={styles.recentName}>{row.trainerName}</bdi>
              <span className={styles.recentMeta}>
                <bdi>{row.reference}</bdi> · {copy.seat(row.slotNumber)} ·{' '}
                {copy.declinedAt(when(row.declinedAt))}
              </span>
              <Typography as="p" variant="text-sm">
                {row.nextTrainerName != null ? (
                  <bdi>{copy.movedTo(row.nextTrainerName)}</bdi>
                ) : (
                  copy.rematch
                )}
              </Typography>
            </div>
            <Button
              variant="secondary"
              size="sm"
              href={expertHubPaths.internalAssignmentMatching(row.requestId)}
              aria-label={copy.open(row.reference)}
            >
              {content.inbox.list.open}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
