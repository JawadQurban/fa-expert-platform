import type { EngagementTerminationKind } from '../../contracts/engagementStatus';

/**
 * Withdrawal & cancellation contracts (CAP-05, journey **J-22**). The wire
 * shapes are `EngagementEndpoints.cs`'s `TerminateAsync` and
 * `TerminationOfAsync`; `contracts/fixtures/me.engagement-termination.json` and
 * `me.engagement-detail.terminated.json` are real responses.
 *
 * J-22 is **three independent scenarios**, and the whole journey is the fact
 * that they stay independent. Each has its own trigger, its own actor, its own
 * reason list, and its own consequence:
 *
 * | Scenario | Who triggers it | Reason list | Outcome |
 * | --- | --- | --- | --- |
 * | F1 trainer withdrawal | the trainer | `TrainerWithdrawalReason` | `withdrawn` |
 * | F2 staff de-linking | staff | `StaffDelinkReason` | `withdrawn` |
 * | F3 plan cancellation | **FAST**, never us | FAST's own list | `cancelled` |
 *
 * What is encoded structurally:
 *
 * 1. **The platform cannot cancel a plan. At all.** F3/AC-2 — "there is no path
 *    to cancel a plan manually from within the platform **under any
 *    circumstance** — cancellation originates exclusively from FAST". So this
 *    contract has no cancel operation; the only thing it can do with a
 *    cancellation is *read* one that arrived.
 * 2. **Two reason lists that can never be confused.** F1/AC-2 and F2/AC-2 give
 *    the trainer and staff *different* high-level lists. The termination record
 *    is discriminated by `actor`, so a staff reason cannot appear on a trainer's
 *    withdrawal or the other way round.
 * 3. **"Other (free text)" requires the text.** Both lists end in *Other*, and
 *    an "other" with nothing after it explains nothing — so the input is a
 *    discriminated union whose `other` member carries a required `note`.
 * 4. **FAST's cancellation reasons are FAST's.** F3/AC-1 names
 *    `PlanCancelReasonId` / `CancelReasonOther`. That enumeration is not
 *    published here, so it is **not invented**: the code and its text arrive as
 *    data and are rendered as given.
 * 5. **Only this slot ends.** F1/AC-3 and F2/AC-3 — "**only** the trainer's
 *    engagement for this specific slot is terminated". Both operations are
 *    engagement-addressed; there is nothing on either input that names another.
 * 6. **Both human paths end as `withdrawn`** (`P-111`). `cancelled` is FAST's
 *    alone; who ended a withdrawn engagement is `actor`, not the status.
 *
 * ⚠️ **J-25** — every notification here (staff on withdrawal, the trainer on
 * de-linking, every linked trainer on plan cancellation) belongs to the missing
 * Notification Matrix. What is built is the state each notification describes.
 */

/* ------------------------------------------------------------------ *
 * F1 — the trainer's reasons
 * ------------------------------------------------------------------ */

/**
 * F1/AC-2 — "a simple, high-level list". Exactly three, closed: a fourth cannot
 * appear without amending the journey first.
 */
export const TRAINER_WITHDRAWAL_REASONS = [
  'personal-emergency',
  'scheduling-conflict',
  'other',
] as const;

export type TrainerWithdrawalReason = (typeof TRAINER_WITHDRAWAL_REASONS)[number];

/* ------------------------------------------------------------------ *
 * F2 — staff's reasons
 * ------------------------------------------------------------------ */

/**
 * F2/AC-2 — a *different* simple list. Deliberately not merged with the
 * trainer's: "Personal Emergency" is not a reason staff can give, and
 * "Administrative Decision" is not one a trainer can.
 */
export const STAFF_DELINK_REASONS = [
  'operational-need-change',
  'administrative-decision',
  'other',
] as const;

export type StaffDelinkReason = (typeof STAFF_DELINK_REASONS)[number];

/* ------------------------------------------------------------------ *
 * The inputs
 * ------------------------------------------------------------------ */

/**
 * F1/AC-2 — *Other* is free text, and the text is what makes it a reason. The
 * union means an `other` with no note cannot be constructed; the same technique
 * as J-20's request-for-changes note (P-98).
 */
export type WithdrawFromEngagementInput =
  | { readonly reason: Exclude<TrainerWithdrawalReason, 'other'> }
  | { readonly reason: 'other'; readonly note: string };

/** F2/AC-2 — the same shape over staff's own list. */
export type DelinkTrainerInput =
  | { readonly reason: Exclude<StaffDelinkReason, 'other'> }
  | { readonly reason: 'other'; readonly note: string };

export type TerminationValidationCode = 'reason-required' | 'note-required';

/** Blank space is not an explanation. Applied in the UI **and** server-side. */
export function validateTermination(
  input: WithdrawFromEngagementInput | DelinkTrainerInput | null
): readonly TerminationValidationCode[] {
  if (input == null) {
    return ['reason-required'];
  }
  return input.reason === 'other' && input.note.trim() === '' ? ['note-required'] : [];
}

/* ------------------------------------------------------------------ *
 * The termination record
 * ------------------------------------------------------------------ */

interface TerminationRecordBase {
  /**
   * `withdrawn` for both human paths, `cancelled` for FAST. ⚠️ Rows a staff
   * de-link wrote as `cancelled` before `P-111` are kept as they were, which is
   * why the kind is not tied to the actor.
   */
  readonly kind: EngagementTerminationKind;
  /** Present exactly when the reason is `other` (or FAST sent free text). */
  readonly note: string | null;
  /** `PlanCancelReasonId` — FAST's code, rendered as given; `null` for people. */
  readonly fastCancelReasonCode: string | null;
  readonly occurredAt: string;
}

/**
 * Why an engagement ended early, discriminated by **who ended it**.
 *
 * The `actor` tag is what keeps F1/AC-2's and F2/AC-2's lists apart: each
 * member carries only its own reason type. FAST's member is different in kind —
 * its reason is FAST's own, so it is a string rendered as given.
 *
 * ⚠️ The record does not name the staff member who de-linked (F2/AC-4).
 */
export type EngagementTerminationDto = TerminationRecordBase &
  (
    | { readonly actor: 'trainer'; readonly reason: TrainerWithdrawalReason }
    | { readonly actor: 'staff'; readonly reason: StaffDelinkReason }
    | { readonly actor: 'fast'; readonly reason: string }
  );

/* ------------------------------------------------------------------ *
 * The result
 * ------------------------------------------------------------------ */

/**
 * What POST …/withdrawal and POST …/delink return.
 *
 * - **F1/AC-5 + F2/AC-5** — the slot returns to matching: `slotReopened` is
 *   `true` when the next approved candidate's turn came, `false` when none was
 *   left and the slot is exhausted (J-19's trigger).
 * - **F2/AC-3** — de-linking is "a platform-side unlinking only, **not a FAST
 *   cancellation**". There is no FAST-write field on this result *and* the copy
 *   says the plan is untouched.
 */
export interface TerminationResultDto {
  readonly engagementId: string;
  readonly kind: 'withdrawn';
  readonly occurredAt: string;
  readonly slotReopened: boolean;
}

/**
 * The ProblemDetails `detail` values the server refuses a termination with.
 * ⚠️ The shared API client keeps only `detail`, so `extensions.lifecycle` and
 * `extensions.deadline` do not reach the page.
 */
export const TERMINATION_ERROR_DETAILS = {
  notUpcoming: 'engagement-not-upcoming',
  deadlinePassed: 'termination-deadline-passed',
  alreadyEnded: 'Already ended.',
  reasonRequired: 'reason-required',
  noteRequired: 'note-required',
} as const;
