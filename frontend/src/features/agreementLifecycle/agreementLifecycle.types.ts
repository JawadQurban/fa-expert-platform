import type { LocalizedText } from '../../shared/types/localizedText';
import type { ApplicationService } from '../applications/application.types';
import type { ProfileAgreementStatus } from '../profile/profile.types';
import type { ReminderMilestone } from '../../shared/types/sla';

/**
 * EH-INT-06 — Agreement Lifecycle contracts (CAP-03, journey **J-12**). Begins
 * where J-11 ends: an agreement is active, and from here it is tracked, renewed,
 * suspended or ended.
 *
 * **The status union is `ProfileAgreementStatus`, imported, not redeclared.**
 * EH-TP-04 already shows the trainer their agreement's state (P-54), served by a
 * mock precisely until this journey existed. J-12 is the real producer, so it
 * must produce *that* union — importing it is what guarantees the two can never
 * drift into two vocabularies for one fact.
 *
 * Three journey rules are encoded **structurally**:
 *
 * 1. **The term length is server-derived, never an input** (F2/AC-2, `BR-0302`,
 *    D-07): 1 year for a first accreditation, 3 years for every renewal.
 *    `nextTermYears` arrives decided. A staff member who could type a duration
 *    could break the rule; there is no field to type it into.
 * 2. **Renewal never routes back through screening or interview** (F2/AC-1,
 *    `BR-0304`). The action union has no such member, so the direct path is the
 *    only representable one — the same shape as J-03/F3/AC-1.
 * 3. **The expiry date is calculated, never entered** (F1/AC-1, `BR-0301`). It
 *    appears on the DTO and in no input anywhere.
 *
 * ⚠️ **Deltas from `04` EH-INT-06**, resolved in the journey's favour (P-20):
 * - The page spec says renewal grants "a new 3-year term". J-12/F2/AC-2 is
 *   **1 year first, 3 years subsequent** — the page spec collapsed the rule.
 * - The page spec lists "add annex" as an action here. **J-12's scope explicitly
 *   defers it**: "Addendum handling for new services is already covered in
 *   J-03/F3 and is *referenced here, not rebuilt*." It is therefore absent, and
 *   EH-INT-02b owns it.
 *
 * ⚠️ **Needs Confirmation** — J-12/F3/AC-1 says staff "can suspend it or end
 * it" and is silent on whether a suspension can be lifted. `04` EH-INT-06 §7
 * calls suspend "reversible" and terminate "terminal", and the journey does not
 * contradict that, so reactivation is modelled on the page spec's authority. See
 * `TODO.md` `Q18`.
 */

/** J-12's own vocabulary, and EH-TP-04's — one union, one source. */
export type AgreementStatus = ProfileAgreementStatus;

/**
 * **F1/AC-2 · AC-3 · AC-4** — which of `BR-0303`'s reminder thresholds an
 * agreement has reached. The *server* owns the arithmetic: business-day and
 * calendar handling is not the frontend's to approximate (P-J4).
 *
 * ⚠️ **Carries the number rather than naming it.** This was
 * `'90-days' | '30-days' | '5-days'` until 2026-08-27, which hard-coded in the
 * type the very values `BR-0705` makes configurable — the reminder schedule now
 * lives on the central deadline console (`SLA-0301`), and editing it there has
 * to change what this screen shows. The copy still reads «تنتهي خلال ٩٠ يومًا»;
 * it formats the number it is given.
 *
 * ⚠️ The **alerts themselves** — who is notified and how — are CAP-07's
 * (`EV-0301`…`EV-0303`, catalogued 2026-08-27). What is built here is the
 * milestone being *visible* to staff, which is a different thing from a
 * notification being sent.
 */
export type ExpiryMilestone = ReminderMilestone;

/** Stable key for a milestone — for filter values and React keys. */
export function milestoneKey(milestone: ExpiryMilestone): string {
  return milestone.kind === 'reminder' ? String(milestone.daysBefore) : milestone.kind;
}

