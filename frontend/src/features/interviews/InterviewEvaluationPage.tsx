import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Loading } from '@ds/composite';
import { Button, Tag, Typography } from '@ds/primitives';
import type { TagVariant } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { useLocale } from '@i18n/LocaleProvider';
import { expertHubPaths } from '../../app/router/paths';
import { getInterviewsContent } from './interviews.content';
import { getInterviewService } from './interviewService';
import type {
  InterviewDetailDto,
  InterviewEvaluationInput,
  InterviewPhase,
  PostInterviewDecisionInput,
  RescheduleInput,
} from './interview.types';
import { CommitteeResponseList } from './components/CommitteeResponseList';
import { InterviewEvaluationForm } from './components/InterviewEvaluationForm';
import { InterviewResultPanel } from './components/InterviewResultPanel';
import { PostInterviewDecisionPanel } from './components/PostInterviewDecisionPanel';
import { RescheduleDialog } from './components/RescheduleDialog';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { RecordHead } from '../../shared/workspace/RecordHead';
import { IconTile } from '../../shared/workspace/IconTile';
import { Panel } from '../../shared/workspace/Panel';
import styles from './InterviewEvaluationPage.module.css';
import { formatDate } from '../../shared/formatting';

/**
 * EH-INT-04 — **Interview Evaluation & Post-Interview Decision**
 * (`/expert-hub/internal/applications/:id/interview`, staff). Journey **J-07**,
 * plus the staff half of **J-06** (reschedule).
 *
 * The page is built around the ticket created in J-06/F2: committee members open
 * it to file their individual evaluation (or mark non-attendance), the result is
 * consolidated only once every assigned member has responded (`BR-0220`), and
 * the screening decision-maker then forwards to the approval committee or
 * rejects directly (`BR-0208`).
 *
 * Reading order is the approved Option B record screen: the applicant's head
 * (carrying the ticket — its number, the confirmed time, the Teams link and the
 * reschedule action), then *your* evaluation, then the other members' responses
 * behind a closed disclosure, then the consolidated result and the decision.
 * Every capability boundary (`canEvaluate`, `canDecide`, `canReschedule`) is
 * **server-decided** and simply rendered — the frontend never infers authority
 * from a role string.
 *
 * Consumes only `interviewService` (mock now, Expert Hub API later); the Teams
 * meeting link is data on the ticket, never a call from this app (Teams is not
 * yet in the CAP-12 integration table).
 */

type Phase = 'loading' | 'error' | 'not-found' | 'unauthorized' | 'session' | 'ready';

/** BUG-032 — the derived interview state, by text + Tag variant, never colour alone. */
const PHASE_VARIANT: Readonly<Record<InterviewPhase, TagVariant>> = {
  'awaiting-selection': 'warning',
  scheduled: 'information',
  'in-progress': 'information',
  ended: 'neutral',
  completed: 'success',
};

/** What the viewer just did, so the page can confirm it in place. */
type Ack = 'evaluation' | 'non-attendance' | null;

