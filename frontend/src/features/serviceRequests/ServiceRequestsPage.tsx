import { useEffect, useMemo, useState } from 'react';
import { EmptyState, ErrorState, Loading, Table } from '@ds/composite';
import type { TableColumn } from '@ds/composite';
import { Button, Icon, Link, Select, TextInput, Tag } from '@ds/primitives';
import type { TagVariant } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../app/router/paths';
import {
  ActiveFilterChips,
  type ActiveFilterChip,
} from '../../shared/components/ActiveFilterChips';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { APPLICATION_SERVICES } from '../applications/application.types';
import {
  DEFAULT_SERVICE_REQUEST_FILTERS,
  hasActiveServiceRequestFilters,
  type ServiceRequestFilters,
  type ServiceRequestListDto,
  type ServiceRequestStatus,
  type ServiceRequestSummaryDto,
} from './serviceRequest.types';
import { getServiceRequestService } from './serviceRequestService';
import { getServiceRequestsContent } from './serviceRequests.content';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { PageHead } from '../../shared/workspace/PageHead';
import { Panel } from '../../shared/workspace/Panel';
import styles from './ServiceRequestsPage.module.css';
import { formatDate as formatLocaleDate } from '../../shared/formatting';

/**
 * EH-INT-02b — Service Requests (`/expert-hub/internal/service-requests`, staff).
 * The decision-maker's queue for **journey J-03/F2**.
 *
 * **AC-2** names the three dimensions this page must offer — trainer name,
 * requested service, and status — so the Filter Bar has exactly those and no
 * invented fourth. Filtering is the *server's* job (the mock simulates it), so
 * the real endpoint drops in with no UI change.
 *
 * ⚠️ This screen has no entry in `04_PAGE_SPECIFICATIONS`; the page specs never
 * modelled the internal side of J-03. Built from the journey (P-20).
 */

const STATUS_VARIANT: Readonly<Record<ServiceRequestStatus, TagVariant>> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

