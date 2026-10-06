import { Table } from '@ds/composite';
import type { TableColumn } from '@ds/composite';
import { Card } from '@ds/composite';
import { Button, Typography } from '@ds/primitives';
import { useMediaQuery } from '@hooks/useMediaQuery';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../../app/router/paths';
import type { ApplicationSummaryDto } from '../application.types';
import type { MyApplicationsContent } from '../myApplications.content';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import styles from './ApplicationsList.module.css';
import { formatDate as formatLocaleDate } from '../../../shared/formatting';

/**
 * P-01 Application List / P-13 Data Table — the trainer's application list.
 * Modeled after the Hackathon `ApplicationsTable` pattern but with the **new
 * Expert Hub types** (`05` EH-TP-02 implementation notes); renders the approved
 * `Table` on desktop and stacks to `Card`s on small viewports (`05` §17 —
 * same data, no horizontal scrolling).
 *
 * Documented row fields only (`04` §5/§6): reference (drafts show a distinct
 * "no reference" label instead, `BR-0107`), services, aggregated Status Badge,
 * submission date, last update, and the row's single documented action — Resume
 * (drafts → EH-TP-05) or View details (→ EH-TP-03). FAST-sync state is never
 * rendered here (`04` §11).
 */

function formatDate(iso: string | null, locale: Locale, fallback: string): string {
  if (iso == null) {
    return fallback;
  }
  return formatLocaleDate(new Date(iso), locale, {
    dateStyle: 'medium',
  });
}

function serviceLabels(
  item: ApplicationSummaryDto,
  content: MyApplicationsContent,
  locale: Locale
): string {
  return item.services
    .map((service) => content.services[service])
    .join(locale === 'ar' ? '، ' : ', ');
}

function RowAction({
  item,
  content,
}: {
  readonly item: ApplicationSummaryDto;
  readonly content: MyApplicationsContent;
}) {
  if (item.status === 'draft') {
    return (
      <Button variant="secondary" size="sm" href={expertHubPaths.applicationsNew}>
        {content.actions.resumeDraft}
      </Button>
    );
  }
  return (
    <Button variant="tertiary" size="sm" href={expertHubPaths.applicationDetail(item.id)}>
      {content.actions.viewDetails}
    </Button>
  );
}

function Reference({
  item,
  content,
}: {
  readonly item: ApplicationSummaryDto;
  readonly content: MyApplicationsContent;
}) {
  if (item.reference == null) {
    // Drafts have no reference until submission (`BR-0107`) — visually distinct.
    return <span className={styles.draftReference}>{content.list.draftReferenceLabel}</span>;
  }
  // `<bdi>` keeps the LTR reference intact inside the RTL layout.
  return <bdi className={styles.reference}>{item.reference}</bdi>;
}

export function ApplicationsList({
  items,
  content,
  locale,
}: {
  readonly items: readonly ApplicationSummaryDto[];
  readonly content: MyApplicationsContent;
  readonly locale: Locale;
}) {
  const isCompact = useMediaQuery('(max-width: 47.98rem)');

  if (isCompact) {
    // Mobile: stacked cards, status + reference prominent (`05` §17).
    return (
      <ul className={styles.cardList} aria-label={content.list.caption}>
        {items.map((item) => (
          <li key={item.id}>
            <Card effect="stroke" className={styles.card}>
              <div className={styles.cardHeader}>
                <Reference item={item} content={content} />
                <ApplicationStatusBadge
                  status={item.status}
                  label={content.statuses[item.status]}
                />
              </div>
              <Typography as="p" variant="text-md">
                {serviceLabels(item, content, locale)}
              </Typography>
              <dl className={styles.cardMeta}>
                <div className={styles.cardMetaRow}>
                  <dt>{content.list.headers.submittedAt}</dt>
                  <dd>{formatDate(item.submittedAt, locale, content.list.notSubmittedLabel)}</dd>
                </div>
                <div className={styles.cardMetaRow}>
                  <dt>{content.list.headers.updatedAt}</dt>
                  <dd>{formatDate(item.updatedAt, locale, '—')}</dd>
                </div>
              </dl>
              <RowAction item={item} content={content} />
            </Card>
          </li>
        ))}
      </ul>
    );
  }

  const columns: Array<TableColumn<ApplicationSummaryDto>> = [
    {
      key: 'reference',
      header: content.list.headers.reference,
      render: (item) => <Reference item={item} content={content} />,
    },
    {
      key: 'services',
      header: content.list.headers.services,
      render: (item) => serviceLabels(item, content, locale),
    },
    {
      key: 'status',
      header: content.list.headers.status,
      render: (item) => (
        <ApplicationStatusBadge status={item.status} label={content.statuses[item.status]} />
      ),
    },
    {
      key: 'submittedAt',
      header: content.list.headers.submittedAt,
      render: (item) => formatDate(item.submittedAt, locale, content.list.notSubmittedLabel),
    },
    {
      key: 'updatedAt',
      header: content.list.headers.updatedAt,
      render: (item) => formatDate(item.updatedAt, locale, '—'),
    },
    {
      key: 'action',
      header: content.list.headers.action,
      render: (item) => <RowAction item={item} content={content} />,
    },
  ];

  return (
    <Table
      columns={columns}
      rows={[...items]}
      getRowId={(item) => item.id}
      caption={content.list.caption}
      captionHidden
      contained
      alternatingRows
    />
  );
}