export default function InterviewEvaluationPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getInterviewsContent(locale), [locale]);
  const { id = '' } = useParams<{ id: string }>();

  const [phase, setPhase] = useState<Phase>('loading');
  const [detail, setDetail] = useState<InterviewDetailDto | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [ack, setAck] = useState<Ack>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    void getInterviewService()
      .getInterviewDetail(id)
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
    document.getElementById('eh-interview-title')?.focus();
  }, [detail?.applicationId]);

  const handleEvaluation = (input: InterviewEvaluationInput) => {
    setSubmitting(true);
    setSubmitError(false);
    void getInterviewService()
      .submitEvaluation(id, input)
      .then((response) => {
        setSubmitting(false);
        if (!response.ok) {
          setSubmitError(true);
          return;
        }
        // The server returns the refreshed state — a submission may be the one
        // that completes the committee and produces the result (`BR-0220`).
        setDetail(response.value);
        setAck(input.kind === 'did-not-attend' ? 'non-attendance' : 'evaluation');
      });
  };

  const handleDecision = (input: PostInterviewDecisionInput) => {
    setSubmitting(true);
    setSubmitError(false);
    void getInterviewService()
      .submitDecision(id, input)
      .then((response) => {
        setSubmitting(false);
        if (!response.ok) {
          setSubmitError(true);
          return;
        }
        setDetail((current) =>
          current == null ? current : { ...current, decision: response.value }
        );
      });
  };

  const handleReschedule = (input: RescheduleInput) => {
    setSubmitting(true);
    setSubmitError(false);
    void getInterviewService()
      .requestReschedule(id, input)
      .then((response) => {
        setSubmitting(false);
        if (!response.ok) {
          setSubmitError(true);
          return;
        }
        setDetail(response.value);
        setRescheduleOpen(false);
      });
  };

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

  const { viewer, ticket } = detail;
  const resultReady = detail.result != null;
  const formatSlot = (iso: string) =>
    formatDate(new Date(iso), locale, { dateStyle: 'full', timeStyle: 'short' });
  // RUN-021 — a proposal is not a fixed time: until the applicant picks, the
  // head says so and lists what was proposed, exactly as entered.
  const scheduled =
    ticket.scheduledAt != null
      ? formatSlot(ticket.scheduledAt)
      : content.ticket.awaitingSelection(
          ticket.proposedSlots.map(formatSlot).join(locale === 'ar' ? '، ' : ', ')
        );
  const blocked =
    viewer.evaluationBlockedReason == null || viewer.evaluationBlockedReason === 'not-member'
      ? null
      : content.evaluation.blocked[viewer.evaluationBlockedReason];

  return (
    <>
      <WorkspacePage labelledBy="eh-interview-title">
        <Breadcrumbs
          items={[
            { label: content.inboxCrumb, href: expertHubPaths.internalApplications },
            {
              label: detail.reference,
              href: expertHubPaths.internalApplicationDetail(detail.applicationId),
            },
            { label: content.eyebrow },
          ]}
          label={content.backToInbox}
        />

        {/* J-06/F2 — the ticket every evaluation is filed against rides in the
            head: its number, the confirmed time, the services, and the Teams
            link or its pending state. A `null` link is stated, never faked. */}
        <RecordHead
          titleId="eh-interview-title"
          title={detail.applicantName}
          person={detail.applicantName}
          meta={[
            <bdi>{detail.reference}</bdi>,
            <>
              {content.ticket.heading} <bdi>{ticket.number}</bdi>
            </>,
            scheduled,
            detail.acceptedServices
              .map((service) => content.services[service])
              .join(locale === 'ar' ? '، ' : ', '),
            ticket.meetingUrl == null ? content.ticket.meetingPending : undefined,
          ]}
          tags={
            <>
              <Tag variant={PHASE_VARIANT[detail.status]} size="sm">
                {content.ticket.phases[detail.status]}
              </Tag>
              {ticket.rescheduleCount > 0 && (
                <Tag variant="information" size="sm">
                  {content.ticket.rescheduledCount(ticket.rescheduleCount)}
                </Tag>
              )}
            </>
          }
          actions={
            ticket.meetingUrl != null || viewer.canReschedule ? (
              <>
                {ticket.meetingUrl != null && (
                  <Button variant="secondary" size="md" href={ticket.meetingUrl}>
                    {content.ticket.join}
                  </Button>
                )}
                {viewer.canReschedule && (
                  <Button variant="secondary" size="md" onClick={() => setRescheduleOpen(true)}>
                    {content.ticket.reschedule}
                  </Button>
                )}
              </>
            ) : undefined
          }
        />

        {detail.rescheduleRequest != null && (
          <Alert
            tone="warning"
            surface="tinted"
            title={content.ticket.rescheduleRequestedTitle}
            role="status"
          >
            {content.ticket.rescheduleRequestedBody(detail.rescheduleRequest.note)}
          </Alert>
        )}

        {submitError && (
          <Alert tone="error" surface="tinted" title={content.errors.submitTitle} role="alert">
            {content.errors.submitBody}
          </Alert>
        )}

        {/* J-07/F1 — your own independent evaluation, first. */}
        {ack != null ? (
          <Panel shape="inline" title={content.evaluation.heading} titleId="eh-interview-ack">
            <Alert
              tone="success"
              surface="tinted"
              title={
                ack === 'non-attendance'
                  ? content.evaluation.nonAttendanceRecordedTitle
                  : content.evaluation.submittedTitle
              }
              role="status"
            >
              {ack === 'non-attendance'
                ? content.evaluation.nonAttendanceRecordedBody
                : content.evaluation.submittedBody}
            </Alert>
          </Panel>
        ) : viewer.canEvaluate ? (
          <InterviewEvaluationForm
            services={detail.acceptedServices}
            model={detail.model}
            content={content}
            locale={locale}
            submitting={submitting}
            onSubmit={handleEvaluation}
          />
        ) : (
          /* RUN-002 — the server says WHY; «not a member» only when it is true. */
          <Panel shape="inline" title={content.evaluation.heading} titleId="eh-interview-own">
            <Alert
              tone="info"
              surface="tinted"
              title={blocked?.title ?? content.evaluation.notAMemberTitle}
              role="status"
            >
              {blocked?.body(scheduled) ?? content.evaluation.notAMemberBody}
            </Alert>
          </Panel>
        )}

        {/*
          J-07/F2/AC-1 — who is still outstanding, and why nothing is calculated.

          The other members' responses are reference material, so they sit
          behind a disclosure under your own evaluation rather than above it.
          It shows names and response states only — never another member's
          scores — so `BR-0203`'s independent judgement is not at stake.
        */}
        {/* RUN-036 — open by default: a closed card read as an empty section.
            It lists who responded, never a score, so BR-0203 is unaffected. */}
        <details className={styles.committeeDisclosure} open>
          <summary className={styles.committeeSummary}>
            <IconTile icon="co-present" />
            <Typography as="span" variant="text-md" weight="bold">
              {content.committee.heading}
            </Typography>
          </summary>
          <div className={styles.committeeBody}>
            <CommitteeResponseList
              committee={detail.committee}
              viewerMemberId={viewer.memberId}
              content={content}
              locale={locale}
            />
          </div>
        </details>

        {/* J-07/F2 — consolidated result, or a named pending state. */}
        <InterviewResultPanel
          result={detail.result}
          committee={detail.committee}
          content={content}
          locale={locale}
        />

        {/* J-07/F3 — restricted to the screening decision-maker (`BR-0208`). */}
        {(viewer.canDecide || viewer.canReject === true) && (
          <PostInterviewDecisionPanel
            fullNoShow={viewer.fullNoShow === true}
            rejectOnly={!viewer.canDecide && viewer.canReject === true}
            resultReady={resultReady}
            result={detail.result}
            exemptedServices={detail.exemptedServices}
            decision={detail.decision}
            applicationId={detail.applicationId}
            content={content}
            locale={locale}
            submitting={submitting}
            onSubmit={handleDecision}
          />
        )}
      </WorkspacePage>

      <RescheduleDialog
        open={rescheduleOpen}
        content={content}
        submitting={submitting}
        onClose={() => setRescheduleOpen(false)}
        onSubmit={handleReschedule}
      />
    </>
  );
}
