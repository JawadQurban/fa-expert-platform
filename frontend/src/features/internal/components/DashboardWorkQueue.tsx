import { useEffect, useMemo, useState } from 'react';
import { Card, EmptyState, ErrorState, ItemIcon, Loading } from '@ds/composite';
import { Avatar, Button, Icon, SearchBox, Select, Typography } from '@ds/primitives';
import type { SelectOption } from '@ds/primitives';
import type { Locale } from '@/types';
import type { ExpertHubApiError } from '../../../shared/services/apiClient';
import { expertHubPaths } from '../../../app/router/paths';
import { APPLICATION_STATUSES } from '../../applications/application.types';
import { ApplicationStatusBadge } from '../../applications/components/ApplicationStatusBadge';
import { getInternalService } from '../internalService';
import type { InternalContent } from '../internal.content';
import type { InboxApplicationDto } from '../internal.types';
import {
  DEFAULT_INBOX_FILTERS,
  hasActiveInboxFilters,
  type InboxFilters,
  type InboxListDto,
} from '../internal.types';
import styles from './DashboardWorkQueue.module.css';
import { numberFormatter } from '../../../shared/formatting';

/**
 * EH-INT-01 work queue — the operational heart of the redesigned dashboard: a
 * **filterable peek into the staff inbox**, rendered as identity-first action
 * rows (avatar → applicant + reference/services → status → waiting time → open),
 * so a person lands on the work that needs doing without a second navigation.
 * Consumes the same `getInbox` contract as EH-INT-02 and the same approved
 * `ApplicationStatusBadge`; it shows the first page only (the "view all" action
 * opens EH-INT-02 for paging). Read-only: the filter is a query, never state the
 * dashboard creates (`§7`).
 *
 * ⚠️ Filter/search reuse the approved P-11 pattern and the **existing** inbox
 * copy (`content.inbox.*`) — no new i18n string is introduced for the peek.
 */
const PAGE_SIZE = 6;

/** Drafts never reach the staff inbox. */
const INBOX_STATUSES = APPLICATION_STATUSES.filter((status) => status !== 'draft');

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
 * How long an application has been waiting — the figure a triage queue is
 * scanned for. Rounded DOWN to whole days against one clock reading (so two
 * rows a second apart never differ by a day), mirroring EH-INT-02's `InboxList`.
 */
function ageInDays(iso: string, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 86_400_000));
}

export function DashboardWorkQueue({
  content,
  locale,
}: {
  readonly content: InternalContent;
  readonly locale: Locale;
}) {
  const inbox = content.inbox;
  const [filters, setFilters] = useState<InboxFilters>(DEFAULT_INBOX_FILTERS);
  const [result, setResult] = useState<InboxListDto | null>(null);
  const [error, setError] = useState<ExpertHubApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setResult(null);
    void getInternalService()
      .getInbox({ page: 1, pageSize: PAGE_SIZE, search: filters.search, status: filters.status })
      .then((response) => {
        if (cancelled) {
          return;
        }
        if (response.ok) {
          setResult(response.value);
        } else {
          setError(response.error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [filters, reloadKey]);

  const statusOptions: SelectOption[] = useMemo(
    () => [
      { value: 'all', label: inbox.filters.allOption },
      ...INBOX_STATUSES.map((status) => ({ value: status, label: content.statuses[status] })),
    ],
    [content, inbox.filters.allOption]
  );

  const numbers = numberFormatter(locale);
  // One clock reading for the whole list (see ageInDays).
  const now = Date.now();

  const body = () => {
    if (error != null) {
      return (
        <ErrorState
          title={inbox.errors.loadTitle}
          description={inbox.errors.loadBody}
          onRetry={() => setReloadKey((key) => key + 1)}
          retryLabel={inbox.errors.retry}
        />
      );
    }
    if (result == null) {
      return <Loading variant="skeleton" lines={5} label={inbox.list.caption} />;
    }
    if (result.items.length === 0) {
      return hasActiveInboxFilters(filters) ? (
        <EmptyState
          icon={<Icon name="search-remove" size="featured" tone="primary" decorative />}
          title={inbox.noResults.title}
          description={inbox.noResults.body}
          action={
            <Button variant="secondary" size="md" onClick={() => setFilters(DEFAULT_INBOX_FILTERS)}>
              {inbox.filters.clear}
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={<Icon name="note-01" size="featured" tone="primary" decorative />}
          title={inbox.empty.title}
          description={inbox.empty.body}
        />
      );
    }
    return (
      <ul className={styles.rows} aria-label={inbox.list.caption}>
        {result.items.map((item) => (
          <li key={item.id} className={styles.row}>
            {/* Initials only — `G26` blocks photo upload; Avatar shows initials
                with no source. Decorative: the name beside it is the identity. */}
            <Avatar name={item.applicantName} size="sm" decorative />
            <div className={styles.main}>
              <span className={styles.name}>{item.applicantName}</span>
              <span className={styles.meta}>
                <bdi>{item.reference}</bdi>
                <span aria-hidden="true"> · </span>
                {serviceLabels(item, content, locale)}
              </span>
            </div>
            <ApplicationStatusBadge status={item.status} label={content.statuses[item.status]} />
            <span className={styles.age}>
              {inbox.list.age(numbers.format(ageInDays(item.submittedAt, now)))}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className={styles.open}
              href={expertHubPaths.internalApplicationDetail(item.id)}
            >
              {inbox.list.open}
            </Button>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card className={styles.queue}>
      <div className={styles.head}>
        <ItemIcon contained icon={<Icon name="note-01" size="md" tone="primary" decorative />} />
        <Typography as="h2" variant="text-lg" weight="bold">
          {inbox.title}
        </Typography>
        {result != null && (
          <span className={styles.count} role="status">
            {inbox.countSummary(result.totalCount)}
          </span>
        )}
      </div>

      {/* P-11 filter bar — search + status filter (query only, no state created). */}
      <div className={styles.filters} role="search" aria-label={inbox.filters.regionLabel}>
        <div className={styles.search}>
          <SearchBox
            label={inbox.filters.searchLabel}
            placeholder={inbox.filters.searchPlaceholder}
            size="md"
            value={filters.search}
            onChange={(event) =>
              setFilters((current) => ({ ...current, search: event.target.value }))
            }
          />
        </div>
        <div className={styles.select}>
          <Select
            label={inbox.filters.statusLabel}
            size="md"
            options={statusOptions}
            value={filters.status}
            onValueChange={(value) =>
              setFilters((current) => ({ ...current, status: value as InboxFilters['status'] }))
            }
          />
        </div>
        {hasActiveInboxFilters(filters) && (
          <div className={styles.clear}>
            <Button variant="tertiary" size="sm" onClick={() => setFilters(DEFAULT_INBOX_FILTERS)}>
              {inbox.filters.clear}
            </Button>
          </div>
        )}
      </div>

      <div className={styles.list} aria-busy={result == null || undefined}>
        {body()}
      </div>

      <div className={styles.foot}>
        <Button variant="secondary" size="sm" href={expertHubPaths.internalApplications}>
          {content.dashboard.recent.viewAll}
        </Button>
      </div>
    </Card>
  );
}
