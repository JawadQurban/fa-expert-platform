import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState, ErrorState, Loading, Pagination } from '@ds/composite';
import { Button, Icon, SearchBox, Select } from '@ds/primitives';
import type { SelectOption } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { useLocale } from '@i18n/LocaleProvider';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { expertHubPaths } from '../../app/router/paths';
import { APPLICATION_STATUSES } from '../applications/application.types';
import type {
  ApplicationPresentationStatus,
  ApplicationStatus,
} from '../applications/application.types';
import { getInternalService } from './internalService';
import { getInternalContent, type InternalContent } from './internal.content';
import {
  DEFAULT_INBOX_FILTERS,
  hasActiveInboxFilters,
  type InboxFilters,
  type InboxListDto,
} from './internal.types';
import { InboxList } from './components/InboxList';
import {
  ActiveFilterChips,
  type ActiveFilterChip,
} from '../../shared/components/ActiveFilterChips';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { PageHead } from '../../shared/workspace/PageHead';
import { Panel } from '../../shared/workspace/Panel';
import styles from './ApplicationInboxPage.module.css';

/**
 * EH-INT-02 — Application Inbox (`/expert-hub/internal/applications`, staff). The
 * triage queue: browse all incoming applications (role-scoped) and open one to
 * screen (EH-INT-03). Consumes **only** `internalService` (mock now, Expert
 * Hub API later). Sort/bulk are deferred (`G15`); search + status filter use the
 * approved P-11 pattern.
 *
 * Laid out as the approved Option B list screen: breadcrumb, head with the live
 * count, then ONE card holding the filter bar, the table and the paging row —
 * the list and what narrows it read as one object.
 *
 * ⚠️ No «ترشيح متقدم» action (J-02 internal nomination). It has no backend, and
 * the self-service form it used to open files the application under the SIGNED-IN
 * user's identity — a staff member would have applied as themselves. It returns
 * when J-02/F1 has an endpoint that records the nominee.
 *
 * Deep-linkable: the dashboard metric tiles pass a `?status=` that seeds the
 * status filter here.
 */

const PAGE_SIZE = 10;

/** Inbox statuses (drafts never reach the staff inbox). */
const INBOX_STATUSES = APPLICATION_STATUSES.filter((status) => status !== 'draft');

function isInboxStatus(value: string | null): value is ApplicationStatus {
  return value != null && (INBOX_STATUSES as readonly string[]).includes(value);
}

function errorCopy(error: ExpertHubApiError, content: InternalContent) {
  if (error.status === 401) {
    return { title: content.inbox.errors.sessionTitle, body: content.inbox.errors.sessionBody };
  }
  if (error.status === 403) {
    return {
      title: content.inbox.errors.unauthorizedTitle,
      body: content.inbox.errors.unauthorizedBody,
    };
  }
  return { title: content.inbox.errors.loadTitle, body: content.inbox.errors.loadBody };
}

