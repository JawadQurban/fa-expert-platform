import type { LocalizedText } from '../../shared/types/localizedText';
import type { ApplicationService } from '../applications/application.types';
import type { DirectorySpecialty, TrainerClassification } from '../directory/directory.types';
import type { ProfileAgreementStatus } from '../profile/profile.types';

/**
 * EH-INT-02b — Service Requests contracts (CAP-01/03, journey **J-03**, features
 * **F2** and **F3**). The internal half of add-service: the decision-maker
 * reviews a trainer's request to widen their scope, alongside that trainer's
 * full approved profile, and takes a single administrative decision.
 *
 * ⚠️ This screen has **no entry in `04_PAGE_SPECIFICATIONS`** — the page specs
 * predate the journeys and never modelled the internal side of J-03. It is built
 * from the journey, which outranks them on business logic (P-20).
 *
 * Four journey rules are encoded **structurally**:
 *
 * 1. **No screening, no interview** (F3/AC-1, `BR-0112`). The decision union has
 *    exactly two members — approve and reject. There is no "route to screening"
 *    to accidentally offer, so the direct path is the only representable one.
 * 2. **Approval is unrepresentable without the addendum** (F3/AC-4, `BR-0305`).
 *    The addendum is a *required field of the approve input*, not a second step
 *    guarded by a flag: an approval with no addendum cannot be constructed. The
 *    journey's "cannot be finalized until they upload" is therefore a fact about
 *    the type, not a check someone could forget.
 * 3. **Rejection always carries a reason** (F3/AC-3) — from the served list, or
 *    free text when the reason is `other`.
 * 4. **No new agreement, no new signature** (F3/AC-4). Nothing here creates an
 *    agreement or opens a signing sequence; the addendum attaches to the
 *    trainer's existing one.
 *
 * ⚠️ **Open items carried from J-03**, none of them invented here:
 * - *Decision-maker role* (Staff vs Manager) is unresolved, so authority is a
 *   server-decided `viewer.canDecide` (P-J9) rather than a role check.
 * - *Whether the rejection reason list is shared with CAP-02* is unresolved, so
 *   the list is **served as configuration** on the detail rather than imported
 *   from the screening feature. Either answer leaves this UI unchanged.
 * - *Re-request after rejection* (cooldown vs unrestricted) is unspecified, so no
 *   cooldown is enforced.
 */

/** Where a request stands. There is no "in screening" — F3/AC-1. */
export type ServiceRequestStatus = 'pending' | 'approved' | 'rejected';

/** One row of the decision-maker's queue (F2/AC-2). */
export interface ServiceRequestSummaryDto {
  readonly id: string;
  /** F1/AC-3 — generated at submission and linked to the request. */
  readonly reference: string;
  readonly trainerId: string;
  readonly trainerName: string;
  readonly requestedService: ApplicationService;
  readonly status: ServiceRequestStatus;
  readonly submittedAt: string;
}

/** The Filter Bar state the queue holds (P-11) — exactly F2/AC-2's dimensions. */
export interface ServiceRequestFilters {
  /** Trainer name. */
  readonly search: string;
  readonly service: ApplicationService | 'all';
  readonly status: ServiceRequestStatus | 'all';
}

export const DEFAULT_SERVICE_REQUEST_FILTERS: ServiceRequestFilters = {
  search: '',
  service: 'all',
  status: 'all',
};

export function hasActiveServiceRequestFilters(filters: ServiceRequestFilters): boolean {
  return filters.search.trim() !== '' || filters.service !== 'all' || filters.status !== 'all';
}

export interface ServiceRequestListDto {
  readonly items: readonly ServiceRequestSummaryDto[];
  readonly totalCount: number;
  /** Unfiltered count of requests still awaiting a decision. */
  readonly pendingCount: number;
}

/* ------------------------------------------------------------------ *
 * F2/AC-1 — the trainer's full approved profile, beside the request
 * ------------------------------------------------------------------ */

/**
 * "the decision-maker can view it **together with the trainer's full approved
 * profile**: current services, specializations, classification, evaluations, and
 * active agreement" — that list is exactly the shape below, so a decision is
 * never taken on the request in isolation.
 */
export interface TrainerContextDto {
  readonly trainerId: string;
  readonly name: string;
  readonly currentServices: readonly ApplicationService[];
  readonly specialties: readonly DirectorySpecialty[];
  readonly classification: TrainerClassification;
  /** The calculated indicator (`02D`); `null` until one exists. */
  readonly evaluationOverall: number | null;
  /** The active agreement the addendum will attach to. `null` would block F3/AC-4. */
  readonly agreement: {
    readonly reference: string;
    readonly status: ProfileAgreementStatus;
    readonly endsAt: string | null;
  } | null;
}

/** One delta field the trainer supplied (F1/AC-2), ready to read. */
export interface SubmittedFieldDto {
  readonly label: LocalizedText;
  readonly value: string;
}

export interface SubmittedAttachmentDto {
  readonly id: string;
  readonly label: LocalizedText;
  readonly fileName: string;
}

/** One selectable rejection reason, **served as configuration** (see header). */
export interface RejectionReasonOptionDto {
  readonly id: string;
  readonly label: LocalizedText;
  /** `true` for the "Other" entry, which requires free text (F3/AC-3). */
  readonly requiresText: boolean;
}