/** One row of the agreements list. */
export interface AgreementSummaryDto {
  readonly id: string;
  readonly reference: string;
  readonly trainerId: string;
  readonly trainerName: string;
  /** The services this one agreement covers — D-05: one agreement per person. */
  readonly services: readonly ApplicationService[];
  readonly status: AgreementStatus;
  readonly startsAt: string;
  /** F1/AC-1 — calculated from the term at activation; never entered. */
  readonly endsAt: string;
  readonly expiryMilestone: ExpiryMilestone;
  /** Whole days to expiry; negative once past. Server-computed, render-only. */
  readonly daysToExpiry: number;
  /** 0 for a first accreditation; drives `nextTermYears` (F2/AC-2). */
  readonly renewalCount: number;
}

/** One recorded lifecycle event — the history `04` EH-INT-06 §6 asks for. */
export interface AgreementHistoryEntryDto {
  readonly id: string;
  readonly kind: 'activated' | 'renewed' | 'suspended' | 'reactivated' | 'ended';
  readonly at: string;
  readonly byName: string;
  /** Free-text note recorded with the action; `null` when none was given. */
  readonly note: string | null;
  /** Present on `renewed` — the term granted, for the record. */
  readonly termYears: number | null;
}

/**
 * What this viewer may do. **Server-decided** (P-J9): `04` EH-INT-06 §10 puts
 * renewal behind Manager and view behind Employee, and J-26 (roles/permissions)
 * has no document yet — so nothing here reads a role.
 */
export interface AgreementViewerDto {
  readonly canRenew: boolean;
  readonly canSuspend: boolean;
  readonly canEnd: boolean;
  readonly canReactivate: boolean;
}

export interface AgreementDetailDto extends AgreementSummaryDto {
  /**
   * **F2/AC-2 — server-derived, never an input.** 1 for a first accreditation,
   * 3 for every renewal (`BR-0302`, D-07). Present so the confirmation can state
   * the term the trainer is about to receive; absent from every input type.
   */
  readonly nextTermYears: number;
  /** The end date a renewal would produce — also calculated (F1/AC-1). */
  readonly renewedEndsAt: string;
  readonly history: readonly AgreementHistoryEntryDto[];
  /** `null` while document storage is unresolved (`G26`) — no dead link. */
  readonly documentUrl: string | null;
  readonly viewer: AgreementViewerDto;
}

/* ------------------------------------------------------------------ *
 * Lifecycle actions — F2 and F3
 * ------------------------------------------------------------------ */

/**
 * **F2** — renewal carries no duration, by design. `BR-0302` decides the term,
 * and a rule the server owns cannot be overridden by a field the client sends.
 */
export interface RenewAgreementInput {
  readonly kind: 'renew';
  readonly note: string;
}

/** **F3** — reversible; see the Needs-Confirmation note in the file header. */
export interface SuspendAgreementInput {
  readonly kind: 'suspend';
  readonly note: string;
}

export interface ReactivateAgreementInput {
  readonly kind: 'reactivate';
  readonly note: string;
}

/** **F3** — terminal. Distinct from `expired`, which is a lapse (J-13's matrix). */
export interface EndAgreementInput {
  readonly kind: 'end';
  readonly note: string;
}

/**
 * F2 + F3. There is deliberately **no `send-to-screening`** and **no
 * `add-annex`** member: the first is forbidden by F2/AC-1, and the second
 * belongs to J-03/F3, which J-12's scope says not to rebuild.
 */
export type AgreementLifecycleInput =
  RenewAgreementInput | SuspendAgreementInput | ReactivateAgreementInput | EndAgreementInput;

/**
 * Which actions the *status* permits, before the viewer's rights are applied.
 * Kept as one function so the state machine reads the same everywhere, rather
 * than being re-derived from a status string at each call site.
 */
