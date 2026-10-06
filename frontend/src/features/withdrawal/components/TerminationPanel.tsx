import { useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Card } from '@ds/composite';
import { Button, Radio, RadioGroup, Textarea, Typography } from '@ds/primitives';
import { validateTermination, type TerminationValidationCode } from '../withdrawal.types';
import styles from './TerminationPanel.module.css';

/**
 * The reason-and-confirm panel behind **both** of J-22's human paths: the
 * trainer's withdrawal (F1) and staff's de-linking (F2).
 *
 * The two share this component because the *act* is identical — pick from a
 * short closed list, explain if you picked "Other", confirm something
 * irreversible. They do **not** share a reason list: `reasons` is injected, and
 * the two call sites pass their own closed union (F1/AC-2 vs F2/AC-2), so
 * nothing here can offer a trainer "Administrative Decision".
 *
 * "Other" is the only branch that reveals the note field, and the note is
 * **required** when it does — an "Other" with nothing after it explains nothing,
 * and both ACs describe the option as *Other (free text)*.
 */
export function TerminationPanel({
  heading,
  intro,
  before,
  reasonLegend,
  reasons,
  otherValue,
  noteLabel,
  noteHint,
  warning,
  confirmLabel,
  cancelLabel,
  errors,
  busy,
  onConfirm,
  onCancel,
}: {
  readonly heading: string;
  readonly intro: string;
  /** An extra statement shown before the choices (F2/AC-3's "not a FAST cancellation"). */
  readonly before?: ReactNode;
  readonly reasonLegend: string;
  /** The call site's own closed list — never a shared one. */
  readonly reasons: ReadonlyArray<{ readonly value: string; readonly label: string }>;
  readonly otherValue: string;
  readonly noteLabel: string;
  readonly noteHint: string;
  /** Only the trainer's path states the consequence; staff have their own line. */
  readonly warning?: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly errors: Readonly<Record<TerminationValidationCode, string>>;
  readonly busy: boolean;
  readonly onConfirm: (reason: string, note: string) => void;
  readonly onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [issues, setIssues] = useState<readonly TerminationValidationCode[]>([]);

  const confirm = () => {
    // The same validator the server runs, so the two cannot disagree about
    // whether an empty "Other" counts as a reason.
    const found =
      reason === ''
        ? validateTermination(null)
        : reason === otherValue
          ? validateTermination({ reason: 'other', note })
          : [];
    setIssues(found);
    if (found.length > 0) {
      return;
    }
    onConfirm(reason, note);
  };

  return (
    <Card effect="stroke" className={styles.panel}>
      <Typography as="h2" variant="text-lg" weight="bold">
        {heading}
      </Typography>
      <Typography as="p" variant="text-sm" color="muted">
        {intro}
      </Typography>
      {before}

      <RadioGroup
        legend={reasonLegend}
        value={reason}
        onValueChange={(value) => {
          setReason(value);
          setIssues([]);
        }}
        errorText={issues.includes('reason-required') ? errors['reason-required'] : undefined}
      >
        {reasons.map((option) => (
          <Radio key={option.value} value={option.value} label={option.label} />
        ))}
      </RadioGroup>

      {/* "Other (free text)" — the text is what makes it a reason. */}
      {reason === otherValue && (
        <Textarea
          label={noteLabel}
          helperText={noteHint}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          errorText={issues.includes('note-required') ? errors['note-required'] : undefined}
          requiredField
          rows={3}
        />
      )}

      {warning != null && (
        <Alert tone="warning" role="note">
          {warning}
        </Alert>
      )}

      <div className={styles.actions}>
        <Button variant="primary" size="md" disabled={busy} onClick={confirm}>
          {confirmLabel}
        </Button>
        <Button variant="tertiary" size="md" onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </Card>
  );
}
