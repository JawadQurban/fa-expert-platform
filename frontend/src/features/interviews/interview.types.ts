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
 * 5. **One interview per application, decided per service** (P-384, UAT
 *    BUG-027): one ticket, one time, one meeting, one committee for every
 *    covered service (`acceptedServices`), while the post-interview decision
 *    carries one entry per covered service (`PostInterviewDecisionInput`).
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
  /**
   * The confirmed slot the applicant selected — `null` until they pick one
   * (RUN-021: a proposal is never shown as if it were fixed).
   */
  readonly scheduledAt: string | null;
  /** The open proposals, as entered, while the applicant has not picked. */
  readonly proposedSlots: readonly string[];
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
  /** J-06/F4/AC-3 — staff-side reschedule trigger; after a full committee
   *  no-show, the decision-maker's (J-07/F3/AC-3). */
  readonly canReschedule: boolean;
  /** J-07/F3/AC-4 — rejection stays available after a no-show reschedule,
   *  even before the new interview happens. */
  readonly canReject?: boolean;
  /** J-07/F3/AC-3 — every assigned member marked «did not attend». */
  readonly fullNoShow?: boolean;
  /**
   * Why `canEvaluate` is false — `null` when it is true. RUN-002: «not a
   * member» is only one of these reasons, and the page must not use it for
   * the others.
   */
  readonly evaluationBlockedReason: EvaluationBlockedReason | null;
}

export type EvaluationBlockedReason =
  'not-member' | 'already-responded' | 'awaiting-selection' | 'not-started' | 'completed';

/**
 * The interview's state, derived on the server from its status and the clock
 * (BUG-032 — `ended` once its time has passed, with no job behind it).
 */
export type InterviewPhase =
  'awaiting-selection' | 'scheduled' | 'in-progress' | 'ended' | 'completed';

/* ------------------------------------------------------------------ *
 * Recorded post-interview decision — J-07/F3
 * ------------------------------------------------------------------ */

export type PostInterviewDecisionKind = 'forward' | 'reject';

/** P-384 — the recorded decision for ONE covered service. */
export interface ServiceDecisionSummaryDto {
  readonly service: ApplicationService;
  readonly kind: PostInterviewDecisionKind;
  /** Present only on a rejection (`BR-0219`). */
  readonly rejectionReason: RejectionReasonId | null;
  /** The free text of an «other» reason. */
  readonly rejectionReasonText: string | null;
}

export interface PostInterviewDecisionSummaryDto {
  /**
   * The APPLICATION's outcome: `forward` when anything goes on to the approval
   * committee (a forwarded service, or one exempted at screening), `reject`
   * when nothing does.
   */
  readonly kind: PostInterviewDecisionKind;
  readonly decidedAt: string;
  readonly decidedByName: string;
  /** Present only when the whole application was rejected (`BR-0219`). */
  readonly rejectionReason: RejectionReasonId | null;
  /** P-384 — the decision itself, one entry per covered service. */
  readonly services: readonly ServiceDecisionSummaryDto[];
}

/* ------------------------------------------------------------------ *
 * The page payload
 * ------------------------------------------------------------------ */

