import { useEffect, useMemo, useState } from 'react';
import { EmptyState, ErrorState, Loading, Table } from '@ds/composite';
import type { TableColumn } from '@ds/composite';
import { Button, Icon, Link, Select, Tag, TextInput, Typography } from '@ds/primitives';
import type { TagVariant } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../app/router/paths';
import {
  ActiveFilterChips,
  type ActiveFilterChip,
} from '../../shared/components/ActiveFilterChips';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import {
  DEFAULT_AGREEMENT_FILTERS,
  hasActiveAgreementFilters,
  type AgreementFilters,
  type AgreementListDto,
  type AgreementStatus,
  type AgreementSummaryDto,
  type ExpiryMilestone,
} from './agreementLifecycle.types';
import { getAgreementLifecycleService } from './agreementLifecycleService';
import { getAgreementLifecycleContent } from './agreementLifecycle.content';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { PageHead } from '../../shared/workspace/PageHead';
import { Panel } from '../../shared/workspace/Panel';
import styles from './AgreementsPage.module.css';
import { formatDate as formatLocaleDate } from '../../shared/formatting';

/**
 * EH-INT-06 — Agreement Management (`/expert-hub/agreements`, staff). The list
 * half of **journey J-12**.
 *
 * **F1** is what this page is for: every agreement's calculated expiry date and
 * which of `BR-0303`'s three milestones it has reached (90 / 30 / 5 days). The
 * milestone is conveyed by **text and Tag variant, never colour alone**, and the
 * day count sits beside it — a badge that only changes hue tells a
 * colour-blind reader nothing.
 *
 * ⚠️ The **alerts** F1/AC-2–4 describe are notifications, i.e. the missing
 * **J-25**. What is built here is the milestone being *visible*, which is a
 * different thing from an alert being *sent*.
 */

const STATUS_VARIANT: Readonly<Record<AgreementStatus, TagVariant>> = {
  active: 'success',
  suspended: 'warning',
  expired: 'error',
  ended: 'neutral',
};

/**
 * Milestone → tone, **by position among the configured offsets** rather than by
 * the numbers themselves: the tightest reminder is the urgent one, whatever it
 * is set to. `none` is deliberately untagged — nothing needs attention.
 *
 * With the approved 90/30/5 this is unchanged: information / warning / error.
 */
function milestoneVariant(milestone: ExpiryMilestone, offsets: readonly number[]): TagVariant {
  if (milestone.kind === 'expired') {
    return 'error';
  }
  if (milestone.kind === 'none') {
    return 'neutral';
  }
  const ascending = [...offsets].sort((a, b) => a - b);
  const rank = ascending.indexOf(milestone.daysBefore);
  if (rank === 0) {
    return 'error';
  }
  return rank === 1 ? 'warning' : 'information';
}