/** What was decided, once it has been. */
export interface ServiceRequestDecisionRecordDto {
  readonly kind: 'approve' | 'reject';
  readonly decidedAt: string;
  readonly decidedByName: string;
  /**
   * The selected reason id and its free text.
   *
   * ⚠️ **Internal only.** F3/AC-7: "the trainer is notified of the outcome —
   * **without** the rejection reason". Any trainer-facing surface built later
   * must not consume these two fields; they exist on the *internal* detail
   * because F3/AC-3 requires the decision-maker to record one.
   */
  readonly reasonId: string | null;
  readonly reasonText: string | null;
  /** F3/AC-4 — the addendum that made the approval finalizable. */
  readonly addendumFileName: string | null;
  /**
   * The stored addendum, openable. `null` for decisions recorded before the
   * upload existed — those carry the file name only, and show only the name.
   */
  readonly addendumUrl: string | null;
  readonly note: string | null;
}

export interface ServiceRequestViewerDto {
  /**
   * F3/AC-1 — "an authorized decision-maker". Which role that is remains open in
   * J-03, so authority arrives decided rather than inferred from a role string
   * (P-J9).
   */
  readonly canDecide: boolean;
  readonly blockedReason: 'not-authorized' | 'already-decided' | null;
}

export interface ServiceRequestDetailDto extends ServiceRequestSummaryDto {
  /** F2/AC-1 — never the request in isolation. */
  readonly trainerContext: TrainerContextDto;
  /** F1/AC-2 — only the delta the trainer was asked for. */
  readonly submittedFields: readonly SubmittedFieldDto[];
  readonly submittedAttachments: readonly SubmittedAttachmentDto[];
  /** Served config, not an imported constant — see the header's open items. */
  readonly rejectionReasons: readonly RejectionReasonOptionDto[];
  readonly decision: ServiceRequestDecisionRecordDto | null;
  readonly viewer: ServiceRequestViewerDto;
}

/* ------------------------------------------------------------------ *
 * The decision — F3
 * ------------------------------------------------------------------ */

/**
 * F3/AC-4 — the addendum to the trainer's **existing** agreement. `BR-0305`: no
 * new agreement is created and no additional e-signature is required, which is
 * why this carries a document and nothing resembling a signature.
 *
 * The file is uploaded FIRST (`POST internal/attachments`, purpose
 * `service-addendum`) and the decision carries the stored document's id — the
 * server refuses a name on its own (`addendum-missing`) and reads name and size
 * back from the stored file.
 */
export interface AddendumUploadInput {
  readonly attachmentId: string;
  readonly fileName: string;
  readonly sizeBytes: number;
}

/**
 * What the upload answers. ⚠️ `scanStatus` is `not-scanned` until the antivirus
 * pass exists (`G27`); it is carried, never shown as a verdict.
 */
export interface UploadedAddendumDto extends AddendumUploadInput {
  readonly downloadUrl: string;
  readonly scanStatus: string | null;
}

/**
 * J-01's approved document rule, which the API applies to the addendum
 * (`AttachmentUploads.cs`: PDF/DOC/DOCX, 1 MB). Pre-checked so the dialog can
 * say which rule a file breaks; the server re-checks.
 */
export const ADDENDUM_FORMATS: readonly string[] = ['pdf', 'doc', 'docx'];
export const ADDENDUM_MAX_BYTES = 1024 * 1024;

export function addendumFileIssue(file: {
  readonly name: string;
  readonly size: number;
}): 'format' | 'size' | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ADDENDUM_FORMATS.includes(extension)) {
    return 'format';
  }
  return file.size > ADDENDUM_MAX_BYTES ? 'size' : null;
}

/**
 * **The addendum is a required field, not an optional one.** J-03/F3/AC-4 says
 * the approval "cannot be finalized until they upload the corresponding
 * addendum" — modelling it as required makes an unfinalizable approval
 * impossible to express, rather than something a later refactor could drop.
 */
export interface ApproveServiceRequestInput {
  readonly kind: 'approve';
  readonly addendum: AddendumUploadInput;
  readonly note: string;
}

/** F3/AC-3 — a reason from the served list; free text when it is the "other" one. */
export interface RejectServiceRequestInput {
  readonly kind: 'reject';
  readonly reasonId: string;
  readonly reasonText: string;
}

/** F3/AC-2 — approve or reject. F3/AC-1 — nothing routes to screening. */
export type ServiceRequestDecisionInput = ApproveServiceRequestInput | RejectServiceRequestInput;

export type ServiceRequestValidationCode =
  'addendum-missing' | 'reason-missing' | 'reason-text-missing';

/**
 * F3/AC-3 + AC-4. The addendum case is a belt-and-braces check: the type already
 * forbids constructing an approval without one, so this catches a value that
 * came off the wire rather than out of the form.
 */
export function validateServiceRequestDecision(
  input: ServiceRequestDecisionInput,
  reasons: readonly RejectionReasonOptionDto[]
): readonly ServiceRequestValidationCode[] {
  if (input.kind === 'approve') {
    return input.addendum.attachmentId.trim() === '' ? ['addendum-missing'] : [];
  }
  const reason = reasons.find((candidate) => candidate.id === input.reasonId);
  if (reason == null) {
    return ['reason-missing'];
  }
  return reason.requiresText && input.reasonText.trim() === '' ? ['reason-text-missing'] : [];
}

/**
 * F3/AC-4 stated once, in the journey's own words, so every caller asks the same
 * question: an approval is finalizable exactly when an addendum is attached.
 */
export function canFinalizeApproval(addendum: AddendumUploadInput | null): boolean {
  return addendum != null && addendum.attachmentId.trim() !== '';
}
