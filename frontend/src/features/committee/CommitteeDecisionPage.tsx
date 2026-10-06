import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Loading } from '@ds/composite';
import { Button, Typography } from '@ds/primitives';
import { Breadcrumbs } from '@ds/shell';
import { useLocale } from '@i18n/LocaleProvider';
import type { Result } from '@/types';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { expertHubPaths } from '../../app/router/paths';
import { getCommitteeContent } from './committee.content';
import { getCommitteeService } from './committeeService';
import { currentMember } from './committee.types';
import type {
  CommitteeDetailDto,
  FormCommitteeInput,
  MemberDecisionInput,
} from './committee.types';
import { ApprovalSequenceTimeline } from './components/ApprovalSequenceTimeline';
import { BankDataGateCard } from './components/BankDataGateCard';
import { CombinedResultsPanel } from './components/CombinedResultsPanel';
import { MemberDecisionPanel } from './components/MemberDecisionPanel';
import { SequenceFormation } from '../../shared/components/SequenceFormation';
import { buildCommitteeFormationCopy } from './committeeFormationCopy';
import { PageLoadError } from '../../shared/components/PageLoadError';
import { WorkspacePage } from '../../shared/workspace/WorkspacePage';
import { RecordHead } from '../../shared/workspace/RecordHead';
import { Panel } from '../../shared/workspace/Panel';
import styles from './CommitteeDecisionPage.module.css';

/**
 * EH-INT-05 — **Approval Committee Decision**
 * (`/expert-hub/internal/applications/:id/committee`, staff). Journey **J-09**.
 *
 * The page has two faces driven entirely by server state, not by a local wizard
 * step: before a sequence exists the creator forms one (F2); once it is running
 * everyone sees the same timeline, and only the member whose turn it is gets a
 * decision panel (F4/AC-2, P-J9 `viewer.canDecide`).
 *
 * Laid out as the approved Option B record screen: the applicant's head, then
 * the action (forming the committee, or the member's decision), then the
 * running sequence, the results from earlier stages it is decided against
 * (F3/AC-2), and — for the creator — the bank-data gate (F6), the other half of
 * what unblocks agreement preparation (F5/AC-3).
 *
 * Consumes only `committeeService` (mock now, Expert Hub API later).
 */

type Phase = 'loading' | 'error' | 'not-found' | 'unauthorized' | 'session' | 'ready';

