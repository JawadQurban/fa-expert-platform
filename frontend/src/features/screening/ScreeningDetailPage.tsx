import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Loading, Tabs } from '@ds/composite';
import { Button, Typography } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { useLocale } from '@i18n/LocaleProvider';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../app/router/paths';
import { ApplicationStatusBadge } from '../applications/components/ApplicationStatusBadge';
import { getScreeningContent } from './screening.content';
import { getScreeningService } from './screeningService';
import type {
  ScreeningDecisionInput,
  ScreeningDecisionSummaryDto,
  ScreeningDetailDto,
} from './screening.types';
import { ApplicationSectionsReview } from './components/ApplicationSectionsReview';
import { QualitativeInsightPanel } from './components/QualitativeInsightPanel';
import { slotInputToInstant } from '../interviews/components/InterviewSlotsField';
import { RecordedDecision } from './components/RecordedDecision';
import { ScreeningAttachments } from './components/ScreeningAttachments';
import { ScreeningDecisionPanel } from './components/ScreeningDecisionPanel';
import { ServiceScorePanel } from './components/ServiceScorePanel';
import { SlaBadge } from '../../shared/components/SlaBadge';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { RecordHead } from '../../shared/workspace/RecordHead';
import { Panel } from '../../shared/workspace/Panel';
import styles from './ScreeningDetailPage.module.css';
import { formatDate as formatLocaleDate } from '../../shared/formatting';

/**
 * EH-INT-03 — **Application Insight Page** (`/expert-hub/internal/applications/:id`,
 * screening manager). Journeys **J-05** (Screening & Initial Decision) and
 * **J-08** (Interview Exemption).
 *
 * J-05/F2 asks for one page consolidating everything needed to decide: the
 * requested services, the per-service objective score, the assistive AI reading
 * of the qualitative answers, the form section by section, the attachments, and
 * this application's SLA — with the decision itself taken here (AC-7).
 *
 * Laid out as the approved Option B record screen: the applicant's identity
 * head, the decision directly under it, then the evidence in one tabbed card.
 * The score and the AI reading are separate components consuming separate
 * contract fields, so `BR-0201`/`BR-0202` hold structurally rather than by
 * layout convention.
 *
 * Consumes **only** `screeningService` (mock now, Expert Hub API later); no
 * FAST / MTM / ERP / SSO calls. The evaluation model is configuration served to
 * the page (`BR-0203`), never logic in it — weights and thresholds stay open
 * under `DM-GAP-02`.
 */

type Phase = 'loading' | 'error' | 'not-found' | 'unauthorized' | 'session' | 'ready';