function formatDate(iso: string, locale: Locale): string {
  return formatLocaleDate(new Date(iso), locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function AgreementsPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getAgreementLifecycleContent(locale), [locale]);

  const [filters, setFilters] = useState<AgreementFilters>(DEFAULT_AGREEMENT_FILTERS);
  const [result, setResult] = useState<AgreementListDto | null>(null);
  const [error, setError] = useState<ExpertHubApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.title = content.documentTitle;
  }, [content.documentTitle]);

  useEffect(() => {
    document.getElementById('eh-agreements-title')?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    void getAgreementLifecycleService()
      .listAgreements(filters)
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
  /** Served with the list, so the filter follows the console (`BR-0705`). */
  const reminderOffsets = result?.reminderOffsets ?? [];

  /*
    What the register is currently narrowed BY, from the same `filters` state
    the controls own. ⚠️ The milestone chip re-uses `content.milestone(...)` —
    the same wording the Select builds from the offsets the console serves — so
    the chip can never name an offset this deployment does not hold (`BR-0705`).
  */
  const activeChips: ActiveFilterChip[] = [
    ...(filters.search.trim() !== ''
      ? [{ id: 'search', label: content.filters.searchLabel, value: filters.search.trim() }]
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
    ...(filters.milestone !== 'all'
      ? [
          {
            id: 'milestone',
            label: content.filters.milestoneLabel,
            value:
              filters.milestone === 'expired'
                ? content.milestone({ kind: 'expired' })
                : content.milestone({
                    kind: 'reminder',
                    daysBefore: Number(filters.milestone),
                  }),
          },
        ]
      : []),
  ];

  const columns: Array<TableColumn<AgreementSummaryDto>> = [
    {
      key: 'reference',
      header: content.columns.reference,
      render: (row) => (
        <Link href={expertHubPaths.internalAgreement(row.id)}>
          <bdi>{row.reference}</bdi>
        </Link>
      ),
    },
    { key: 'trainer', header: content.columns.trainer, render: (row) => row.trainerName },
    {
      key: 'services',
      header: content.columns.services,
      render: (row) =>
        row.services
          .map((service) => content.services[service])
          .join(locale === 'ar' ? '، ' : ', '),
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
      key: 'expiry',
      header: content.columns.expiry,
      // F1 — the date, the milestone, and the day count together. State is never
      // carried by colour alone (WCAG 1.4.1).
      render: (row) => (
        <span className={styles.expiryCell}>
          <bdi>{formatDate(row.endsAt, locale)}</bdi>
          {row.expiryMilestone.kind !== 'none' && (
            <>
              <Tag variant={milestoneVariant(row.expiryMilestone, reminderOffsets)} size="xs">
                {content.milestone(row.expiryMilestone)}
              </Tag>
              <Typography as="span" variant="text-xs" color="muted">
                {row.daysToExpiry < 0
                  ? content.daysOverdue(Math.abs(row.daysToExpiry))
                  : content.daysRemaining(row.daysToExpiry)}
              </Typography>
            </>
          )}
        </span>
      ),
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
    <WorkspacePage labelledBy="eh-agreements-title">
      <PageHead
        titleId="eh-agreements-title"
        title={content.listTitle}
        lead={content.listDescription}
        summary={result != null ? content.expiringCount(result.expiringCount) : undefined}
        actions={
          /* F4 — the central template lives beside the agreements it generates. */
          <Button variant="secondary" size="md" href={expertHubPaths.internalAgreementTemplate}>
            {content.templateLink}
          </Button>
        }
      />

      <Panel
        flush={hasRows}
        toolbar={
          <div className={styles.filters} role="search" aria-label={content.filters.regionLabel}>
            <TextInput
              label={content.filters.searchLabel}
              placeholder={content.filters.searchPlaceholder}
              type="search"
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            />
            <Select
              label={content.filters.statusLabel}
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value as AgreementFilters['status'] })
              }
              options={[
                { value: 'all', label: content.filters.allOption },
                ...(['active', 'suspended', 'expired', 'ended'] as const).map((status) => ({
                  value: status,
                  label: content.statuses[status],
                })),
              ]}
            />
            <Select
              label={content.filters.milestoneLabel}
              value={filters.milestone}
              onValueChange={(value) => setFilters({ ...filters, milestone: value })}
              // The options are the offsets the console actually holds, served
              // with the list — not a list this page carries (`BR-0705`).
              options={[
                { value: 'all', label: content.filters.allOption },
                ...[...reminderOffsets]
                  .sort((a, b) => b - a)
                  .map((daysBefore) => ({
                    value: String(daysBefore),
                    label: content.milestone({ kind: 'reminder', daysBefore }),
                  })),
                { value: 'expired', label: content.milestone({ kind: 'expired' }) },
              ]}
            />
            {hasActiveAgreementFilters(filters) && (
              <Button
                variant="tertiary"
                size="md"
                onClick={() => setFilters(DEFAULT_AGREEMENT_FILTERS)}
              >
                {content.filters.clear}
              </Button>
            )}

            {/* What the register is narrowed BY — each piece removable on its own. */}
            <div className={styles.activeChips}>
              <ActiveFilterChips
                chips={activeChips}
                heading={content.filters.activeHeading}
                removeLabel={(chip) => content.filters.removeFilter(chip.label, chip.value)}
                onRemove={(id) =>
                  setFilters(
                    id === 'search'
                      ? { ...filters, search: '' }
                      : id === 'status'
                        ? { ...filters, status: 'all' }
                        : { ...filters, milestone: 'all' }
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
              hasActiveAgreementFilters(filters) ? (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setFilters(DEFAULT_AGREEMENT_FILTERS)}
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
