import type { CandidatePoolDto, MatchingViewerDto } from '../assignments/matching.types';

/**
 * Slot re-routing contracts (CAP-05, journey **J-19**). What happens when every
 * approved and ranked candidate for **one slot** is exhausted — by explicit
 * rejection or by silent expiry — without an acceptance.
 *
 * J-19 is J-17 run again, narrowed to a single slot. That "narrowed" is the
 * whole journey, and it is encoded structurally:
 *
 * 1. **Every operation is slot-addressed.** F2/AC-1 — staff re-match "scoped to
 *    that specific slot only", explicitly "not the entire original request".
 *    There is no request-wide re-match on this contract at all.
 * 2. **Sibling slots are read-only data.** F2/AC-2 — re-matching an exhausted
 *    slot "does not affect or reopen" a slot whose engagement is already
 *    confirmed. They appear as `SiblingSlotDto`, which no operation accepts and
 *    nothing here can write, so reopening one is unrepresentable.
 * 3. **No exclusion exists for having refused before.** F2/AC-3 — the same
 *    exclusion rules apply "with **no restriction against candidates previously
 *    rejected/expired for this same slot**". `MatchExclusionReason` (J-17) has
 *    four members and none of them is history, so a prior refuser can only be
 *    excluded for a reason that is true of them today.
 * 4. **The cycle has a counter and no ceiling.** F3/AC-3 — "the same re-matching
 *    cycle repeats **without limit** — no escalation mechanism is triggered".
 *    `cycleNumber` counts; nothing compares it to a maximum, there is no
 *    `escalated` status, and the contract has no escalate operation.
 *
 * The approval half is J-17's, unchanged: F3/AC-1 sends the new candidates to
 * the requesting party "**exactly as in J-17/F4**", so this module imports
 * `CandidatePoolDto`, `SendPoolInput`, `PoolDecisionInput` and the validators
 * rather than restating them. Sharing the types is what makes "exactly as" a
 * fact rather than an intention.
 *
 * ⚠️ **J-25** — F1/AC-2's exhausted-slot notification, "distinct from a single
 * candidate's rejection/expiry notification", belongs to the missing
 * Notification Matrix. What is built is the state it would describe.
 */

/*
 * The wire contract is `GET v1/internal/assignment-requests/{id}/slots/{n}/cycle`
 * in `backend/src/ExpertHub.Api/Assignments/AssignmentEndpoints.cs`,
 * field for field; `contracts/fixtures/internal.slot-cycle.json` is a real
 * response, and `ReRouting.contract.test.tsx` renders the page from it.
 */

/* ------------------------------------------------------------------ *
 * The sibling slots — visible, and untouchable
 * ------------------------------------------------------------------ */

/**
 * F2/AC-2. A slot's state as seen from *another* slot's re-routing workspace.
 *
 * It carries no ids to act on and no actions of its own: this type exists so the
 * person re-matching can see that the other slots are unaffected, not so that
 * anything can reach them.
 */
export type SiblingSlotState = 'confirmed' | 'awaiting-response' | 'exhausted' | 'no-offer';

export interface SiblingSlotDto {
  readonly slotNumber: number;
  readonly state: SiblingSlotState;
}

/* ------------------------------------------------------------------ *
 * What already happened on this slot
 * ------------------------------------------------------------------ */

/** The J-18 offer's outcome, as the cycle endpoint words it. */
export type PreviousOfferOutcome = 'awaiting-response' | 'accepted' | 'rejected' | 'expired';

/**
 * F1/AC-5 + F2/AC-3 — every offer already made on **this** slot, and how it
 * ended.
 *
 * They are shown, deliberately, and **not** filtered out of the new run. Staff
 * who see a familiar name reappear should be able to tell it is the rule rather
 * than a bug, and the journey is explicit that a prior refusal is not a
 * disqualification.
 */
export interface PreviousOfferDto {
  readonly offerId: string;
  readonly trainerId: string;
  readonly trainerName: string;
  readonly outcome: PreviousOfferOutcome;
  readonly sentAt: string;
  readonly respondedAt: string | null;
}

/* ------------------------------------------------------------------ *
 * The cycle
 * ------------------------------------------------------------------ */

/**
 * Where this slot's re-routing stands — the server's `SlotCycleStatuses`, the
 * one place these strings are written on this side.
 *
 * ⚠️ **There is no `escalated` member, and no terminal failure state.** F3/AC-3
 * says a slot that exhausts repeatedly simply repeats the cycle, with no
 * escalation triggered — so a status a UI could render as "give up" would be an
 * invented rule.
 */
export const SLOT_CYCLE_STATUS = {
  exhausted: 'exhausted',
  awaitingApproval: 'awaiting_approval',
  decided: 'decided',
} as const;

export type SlotCycleStatus = (typeof SLOT_CYCLE_STATUS)[keyof typeof SLOT_CYCLE_STATUS];

/** One pass through the cycle. A slot keeps every earlier one as history. */
export interface SlotCycleEntryDto {
  readonly cycleNumber: number;
  readonly status: SlotCycleStatus;
  readonly poolId: string | null;
  readonly openedAt: string;
}

export interface SlotCycleDto {
  readonly reference: string;
  readonly slotNumber: number;
  /**
   * F3/AC-3 — the current cycle, counted from 1; `0` before the slot was ever
   * exhausted. **Never compared to a limit**, because there is none.
   */
  readonly cycleNumber: number;
  /** `null` before the slot was ever exhausted — there is no cycle yet. */
  readonly status: SlotCycleStatus | null;
  readonly exhausted: boolean;
  /** F2/AC-2 — this slot's own engagement is confirmed. */
  readonly confirmed: boolean;
  /**
   * The slot's latest pool — `not-built` when none was ever sent. J-17's type,
   * F3/AC-1's "exactly as". After a full rejection it is the *decided* pool of
   * the cycle before.
   */
  readonly pool: CandidatePoolDto;
  readonly cycles: readonly SlotCycleEntryDto[];
  /** F2/AC-3 — who was already offered this slot, shown rather than excluded. */
  readonly previouslyOffered: readonly PreviousOfferDto[];
  /** P-J9 — the same two actors as J-17, decided by the server. */
  readonly viewer: MatchingViewerDto;
  /** F2/AC-2 — the rest of the request, for reassurance only. */
  readonly siblings: readonly SiblingSlotDto[];
}

/**
 * The ProblemDetails `detail` codes the slot pool actions answer with (`400`).
 * A `409` carries prose instead, and means the slot moved on under the page.
 */
export type SlotActionErrorCode =
  'pool-size' | 'excluded-candidate' | 'preference-order-invalid' | 'no-approved-candidate';

/**
 * A re-match covers **one** slot, so the pool for it is `CANDIDATES_PER_SLOT`.
 * Named here rather than passing `1` at the call site: the reason the number is
 * 3 is that this cycle serves exactly one slot, and that should be readable.
 */
export const RE_MATCH_HEADCOUNT = 1;
