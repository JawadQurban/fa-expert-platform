import type { ApplicationService } from '../applications/application.types';
import type {
  ApplicationEntryDto,
  ApplicationFieldValue,
  ApplicationFormSchemaDto,
} from '../applications/applicationForm.types';
import { normalizeEntries } from '../applications/applicationValidation';
import type { DirectorySpecialty, TrainerClassification } from '../directory/directory.types';

/**
 * EH-TP-04 (My Profile) contracts — CAP-04, flow J5. The authoritative trainer
 * record, viewed and (partially) edited by its owner. Consumed **only** through
 * `profileService` (the versioned mock today, the Expert Hub API later); the
 * React app never calls FAST / MTM / SSO directly (`02C`).
 *
 * **Conformed to journey J-14 on 2026-08-19** (`DECISIONS.md` P-52/P-53).
 * J-14/F1/AC-1 (`BR-0404`) requires self-service editing to use "**the exact
 * same fields/sections** as the original application form — **no separate update
 * form is created**". The profile previously carried a hand-built three-field
 * `EditableProfileFields` plus its own `FastFieldDto[]` list, which was exactly
 * the separate form the AC forbids.
 *
 * It now carries the **same `ApplicationFormSchemaDto`** the J-01 application
 * form uses. Sharing the *type* is what makes AC-1 structural: a profile form
 * that diverges from the application form is unrepresentable, because there is
 * only one schema and both pages render it.
 *
 * The page's central rule is **editability is decided per field, by the server**
 * (`04`/`05` EH-TP-04 §11, P-16, P-J9) — `ProfileFieldStateDto.editability`:
 * - `editable` — Expert-Hub-owned; the trainer edits and saves directly (AC-4).
 * - `request-change` — FAST-owned (`BR-0404`). A submitted change shows the
 *   **old** value with `pendingValue` set until FAST confirms (`03` J5) — the
 *   business-vs-sync separation applied per field (`§0.9`): a pending change
 *   never overwrites the displayed value.
 * - `locked` — read-only regardless of role (`BR-0411`), always with a named
 *   reason, because a disabled field with no explanation reads as a bug.
 *
 * Ratings are the **calculated** indicator only (`02D`, P-06) — never the raw MTM
 * value, never editable. Visibility `consent` is the toggle that feeds the public
 * directory (EH-PUB-02/03, `BR-1002/1007`).
 *
 * Reused label vocabularies (single source): service labels from
 * `myApplications.content`, specialty + classification labels from
 * `directory.content` — the same trainer, the same words.
 *
 * **The Trainer Profile Status is absent by design** (verified 2026-08-19,
 * `DECISIONS.md` P-48). J-13/AC-9 has the system calculate a status —
 * Active / Idle / Suspended / Expired — from agreement state and engagement
 * activity, and **AC-10** restricts it to internal Trainer Management staff:
 * "never displayed to the trainer themselves or on any public-facing view"
 * (`BR-0408`). `MyProfileDto` therefore has no status field at all, so the
 * trainer-facing page cannot render one. Note that *Idle* in particular is
 * explicitly "for monitoring purposes only, with no effect on matching
 * eligibility" — surfacing it to the trainer would imply a consequence that
 * does not exist. If an internal profile view is built later it gets its own
 * DTO; this one must not grow the field.
 */

/* ------------------------------------------------------------------ *
 * Per-field editability — J-14/F1 + F2
 * ------------------------------------------------------------------ */

/**
 * What the trainer may do with one field of the shared application-form schema.
 * **Server-decided** (P-J9), never inferred client-side from a field id or an
 * ownership string: the same field can be editable for one trainer and locked
 * for another once delegation (J-26) exists.
 */
export type ProfileFieldEditability = 'editable' | 'request-change' | 'locked';

/**
 * Why a field is locked. J-14/F2's Locked Fields matrix is marked *pending final
 * confirmation*, so this union covers exactly the three rows it lists today and
 * nothing more — a fourth reason is a business decision, not a code change made
 * on a hunch.
 */
