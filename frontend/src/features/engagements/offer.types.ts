import type { SlaDto } from '../../shared/types/sla';
import type { EngagementStatus } from '../../contracts/engagementStatus';

/**
 * Assignment Offer & Engagement contracts (CAP-05, journey **J-18**). Spans both
 * interfaces: the trainer receives and answers an offer, staff track the
 * responses.
 *
 * **The backend is the contract.** Every type here mirrors the wire records in
 * `ExpertHub.Api/Assignments/EngagementEndpoints.cs` (`OfferWire`, `SlotWire`,
 * `MyEngagementWire`), and `contracts/fixtures/me.*.json` +
 * `internal.request-slots.json` are real responses the contract tests render.
 *
 * Four journey rules are encoded **structurally**:
 *
 * 1. **Nobody sends an offer.** F1/AC-1 — the system sends it automatically to
 *    the top-ranked candidate "with no additional manual staff action", so this
 *    contract has **no send operation at all**. An offer exists because J-17's
 *    approval created it.
 * 2. **One live offer per slot.** F1/AC-2 — "only the top-ranked candidate
 *    receives the offer at any given time; remaining approved (backup)
 *    candidates receive nothing until their turn". A slot therefore carries one
 *    `currentOffer`, and backups are a queue with no offer of their own.
 * 3. **Rejection and expiry have the same effect and different notifications.**
 *    F2/AC-2 vs AC-3 + AC-4: both advance to the next-ranked candidate, but
 *    expiry notifies the nominating staff member *specifically*. The outcome
 *    union keeps them distinct so the notification can be too.
 * 4. **FAST syncs per slot, immediately.** F4/AC-1 — "with no waiting for the
 *    remaining required slots on the same request to be filled". Sync state
 *    lives on the slot, never on the request.
 *
 * ⚠️ **J-25** — every notification here (rejection to staff, expiry to the
 * nominating staff member, the offer itself reaching the trainer) belongs to the
 * missing Notification Matrix. What is built is the state each notification
 * would describe.
 */

/* ------------------------------------------------------------------ *
 * What the trainer is shown about the work
 * ------------------------------------------------------------------ */

/** `CentreRequestMatrix.DeliveryModes` + form 3's «بث مباشر». */
export type DeliveryMechanism = 'onsite' | 'online' | 'live-stream';

/** `CentreRequestMatrix.Languages`. */
export type RequestLanguage = 'ar' | 'en';

/**
 * F1/AC-3 — the request detail, as `DetailsOf` serves it: the **centre's own
 * entered request** (`DM-GAP-06`), flat, single-language. ⚠️ It is not FAST's
 * programme/plan read — there is no such feed — so there is no identity brief,
 * no hours, no country and no venue to show, and none is invented.
 *
 * Every field is nullable because the form behind it is per request type: a
 * consultation carries no city, for instance.
 */
export interface RequestDetailsDto {
  readonly reference: string;
  readonly serviceType: string;
  /** Rendered as given — the centre typed it in one language. */
  readonly programName: string | null;
  readonly days: number | null;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly language: RequestLanguage | null;
  readonly deliveryMechanism: DeliveryMechanism | null;
  readonly city: string | null;
  /** A `SPECIALIZATION_DOMAIN_OPTIONS` code (`dom-NNN`). */
  readonly specializationDomain: string | null;
  /** J-21/F2 — FAST's, and there is no feed: `null` rather than fabricated. */
  readonly meetingUrl: string | null;
}

/* ------------------------------------------------------------------ *
 * The offer
 * ------------------------------------------------------------------ */

/**
 * How an offer ended. Rejection and expiry are separate members because
 * **F2/AC-4 requires a distinct notification for expiry**, even though AC-3
 * gives it "the same effect as rejection". Collapsing them would make the two
 * notifications impossible to tell apart.
 */
export type OfferOutcome = 'accepted' | 'rejected' | 'expired';

export type OfferStatus = 'awaiting-response' | OfferOutcome;

export interface AssignmentOfferDto {
  readonly offerId: string;
  readonly requestId: string;
  /** Which of the request's slots this offer fills (1-based). */
  readonly slotNumber: number;
  readonly trainerId: string;
  readonly trainerName: string;
  readonly status: OfferStatus;
  readonly sentAt: string;
  /**
   * F2/AC-1 — the 3-day window, as a P-J4 clock (`SLA-0501`). Server-computed,
   * and `null` once the offer is no longer awaiting a response.
   */
  readonly responseSla: SlaDto | null;
  readonly respondedAt: string | null;
  /** `null` only if the request carries no form at all. */
  readonly details: RequestDetailsDto | null;
  /**
   * F3/AC-2 — the price this trainer would be paid, from their agreement.
   * `amount` is `null` when the agreement carries none for the mode
   * (`DM-GAP-16`) — shown as not set, never as zero.
   */
  readonly price: { readonly amount: number | null; readonly currency: string };
}

