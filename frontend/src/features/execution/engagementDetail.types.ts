import type { EngagementStatus } from '../../contracts/engagementStatus';
import type { RequestDetailsDto } from '../engagements/offer.types';
import type { EngagementTerminationDto } from '../withdrawal/withdrawal.types';

/**
 * Engagement execution contracts (CAP-05, journey **J-21**). The trainer's view
 * of an engagement from confirmation through to the archive.
 *
 * **The backend is the contract**: GET v1/me/engagements/{id} in
 * `EngagementEndpoints.cs`, captured in `contracts/fixtures/me.engagement-detail.json`
 * (and `.terminated.json`). The status vocabulary is the central one in
 * `contracts/engagementStatus.ts`.
 *
 * What is encoded structurally:
 *
 * 1. **Completion is a date, not an act.** F5/AC-1 — the status is derived by
 *    the server from the schedule, so there is **no operation anywhere that
 *    completes, reopens, or reverses one**.
 * 2. **A gap is named, not zeroed.** Enrolment and attendance come from FAST's
 *    `PlanTaker` (`Q20`) and evaluations from MTM (`Q29`); neither feed exists.
 *    Each section therefore arrives as `{ available, reason, … }`, and a page
 *    reading `available: false` says the data is missing — it never shows an
 *    empty list or a zero that looks like a real figure.
 * 3. **An enrollee is a name and nothing else.** F3/AC-2 — "only their names
 *    (Arabic/English) are displayed — **no additional data**". `EnrolleeDto` has
 *    nowhere to put an id or a contact detail.
 * 4. **Evaluations do not depend on completion.** F6/AC-4 — they sit on the DTO
 *    unconditionally, with nothing relating them to the status.
 *
 * ⚠️ **J-25** — F1/AC-3's "immediate notification" of a schedule change belongs
 * to the missing Notification Matrix. The *state* it would describe
 * (`scheduleChangedAt`) is carried, and the page shows it.
 */

/* ------------------------------------------------------------------ *
 * F3 + F4 — the enrollees, and the attendance
 * ------------------------------------------------------------------ */

/**
 * F3/AC-2 — **names only.** ⚠️ Provisional: the API serves `takers: []` while
 * `Q20` stands, so the item shape is the journey's rule, not yet a served one.
 */
export interface EnrolleeDto {
  readonly nameAr: string;
  readonly nameEn: string;
}

export interface EnrolmentDto {
  readonly available: boolean;
  /** The open item that explains the gap (`Q20`); `null` once available. */
  readonly reason: string | null;
  readonly takers: readonly EnrolleeDto[];
}

/**
 * F4 — attendance per programme day. ⚠️ The day shape is undefined by the API
 * (open item 1: the FAST attendance field is pending), so nothing reads a day's
 * content yet.
 */
export interface AttendanceDto {
  readonly available: boolean;
  readonly reason: string | null;
  readonly days: readonly unknown[];
}

/* ------------------------------------------------------------------ *
 * F6 — trainee evaluations, from MTM
 * ------------------------------------------------------------------ */

/**
 * F6 — one evaluation as **MTM** supplied it: the raw value on the scale it was
 * given on (`02D`), linked to a trainer and a programme name (F6/AC-3). ⚠️
 * Provisional, like `EnrolleeDto`: the API serves `items: []` while `Q29` stands.
 */
export interface TraineeEvaluationDto {
  readonly evaluationId: string;
  readonly trainerName: string;
  readonly programName: string;
  readonly rawValue: number;
  readonly scaleLow: number;
  readonly scaleHigh: number;
  readonly receivedAt: string;
  readonly comment: string | null;
}

export interface EvaluationsDto {
  readonly available: boolean;
  /** `Q29` — no MTM integration exists. */
  readonly reason: string | null;
  readonly items: readonly TraineeEvaluationDto[];
}

/* ------------------------------------------------------------------ *
 * The engagement
 * ------------------------------------------------------------------ */

export interface EngagementDetailDto {
  readonly engagementId: string;
  readonly requestId: string;
  readonly slotNumber: number;
  /**
   * F5/AC-1 — derived from the schedule by the server… **unless the engagement
   * ended early**, in which case J-22's outcome stands. A withdrawn engagement
   * does not quietly become "completed" because its dates passed.
   */
  readonly status: EngagementStatus;
  readonly confirmedAt: string;
  /** F1/AC-1 — the same request detail the offer carried, unchanged. */
  readonly details: RequestDetailsDto | null;
  readonly enrolment: EnrolmentDto;
  readonly attendance: AttendanceDto;
  /**
   * F1/AC-3 — when the plan's dates last changed in FAST, `null` if never. The
   * engagement always shows the *current* dates; this makes the change visible.
   */
  readonly scheduleChangedAt: string | null;
  /** F6/AC-4 — present whatever the status is. */
  readonly evaluations: EvaluationsDto;
  /**
   * **J-22** — why it ended early, `null` if it did not. F3/AC-6 requires the
   * reason to travel with the engagement into "Past engagements".
   */
  readonly termination: EngagementTerminationDto | null;
}