export function allowedActions(
  status: AgreementStatus
): readonly AgreementLifecycleInput['kind'][] {
  switch (status) {
    case 'active':
      // F3/AC-1 — "given an ACTIVE agreement, then staff can suspend it or end
      // it". Renewal is also offered here: F2/AC-1 allows it for an agreement
      // "nearing **or past** expiry", and an active one nearing expiry is the
      // common case.
      return ['renew', 'suspend', 'end'];
    case 'suspended':
      return ['reactivate', 'end'];
    case 'expired':
      // F2/AC-1 — "nearing or past expiry": a lapsed agreement is renewable.
      return ['renew'];
    case 'ended':
      // Terminal. Nothing follows a deliberate ending.
      return [];
  }
}

/* ------------------------------------------------------------------ *
 * F4 — Agreement Template management
 * ------------------------------------------------------------------ */

/**
 * One structural field that auto-merges into every generated agreement
 * (`BR-0306`). This is the same list J-10 renders when preparing an agreement —
 * F4 is the screen that *defines* it, which is why `DM-GAP-16` being open is not
 * a blocker here: this page is where the answer would be entered.
 */
export interface TemplateFieldDefinitionDto {
  readonly id: string;
  readonly label: LocalizedText;
  readonly type: 'date' | 'text' | 'number';
  readonly required: boolean;
}

/**
 * **F4/AC-2** — "designed to support multiple templates in the future (one
 * template linkable to one or more services), even though a single unified
 * template currently serves all four services".
 *
 * `services` therefore exists now and lists all four. That is the journey giving
 * an explicit instruction to build for the plural case, not speculation on my
 * part — and it costs nothing today.
 */
export interface AgreementTemplateDto {
  readonly id: string;
  readonly name: string;
  readonly services: readonly ApplicationService[];
  /** The fixed legal text (`BR-0306`). */
  readonly bodyText: string;
  readonly fields: readonly TemplateFieldDefinitionDto[];
  readonly updatedAt: string;
  readonly updatedByName: string;
}

export interface SaveTemplateInput {
  readonly bodyText: string;
  readonly fields: readonly TemplateFieldDefinitionDto[];
}

export type TemplateValidationCode = 'body-required' | 'field-label-required';

/** F4/AC-1 — an empty template body would generate an empty agreement. */
export function validateTemplate(input: SaveTemplateInput): readonly TemplateValidationCode[] {
  const issues: TemplateValidationCode[] = [];
  if (input.bodyText.trim() === '') {
    issues.push('body-required');
  }
  if (input.fields.some((field) => field.label.ar.trim() === '')) {
    issues.push('field-label-required');
  }
  return issues;
}

/* ------------------------------------------------------------------ *
 * List query — `04` EH-INT-06 §17
 * ------------------------------------------------------------------ */

export interface AgreementFilters {
  /** Trainer name or agreement reference. */
  readonly search: string;
  readonly status: AgreementStatus | 'all';
  /**
   * F1 — surface the agreements that need attention first. A **reminder offset**
   * (`'90'`), `'expired'`, or `'all'`; the offsets come from the central row, so
   * the filter's options follow the console rather than a hard-coded list.
   */
  readonly milestone: string;
}

export const DEFAULT_AGREEMENT_FILTERS: AgreementFilters = {
  search: '',
  status: 'all',
  milestone: 'all',
};

export function hasActiveAgreementFilters(filters: AgreementFilters): boolean {
  return filters.search.trim() !== '' || filters.status !== 'all' || filters.milestone !== 'all';
}

export interface AgreementListDto {
  readonly items: readonly AgreementSummaryDto[];
  readonly totalCount: number;
  /** Unfiltered count inside any expiry milestone — the "needs attention" figure. */
  readonly expiringCount: number;
  /**
   * The reminder offsets configured centrally for this deadline (`SLA-0301`,
   * `BR-0705`), **served** so the milestone filter offers what the console
   * actually holds. The page must not carry a list of its own — that is how
   * 90/30/5 came to be hard-coded in three places.
   */
  readonly reminderOffsets: readonly number[];
}