export default function ApplicationInboxPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getInternalContent(locale), [locale]);
  const inbox = content.inbox;
  const [searchParams] = useSearchParams();

  const seededStatus = searchParams.get('status');
  const [filters, setFilters] = useState<InboxFilters>({
    ...DEFAULT_INBOX_FILTERS,
    status: isInboxStatus(seededStatus) ? seededStatus : 'all',
  });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<InboxListDto | null>(null);
  const [error, setError] = useState<ExpertHubApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.title = inbox.documentTitle;
  }, [inbox.documentTitle]);

  useEffect(() => {
    document.getElementById('eh-inbox-title')?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getInternalService()
      .getInbox({ page, pageSize: PAGE_SIZE, search: filters.search, status: filters.status })
      .then((response) => {
        if (cancelled) {
          return;
        }
        if (response.ok) {
          setResult(response.value);
        } else {
          setError(response.error);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, filters, reloadKey]);

  const handleFiltersChange = (next: InboxFilters) => {
    setFilters(next);
    setPage(1);
  };

  const statusOptions: SelectOption[] = [
    { value: 'all', label: inbox.filters.allOption },
    ...INBOX_STATUSES.map((status) => ({ value: status, label: content.statuses[status] })),
  ];

  /*
    What the list is currently narrowed BY, not what it could be narrowed by.
    Derived from the same `filters` state the controls own, so a chip can never
    disagree with the control above it, and removing one goes through the same
    `handleFiltersChange` (which also resets to page 1 — a filter change that
    left you on page 3 of a shorter result set would show an empty list).
  */
  const activeChips: ActiveFilterChip[] = [
    ...(filters.search.trim() !== ''
      ? [{ id: 'search', label: inbox.filters.searchLabel, value: filters.search.trim() }]
      : []),
    ...(filters.status !== 'all'
      ? [
          {
            id: 'status',
            label: inbox.filters.statusLabel,
            value: content.statuses[filters.status as ApplicationPresentationStatus],
          },
        ]
      : []),
  ];

  const removeChip = (id: string) => {
    handleFiltersChange(
      id === 'search' ? { ...filters, search: '' } : { ...filters, status: 'all' }
    );
  };

  const hasRows = error == null && result != null && result.items.length > 0;

  const listRegion = () => {
    if (error != null) {
      const copy = errorCopy(error, content);
      return (
        <ErrorState
          title={copy.title}
          description={copy.body}
          onRetry={() => setReloadKey((key) => key + 1)}
          retryLabel={inbox.errors.retry}
        />
      );
    }
    if (result == null) {
      return <Loading variant="skeleton" lines={6} label={inbox.list.caption} />;
    }
    if (result.items.length === 0) {
      return hasActiveInboxFilters(filters) ? (
        <EmptyState
          icon={<Icon name="search-remove" size="featured" tone="primary" decorative />}
          title={inbox.noResults.title}
          description={inbox.noResults.body}
          action={
            <Button
              variant="secondary"
              size="md"
              onClick={() => handleFiltersChange(DEFAULT_INBOX_FILTERS)}
            >
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
      <div aria-busy={loading || undefined}>
        <InboxList items={result.items} content={content} locale={locale} />
      </div>
    );
  };

  const pagingRow =
    hasRows && result != null ? (
      <>
        <span className={styles.range}>
          {inbox.pagination.range(
            (result.page - 1) * result.pageSize + 1,
            Math.min(result.page * result.pageSize, result.totalCount),
            result.totalCount
          )}
        </span>
        {result.pageCount > 1 && (
          <div className={styles.pager}>
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              onPageChange={setPage}
              label={inbox.pagination.label}
              previousLabel={inbox.pagination.previous}
              nextLabel={inbox.pagination.next}
              size="sm"
            />
          </div>
        )}
      </>
    ) : undefined;

  return (
    <WorkspacePage labelledBy="eh-inbox-title">
      <PageHead
        titleId="eh-inbox-title"
        title={inbox.title}
        lead={inbox.subtitle}
        summary={result != null ? inbox.countSummary(result.totalCount) : undefined}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: inbox.breadcrumbRoot, href: expertHubPaths.internal },
              { label: inbox.title },
            ]}
            label={inbox.breadcrumbLabel}
          />
        }
      />

      <Panel
        flush={hasRows}
        footer={pagingRow}
        toolbar={
          /* P-11 Filter Bar. */
          <div className={styles.filters} role="search" aria-label={inbox.filters.regionLabel}>
            <div className={styles.search}>
              <SearchBox
                label={inbox.filters.searchLabel}
                placeholder={inbox.filters.searchPlaceholder}
                size="md"
                value={filters.search}
                onChange={(event) =>
                  handleFiltersChange({ ...filters, search: event.target.value })
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
                  handleFiltersChange({ ...filters, status: value as InboxFilters['status'] })
                }
              />
            </div>
            {hasActiveInboxFilters(filters) && (
              <div className={styles.clear}>
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => handleFiltersChange(DEFAULT_INBOX_FILTERS)}
                >
                  {inbox.filters.clear}
                </Button>
              </div>
            )}

            {/* What the list is narrowed BY — each piece removable on its own. */}
            <div className={styles.activeChips}>
              <ActiveFilterChips
                chips={activeChips}
                heading={inbox.filters.activeHeading}
                removeLabel={(chip) => inbox.filters.removeFilter(chip.label, chip.value)}
                onRemove={removeChip}
              />
            </div>
          </div>
        }
      >
        {listRegion()}
      </Panel>
    </WorkspacePage>
  );
}
