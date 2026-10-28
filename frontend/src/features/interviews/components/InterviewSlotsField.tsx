import { Button, Icon, TextInput, Typography } from '@ds/primitives';
import { MIN_SLOT_LEAD_MINUTES, isSlotTooSoon } from '../interview.types';
import styles from './InterviewSlotsField.module.css';

/**
 * Proposed interview slots — the shared editor for **both** places the platform
 * proposes times: the screening decision (J-05/F5/AC-3, slots sent together with
 * the committee) and a staff-triggered reschedule (J-06/F4/AC-3+AC-4, where new
 * slots restart the same selection flow).
 *
 * Built once here in the interview domain because a "proposed interview slot" is
 * an interview concept that screening borrows, not the other way round. Copy is
 * injected by the caller so each journey keeps its own wording.
 *
 * A slot is a moment, not a day, so the control is a native `datetime-local`
 * input rendered through the approved DS field — not the date-only `DatePicker`.
 */
export interface InterviewSlotsFieldCopy {
  readonly heading: string;
  readonly hint: string;
  readonly slotLabel: (index: number) => string;
  readonly add: string;
  readonly remove: string;
  /** BUG-056 — shown under a slot that starts less than an hour from now. */
  readonly tooSoon: string;
}

/**
 * `datetime-local` speaks LOCAL wall-clock with no offset, which is right for
 * a person typing a time — they mean the time in the room. The floor it is
 * given must be in the same shape: now plus the one-hour lead (BUG-056).
 */
function earliestForInput(): string {
  const earliest = new Date(Date.now() + MIN_SLOT_LEAD_MINUTES * 60_000);
  const local = new Date(earliest.getTime() - earliest.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

/**
 * ⚠️ **The value this control produces is not an instant.** `2020-01-01T09:00`
 * carries no timezone, so sending it as-is made the server store 09:00 UTC for
 * a person who meant 09:00 in Riyadh — and the applicant was then shown 12:00
 * (`D-03`). Convert before sending: `new Date(local)` parses as local time, so
 * `toISOString()` is the instant that person actually meant.
 */
export function slotInputToInstant(localValue: string): string {
  const parsed = new Date(localValue);
  return Number.isNaN(parsed.getTime()) ? localValue : parsed.toISOString();
}

export function InterviewSlotsField({
  slots,
  copy,
  idPrefix,
  onChange,
}: {
  readonly slots: readonly string[];
  readonly copy: InterviewSlotsFieldCopy;
  /** Distinguishes multiple instances on one page (e.g. one per service). */
  readonly idPrefix: string;
  readonly onChange: (slots: readonly string[]) => void;
}) {
  const updateSlot = (index: number, value: string) => {
    onChange(slots.map((slot, slotIndex) => (slotIndex === index ? value : slot)));
  };

  return (
    <div className={styles.wrapper}>
      <Typography as="h4" variant="text-md" weight="bold">
        {copy.heading}
      </Typography>
      <Typography as="p" variant="text-sm" color="muted">
        {copy.hint}
      </Typography>

      {slots.map((slot, index) => (
        <div key={`${idPrefix}-slot-${index}`} className={styles.row}>
          <TextInput
            type="datetime-local"
            // D-04 + BUG-056 — no slot in the past, nor inside the next hour.
            // The picker's floor and the message below are conveniences; the
            // server refuses it too (`slot-too-soon`), because that is the rule.
            min={earliestForInput()}
            label={copy.slotLabel(index + 1)}
            value={slot}
            errorText={isSlotTooSoon(slot) ? copy.tooSoon : undefined}
            onChange={(event) => updateSlot(index, event.target.value)}
            fieldClassName={styles.field}
          />
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => onChange(slots.filter((_slot, slotIndex) => slotIndex !== index))}
          >
            {copy.remove}
          </Button>
        </div>
      ))}

      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChange([...slots, ''])}
        iconStart={<Icon name="add-circle" size="sm" decorative />}
      >
        {copy.add}
      </Button>
    </div>
  );
}
