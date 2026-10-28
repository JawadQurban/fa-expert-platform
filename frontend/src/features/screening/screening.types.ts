import { isSlotTooSoon } from '../interviews/interview.types';
import type { SlaDto } from '../../shared/types/sla';
import type { LocalizedText } from '../../shared/types/localizedText';
import type {
  ApplicationPresentationStatus,
  ApplicationService,
} from '../applications/application.types';

/**
 * EH-INT-03 — Screening & Initial Decision contracts (CAP-02, journeys **J-05**
 * and **J-08**). Consumed **only** through `screeningService` (the versioned
 * mock today, the Expert Hub API later); the React app never calls FAST / MTM /
 * ERP / SSO directly (`02C` §5).
 *
 * Three journey invariants are encoded **structurally**, not by convention:
 *
 * 1. **The objective score is never AI-influenced** (`BR-0201`/`BR-0202`,
 *    J-05/F3/AC-2 + F4/AC-2). `ServiceScoreDto` and `QualitativeInsightDto` are
 *    separate types on separate fields — there is no shape in which an AI value
 *    can reach the official score.
 * 2. **One score per service, never a blended total** (J-05/F2/AC-3): `scores`
 *    is a list keyed by service, with no application-level score field.
 * 3. **Acceptance is per service and always carries a full path**
 *    (J-05/F5/AC-3/AC-4): every accepted service resolves to *either* the
 *    interview *or* an interview exemption with a reason (J-08). The interview
 *    is **one per application** (P-384, UAT BUG-027): one set of slots and one
 *    committee, named once in `AcceptDecisionInput.interview`, cover every
 *    service whose path is the interview. `validateAcceptDecision` is the
 *    single gate; the UI cannot finalize a half-specified decision.
 *
 * Authored (non-UI-string) content that exists in both languages uses
 * `LocalizedText` — these values come from the API, not from `*.content.ts`.
 */

/** API-authored bilingual text (distinct from UI copy, which lives in content).
 *  Declared once in `shared/types`; re-exported so the screening DTOs read
 *  self-contained at their point of use. */
export type { LocalizedText };

/* ------------------------------------------------------------------ *
 * SLA (P-J4) — J-05/F1/AC-1 (list) and F2/AC-6 (this application)
 *
 * The vocabulary moved to `shared/types/sla.ts` on 2026-08-19 when J-06/F1/AC-4
 * put the same countdown in front of the applicant. Re-exported here so this
 * feature still reads in its own terms.
 * ------------------------------------------------------------------ */

export type { SlaState, SlaDto } from '../../shared/types/sla';

/** J-05's screening deadline. Structurally identical to every other P-J4 clock. */
export type ScreeningSlaDto = SlaDto;

/* ------------------------------------------------------------------ *
 * Objective score — J-05/F3 (`BR-0201`, `BR-0203`)
 * ------------------------------------------------------------------ */

/**
 * One weighted criterion of the Evaluation Matrix. Criteria map 1:1 to the
 * application form's scored sections (2–6).
 *
 * ⚠️ Weights are **configuration**, not code (`BR-0203`: admin-editable without
 * a deployment). Until `DM-GAP-02` is approved they come from the clearly
 * labelled mock config — never hard-coded in a component.
 */
export interface ScreeningCriterionDto {
  readonly id: string;
  readonly label: LocalizedText;
  /** Percent of this service's total; criteria per service sum to 100. */
  readonly weight: number;
  /** The criterion's own 0–100 result before weighting. */
  readonly rawScore: number;
  /**
   * The value the BACKEND summed into `ServiceScoreDto.score`, displayed as
   * served and never re-derived here (`BR-0201` — one authoritative
   * calculation). The approved matrix's tables return already-weighted
   * percentage points, so `rawScore × weight ÷ 100` is not the same number.
   */
  readonly weightedScore: number;
  /**
   * The applicant answered, and this criterion's table had no entry for what
   * they chose — an unknown code, or one the business has not classified yet.
   * It scores nothing, and the page says so rather than showing a plain zero:
   * a missing decision is a configuration problem, not a business result.
   */
  readonly unresolved: boolean;
}