export type ProfileLockReason =
  | 'classification'
  | 'evaluation'
  | 'agreement'
  /**
   * ⚠️ No Expert Hub trainer file exists yet, so there is nothing to write to.
   * Distinct from the other three: this field is not computed and not owned
   * elsewhere — it is simply not writable until accreditation (`P-260`).
   */
  | 'not-accredited'
  /**
   * ⚠️ Filled from the Academy's own record, and therefore **already
   * verified** — not something Expert Hub is still waiting for. Owner ruling,
   * 2026-09-10: «if it comes from FAST it should be already approved»
   * (`P-263`).
   */
  | 'from-academy';

export interface ProfileFieldStateDto {
  readonly fieldId: string;
  readonly editability: ProfileFieldEditability;
  /**
   * `request-change` only — a submitted change awaiting FAST confirmation;
   * `null` when none is pending. The confirmed value stays in `fieldValues`
   * until FAST confirms, so a pending change never overwrites what is displayed.
   */
  readonly pendingValue: string | null;
  /** `request-change` only — last FAST sync, shown as provenance (P-16). */
  readonly lastSyncAt: string | null;
  /** `locked` only — never `null` when locked; see `ProfileLockReason`. */
  readonly lockReason: ProfileLockReason | null;
}

/* ------------------------------------------------------------------ *
 * Locked profile facts — J-14/F2
 * ------------------------------------------------------------------ */

/**
 * The agreement's contractual state, as the trainer sees it.
 *
 * The vocabulary comes from **J-12**, which is the journey that owns it: F1
 * tracks expiry, F2 renews, F3 lets staff "suspend it or end it". `ended` and
 * `expired` are deliberately distinct — J-13's status matrix defines *Expired*
 * as "agreement ended **without renewal**", i.e. a lapse, whereas ending is a
 * deliberate staff act (J-12/F3/AC-1).
 *
 * ⚠️ J-12 is not built yet, so today this is served by the mock. When J-12
 * lands, this union is what it must produce — not a new one.
 */
export type ProfileAgreementStatus = 'active' | 'suspended' | 'expired' | 'ended';

/**
 * **J-14/F2** — "fields listed in the Locked Fields matrix remain **visible**
 * but non-editable to the trainer, updated only automatically by the system".
 * Visible is the operative word: these are not hidden, they are shown without an
 * edit affordance.
 *
 * The matrix lists three rows and is marked *pending final confirmation*, so
 * this DTO carries exactly those three.
 *
 * ⚠️ **Not to be confused with the Trainer Profile Status** (J-13/AC-9's
 * Active/Idle/Suspended/Expired), which `BR-0408` keeps internal-only and which
 * is deliberately absent from this whole contract — see the file header.
 */
export interface LockedProfileFactsDto {
  /** Row 1 — set at accreditation, never by the trainer. */
  /**
   * ⚠️ **Null for somebody with no Expert Hub trainer file.** A classification
   * is a fact about an accredited trainer; the placeholder the platform uses
   * while the tiering rules are undefined resolves to `certified`, so filling
   * it here would tell a person the Academy had accredited them when it has
   * not (`P-257`).
   */
  readonly classification: TrainerClassification | null;
  /** Row 2 — the calculated indicator; `null` until one exists (`02D`, P-06). */
  readonly evaluationOverall: number | null;
  /** Row 3 — `null` before an agreement exists (i.e. before J-11 completes). */
  readonly agreementStatus: ProfileAgreementStatus | null;
  /** Shown with the status so "expires soon" is legible; `null` when no agreement. */
  readonly agreementEndsAt: string | null;
}

export interface ProgramHistoryDto {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly year: number;
}

export interface CertificateDto {
  readonly id: string;
  readonly name: string;
}

/** Rating availability (P-06) — calculated, momentarily pending, or unavailable. */
export type RatingState = 'calculated' | 'pending' | 'unavailable';

export interface ProgramRatingDto {
  readonly program: string;
  /** 0–5, `.5` increments (calculated). */
  readonly score: number;
}

