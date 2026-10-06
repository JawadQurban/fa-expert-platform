import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Loading } from '@ds/composite';
import { Button, Link, Tag, Typography } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { useLocale } from '@i18n/LocaleProvider';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../app/router/paths';
import { localized } from '../../shared/types/localizedText';
import { apiUrl } from '../../shared/services/apiClient';
import type { ServiceRequestDecisionInput, ServiceRequestDetailDto } from './serviceRequest.types';
import { getServiceRequestService } from './serviceRequestService';
import { getServiceRequestsContent } from './serviceRequests.content';
import { TrainerContextCard } from './components/TrainerContextCard';
import { ServiceRequestDecisionPanel } from './components/ServiceRequestDecisionPanel';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { RecordHead } from '../../shared/workspace/RecordHead';
import { IconTile } from '../../shared/workspace/IconTile';
import { Panel } from '../../shared/workspace/Panel';
import styles from './ServiceRequestDetailPage.module.css';
import { formatDate as formatLocaleDate } from '../../shared/formatting';

/**
 * EH-INT-02b detail — **journey J-03/F2 + F3**. The decision-maker reads the
 * request *and* the trainer's full approved profile (F2/AC-1), then takes the
 * one administrative decision (F3).
 *
 * The layout puts the trainer's profile above the request's own data on purpose:
 * F2's whole point is that the request is judged in the context of who is asking,
 * not on its own. The decision sits in the narrow column beside both, as the
 * approved Option B record screen places it.
 *
 * Consumes **only** `serviceRequestService`. ⚠️ No entry in
 * `04_PAGE_SPECIFICATIONS` — built from the journey (P-20).
 */

type Phase = 'loading' | 'error' | 'not-found' | 'unauthorized' | 'ready';

