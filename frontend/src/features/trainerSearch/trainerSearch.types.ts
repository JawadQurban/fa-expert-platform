import type { ApplicationService } from '../applications/application.types';
import type { DirectorySpecialty, TrainerClassification } from '../directory/directory.types';
import type { ProfileAgreementStatus } from '../profile/profile.types';

/**
 * EH-INT-07 / EH-INT-08 — Trainer Search & Unified Profile contracts (CAP-04,
 * journey **J-15**). The **internal** view of the trainer base.
 *
 * J-15's scope is deliberately narrow and worth quoting, because the obvious
 * reading is wrong: this is *"a look-up and oversight tool, **not** a
 * candidate-selection mechanism — sourcing trainers for a specific
 * assignment/event is handled entirely in J-17."* So nothing here shortlists,
 * ranks, or nominates. A "select for assignment" action would belong to a
 * journey that has not been built.
 *
 * **This is where the file status lives.** J-13/AC-9 has the system calculate a
 * Trainer Profile Status, and J-13/AC-10 (`BR-0408`) restricts it to internal
 * Trainer Management staff — which is why it is deliberately absent from
 * `MyProfileDto` (P-48). **J-15/F1/AC-2 is the other half of that rule**: staff
 * must see it. The same fact, present on exactly one of the two contracts.
 *
 * ⚠️ **Route deviation.** `04` EH-INT-07/08 place these at `/expert-hub/profile`
 * and `/expert-hub/profile/:trainerId` as a *staff render* of the trainer's own
 * route. This build puts them under `/expert-hub/internal/trainers`, matching the
 * convention every other internal screen already follows (inbox, screening,
 * committee, agreements, service requests) and avoiding a role branch inside a
 * route that resolves to a different layout. Structure, not business logic — see
 * `DECISIONS.md` P-70.
 */

/**
 * J-13's Trainer Profile Status matrix, in full. Internal-only (`BR-0408`).
 *
 * *Idle* is worth its own note: J-13 defines it as "for monitoring purposes
 * only, **with no effect on matching eligibility**". It is a signal to staff,
 * not a restriction, and nothing in this feature may treat it as one.
 */
export const TRAINER_FILE_STATUSES = ['active', 'idle', 'suspended', 'expired'] as const;

export type TrainerFileStatus = (typeof TRAINER_FILE_STATUSES)[number];

/* ------------------------------------------------------------------ *
 * F1/AC-3 — search and filter
 * ------------------------------------------------------------------ */

/**
 * The J-15/F1/AC-3 dimensions that have data behind them. The certification
 * floor is a minimum rather than a min/max pair: J-15's own open item defers the
 * "detailed search filter list (dropdowns/ranges)" to page inventory — so a
 * minimum is the least that is certainly wanted, and no upper bound is invented.
 *
 * AC-3 also names specialty, domain, evaluation and experience. None is offered:
 * each could only answer wrongly, so the API refuses it (400) and no control
 * sends it.
 * - *Specialty* and *domain* — no taxonomy exists (`Q16`): specialty matched
 *   nobody, domain was silently ignored.
 * - *Minimum evaluation* — no calculated rating exists (`DM-GAP-14`), so every
 *   trainer's `evaluationOverall` is `null` and the floor matched nobody.
 * - *Minimum years* — see `TrainerSearchResultDto.yearsExperience`.
 */
export interface TrainerSearchFilters {
  /** Free text over name — the "locate a specific trainer" case in the flow. */
  readonly search: string;
  readonly service: ApplicationService | 'all';
  readonly minCertifications: number | null;
  readonly fileStatus: TrainerFileStatus | 'all';
}

export const DEFAULT_TRAINER_SEARCH_FILTERS: TrainerSearchFilters = {
  search: '',
  service: 'all',
  minCertifications: null,
  fileStatus: 'all',
};

export function hasActiveTrainerSearchFilters(filters: TrainerSearchFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.service !== 'all' ||
    filters.minCertifications != null ||
    filters.fileStatus !== 'all'
  );
}

/** One row of the internal trainer list. */
export interface TrainerSearchResultDto {
  readonly trainerId: string;
  readonly name: string;
  readonly services: readonly ApplicationService[];
  readonly specialties: readonly DirectorySpecialty[];
  readonly classification: TrainerClassification;
  /** F1/AC-2 — internal-only (`BR-0408`). */
  readonly fileStatus: TrainerFileStatus;
  /**
   * `null` until a rating is calculated (`02D`, P-06) — and nothing calculates
   * one yet (`DM-GAP-14`). There is therefore no minimum-evaluation filter.
   */
  readonly evaluationOverall: number | null;
  readonly certificationCount: number;
  /**
   * `null` — no numeric source exists: the form's experience answers are
   * ranges, which cannot be a number without inventing one. There is therefore
   * no minimum-years filter either.
   */
  readonly yearsExperience: number | null;
}

export interface TrainerSearchListDto {
  readonly items: readonly TrainerSearchResultDto[];
  readonly totalCount: number;
  // The API still serves an always-empty `availableDomains` (`Q16`). Not read:
  // the domain filter it fed is refused server-side.
}

