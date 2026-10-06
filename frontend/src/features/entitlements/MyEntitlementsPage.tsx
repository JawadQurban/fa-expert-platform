import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Card, EmptyState, Loading, Table } from '@ds/composite';
import type { TableColumn } from '@ds/composite';
import { Icon, Tag, Typography } from '@ds/primitives';
import { Container, Section } from '@ds/layout';
import { useLocale } from '@i18n/LocaleProvider';
import { localized } from '../../shared/types/localizedText';
import { getEntitlementService } from './entitlementService';
import { getEntitlementsContent } from './entitlements.content';
import type { TrainerEntitlementDto } from './entitlement.types';
import styles from './EntitlementsPage.module.css';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { dateFormatter, numberFormatter } from '../../shared/formatting';

/**
 * EH-TP-09 — the trainer's own entitlement record (**CAP-06 / `F-0601`**), at
 * `/expert-hub/entitlements`.
 *
 * `US-0601`: "the status, the amount and the date for each programme I
 * delivered, tied to the programme by name". That is the whole screen, and it
 * is read-only in the strongest sense — the service it consumes has no write
 * operation at all (`BR-0601`).
 *
 * Two things the page says out loud, because a money screen that stays silent
 * about them creates support calls:
 *
 * - **The numbers are ERP's**, consumed as-is and neither calculated nor edited
 *   here. No total is shown for the same reason: §8.6 says this capability
 *   "calculates no amount", and a platform-computed sum could disagree with the
 *   system of record (P-125).
 * - **There is no dispute path in this release** (`BR-0605`), so the page names
 *   where an enquiry goes instead of leaving someone hunting for a button.
 *
 * `BR-0603` needs no handling here at all: an incompletely-linked entitlement is
 * filtered server-side, and `TrainerEntitlementDto` has no shape for one.
 */

type Phase = 'loading' | 'error' | 'ready';

export default function MyEntitlementsPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getEntitlementsContent(locale), [locale]);
  const copy = content.mine;
  const service = getEntitlementService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [rows, setRows] = useState<readonly TrainerEntitlementDto[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const loadedOnce = useRef(false);

  useEffect(() => {
    document.title = copy.documentTitle;
  }, [copy.documentTitle]);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    void service.listMyEntitlements().then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setRows(result.value);
        setPhase('ready');
      } else {
        setPhase('error');
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  useEffect(() => {
    if (phase === 'ready' && !loadedOnce.current) {
      loadedOnce.current = true;
      document.getElementById('eh-entitlements-title')?.focus();
    }
  }, [phase]);

  const money = numberFormatter(locale);
  const dates = dateFormatter(locale, {
    dateStyle: 'medium',
  });

  const columns: Array<TableColumn<TrainerEntitlementDto>> = [
    {
      key: 'program',
      header: content.columns.program,
      render: (row) => <bdi>{localized(row.programName, locale)}</bdi>,
    },
    {
      key: 'status',
      header: content.columns.status,
      // ⚠️ ERP's own status, rendered as given — the platform enumerates none
      // of them (`Q27`), so every one is toned the same.
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
      render: (row) => <bdi>{row.purchaseOrderNumber}</bdi>,
    },
    {
      key: 'agreement',
      header: content.columns.agreement,
      render: (row) => <bdi>{row.agreementReference}</bdi>,
    },
  ];

  if (phase === 'loading') {
    return (
      <Section aria-label={copy.title}>
        <Container>
          <Loading variant="skeleton" lines={5} label={copy.title} />
        </Container>
      </Section>
    );
  }

  if (phase === 'error') {
    return (
      <PageLoadError
        title={content.errors.loadTitle}
        body={content.errors.loadBody}
        onRetry={() => setReloadKey((key) => key + 1)}
        retryLabel={content.errors.retry}
        size="prose"
      />
    );
  }

  return (
    <Section aria-labelledby="eh-entitlements-title">
      <Container>
        <div className={styles.header}>
          <Typography as="h1" id="eh-entitlements-title" variant="display-md" tabIndex={-1}>
            {copy.title}
          </Typography>
          <Typography as="p" variant="text-md" color="muted">
            {copy.intro}
          </Typography>
          {/* `BR-0601` — say whose numbers these are. */}
          <Typography as="p" variant="text-sm" color="muted">
            {copy.sourceNote}
          </Typography>
        </div>

        {rows.length === 0 ? (
          <Card effect="stroke">
            <EmptyState
              icon={<Icon name="note-01" size="featured" tone="neutral" decorative />}
              title={copy.emptyTitle}
              description={copy.emptyBody}
            />
          </Card>
        ) : (
          <Table
            columns={columns}
            rows={[...rows]}
            getRowId={(row) => row.entitlementId}
            caption={copy.resultsLabel}
            contained
          />
        )}

        {/* `BR-0605` — no dispute path exists, so name where an enquiry goes. */}
        <Alert tone="info" role="note">
          {copy.noDisputeNote}
        </Alert>
      </Container>
    </Section>
  );
}
