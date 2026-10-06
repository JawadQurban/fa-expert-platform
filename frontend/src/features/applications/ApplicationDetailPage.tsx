import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Card, ItemIcon, Loading, Modal } from '@ds/composite';
import { Button, Icon, Tag, Typography } from '@ds/primitives';
import type { IconName, TagVariant } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { Container, Section } from '@ds/layout';
import { useLocale } from '@i18n/LocaleProvider';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../app/router/paths';
import type {
  ApplicantAgreementDecisionInput,
  ApplicationDetailDto,
  ServiceOutcome,
} from './applicationDetail.types';
import { normalizeEntries, orderedSections, sectionTitle } from './applicationValidation';
import { getApplicationsService } from './applicationsService';
import { getApplicationDetailContent } from './applicationDetail.content';
import { BankDataSection } from '../profile/components/BankDataSection';
import { ReadOnlyEntries } from '../profile/components/ReadOnlyEntries';
import { getProfileContent } from '../profile/profile.content';
import type { BankDataFields } from '../profile/profile.types';
import { ApplicationStatusBadge } from './components/ApplicationStatusBadge';
import { ApplicationActionPanel } from './components/ApplicationActionPanel';
import { InterviewPanel } from './components/InterviewPanel';
import { AgreementDecisionPanel } from './components/AgreementDecisionPanel';
import { AgreementPreviewCard } from './components/AgreementPreviewCard';
import { StatusTimeline } from './components/StatusTimeline';
import { SyncBanner } from './components/SyncBanner';
import styles from './ApplicationDetailPage.module.css';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { apiUrl } from '../../shared/services/apiClient';
import { formatDate as formatLocaleDate } from '../../shared/formatting';

/**
 * EH-TP-03 — Application Details (`/expert-hub/applications/:applicationId`,
 * trainer render). Shows one owned application's full state/history and the one
 * stage-driven action available now, then re-renders into the resulting state.
 *
 * Two stages carry an action, and each turned out to be a decision with several
 * answers rather than a single button:
 *
 * - **The interview is journey J-06.** The applicant chooses one of the proposed
 *   times against a 3-business-day clock (F1/AC-4), *or* asks for different ones
 *   (F4/AC-1) — and may still ask after confirming (F4/AC-2). Before 2026-08-19
 *   the page offered only "confirm a slot", so an applicant no proposed time
 *   suited had no way forward (`DECISIONS.md` P-49/P-50).
 * - **The agreement is journey J-11.** The applicant reads the whole agreement
 *   (F1/AC-2) and takes one of three decisions — e-sign in-platform (AC-3),
 *   reject and permanently close (AC-4), or request a modification that returns
 *   to the J-10 preparer (AC-5). It replaced the page spec's single "upload a
 *   signed PDF" step on 2026-08-19 (`DECISIONS.md` P-42).
 *
 * Consumes **only** `applicationsService` (mock now, Expert Hub API later); no
 * FAST/MTM/ERP/SSO calls. Honors the business-vs-sync separation (`§0.9`): the
 * Status Badge and the post-sign `SyncBanner` are distinct elements, and a sync
 * problem never reverts the Approved badge. A foreign/unknown id resolves to a
 * not-found state (`§0.7`); the final signed PDF and attachment downloads remain
 * blocked by `G26`/`G27` (service seam in place, no fabricated links).
 */

type Phase = 'loading' | 'error' | 'not-found' | 'unauthorized' | 'session' | 'ready';

/**
 * Only the slot pick needs the page-owned confirmation dialog. The J-06
 * reschedule and each J-11 decision carry their own, because they need
 * materially different confirmations — a signature field, a permanence
 * acknowledgement, a mandatory note, an optional availability note — and one
 * shared dialog could not state any of them honestly.
 */
type PendingConfirm = { readonly kind: 'slot'; readonly slotId: string };

const OUTCOME_VARIANT: Readonly<Record<ServiceOutcome, TagVariant>> = {
  pending: 'neutral',
  accepted: 'success',
  rejected: 'error',
};

function formatDate(iso: string | null, locale: Locale, fallback: string): string {
  if (iso == null) {
    return fallback;
  }
  return formatLocaleDate(new Date(iso), locale, {
    dateStyle: 'medium',
  });
}