/* ------------------------------------------------------------------ *
 * The slot — the internal tracking view
 * ------------------------------------------------------------------ */

/** One approved candidate waiting their turn (F1/AC-2). */
export interface SlotBackupDto {
  readonly trainerId: string;
  readonly trainerName: string;
  readonly preferenceRank: number;
}

/**
 * F4 — the FAST write for this slot. Per slot and immediate: AC-1 says
 * `PlanTrainer.TrainerId` updates "with no waiting for the remaining required
 * slots on the same request to be filled", so this cannot live on the request.
 *
 * ⚠️ No `failed` state, matching the trainer-facing precedent (`§0.9`): a
 * stalled sync stays `processing` and never reverts a confirmed engagement.
 */
export type SlotSyncState = 'none' | 'processing' | 'synchronized';

export interface AssignmentSlotDto {
  readonly slotNumber: number;
  /** F1/AC-2 — the one live offer, or `null` once the slot is filled or dry. */
  readonly currentOffer: AssignmentOfferDto | null;
  /** Ranked, and untouched until their turn comes. */
  readonly backups: readonly SlotBackupDto[];
  /** Every offer made for this slot, oldest first — the live one included. */
  readonly history: readonly AssignmentOfferDto[];
  readonly confirmedTrainerId: string | null;
  /**
   * **J-22/F2** — the engagement staff would de-link. `null` until the slot is
   * confirmed, and `null` again once that engagement ends.
   */
  readonly confirmedEngagementId: string | null;
  readonly fastSync: SlotSyncState;
  /**
   * F2/AC-5 — every approved candidate has refused or lapsed and the slot has
   * nowhere left to go. Re-routing itself is **J-19**.
   */
  readonly exhausted: boolean;
}

/**
 * F2/AC-5 — named once so the condition reads the same everywhere. A slot is
 * exhausted when it has no live offer, no confirmed trainer, and no backups
 * left; that is the trigger J-19 picks up.
 */
export function isSlotExhausted(slot: {
  readonly currentOffer: AssignmentOfferDto | null;
  readonly backups: readonly SlotBackupDto[];
  readonly confirmedTrainerId: string | null;
}): boolean {
  return slot.confirmedTrainerId == null && slot.currentOffer == null && slot.backups.length === 0;
}

/* ------------------------------------------------------------------ *
 * The trainer's side
 * ------------------------------------------------------------------ */

/**
 * F5 — where the engagement's training material stands. It is the **J-20
 * submission status** (`SubmissionStatuses`), not a yes/no attachment flag.
 */
export const TRAINING_MATERIAL_STATUSES = [
  'awaiting_upload',
  'pending_approval',
  'changes_requested',
  'approved',
] as const;

export type TrainingMaterialStatus = (typeof TRAINING_MATERIAL_STATUSES)[number];

export interface TrainingMaterialDto {
  readonly status: TrainingMaterialStatus;
  /** The request's programme name — not an attachment; nothing is stored (`G26`). */
  readonly name: string | null;
}

/**
 * F3/AC-2 — what appears in **"My Engagements"** the moment an offer is
 * accepted. The journey names the section, so the type does too.
 */
export interface MyEngagementDto {
  readonly engagementId: string;
  readonly requestId: string;
  readonly slotNumber: number;
  readonly confirmedAt: string;
  readonly details: RequestDetailsDto | null;
  readonly trainingMaterial: TrainingMaterialDto;
  /**
   * F5/AC-3 — server-decided (a submission awaiting upload or changes), so the
   * trainer portal never re-derives the rule from the status string.
   */
  readonly canUploadMaterial: boolean;
  /**
   * J-21/F5/AC-2 moves a completed engagement into "Past engagements". The
   * vocabulary is the central one, so the list and the detail page cannot
   * disagree about it.
   */
  readonly lifecycle: EngagementStatus;
}

/** F2/AC-1 — the trainer's answer. There is no third option. */
export type OfferResponse = 'accept' | 'reject';

export interface RespondToOfferInput {
  readonly response: OfferResponse;
}