export default function CommitteeDecisionPage() {
  const { locale } = useLocale();
  const content = useMemo(() => getCommitteeContent(locale), [locale]);
  const { id = '' } = useParams<{ id: string }>();

  const [phase, setPhase] = useState<Phase>('loading');
  const [detail, setDetail] = useState<CommitteeDetailDto | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  /** The refusal's ProblemDetails `detail` — some carry a code worth naming. */
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    void getCommitteeService()
      .getCommitteeDetail(id)
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
    document.getElementById('eh-committee-title')?.focus();
  }, [detail?.applicationId]);

  /** Every mutation returns the refreshed detail — the server owns what changed. */
  const run = (action: Promise<Result<CommitteeDetailDto, ExpertHubApiError>>) => {
    setSubmitting(true);
    setSubmitError(null);
    void action.then((response) => {
      setSubmitting(false);
      if (!response.ok) {
        setSubmitError(response.error.message);
        return;
      }
      setDetail(response.value);
    });
  };

  const handleFormation = (input: FormCommitteeInput) => {
    run(getCommitteeService().formCommittee(id, input));
  };

  const handleDecision = (input: MemberDecisionInput) => {
    run(getCommitteeService().submitMemberDecision(id, input));
  };

  const handleResubmit = () => {
    run(getCommitteeService().resubmitAfterModification(id));
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

  const { viewer, outcome, sequence } = detail;
  const active = currentMember(sequence);
  const notFormed = sequence.length === 0;
  const modificationMember = sequence.find((member) => member.state === 'modification-requested');
  /** Drives the approve dialog's "this finalizes it" wording (F4/AC-5 + F6). */
  const isLastMandatory =
    active != null &&
    active.obligation === 'mandatory' &&
    !sequence.some(
      (member) =>
        member.obligation === 'mandatory' &&
        member.approverId !== active.approverId &&
        member.state !== 'approved'
    );

  return (
    <WorkspacePage labelledBy="eh-committee-title">
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

      <RecordHead
        titleId="eh-committee-title"
        title={detail.applicantName}
        person={detail.applicantName}
        meta={[<bdi>{detail.reference}</bdi>, content.eyebrow]}
      />

      {submitError != null && (
        <Alert tone="error" surface="tinted" title={content.errors.submitTitle} role="alert">
          {submitError === 'only-application-creator'
            ? content.errors.onlyApplicationCreator
            : content.errors.submitBody}
        </Alert>
      )}

      {/* Final outcomes lead — a halted or approved application is the headline. */}
      {outcome.state === 'approved' && (
        <Alert tone="success" surface="tinted" title={content.outcome.approvedTitle} role="status">
          {content.outcome.approvedBody}
        </Alert>
      )}
      {outcome.state === 'rejected' && (
        <Alert tone="error" surface="tinted" title={content.outcome.rejectedTitle} role="status">
          {content.outcome.rejectedBody(outcome.rejectedByName ?? '')}
          {outcome.rejectionReason != null &&
            ` · ${content.outcome.reasonLabel}: ${content.rejectionReasons[outcome.rejectionReason]}`}
        </Alert>
      )}

      {/* F7 — a live modification request pauses the sequence for everyone. */}
      {outcome.state === 'modification-requested' && modificationMember != null && (
        <Alert
          tone="warning"
          surface="tinted"
          title={content.modificationBanner.title}
          role="status"
          action={
            viewer.canResubmit ? (
              <Button variant="primary" size="md" onClick={handleResubmit} disabled={submitting}>
                {content.modificationBanner.resubmit}
              </Button>
            ) : undefined
          }
        >
          {content.modificationBanner.body(modificationMember.name)}
          {modificationMember.note != null && ` — «${modificationMember.note}»`}{' '}
          {content.modificationBanner.resumeNote}
        </Alert>
      )}

      {notFormed ? (
        /* F2 — no sequence yet: the creator forms one. */
        viewer.isCreator ? (
          <SequenceFormation
            approverPool={detail.approverPool}
            templates={detail.templates}
            copy={buildCommitteeFormationCopy(content)}
            locale={locale}
            submitting={submitting}
            onSubmit={handleFormation}
          />
        ) : (
          <Panel shape="inline" title={content.formation.heading} titleId="eh-committee-formation">
            <Alert tone="info" surface="tinted" role="status">
              {content.decision.notYourTurnBody}
            </Alert>
          </Panel>
        )
      ) : (
        <>
          {/*
            F4/AC-2 + P-J9 — only the member whose turn it is decides.

            ⚠️ Action first: this sits ABOVE the sequence it acts on (owner
            ruling — a detail page's action belongs at the top, not trailing
            the page). The sequence below is the context for the decision, and
            on a long committee it pushed the one control that matters off the
            first screen.
          */}
          {outcome.state === 'in-progress' &&
            (viewer.canDecide && active != null ? (
              <MemberDecisionPanel
                obligation={active.obligation}
                isLastMandatory={isLastMandatory}
                content={content}
                submitting={submitting}
                onSubmit={handleDecision}
              />
            ) : (
              <Panel shape="inline" title={content.decision.heading} titleId="eh-committee-turn">
                <Alert
                  tone="info"
                  surface="tinted"
                  title={content.decision.notYourTurnTitle}
                  role="status"
                >
                  {content.decision.notYourTurnBody}
                </Alert>
              </Panel>
            ))}

          {/* F4 — the running sequence, visible to everyone involved. */}
          <Panel
            title={content.sequence.heading}
            titleId="eh-committee-sequence"
            icon="task-done-01"
          >
            <ApprovalSequenceTimeline
              sequence={sequence}
              viewerApproverId={viewer.approverId}
              content={content}
              locale={locale}
            />

            {outcome.optionalRejections.length > 0 && (
              <div className={styles.optionalRejections}>
                <Typography as="h3" variant="text-sm" weight="bold">
                  {content.outcome.optionalRejectionsHeading}
                </Typography>
                <ul className={styles.optionalList}>
                  {outcome.optionalRejections.map((entry) => (
                    <li key={entry.approverId}>
                      {entry.name}
                      {entry.note != null && entry.note !== '' && ` — «${entry.note}»`}
                    </li>
                  ))}
                </ul>
                {/* `BR-0211` revised — dissent recorded, outcome unaffected. */}
                <Typography as="p" variant="text-xs" color="muted">
                  {content.outcome.optionalRejectionsNote}
                </Typography>
              </div>
            )}
          </Panel>
        </>
      )}

      {/* F3 — the context every decision is made against. */}
      <CombinedResultsPanel context={detail.context} content={content} locale={locale} />

      {/* F6 + F5/AC-3 — the creator's view of the J-10 gate. */}
      {viewer.isCreator && (
        <BankDataGateCard
          bankData={detail.bankData}
          outcome={outcome}
          applicationId={detail.applicationId}
          content={content}
          locale={locale}
        />
      )}
    </WorkspacePage>
  );
}
