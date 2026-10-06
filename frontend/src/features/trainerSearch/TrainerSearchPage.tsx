import { useEffect, useMemo, useState } from 'react';
import { Alert, EmptyState, ErrorState, Loading, Table } from '@ds/composite';
import type { TableColumn } from '@ds/composite';
import { Avatar, Button, Icon, Link, Select, Tag, TextInput, Typography } from '@ds/primitives';
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
  DEFAULT_TRAINER_SEARCH_FILTERS,
  hasActiveTrainerSearchFilters,
  TRAINER_FILE_STATUSES,
  type TrainerFileStatus,
  type TrainerSearchFilters,
  type TrainerSearchListDto,
  type TrainerSearchResultDto,
} from './trainerSearch.types';
import { getTrainerSearchService } from './trainerSearchService';
import { getTrainerSearchContent } from './trainerSearch.content';
import { getBioReviewContent } from './bioReview.content';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { PageHead } from '../../shared/workspace/PageHead';
import { Panel } from '../../shared/workspace/Panel';
import styles from './TrainerSearchPage.module.css';
import { formatNumber } from '../../shared/formatting';

/**
 * EH-INT-07 — Trainer Database (`/expert-hub/internal/trainers`, staff).
 * **J-15/F1/AC-3**.
 *
 * The scope note on this page is not decoration. J-15 says this is *"a look-up
 * and oversight tool, **not** a candidate-selection mechanism"* — so the page
 * says so, and offers no shortlist, rank or nominate action. Without that, a
 * filtered list of trainers reads exactly like a selection tool, and staff would
 * reasonably use it as one.
 *
 * **File status is shown here** (AC-2, `BR-0408`) precisely because it must not
 * be shown to the trainer (J-13/AC-10, P-48). The two rules are one rule seen
 * from either side.
 *
 * ⚠️ AC-3 also lists specialty, domain, evaluation and experience. None has a
 * control: there is no specialty or domain taxonomy (`Q16`), no calculated
 * rating (`DM-GAP-14`) and no numeric years source, so each filter could only
 * answer wrongly — the API refuses them, and this page does not offer them.
 */

const FILE_STATUS_VARIANT: Readonly<Record<TrainerFileStatus, TagVariant>> = {
  active: 'success',
  // "Monitoring purposes only, with no effect on matching eligibility" — so a
  // neutral tone, not a warning. A warning would read as a restriction.
  idle: 'neutral',
  suspended: 'warning',
  expired: 'error',
};

/** `null` ⇒ no minimum. Kept as a helper so the "any" option round-trips. */
function toMin(value: string): number | null {
  return value === '' ? null : Number(value);
}

