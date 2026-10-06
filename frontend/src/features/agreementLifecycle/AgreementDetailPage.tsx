import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Loading } from '@ds/composite';
import { Button, Tag, Typography } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { useLocale } from '@i18n/LocaleProvider';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../app/router/paths';
import type {
  AgreementDetailDto,
  AgreementLifecycleInput,
  AgreementStatus,
} from './agreementLifecycle.types';
import { getAgreementLifecycleService } from './agreementLifecycleService';
import { getAgreementLifecycleContent } from './agreementLifecycle.content';
import { AgreementActionsPanel } from './components/AgreementActionsPanel';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { RecordHead } from '../../shared/workspace/RecordHead';
import { Panel } from '../../shared/workspace/Panel';
import styles from './AgreementDetailPage.module.css';
import { formatDate as formatLocaleDate } from '../../shared/formatting';

/**
 * EH-INT-06 detail — one agreement's lifecycle (**J-12/F1–F3**).
 *
 * The history (`04` EH-INT-06 §6) is the reason the mutations return the whole
 * refreshed detail rather than an ack: a renewal changes the status, the dates,
 * the renewal count, the next term *and* the history in one write, and the page
 * has no business recomputing any of it.
 */

type Phase = 'loading' | 'error' | 'not-found' | 'ready';

const STATUS_VARIANT: Readonly<
  Record<AgreementStatus, 'success' | 'warning' | 'error' | 'neutral'>
> = {
  active: 'success',
  suspended: 'warning',
  expired: 'error',
  ended: 'neutral',
};

