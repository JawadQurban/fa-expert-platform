import { useId, useRef, useState } from 'react';
import { Alert, Modal } from '@ds/composite';
import { Button, Radio, RadioGroup, Select, Textarea, Typography } from '@ds/primitives';
import type { SelectOption } from '@ds/primitives';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../../app/router/paths';
import type { ApplicationService } from '../../applications/application.types';
import { REJECTION_REASONS } from '../../screening/screening.types';
import type { RejectionReasonId } from '../../screening/screening.types';
import type { InterviewsContent } from '../interviews.content';
import {
  noServicePassed,
  toDecisionInput,
  validatePostInterviewDecision,
} from '../interview.types';
import type {
  DecisionValidationIssue,
  PostInterviewDecisionInput,
  PostInterviewDecisionSummaryDto,
  ServiceDecisionDraft,
  ServiceInterviewResultDto,
} from '../interview.types';
import { Panel } from '../../../shared/workspace/Panel';
import styles from './PostInterviewDecisionPanel.module.css';
import { formatDate } from '../../../shared/formatting';

type Drafts = Readonly<Partial<Record<ApplicationService, ServiceDecisionDraft>>>;

const EMPTY_DRAFT: ServiceDecisionDraft = { kind: null, reason: null, reasonOther: '' };

/**
 * J-07/F3 — the post-interview decision, taken **per service** (P-384, UAT
 * BUG-027): the application had one interview, and each service it covered is
 * forwarded to the approval committee (J-09) or rejected with its own reason.
 * The constraints the journey sets are honoured here:
 *
 * - **Authority is server-decided** (`BR-0208`, AC-1): the page renders this
 *   panel only when `viewer.canDecide` (or, after a no-show reschedule,
 *   `viewer.canReject`) is true, and the panel states that restriction.
 * - **The decision waits for the result** (`BR-0220`): while the result is still
 *   `null`, the choices render disabled with a named reason instead of
 *   disappearing, so the blocker is legible.
 * - **A rejection needs a reason** from the *platform-wide unified* list
 *   (AC-2, `BR-0219`) — per rejected service, imported from screening.
 * - **The pass mark is advisory** (P-355): a service below it may still be
 *   forwarded; the confirmation names it.
 * - **After a no-show reschedule** (AC-4) only rejection is open, so forwarding
 *   is disabled on every service.
 */