/**
 * The answers the applicant submitted, as the schema they were given.
 *
 * ⚠️ **THE SEAM, and the only one.** `GET v1/applications/{id}` does NOT serve
 * them today: `ApplicationDetailWire`
 * (`backend/src/ExpertHub.Api/Applications/ApplicationEndpoints.cs`)
 * carries the reference, services, status, dates, timeline, per-service
 * outcomes, rejection reason, attachments, action, bank data, interview,
 * agreement and sync — and no `FormSchema`, no `Values`, no `Entries`. So this
 * returns `null` on every response the API sends, and the section does not
 * render at all rather than showing an invented or half-guessed answer.
 *
 * When the endpoint serves them it serves the shape the draft wire already
 * uses — `values` plus an optional `entries`, `dm-gap-01.2026-09-21` — beside
 * the schema version the applicant filled in, which is what the read below
 * expects. Promoting it is three optional fields on `ApplicationDetailDto`
 * (`applicationDetail.types.ts`, outside this change's ownership); until then
 * the narrow read lives here so exactly one function has to change.
 */
function submittedForm(detail: ApplicationDetailDto): ApplicationDetailDto | null {
  // An application always answers a form, but a provider written before the
  // detail carried one may not send it — so this stays a guard rather than an
  // assumption, and the section simply does not render.
  return detail.formSchema == null ? null : detail;
}

