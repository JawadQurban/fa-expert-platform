import type { LocalizedText } from '../../shared/types/localizedText';
import type { ApplicationService } from '../applications/application.types';
import type { RejectionReasonId } from '../screening/screening.types';

/**
 * EH-INT-04 — Interview Evaluation & Post-Interview Decision contracts (CAP-02,
 * journey **J-07**, plus the staff half of **J-06** reschedule). Consumed only
 * through `interviewService`; no direct FAST / MTM / Teams calls from the app.
 *
 * Four journey invariants are encoded **structurally**:
 *
 * 1. **Nothing is calculated until every assigned member has responded**
 *    (`BR-0220`, F2/AC-1): `result` is `null` — not a partial number — while any
 *    member is still pending. No component can render a half-formed average
 *    because no half-formed average exists in the contract.
 * 2. **"Did not attend" is excluded, never counted as zero** (F1/AC-3, F2/AC-2):
 *    non-attendance is a distinct `MemberResponseState`, not a score of 0, and
 *    the result reports how many evaluations it excluded.
 * 3. **Each accepted service is scored independently** (F1/AC-2): evaluations
 *    and results are keyed by service, with no blended application-level score.
 * 4. **Only the screening decision-maker may decide** (`BR-0208`, F3/AC-1):
 *    authority arrives as a server-decided `viewer.canDecide` flag, never
 *    inferred client-side from a role string.
 *
 * The evaluation model itself (criteria, weights, rating scale) is
 * **configuration** served by the API (`BR-0203` pattern) — the approved Notion
 * «Interview Evaluation Model». Each interview is read through the model version
 * it was created under, so the page never assumes one model or one scale.
 */

/* ------------------------------------------------------------------ *
 * The interview ticket — created in J-06/F2/AC-3
 * ------------------------------------------------------------------ */

export interface InterviewTicketDto {
  /** Unique interview number linked to the applicant; survives reschedules
   *  (J-06/F4/AC-6 — a reschedule never issues a new number). */
  readonly number: string;
  /** The confirmed slot the applicant selected. */
  readonly scheduledAt: string;
  /**
   * Teams meeting link recorded on the ticket (J-06/F2/AC-3). `null` until the
   * Teams integration exists — it is **not** in the CAP-12 integration table
   * yet (J-06 open item 1), so the frontend surfaces the field and never
   * fabricates a link.
   */
  readonly meetingUrl: string | null;
  /** How many times this interview has been rescheduled (J-06/F4). */
  readonly rescheduleCount: number;
}

/* ------------------------------------------------------------------ *
 * Interview Evaluation Model — J-07 supporting matrix
 * ------------------------------------------------------------------ */

export interface InterviewAxisDto {
  readonly id: string;
  readonly label: LocalizedText;
  readonly description: LocalizedText | null;
  /** Percent of the service's total; axes sum to 100. */
  readonly weight: number;
  /** Top of the scoring scale for this axis (e.g. 5). */
  readonly maxScore: number;
}

/** One named level of the model's rating scale (approved model: 1 Very Poor … 5 Excellent). */
export interface InterviewRatingLevelDto {
  readonly score: number;
  readonly label: LocalizedText;
}

export interface InterviewModelDto {
  readonly version: string;
  readonly axes: readonly InterviewAxisDto[];
  /**
   * The levels a score may take. `null` for a model that defines no named
   * levels — the form then offers the plain 1…`maxScore` digits.
   */
  readonly ratingScale: readonly InterviewRatingLevelDto[] | null;
}

/* ------------------------------------------------------------------ *
 * Committee responses — J-07/F1
 * ------------------------------------------------------------------ */

/** `submitted` and `did-not-attend` are both *responses*; only `pending` blocks. */
export type MemberResponseState = 'pending' | 'submitted' | 'did-not-attend';

export interface CommitteeMemberResponseDto {
  readonly memberId: string;
  readonly name: string;
  readonly roleTitle: LocalizedText;
  readonly state: MemberResponseState;
  readonly respondedAt: string | null;
}

/* ------------------------------------------------------------------ *
 * Consolidated result — J-07/F2
 * ------------------------------------------------------------------ */

