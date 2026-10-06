import { useState } from 'react';
import { Alert, Modal } from '@ds/composite';
import { Button, Select, Textarea, Typography } from '@ds/primitives';
import type { SelectOption } from '@ds/primitives';
import { REJECTION_REASONS } from '../../screening/screening.types';
import type { RejectionReasonId } from '../../screening/screening.types';
import type { CommitteeContent } from '../committee.content';
import { validateMemberDecision } from '../committee.types';
import type { ApproverObligation, MemberDecisionInput } from '../committee.types';
import { Panel } from '../../../shared/workspace/Panel';
import styles from './MemberDecisionPanel.module.css';

/**
 * J-09/F4 + F7 + F8 — the current member's decision: approve, reject, or request
 * a modification.
 *
 * The rejection dialog's warning is **obligation-dependent**, which is the whole
 * of `BR-0211` (revised) expressed at the moment it matters: a mandatory member
 * is told their rejection halts the application finally; an optional member is
 * told theirs is logged as a note and the sequence continues. Presenting one
 * generic "are you sure" would hide the single most consequential difference in
 * this journey.
 *
 * The approve dialog likewise distinguishes "advances to the next member" from
 * "you are the last mandatory approver, so this finalizes the accreditation and
 * triggers the applicant's bank-data request" (F4/AC-5 + F6).
 *
 * A modification note is mandatory (`BR-0217`) and gated by
 * `validateMemberDecision`.
 */
export function MemberDecisionPanel({
  obligation,
  isLastMandatory,
  content,
  submitting,
  onSubmit,
}: {
  readonly obligation: ApproverObligation;
  /** Drives the approve dialog's wording (F4/AC-5 + F6). */
  readonly isLastMandatory: boolean;
  readonly content: CommitteeContent;
  readonly submitting: boolean;
  readonly onSubmit: (input: MemberDecisionInput) => void;
}) {
  const copy = content.decision;
  const [note, setNote] = useState('');
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [modificationOpen, setModificationOpen] = useState(false);
  const [reason, setReason] = useState<RejectionReasonId | ''>('');
  const [reasonOther, setReasonOther] = useState('');
  const [modificationNote, setModificationNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reasonOptions: SelectOption[] = REJECTION_REASONS.map((id) => ({
    value: id,
    label: content.rejectionReasons[id],
  }));

  const confirmReject = () => {
    if (reason === '') {
      setError(content.rejectDialog.reasonRequired);
      return;
    }
    const input: MemberDecisionInput = { kind: 'reject', reason, reasonOther, note };
    if (validateMemberDecision(input).length > 0) {
      setError(content.rejectDialog.otherRequired);
      return;
    }
    setError(null);
    setRejectOpen(false);
    onSubmit(input);
  };

  const confirmModification = () => {
    const input: MemberDecisionInput = {
      kind: 'request-modification',
      note: modificationNote,
    };
    if (validateMemberDecision(input).length > 0) {
      setError(content.modificationDialog.noteRequired);
      return;
    }
    setError(null);
    setModificationOpen(false);
    onSubmit(input);
  };

  return (
    <Panel
      shape="inline"
      title={copy.heading}
      titleId="eh-committee-decision"
      description={copy.description}
    >
      <Textarea
        label={copy.noteLabel}
        helperText={copy.noteHint}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={3}
      />

      <div className={styles.actions}>
        <Button
          variant="primary"
          size="md"
          onClick={() => setApproveOpen(true)}
          disabled={submitting}
        >
          {copy.approve}
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={() => setRejectOpen(true)}
          disabled={submitting}
        >
          {copy.reject}
        </Button>
        <Button
          variant="tertiary"
          size="md"
          onClick={() => setModificationOpen(true)}
          disabled={submitting}
        >
          {copy.requestModification}
        </Button>
      </div>

      <Modal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title={content.approveDialog.title}
        dismissLabel={content.approveDialog.cancel}
        footer={
          <>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setApproveOpen(false);
                onSubmit({ kind: 'approve', note });
              }}
            >
              {content.approveDialog.confirm}
            </Button>
            <Button variant="tertiary" size="md" onClick={() => setApproveOpen(false)}>
              {content.approveDialog.cancel}
            </Button>
          </>
        }
      >
        <Typography as="p" variant="text-md">
          {isLastMandatory ? content.approveDialog.bodyFinal : content.approveDialog.bodyAdvances}
        </Typography>
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
        {/* `BR-0210` vs `BR-0211` — the consequence differs entirely by obligation. */}
        <Alert tone={obligation === 'mandatory' ? 'error' : 'info'} role="alert">
          {obligation === 'mandatory'
            ? content.rejectDialog.mandatoryWarning
            : content.rejectDialog.optionalWarning}
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

      <Modal
        open={modificationOpen}
        onClose={() => setModificationOpen(false)}
        title={content.modificationDialog.title}
        dismissLabel={content.modificationDialog.cancel}
        footer={
          <>
            <Button variant="primary" size="md" onClick={confirmModification}>
              {content.modificationDialog.confirm}
            </Button>
            <Button variant="tertiary" size="md" onClick={() => setModificationOpen(false)}>
              {content.modificationDialog.cancel}
            </Button>
          </>
        }
      >
        <Typography as="p" variant="text-md">
          {content.modificationDialog.body}
        </Typography>
        <div className={styles.dialogField}>
          <Textarea
            label={content.modificationDialog.noteLabel}
            value={modificationNote}
            onChange={(event) => {
              setModificationNote(event.target.value);
              setError(null);
            }}
            requiredField
            rows={4}
            errorText={error ?? undefined}
          />
        </div>
      </Modal>
    </Panel>
  );
}
