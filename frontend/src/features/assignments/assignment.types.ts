import type { LocalizedText } from '../../shared/types/localizedText';
import type { ApplicationService } from '../applications/application.types';

/**
 * EH-INT-09 — Assignment Request contracts (CAP-05, journey **J-16**). The
 * requesting party creates a request; J-17 matches and nominates against it.
 *
 * Five journey rules are encoded **structurally**:
 *
 * 1. **Service type is the first mandatory field, and it branches the path**
 *    (F1). Trainer opens the FAST plan selection; the other three open their own
 *    field sets — which do not exist yet (see below).
 * 2. **Nothing here can create a program or plan** (F2/AC-3: "under any
 *    circumstance"). There is no create input on this contract at all, so the
 *    restriction is not a button someone forgot to hide.
 * 3. **Program-level and plan-level data are never mixed** (F3/AC-2). They are
 *    two nested objects, not one flat bag: `program` holds the identity brief,
 *    `plan` holds every operational detail. Merging them would take a deliberate
 *    act rather than an accidental spread.
 * 4. **Pulled data is never entered by hand** (F3/AC-1). `PulledRequestDataDto`
 *    is output-only — the submit input carries a plan id and a headcount, and
 *    no field that could overwrite what FAST supplied.
 * 5. **A headcount above one is a first-class case** (F4/AC-2), carried on the
 *    request so J-17 can nominate several people against one request rather
 *    than the number being a display detail.
 *
 * ⚠️ **2026-08-30 — the CAPTURE model is superseded** by the owner-supplied
 * centre request form (`DM-GAP-06`, «طلب تقديم البرنامج») — see
 * `centreRequestForm.types.ts`. Requests are now described by the centre per
 * request type; the FAST plan-selection capture is retired. What this file
 * keeps is everything downstream still stands on: the pulled FAST data types
 * (engagement offers show them at J-18/J-21), the request DTOs, and the rule
 * that nothing anywhere creates a programme or plan in FAST (F2/AC-3).
 *
 * ⚠️ **`Q16`** — matrix row 3 is "Specialization/**Domain**". Domain still has
 * no taxonomy, so the pulled value is carried as free text exactly as FAST
 * supplies it, and no domain vocabulary is invented here either.
 */

/** J-16/F1/AC-1 — the four services a request can ask for. */
export type AssignmentServiceType = Extract<
  ApplicationService,
  'trainer' | 'consultant' | 'content-developer' | 'question-writer'
>;

export const ASSIGNMENT_SERVICE_TYPES: readonly AssignmentServiceType[] = [
  'trainer',
  'consultant',
  'content-developer',
  'question-writer',
];

/* ------------------------------------------------------------------ *
 * F2 — FAST program / plan selection (Trainer only)
 * ------------------------------------------------------------------ */

/**
 * F3/AC-2 — **the Program level, and only the Program level.** The identity
 * brief and the program's name and specialization live here; nothing
 * operational does.
 */
export interface PulledProgramDataDto {
  readonly programId: string;
  /**
   * Matrix row 1 — "sourced from Program level only".
   *
   * **Bilingual**, because FAST holds it that way: `Program.BriefAr` and
   * `Program.BriefEn` are two columns (P-114). It was a single string until the
   * schema arrived, which would have shown Arabic text to an English reader.
   */
  readonly identityBrief: LocalizedText;
  /** Matrix row 2. */
  readonly name: LocalizedText;
  /**
   * Matrix row 3 — "Specialization/Domain", an **exclusionary** matching
   * criterion in J-17. Free text as FAST supplies it: `Q16` leaves domain
   * without a taxonomy, and inventing one to parse this would be worse than
   * carrying the source value through.
   */
  readonly specialization: string;
}

/**
 * F3/AC-2 — **the Plan level, and only the Plan level.** Every operational
 * detail, exactly the matrix's rows 4–12.
 *
 * The matching annotations are carried in the comments because J-17 consumes
 * them: *exclusionary* criteria remove a candidate outright, *weighted* ones
 * move them up or down. Recording which is which at the source keeps J-17 from
 * having to re-derive it.
 */
export interface PulledPlanDataDto {
  readonly planId: string;
  /** Row 4. */
  readonly days: number;
  /** Row 5. */
  readonly hours: number;
  /**
   * Row 6 — **display only**, and "fully separate from the trainer's own price".
   * Nothing may compute against this or present it as what the trainer is paid.
   */
  readonly programFee: number;
  /** Row 7 — weighted matching criterion (J-17). */
  readonly language: string;
  /** Row 8 — weighted matching criterion (J-17). */
  readonly deliveryMode: 'in-class' | 'online';
  /** Row 9 — exclusionary matching criterion, **unless online** (J-17). */
  readonly country: string;
  readonly city: string;
  /** Row 10 — used to calculate trainer conflict (J-17). */
  readonly startsAt: string;
  readonly endsAt: string;
  /**
   * Row 11 — the Teams meeting URL, shown to the trainer only on engagement
   * confirmation (**J-21**), and only if online. It is carried here because FAST
   * supplies it, and deliberately not surfaced to anyone before J-21.
   */
  readonly meetingUrl: string | null;
  /** Row 12 — checked later in J-20. `null` when the plan has none. */
  readonly trainingMaterialName: string | null;
}

/**
 * F3 — the auto-pulled payload. **Output only**: there is no input type that can
 * write any of it, which is what "no manual entry by the requesting party"
 * (AC-1) means in practice.
 *
 * F3/AC-3 notes every pulled field is mandatory at its FAST source, "so no
 * missing-data scenario is expected here" — hence almost nothing is nullable.
 * The two that are (`meetingUrl`, `trainingMaterialName`) are conditional by
 * their own matrix notes, not missing.
 */
export interface PulledRequestDataDto {
  readonly program: PulledProgramDataDto;
  readonly plan: PulledPlanDataDto;
}

/* ------------------------------------------------------------------ *
 * The request itself
 * ------------------------------------------------------------------ */

/**
 * Where a request stands from J-16's point of view. J-16 ends at `matching`
 * (F5/AC-2) — everything after that belongs to J-17 and is deliberately not
 * modelled here.
 */
export type AssignmentRequestStatus = 'matching' | 'nominated' | 'closed';

export interface AssignmentRequestSummaryDto {
  readonly requestId: string;
  /** F5/AC-1 — generated at submission and linked to the request. */
  readonly reference: string;
  readonly serviceType: AssignmentServiceType;
  readonly programName: LocalizedText | null;
  readonly requiredHeadcount: number;
  readonly status: AssignmentRequestStatus;
  readonly createdAt: string;
  readonly createdByName: string;
}

export interface AssignmentRequestDetailDto extends AssignmentRequestSummaryDto {
  /** `null` for services whose matrix is still pending definition. */
  readonly pulled: PulledRequestDataDto | null;
}

/* ------------------------------------------------------------------ *
 * Submission — F4 + F5
 * ------------------------------------------------------------------ */

/**
 * F4/AC-2 — stated once so downstream code asks the same question: a request for
 * more than one person must support several nominations against it in J-17.
 */
export function isMultiHeadcount(request: { readonly requiredHeadcount: number }): boolean {
  return request.requiredHeadcount > 1;
}
