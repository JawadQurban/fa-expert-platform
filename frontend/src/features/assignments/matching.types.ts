import type { LocalizedText } from '../../shared/types/localizedText';
import type { TrainerClassification } from '../directory/directory.types';

/**
 * EH-INT-09 matching contracts (CAP-05, journey **J-17**). Ranking candidates
 * against a submitted request, building the pool, and the requesting party's
 * decision on it.
 *
 * The journey's central distinction is between **exclusionary** and **weighted**
 * criteria, and it is encoded in the types rather than left to a scoring
 * function's discretion:
 *
 * - An **exclusionary** failure removes a candidate entirely (F1/AC-2). It is
 *   reported as a `MatchExclusionReason`, and an excluded candidate is not
 *   returned with a low score — they are returned in a separate list, or not at
 *   all.
 * - A **weighted** criterion produces a contribution to a score and **can never
 *   exclude on its own** (F1/AC-3). `WeightedCriterionScore` has no way to
 *   express exclusion: its only output is a number.
 *
 * Two more journey rules are structural:
 *
 * - **Exactly three candidates per required slot** (F2/AC-2, `BR-0505`) — "no
 *   fewer, no more". `poolSizeFor` names the arithmetic once, and
 *   `validatePool` refuses a pool of any other size on both paths.
 * - **The pool is sent together, in one batch** (F3/AC-1, "never sent one at a
 *   time"). The send input takes a list of candidates; there is no
 *   send-one-candidate operation to reach for.
 *
 * ⚠️ **`DM-GAP-05`** — the matching **weights and tie-breaking** are not
 * approved. They arrive as served configuration (`MatchingModelDto`), exactly as
 * the screening evaluation matrix does (P-24), so the page renders whatever
 * model it is given and no weight is hard-coded here.
 *
 * ⚠️ **Open item 1** — matching for Consultant, Content Developer and Question
 * Writer is undefined, because their *request* matrices are still pending from
 * J-16. Those requests cannot be created, so no unreachable matching path is
 * built for them.
 */

/** `BR-0505`, generalized by F2/AC-2 to the required headcount. */
export const CANDIDATES_PER_SLOT = 3;

/** F2/AC-2 — "a request needing 2 trainers → exactly 6 candidates". */
export function poolSizeFor(requiredHeadcount: number): number {
  return requiredHeadcount * CANDIDATES_PER_SLOT;
}

/* ------------------------------------------------------------------ *
 * The Matching Matrix — the seven criteria
 * ------------------------------------------------------------------ */

/**
 * The four **exclusionary** rows of the matrix. A candidate failing any one of
 * them is out entirely (F1/AC-2) — these are reasons, not penalties, and they
 * are deliberately a closed union so a fifth cannot appear without amending the
 * matrix first.
 *
 * - `specialization` — row 1, against the Program's specialization/domain.
 * - `location` — row 2, the trainer's city against the Plan's country/city,
 *   **unless the plan is online**, in which case the row does not apply.
 * - `schedule-conflict` — row 3, the trainer's confirmed engagements against the
 *   plan's dates. Enforced before presentation on **either** path (F3/AC-3).
 * - `file-status` — row 4, the trainer's file status must be active. This is the
 *   internal-only status from J-13/AC-10, used here as J-15 makes it visible.
 */
export type MatchExclusionReason =
  'specialization' | 'location' | 'schedule-conflict' | 'file-status';

/** The three **weighted** rows. None of them can exclude anyone (F1/AC-3). */
export type WeightedCriterionId = 'language' | 'delivery-mode' | 'evaluation';

/**
 * One weighted criterion's contribution.
 *
 * **There is no `excluded` field, and there never should be.** F1/AC-3 says "no
 * weighted criterion excludes a candidate on its own", so the only thing this
 * type can produce is a score — making the rule impossible to violate rather
 * than merely documented.
 */
export interface WeightedCriterionScore {
  readonly criterion: WeightedCriterionId;
  /** 0–1, before the model's weight is applied. */
  readonly rawScore: number;
  /** The weight this model assigns (`DM-GAP-05`, served not hard-coded). */
  readonly weight: number;
  /** `rawScore × weight`, carried so the UI never recomputes the ranking. */
  readonly weighted: number;
}

/**
 * ⚠️ `DM-GAP-05` — served configuration, not code. The engine's weights and its
 * tie-breaking rule are unapproved, so they arrive with the results and the page
 * renders what it is given. Swapping the approved model in changes no UI.
 */
export interface MatchingModelDto {
  readonly version: string;
  readonly weights: Readonly<Record<WeightedCriterionId, number>>;
  /** How ties are broken, as authored text — unapproved, hence not modelled. */
  readonly tieBreakNote: LocalizedText | null;
}

/* ------------------------------------------------------------------ *
 * Candidates
 * ------------------------------------------------------------------ */

/**
 * F3/AC-2 — the price shown beside each candidate, **per delivery mode**, and
 * "sourced from their active agreement" (`BR-0515`).
 *
 * Both modes are carried, and the UI shows the one the plan actually needs — the
 * other is not the price for this engagement, and showing both invites the wrong
 * number being read.
 */
export interface CandidatePriceDto {
  readonly inClass: number | null;
  readonly online: number | null;
  readonly currency: string;
  /** The agreement the figures came from, so the source is checkable. */
  readonly agreementReference: string;
}

/** A ranked, non-excluded candidate. */
export interface MatchCandidateDto {
  readonly trainerId: string;
  readonly name: string;
  readonly classification: TrainerClassification;
  readonly evaluationOverall: number | null;
  /** F1/AC-3 — the weighted breakdown behind the rank, shown not hidden. */
  readonly scores: readonly WeightedCriterionScore[];
  /** Sum of `weighted`, server-computed. The UI ranks by it, never on it. */
  readonly totalScore: number;
  readonly price: CandidatePriceDto;
}