export function PostInterviewDecisionPanel({
  services,
  resultReady,
  result,
  exemptedServices = [],
  decision,
  applicationId,
  content,
  locale,
  submitting,
  onSubmit,
  fullNoShow = false,
  rejectOnly = false,
}: {
  /** The services the one interview covers — each is decided on its own. */
  readonly services: readonly ApplicationService[];
  readonly resultReady: boolean;
  readonly result: readonly ServiceInterviewResultDto[] | null;
  /** Exempted services keep the application forwardable (J-08). */
  readonly exemptedServices?: readonly ApplicationService[];
  readonly decision: PostInterviewDecisionSummaryDto | null;
  /** Used to link on to EH-INT-05 once the application is forwarded. */
  readonly applicationId: string | null;
  readonly content: InterviewsContent;
  readonly locale: Locale;
  readonly submitting: boolean;
  readonly onSubmit: (input: PostInterviewDecisionInput) => void;
  /** J-07/F3/AC-3 — every member marked «did not attend». */
  readonly fullNoShow?: boolean;
  /** J-07/F3/AC-4 — the rescheduled interview has not happened: reject only. */
  readonly rejectOnly?: boolean;
}) {
  const copy = content.decision;
  const panelId = useId();
  const errorsRef = useRef<HTMLDivElement>(null);
  const [drafts, setDrafts] = useState<Drafts>({});
  const [issues, setIssues] = useState<readonly DecisionValidationIssue[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const separator = locale === 'ar' ? '، ' : ', ';
  const names = (list: readonly ApplicationService[]) =>
    list.map((service) => content.services[service]).join(separator);

  if (decision != null) {
    const forwarded = decision.kind === 'forward';
    return (
      <Panel shape="inline" title={copy.heading} titleId="eh-interview-decision">
        <Alert
          tone={forwarded ? 'success' : 'error'}
          surface="tinted"
          title={forwarded ? content.recorded.forwardTitle : content.recorded.rejectTitle}
          role="status"
        >
          {forwarded ? content.recorded.forwardBody : content.recorded.rejectBody}
        </Alert>
        {decision.services.length > 0 && (
          <>
            <Typography as="h3" variant="text-sm" weight="bold" id={`${panelId}-recorded`}>
              {content.recorded.servicesLabel}
            </Typography>
            <ul className={styles.recordedList} aria-labelledby={`${panelId}-recorded`}>
              {decision.services.map((entry) => (
                <li key={entry.service}>
                  {entry.kind === 'forward'
                    ? content.recorded.serviceForwarded(content.services[entry.service])
                    : content.recorded.serviceRejected(
                        content.services[entry.service],
                        entry.rejectionReason === 'other' && entry.rejectionReasonText != null
                          ? entry.rejectionReasonText
                          : entry.rejectionReason != null
                            ? content.rejectionReasons[entry.rejectionReason]
                            : '—'
                      )}
                </li>
              ))}
            </ul>
          </>
        )}
        <Typography as="p" variant="text-xs" color="muted">
          {content.recorded.decidedBy(
            decision.decidedByName,
            formatDate(new Date(decision.decidedAt), locale, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })
          )}
        </Typography>
        {/* A forwarded application continues at EH-INT-05 (J-09) — linked so the
            chain stays walkable rather than ending at a confirmation. */}
        {forwarded && applicationId != null && (
          <div>
            <Button
              variant="secondary"
              size="md"
              href={expertHubPaths.internalApplicationCommittee(applicationId)}
            >
              {content.recorded.goToCommittee}
            </Button>
          </div>
        )}
      </Panel>
    );
  }

  const locked = (!resultReady && !rejectOnly) || submitting;
  const nonePassed = noServicePassed(result, exemptedServices);
  const reasonOptions: SelectOption[] = REJECTION_REASONS.map((id) => ({
    value: id,
    label: content.rejectionReasons[id],
  }));

  const update = (service: ApplicationService, patch: Partial<ServiceDecisionDraft>) => {
    setDrafts((current) => ({
      ...current,
      [service]: { ...EMPTY_DRAFT, ...current[service], ...patch },
    }));
    setIssues([]);
  };

  const handleSubmitClick = () => {
    const found = validatePostInterviewDecision(services, drafts);
    setIssues(found);
    if (found.length > 0) {
      errorsRef.current?.focus();
      return;
    }
    setConfirmOpen(true);
  };

  const forwardedServices = services.filter((service) => drafts[service]?.kind === 'forward');
  const rejectedServices = services.filter((service) => drafts[service]?.kind === 'reject');
  const forwardedBelowMark = (result ?? [])
    .filter((entry) => entry.passed === false && forwardedServices.includes(entry.service))
    .map((entry) => entry.service);
  const wholeRejection = forwardedServices.length === 0 && exemptedServices.length === 0;

  return (
    <Panel
      shape="inline"
      title={copy.heading}
      titleId="eh-interview-decision"
      description={copy.description}
    >
      <Typography as="p" variant="text-xs" color="muted">
        {copy.authorityNote}
      </Typography>

      {/* `BR-0220` — a named blocker beats a vanished control. */}
      {!resultReady && !rejectOnly && (
        <Alert tone="info" surface="tinted" title={copy.blockedTitle} role="status">
          {copy.blockedBody}
        </Alert>
      )}
      {fullNoShow ? (
        <Alert tone="warning" surface="tinted" title={copy.noShowTitle} role="status">
          {copy.noShowBody}
        </Alert>
      ) : (
        nonePassed && (
          <Alert tone="info" surface="tinted" title={copy.noPassTitle} role="status">
            {copy.noPassBody}
          </Alert>
        )
      )}
      {rejectOnly && (
        <Alert tone="info" surface="tinted" title={copy.rejectOnlyTitle} role="status">
          {copy.rejectOnlyBody}
        </Alert>
      )}

      {/* P-384 — one decision per service the interview covered. */}
      {services.map((service) => {
        const draft = drafts[service] ?? EMPTY_DRAFT;
        const heading = copy.serviceHeading(content.services[service]);
        return (
          <section key={service} className={styles.service} aria-label={heading}>
            <Typography as="h3" variant="text-sm" weight="bold">
              {heading}
            </Typography>
            <RadioGroup
              legend={copy.choiceLegend}
              name={`${panelId}-${service}`}
              value={draft.kind ?? ''}
              disabled={locked}
              onValueChange={(value) =>
                update(service, { kind: value === 'reject' ? 'reject' : 'forward' })
              }
            >
              <Radio value="forward" label={copy.forward} disabled={rejectOnly} />
              <Radio value="reject" label={copy.reject} />
            </RadioGroup>
            {draft.kind === 'reject' && (
              <>
                <Select
                  label={copy.reasonLabel}
                  placeholder={copy.reasonPlaceholder}
                  options={reasonOptions}
                  value={draft.reason ?? ''}
                  onValueChange={(value) => update(service, { reason: value as RejectionReasonId })}
                  requiredField
                />
                {draft.reason === 'other' && (
                  <Textarea
                    label={copy.otherLabel}
                    value={draft.reasonOther}
                    onChange={(event) => update(service, { reasonOther: event.target.value })}
                    requiredField
                    rows={3}
                  />
                )}
              </>
            )}
          </section>
        );
      })}

      {issues.length > 0 && (
        <div
          ref={errorsRef}
          className={styles.errors}
          role="alert"
          tabIndex={-1}
          aria-labelledby={`${panelId}-errors-heading`}
        >
          <Typography as="h3" id={`${panelId}-errors-heading`} variant="text-md" weight="bold">
            {copy.errorsHeading}
          </Typography>
          <ul className={styles.recordedList}>
            {issues.map((issue) => (
              <li key={`${issue.code}-${issue.service}`}>
                {copy.errors[issue.code](content.services[issue.service])}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.actions}>
        <Button variant="primary" size="md" onClick={handleSubmitClick} disabled={locked}>
          {copy.submit}
        </Button>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={content.decisionDialog.title}
        dismissLabel={content.decisionDialog.cancel}
        footer={
          <>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setConfirmOpen(false);
                onSubmit(toDecisionInput(services, drafts));
              }}
            >
              {content.decisionDialog.confirm}
            </Button>
            <Button variant="tertiary" size="md" onClick={() => setConfirmOpen(false)}>
              {content.decisionDialog.cancel}
            </Button>
          </>
        }
      >
        {forwardedServices.length > 0 && (
          <Typography as="p" variant="text-md">
            {content.decisionDialog.forwarded(names(forwardedServices))}
          </Typography>
        )}
        {rejectedServices.length > 0 && (
          <Typography as="p" variant="text-md">
            {content.decisionDialog.rejected(names(rejectedServices))}
          </Typography>
        )}
        {exemptedServices.length > 0 && (
          <Typography as="p" variant="text-md">
            {content.decisionDialog.exemptedStay(names(exemptedServices))}
          </Typography>
        )}
        {forwardedBelowMark.length > 0 && (
          <Alert tone="warning" surface="tinted" role="status">
            {content.decisionDialog.notPassedNote(names(forwardedBelowMark))}
          </Alert>
        )}
        {wholeRejection && (
          <div className={styles.dialogField}>
            <Alert tone="error" role="alert">
              {content.decisionDialog.wholeRejection}
            </Alert>
          </div>
        )}
      </Modal>
    </Panel>
  );
}
