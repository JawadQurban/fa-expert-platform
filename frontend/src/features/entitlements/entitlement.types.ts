import type { LocalizedText } from '../../shared/types/localizedText';

/**
 * Financial entitlement contracts — **CAP-06** (`BRD-TRN-001` §8.6), catalogued
 * as journey **J-28**.
 *
 * ⚠️ **Built from the BRD, not from a journey.** J-28 has no journey document
 * (`Q17`), but §8.6 supplies the entity, three features and four business rules
 * — enough to build against, and the BRD is the authority the journeys were
 * derived from. Where §8.6 is silent, nothing is invented; the gaps are named
 * below and tracked as `Q27`.
 *
 * The capability's own definition is the strongest constraint in it:
 *
 * > «لا تحتسب هذه القدرة أي مبلغ ولا تُنشئ أي أمر صرف بنفسها، دورها العرض
 * > والتتبع فقط»
 *
 * *This capability calculates no amount and creates no disbursement order — its
 * role is display and tracking only.* Four rules follow, and all four are
 * encoded structurally:
 *
 * 1. **`BR-0601` — nothing is ever entered or edited by hand.** Status, amount
 *    and date are "consumed whole from ERP". So this contract has **no input
 *    type and no write operation anywhere**: there is nothing to submit, patch
 *    or correct. The rule cannot be broken because there is no door.
 * 2. **`BR-0602` — every entitlement links PO → agreement → programme.** The
 *    complete record carries all three, non-nullable.
 * 3. **`BR-0603` — an incompletely-linked entitlement stays hidden from the
 *    trainer.** This is why there are **two DTOs rather than one with a flag**:
 *    `TrainerEntitlementDto` has no way to express an incomplete link, so a
 *    record the trainer must not see cannot even be constructed in their shape.
 *    Staff get the union, because answering the trainer's question is exactly
 *    what `US-0602` is for.
 * 4. **`BR-0605` — there is no dispute path in this release.** No operation
 *    raises one, and the copy says enquiries are handled outside the platform:
 *    a trainer who thinks an amount is wrong should not hunt for a button that
 *    was never going to be there.
 *
 * ⚠️ **`BR-0604` does not exist.** §8.6.5 numbers its rules 0601, 0602, 0603,
 * 0605 — the gap is in the source document, not a transcription slip here.
 */

/* ------------------------------------------------------------------ *
 * `BR-0602` — the linkage chain
 * ------------------------------------------------------------------ */

/**
 * The three hops `BR-0602` requires: the ERP purchase order, through it the
 * active agreement (CAP-03), and the specific engagement/programme (CAP-05).
 * Named as a union so an incomplete record can say *which* hop is missing.
 */
export const LINKAGE_STEPS = ['purchase-order', 'agreement', 'programme'] as const;

export type LinkageStep = (typeof LINKAGE_STEPS)[number];

/* ------------------------------------------------------------------ *
 * The ERP values — consumed, never computed
 * ------------------------------------------------------------------ */

/**
 * The disbursement status as ERP supplies it.
 *
 * ⚠️ **§8.6 never enumerates the values** (`Q27`). Rather than invent a union,
 * the code and its bilingual label arrive together and are rendered as given —
 * the same handling as FAST's cancellation reasons (P-108). A status the
 * platform does not recognise still displays correctly, because the platform is
 * not required to recognise any of them.
 */
export interface DisbursementStatusDto {
  /** ERP's own code. Opaque here, by design. */
  readonly code: string;
  readonly label: LocalizedText;
}

/** The money, exactly as ERP sent it. Nothing here is computed (`BR-0601`). */
export interface DisbursementAmountDto {
  readonly value: number;
  readonly currency: string;
}

/* ------------------------------------------------------------------ *
 * What the trainer sees — `F-0601`
 * ------------------------------------------------------------------ */

/**
 * `US-0601` — "the status, the amount and the date for each programme I
 * delivered, tied to the programme by name".
 *
 * **Every linkage field is non-nullable, and that is `BR-0603` as a type.** A
 * record whose chain is incomplete "stays hidden from the trainer", so it never
 * reaches this shape at all — there is no `null` to check and no flag to
 * mis-read.
 */
export interface TrainerEntitlementDto {
  readonly entitlementId: string;
  /** `BR-0602` — the ERP purchase order the record hangs from. */
  readonly purchaseOrderNumber: string;
  /** `BR-0602` — via the PO, the active agreement in CAP-03. */
  readonly agreementReference: string;
  /** `US-0601` — "tied to the programme by name specifically". */
  readonly programName: LocalizedText;
  readonly status: DisbursementStatusDto;
  readonly amount: DisbursementAmountDto;
  /** `null` until ERP reports a disbursement date — the amount may be pending. */
  readonly disbursementDate: string | null;
}

/* ------------------------------------------------------------------ *
 * What staff see — `F-0602`
 * ------------------------------------------------------------------ */

/**
 * `US-0602` — "the entitlement record for each trainer, tied to their agreement
 * and their programmes, so I can answer their questions without going back to
 * separate files".
 *
 * Staff see **both** kinds, and the incomplete member names the missing hops —
 * because "why can't I see my payment?" is precisely the question this feature
 * exists to answer, and «الربط غير مكتمل» is the answer.
 */
export type StaffEntitlementDto =
  | ({
      readonly linkage: 'complete';
      readonly trainerId: string;
      readonly trainerName: string;
    } & TrainerEntitlementDto)
  | {
      readonly linkage: 'incomplete';
      readonly entitlementId: string;
      readonly trainerId: string;
      readonly trainerName: string;
      /** Present only where ERP supplied it — the rest of the chain is why. */
      readonly purchaseOrderNumber: string | null;
      readonly agreementReference: string | null;
      readonly programName: LocalizedText | null;
      readonly status: DisbursementStatusDto;
      readonly amount: DisbursementAmountDto;
      readonly disbursementDate: string | null;
      /** `BR-0603` — which hops of `BR-0602`'s chain are still missing. */
      readonly missingLinks: readonly LinkageStep[];
    };

/**
 * `BR-0603`, named once. A record is the trainer's to see only when the whole
 * chain resolved — the server decides this, and the two DTOs make the decision
 * visible in the types rather than buried in a query.
 */
export function isVisibleToTrainer(
  entitlement: StaffEntitlementDto
): entitlement is Extract<StaffEntitlementDto, { linkage: 'complete' }> {
  return entitlement.linkage === 'complete';
}

/* ------------------------------------------------------------------ *
 * Staff query
 * ------------------------------------------------------------------ */

/**
 * `US-0602` is per trainer — staff look someone up to answer their call. The
 * filter is deliberately thin: this screen answers "what does this trainer's
 * record say", not "report on disbursements", which is CAP-09's job.
 */
export interface EntitlementQuery {
  /** Free text over the trainer's name. */
  readonly trainer: string;
  /** `BR-0603` — staff can isolate the records their trainer cannot see. */
  readonly onlyIncomplete: boolean;
}

export const DEFAULT_ENTITLEMENT_QUERY: EntitlementQuery = {
  trainer: '',
  onlyIncomplete: false,
};

export function hasActiveEntitlementQuery(query: EntitlementQuery): boolean {
  return query.trainer.trim() !== '' || query.onlyIncomplete;
}
