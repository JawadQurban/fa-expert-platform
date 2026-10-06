import { validateESignature } from '../../shared/types/eSignature';
import type { ESignatureInput, ESignatureValidationCode } from '../../shared/types/eSignature';
import type { LocalizedText } from '../../shared/types/localizedText';
import type {
  ApproverDto,
  ApproverObligation,
  SequenceFormationInput,
  SequenceTemplateDto,
} from '../../shared/types/sequence';
import type { ApplicationService } from '../applications/application.types';

/**
 * EH-INT-06a — Agreement Preparation & Internal Approval contracts (CAP-03,
 * journey **J-10**). Consumed only through `agreementService`.
 *
 * Five journey invariants are encoded **structurally**:
 *
 * 1. **Preparation is gated on two J-09 outcomes** (F1/AC-1): final committee
 *    approval *and* completed applicant bank data. `AgreementGateDto` carries
 *    both separately so the UI can name whichever half is missing.
 * 2. **Editable fields come first, merged data second** (F1/AC-2, `BR-0212`):
 *    `editableFields` is what the creator fills; `mergedData` is read-only and
 *    server-supplied. Nothing lets the creator re-key trainer or bank data.
 * 3. **The agreement covers exactly the approved services** (F1/AC-3) — the
 *    service list is server-derived, never an input.
 * 4. **There is no reject anywhere in this sequence** (F3/AC-6). The decision
 *    union contains only `approve`, `sign-and-approve`, and
 *    `request-modification`; rejection is unrepresentable, because eligibility
 *    was already settled at J-09.
 * 5. **Sending needs the full sequence *and* a signature** (F3/AC-5,
 *    `BR-0213`): `sequenceComplete` and `signaturesAttached` are separate
 *    booleans, never collapsed — a signature alone must not send.
 */

/* ------------------------------------------------------------------ *
 * The J-09 → J-10 gate — F1/AC-1
 * ------------------------------------------------------------------ */

export interface AgreementGateDto {
  /** J-09/F5 — the committee finally approved the application. */
  readonly committeeApproved: boolean;
  /** J-09/F6 — the applicant completed their bank data. */
  readonly bankDataComplete: boolean;
}

/* ------------------------------------------------------------------ *
 * Agreement content — F1
 * ------------------------------------------------------------------ */

export type AgreementFieldType = 'date' | 'text' | 'number';

/**
 * One creator-editable field of the agreement template.
 *
 * ⚠️ `DM-GAP-16` is open: the approved field list is **pending**, and the
 * journey confirms only start and end date. Fields therefore arrive as
 * configuration, exactly like the screening and interview models.
 */
export interface AgreementFieldSchema {
  readonly id: string;
  readonly label: LocalizedText;
  readonly type: AgreementFieldType;
  readonly required: boolean;
  readonly help: LocalizedText | null;
}

/** A read-only block merged in after the creator fills the editable fields. */
export interface MergedDataGroup {
  readonly id: string;
  readonly title: LocalizedText;
  readonly entries: readonly { readonly label: LocalizedText; readonly value: string }[];
}

export type AgreementFieldValues = Readonly<Record<string, string>>;

/* ------------------------------------------------------------------ *
 * The agreement document — what every reader sees before acting
 * ------------------------------------------------------------------ */

/**
 * How an approval, signature or acceptance is captured. `internal-acceptance`
 * is the only method: the person's typed name, the time and the exact document
 * version — no e-signature provider is integrated, so none is claimed.
 */
export type SignatureMethod = 'internal-acceptance';

/**
 * J-10/F3/AC-2 + J-11/F1/AC-2 — the complete agreement («all agreement data
 * without exception»), served by `GET …/agreement/document` and embedded in the
 * internal detail and the applicant's agreement block.
 *
 * Each preparation is frozen as an immutable version; every decision records the
 * version it was taken on. `snapshot: false` only for a legacy agreement prepared
 * before versions existed — it is then rendered live and must say so. There is
 * no PDF (`documentUrl` stays `null`).
 */
export interface AgreementDocumentDto {
  /** `null` only for a live (non-snapshot) rendering. */
  readonly documentVersionId: string | null;
  /** `0` for a live rendering. */
  readonly versionNumber: number;
  readonly templateName: string;
  readonly templateVersion: string;
  /** The fixed legal text of the template. Line breaks are significant. */
  readonly bodyText: string;
  /** The terms the creator entered (F1). */
  readonly fields: readonly {
    readonly id: string;
    readonly label: LocalizedText;
    readonly value: string;
  }[];
  readonly mergedData: readonly MergedDataGroup[];
  /** SHA-256 of the frozen content — evidence; `null` for a live rendering. */
  readonly contentHash: string | null;
  readonly createdAt: string | null;
  readonly snapshot: boolean;
  readonly signatureMethod: SignatureMethod;
}

/* ------------------------------------------------------------------ *
 * The signing sequence — F2 (shares P-J1 with J-09)
 * ------------------------------------------------------------------ */

/**
 * Per-person state. Note the absence of a `rejected` state: J-10/F3/AC-6 removes
 * rejection entirely, so it has no representation here.
 */
export type SigningMemberState =
  'waiting' | 'current' | 'approved' | 'signed' | 'modification-requested';

export interface SigningMemberDto {
  readonly approverId: string;
  readonly name: string;
  readonly roleTitle: LocalizedText;
  readonly obligation: ApproverObligation;
  /** F2/AC-4 — designated e-signer; not necessarily last in the order. */
  readonly isSigner: boolean;
  readonly position: number;
  readonly state: SigningMemberState;
  readonly decidedAt: string | null;
  /** Mandatory note on a modification request (F4/AC-1). */
  readonly note: string | null;
}

