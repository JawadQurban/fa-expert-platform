import { useState } from 'react';
import { Alert, Modal } from '@ds/composite';
import { Button, Select, Textarea, Typography } from '@ds/primitives';
import type { SelectOption } from '@ds/primitives';
import type { Locale } from '@/types';
import { expertHubPaths } from '../../../app/router/paths';
import { REJECTION_REASONS } from '../../screening/screening.types';
import type { RejectionReasonId } from '../../screening/screening.types';
import type { InterviewsContent } from '../interviews.content';
import { noServicePassed, validatePostInterviewDecision } from '../interview.types';
import type {
  PostInterviewDecisionInput,
  PostInterviewDecisionSummaryDto,
  ServiceInterviewResultDto,
} from '../interview.types';
import { Panel } from '../../../shared/workspace/Panel';
import styles from './PostInterviewDecisionPanel.module.css';
import { formatDate } from '../../../shared/formatting';

/**
 * J-07/F3 — forward the application to the approval committee (J-09), or reject
 * it directly. Three constraints from the journey are honoured here:
 *
 * - **Authority is server-decided** (`BR-0208`, AC-1): the page renders this
 *   panel only when `viewer.canDecide` is true — the person who formed the
 *   committee and made the screening acceptance. No other member holds it, and
 *   the panel states that restriction rather than leaving it implicit.
 * - **The decision waits for the result** (`BR-0220`): while the result is still
 *   `null`, the actions render disabled with a named reason instead of
 *   disappearing, so the blocker is legible.
 * - **Direct rejection needs a reason** from the *platform-wide unified* list
 *   (AC-2, `BR-0219`) — imported from the screening module, not re-declared.
 * - **The 70% pass mark** (business decision, 2026-09-16): only a service that
 *   passed is forwarded, and the committee still decides. When none passed,
 *   forwarding is unavailable and says why; the server enforces the same rule.
 */
export function PostInterviewDecisionPanel({
  resultReady,
  result,
  exemptedServices = [],
  decision,
  applicationId,
  content,
  locale,
  submitting,
  onSubmit,
}: {
  readonly resultReady: boolean;
  readonly result: readonly ServiceInterviewResultDto[] | null;
  /** Exempted services keep the application forwardable (J-08). */
  readonly exemptedServices?: readonly string[];
  readonly decision: PostInterviewDecisionSummaryDto | null;
  /** Used to link on to EH-INT-05 once the application is forwarded. */
  readonly applicationId: string | null;
  readonly content: InterviewsContent;
  readonly locale: Locale;
  readonly submitting: boolean;
  readonly onSubmit: (input: PostInterviewDecisionInput) => void;
}) {
  const copy = content.decision;
  const [forwardOpen, setForwardOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState<RejectionReasonId | ''>('');
  const [reasonOther, setReasonOther] = useState('');
  const [error, setError] = useState<string | null>(null);

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
        {decision.rejectionReason != null && (
          <Typography as="p" variant="text-sm">
            {content.recorded.reasonLabel}: {content.rejectionReasons[decision.rejectionReason]}
          </Typography>
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

  const nonePassed = noServicePassed(result, exemptedServices);
  const notPassed = (result ?? [])
    .filter((entry) => entry.passed === false)
    .map((entry) => content.services[entry.service])
    .join(locale === 'ar' ? '، ' : ', ');

  const reasonOptions: SelectOption[] = REJECTION_REASONS.map((id) => ({
    value: id,
    label: content.rejectionReasons[id],
  }));

  const confirmReject = () => {
    if (reason === '') {
      setError(content.rejectDialog.reasonRequired);
      return;
    }
    const input: PostInterviewDecisionInput = { kind: 'reject', reason, reasonOther };
    if (validatePostInterviewDecision(input).length > 0) {
      setError(content.rejectDialog.otherRequired);
      return;
    }
    setError(null);
    setRejectOpen(false);
    onSubmit(input);
  };

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
      {!resultReady && (
        <Alert tone="info" surface="tinted" title={copy.blockedTitle} role="status">
          {copy.blockedBody}
        </Alert>
      )}
      {nonePassed && (
        <Alert tone="warning" surface="tinted" title={copy.noPassTitle} role="status">
          {copy.noPassBody}
        </Alert>
      )}

      <div className={styles.actions}>
        <Button
          variant="primary"
          size="md"
          onClick={() => setForwardOpen(true)}
          disabled={!resultReady || nonePassed || submitting}
        >
          {copy.forward}
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={() => setRejectOpen(true)}
          disabled={!resultReady || submitting}
        >
          {copy.reject}
        </Button>
      </div>

      <Modal
        open={forwardOpen}
        onClose={() => setForwardOpen(false)}
        title={content.forwardDialog.title}
        dismissLabel={content.forwardDialog.cancel}
        footer={
          <>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setForwardOpen(false);
                onSubmit({ kind: 'forward' });
              }}
            >
              {content.forwardDialog.confirm}
            </Button>
            <Button variant="tertiary" size="md" onClick={() => setForwardOpen(false)}>
              {content.forwardDialog.cancel}
            </Button>
          </>
        }
      >
        <Typography as="p" variant="text-md">
          {content.forwardDialog.body}
        </Typography>
        {notPassed !== '' && (
          <Alert tone="warning" surface="tinted" role="status">
            {content.forwardDialog.notPassedNote(notPassed)}
          </Alert>
        )}
      </Modal>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={content.rejectDialog.title}
        dismissLabel={content.rejectDialog.cancel}
        footer={
          <>
            <Button variant="primary" size="md" onClick={confirmReject}>
              {content.rejectDialog.confirm}
            </Button>
            <Button variant="tertiary" size="md" onClick={() => setRejectOpen(false)}>
              {content.rejectDialog.cancel}
            </Button>
          </>
        }
      >
        <Alert tone="error" role="alert">
          {content.rejectDialog.warning}
        </Alert>
        <div className={styles.dialogField}>
          <Select
            label={content.rejectDialog.reasonLabel}
            placeholder={content.rejectDialog.reasonPlaceholder}
            options={reasonOptions}
            value={reason}
            onValueChange={(value) => {
              setReason(value as RejectionReasonId);
              setError(null);
            }}
            requiredField
            errorText={reason === '' ? (error ?? undefined) : undefined}
          />
        </div>
        {reason === 'other' && (
          <div className={styles.dialogField}>
            <Textarea
              label={content.rejectDialog.otherLabel}
              value={reasonOther}
              onChange={(event) => {
                setReasonOther(event.target.value);
                setError(null);
              }}
              requiredField
              rows={3}
              errorText={error ?? undefined}
            />
          </div>
        )}
      </Modal>
    </Panel>
  );
}
