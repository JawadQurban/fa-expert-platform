import { Alert, Card } from '@ds/composite';
import { Typography } from '@ds/primitives';
import type { Locale } from '@/types';
import type { WithdrawalContent } from '../withdrawal.content';
import type { EngagementTerminationDto } from '../withdrawal.types';
import styles from './TerminationPanel.module.css';
import { formatDate } from '../../../shared/formatting';

/**
 * Why an engagement ended early, as the trainer reads it.
 *
 * **F3/AC-5 + AC-6** — the three end-states must be distinguishable, and a
 * cancellation must carry its reason into "Past engagements". So this renders
 * off the record's `actor` tag and gives each source its own sentence:
 *
 * - the trainer withdrew (F1)
 * - staff de-linked them, with the reason they chose (F2/AC-4 — ⚠️ the API does
 *   not name the staff member, so neither does this)
 * - the Academy cancelled the plan in full (F3/AC-4 — "clarifying the reason is
 *   the full cancellation of the plan by the Academy", not something the trainer
 *   did or failed to do)
 *
 * ⚠️ FAST's cancellation reasons are **FAST's list** (`PlanCancelReasonId`), not
 * one this project holds — so the code and its text are rendered as given and
 * never translated into an invented label.
 */
export function TerminationSummary({
  termination,
  content,
  locale,
}: {
  readonly termination: EngagementTerminationDto;
  readonly content: WithdrawalContent;
  readonly locale: Locale;
}) {
  const copy = content.outcomes;
  const when = formatDate(new Date(termination.occurredAt), locale, {
    dateStyle: 'medium',
  });

  const headline =
    termination.actor === 'fast'
      ? copy.cancelledByAcademy
      : termination.actor === 'trainer'
        ? copy.withdrawnByTrainer
        : copy.withdrawnByStaff;
  // A reason outside the closed lists is shown as sent, never as blank.
  const reason =
    termination.actor === 'trainer'
      ? (content.withdraw.reasons[termination.reason] ?? termination.reason)
      : termination.actor === 'staff'
        ? (content.delink.reasons[termination.reason] ?? termination.reason)
        : termination.reason;

  return (
    <Card effect="stroke" className={styles.panel}>
      <Alert
        // A cancellation is not the trainer's doing; a withdrawal is a fact.
        tone={termination.actor === 'fast' ? 'warning' : 'info'}
        role="status"
      >
        {headline}
      </Alert>

      <Typography as="p" variant="text-sm">
        <bdi>{`${copy.reasonLabel}: ${reason}`}</bdi>
      </Typography>
      {/* Present when the reason was "Other", or FAST sent free text. */}
      {termination.note != null && (
        <Typography as="p" variant="text-sm">
          <bdi>{termination.note}</bdi>
        </Typography>
      )}
      {termination.fastCancelReasonCode != null && (
        <Typography as="p" variant="text-xs" color="muted">
          {copy.fastReason(termination.fastCancelReasonCode)}
        </Typography>
      )}

      <Typography as="p" variant="text-xs" color="muted">
        {copy.terminatedOn(when)}
      </Typography>
    </Card>
  );
}