function formatDate(iso: string, locale: Locale): string {
  return formatLocaleDate(new Date(iso), locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ServiceRequestsPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getServiceRequestsContent(locale), [locale]);

  const [filters, setFilters] = useState<ServiceRequestFilters>(DEFAULT_SERVICE_REQUEST_FILTERS);
  const [result, setResult] = useState<ServiceRequestListDto | null>(null);
  const [error, setError] = useState<ExpertHubApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.title = content.documentTitle;
  }, [content.documentTitle]);

  useEffect(() => {
    document.getElementById('eh-requests-title')?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    void getServiceRequestService()
      .listServiceRequests(filters)
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

  const rows = [...(result?.items ?? [])];
  const hasRows = error == null && result != null && rows.length > 0;

  /*
    What the queue is currently narrowed BY, derived from the same `filters`
    state the controls own — so a chip can never disagree with its control.
  */
  const activeChips: ActiveFilterChip[] = [
    ...(filters.search.trim() !== ''
      ? [{ id: 'search', label: content.filters.searchLabel, value: filters.search.trim() }]
      : []),
    ...(filters.service !== 'all'
      ? [
          {
            id: 'service',
            label: content.filters.serviceLabel,
            value: content.services[filters.service],
          },
        ]
      : []),
    ...(filters.status !== 'all'
      ? [
          {
            id: 'status',
            label: content.filters.statusLabel,
            value: content.statuses[filters.status],
          },
        ]
      : []),
  ];

  const columns: Array<TableColumn<ServiceRequestSummaryDto>> = [
    {
      key: 'reference',
      header: content.columns.reference,
      // The reference is the discernible link to the request (`05` §18).
      render: (row) => (
        <Link href={expertHubPaths.internalServiceRequest(row.id)}>
          <bdi>{row.reference}</bdi>
        </Link>
      ),
    },
    { key: 'trainer', header: content.columns.trainer, render: (row) => row.trainerName },
    {
      key: 'service',
      header: content.columns.service,
      render: (row) => content.services[row.requestedService],
    },
    {
      key: 'status',
      header: content.columns.status,
      render: (row) => (
        <Tag variant={STATUS_VARIANT[row.status]} size="sm">
          {content.statuses[row.status]}
        </Tag>
      ),
    },
    {
      key: 'submitted',
      header: content.columns.submitted,
      render: (row) => formatDate(row.submittedAt, locale),
    },
  ];

  // A denial is not a load failure: `P-190`'s gate answers 403 with the
  // feature it wanted, and telling someone their system broke sends them
  // to the wrong person for help.
  const failure = describeLoadFailure(error, locale, {
    title: content.errors.loadTitle,
    body: content.errors.loadBody,
  });

  return (
    <WorkspacePage labelledBy="eh-requests-title">
      <PageHead
        titleId="eh-requests-title"
        title={content.listTitle}
        lead={content.listDescription}
        summary={result != null ? content.pendingCount(result.pendingCount) : undefined}
      />

      <Panel
        flush={hasRows}
        toolbar={
          /* P-11 Filter Bar — exactly F2/AC-2's three dimensions. */
          <div className={styles.filters} role="search" aria-label={content.filters.regionLabel}>
            <TextInput
              label={content.filters.searchLabel}
              placeholder={content.filters.searchPlaceholder}
              type="search"
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            />
            <Select
              label={content.filters.serviceLabel}
              value={filters.service}
              onValueChange={(value) =>
                setFilters({ ...filters, service: value as ServiceRequestFilters['service'] })
              }
              options={[
                { value: 'all', label: content.filters.allOption },
                ...APPLICATION_SERVICES.map((service) => ({
                  value: service,
                  label: content.services[service],
                })),
              ]}
            />
            <Select
              label={content.filters.statusLabel}
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value as ServiceRequestFilters['status'] })
              }
              options={[
                { value: 'all', label: content.filters.allOption },
                { value: 'pending', label: content.statuses.pending },
                { value: 'approved', label: content.statuses.approved },
                { value: 'rejected', label: content.statuses.rejected },
              ]}
            />
            {hasActiveServiceRequestFilters(filters) && (
              <Button
                variant="tertiary"
                size="md"
                onClick={() => setFilters(DEFAULT_SERVICE_REQUEST_FILTERS)}
              >
                {content.filters.clear}
              </Button>
            )}

            {/* What the queue is narrowed BY — each piece removable on its own. */}
            <div className={styles.activeChips}>
              <ActiveFilterChips
                chips={activeChips}
                heading={content.filters.activeHeading}
                removeLabel={(chip) => content.filters.removeFilter(chip.label, chip.value)}
                onRemove={(id) =>
                  setFilters(
                    id === 'search'
                      ? { ...filters, search: '' }
                      : id === 'service'
                        ? { ...filters, service: 'all' }
                        : { ...filters, status: 'all' }
                  )
                }
              />
            </div>
          </div>
        }
      >
        {error != null ? (
          <ErrorState
            title={failure.title}
            description={failure.body}
            onRetry={failure.canRetry ? () => setReloadKey((key) => key + 1) : undefined}
            retryLabel={content.errors.retry}
          />
        ) : result == null ? (
          <Loading variant="skeleton" lines={5} label={content.resultsLabel} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Icon name="search-remove" size="featured" tone="primary" decorative />}
            title={content.empty.title}
            description={content.empty.body}
            action={
              hasActiveServiceRequestFilters(filters) ? (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setFilters(DEFAULT_SERVICE_REQUEST_FILTERS)}
                >
                  {content.filters.clear}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table
            columns={columns}
            rows={rows}
            getRowId={(row) => row.id}
            caption={content.resultsLabel}
            captionHidden
            density="compact"
            alternatingRows
          />
        )}
      </Panel>
    </WorkspacePage>
  );
}
