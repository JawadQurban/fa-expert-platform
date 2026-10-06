/**
 * Identity Linking contracts — the **prerequisite layer** J-01 defines before
 * form completion begins ("Supporting Rule Set — not a feature", CAP-01).
 *
 * J-01 resolves two *independent* questions before an applicant may fill
 * anything in:
 *
 * 1. **Who is this person?** — identity verification, whose method depends on ID
 *    type: **Yaqeen** for citizens and residents, **manual entry** for
 *    foreigners and GCC nationals, for whom "no Yaqeen call exists".
 * 2. **Do they already have an account or application?** — account resolution,
 *    whose *timing* depends on the same choice: citizens/residents are matched
 *    the moment Yaqeen succeeds, foreigners/GCC only **at submission**, by email.
 *
 * The two are modelled as two types and two service calls, not one combined
 * "login" step, because J-01 stresses they are independent — and because
 * **verification ≠ eligibility** (governing rule 3): Yaqeen confirms who someone
 * is, and says nothing about whether they may apply.
 *
 * ⚠️ **The verification contract is open.** Yaqeen (يقين) reached THROUGH FAST,
 * payloads, token exchange — is not settled. What J-01 *does* settle is every
 * rule above it: the two paths, the matching timing, and the five edge-case
 * outcomes. Those are built here against a labelled mock; when `G4` closes, the
 * provider behind `identityService` changes and no UI logic does.
 */

/**
 * Which verification path applies. This is the applicant's own declaration, and
 * it decides everything downstream — J-01 §3A.
 */
export const ID_TYPES = ['citizen-resident', 'foreigner-gcc'] as const;

export type IdType = (typeof ID_TYPES)[number];

/** J-01 §3A — Yaqeen exists for exactly one of the two paths. */
export function usesYaqeen(idType: IdType): boolean {
  return idType === 'citizen-resident';
}

/* ------------------------------------------------------------------ *
 * 1. Identity verification — J-01 §3A
 * ------------------------------------------------------------------ */

export interface YaqeenVerificationInput {
  /** National ID / Iqama number. */
  readonly nationalId: string;
  /** Date of birth, ISO `YYYY-MM-DD`. */
  readonly dateOfBirth: string;
}

/**
 * Manual identity entry for foreigners and GCC nationals. J-01 is explicit that
 * this path has **no verification service** — the platform records what the
 * applicant states and moves on, so this input produces an *unverified* identity
 * by design, not by omission.
 */
export interface ManualIdentityInput {
  readonly documentNumber: string;
  readonly dateOfBirth: string;
  readonly fullName: string;
}

/**
 * A resolved identity. `verified` is `true` only on the Yaqeen path: recording
 * the difference matters because the trusted auto-filled fields exist only there
 * (J-01 §3A), and because the *timing* of account matching depends on it.
 */
export interface ResolvedIdentityDto {
  readonly idType: IdType;
  readonly verified: boolean;
  /**
   * Yaqeen's trusted fields, auto-filled into the form on success. Empty on the
   * manual path — nothing is trusted there, so nothing is prefilled as trusted.
   */
  readonly trustedFields: Readonly<Record<string, string>>;
  /** Display name, from Yaqeen or from the applicant's own entry. */
  readonly fullName: string;
}

/* ------------------------------------------------------------------ *
 * 2. Account resolution — J-01 §3B and the §5 edge-case table
 * ------------------------------------------------------------------ */

/**
 * The five outcomes of J-01's decision table, as one closed union. Each maps to
 * exactly one row, so a sixth behaviour cannot be introduced without amending
 * the journey first:
 *
 * - `no-match` — treated as a guest through the form; the account is
 *   auto-provisioned **only at submission**, then linked.
 * - `matched-eligible` — a matched account whose previous application is closed
 *   (rejected/expired). A new application is allowed, with basic data prefilled.
 * - `blocked-trainer` — the account holds an **active Trainer role**. Blocked,
 *   and redirected to add a service instead (→ **J-03**, never a new J-01).
 * - `blocked-open-application` — an open/active application exists. Blocked,
 *   with a link to track the existing one.
 * - `deferred` — foreigner/GCC. No live match is possible, so resolution is
 *   deliberately **postponed to submission**, by email.
 */
export type AccountResolutionOutcome =
  'no-match' | 'matched-eligible' | 'blocked-trainer' | 'blocked-open-application' | 'deferred';

export interface AccountResolutionDto {
  readonly outcome: AccountResolutionOutcome;
  /** Present on `matched-eligible` — the basic data J-01 says to auto-fill. */
  readonly prefill: Readonly<Record<string, string>>;
  /** Present on `blocked-open-application`, so the UI can link to it. */
  readonly existingApplicationId: string | null;
}

/**
 * `true` for the two rows of J-01 §5 that stop the applicant. Named once so
 * every caller asks the same question, and so adding an outcome forces a
 * deliberate answer here rather than defaulting to "allowed".
 */
export function isBlockedOutcome(outcome: AccountResolutionOutcome): boolean {
  return outcome === 'blocked-trainer' || outcome === 'blocked-open-application';
}

/* ------------------------------------------------------------------ *
 * The combined session the form runs under
 * ------------------------------------------------------------------ */

/**
 * What the form needs to know about who is filling it.
 *
 * **Governing rule 2** — "a guest can fill the form, but cannot save a draft
 * until logged in / account created". `canSaveDraft` is therefore a property of
 * the identity session, not of the form: the form asks one question and gets one
 * answer, instead of re-deriving the rule from `authenticated` at each call site.
 */
export interface IdentitySessionDto {
  readonly identity: ResolvedIdentityDto;
  readonly resolution: AccountResolutionDto;
  /** `true` once an account exists — signed in, or matched and linked. */
  readonly accountLinked: boolean;
  /** Governing rule 2. `false` for every guest, on either path. */
  readonly canSaveDraft: boolean;
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

export type IdentityValidationCode =
  | 'national-id-required'
  | 'national-id-format'
  | 'dob-required'
  | 'document-number-required'
  | 'full-name-required';

/**
 * Field-shape checks only. Whether the identity is *real* is Yaqeen's answer,
 * and whether the person may apply is the account resolution's — J-01's
 * governing rule 3 keeps those three questions apart, so this function must not
 * pretend to answer any but the first.
 *
 * ⚠️ The Saudi national ID / Iqama is 10 digits. That is a documented public
 * format, not an invented business rule; the real check-digit validation belongs
 * to Yaqeen, through FAST.
 */
export function validateYaqeenInput(
  input: YaqeenVerificationInput
): readonly IdentityValidationCode[] {
  const issues: IdentityValidationCode[] = [];
  const id = input.nationalId.trim();
  if (id === '') {
    issues.push('national-id-required');
  } else if (!/^\d{10}$/.test(id)) {
    issues.push('national-id-format');
  }
  if (input.dateOfBirth.trim() === '') {
    issues.push('dob-required');
  }
  return issues;
}

export function validateManualIdentity(
  input: ManualIdentityInput
): readonly IdentityValidationCode[] {
  const issues: IdentityValidationCode[] = [];
  if (input.documentNumber.trim() === '') {
    issues.push('document-number-required');
  }
  if (input.dateOfBirth.trim() === '') {
    issues.push('dob-required');
  }
  if (input.fullName.trim() === '') {
    issues.push('full-name-required');
  }
  return issues;
}
