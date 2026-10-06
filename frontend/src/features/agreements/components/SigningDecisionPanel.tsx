import { useState } from 'react';
import { Alert, Modal } from '@ds/composite';
import { Button, Textarea, Typography } from '@ds/primitives';
import { ESignatureField } from '../../../shared/components/ESignatureField';
import type { AgreementsContent } from '../agreements.content';
import { validateSigningDecision } from '../agreement.types';
import type { SigningDecisionInput } from '../agreement.types';
import { Panel } from '../../../shared/workspace/Panel';
import styles from './SigningDecisionPanel.module.css';

/**
 * J-10/F3 + F4 — the current person's action on the agreement.
 *
 * Two journey rules shape this panel:
 *
 * - **The available actions depend on designation** (F3/AC-3 vs AC-4). A
 *   reviewer gets *approve*; a designated signer gets *e-sign and approve*. The
 *   signer's button is not merely relabelled — it opens a dialog that captures
 *   the signature, because signing is a distinct act with a distinct record.
 * - **There is no reject** (F3/AC-6). Rather than silently omitting it, the
 *   panel says why: eligibility was settled at the approval committee, so the
 *   only alternative to approving is asking for a change. A missing button with
 *   no explanation reads as a bug.
 */
export function SigningDecisionPanel({
  isSigner,
  content,
  submitting,
  onSubmit,
}: {
  readonly isSigner: boolean;
  readonly content: AgreementsContent;
  readonly submitting: boolean;
  readonly onSubmit: (input: SigningDecisionInput) => void;
}) {
  const copy = content.decision;
  const [note, setNote] = useState('');
  const [approveOpen, setApproveOpen] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [modificationOpen, setModificationOpen] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [modificationNote, setModificationNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const confirmSign = () => {
    const input: SigningDecisionInput = {
      kind: 'sign-and-approve',
      signatureName,
      note,
    };
    const issues = validateSigningDecision(input);
    if (issues.length > 0) {
      setError(copy.errors[issues[0]]);
      return;
    }
    setError(null);
    setSignOpen(false);
    onSubmit(input);
  };

  const confirmModification = () => {
    const input: SigningDecisionInput = {
      kind: 'request-modification',
      note: modificationNote,
    };
    const issues = validateSigningDecision(input);
    if (issues.length > 0) {
      setError(copy.errors[issues[0]]);
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
      titleId="eh-agreement-decision"
      description={isSigner ? copy.signerDescription : copy.reviewerDescription}
    >
      <Textarea
        label={copy.noteLabel}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={3}
      />

      <div className={styles.actions}>
        {isSigner ? (
          <Button
            variant="primary"
            size="md"
            onClick={() => setSignOpen(true)}
            disabled={submitting}
          >
            {copy.signAndApprove}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={() => setApproveOpen(true)}
            disabled={submitting}
          >
            {copy.approve}
          </Button>
        )}
        <Button
          variant="secondary"
          size="md"
          onClick={() => setModificationOpen(true)}
          disabled={submitting}
        >
          {copy.requestModification}
        </Button>
      </div>

      {/* F3/AC-6 — the absence of "reject" is explained, not left as a gap. */}
      <Alert tone="info" surface="tinted" role="status">
        {copy.noRejectNote}
      </Alert>

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
          {content.approveDialog.body}
        </Typography>
      </Modal>

      <Modal
        open={signOpen}
        onClose={() => setSignOpen(false)}
        title={content.signDialog.title}
        dismissLabel={content.signDialog.cancel}
        footer={
          <>
            <Button variant="primary" size="md" onClick={confirmSign}>
              {content.signDialog.confirm}
            </Button>
            <Button variant="tertiary" size="md" onClick={() => setSignOpen(false)}>
              {content.signDialog.cancel}
            </Button>
          </>
        }
      >
        <Typography as="p" variant="text-md">
          {content.signDialog.body}
        </Typography>
        <div className={styles.dialogField}>
          {/* P-J10 — the shared mechanism J-11/F1/AC-3 requires the applicant to reuse. */}
          <ESignatureField
            value={signatureName}
            copy={{
              label: content.signDialog.signatureLabel,
              hint: content.signDialog.signatureHint,
            }}
            error={error}
            onChange={(next) => {
              setSignatureName(next);
              setError(null);
            }}
          />
        </div>
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