export interface ProfileRatingsDto {
  readonly state: RatingState;
  /** Calculated overall; `null` unless `state === 'calculated'`. */
  readonly overall: number | null;
  readonly lastRefreshedAt: string | null;
  readonly programs: readonly ProgramRatingDto[];
}

/** What the trainer submits when saving the editable fields (J-14/F1/AC-4). */
export type ProfileFieldValues = Readonly<Record<string, ApplicationFieldValue>>;

/**
 * J-09/F6 — bank data, collected **after preliminary approval**, not on the
 * original application form (AC-2). All eight fields are mandatory (AC-3).
 *
 * ⚠️ Open item carried from J-09: whether this becomes part of the trainer's
 * permanent profile (reused for renewals/future agreements) or is collected
 * fresh each time is **not yet confirmed**. It is modelled on the profile here
 * because AC-2 says the fields "open in their profile" — but the persistence
 * question affects J-14/J-15 and is flagged rather than assumed.
 */
export interface BankDataFields {
  readonly bankCountry: string;
  readonly bankCity: string;
  readonly bankName: string;
  readonly branchName: string;
  readonly iban: string;
  readonly swiftCode: string;
  readonly accountHolderName: string;
  readonly accountNumber: string;
}

/** Where the trainer stands in the J-09/F6 bank-data request. */
export type BankDataRequestState = 'not-requested' | 'requested' | 'complete';

export interface ProfileBankDataDto {
  /** `not-requested` → the section is not shown at all (AC-1/AC-2). */
  readonly state: BankDataRequestState;
  /** Present once saved; `null` while awaiting completion. */
  readonly fields: BankDataFields | null;
  readonly requestedAt: string | null;
  readonly completedAt: string | null;
  /**
   * What the Academy already holds for this person, offered as a starting point
   * (`P-229`). **Partial on purpose** — only the fields the Academy actually
   * has, because a form pre-filled with blanks it presents as known is worse
   * than an empty one.
   *
   * ⚠️ **Separate from `fields` deliberately.** `fields` is what the trainer
   * confirmed and is what `AC-4` acts on; this is only what we think we know.
   * Nothing here is saved until they press the button.
   */
  readonly suggested?: Partial<BankDataFields> | null;
}

export const EMPTY_BANK_DATA: BankDataFields = {
  bankCountry: '',
  bankCity: '',
  bankName: '',
  branchName: '',
  iban: '',
  swiftCode: '',
  accountHolderName: '',
  accountNumber: '',
};

/** The eight mandatory field ids, in the order J-09/F6/AC-3 lists them. */
export const BANK_DATA_FIELD_ORDER = [
  'bankCountry',
  'bankCity',
  'bankName',
  'branchName',
  'iban',
  'swiftCode',
  'accountHolderName',
  'accountNumber',
] as const satisfies readonly (keyof BankDataFields)[];

export type BankDataFieldId = (typeof BANK_DATA_FIELD_ORDER)[number];

/** J-09/F6/AC-3 — every field is mandatory; returns the ids still missing. */
export function validateBankData(fields: BankDataFields): readonly BankDataFieldId[] {
  return BANK_DATA_FIELD_ORDER.filter((id) => fields[id].trim() === '');
}

/** The bank fields J-09's «Bank Data Field Validation Rules» give a format to. */
export type BankDataFormatFieldId = 'iban' | 'swiftCode' | 'accountNumber';

/**
 * J-09 «Bank Data Field Validation Rules» (AC-5), the same rules the API
 * enforces on save: IBAN is "SA" + 22 digits; SWIFT is 8 or 11 characters in
 * BIC shape (4-letter bank, 2-letter country, 2-character location, optional
 * 3-character branch); the account number is digits only. Letters are matched
 * case-insensitively. Returns the ids of filled fields that break their rule —
 * an empty field is `validateBankData`'s to report.
 */
