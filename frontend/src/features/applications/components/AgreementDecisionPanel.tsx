import { useState } from 'react';
import { Alert, ItemIcon, Modal } from '@ds/composite';
import { Button, Checkbox, Icon, Textarea, Typography } from '@ds/primitives';
import { ESignatureField } from '../../../shared/components/ESignatureField';
import { validateApplicantAgreementDecision } from '../applicationDetail.types';
import type { ApplicantAgreementDecisionInput } from '../applicationDetail.types';
import type { ApplicationDetailContent } from '../applicationDetail.content';
import styles from './AgreementDecisionPanel.module.css';

/**
 * J-11/F1 — the applicant's decision on the fully internally-signed agreement.
 * **Three** decisions, not one:
 *
 * - **E-sign** (AC-3) — captured *inside the platform* with the shared P-J10
 *   mechanism, the same one J-10's internal signers use. Signing activates the
 *   agreement and moves the application to Approved.
 * - **Reject** (AC-4) — **permanently** closes the application. The journey
 *   states the permanence, so the dialog states it too: a warning, an explicit
 *   acknowledgement the applicant must tick, and a confirm button that names
 *   what it does. An irreversible act behind a single unqualified button would
 *   be the defect.
 * - **Request a modification** (AC-5) — the note returns to the person who
 *   prepared the agreement in J-10, so it is mandatory; a request with nothing
 *   to act on stalls the chain at someone who cannot tell what to change.
 *
 * The reason for rejecting is *optional*: J-11 does not ask for one, and
 * requiring it would be an invented rule. The permanence acknowledgement is not
 * a substitute reason — it is the journey's own AC-4 made visible.
 *
 * This panel collects input and emits a decision; the page owns the service call
 * and the resulting messaging (`§0.5`).
 */
export function AgreementDecisionPanel({
  content,
  busy,
  onDecide,
}: {
  readonly content: ApplicationDetailContent;
  readonly busy: boolean;
  readonly onDecide: (input: ApplicantAgreementDecisionInput) => void;
}) {
  const copy = content.agreementDecision;

  const [signOpen, setSignOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [modificationOpen, setModificationOpen] = useState(false);

  const [signatureName, setSignatureName] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [modificationNote, setModificationNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (input: ApplicantAgreementDecisionInput, close: () => void) => {
    const issues = validateApplicantAgreementDecision(input);
    if (issues.length > 0) {
      setError(copy.errors[issues[0]]);
      return;
    }
    setError(null);
    close();
    onDecide(input);
  };

  return (
    <section className={styles.panel} aria-labelledby="eh-action-heading">
      <div className={styles.head}>
        <ItemIcon
          contained
          icon={<Icon name="task-done-01" size="md" tone="primary" decorative />}
        />
        <Typography as="h2" id="eh-action-heading" variant="text-lg" weight="bold" tabIndex={-1}>
          {copy.heading}
        </Typography>
      </div>

      <Typography as="p" variant="text-md" color="muted">
        {copy.description}
      </Typography>

      <div className={styles.actions}>
        <Button variant="primary" size="md" disabled={busy} onClick={() => setSignOpen(true)}>
          {copy.sign}
        </Button>
        <Button
          variant="secondary"
          size="md"
          disabled={busy}
          onClick={() => setModificationOpen(true)}
        >
          {copy.requestModification}
        </Button>
        <Button variant="tertiary" size="md" disabled={busy} onClick={() => setRejectOpen(true)}>
          {copy.reject}
        </Button>
      </div>

      {/* AC-3 — e-sign in-platform (P-J10). */}
      <Modal
        open={signOpen}
        onClose={() => setSignOpen(false)}
        title={copy.signDialog.title}
        dismissLabel={copy.signDialog.dismiss}
        footer={
          <div className={styles.dialogActions}>
            <Button
              variant="primary"
              size="md"
              onClick={() => submit({ kind: 'sign', signatureName }, () => setSignOpen(false))}
            >
              {copy.signDialog.confirm}
            </Button>
            <Button variant="tertiary" size="md" onClick={() => setSignOpen(false)}>
              {copy.signDialog.cancel}
            </Button>
          </div>
        }
      >
        <Typography as="p" variant="text-md">
          {copy.signDialog.body}
        </Typography>
        <div className={styles.dialogField}>
          <ESignatureField
            value={signatureName}
            copy={{
              label: copy.signDialog.signatureLabel,
              hint: copy.signDialog.signatureHint,
            }}
            error={error}
            onChange={(next) => {
              setSignatureName(next);
              setError(null);
            }}
          />
        </div>
      </Modal>

      {/* AC-4 — permanent closure, stated before it happens. */}
      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={copy.rejectDialog.title}
        dismissLabel={copy.rejectDialog.dismiss}
        footer={
          <div className={styles.dialogActions}>
            <Button
              variant="primary"
              size="md"
              disabled={!acknowledged}
              onClick={() =>
                submit({ kind: 'reject', note: rejectNote }, () => setRejectOpen(false))
              }
            >
              {copy.rejectDialog.confirm}
            </Button>
            <Button variant="tertiary" size="md" onClick={() => setRejectOpen(false)}>
              {copy.rejectDialog.cancel}
            </Button>
          </div>
        }
      >
        <Alert tone="warning" role="note">
          {copy.rejectDialog.warning}
        </Alert>
        <Typography as="p" variant="text-md">
          {copy.rejectDialog.body}
        </Typography>
        <div className={styles.dialogField}>
          <Textarea
            label={copy.rejectDialog.noteLabel}
            helperText={copy.rejectDialog.noteHint}
            value={rejectNote}
            onChange={(event) => setRejectNote(event.target.value)}
            rows={3}
          />
        </div>
        <div className={styles.dialogField}>
          <Checkbox
            label={copy.rejectDialog.acknowledgeLabel}
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
          />
        </div>
      </Modal>

      {/* AC-5 — the note returns to the J-10 creator, so it is mandatory. */}
      <Modal
        open={modificationOpen}
        onClose={() => setModificationOpen(false)}
        title={copy.modificationDialog.title}
        dismissLabel={copy.modificationDialog.dismiss}
        footer={
          <div className={styles.dialogActions}>
            <Button
              variant="primary"
              size="md"
              onClick={() =>
                submit({ kind: 'request-modification', note: modificationNote }, () =>
                  setModificationOpen(false)
                )
              }
            >
              {copy.modificationDialog.confirm}
            </Button>
            <Button variant="tertiary" size="md" onClick={() => setModificationOpen(false)}>
              {copy.modificationDialog.cancel}
            </Button>
          </div>
        }
      >
        <Typography as="p" variant="text-md">
          {copy.modificationDialog.body}
        </Typography>
        <div className={styles.dialogField}>
          <Textarea
            label={copy.modificationDialog.noteLabel}
            helperText={copy.modificationDialog.noteHint}
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
    </section>
  );
}
