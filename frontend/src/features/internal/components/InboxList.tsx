import { Card, Table } from '@ds/composite';
import type { TableColumn } from '@ds/composite';
import { Button, Typography } from '@ds/primitives';
import { useMediaQuery } from '@hooks/useMediaQuery';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../../app/router/paths';
import { ApplicationStatusBadge } from '../../applications/components/ApplicationStatusBadge';
import type { InternalContent } from '../internal.content';
import type { InboxApplicationDto } from '../internal.types';
import styles from './InboxList.module.css';
import { formatDate as formatLocaleDate, formatNumber } from '../../../shared/formatting';

/**
 * P-01/P-13 staff Application Inbox list — Table on desktop, stacked Cards on
 * mobile (`05` §17, same data, no horizontal scroll). Staff columns add the
 * applicant identity the trainer list omits; the single row action opens the
 * application for screening (EH-INT-03). Reuses the approved `ApplicationStatusBadge`.
 */
function serviceLabels(
  item: InboxApplicationDto,
  content: InternalContent,
  locale: Locale
): string {
  return item.services
    .map((service) => content.services[service])
    .join(locale === 'ar' ? '، ' : ', ');
}

/**
 * How long an application has been waiting (FADS Expert Hub kit, EH-INT-02).
 *
 * The most useful figure in a triage queue: a person scanning it is looking for
 * what has been sitting longest, and a submission date makes them do the
 * arithmetic themselves.
 *
 * ⚠️ Computed from `submittedAt` against the reader's own clock, and rounded
 * DOWN to whole days. «٤ أيام» means at least four, which is the claim a queue
 * can support; rounding up would age every item by a few hours the moment it
 * arrived.
 */
function ageInDays(iso: string, nowMs: number): number {
  const elapsed = nowMs - new Date(iso).getTime();
  return Math.max(0, Math.floor(elapsed / 86_400_000));
}

function formatDate(iso: string, locale: Locale): string {
  return formatLocaleDate(new Date(iso), locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function OpenAction({ item, content }: { item: InboxApplicationDto; content: InternalContent }) {
  return (
    <Button variant="secondary" size="sm" href={expertHubPaths.internalApplicationDetail(item.id)}>
      {content.inbox.list.open}
    </Button>
  );
}

export function InboxList({
  items,
  content,
  locale,
}: {
  readonly items: readonly InboxApplicationDto[];
  readonly content: InternalContent;
  readonly locale: Locale;
}) {
  const isCompact = useMediaQuery('(max-width: 47.98rem)');
  const headers = content.inbox.list.headers;
  // One clock reading for the whole list, so two rows submitted a second
  // apart cannot show ages a day apart because the render crossed midnight.
  const now = Date.now();

  if (isCompact) {
    return (
      <ul className={styles.cardList} aria-label={content.inbox.list.caption}>
        {items.map((item) => (
          <li key={item.id}>
            <Card effect="stroke" className={styles.card}>
              <div className={styles.cardHeader}>
                <bdi className={styles.reference}>{item.reference}</bdi>
                <ApplicationStatusBadge
                  status={item.status}
                  label={content.statuses[item.status]}
                />
              </div>
              <Typography as="p" variant="text-md" weight="bold">
                {item.applicantName}
              </Typography>
              <Typography as="p" variant="text-md" color="muted">
                {serviceLabels(item, content, locale)}
              </Typography>
              <Typography as="p" variant="text-sm" color="muted">
                {headers.submittedAt}: {formatDate(item.submittedAt, locale)}
              </Typography>
              {/* The card carries the age too: on a narrow screen the queue is
                  read one item at a time, which is exactly where «how long has
                  this been sitting» is hardest to work out. */}
              <Typography as="p" variant="text-sm" color="muted">
                {headers.age}:{' '}
                {content.inbox.list.age(formatNumber(ageInDays(item.submittedAt, now), locale))}
              </Typography>
              <OpenAction item={item} content={content} />
            </Card>
          </li>
        ))}
      </ul>
    );
  }

  const columns: Array<TableColumn<InboxApplicationDto>> = [
    {
      key: 'reference',
      header: headers.reference,
      render: (item) => <bdi className={styles.reference}>{item.reference}</bdi>,
    },
    {
      key: 'applicant',
      header: headers.applicant,
      render: (item) => item.applicantName,
    },
    {
      key: 'services',
      header: headers.services,
      render: (item) => serviceLabels(item, content, locale),
    },
    {
      key: 'status',
      header: headers.status,
      render: (item) => (
        <ApplicationStatusBadge status={item.status} label={content.statuses[item.status]} />
      ),
    },
    {
      key: 'submittedAt',
      header: headers.submittedAt,
      render: (item) => formatDate(item.submittedAt, locale),
    },
    {
      key: 'age',
      header: headers.age,
      render: (item) => (
        <span className={styles.age}>
          {content.inbox.list.age(formatNumber(ageInDays(item.submittedAt, now), locale))}
        </span>
      ),
    },
    {
      key: 'action',
      header: headers.action,
      render: (item) => <OpenAction item={item} content={content} />,
    },
  ];

  return (
    <Table
      columns={columns}
      rows={[...items]}
      getRowId={(item) => item.id}
      caption={content.inbox.list.caption}
      captionHidden
      density="compact"
      alternatingRows
    />
  );
}