export interface InterviewDetailDto {
  readonly applicationId: string;
  readonly reference: string;
  readonly applicantName: string;
  /**
   * The services the application's ONE interview covers (P-384) — those
   * screening sent to the interview (J-05/F5/AC-5); never an exempted one.
   */
  readonly acceptedServices: readonly ApplicationService[];
  readonly ticket: InterviewTicketDto;
  readonly status: InterviewPhase;
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

export interface ForwardServiceInput {
  readonly service: ApplicationService;
  readonly kind: 'forward';
}

export interface RejectServiceInput {
  readonly service: ApplicationService;
  readonly kind: 'reject';
  readonly reason: RejectionReasonId;
  readonly reasonOther: string;
}

/** P-384 — the decision for one covered service. */
export type ServiceDecisionInput = ForwardServiceInput | RejectServiceInput;

/**
 * J-07/F3 + P-384 — one decision per service the interview covers, sent
 * together. The application goes on to the approval committee when anything
 * is left for it, and is rejected when nothing is.
 */
export interface PostInterviewDecisionInput {
  readonly services: readonly ServiceDecisionInput[];
}

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

export type DecisionValidationCode = 'decision-missing' | 'reason-missing' | 'reason-other-missing';

export interface DecisionValidationIssue {
  readonly code: DecisionValidationCode;
  readonly service: ApplicationService;
}

/** A per-service draft while the decision-maker is still choosing. */
export interface ServiceDecisionDraft {
  readonly kind: PostInterviewDecisionKind | null;
  readonly reason: RejectionReasonId | null;
  readonly reasonOther: string;
}

/**
 * J-07/F3/AC-2 + P-384 — every covered service needs a decision, and every
 * rejection a reason from the unified list (`BR-0219`). Returns every issue,
 * per service, so the panel can name them all at once.
 */
export function validatePostInterviewDecision(
  services: readonly ApplicationService[],
  drafts: Readonly<Partial<Record<ApplicationService, ServiceDecisionDraft>>>
): readonly DecisionValidationIssue[] {
  const issues: DecisionValidationIssue[] = [];
  for (const service of services) {
    const draft = drafts[service];
    if (draft?.kind == null) {
      issues.push({ code: 'decision-missing', service });
    } else if (draft.kind === 'reject' && draft.reason == null) {
      issues.push({ code: 'reason-missing', service });
    } else if (
      draft.kind === 'reject' &&
      draft.reason === 'other' &&
      draft.reasonOther.trim() === ''
    ) {
      issues.push({ code: 'reason-other-missing', service });
    }
  }
  return issues;
}

/** The validated drafts as the API takes them — call only when there are no issues. */
export function toDecisionInput(
  services: readonly ApplicationService[],
  drafts: Readonly<Partial<Record<ApplicationService, ServiceDecisionDraft>>>
): PostInterviewDecisionInput {
  return {
    services: services.map((service): ServiceDecisionInput => {
      const draft = drafts[service];
      return draft?.kind === 'reject' && draft.reason != null
        ? { service, kind: 'reject', reason: draft.reason, reasonOther: draft.reasonOther }
        : { service, kind: 'forward' };
    }),
  };
}

/** J-06/F4 — a reschedule must propose at least one usable slot. */
export function validateReschedule(input: RescheduleInput): boolean {
  return input.slots.some((slot) => slot.trim() !== '');
}

/**
 * BUG-056 — an interview slot starts at least this long after now («بعد ساعة من
 * الوقت الحالي»). The API holds the same rule (`InterviewSlotRules`) and answers
 * `slot-too-soon`; the form says so first, next to the slot.
 */
export const MIN_SLOT_LEAD_MINUTES = 60;

/** The problem code the API answers for a slot inside the lead time. */
export const SLOT_TOO_SOON = 'slot-too-soon';

/**
 * `true` when a filled slot starts before now + {@link MIN_SLOT_LEAD_MINUTES}.
 * Accepts the picker's local wall-clock value or an ISO instant — both parse
 * to the instant the person meant. A blank or unreadable value is not "too
 * soon"; it is someone else's error.
 */
export function isSlotTooSoon(value: string, now: Date = new Date()): boolean {
  if (value.trim() === '') {
    return false;
  }
  const startsAt = new Date(value).getTime();
  return !Number.isNaN(startsAt) && startsAt < now.getTime() + MIN_SLOT_LEAD_MINUTES * 60_000;
}

/** What is wrong with a reschedule, or `null` when it may be sent. */
export function rescheduleIssue(
  input: RescheduleInput,
  now: Date = new Date()
): 'slot-required' | 'slot-too-soon' | null {
  if (!validateReschedule(input)) {
    return 'slot-required';
  }
  return input.slots.some((slot) => isSlotTooSoon(slot, now)) ? 'slot-too-soon' : null;
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
