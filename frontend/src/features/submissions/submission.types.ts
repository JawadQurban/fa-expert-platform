/**
 * Material & content submission contracts (CAP-05, journey **J-20**).
 *
 * **These types are the wire.** They mirror `SubmissionWire` /
 * `SubmissionRoundWire` in `backend/src/ExpertHub.Api/Assignments/
 * EngagementEndpoints.cs`, field for field, and the fixtures in
 * `contracts/fixtures/*submission*.json` are what they are tested against
 * (`Submissions.contract.test.tsx`). The mock provider serves the same shape,
 * so there is one contract and not two.
 *
 * J-20 is **two paths that share one principle**: upload → pending approval →
 * approve or ask for another upload. They differ in what opens the slot (FAST
 * "Not Available" for training material, F1/AC-1; engagement confirmation for
 * service content, F4/AC-1) and in where an approval goes: approved training
 * material is copied to the plan in FAST (F3/AC-1), approved content stays in the
 * platform (F5/AC-5). The wire carries `syncState` on every submission; it only
 * ever moves on the training-material path, and `syncsToFast` is the one place
 * that says so.
 *
 * Two rules are structural:
 *
 * - **There is no rejection.** F2/AC-3 and F5/AC-3 give the coordinator exactly
 *   two options: approve, or "send a note opening a new upload opportunity".
 *   `SubmissionStatus` has no terminal failure and `SubmissionDecisionInput`
 *   has no reject member.
 * - **The note is a required field of the request** (the server answers 400
 *   `note-required` without one), so a note-less request is unrepresentable.
 *
 * ⚠️ **Open item 1** — neither path has an approval SLA, so there is no SLA field.
 *
 * ⚠️ **`G26`/`G27`** — document storage is unresolved: an upload records the file
 * **name** only (no bytes, no size, no URL). Preview/download (F2/AC-2, F5/AC-2)
 * is stated as unavailable rather than faked.
 *
 * ⚠️ **Not on the wire**: the engagement reference, programme name and the J-01
 * attachment rule (formats/size). Pages omit them rather than invent them.
 */

/* ------------------------------------------------------------------ *
 * The two paths
 * ------------------------------------------------------------------ */

export type SubmissionKind = 'training-material' | 'service-content';

/**
 * F1/AC-3 + F4/AC-3 — the platform's own state (F3/AC-2: sync is one-way).
 * The server's values use **underscores** (`SubmissionStatuses` in
 * `Assignments.cs`); every page reads them from here, never as a literal.
 *
 * ⚠️ **No `rejected`.**
 */
export const SUBMISSION_STATUS = {
  /** The slot is open and nothing has been uploaded yet. */
  awaitingUpload: 'awaiting_upload',
  /** F1/AC-3 + F4/AC-3 — "Uploaded — Pending Approval". */
  pendingApproval: 'pending_approval',
  /** F2/AC-3's second option: a note was sent and a new upload is open. */
  changesRequested: 'changes_requested',
  approved: 'approved',
} as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUS)[keyof typeof SUBMISSION_STATUS];

/**
 * F3 — the FAST write for approved **training material only**. No `failed`: a
 * stalled sync stays `processing` and never un-approves the material.
 */
export type SubmissionSyncState = 'none' | 'processing' | 'synchronized';

/** What a decided round records — the status values, not the input values. */
export type SubmissionRoundDecision =
  typeof SUBMISSION_STATUS.approved | typeof SUBMISSION_STATUS.changesRequested;

/** F2/AC-3 + AC-4 — one upload and its review. Flat, exactly as served. */
export interface SubmissionRoundDto {
  readonly roundNumber: number;
  /** `G26` — the name the submitter chose; the file itself is not stored. */
  readonly fileName: string;
  /** `null` while this round is still awaiting a decision. */
  readonly decision: SubmissionRoundDecision | null;
  /** Present on a `changes_requested` round — the AC says *send a note*. */
  readonly note: string | null;
  readonly decidedByName: string | null;
  readonly decidedAt: string | null;
  readonly uploadedAt: string;
}

export interface SubmissionDto {
  readonly submissionId: string;
  readonly engagementId: string;
  readonly kind: SubmissionKind;
  readonly status: SubmissionStatus;
  readonly syncState: SubmissionSyncState;
  readonly trainerName: string;
  readonly openedAt: string;
  readonly rounds: readonly SubmissionRoundDto[];
}

/** F3/AC-1 vs F5/AC-5 — only training material is copied to FAST. */
export function syncsToFast(submission: SubmissionDto): boolean {
  return submission.kind === 'training-material';
}

/* ------------------------------------------------------------------ *
 * Inputs
 * ------------------------------------------------------------------ */

/** `POST v1/me/submissions/{id}/upload` — the name only (`G26`/`G27`). */
export interface UploadSubmissionInput {
  readonly fileName: string;
}

/**
 * The decision **input** values. ⚠️ The server takes a hyphen here
 * (`changes-requested`) but records an underscore on the round and status.
 */
export const SUBMISSION_DECISION = {
  approved: 'approved',
  changesRequested: 'changes-requested',
} as const;

/**
 * F2/AC-3 + F5/AC-3 — **the only two decisions there are**, as
 * `POST v1/internal/submissions/{id}/decision` takes them.
 */
export type SubmissionDecisionInput =
  | { readonly decision: typeof SUBMISSION_DECISION.approved }
  | { readonly decision: typeof SUBMISSION_DECISION.changesRequested; readonly note: string };

export type SubmissionValidationCode = 'note-required';

/** The note is required, and blank space is not a note. */
export function validateSubmissionDecision(
  input: SubmissionDecisionInput
): readonly SubmissionValidationCode[] {
  return input.decision === SUBMISSION_DECISION.changesRequested && input.note.trim() === ''
    ? ['note-required']
    : [];
}

/**
 * F1/AC-1 + F4/AC-1 — whether the person may upload right now: a slot never
 * filled, or one a coordinator re-opened with a note. Same rule the server
 * applies (409 otherwise).
 */
export function canUpload(submission: SubmissionDto): boolean {
  return (
    submission.status === SUBMISSION_STATUS.awaitingUpload ||
    submission.status === SUBMISSION_STATUS.changesRequested
  );
}