/** The official, fully objective score for **one** service (`BR-0201`). */
export interface ServiceScoreDto {
  readonly service: ApplicationService;
  /** Weighted total, 0–100. */
  readonly score: number;
  /**
   * Approved minimum for this service. Drives a **display-only** indicator with
   * no automated effect on the decision (J-05/F2/AC-5). Value pending
   * confirmation — served as config, never inferred.
   */
  readonly threshold: number;
  readonly criteria: readonly ScreeningCriterionDto[];
  /** Evaluation-model version the score was produced with (auditability). */
  readonly modelVersion: string;
}

/* ------------------------------------------------------------------ *
 * AI qualitative analysis — J-05/F4 (`BR-0202`) — ADVISORY ONLY
 * ------------------------------------------------------------------ */

/**
 * Assistive analysis of the application's **qualitative question fields only**
 * (J-05/F4/AC-1). Never merged into `ServiceScoreDto` (AC-2) and never run over
 * attachments (AC-3). `null` on `ScreeningDetailDto` when the analysis has not
 * been produced — the decision never waits on it.
 */
export interface QualitativeInsightDto {
  readonly summary: LocalizedText;
  readonly strengths: readonly LocalizedText[];
  readonly considerations: readonly LocalizedText[];
  /** The form fields the analysis covered — so the scope is auditable. */
  readonly analyzedFieldIds: readonly string[];
  readonly generatedAt: string;
  readonly modelVersion: string;
}

/* ------------------------------------------------------------------ *
 * Application content under review — J-05/F2/AC-2, AC-8
 * ------------------------------------------------------------------ */

export interface ScreeningFieldDto {
  readonly id: string;
  readonly label: LocalizedText;
  /** Applicant-authored value — single-language by nature. */
  readonly value: string;
  /** Marks a field inside the AI analysis scope (J-05/F4). */
  readonly qualitative?: boolean;
}

/** One entry of a repeatable section (`DEF-01`), in entry order. */
export interface ScreeningEntryDto {
  readonly index: number;
  readonly entryId?: string;
  readonly fields: readonly ScreeningFieldDto[];
}

export interface ScreeningSectionDto {
  readonly id: string;
  readonly title: LocalizedText;
  /** The section's answers — the FIRST entry of a repeatable section. */
  readonly fields: readonly ScreeningFieldDto[];
  /** Every entry of a repeatable section; absent for any other section. */
  readonly entries?: readonly ScreeningEntryDto[];
}

export interface ScreeningAttachmentDto {
  readonly id: string;
  readonly name: string;
  readonly type: LocalizedText;
  readonly format: string;
  readonly sizeKb: number;
  /** `null` while document storage is unresolved (`G26`) — no dead preview. */
  readonly previewUrl: string | null;
}

/* ------------------------------------------------------------------ *
 * Decision inputs — J-05/F5 + J-08/F1
 * ------------------------------------------------------------------ */

/** Platform-wide unified rejection reason list (`BR-0219`). */
export const REJECTION_REASONS = [
  'insufficient-qualifications',
  'insufficient-experience',
  'incomplete-documents',
  'specialty-not-required',
  'other',
] as const;

export type RejectionReasonId = (typeof REJECTION_REASONS)[number];

/** Approved Interview Exemption Reasons (J-08 supporting matrix). */
export const EXEMPTION_REASONS = ['expert', 'prior-collaboration', 'other'] as const;

export type ExemptionReasonId = (typeof EXEMPTION_REASONS)[number];

/** A staff member selectable as an interview committee member (J-05/F5/AC-3). */
export interface CommitteeMemberDto {
  readonly id: string;
  readonly name: string;
  readonly roleTitle: LocalizedText;
}