function formatDate(iso: string, locale: Locale): string {
  return formatLocaleDate(new Date(iso), locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ServiceRequestDetailPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getServiceRequestsContent(locale), [locale]);
  const { requestId } = useParams();
  const service = getServiceRequestService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [detail, setDetail] = useState<ServiceRequestDetailDto | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [actionFailed, setActionFailed] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadedOnce = useRef(false);
  const justDecided = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    if (requestId == null) {
      setPhase('not-found');
      return;
    }
    void service.getServiceRequest(requestId).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setDetail(result.value);
        setPhase('ready');
      } else if (result.error.status === 404) {
        setPhase('not-found');
      } else if (result.error.status === 403) {
        setPhase('unauthorized');
      } else {
        setPhase('error');
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, reloadKey]);

  useEffect(() => {
    if (detail != null) {
      document.title = content.detail.documentTitle(detail.reference);
    }
  }, [detail, content]);

  useEffect(() => {
    if (phase !== 'ready') {
      return;
    }
    if (justDecided.current) {
      justDecided.current = false;
      document.getElementById('eh-decision-heading')?.focus();
    } else if (!loadedOnce.current) {
      loadedOnce.current = true;
      document.getElementById('eh-request-title')?.focus();
    }
  }, [phase, detail]);

  const decide = (input: ServiceRequestDecisionInput) => {
    if (requestId == null) {
      return;
    }
    setBusy(true);
    setActionFailed(false);
    void service.decideServiceRequest(requestId, input).then((result) => {
      setBusy(false);
      if (result.ok) {
        justDecided.current = true;
        setDetail(result.value);
        setSuccessMessage(
          input.kind === 'approve' ? content.success.approved : content.success.rejected
        );
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

  if (phase !== 'ready' || detail == null) {
    const copy =
      phase === 'not-found'
        ? { title: content.errors.notFoundTitle, body: content.errors.notFoundBody }
        : phase === 'unauthorized'
          ? { title: content.errors.unauthorizedTitle, body: content.errors.unauthorizedBody }
          : { title: content.errors.loadTitle, body: content.errors.loadBody };
    return (
      <PageLoadError
        title={copy.title}
        body={copy.body}
        onRetry={phase === 'error' ? () => setReloadKey((key) => key + 1) : undefined}
        retryLabel={content.errors.retry}
        size="prose"
        action={
          <Button variant="secondary" size="md" href={expertHubPaths.internalServiceRequests}>
            {content.errors.backToList}
          </Button>
        }
      />
    );
  }

  const decision = detail.decision;

  return (
    <WorkspacePage labelledBy="eh-request-title">
      <Breadcrumbs
        items={[
          {
            label: content.detail.breadcrumbList,
            href: expertHubPaths.internalServiceRequests,
          },
          { label: detail.reference },
        ]}
        label={content.detail.breadcrumbLabel}
      />

      <RecordHead
        titleId="eh-request-title"
        title={content.detail.heading}
        icon="add-circle"
        meta={[
          <bdi>{detail.reference}</bdi>,
          `${content.detail.submittedAtLabel}: ${formatDate(detail.submittedAt, locale)}`,
        ]}
        tags={
          <>
            <Tag
              variant={
                detail.status === 'approved'
                  ? 'success'
                  : detail.status === 'rejected'
                    ? 'error'
                    : 'warning'
              }
              size="sm"
            >
              {content.statuses[detail.status]}
            </Tag>
            <span className="fads-visually-hidden">{content.detail.requestedServiceLabel}</span>
            <Tag variant="neutral" size="sm">
              {content.services[detail.requestedService]}
            </Tag>
          </>
        }
      />

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
          {/* F2/AC-1 — the profile leads, because the request is judged in context. */}
          <TrainerContextCard trainer={detail.trainerContext} content={content} locale={locale} />

          <Panel title={content.detail.submittedHeading} titleId="eh-request-submitted">
            {detail.submittedFields.length === 0 ? (
              <Typography as="p" variant="text-sm" color="muted">
                {content.detail.submittedEmpty}
              </Typography>
            ) : (
              <dl className={styles.submitted}>
                {detail.submittedFields.map((field) => (
                  <div key={localized(field.label, locale)} className={styles.submittedItem}>
                    <dt className={styles.metaTerm}>{localized(field.label, locale)}</dt>
                    <dd className={styles.metaValue}>
                      <bdi>{field.value}</bdi>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </Panel>

          <Panel
            title={content.detail.attachmentsHeading}
            titleId="eh-request-attachments"
            flush={detail.submittedAttachments.length > 0}
          >
            {detail.submittedAttachments.length === 0 ? (
              <Typography as="p" variant="text-sm" color="muted">
                {content.detail.attachmentsEmpty}
              </Typography>
            ) : (
              <ul className={styles.attachments}>
                {detail.submittedAttachments.map((attachment) => (
                  <li key={attachment.id} className={styles.attachmentRow}>
                    <IconTile icon="note-01" />
                    <span className={styles.attachmentText}>
                      <span className={styles.attachmentName}>
                        {localized(attachment.label, locale)}
                      </span>
                      <bdi className={styles.fileName}>{attachment.fileName}</bdi>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className={styles.sideColumn}>
          {decision == null ? (
            <ServiceRequestDecisionPanel
              viewer={detail.viewer}
              reasons={detail.rejectionReasons}
              content={content}
              busy={busy}
              onDecide={decide}
            />
          ) : (
            /* The recorded outcome. The rejection reason shows here because
               F3/AC-3 requires it on the internal record — and F3/AC-7 keeps
               it off whatever the trainer is told. */
            <Panel
              shape="inline"
              title={
                decision.kind === 'approve'
                  ? content.decision.outcome.approvedTitle
                  : content.decision.outcome.rejectedTitle
              }
              titleId="eh-decision-heading"
              focusableTitle
            >
              <Typography as="p" variant="text-xs" color="muted">
                {content.decision.outcome.decidedBy(
                  decision.decidedByName,
                  formatDate(decision.decidedAt, locale)
                )}
              </Typography>

              {decision.kind === 'approve' ? (
                <>
                  <Typography as="p" variant="text-sm">
                    {content.decision.outcome.approvedBody(
                      content.services[detail.requestedService]
                    )}
                  </Typography>
                  {decision.addendumFileName != null && (
                    <div className={styles.addendumRow}>
                      <IconTile icon="note-01" />
                      <span>{content.decision.outcome.addendumLabel}</span>
                      {/* The stored document opens; a decision recorded before
                          the upload existed has a name and nothing to open. */}
                      {decision.addendumUrl == null ? (
                        <bdi className={styles.fileName}>{decision.addendumFileName}</bdi>
                      ) : (
                        <Link href={apiUrl(decision.addendumUrl)} target="_blank" rel="noreferrer">
                          <bdi>{decision.addendumFileName}</bdi>
                        </Link>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Typography as="p" variant="text-sm" weight="bold">
                    {content.decision.outcome.reasonLabel}
                  </Typography>
                  <Typography as="p" variant="text-sm">
                    {reasonLabel(detail, locale)}
                  </Typography>
                  {decision.reasonText != null && (
                    <Typography as="p" variant="text-sm">
                      <bdi>{decision.reasonText}</bdi>
                    </Typography>
                  )}
                  <Alert tone="info" surface="tinted" role="note">
                    {content.decision.rejectDialog.reasonPrivacyNote}
                  </Alert>
                </>
              )}
            </Panel>
          )}
        </div>
      </div>
    </WorkspacePage>
  );
}

function reasonLabel(detail: ServiceRequestDetailDto, locale: Locale): string {
  const reason = detail.rejectionReasons.find(
    (candidate) => candidate.id === detail.decision?.reasonId
  );
  return reason == null ? '—' : localized(reason.label, locale);
}