export type AgreementStage =
  | 'blocked'
  | 'preparation'
  | 'formation'
  | 'in-progress'
  | 'modification-requested'
  | 'sent-to-applicant';

/**
 * The stages in which the server accepts a (re-)preparation. `modification-requested`
 * is included: the creator corrects the agreement while an internal member's
 * request is pending, then re-submits and the chain resumes from that member.
 */
export function canEditAgreement(stage: AgreementStage): boolean {
  return stage === 'preparation' || stage === 'formation' || stage === 'modification-requested';
}

/* ------------------------------------------------------------------ *
 * The page payload
 * ------------------------------------------------------------------ */

export interface AgreementDetailDto {
  readonly applicationId: string;
  readonly reference: string;
  readonly applicantName: string;
  /** F1/AC-3 — server-derived from the approved services; never an input. */
  readonly approvedServices: readonly ApplicationService[];
  readonly gate: AgreementGateDto;
  readonly stage: AgreementStage;
  /** `DM-GAP-16` — served as configuration, not hard-coded. */
  readonly fieldSchema: readonly AgreementFieldSchema[];
  readonly fieldValues: AgreementFieldValues;
  /** F1/AC-2 — auto-merged, read-only. Empty until the fields are saved. */
  readonly mergedData: readonly MergedDataGroup[];
  readonly sequence: readonly SigningMemberDto[];
  readonly approverPool: readonly ApproverDto[];
  readonly templates: readonly SequenceTemplateDto[];
  /** F3/AC-2 — `null` while document storage is unresolved (`G26`). */
  readonly documentUrl: string | null;
  /** F3/AC-5 — the two halves of the send condition, deliberately separate. */
  readonly sequenceComplete: boolean;
  readonly signaturesAttached: boolean;
  readonly sentToApplicantAt: string | null;
  readonly viewer: AgreementViewerDto;
  /** The latest document version — `null` until the agreement is first prepared. */
  readonly document: AgreementDocumentDto | null;
}

export interface AgreementViewerDto {
  /** The creator prepares, forms the sequence, and re-submits after changes. */
  readonly isCreator: boolean;
  readonly approverId: string | null;
  /** True only on this person's turn (F3/AC-1). */
  readonly canDecide: boolean;
  /** F3/AC-4 — this viewer is a designated e-signer, so they sign rather than
   *  merely approve. Server-decided (P-J9). */
  readonly isSigner: boolean;
  readonly canResubmit: boolean;
}

/* ------------------------------------------------------------------ *
 * Inputs
 * ------------------------------------------------------------------ */

export interface PrepareAgreementInput {
  readonly values: AgreementFieldValues;
}

export type FormSigningSequenceInput = SequenceFormationInput;

export interface ApproveOnlyInput {
  readonly kind: 'approve';
  readonly note: string;
}

/**
 * F3/AC-4. Extends the **shared** e-signature input (P-J10) rather than
 * redeclaring the field, because J-11/F1/AC-3 requires the applicant to sign
 * with "the same e-signature mechanism built in J-10" — the two journeys now
 * share one contract, so neither can drift from the other.
 */
export interface SignAndApproveInput extends ESignatureInput {
  readonly kind: 'sign-and-approve';
  readonly note: string;
}

export interface RequestAgreementModificationInput {
  readonly kind: 'request-modification';
  readonly note: string;
}

/** F3/AC-6 — no `reject` member exists, by design. */
export type SigningDecisionInput =
  ApproveOnlyInput | SignAndApproveInput | RequestAgreementModificationInput;

/* ------------------------------------------------------------------ *
 * Validation gates
 * ------------------------------------------------------------------ */

export interface FieldValidationIssue {
  readonly fieldId: string;
}

/** F1 — every required template field must carry a value before preparation. */
export function validateAgreementFields(
  schema: readonly AgreementFieldSchema[],
  values: AgreementFieldValues
): readonly FieldValidationIssue[] {
  return schema
    .filter((field) => field.required && (values[field.id] ?? '').trim() === '')
    .map((field) => ({ fieldId: field.id }));
}

export type SigningValidationCode = 'note-missing' | ESignatureValidationCode;

/**
 * F3/AC-4 and F4/AC-1 — a signer must actually sign, and a modification request
 * carries a mandatory note. A plain approval needs neither.
 */
export function validateSigningDecision(
  input: SigningDecisionInput
): readonly SigningValidationCode[] {
  if (input.kind === 'request-modification') {
    return input.note.trim() === '' ? ['note-missing'] : [];
  }
  if (input.kind === 'sign-and-approve') {
    const issue = validateESignature(input);
    return issue == null ? [] : [issue];
  }
  return [];
}

/* ------------------------------------------------------------------ *
 * Derived readers — the rules stated in the journey's own terms
 * ------------------------------------------------------------------ */

/** F1/AC-1 — preparation cannot start until both J-09 outcomes are in. */
export function canPrepareAgreement(gate: AgreementGateDto): boolean {
  return gate.committeeApproved && gate.bankDataComplete;
}

export function currentSigningMember(
  sequence: readonly SigningMemberDto[]
): SigningMemberDto | null {
  return sequence.find((member) => member.state === 'current') ?? null;
}

/**
 * F3/AC-5 (`BR-0213`) — the signed agreement reaches the applicant only when
 * **both** conditions hold. Kept as one named function so the rule reads the
 * same way everywhere it is checked, and so "signature alone is not enough"
 * cannot be quietly lost in a component.
 */
export function readyToSendToApplicant(detail: {
  readonly sequenceComplete: boolean;
  readonly signaturesAttached: boolean;
}): boolean {
  return detail.sequenceComplete && detail.signaturesAttached;
}