/** Either path an accepted service can take (J-05/F5/AC-3). */
export type AcceptedServicePath = 'interview' | 'exemption';

/**
 * The decision for one accepted service: the interview, or an exemption with
 * its reason. The interview itself is not per service (P-384) — see
 * {@link InterviewPlan}. Enforced by `validateAcceptDecision` (AC-4).
 */
export interface AcceptedServiceDecision {
  readonly service: ApplicationService;
  readonly path: AcceptedServicePath;
  readonly exemptionReason: ExemptionReasonId | null;
  /** Free text, required when `exemptionReason === 'other'`. */
  readonly exemptionReasonOther: string;
}

/**
 * The application's ONE interview (P-384, UAT BUG-027): the proposed times and
 * the committee, together, for every service whose path is the interview.
 */
export interface InterviewPlan {
  /** ISO date-times proposed to the applicant. */
  readonly slots: readonly string[];
  readonly committeeMemberIds: readonly string[];
}

export interface AcceptDecisionInput {
  readonly kind: 'accept';
  /** The accepted subset. Every other requested service is auto-rejected (AC-2). */
  readonly services: readonly AcceptedServiceDecision[];
  /** The one interview — `null` when every accepted service is exempted (J-08). */
  readonly interview: InterviewPlan | null;
}

export interface RejectDecisionInput {
  readonly kind: 'reject';
  readonly reason: RejectionReasonId;
  /** Free text, required when `reason === 'other'`. */
  readonly reasonOther: string;
}

export type ScreeningDecisionInput = AcceptDecisionInput | RejectDecisionInput;

/** What the server recorded — including the services it auto-rejected (AC-2). */
export interface ScreeningDecisionResultDto {
  readonly applicationId: string;
  readonly status: ApplicationPresentationStatus;
  readonly acceptedServices: readonly ApplicationService[];
  readonly autoRejectedServices: readonly ApplicationService[];
  /** Services routed straight to the approval committee via exemption (J-08/F2). */
  readonly exemptedServices: readonly ApplicationService[];
  readonly decidedAt: string;
}

/** A decision already taken — renders the page read-only (J-05/F6/AC-2). */
export interface ScreeningDecisionSummaryDto {
  readonly kind: 'accept' | 'reject';
  readonly decidedAt: string;
  readonly decidedByName: string;
  readonly acceptedServices: readonly ApplicationService[];
  readonly autoRejectedServices: readonly ApplicationService[];
  readonly exemptedServices: readonly ApplicationService[];
  readonly rejectionReason: RejectionReasonId | null;
}

/* ------------------------------------------------------------------ *
 * The page payload
 * ------------------------------------------------------------------ */

/** Where the application came from (a J-05 screening filter dimension). */
export type ApplicationSource = 'self-service' | 'internal-nomination';

export interface ScreeningDetailDto {
  readonly id: string;
  /** Always present here — screening only ever sees submitted work (`BR-0107`). */
  readonly reference: string;
  readonly applicantName: string;
  readonly applicantEmail: string;
  readonly source: ApplicationSource;
  readonly services: readonly ApplicationService[];
  readonly status: ApplicationPresentationStatus;
  readonly submittedAt: string;
  /**
   * ⚠️ **`null` when no duration is configured centrally.** J-05 shows
   * "remaining SLA time" but never states a number, so the central row
   * `SLA-0202` has no duration and no countdown can be produced. The page says
   * so rather than rendering a figure the product invented — the five business
   * days it used to show came from a constant in this feature's own mock, and
   * the console that governs deadlines had never heard of it. → `DM-GAP-10`.
   */
  readonly sla: ScreeningSlaDto | null;
  readonly scores: readonly ServiceScoreDto[];
  /** `null` when the assistive analysis has not been produced (never blocking). */
  readonly insight: QualitativeInsightDto | null;
  readonly sections: readonly ScreeningSectionDto[];
  readonly attachments: readonly ScreeningAttachmentDto[];
  /** Selectable interview committee members (J-05/F5/AC-3). */
  readonly committeePool: readonly CommitteeMemberDto[];
  /** False once decided — the decision panel renders its recorded outcome. */
  readonly decisionPending: boolean;
  /** The J-09 committee concluded with approval — the application is in J-10
   *  even though its status is still `approval-in-progress`. */
  readonly committeeApproved: boolean;
  readonly decision: ScreeningDecisionSummaryDto | null;
}

