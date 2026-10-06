import { useState } from 'react';
import { Alert, Modal } from '@ds/composite';
import { Button, Textarea, Typography } from '@ds/primitives';
import type { InterviewsContent } from '../interviews.content';
import { validateReschedule } from '../interview.types';
import type { RescheduleInput } from '../interview.types';
import { InterviewSlotsField } from './InterviewSlotsField';
import styles from './RescheduleDialog.module.css';

/**
 * J-06/F4/AC-3+AC-4 — the **staff-side** reschedule. Either party can trigger a
 * reschedule; this is the Internal Dashboard half. New slots are proposed and
 * the applicant's selection-and-confirmation flow (F1) repeats from the start.
 *
 * The dialog states AC-6 explicitly — the same interview ticket number is kept,
 * a reschedule never issues a new one — because that is exactly the assumption
 * staff would otherwise have to guess at.
 *
 * Reuses the shared `InterviewSlotsField` so proposed slots are entered
 * identically here and at screening (J-05/F5).
 */
export function RescheduleDialog({
  open,
  content,
  submitting,
  onClose,
  onSubmit,
}: {
  readonly open: boolean;
  readonly content: InterviewsContent;
  readonly submitting: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (input: RescheduleInput) => void;
}) {
  const copy = content.rescheduleDialog;
  const [slots, setSlots] = useState<readonly string[]>(['']);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    const input: RescheduleInput = {
      slots: slots.filter((slot) => slot.trim() !== ''),
      note,
    };
    if (!validateReschedule(input)) {
      setError(copy.slotRequired);
      return;
    }
    setError(null);
    onSubmit(input);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={copy.title}
      dismissLabel={copy.cancel}
      footer={
        <>
          <Button variant="primary" size="md" onClick={handleConfirm} disabled={submitting}>
            {copy.confirm}
          </Button>
          <Button variant="tertiary" size="md" onClick={onClose}>
            {copy.cancel}
          </Button>
        </>
      }
    >
      <Typography as="p" variant="text-md">
        {copy.body}
      </Typography>

      <div className={styles.field}>
        <InterviewSlotsField
          slots={slots}
          idPrefix="reschedule"
          copy={{
            heading: copy.slotsHeading,
            hint: copy.slotsHint,
            slotLabel: copy.slotLabel,
            add: copy.addSlot,
            remove: copy.removeSlot,
          }}
          onChange={(next) => {
            setSlots(next);
            setError(null);
          }}
        />
      </div>

      <div className={styles.field}>
        <Textarea
          label={copy.noteLabel}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
        />
      </div>

      {error != null && (
        <div className={styles.field}>
          <Alert tone="error" role="alert">
            {error}
          </Alert>
        </div>
      )}

      {/* AC-6 — the ticket number survives the reschedule. */}
      <Typography as="p" variant="text-sm" color="muted" className={styles.note}>
        {copy.ticketRetained}
      </Typography>
    </Modal>
  );
}