export interface ServiceInterviewResultDto {
  readonly service: ApplicationService;
  /** Average of **submitted (attended)** evaluations only (F2/AC-2). */
  readonly average: number;
  /** Highest possible average, so the UI never hard-codes a scale. */
  readonly maxScore: number;
  readonly countedEvaluations: number;
  /** Non-attendance entries left out of the average — surfaced, not hidden. */
  readonly excludedNonAttendance: number;
  /**
   * The model's pass mark on the same scale as `average` (approved model: 70 of
   * 100). `null` when the interview's model defines none (the draft model).
   */
  readonly passThreshold: number | null;
  /**
   * Server-decided: `average >= passThreshold`. A service that passed may be
   * forwarded to the approval committee, which still decides — passing approves
   * nothing. `null` when the model has no pass mark.
   */
  readonly passed: boolean | null;
}

/**
 * True when nothing remains eligible for the approval committee: a result
 * exists, not one interviewed service passed, AND no service of the same
 * application was exempted from interview (J-08). Services are evaluated
 * independently — an exempted service is never lost with a failed one.
 */
export function noServicePassed(
  result: readonly ServiceInterviewResultDto[] | null,
  exemptedServices: readonly string[] = []
): boolean {
  return (
    exemptedServices.length === 0 &&
    result != null &&
    result.length > 0 &&
    result.every((entry) => entry.passed === false)
  );
}

/* ------------------------------------------------------------------ *
 * Viewer capabilities — server-decided (`BR-0208`)
 * ------------------------------------------------------------------ */

export interface InterviewViewerDto {
  /** The viewer's committee membership, or `null` if they are not a member. */
  readonly memberId: string | null;
  /** True when the viewer is an assigned member who has not yet responded. */
  readonly canEvaluate: boolean;
  /** `BR-0208` — only the person who formed the committee at screening (J-05). */
  readonly canDecide: boolean;
  /** J-06/F4/AC-3 — staff-side reschedule trigger. */
  readonly canReschedule: boolean;
}

/* ------------------------------------------------------------------ *
 * Recorded post-interview decision — J-07/F3
 * ------------------------------------------------------------------ */

export type PostInterviewDecisionKind = 'forward' | 'reject';

export interface PostInterviewDecisionSummaryDto {
  readonly kind: PostInterviewDecisionKind;
  readonly decidedAt: string;
  readonly decidedByName: string;
  /** Present only on a direct rejection (`BR-0219`). */
  readonly rejectionReason: RejectionReasonId | null;
}

/* ------------------------------------------------------------------ *
 * The page payload
 * ------------------------------------------------------------------ */

export interface InterviewDetailDto {
  readonly applicationId: string;
  readonly reference: string;
  readonly applicantName: string;
  /** Only services accepted at screening reach an interview (J-05/F5/AC-5). */
  readonly acceptedServices: readonly ApplicationService[];
  readonly ticket: InterviewTicketDto;
  readonly model: InterviewModelDto;
  readonly committee: readonly CommitteeMemberResponseDto[];
  /** `null` while any member is still pending (`BR-0220`) — never partial. */
  readonly result: readonly ServiceInterviewResultDto[] | null;
  readonly viewer: InterviewViewerDto;
  readonly decision: PostInterviewDecisionSummaryDto | null;
  /**
   * Services of the same application exempted from interview (J-08) and still
   * undecided — eligible for the committee without an interview result.
   */
  readonly exemptedServices: readonly ApplicationService[];
  /**
   * J-06/F1/AC-3 + F3 — the applicant asked for a different time. `null` when
   * there is no pending request (cleared once staff propose new slots).
   */
  readonly rescheduleRequest?: {
    readonly requestedAt: string;
    readonly note: string | null;
  } | null;
}

/* ------------------------------------------------------------------ *
 * Evaluation submission — J-07/F1
 * ------------------------------------------------------------------ */

/** The member's overall read per service, alongside the numeric axes. */
export const INTERVIEW_RECOMMENDATIONS = [
  'recommend',
  'recommend-with-reservations',
  'not-recommend',
] as const;

export type InterviewRecommendation = (typeof INTERVIEW_RECOMMENDATIONS)[number];

export interface AxisScoreInput {
  readonly axisId: string;
  /** `null` = not yet scored; the gate rejects it (never coerced to 0). */
  readonly score: number | null;
}

export interface ServiceEvaluationInput {
  readonly service: ApplicationService;
  readonly axisScores: readonly AxisScoreInput[];
  readonly recommendation: InterviewRecommendation | null;
  readonly notes: string;
}