/* ------------------------------------------------------------------ *
 * Decision validation — the single gate for J-05/F5/AC-4 and AC-8
 * ------------------------------------------------------------------ */

/** Machine-readable validation codes; the page maps them to localized copy. */
export type AcceptValidationCode =
  | 'no-service-selected'
  | 'slots-missing'
  | 'slot-too-soon'
  | 'committee-missing'
  | 'exemption-reason-missing'
  | 'exemption-reason-other-missing';

export interface AcceptValidationIssue {
  readonly code: AcceptValidationCode;
  /** The service the issue belongs to; `null` for application-level issues. */
  readonly service: ApplicationService | null;
}

export type RejectValidationCode = 'reason-missing' | 'reason-other-missing';

export interface RejectValidationIssue {
  readonly code: RejectValidationCode;
}

/** The accepted services whose path is the interview — the one interview covers them. */
export function interviewedServices(input: AcceptDecisionInput): readonly ApplicationService[] {
  return input.services
    .filter((decision) => decision.path === 'interview')
    .map((decision) => decision.service);
}

/**
 * J-05/F5/AC-4 — acceptance cannot be finalized unless **every** accepted
 * service carries one complete path: the interview — whose ONE plan has slots
 * **and** committee together (P-384) — or an exemption with a reason. Returns
 * every issue so the UI can list them all at once rather than revealing them
 * one at a time. Interview issues are application-level (`service: null`).
 */
export function validateAcceptDecision(
  input: AcceptDecisionInput,
  now: Date = new Date()
): readonly AcceptValidationIssue[] {
  const issues: AcceptValidationIssue[] = [];

  if (input.services.length === 0) {
    issues.push({ code: 'no-service-selected', service: null });
    return issues;
  }

  if (interviewedServices(input).length > 0) {
    const slots = input.interview?.slots ?? [];
    if (slots.length === 0) {
      issues.push({ code: 'slots-missing', service: null });
    }
    // BUG-056 — every slot at least an hour from now; the API refuses it too.
    if (slots.some((slot) => isSlotTooSoon(slot, now))) {
      issues.push({ code: 'slot-too-soon', service: null });
    }
    if ((input.interview?.committeeMemberIds ?? []).length === 0) {
      issues.push({ code: 'committee-missing', service: null });
    }
  }

  for (const decision of input.services) {
    if (decision.path === 'interview') {
      continue;
    }
    if (decision.exemptionReason == null) {
      issues.push({ code: 'exemption-reason-missing', service: decision.service });
      continue;
    }
    if (decision.exemptionReason === 'other' && decision.exemptionReasonOther.trim() === '') {
      issues.push({ code: 'exemption-reason-other-missing', service: decision.service });
    }
  }

  return issues;
}

/** J-05/F5/AC-8 — full rejection cannot be completed without a reason (`BR-0219`). */
export function validateRejectDecision(
  input: RejectDecisionInput
): readonly RejectValidationIssue[] {
  if (input.reason === 'other' && input.reasonOther.trim() === '') {
    return [{ code: 'reason-other-missing' }];
  }
  return [];
}

/** A blank per-service decision, defaulted to the interview path (J-05/F5). */
export function createServiceDecision(service: ApplicationService): AcceptedServiceDecision {
  return {
    service,
    path: 'interview',
    exemptionReason: null,
    exemptionReasonOther: '',
  };
}