export function invalidBankDataFields(fields: BankDataFields): readonly BankDataFormatFieldId[] {
  const rules: Readonly<Record<BankDataFormatFieldId, RegExp>> = {
    iban: /^SA[0-9]{22}$/i,
    swiftCode: /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i,
    accountNumber: /^[0-9]+$/,
  };
  return (Object.keys(rules) as BankDataFormatFieldId[]).filter((id) => {
    const value = fields[id].trim();
    return value !== '' && !rules[id].test(value);
  });
}

/** One further degree the Academy holds, beyond the one in the fields. */
export interface AcademyEducationDto {
  readonly qualification: string | null;
  readonly specialization: string | null;
  /** The awarding institution — FAST calls this `donor`. */
  readonly institution: string | null;
  readonly obtainedAt: string | null;
}

/** One further professional certification the Academy holds. */
export interface AcademyCertificationDto {
  readonly name: string | null;
  readonly institution: string | null;
  readonly obtainedAt: string | null;
  /** The document's file name. ⚠️ Not a link — the URL points at the Academy
   *  portal and nobody has confirmed it opens for an Expert Hub session. */
  readonly fileName: string | null;
}

/**
 * What the Academy holds that the form's single set of fields could not.
 *
 * ⚠️ **The overflow, never a second copy.** The entry already showing in the
 * form's own fields is excluded server-side, so each qualification appears
 * exactly once on the page (`P-265`).
 */
/**
 * One trainer contract the Financial Academy holds.
 *
 * ⚠️ **The Academy's document, not an Expert Hub agreement.** Whether the two
 * are the same artefact is unanswered, so it is read-only and the page names
 * its source. No approve, no refuse, no download (`P-266`).
 */
export interface AcademyContractDto {
  readonly reference: string | null;
  readonly status: string | null;
  readonly startsAt: string | null;
  readonly endsAt: string | null;
}

export interface AcademyRecordsDto {
  readonly education: readonly AcademyEducationDto[];
  readonly certifications: readonly AcademyCertificationDto[];
  readonly contracts: readonly AcademyContractDto[];
  /** When the record was read. It is only ever this fresh. */
  readonly syncedAt: string | null;
}