/** Icon-badge + heading — a consistent visual lead-in for each section. */
function SectionHead({
  icon,
  id,
  children,
}: {
  readonly icon: IconName;
  readonly id?: string;
  readonly children: ReactNode;
}) {
  return (
    <div className={styles.sectionHead}>
      <ItemIcon contained icon={<Icon name={icon} size="md" tone="primary" decorative />} />
      <Typography as="h2" id={id} variant="text-lg" weight="bold">
        {children}
      </Typography>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getApplicationDetailContent(locale), [locale]);
  const { applicationId } = useParams();
  const service = getApplicationsService();

  const [phase, setPhase] = useState<Phase>('loading');
  const [detail, setDetail] = useState<ApplicationDetailDto | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [busy, setBusy] = useState(false);
  // The bank-data section is the profile's, reused verbatim — same eight
  // mandatory fields, same wording, so an applicant who later opens their
  // profile sees the section they already filled in.
  const profileContent = getProfileContent(locale);
  const [actionFailed, setActionFailed] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadedOnce = useRef(false);
  const justActed = useRef(false);

  /* ── load ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    if (applicationId == null) {
      setPhase('not-found');
      return;
    }
    void service.getApplication(applicationId).then((result) => {
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
      } else if (result.error.status === 401) {
        setPhase('session');
      } else {
        setPhase('error');
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, reloadKey]);

  useEffect(() => {
    if (detail != null) {
      document.title = content.documentTitle(detail.reference ?? content.summary.draftReference);
    }
  }, [detail, content]);

  /* ── focus: h1 on first load; action heading after an action changes it ── */
  useEffect(() => {
    if (phase !== 'ready') {
      return;
    }
    if (justActed.current) {
      justActed.current = false;
      document.getElementById('eh-action-heading')?.focus();
    } else if (!loadedOnce.current) {
      loadedOnce.current = true;
      document.getElementById('eh-detail-title')?.focus();
    }
  }, [phase, detail]);

  const retry = () => setReloadKey((key) => key + 1);

  /** Shared tail for every action: swap in the new detail, or report failure. */
  const applyResult = (
    request: Promise<Awaited<ReturnType<typeof service.getApplication>>>,
    message: string
  ) => {
    setBusy(true);
    setActionFailed(false);
    void request.then((result) => {
      setBusy(false);
      setPending(null);
      if (result.ok) {
        justActed.current = true;
        setDetail(result.value);
        setSuccessMessage(message);
      } else {
        setActionFailed(true);
      }
    });
  };

  const runAction = () => {
    if (pending == null || applicationId == null) {
      return;
    }
    applyResult(service.selectInterviewSlot(applicationId, pending.slotId), content.success.slot);
  };

  /** J-06/F4 — ask for different times; the F1 flow then repeats (AC-4). */
  const requestReschedule = (note: string) => {
    if (applicationId == null) {
      return;
    }
    applyResult(
      service.requestInterviewReschedule(applicationId, { note }),
      content.success.rescheduleRequested
    );
  };

  /** J-11/F1 — one endpoint, three mutually exclusive answers. */
  const decideOnAgreement = (input: ApplicantAgreementDecisionInput) => {
    if (applicationId == null) {
      return;
    }
    const message =
      input.kind === 'sign'
        ? content.success.signed
        : input.kind === 'reject'
          ? content.success.rejected
          : content.success.modificationRequested;
    applyResult(service.decideOnAgreement(applicationId, input), message);
  };

  /**
   * `J-09/F6/AC-4` — saving is what unblocks the creator, so the application
   * is re-read afterwards and the required action moves on by itself.
   */
  const saveBankData = (fields: BankDataFields) => {
    if (applicationId == null) {
      return;
    }
    applyResult(service.saveBankData(applicationId, fields), content.success.bankDataSaved);
  };

  /* ── non-ready states ──────────────────────────────────────────────────── */
  if (phase === 'loading') {
    return (
      <Section aria-label={content.summary.heading}>
        <Container>
          <Loading variant="skeleton" lines={6} label={content.summary.heading} />
        </Container>
      </Section>
    );
  }

  if (phase !== 'ready' || detail == null) {
    const copy =
      phase === 'not-found'
        ? { title: content.errors.notFoundTitle, body: content.errors.notFoundBody }
        : phase === 'unauthorized'
          ? { title: content.errors.unauthorizedTitle, body: content.errors.unauthorizedBody }
          : phase === 'session'
            ? { title: content.errors.sessionTitle, body: content.errors.sessionBody }
            : { title: content.errors.loadTitle, body: content.errors.loadBody };
    return (
      <PageLoadError
        title={copy.title}
        body={copy.body}
        onRetry={phase === 'error' ? retry : undefined}
        retryLabel={content.errors.retry}
        size="prose"
        action={
          <Button variant="secondary" size="md" href={expertHubPaths.applications}>
            {content.errors.homeLabel}
          </Button>
        }
      />
    );
  }

  const referenceText = detail.reference ?? content.summary.draftReference;

  /*
   * Every repeatable section's entries, read through the application form's own
   * adapter — a served `entries` map wins, and its absence means exactly one
   * entry built from the flat `values`, which is what every application saved
   * before `dm-gap-01.2026-09-21` looks like. Three qualifications therefore
   * show as three, and a historical one as one.
   */
  const submitted = submittedForm(detail);
  const submittedEntries =
    submitted == null ? {} : normalizeEntries(submitted.formSchema, submitted);

  return (
    <Section aria-labelledby="eh-detail-title">
      <Container>
        <Breadcrumbs
          items={[
            { label: content.breadcrumbApplications, href: expertHubPaths.applications },
            { label: referenceText },
          ]}
          label={content.breadcrumbLabel}
        />

        {/* Summary — soft branded focal header with the business Status Badge (P-02). */}
        <Card effect="shadow" className={styles.summary}>
          <div className={styles.summaryHead}>
            <span className={styles.summaryBadge}>
              <Icon name="note-01" size="featured" tone="inherit" decorative />
            </span>
            <div className={styles.summaryHeadings}>
              <Typography as="h1" id="eh-detail-title" variant="display-md" tabIndex={-1}>
                {content.summary.heading}
              </Typography>
              {detail.reference != null ? (
                <span className={styles.referenceChip}>
                  <bdi>{detail.reference}</bdi>
                </span>
              ) : (
                <span className={styles.draftReference}>{content.summary.draftReference}</span>
              )}
            </div>
            <ApplicationStatusBadge
              status={detail.status}
              label={content.statuses[detail.status]}
            />
          </div>
          <dl className={styles.meta}>
            <div className={styles.metaItem}>
              <dt className={styles.metaTerm}>
                <Icon name="co-present" size="sm" tone="primary" decorative />
                {content.summary.servicesLabel}
              </dt>
              <dd className={styles.metaValue}>
                {detail.services
                  .map((service_) => content.services[service_])
                  .join(locale === 'ar' ? '، ' : ', ')}
              </dd>
            </div>
            <div className={styles.metaItem}>
              <dt className={styles.metaTerm}>
                <Icon name="note-add" size="sm" tone="primary" decorative />
                {content.summary.submittedLabel}
              </dt>
              <dd className={styles.metaValue}>
                {formatDate(detail.submittedAt, locale, content.summary.notSubmitted)}
              </dd>
            </div>
            <div className={styles.metaItem}>
              <dt className={styles.metaTerm}>
                <Icon name="dashboard-circle" size="sm" tone="primary" decorative />
                {content.summary.updatedLabel}
              </dt>
              <dd className={styles.metaValue}>{formatDate(detail.updatedAt, locale, '—')}</dd>
            </div>
          </dl>

          {/* EH-TP-06 entry — widen scope on an approved/active application (BR-0110). */}
          {(detail.status === 'approved' || detail.status === 'active') && (
            <div className={styles.summaryActions}>
              <Button
                variant="secondary"
                size="sm"
                href={expertHubPaths.applicationAddService(detail.id)}
                iconStart={<Icon name="add-circle" size="sm" decorative />}
              >
                {content.summary.addService}
              </Button>
            </div>
          )}
        </Card>

        {/* Rejection reason — a decision is never a bare status. Rendered as a
            tinted error Alert; `role="note"` (not the tone-default assertive
            "alert") since this is persistent state, not a load-time event. The
            reason is reviewer-authored Arabic content, marked with lang/dir and
            bidi-isolated so it reads correctly even in the English UI. */}
        {detail.rejectionReason != null && (
          <Alert
            tone="error"
            surface="tinted"
            title={content.rejection.heading}
            role="note"
            className={styles.rejectionNotice}
          >
            <bdi lang="ar" dir="rtl">
              {detail.rejectionReason}
            </bdi>
          </Alert>
        )}

        {/* Post-sign sync — SEPARATE from the business status (§0.9). */}
        <SyncBanner sync={detail.sync} content={content} />

        {successMessage !== '' && (
          <Alert tone="success" role="status">
            {successMessage}
          </Alert>
        )}
        {actionFailed && (
          <Alert tone="error" role="alert">
            {content.errors.actionFailed}
          </Alert>
        )}

        <div className={styles.grid}>
          <div className={styles.mainColumn}>
            <StatusTimeline timeline={detail.timeline} content={content} />

            {/* J-11/F1/AC-2 — the full agreement, readable before any decision. */}
            {detail.agreement != null && (
              <AgreementPreviewCard
                agreement={detail.agreement}
                content={content}
                formatDate={(iso) => formatDate(iso, locale, '—')}
              />
            )}

            {detail.perServiceOutcomes.length > 0 && (
              <section className={styles.perService} aria-labelledby="eh-perservice-heading">
                <SectionHead icon="task-done-01" id="eh-perservice-heading">
                  {content.perService.heading}
                </SectionHead>
                <ul className={styles.outcomeGrid}>
                  {detail.perServiceOutcomes.map((row) => (
                    <li key={row.service}>
                      <Card effect="stroke" className={styles.outcomeCard}>
                        <ItemIcon
                          contained
                          icon={<Icon name="co-present" size="md" tone="primary" decorative />}
                        />
                        <Typography as="p" variant="text-md" weight="bold">
                          {content.services[row.service]}
                        </Typography>
                        <Tag variant={OUTCOME_VARIANT[row.outcome]} size="sm">
                          {content.perService.outcomes[row.outcome]}
                        </Tag>
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/*
              What the applicant actually submitted, for the repeatable
              sections — their qualifications, certificates and past roles, one
              Card each, in the order they were entered. Driven by the served
              schema's own `repeatable` marker and titled with its own words,
              so a new repeatable section appears here with no change.
            */}
            {submitted != null &&
              orderedSections(submitted.formSchema)
                .filter((section) => section.repeatable != null)
                .map((section) => (
                  <section
                    key={section.id}
                    className={styles.perService}
                    aria-labelledby={`eh-entries-${section.id}`}
                  >
                    <SectionHead icon="note-01" id={`eh-entries-${section.id}`}>
                      {sectionTitle(section, locale)}
                    </SectionHead>
                    <ReadOnlyEntries
                      schema={submitted.formSchema}
                      section={section}
                      services={detail.services}
                      entries={submittedEntries[section.id] ?? []}
                      locale={locale}
                    />
                  </section>
                ))}
          </div>

          <div className={styles.sideColumn}>
            <Card effect="shadow" className={styles.actionCard}>
              {detail.action === 'decide-agreement' ? (
                <AgreementDecisionPanel
                  content={content}
                  busy={busy}
                  onDecide={decideOnAgreement}
                />
              ) : detail.action === 'provide-bank-data' && detail.bankData != null ? (
                /*
                 * `J-09/F6/AC-2` — «new fields open in their profile». The
                 * applicant has no profile page yet (it exists only once they
                 * are an accredited trainer), so the section opens HERE, on
                 * the application they are being approved for. Same component,
                 * same eight mandatory fields, same endpoint.
                 */
                <BankDataSection
                  bankData={detail.bankData}
                  content={profileContent}
                  locale={locale}
                  saving={busy}
                  onSave={saveBankData}
                />
              ) : detail.action === 'manage-interview' && detail.interview != null ? (
                <InterviewPanel
                  interview={detail.interview}
                  content={content}
                  busy={busy}
                  formatSlot={content.formatSlot}
                  onSelectSlot={(slotId) => setPending({ kind: 'slot', slotId })}
                  onRequestReschedule={requestReschedule}
                />
              ) : (
                <ApplicationActionPanel content={content} />
              )}
            </Card>

            {/* The resting states after a J-11 decision. `role="note"` — settled
                state the applicant returns to, not a load-time announcement. */}
            {detail.agreementState === 'declined' && (
              <Alert tone="error" surface="tinted" role="note">
                {content.agreementDecision.declinedNotice}
              </Alert>
            )}
            {detail.agreementState === 'modification-requested' && (
              <Alert tone="info" surface="tinted" role="note">
                {content.agreementDecision.modificationNotice}
                {detail.agreement?.decision?.note != null && (
                  <>
                    <Typography as="p" variant="text-sm" weight="bold">
                      {content.agreementDecision.yourNoteLabel}
                    </Typography>
                    <bdi>{detail.agreement.decision.note}</bdi>
                  </>
                )}
              </Alert>
            )}

            {/* Attachments (P-15). View-only list — download wires up with real
                file storage (`G26`); no fabricated download of a mock file. */}
            <Card effect="stroke" className={styles.attachments}>
              <SectionHead icon="note-01">{content.attachments.heading}</SectionHead>
              {detail.attachments.length === 0 ? (
                <Typography as="p" variant="text-md" color="muted">
                  {content.attachments.empty}
                </Typography>
              ) : (
                <ul className={styles.attachmentList}>
                  {detail.attachments.map((attachment) => (
                    <li key={attachment.id} className={styles.attachmentRow}>
                      <span className={styles.attachmentName}>
                        <Icon name="note-01" size="sm" tone="primary" decorative />
                        {/* Openable, and labelled by WHICH document it is —
                            several uploads can share a filename, which left
                            three indistinguishable rows on this page. */}
                        {attachment.url == null ? (
                          <bdi>{attachment.name}</bdi>
                        ) : (
                          <a href={apiUrl(attachment.url)} target="_blank" rel="noreferrer">
                            <bdi>{attachment.name}</bdi>
                          </a>
                        )}
                      </span>
                      <Tag variant="neutral" size="xs">
                        {attachment.label != null
                          ? (attachment.label[locale] ?? attachment.label.ar)
                          : content.attachments.kinds[attachment.kind]}
                      </Tag>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>

        {/* Confirmation dialog (§0.5) — the slot pick. The J-11 decisions carry
            their own dialogs, each stating what that specific decision does. */}
        <Modal
          open={pending != null}
          onClose={() => setPending(null)}
          title={content.confirmSlot.title}
          dismissLabel={content.confirmSlot.dismiss}
          footer={
            <div className={styles.modalActions}>
              <Button variant="secondary" size="md" onClick={() => setPending(null)}>
                {content.confirmSlot.cancel}
              </Button>
              <Button variant="primary" size="md" onClick={runAction} disabled={busy}>
                {content.confirmSlot.confirm}
              </Button>
            </div>
          }
        >
          <Typography as="p" variant="text-md">
            {pending == null
              ? ''
              : content.confirmSlot.body(
                  content.formatSlot(
                    detail.interview?.proposedSlots.find((slot) => slot.id === pending.slotId)
                      ?.startsAt ?? ''
                  )
                )}
          </Typography>
        </Modal>
      </Container>
    </Section>
  );
}