/**
 * A candidate the engine removed. Kept separate from the ranked list — an
 * exclusion is not a low score, and collapsing the two would let a UI
 * accidentally present someone the matrix rules out.
 */
export interface ExcludedCandidateDto {
  readonly trainerId: string;
  readonly name: string;
  /** F1/AC-2 — every exclusionary criterion this candidate failed. */
  readonly reasons: readonly MatchExclusionReason[];
}

/**
 * F1 — one run of the engine. **One cycle, one pool**, however large the
 * headcount: F1/AC-4 says the pool "expands per the required headcount — not
 * separate cycles per slot", so this is a single list and not a list of lists.
 */
export interface MatchingRunDto {
  readonly model: MatchingModelDto;
  readonly ranked: readonly MatchCandidateDto[];
  /** Shown so staff can see *why* someone they expected is absent. */
  readonly excluded: readonly ExcludedCandidateDto[];
  /** `poolSizeFor(requiredHeadcount)` — restated by the server. */
  readonly requiredPoolSize: number;
}

/* ------------------------------------------------------------------ *
 * The pool, and the requesting party's decision
 * ------------------------------------------------------------------ */

export type PoolStatus = 'not-built' | 'sent' | 'decided';

/** F4/AC-1 — a decision **per candidate**, never one verdict on the pool. */
export type CandidateDecision = 'pending' | 'approved' | 'rejected';

export interface PoolMemberDto {
  readonly trainerId: string;
  readonly name: string;
  readonly price: CandidatePriceDto;
  readonly decision: CandidateDecision;
  /** F4/AC-2 — 1-based preference among the approved; `null` until ranked. */
  readonly preferenceRank: number | null;
}

export interface CandidatePoolDto {
  readonly status: PoolStatus;
  readonly members: readonly PoolMemberDto[];
  readonly sentAt: string | null;
  /** How many the request needs — the pool is three times this (F2/AC-2). */
  readonly requiredHeadcount: number;
}

/**
 * Who may do what. **Server-decided** (P-J9): J-17 has two actors — Trainer
 * Management staff who build the pool, and the requesting party who decides on
 * it — and J-26 (roles/permissions) has no document, so nothing reads a role.
 */
export interface MatchingViewerDto {
  /** Run the engine, search manually, and send the pool. */
  readonly canMatch: boolean;
  /** Approve/reject each candidate and rank the approved. */
  readonly canApprove: boolean;
}

/* ------------------------------------------------------------------ *
 * Inputs
 * ------------------------------------------------------------------ */

/**
 * F3/AC-1 — "sent together to the requesting party **in one batch — never sent
 * one at a time**". The input is the whole pool; there is deliberately no
 * single-candidate counterpart anywhere on this contract.
 */
export interface SendPoolInput {
  readonly trainerIds: readonly string[];
}

/** F4/AC-1 + AC-2 — each candidate decided, then the approved ones ranked. */
export interface PoolDecisionInput {
  readonly decisions: readonly {
    readonly trainerId: string;
    readonly decision: Exclude<CandidateDecision, 'pending'>;
  }[];
  /** Trainer ids in preference order; must be exactly the approved ones. */
  readonly preferenceOrder: readonly string[];
}

export type PoolValidationCode = 'pool-size-wrong' | 'decisions-incomplete' | 'ranking-mismatch';

/**
 * F2/AC-2 — exactly three per slot, "no fewer, no more", on **either** path.
 * Manual selection is not a way around the rule; it is the other way to satisfy
 * it.
 */
export function validatePool(
  trainerIds: readonly string[],
  requiredHeadcount: number
): readonly PoolValidationCode[] {
  return trainerIds.length === poolSizeFor(requiredHeadcount) ? [] : ['pool-size-wrong'];
}

/**
 * F4/AC-1 + AC-2. Every presented candidate must be decided — a pool with an
 * undecided member has not been reviewed — and the preference order must be
 * exactly the approved set, in some order.
 */
export function validatePoolDecision(
  input: PoolDecisionInput,
  members: readonly PoolMemberDto[]
): readonly PoolValidationCode[] {
  const issues: PoolValidationCode[] = [];
  if (input.decisions.length !== members.length) {
    issues.push('decisions-incomplete');
  }
  const approved = input.decisions
    .filter((entry) => entry.decision === 'approved')
    .map((entry) => entry.trainerId)
    .sort();
  const ranked = [...input.preferenceOrder].sort();
  if (approved.length !== ranked.length || approved.some((id, index) => id !== ranked[index])) {
    issues.push('ranking-mismatch');
  }
  return issues;
}

/**
 * F4/AC-3 — "given **all** presented candidates are rejected (zero approvals),
 * then the matching/nomination cycle restarts automatically". Named once so the
 * condition reads the same everywhere; the re-routing itself is J-19's.
 */
export function isFullRejection(members: readonly PoolMemberDto[]): boolean {
  return members.length > 0 && members.every((member) => member.decision === 'rejected');
}

/**
 * F4/AC-4 — the top-ranked approved candidate per required slot moves to J-18;
 * the rest "stay as ranked backups". Returns the ones that go forward now.
 */
export function candidatesGoingForward(
  members: readonly PoolMemberDto[],
  requiredHeadcount: number
): readonly PoolMemberDto[] {
  return members
    .filter((member) => member.decision === 'approved' && member.preferenceRank != null)
    .sort((a, b) => (a.preferenceRank ?? 0) - (b.preferenceRank ?? 0))
    .slice(0, requiredHeadcount);
}