export interface MyProfileDto {
  /**
   * ⚠️ `false` when the person holds the trainer role from the Academy but
   * Expert Hub has no trainer file for them yet. The page renders either way
   * and marks what is missing rather than failing to load (`P-257`).
   */
  readonly establishedInExpertHub: boolean;
  /** Identity (SSO-sourced; `email` read-only). */
  readonly displayName: string;
  readonly email: string;
  /**
   * Optional profile photo URL. `null` → the `Avatar` shows initials (a clean
   * built-in placeholder). This is the seam a real uploaded/SSO photo plugs into;
   * production photo upload shares the blocked file pipeline (`G26`/`G27`).
   */
  readonly avatarUrl: string | null;
  /**
   * ⚠️ **Null for somebody with no Expert Hub trainer file.** A classification
   * is a fact about an accredited trainer; the placeholder the platform uses
   * while the tiering rules are undefined resolves to `certified`, so filling
   * it here would tell a person the Academy had accredited them when it has
   * not (`P-257`).
   */
  readonly classification: TrainerClassification | null;
  /**
   * **J-14/F1/AC-1** — the *same* schema the J-01 application form renders, not
   * a profile-specific one. Server-supplied, so the two can never drift.
   */
  readonly formSchema: ApplicationFormSchemaDto;
  /**
   * Current values, keyed by the schema's field ids.
   *
   * ⚠️ For a **repeatable** section (`dm-gap-01.2026-09-21`) this map is the
   * FIRST entry only — see `entries` below and `profileEntries`.
   */
  readonly fieldValues: ProfileFieldValues;
  /**
   * Every repeatable section's entries, keyed by section id — the same shape
   * the draft/application wire already carries (`ApplicationDraftDto.entries`).
   *
   * ⚠️ **THE SEAM. No response carries this today.** `GET v1/me/profile`
   * serves a flat `FieldValues` map and nothing else: `MyProfileWire`
   * (`backend/src/ExpertHub.Api/Profiles/ProfileEndpoints.cs`)
   * serves it from `TrainerEntriesAsync`, which groups the trainer's own
   * value rows through the SAME helper the application uses — so a trainer
   * approved with three qualifications carries three here.
   *
   * Optional because a form version with no repeatable section has none, and
   * because `fieldValues` remains the whole answer for every non-repeatable
   * section. `profileEntries` reads it and is the ONE place the page asks.
   */
  readonly entries?: Readonly<Record<string, readonly ApplicationEntryDto[]>>;
  /** Per-field editability + FAST pending state (P-16, P-J9). */
  readonly fieldStates: readonly ProfileFieldStateDto[];
  /** J-14/F2 — visible, never editable, updated only from their source. */
  readonly lockedFacts: LockedProfileFactsDto;
  /** Approved scope (read-only, FAST) — `BR-0403` per-service independent. */
  readonly services: readonly ApplicationService[];
  readonly specialties: readonly DirectorySpecialty[];
  readonly programs: readonly ProgramHistoryDto[];
  readonly ratings: ProfileRatingsDto;
  readonly certificates: readonly CertificateDto[];
  /**
   * ⚠️ `null` means the Academy's record has never been read. Empty lists mean
   * «read, and there is nothing beyond what the fields already show» — a
   * different statement, which the page makes differently.
   */
  readonly academyRecords: AcademyRecordsDto | null;
  /** Visibility consent — drives the public directory (`BR-1002/1007`). */
  readonly visibilityConsent: boolean;
  /** J-09/F6 — opens only after preliminary approval; absent before that. */
  readonly bankData: ProfileBankDataDto;
  /** `false` → the FAST section is momentarily unreachable (P-17): show
   *  last-known + timestamp, the rest of the page still renders (`§11`). */
  readonly fastAvailable: boolean;
  /** `P-331` — the short bio. `null` with no trainer file: a bio belongs to an
   *  accredited trainer. */
  readonly bio: TrainerBioDto | null;
}

/**
 * The short bio's state (`P-331`, UI-15). The AI drafts it from the CV, the
 * trainer edits and submits it, staff approve it, and only the approved text
 * (`published`) appears anywhere else — publicly only with visibility consent.
 */
export type TrainerBioStatus =
  'none' | 'drafting' | 'ai_draft' | 'ai_unavailable' | 'pending_review' | 'returned' | 'approved';

export interface TrainerBioDto {
  readonly status: TrainerBioStatus;
  /** The trainer's working copy — what review is about. */
  readonly draft: string | null;
  readonly draftSource: 'ai' | 'trainer' | null;
  /** The last approved text; it stays public while an edit is under review. */
  readonly published: string | null;
  /** Why staff sent it back, when they did. */
  readonly reviewNote: string | null;
  /** Sent back with every action, so nobody acts on a version they did not see. */
  readonly revision: number;
  /** Whether there is a CV to draft from. */
  readonly hasCv: boolean;
}

/** The longest bio the server accepts. */
export const BIO_MAX_LENGTH = 600;

/**
 * **The entries seam — the profile's single call site for repeatable data.**
 *
 * Reuses the application form's own adapter (`normalizeEntries`), so the
 * profile and the form read a trainer's qualifications the same way and cannot
 * disagree: a served `entries` map wins, and its absence — which is every
 * response the API sends today, see `MyProfileDto.entries` — means exactly one
 * entry built from the flat `fieldValues`, which is the historical shape.
 *
 * Nothing else on the page asks about entries, so the day the endpoint grows
 * the payload this function is the only thing that has to notice.
 */
export function profileEntries(
  profile: Pick<MyProfileDto, 'formSchema' | 'fieldValues' | 'entries'>
): Readonly<Record<string, readonly ApplicationEntryDto[]>> {
  return normalizeEntries(profile.formSchema, {
    values: profile.fieldValues,
    entries: profile.entries,
  });
}
