import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, EmptyState, ErrorState, Loading, Table } from '@ds/composite';
import type { TableColumn } from '@ds/composite';
import { Button, Checkbox, Icon, Tag, TextInput, Typography } from '@ds/primitives';
import { useLocale } from '@i18n/LocaleProvider';
import { localized } from '../../shared/types/localizedText';
import { getEntitlementService } from './entitlementService';
import { getEntitlementsContent } from './entitlements.content';
import {
  DEFAULT_ENTITLEMENT_QUERY,
  hasActiveEntitlementQuery,
  isVisibleToTrainer,
  type EntitlementQuery,
  type StaffEntitlementDto,
} from './entitlement.types';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { describeLoadFailure } from '../../shared/errors/loadFailure';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { PageHead } from '../../shared/workspace/PageHead';
import { Panel } from '../../shared/workspace/Panel';
import styles from './EntitlementsPage.module.css';
import { dateFormatter, numberFormatter } from '../../shared/formatting';

/**
 * EH-INT-17 — the staff entitlement register (**CAP-06 / `F-0602`**), at
 * `/expert-hub/internal/entitlements`.
 *
 * `US-0602` is a support screen, and its wording says so: staff want each
 * trainer's record "tied to their agreement and their programmes, so I can
 * answer their questions without going back to separate files". Everything here
 * serves the phone call.
 *
 * Which is why the **incompletely-linked records are the point, not an edge
 * case**. `BR-0603` hides them from the trainer, so "why can't I see my
 * payment?" is precisely the call this screen answers — the row shows the record
 * *and* names which hop of `BR-0602`'s chain is missing. A filter isolates them.
 *
 * Read-only throughout: `BR-0601` consumes every value from ERP, and the service
 * has no write operation for this page to reach.
 */

type Phase = 'loading' | 'error' | 'ready';