/* ------------------------------------------------------------------ *
 * F1/AC-1 — the unified profile
 * ------------------------------------------------------------------ */

/** One programme or participation on the trainer's record with the Academy. */
export interface TrainerRecordEntryDto {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly year: number;
}

/**
 * The evaluation, **with its last sync date** — AC-1 asks for that explicitly.
 * Internal views show the provenance the trainer's own view does not (`02D` §9);
 * a number with no idea how stale it is invites a decision it cannot support.
 */
export interface TrainerEvaluationDto {
  readonly overall: number | null;
  readonly lastSyncedAt: string | null;
  readonly perProgram: readonly { readonly program: string; readonly score: number }[];
}

export interface TrainerAgreementSummaryDto {
  readonly reference: string;
  readonly status: ProfileAgreementStatus;
  readonly startsAt: string;
  readonly endsAt: string;
}

/**
 * Everything F1/AC-1 enumerates, in one screen: "full personal data, their
 * record with the Academy (programs/participations), evaluations (with last sync
 * date), active agreement, and file status".
 */
export interface TrainerProfileDto {
  readonly trainerId: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly city: string;
  readonly avatarUrl: string | null;
  readonly services: readonly ApplicationService[];
  readonly specialties: readonly DirectorySpecialty[];
  readonly classification: TrainerClassification;
  /** `null` — see `TrainerSearchResultDto.yearsExperience`. */
  readonly yearsExperience: number | null;
  readonly academicQualification: string;
  readonly certifications: readonly string[];
  /** AC-2 — internal-only (`BR-0408`); see the file header. */
  readonly fileStatus: TrainerFileStatus;
  readonly record: readonly TrainerRecordEntryDto[];
  readonly evaluation: TrainerEvaluationDto;
  /** `null` when no agreement is in force. */
  readonly agreement: TrainerAgreementSummaryDto | null;
  readonly identityCard: IdentityCardDto;
  /** `P-331` — the APPROVED short bio; one awaiting review is in the review queue. */
  readonly bio: string | null;
}

/** `P-331` — one bio waiting for a trainer-management decision. */
export interface PendingBioDto {
  readonly trainerId: string;
  readonly trainerName: string;
  /** The text to approve. */
  readonly draft: string;
  readonly draftSource: 'ai' | 'trainer' | null;
  /** What is public now, if an earlier version was approved. */
  readonly published: string | null;
  readonly submittedAt: string | null;
  /** Sent back with the decision: an edit since then refuses it (409). */
  readonly revision: number;
}

export type BioDecision = 'approve' | 'return';

/* ------------------------------------------------------------------ *
 * F2 — the Identity Card
 * ------------------------------------------------------------------ */

/**
 * The seven fields J-15's Identity Card Template matrix lists, in its order.
 * F2/AC-1 is emphatic that the card is "populated directly from the Trainer
 * Profile fields per the matrix above, **with no additional content or custom
 * wording**" — so this DTO holds exactly seven entries and no free-text slot for
 * anyone to add an eighth.
 *
 * *Related Fields* and *Social Media Accounts* stay nullable: `null` means the
 * platform has no source for the row (reported as missing), an empty list means
 * this trainer has none. The API fills both from the profile.
 */
/** One of «أبرز الخبرات الأخيرة» — dates as stored (ISO), formatted on render. */
export interface IdentityCardRoleDto {
  readonly jobTitle: string;
  readonly organization: string;
  readonly startedAt: string | null;
  readonly endedAt: string | null;
  readonly current: boolean;
}

export interface IdentityCardDto {
  readonly photoUrl: string | null;
  readonly name: string;
  /** «عدد سنوات الخبرة» — the range label, never turned into a number. */
  readonly experience: string;
  /** The HIGHEST qualification's label (`P-299`). */
  readonly academicQualifications: string;
  /** The university and year of that same qualification. */
  readonly university: string | null;
  readonly qualificationYear: string | null;
  /** The services held, forum participations, and «المجال». */
  readonly relatedFields: readonly string[] | null;
  /** One entry per certificate, by name. */
  readonly certifications: readonly string[];
  /** The front cover's LinkedIn link. */
  readonly socialAccounts: readonly string[] | null;
  /** «نبذة عامة» — «القطاع» and «نوعية الأنشطة والمشاركات». */
  readonly sector: string | null;
  readonly participationTypes: readonly string[];
  /** The two most recent roles, latest first (`P-299`). */
  readonly recentRoles: readonly IdentityCardRoleDto[];
  /**
   * The generated PDF. `null` while document generation/storage is unresolved
   * (`G26`) — no fabricated download, and no client-side PDF invented to fill
   * the gap, since AC-1 requires "the approved design template" which does not
   * exist in this repository.
   */
  readonly pdfUrl: string | null;
}

/** Which of the seven matrix rows have no data behind them (`Q19`). */
export function missingIdentityCardFields(card: IdentityCardDto): readonly string[] {
  const missing: string[] = [];
  if (card.photoUrl == null) {
    missing.push('photo');
  }
  if (card.relatedFields == null) {
    missing.push('relatedFields');
  }
  if (card.socialAccounts == null) {
    missing.push('socialAccounts');
  }
  return missing;
}