function formatDate(iso: string, locale: Locale): string {
  return formatLocaleDate(new Date(iso), locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function AgreementDetailPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getAgreementLifecycleContent(locale), [locale]);
  const { agreementId } = useParams();
  const service = getAgreementLifecycleService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [agreement, setAgreement] = useState<AgreementDetailDto | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [actionFailed, setActionFailed] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadedOnce = useRef(false);
  const justActed = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    if (agreementId == null) {
      setPhase('not-found');
      return;
    }
    void service.getAgreement(agreementId).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setAgreement(result.value);
        setPhase('ready');
      } else if (result.error.status === 404) {
        setPhase('not-found');
      } else {
        setPhase('error');
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreementId, reloadKey]);

  useEffect(() => {
    if (agreement != null) {
      document.title = content.detail.documentTitle(agreement.reference);
    }
  }, [agreement, content]);

  useEffect(() => {
    if (phase !== 'ready') {
      return;
    }
    if (justActed.current) {
      justActed.current = false;
      document.getElementById('eh-actions-heading')?.focus();
    } else if (!loadedOnce.current) {
      loadedOnce.current = true;
      document.getElementById('eh-agreement-title')?.focus();
    }
  }, [phase, agreement]);

  const act = (input: AgreementLifecycleInput) => {
    if (agreementId == null) {
      return;
    }
    setBusy(true);
    setActionFailed(false);
    void service.applyLifecycleAction(agreementId, input).then((result) => {
      setBusy(false);
      if (result.ok) {
        justActed.current = true;
        setAgreement(result.value);
        setSuccessMessage(content.actions.success[input.kind]);
      } else {
        setActionFailed(true);
      }
    });
  };

  if (phase === 'loading') {
    return (
      <WorkspacePage label={content.detail.heading}>
        <Loading variant="skeleton" lines={6} label={content.detail.heading} />
      </WorkspacePage>
    );
  }

  if (phase !== 'ready' || agreement == null) {
    const copy =
      phase === 'not-found'
        ? { title: content.errors.notFoundTitle, body: content.errors.notFoundBody }
        : { title: content.errors.loadTitle, body: content.errors.loadBody };
    return (
      <PageLoadError
        title={copy.title}
        body={copy.body}
        onRetry={phase === 'error' ? () => setReloadKey((key) => key + 1) : undefined}
        retryLabel={content.errors.retry}
        size="prose"
        action={
          <Button variant="secondary" size="md" href={expertHubPaths.internalAgreements}>
            {content.errors.backToList}
          </Button>
        }
      />
    );
  }

  return (
    <WorkspacePage labelledBy="eh-agreement-title">
      <Breadcrumbs
        items={[
          { label: content.detail.breadcrumbList, href: expertHubPaths.internalAgreements },
          { label: agreement.reference },
        ]}
        label={content.detail.breadcrumbLabel}
      />

      <RecordHead
        titleId="eh-agreement-title"
        title={content.detail.heading}
        icon="note-01"
        meta={[<bdi>{agreement.reference}</bdi>]}
        tags={
          <>
            <Tag variant={STATUS_VARIANT[agreement.status]} size="sm">
              {content.statuses[agreement.status]}
            </Tag>
            {agreement.expiryMilestone.kind !== 'none' && (
              <Tag
                variant={
                  // The farthest reminder is informational; anything tighter
                  // (or expired) needs attention. The numbers themselves are
                  // configuration now (`BR-0705`), so they are not named here.
                  agreement.expiryMilestone.kind === 'reminder' &&
                  agreement.expiryMilestone.daysBefore >= 90
                    ? 'information'
                    : 'warning'
                }
                size="sm"
              >
                {content.milestone(agreement.expiryMilestone)}
              </Tag>
            )}
          </>
        }
      >
        <dl className={styles.meta}>
          <div className={styles.metaItem}>
            <dt className={styles.metaTerm}>{content.detail.trainerLabel}</dt>
            <dd className={styles.metaValue}>{agreement.trainerName}</dd>
          </div>
          <div className={styles.metaItem}>
            <dt className={styles.metaTerm}>{content.detail.servicesLabel}</dt>
            <dd className={styles.metaValue}>
              {agreement.services
                .map((service) => content.services[service])
                .join(locale === 'ar' ? '، ' : ', ')}
            </dd>
          </div>
          <div className={styles.metaItem}>
            <dt className={styles.metaTerm}>{content.detail.termLabel}</dt>
            <dd className={styles.metaValue}>
              <bdi>
                {content.detail.termValue(
                  formatDate(agreement.startsAt, locale),
                  formatDate(agreement.endsAt, locale)
                )}
              </bdi>
            </dd>
          </div>
          <div className={styles.metaItem}>
            <dt className={styles.metaTerm}>{content.detail.renewalCountLabel}</dt>
            <dd className={styles.metaValue}>
              {content.detail.renewalCountValue(agreement.renewalCount)}
            </dd>
          </div>
        </dl>

        {/* `G26` — document storage unresolved; no fabricated download. */}
        {agreement.documentUrl == null && (
          <Typography as="p" variant="text-xs" color="muted">
            {content.detail.documentUnavailable}
          </Typography>
        )}
      </RecordHead>

      {successMessage !== '' && (
        <Alert tone="success" surface="tinted" role="status">
          {successMessage}
        </Alert>
      )}
      {actionFailed && (
        <Alert tone="error" surface="tinted" role="alert">
          {content.errors.actionFailed}
        </Alert>
      )}

      <div className={styles.grid}>
        <div className={styles.mainColumn}>
          {/* The heading sits in the card body with the list it names. */}
          <Panel>
            <Typography as="h2" variant="text-md" weight="bold">
              {content.detail.historyHeading}
            </Typography>
            <ol className={styles.history}>
              {agreement.history.map((entry) => (
                <li key={entry.id} className={styles.historyRow}>
                  <span className={styles.historyDot} aria-hidden="true" />
                  <div className={styles.historyBody}>
                    <Typography as="p" variant="text-sm" weight="bold">
                      {content.detail.historyKinds[entry.kind]}
                      {entry.termYears != null &&
                        ` — ${content.detail.historyTerm(entry.termYears)}`}
                    </Typography>
                    <Typography as="p" variant="text-xs" color="muted">
                      {content.detail.historyEntry(entry.byName, formatDate(entry.at, locale))}
                    </Typography>
                    {entry.note != null && (
                      <Typography as="p" variant="text-sm">
                        <bdi>{entry.note}</bdi>
                      </Typography>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className={styles.sideColumn}>
          <AgreementActionsPanel
            agreement={agreement}
            content={content}
            busy={busy}
            formatDate={(iso) => formatDate(iso, locale)}
            onAct={act}
          />
        </div>
      </div>
    </WorkspacePage>
  );
}