export interface EvaluationSubmissionInput {
  readonly kind: 'evaluation';
  /** One entry per accepted service — scored independently (F1/AC-2). */
  readonly services: readonly ServiceEvaluationInput[];
}

export interface NonAttendanceInput {
  readonly kind: 'did-not-attend';
}

export type InterviewEvaluationInput = EvaluationSubmissionInput | NonAttendanceInput;

/* ------------------------------------------------------------------ *
 * Post-interview decision input — J-07/F3
 * ------------------------------------------------------------------ */

export interface ForwardDecisionInput {
  readonly kind: 'forward';
}

export interface DirectRejectInput {
  readonly kind: 'reject';
  readonly reason: RejectionReasonId;
  readonly reasonOther: string;
}

export type PostInterviewDecisionInput = ForwardDecisionInput | DirectRejectInput;

/* ------------------------------------------------------------------ *
 * Reschedule input — J-06/F4/AC-3+AC-4 (staff side)
 * ------------------------------------------------------------------ */

export interface RescheduleInput {
  /** New proposed slots; the applicant selection flow repeats (F4/AC-4). */
  readonly slots: readonly string[];
  readonly note: string;
}

/* ------------------------------------------------------------------ *
 * Validation gates
 * ------------------------------------------------------------------ */

export type EvaluationValidationCode = 'axis-score-missing';

export interface EvaluationValidationIssue {
  readonly code: EvaluationValidationCode;
  readonly service: ApplicationService;
  readonly axisId: string | null;
}

/**
 * J-07/F1 — a member's evaluation is complete only when **every axis of every
 * accepted service** is scored. The recommendation is optional (business
 * decision, 2026-09-16).
 * Marking non-attendance instead is always valid (AC-3) and never partially
 * scored, so it short-circuits with no issues.
 */
export function validateEvaluation(
  input: InterviewEvaluationInput,
  model: InterviewModelDto
): readonly EvaluationValidationIssue[] {
  if (input.kind === 'did-not-attend') {
    return [];
  }

  const issues: EvaluationValidationIssue[] = [];
  // A model with named levels accepts only those scores — the same rule the
  // API enforces; a model without them accepts any entered score.
  const levels = model.ratingScale?.map((level) => level.score) ?? [];
  for (const service of input.services) {
    for (const axis of model.axes) {
      const entry = service.axisScores.find((score) => score.axisId === axis.id);
      if (
        entry == null ||
        entry.score == null ||
        (levels.length > 0 && !levels.includes(entry.score))
      ) {
        issues.push({
          code: 'axis-score-missing',
          service: service.service,
          axisId: axis.id,
        });
      }
    }
  }
  return issues;
}

export type DecisionValidationCode = 'reason-missing' | 'reason-other-missing';

/** J-07/F3/AC-2 — a direct rejection needs a reason from the unified list. */
export function validatePostInterviewDecision(
  input: PostInterviewDecisionInput
): readonly DecisionValidationCode[] {
  if (input.kind === 'forward') {
    return [];
  }
  if (input.reason === 'other' && input.reasonOther.trim() === '') {
    return ['reason-other-missing'];
  }
  return [];
}

/** J-06/F4 — a reschedule must propose at least one usable slot. */
export function validateReschedule(input: RescheduleInput): boolean {
  return input.slots.some((slot) => slot.trim() !== '');
}

/** A blank per-service evaluation for the given model. */
export function createServiceEvaluation(
  service: ApplicationService,
  model: InterviewModelDto
): ServiceEvaluationInput {
  return {
    service,
    axisScores: model.axes.map((axis) => ({ axisId: axis.id, score: null })),
    recommendation: null,
    notes: '',
  };
}

/**
 * F2/AC-1 — the result is only ever computed once **every** assigned member has
 * responded. Exposed so the UI states the rule in the same terms the server does.
 */
export function allMembersResponded(committee: readonly CommitteeMemberResponseDto[]): boolean {
  return committee.length > 0 && committee.every((member) => member.state !== 'pending');
}

export function pendingMembers(
  committee: readonly CommitteeMemberResponseDto[]
): readonly CommitteeMemberResponseDto[] {
  return committee.filter((member) => member.state === 'pending');
}
