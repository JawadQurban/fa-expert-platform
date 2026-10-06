import { useState } from 'react';
import { Alert, ItemIcon, Modal } from '@ds/composite';
import { Button, Icon, Radio, RadioGroup, Textarea, Typography } from '@ds/primitives';
import { SlaBadge } from '../../../shared/components/SlaBadge';
import type { ApplicantInterviewDto } from '../applicationDetail.types';
import type { ApplicationDetailContent } from '../applicationDetail.content';
import styles from './InterviewPanel.module.css';

/**
 * J-06 — the applicant's half of interview scheduling, in one panel because the
 * journey treats it as one decision with two answers: *this time works* or
 * *propose me another*.
 *
 * Three states, all from the journey:
 *
 * - **Slots proposed** (F1) — choose one, against a 3-business-day clock
 *   (AC-4, P-J4). The reschedule request sits beside the confirm button rather
 *   than behind it, because **F4/AC-1 makes it an alternative to selecting**,
 *   not a fallback after failing to select. Before this panel existed the page
 *   offered only "confirm a slot", which left an applicant no proposed time
 *   suits with no way forward at all.
 * - **Slot confirmed** (F1/AC-5, F2) — the time, the interview number, and the
 *   meeting link, *plus* the reschedule request again: **F4/AC-2** keeps it
 *   available after confirming, for the thing that comes up later.
 * - **Reschedule pending** (F4/AC-4) — waiting for new slots. The old proposals
 *   are gone rather than shown-but-dead, since they are no longer choosable.
 *
 * The reason note is **optional**: J-06/F4 asks for none, and requiring one
 * would invent a rule (P-50). It is offered because it lets the applicant say
 * *when* they are free, which is what makes the next proposal land.
 *
 * F1/AC-2 — the action lives here, in the portal. The email is a notification
 * channel only, never the place the applicant acts.
 */
export function InterviewPanel({
  interview,
  content,
  busy,
  formatSlot,
  onSelectSlot,
  onRequestReschedule,
}: {
  readonly interview: ApplicantInterviewDto;
  readonly content: ApplicationDetailContent;
  readonly busy: boolean;
  readonly formatSlot: (iso: string) => string;
  readonly onSelectSlot: (slotId: string) => void;
  readonly onRequestReschedule: (note: string) => void;
}) {
  const copy = content.interview;
  const [selectedSlot, setSelectedSlot] = useState('');
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [note, setNote] = useState('');

  const confirmedSlot =
    interview.selectedSlotId == null
      ? null
      : (interview.proposedSlots.find((slot) => slot.id === interview.selectedSlotId) ?? null);
  const awaitingSelection = interview.selectedSlotId == null && interview.proposedSlots.length > 0;
  const sla = interview.selectionSla;

  return (
    <section className={styles.panel} aria-labelledby="eh-action-heading">
      <div className={styles.head}>
        <ItemIcon contained icon={<Icon name="co-present" size="md" tone="primary" decorative />} />
        <Typography as="h2" id="eh-action-heading" variant="text-lg" weight="bold" tabIndex={-1}>
          {interview.selectedSlotId != null ? copy.confirmedHeading : copy.heading}
        </Typography>
      </div>

      {/* F4/AC-4 — a request is in flight; there is nothing to choose yet. */}
      {interview.pendingReschedule != null && (
        <Alert tone="info" surface="tinted" role="note" title={copy.reschedule.pendingTitle}>
          {copy.reschedule.pendingBody}
          {interview.pendingReschedule.note != null && (
            <>
              <Typography as="p" variant="text-sm" weight="bold">
                {copy.reschedule.yourNoteLabel}
              </Typography>
              <bdi>{interview.pendingReschedule.note}</bdi>
            </>
          )}
        </Alert>
      )}

      {/* F1 — choose a proposed time, against the AC-4 clock. */}
      {awaitingSelection && (
        <>
          {sla != null && (
            <div className={styles.slaRow}>
              <SlaBadge state={sla.state} label={copy.sla.labels[sla.state]} />
              <Typography as="span" variant="text-sm" color="muted">
                {sla.state === 'breached'
                  ? copy.sla.overdue(Math.abs(sla.daysRemaining))
                  : copy.sla.remaining(Math.max(sla.daysRemaining, 0))}
              </Typography>
            </div>
          )}
          <Typography as="p" variant="text-md" color="muted">
            {copy.slotHint}
          </Typography>
          <RadioGroup legend={copy.slotLegend} value={selectedSlot} onValueChange={setSelectedSlot}>
            {interview.proposedSlots.map((slot) => (
              <Radio key={slot.id} value={slot.id} label={formatSlot(slot.startsAt)} />
            ))}
          </RadioGroup>
          <div>
            <Button
              variant="primary"
              size="md"
              disabled={selectedSlot === '' || busy}
              onClick={() => onSelectSlot(selectedSlot)}
            >
              {copy.selectSlot}
            </Button>
          </div>
        </>
      )}

      {/* F1/AC-5 + F2 — the confirmed time, its ticket, and the meeting link. */}
      {confirmedSlot != null && (
        <Typography as="p" variant="text-md">
          {copy.confirmedAt(formatSlot(confirmedSlot.startsAt))}
        </Typography>
      )}

      {/* F2/AC-3 — survives reschedules (F4/AC-6), so it is shown independently
          of whether a slot is currently confirmed. */}
      {interview.ticketNumber != null && (
        <div className={styles.ticketRow}>
          <Typography as="span" variant="text-sm" color="muted">
            {copy.ticketLabel}
          </Typography>
          <span className={styles.ticket}>
            <bdi>{interview.ticketNumber}</bdi>
          </span>
        </div>
      )}

      {confirmedSlot != null &&
        (interview.meetingUrl != null ? (
          <div>
            <Button
              variant="secondary"
              size="md"
              href={interview.meetingUrl}
              iconStart={<Icon name="co-present" size="sm" decorative />}
            >
              {copy.joinMeeting}
            </Button>
          </div>
        ) : (
          /* Teams is absent from the `CAP-12` integration table — no fake link. */
          <Typography as="p" variant="text-sm" color="muted">
            {copy.meetingPending}
          </Typography>
        ))}

      {/* F4/AC-1 (instead of selecting) and F4/AC-2 (after confirming). */}
      {interview.canRequestReschedule && (
        <div className={styles.rescheduleBlock}>
          <Typography as="p" variant="text-sm" color="muted">
            {confirmedSlot != null
              ? copy.reschedule.afterConfirming
              : copy.reschedule.beforeSelecting}
          </Typography>
          <Button
            variant="tertiary"
            size="md"
            disabled={busy}
            onClick={() => setRescheduleOpen(true)}
          >
            {copy.reschedule.action}
          </Button>
        </div>
      )}

      <Modal
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        title={copy.reschedule.dialogTitle}
        dismissLabel={copy.reschedule.dismiss}
        footer={
          <div className={styles.dialogActions}>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setRescheduleOpen(false);
                onRequestReschedule(note);
              }}
            >
              {copy.reschedule.confirm}
            </Button>
            <Button variant="tertiary" size="md" onClick={() => setRescheduleOpen(false)}>
              {copy.reschedule.cancel}
            </Button>
          </div>
        }
      >
        <Typography as="p" variant="text-md">
          {copy.reschedule.dialogBody}
        </Typography>
        <div className={styles.dialogField}>
          <Textarea
            label={copy.reschedule.noteLabel}
            helperText={copy.reschedule.noteHint}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </section>
  );
}
