/**
 * EH-PUB-02 / EH-PUB-03 (Public Trainer Directory + Public Trainer Profile)
 * contracts — CAP-10, journey **J-24**. A **public, consent-gated projection**
 * of the accredited trainer base.
 *
 * **The public field list is exhaustive, and short.** J-24/F2/AC-1 (`BR-1004`
 * *corrected*) states the public profile displays exactly: name, domain,
 * specialization, and the programs delivered with the Academy — "with no
 * financial or sensitive personal data". Anything not on that list is not
 * public, so it does not appear on these DTOs at all: the projection cannot leak
 * a field it has no shape for.
 *
 * Removed 2026-08-19 to conform to J-24 (see `DECISIONS.md` P-40/P-41):
 * - `bio` / `briefBio` — `BR-1004` corrected is explicit that there is **no
 *   free-text bio field, since none exists** on the core profile. Displaying one
 *   meant displaying invented data.
 * - `rating` / `ratingBreakdown` — J-24's open item records that public
 *   evaluation display is "fully removed from this journey for now". These were
 *   previously surfaced on an explicit product-owner instruction that predates
 *   the journey; the owner confirmed the journey supersedes it.
 * - `classification`, `yearsExperience`, `traineesTrained` — not in AC-1's
 *   enumeration, which the owner confirmed is exhaustive.
 *
 * **Consent-gated + privacy-preserving** (`BR-1002`/`BR-1007`, J-23): only
 * trainers with visibility consent appear, and a withdrawn or absent consent
 * resolves to a neutral not-found *indistinguishable* from a non-existent id —
 * the service returns the same `404` for both, so the directory cannot be used
 * to probe whether a person is registered.
 *
 * Consumed **only** through `directoryService`; this public page makes no direct
 * FAST/MTM call — it reads the Expert-Hub-owned projection, which updates
 * automatically from the core profile (`BR-1005`, J-24/F2/AC-2).
 *
 * ⚠️ The specialty taxonomy below is clearly-labelled **mock config**; the
 * authoritative public whitelist is governed by `G12` (still open).
 *
 * ⚠️ **Open:** J-24 and J-15 treat *domain* and *specialization* as distinct
 * concepts, but only specialization is modelled today. `Q16` tracks it — no
 * domain taxonomy is invented here.
 */

/**
 * Specialty taxonomy the cards label (mock config — `G12`). **Not a filter**: no
 * taxonomy maps a real trainer onto a specialty (`Q16`), so the chip rail
 * answered «nobody» and the API now refuses `specialty` with 400.
 */
export const DIRECTORY_SPECIALTIES = [
  'leadership',
  'finance',
  'digital-transformation',
  'data-analytics',
  'human-resources',
  'project-management',
  'cybersecurity',
  'customer-experience',
] as const;

export type DirectorySpecialty = (typeof DIRECTORY_SPECIALTIES)[number];

/**
 * Trainer classification. **Not a public field** — J-24/F2/AC-1 does not list
 * it, so it never appears on the public DTOs above. It stays here because the
 * trainer's own profile (EH-TP-04) and the internal views consume the same
 * vocabulary.
 */
export const TRAINER_CLASSIFICATIONS = ['expert', 'senior', 'certified'] as const;

export type TrainerClassification = (typeof TRAINER_CLASSIFICATIONS)[number];

/** One directory result card — J-24's public fields only. */
export interface PublicTrainerSummaryDto {
  readonly id: string;
  readonly name: string;
  readonly specialties: readonly DirectorySpecialty[];
  /** A count of what the profile already publishes in full. */
  readonly programsDelivered: number;
  /**
   * ⚠️ Public since the owner's ruling of 2026-09-09. `J-24/F2/AC-1` had
   * omitted it and a test asserted it never reached a public payload — the
   * Academy's accreditation of somebody is what a directory of accredited
   * people is for.
   */
  readonly classification: TrainerClassification;
  /**
   * `P-335` — the personal photo, as an API path (`/v1/directory/{id}/photo`),
   * or `null` when there is none. Never an attachment id.
   */
  readonly photoUrl: string | null;
}

/** A program the trainer delivered with the Academy (J-24/F2/AC-1). */
export interface PublicDeliveredProgram {
  // No id — the `TRAINER_RECORD` key is internal and is not published (`P-335`).
  readonly name: string;
  /** Delivery year — the only temporal detail the public view carries. */
  readonly year: number;
}

/**
 * One public profile (EH-PUB-03). The summary fields plus the delivered
 * programs — which is the entirety of what J-24/F2/AC-1 permits.
 */
export interface PublicTrainerProfileDto extends PublicTrainerSummaryDto {
  readonly deliveredPrograms: readonly PublicDeliveredProgram[];
  /** `P-331` — the APPROVED short bio, never a draft; `null` when there is none. */
  readonly bio: string | null;
}

/** The Filter-Bar state the directory holds (P-11 public variant). */
export interface DirectoryFilters {
  readonly search: string;
  // No `specialty` — see `DIRECTORY_SPECIALTIES` (`Q16`).
}

export const DEFAULT_DIRECTORY_FILTERS: DirectoryFilters = {
  search: '',
};

export function hasActiveDirectoryFilters(filters: DirectoryFilters): boolean {
  return filters.search.trim() !== '';
}

/** Public directory list query (paging + search). */
export interface DirectoryQuery {
  /** 1-based page index. */
  readonly page: number;
  readonly pageSize: number;
  /** Free-text search over the trainer's name — all the API matches. */
  readonly search?: string;
}

/** `CAP-API-*` public directory response: one page of consented trainers. */
export interface DirectoryListDto {
  readonly items: readonly PublicTrainerSummaryDto[];
  /** Count after search/filters (drives pagination). */
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly pageCount: number;
  /** Total consented trainers, unfiltered (drives the results heading count). */
  readonly totalConsented: number;
  /**
   * Presentation-only aggregates over the **whole consented set** (server-derived,
   * unfiltered) — the hero highlight figures. Derived counts of the displayed
   * data, not invented business metrics (same precedent as EH-TP-02 summary cards).
   *
   * Both aggregate a **public** field. The former `expertCount` was dropped on
   * 2026-08-19: it aggregated `classification`, which J-24/F2/AC-1 does not make
   * public, and an aggregate over a private field is still a disclosure of it.
   */
  readonly specialtiesRepresented: number;
  readonly programsDelivered: number;
}
