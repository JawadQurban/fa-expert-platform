/**
 * **P-J4 — SLA countdown**, and the central matrix that configures it.
 *
 * Shared because the journeys attach a deadline to almost every hand-off, always
 * with the same three-state shape and always server-computed:
 *
 * - J-05/F1/AC-1 + F2/AC-6 — screening decision (⚠️ **duration undefined**)
 * - **J-06/F1/AC-4** — the applicant selects an interview slot (3 business days)
 * - J-18/F2 — assignment offer response (3 days) · J-12/F1 — agreement expiry
 *
 * **The state is decided by the server, never derived in the UI.** Business days
 * depend on the Academy calendar (weekends, public holidays), which the frontend
 * does not have and must not approximate — a countdown that quietly disagrees
 * with the server about whether a deadline passed is worse than no countdown.
 * `daysRemaining` is therefore a value to render, not an input to a calculation.
 *
 * ---
 *
 * **The matrix lives here, not in CAP-07.** `BR-0705` puts every deadline under
 * one screen, and §8.7.2 says «مهما كانت القدرة المصدر للحدث» — whatever
 * capability raised it. CAP-07 owns the *screen*; the **vocabulary** is shared,
 * because four features consume a deadline and only one configures it. A feature
 * importing its deadline from another feature's module would have made CAP-07 a
 * dependency of half the product.
 */

/* ------------------------------------------------------------------ *
 * The instance — one live countdown on one record
 * ------------------------------------------------------------------ */

export type SlaState = 'within' | 'approaching' | 'breached';

export interface SlaDto {
  /**
   * The central matrix row this countdown instantiates (`SLA_INSTANCE.sla_id`,
   * `10` §3.9). **Every countdown names its configuration**, so a deadline can
   * be traced to the console row that set it — and so an orphan countdown,
   * configured nowhere, fails a test rather than shipping.
   */
  readonly slaId: string;
  readonly state: SlaState;
  /** ISO timestamp the action is due by. */
  readonly dueAt: string;
  /** Whole days left; **negative** once breached (elapsed overdue). */
  readonly daysRemaining: number;
}

/* ------------------------------------------------------------------ *
 * The matrix — what CAP-07's console configures (BRD §8.7.3 / F-0704)
 * ------------------------------------------------------------------ */

export const SLA_UNITS = ['days', 'business-days'] as const;

export type SlaUnit = (typeof SLA_UNITS)[number];

interface SlaFields {
  readonly slaId: string;
  /**
   * `null` where the BRD names **no capability** for the area — J-20's material
   * and content review is the one such case, and `14_INTERNAL_DASHBOARD_BRD_REVIEW`
   * §1 records it as `—` for the same reason. The screen shows the gap rather
   * than filing the row under a capability nobody assigned it to.
   */
  readonly capabilityCode: string | null;
  readonly actionCode: string;
  readonly nameAr: string;
  readonly nameEn: string;
  /** Where the deadline is stated — or where it is stated to be *missing*. */
  readonly source: string;
  /** What happens when it runs out, in the source's own terms. */
  readonly onBreachAr: string;
  readonly onBreachEn: string;
}

/**
 * A deadline is **fixed**, **record-derived**, or **undefined**, and an
 * undefined one cannot produce a countdown because it has no duration to count.
 *
 * Three are known **because journeys state them**: J-06/F1/AC-4 (3 business days
 * to pick an interview slot), J-18/F2/AC-1 (3 days to answer an offer) and
 * J-12/F1/AC-2–4 (90/30/5-day agreement expiry reminders, `BR-0303` extended).
 * Those are approved requirements the product already runs, so shipping them
 * blank would have discarded approved rules.
 *
 * The rest are **named by a journey that explicitly leaves the number open** —
 * J-05's insight page shows "remaining SLA time" without a duration, J-11's open
 * item defers its no-response SLA "for later cleanup when building the full SLA
 * matrix", J-20's open item 1 says both paths' SLA is "not currently defined".
 * They appear as rows with no duration, which is `DM-GAP-10` made visible
 * rather than described.
 */
export type SlaMatrixRowDto =
  | (SlaFields & {
      readonly status: 'fixed';
      readonly duration: number;
      readonly unit: SlaUnit;
      /** Days before the deadline at which a reminder fires (`BR-0705`). */
      readonly reminderOffsets: readonly number[];
    })
  /**
   * The deadline lives **on the record**, and only the reminders are configured
   * centrally. J-12 is the case: an agreement's expiry follows its own term
   * (1 or 3 years, `BR-0302`), and what §8.7 centralises is the 90/30/5-day
   * reminder schedule. A fixed duration here would have been an invented number.
   */
  | (SlaFields & { readonly status: 'record-derived'; readonly reminderOffsets: readonly number[] })
  | (SlaFields & { readonly status: 'undefined-duration' });

export type SlaInput =
  | {
      readonly kind: 'fixed';
      readonly duration: number;
      readonly unit: SlaUnit;
      readonly reminderOffsets: readonly number[];
    }
  | { readonly kind: 'reminders-only'; readonly reminderOffsets: readonly number[] };

export type SlaValidationCode =
  'duration-positive' | 'reminder-positive' | 'reminder-within-duration';

export function validateSla(input: SlaInput): readonly SlaValidationCode[] {
  const issues: SlaValidationCode[] = [];
  if (input.kind === 'fixed' && (!Number.isInteger(input.duration) || input.duration <= 0)) {
    issues.push('duration-positive');
  }
  if (input.reminderOffsets.some((offset) => !Number.isInteger(offset) || offset <= 0)) {
    issues.push('reminder-positive');
  }
  // A reminder at or beyond the deadline is not a reminder. Only checkable
  // against a fixed duration — a record-derived deadline has none here.
  if (input.kind === 'fixed' && input.reminderOffsets.some((offset) => offset >= input.duration)) {
    issues.push('reminder-within-duration');
  }
  return issues;
}

/* ------------------------------------------------------------------ *
 * Reminder milestones — J-12's 90/30/5, expressed as configuration
 * ------------------------------------------------------------------ */

/**
 * Which reminder, if any, a record has reached.
 *
 * **Carries the number rather than naming it.** `BR-0705` makes the reminder
 * schedule configuration, so a union of `'90-days' | '30-days' | '5-days'`
 * would have hard-coded in the type the very values the console exists to
 * change. J-12's copy still reads «تنتهي خلال ٩٠ يومًا» — it formats the number
 * it is given.
 */
export type ReminderMilestone =
  | { readonly kind: 'none' }
  | { readonly kind: 'reminder'; readonly daysBefore: number }
  | { readonly kind: 'expired' };

/**
 * The nearest reminder offset a record has passed, from the **central** offsets.
 *
 * Sorted ascending so the *tightest* reminder wins: at 4 days remaining with
 * offsets 90/30/5, the answer is 5, not 90.
 */
export function reminderMilestoneFor(
  daysRemaining: number,
  offsets: readonly number[]
): ReminderMilestone {
  if (daysRemaining < 0) {
    return { kind: 'expired' };
  }
  const reached = [...offsets].sort((a, b) => a - b).find((offset) => daysRemaining <= offset);
  return reached == null ? { kind: 'none' } : { kind: 'reminder', daysBefore: reached };
}