function formatDate(iso: string, locale: Locale): string {
  return formatLocaleDate(new Date(iso), locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ScreeningDetailPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getScreeningContent(locale), [locale]);
  const { id = '' } = useParams<{ id: string }>();

  const [phase, setPhase] = useState<Phase>('loading');
  const [detail, setDetail] = useState<ScreeningDetailDto | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  /** Set once a decision is recorded in this session — replaces the panel. */
  const [recorded, setRecorded] = useState<ScreeningDecisionSummaryDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    void getScreeningService()
      .getScreeningDetail(id)
      .then((response) => {
        if (cancelled) {
          return;
        }
        if (response.ok) {
          setDetail(response.value);
          setPhase('ready');
          return;
        }
        const status = response.error.status;
        setPhase(
          status === 404
            ? 'not-found'
            : status === 401
              ? 'session'
              : status === 403
                ? 'unauthorized'
                : 'error'
        );
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  useEffect(() => {
    if (detail != null) {
      document.title = content.documentTitle(detail.reference);
    }
  }, [content, detail]);

  useEffect(() => {
    document.getElementById('eh-screening-title')?.focus();
  }, [detail?.id]);

  const handleSubmit = (decision: ScreeningDecisionInput) => {
    setSubmitting(true);
    setSubmitError(false);
    /*
     * D-03 — the slot picker yields local wall-clock with no offset. Sent as
     * written, 09:00 in Riyadh was stored as 09:00 UTC and shown back to the
     * applicant as 12:00. The browser is the only layer that knows which
     * timezone the person meant, so the conversion belongs here and the API
     * only ever receives instants.
     */
    const withInstants: ScreeningDecisionInput =
      decision.kind === 'accept'
        ? {
            ...decision,
            services: decision.services.map((entry) => ({
              ...entry,
              slots: entry.slots.map(slotInputToInstant),
            })),
          }
        : decision;
    void getScreeningService()
      .submitDecision(id, withInstants)
      .then((response) => {
        setSubmitting(false);
        if (!response.ok) {
          setSubmitError(true);
          return;
        }
        const result = response.value;
        setRecorded({
          kind: decision.kind,
          decidedAt: result.decidedAt,
          // Attributed server-side to the acting user; the mock echoes the role.
          decidedByName: content.eyebrow,
          acceptedServices: result.acceptedServices,
          autoRejectedServices: result.autoRejectedServices,
          exemptedServices: result.exemptedServices,
          rejectionReason: decision.kind === 'reject' ? decision.reason : null,
        });
        // The decision moved the application to another stage, and the reply
        // says WHICH — J-08's exemption path goes straight to the committee,
        // everything else to the interview. Taking the server's answer keeps
        // the onward link right without this component re-deriving the rule.
        setDetail((current) => (current == null ? current : { ...current, status: result.status }));
      });
  };

  /**
   * Where this application actually is now. Screening is the first internal
   * stage and the inbox lands here for every application, so a decided one
   * has to point onward. Null while screening is still the current stage —
   * there is nowhere else to be yet.
   */
  const nextStage = ((): { readonly href: string; readonly label: string } | null => {
    if (detail == null) {
      return null;
    }
    switch (detail.status) {
      case 'interview-scheduled':
      case 'interview-completed':
        return {
          href: expertHubPaths.internalApplicationInterview(detail.id),
          label: content.goToInterview,
        };
      case 'approval-in-progress':
        return {
          href: expertHubPaths.internalApplicationCommittee(detail.id),
          label: content.goToCommittee,
        };
      // Approved, waiting on the agreement, or already active: J-10 is the
      // page that prepares it and the one that shows what was prepared.
      case 'approved':
      case 'agreement-pending':
      case 'active':
        return {
          href: expertHubPaths.internalApplicationAgreement(detail.id),
          label: content.goToAgreement,
        };
      default:
        return null;
    }
  })();

  if (phase === 'loading') {
    return (
      <WorkspacePage label={content.eyebrow}>
        <Loading variant="skeleton" lines={8} label={content.eyebrow} />
      </WorkspacePage>
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
        onRetry={phase === 'error' ? () => setReloadKey((key) => key + 1) : undefined}
        retryLabel={content.errors.retry}
        action={
          <Button variant="secondary" size="md" href={expertHubPaths.internalApplications}>
            {content.backToInbox}
          </Button>
        }
      />
    );
  }

  // ⚠️ `null` while `SLA-0202` has no duration — J-05 never states one, and the
  // deadline console is where it would be set (`BR-0705`). The page says the
  // deadline is unconfigured rather than showing a number nobody approved.
  const slaCopy =
    detail.sla == null
      ? null
      : detail.sla.state === 'breached'
        ? content.sla.overdue(Math.abs(detail.sla.daysRemaining))
        : content.sla.remaining(Math.max(detail.sla.daysRemaining, 0));

  const decisionSummary = recorded ?? detail.decision;
  const showDecisionPanel = decisionSummary == null && detail.decisionPending;
  /** An interview exists only once screening scheduled one (J-05/F5/AC-5). */
  const hasInterview =
    detail.status === 'interview-scheduled' || detail.status === 'interview-completed';

  return (
    <WorkspacePage labelledBy="eh-screening-title">
      <Breadcrumbs
        items={[
          { label: content.inboxCrumb, href: expertHubPaths.internalApplications },
          { label: detail.reference },
        ]}
        label={content.backToInbox}
      />

      {/* Identity — applicant, reference, submission, services, source, SLA (F2/AC-1, AC-6). */}
      <RecordHead
        titleId="eh-screening-title"
        title={detail.applicantName}
        person={detail.applicantName}
        meta={[
          <bdi>{detail.reference}</bdi>,
          content.submittedOn(formatDate(detail.submittedAt, locale)),
          detail.services
            .map((service) => content.services[service])
            .join(locale === 'ar' ? '، ' : ', '),
          content.sources[detail.source],
          detail.sla == null || slaCopy == null
            ? content.sla.notConfigured
            : `${slaCopy} · ${content.sla.dueOn(formatDate(detail.sla.dueAt, locale))}`,
        ]}
        tags={
          <>
            <ApplicationStatusBadge
              status={detail.status}
              label={content.statuses[detail.status]}
            />
            {detail.sla != null && (
              <SlaBadge state={detail.sla.state} label={content.sla.labels[detail.sla.state]} />
            )}
          </>
        }
        actions={
          /* Once screening has produced an interview, EH-INT-04 is the next
             stop — linked from here so the accreditation chain is walkable
             rather than reachable only by typing a URL. */
          hasInterview ? (
            <Button
              variant="secondary"
              size="md"
              href={expertHubPaths.internalApplicationInterview(detail.id)}
            >
              {content.goToInterview}
            </Button>
          ) : undefined
        }
      />

      {/*
        J-05/F5 + J-08/F1 — the decision, or its recorded outcome.

        ⚠️ It sits directly under the identity head, ABOVE the review material,
        on the owner's ruling that the action belongs at the top of a detail
        page. It used to trail the whole page, so a reviewer scrolled past every
        section to reach the one thing the page exists for — and on a long
        application the accept/reject controls were below three screens of
        evidence. The evidence is still one tab-click away beneath it.
      */}
      <div className={styles.decision}>
        {submitError && (
          <Alert tone="error" surface="tinted" title={content.errors.submitTitle} role="alert">
            {content.errors.submitBody}
          </Alert>
        )}

        {decisionSummary != null ? (
          <>
            <RecordedDecision decision={decisionSummary} content={content} locale={locale} />
            {nextStage != null && (
              /*
               * The inbox opens THIS page for an application at any stage, so
               * once screening is behind it the reader has to be handed on —
               * otherwise the chain dead ends here and the next step is
               * reachable only by typing a URL. Reported from the testing
               * server: bank data was complete and nothing led to J-10.
               */
              <Panel>
                <div className={styles.nextStage}>
                  <Typography as="p" variant="text-sm" color="muted">
                    {content.currentStageNote}
                  </Typography>
                  <Button variant="primary" size="md" href={nextStage.href}>
                    {nextStage.label}
                  </Button>
                </div>
              </Panel>
            )}
          </>
        ) : showDecisionPanel ? (
          <ScreeningDecisionPanel
            services={detail.services}
            committeePool={detail.committeePool}
            content={content}
            locale={locale}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        ) : (
          <Panel shape="inline" title={content.decision.heading} titleId="eh-screening-decision">
            <Alert tone="info" surface="tinted" role="status">
              {content.recorded.alreadyScreened}
            </Alert>
          </Panel>
        )}
      </div>

      {/*
        The review material is tabbed inside one card. Read end to end this page
        ran past 3,300px; the review sections become panels so the evidence
        stays compact beneath the decision it supports. Each panel keeps its
        section heading for the outline; the tab already names it on screen.
      */}
      <Panel flush>
        <Tabs
          label={content.reviewTabsLabel}
          className={styles.reviewTabs}
          items={[
            {
              id: 'eh-screening-tab-assessment',
              label: content.scores.heading,
              content: (
                <>
                  {/* J-05/F3 — the official score, one block per service (never combined). */}
                  <section className={styles.block} aria-labelledby="eh-screening-scores">
                    <Typography as="h2" id="eh-screening-scores" className="fads-visually-hidden">
                      {content.scores.heading}
                    </Typography>
                    <Typography as="p" variant="text-xs" color="muted">
                      {content.scores.description} {content.scores.perServiceNote}
                    </Typography>
                    <div className={styles.scoreGrid}>
                      {detail.scores.map((score) => (
                        <ServiceScorePanel
                          key={score.service}
                          score={score}
                          content={content}
                          locale={locale}
                        />
                      ))}
                    </div>
                  </section>

                  {/* J-05/F4 — assistive only, structurally separate from the score above. */}
                  <section className={styles.block} aria-labelledby="eh-screening-insight">
                    <Typography as="h2" id="eh-screening-insight" className="fads-visually-hidden">
                      {content.insight.heading}
                    </Typography>
                    <QualitativeInsightPanel
                      insight={detail.insight}
                      sections={detail.sections}
                      content={content}
                      locale={locale}
                    />
                  </section>
                </>
              ),
            },
            {
              id: 'eh-screening-tab-form',
              label: content.form.heading,
              content: (
                /* J-05/F2/AC-2 — the form, section by section, field by field. */
                <section className={styles.block} aria-labelledby="eh-screening-form">
                  <Typography as="h2" id="eh-screening-form" className="fads-visually-hidden">
                    {content.form.heading}
                  </Typography>
                  <Typography as="p" variant="text-xs" color="muted">
                    {content.form.description}
                  </Typography>
                  <ApplicationSectionsReview
                    sections={detail.sections}
                    content={content}
                    locale={locale}
                  />
                </section>
              ),
            },
            {
              id: 'eh-screening-tab-attachments',
              label: content.attachments.heading,
              content: (
                /* J-05/F2/AC-8 — attachments browsable from this page. */
                <section className={styles.block} aria-labelledby="eh-screening-attachments">
                  <Typography
                    as="h2"
                    id="eh-screening-attachments"
                    className="fads-visually-hidden"
                  >
                    {content.attachments.heading}
                  </Typography>
                  <Typography as="p" variant="text-xs" color="muted">
                    {content.attachments.description}
                  </Typography>
                  <ScreeningAttachments
                    attachments={detail.attachments}
                    content={content}
                    locale={locale}
                  />
                </section>
              ),
            },
          ]}
        />
      </Panel>
    </WorkspacePage>
  );
}