export default function InternalEntitlementsPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getEntitlementsContent(locale), [locale]);
  const copy = content.internal;
  const service = getEntitlementService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [loadError, setLoadError] = useState<ExpertHubApiError | null>(null);
  const [rows, setRows] = useState<readonly StaffEntitlementDto[]>([]);
  const [query, setQuery] = useState<EntitlementQuery>(DEFAULT_ENTITLEMENT_QUERY);
  const [reloadKey, setReloadKey] = useState(0);
  const loadedOnce = useRef(false);

  useEffect(() => {
    document.title = copy.documentTitle;
  }, [copy.documentTitle]);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    void service.listEntitlements(query).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setRows(result.value);
        setPhase('ready');
      } else {
        setLoadError(result.error);
        setPhase('error');
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, reloadKey]);

  useEffect(() => {
    if (phase === 'ready' && !loadedOnce.current) {
      loadedOnce.current = true;
      document.getElementById('eh-internal-entitlements-title')?.focus();
    }
  }, [phase]);

  const money = numberFormatter(locale);
  const dates = dateFormatter(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const columns: Array<TableColumn<StaffEntitlementDto>> = [
    {
      key: 'trainer',
      header: content.columns.trainer,
      render: (row) => <bdi>{row.trainerName}</bdi>,
    },
    {
      key: 'program',
      header: content.columns.program,
      render: (row) =>
        row.programName == null ? (
          <Typography as="span" variant="text-sm" color="muted">
            {content.notLinkedYet}
          </Typography>
        ) : (
          <bdi>{localized(row.programName, locale)}</bdi>
        ),
    },
    {
      key: 'status',
      header: content.columns.status,
      render: (row) => (
        <Tag variant="neutral" size="sm">
          {localized(row.status.label, locale)}
        </Tag>
      ),
    },
    {
      key: 'amount',
      header: content.columns.amount,
      render: (row) => (
        <bdi>{content.amountValue(money.format(row.amount.value), row.amount.currency)}</bdi>
      ),
    },
    {
      key: 'date',
      header: content.columns.date,
      render: (row) =>
        row.disbursementDate == null
          ? content.noDate
          : dates.format(new Date(row.disbursementDate)),
    },
    {
      key: 'purchaseOrder',
      header: content.columns.purchaseOrder,
      render: (row) =>
        row.purchaseOrderNumber == null ? (
          <Typography as="span" variant="text-sm" color="muted">
            {content.notLinkedYet}
          </Typography>
        ) : (
          <bdi>{row.purchaseOrderNumber}</bdi>
        ),
    },
    {
      key: 'agreement',
      header: content.columns.agreement,
      render: (row) =>
        row.agreementReference == null ? (
          <Typography as="span" variant="text-sm" color="muted">
            {content.notLinkedYet}
          </Typography>
        ) : (
          <bdi>{row.agreementReference}</bdi>
        ),
    },
    {
      // `BR-0603` — the column that answers the support call.
      key: 'linkage',
      header: content.columns.linkage,
      render: (row) =>
        isVisibleToTrainer(row) ? (
          <Tag variant="success" size="sm">
            {content.linkageSteps.programme}
          </Tag>
        ) : (
          <span className={styles.missing}>
            <Tag variant="warning" size="sm">
              {copy.missingLabel}
            </Tag>
            {row.missingLinks.map((step) => (
              <Tag key={step} variant="error" size="xs">
                {content.linkageSteps[step]}
              </Tag>
            ))}
          </span>
        ),
    },
  ];

  const hidden = rows.filter((row) => !isVisibleToTrainer(row)).length;
  const hasRows = phase === 'ready' && rows.length > 0;

  // A denial is not a load failure: `P-190`'s gate answers 403 with the
  // feature it wanted, and telling someone their system broke sends them
  // to the wrong person for help.
  const failure = describeLoadFailure(loadError, locale, {
    title: content.errors.loadTitle,
    body: content.errors.loadBody,
  });

  return (
    <WorkspacePage labelledBy="eh-internal-entitlements-title">
      <PageHead
        titleId="eh-internal-entitlements-title"
        title={copy.title}
        lead={copy.intro}
        summary={hasRows ? copy.resultsCount(rows.length) : undefined}
      />

      {/* `BR-0601` — every value is ERP's; the register only reads it. */}
      <Alert tone="info" surface="tinted" role="note">
        {content.mine.sourceNote}
      </Alert>

      {/* `BR-0603` explained where staff will need it — the support answer. */}
      {hidden > 0 && (
        <Alert tone="warning" surface="tinted" role="note" title={copy.hiddenTitle}>
          {copy.hiddenBody}
        </Alert>
      )}

      <Panel
        flush={hasRows}
        toolbar={
          <div className={styles.toolbar}>
            <TextInput
              label={copy.searchLabel}
              type="search"
              placeholder={copy.searchPlaceholder}
              value={query.trainer}
              onChange={(event) => setQuery({ ...query, trainer: event.target.value })}
            />
            <Checkbox
              label={copy.onlyIncompleteLabel}
              checked={query.onlyIncomplete}
              onChange={(event) => setQuery({ ...query, onlyIncomplete: event.target.checked })}
            />
            {hasActiveEntitlementQuery(query) && (
              <Button
                variant="tertiary"
                size="md"
                onClick={() => setQuery(DEFAULT_ENTITLEMENT_QUERY)}
              >
                {copy.clear}
              </Button>
            )}
          </div>
        }
      >
        {phase === 'loading' ? (
          <Loading variant="skeleton" lines={5} label={copy.resultsLabel} />
        ) : phase === 'error' ? (
          <ErrorState
            title={failure.title}
            description={failure.body}
            onRetry={failure.canRetry ? () => setReloadKey((key) => key + 1) : undefined}
            retryLabel={content.errors.retry}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Icon name="search-remove" size="featured" tone="primary" decorative />}
            title={copy.emptyTitle}
            description={copy.emptyBody}
            action={
              hasActiveEntitlementQuery(query) ? (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setQuery(DEFAULT_ENTITLEMENT_QUERY)}
                >
                  {copy.clear}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table
            columns={columns}
            rows={[...rows]}
            getRowId={(row) => row.entitlementId}
            caption={copy.resultsLabel}
            captionHidden
            density="compact"
            alternatingRows
          />
        )}
      </Panel>
    </WorkspacePage>
  );
}