export default function TrainerSearchPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getTrainerSearchContent(locale), [locale]);

  const [filters, setFilters] = useState<TrainerSearchFilters>(DEFAULT_TRAINER_SEARCH_FILTERS);
  const [result, setResult] = useState<TrainerSearchListDto | null>(null);
  const [error, setError] = useState<ExpertHubApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.title = content.documentTitle;
  }, [content.documentTitle]);

  useEffect(() => {
    document.getElementById('eh-trainers-title')?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    void getTrainerSearchService()
      .searchTrainers(filters)
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
  const showIdleNote = rows.some((row) => row.fileStatus === 'idle');
  const hasRows = error == null && result != null && rows.length > 0;

  /*
    Four dimensions can be narrowing this list at once, and the controls sit in
    a grid a reader has to re-scan to answer "why so few results?". The chip row
    answers it in one line, and lets one dimension be dropped without resetting
    the other three.
  */
  const num = (value: number) => formatNumber(value, locale);

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
    ...(filters.fileStatus !== 'all'
      ? [
          {
            id: 'fileStatus',
            label: content.filters.fileStatusLabel,
            value: content.fileStatuses[filters.fileStatus],
          },
        ]
      : []),
    ...(filters.minCertifications != null
      ? [
          {
            id: 'minCertifications',
            label: content.filters.minCertificationsLabel,
            value: content.filters.atLeast(num(filters.minCertifications)),
          },
        ]
      : []),
  ];

  /** Each chip drops exactly its own dimension, back to that field's default. */
  const CHIP_RESET: Readonly<Record<string, Partial<TrainerSearchFilters>>> = {
    search: { search: '' },
    service: { service: 'all' },
    fileStatus: { fileStatus: 'all' },
    minCertifications: { minCertifications: null },
  };

  const columns: Array<TableColumn<TrainerSearchResultDto>> = [
    {
      key: 'name',
      header: content.columns.name,
      // The person, not just the name (FADS kit, EH-INT-07). Staff scan this
      // table looking for somebody, and a face — even initials — is faster to
      // find again than a line of text.
      render: (row) => (
        <span className={styles.nameCell}>
          <Avatar name={row.name} size="sm" decorative />
          <Link href={expertHubPaths.internalTrainer(row.trainerId)}>{row.name}</Link>
        </span>
      ),
    },
    {
      key: 'services',
      header: content.columns.services,
      render: (row) =>
        row.services
          .map((service) => content.services[service])
          .join(locale === 'ar' ? '، ' : ', '),
    },
    {
      key: 'specialties',
      header: content.columns.specialties,
      render: (row) =>
        row.specialties
          .map((specialty) => content.specialties[specialty])
          .join(locale === 'ar' ? '، ' : ', '),
    },
    {
      key: 'fileStatus',
      header: content.columns.fileStatus,
      render: (row) => (
        <Tag variant={FILE_STATUS_VARIANT[row.fileStatus]} size="sm">
          {content.fileStatuses[row.fileStatus]}
        </Tag>
      ),
    },
    {
      key: 'evaluation',
      header: content.columns.evaluation,
      render: (row) =>
        row.evaluationOverall == null ? (
          <Typography as="span" variant="text-sm" color="muted">
            {content.notEvaluated}
          </Typography>
        ) : (
          <bdi>{formatScore(row.evaluationOverall, locale)}</bdi>
        ),
    },
    {
      key: 'experience',
      header: content.columns.experience,
      render: (row) => content.yearsValue(row.yearsExperience),
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
    <WorkspacePage labelledBy="eh-trainers-title">
      <PageHead
        titleId="eh-trainers-title"
        title={content.title}
        lead={content.description}
        summary={hasRows && result != null ? content.resultsCount(result.totalCount) : undefined}
        actions={
          <Button variant="secondary" size="md" href={expertHubPaths.internalTrainerBios}>
            {getBioReviewContent(locale).openLink}
          </Button>
        }
      />

      {/* J-15 scope — oversight, not candidate selection. */}
      <Alert tone="info" surface="tinted" role="note">
        {content.scopeNote}
      </Alert>

      {/* J-13 — say what *Idle* does NOT mean, wherever it appears. */}
      {showIdleNote && (
        <Alert tone="info" surface="tinted" role="note">
          {content.idleNote}
        </Alert>
      )}

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
              label={content.filters.serviceLabel}
              value={filters.service}
              onValueChange={(value) =>
                setFilters({ ...filters, service: value as TrainerSearchFilters['service'] })
              }
              options={[
                { value: 'all', label: content.filters.allOption },
                ...APPLICATION_SERVICES.map((service) => ({
                  value: service,
                  label: content.services[service],
                })),
              ]}
            />
            {/* No specialty or domain filter — no taxonomy exists (`Q16`). */}
            <Select
              label={content.filters.fileStatusLabel}
              value={filters.fileStatus}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  fileStatus: value as TrainerSearchFilters['fileStatus'],
                })
              }
              options={[
                { value: 'all', label: content.filters.allOption },
                ...TRAINER_FILE_STATUSES.map((status) => ({
                  value: status,
                  label: content.fileStatuses[status],
                })),
              ]}
            />
            <TextInput
              label={content.filters.minCertificationsLabel}
              type="number"
              inputMode="numeric"
              value={filters.minCertifications == null ? '' : String(filters.minCertifications)}
              onChange={(event) =>
                setFilters({ ...filters, minCertifications: toMin(event.target.value) })
              }
            />
            {/* No minimum-evaluation filter — no rating is calculated (`DM-GAP-14`). */}
            {hasActiveTrainerSearchFilters(filters) && (
              <Button
                variant="tertiary"
                size="md"
                onClick={() => setFilters(DEFAULT_TRAINER_SEARCH_FILTERS)}
              >
                {content.filters.clear}
              </Button>
            )}

            {/* What the database is narrowed BY — each dimension removable alone. */}
            <div className={styles.activeChips}>
              <ActiveFilterChips
                chips={activeChips}
                heading={content.filters.activeHeading}
                removeLabel={(chip) => content.filters.removeFilter(chip.label, chip.value)}
                onRemove={(id) => setFilters({ ...filters, ...CHIP_RESET[id] })}
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
              hasActiveTrainerSearchFilters(filters) ? (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setFilters(DEFAULT_TRAINER_SEARCH_FILTERS)}
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
            getRowId={(row) => row.trainerId}
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

function formatScore(value: number, locale: Locale): string {
  return formatNumber(value, locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
