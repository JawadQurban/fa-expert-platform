import type { LocalizedText } from '../../shared/types/localizedText';
import { validateSequenceFormation } from '../../shared/types/sequence';
import type {
  ApproverDto,
  ApproverObligation,
  FormationValidationCode,
  SequenceFormationInput,
  SequenceMemberInput,
  SequenceTemplateDto,
} from '../../shared/types/sequence';
import type { ApplicationService } from '../applications/application.types';
import type { RejectionReasonId } from '../screening/screening.types';

/**
 * EH-INT-05 — Approval Committee Decision contracts (CAP-02, journey **J-09**).
 * Consumed only through `committeeService`.
 *
 * Five journey invariants are encoded **structurally**:
 *
 * 1. **Mandatory vs optional is the whole point of the sequence** (`BR-0211`
 *    revised, F4/AC-4): only a *mandatory* member's rejection halts the
 *    application; an optional member's rejection is a logged note with no effect
 *    on the sequence continuing. Those are two different fields, not one
 *    "rejected" flag, so the difference cannot be flattened by a component.
 * 2. **The decision is on the application as a whole** (`BR-0209`, F4/AC-1):
 *    there is no per-service decision anywhere in this contract, unlike
 *    screening and interview.
 * 3. **A modification request resumes from the requesting member** (`BR-0218`,
 *    F7/AC-4): approvals already given are preserved, so the sequence carries
 *    per-member state rather than a single cursor that could be reset.
 * 4. **Final approval and bank-data collection run in parallel** (F5 + F6), and
 *    **both** must complete before J-10 — two independent readiness flags, never
 *    one combined "ready" boolean.
 * 5. **Templates are copies, not links** (F2/AC-5): editing a reused template for
 *    one application must not alter the saved template.
 *
 * The **sequence-formation shape here is deliberately reusable** — J-10/F2 forms
 * an internal *signing* sequence with the same mechanics (members, order,
 * mandatory/optional, saved templates) while being a functionally distinct
 * entity (J-10/F2/AC-3). Shared vocabulary, separate records.
 */

/* ------------------------------------------------------------------ *
 * Sequence formation (P-J1) — J-09/F2, shared with J-10/F2
 * ------------------------------------------------------------------ */

/**
 * The formation vocabulary now lives in `shared/types/sequence` because two
 * journeys build an ordered chain of people over identical mechanics
 * (J-10/F2/AC-2). It is re-exported here so the committee DTOs below read
 * self-contained at their point of use, and so existing importers are unaffected.
 */
export type {
  ApproverDto,
  ApproverObligation,
  SequenceMemberInput,
  SequenceTemplateDto,
  FormationValidationCode,
};

/** J-09's formation payload — the shared input under this journey's name. */
export type FormCommitteeInput = SequenceFormationInput;

/* ------------------------------------------------------------------ *
 * The running sequence — J-09/F4
 * ------------------------------------------------------------------ */

/**
 * Per-member state. `rejected` is recorded for **both** obligations — what
 * differs is the consequence, which the server applies and reports through
 * `outcome` (F4/AC-3 vs AC-4).
 */
export type MemberDecisionState =
  'waiting' | 'current' | 'approved' | 'rejected' | 'modification-requested';

export interface SequenceMemberDto {
  readonly approverId: string;
  readonly name: string;
  readonly roleTitle: LocalizedText;
  readonly obligation: ApproverObligation;
  /** 1-based position in the approval order. */
  readonly position: number;
  readonly state: MemberDecisionState;
  readonly decidedAt: string | null;
  /** Mandatory note on a modification request (`BR-0217`); rejection reason id
   *  is carried separately on the outcome. */
  readonly note: string | null;
}

/* ------------------------------------------------------------------ *
 * Full context for the deciding member — J-09/F3
 * ------------------------------------------------------------------ */

/**
 * F3/AC-2 — the member sees the screening result **and the consolidated final
 * interview result**, never the individual member evaluations; or the exemption
 * status and reason where J-08 applied.
 */
export interface ServiceOutcomeContextDto {
  readonly service: ApplicationService;
  readonly screeningScore: number;
  /** `null` when this service was exempted from the interview (J-08). */
  readonly interviewAverage: number | null;
  readonly interviewMaxScore: number;
  readonly exempted: boolean;
  /** Exemption reason label, present only when `exempted` is true. */
  readonly exemptionReason: LocalizedText | null;
}

/* ------------------------------------------------------------------ *
 * Outcome — J-09/F5, F8
 * ------------------------------------------------------------------ */

export type CommitteeOutcomeState =
  'not-formed' | 'in-progress' | 'modification-requested' | 'approved' | 'rejected';

export interface CommitteeOutcomeDto {
  readonly state: CommitteeOutcomeState;
  readonly decidedAt: string | null;
  /** Present on a final rejection — the halting mandatory member (F8). */
  readonly rejectedByName: string | null;
  readonly rejectionReason: RejectionReasonId | null;
  /**
   * F4/AC-4 — optional members who rejected. Logged as notes only, with **no**
   * effect on the outcome; surfaced so the record is honest about dissent.
   */
  readonly optionalRejections: readonly {
    readonly approverId: string;
    readonly name: string;
    readonly note: string | null;
  }[];
}

/* ------------------------------------------------------------------ *
 * Bank data readiness — J-09/F6 (creator's view of the J-10 gate)
 * ------------------------------------------------------------------ */

export type BankDataState = 'not-requested' | 'requested' | 'complete';

export interface BankDataStatusDto {
  readonly state: BankDataState;
  /** When the applicant was asked (the "preliminary approval" notification). */
  readonly requestedAt: string | null;
  readonly completedAt: string | null;
}

/* ------------------------------------------------------------------ *
 * Viewer capabilities — server-decided (P-J9)
 * ------------------------------------------------------------------ */

export interface CommitteeViewerDto {
  /** The creator forms the committee and receives the result (F2, F5, F7/AC-3). */
  readonly isCreator: boolean;
  /** Set when the viewer is a sequence member; `null` otherwise. */
  readonly approverId: string | null;
  /** True only when it is this member's turn (F4/AC-2). */
  readonly canDecide: boolean;
  /** The creator may re-submit after a modification request (F7/AC-3). */
  readonly canResubmit: boolean;
}

/* ------------------------------------------------------------------ *
 * The page payload
 * ------------------------------------------------------------------ */

export interface CommitteeDetailDto {
  readonly applicationId: string;
  readonly reference: string;
  readonly applicantName: string;
  readonly acceptedServices: readonly ApplicationService[];
  /** F3/AC-2 — screening + consolidated interview result per accepted service. */
  readonly context: readonly ServiceOutcomeContextDto[];
  /** Empty until the creator forms the committee (F2). */
  readonly sequence: readonly SequenceMemberDto[];
  /** Selectable approvers, for formation. */
  readonly approverPool: readonly ApproverDto[];
  /** Saved templates the creator can reuse (F2/AC-4). */
  readonly templates: readonly SequenceTemplateDto[];
  readonly outcome: CommitteeOutcomeDto;
  /** F6 — runs in parallel with the approval sequence; gates J-10 with it. */
  readonly bankData: BankDataStatusDto;
  readonly viewer: CommitteeViewerDto;
}

/* ------------------------------------------------------------------ *
 * Decision inputs — J-09/F4, F7, F8
 * ------------------------------------------------------------------ */

export interface ApproveInput {
  readonly kind: 'approve';
  readonly note: string;
}

export interface CommitteeRejectInput {
  readonly kind: 'reject';
  readonly reason: RejectionReasonId;
  readonly reasonOther: string;
  readonly note: string;
}

export interface RequestModificationInput {
  readonly kind: 'request-modification';
  /** Mandatory (`BR-0217`) and shown to every member (F7/AC-2). */
  readonly note: string;
}

export type MemberDecisionInput = ApproveInput | CommitteeRejectInput | RequestModificationInput;

/* ------------------------------------------------------------------ *
 * Validation gates
 * ------------------------------------------------------------------ */

/**
 * J-09/F2 — a sequence needs members and at least one **mandatory** member,
 * because "finally approved" is defined as *all mandatory members approved*
 * (F4/AC-4). An all-optional sequence could never reach approval, so it is
 * rejected at formation rather than silently stalling later.
 *
 * Delegates to the shared gate with J-09's rule set: no e-signer requirement,
 * since committee members approve an application but never sign a document.
 */
export function validateFormation(
  input: FormCommitteeInput,
  /** True when the creator ticked "save as template" (name then required). */
  savingTemplate: boolean
): readonly FormationValidationCode[] {
  return validateSequenceFormation(input, {
    requireMandatory: true,
    requireSigner: false,
    savingTemplate,
  });
}

export type MemberDecisionValidationCode =
  'reason-missing' | 'reason-other-missing' | 'note-missing';

/**
 * J-09/F7/AC-1 (`BR-0217`) — a modification request carries a **mandatory**
 * note; J-09/F8/AC-2 (`BR-0219`) — a rejection carries a reason. Approval needs
 * neither.
 */
export function validateMemberDecision(
  input: MemberDecisionInput
): readonly MemberDecisionValidationCode[] {
  if (input.kind === 'approve') {
    return [];
  }
  if (input.kind === 'request-modification') {
    return input.note.trim() === '' ? ['note-missing'] : [];
  }
  if (input.reason === 'other' && input.reasonOther.trim() === '') {
    return ['reason-other-missing'];
  }
  return [];
}

/* ------------------------------------------------------------------ *
 * Derived readers — the rules stated once, in the terms the journey uses
 * ------------------------------------------------------------------ */

/** F4/AC-4 — "finally approved" means every **mandatory** member approved. */
export function allMandatoryApproved(sequence: readonly SequenceMemberDto[]): boolean {
  const mandatory = sequence.filter((member) => member.obligation === 'mandatory');
  return mandatory.length > 0 && mandatory.every((member) => member.state === 'approved');
}

/** The member whose turn it is, if the sequence is running. */
export function currentMember(sequence: readonly SequenceMemberDto[]): SequenceMemberDto | null {
  return sequence.find((member) => member.state === 'current') ?? null;
}

/**
 * F5/AC-3 — the creator can only move to agreement preparation (J-10) when the
 * committee has finally approved **and** the applicant's bank data is complete.
 * Two independent conditions, deliberately not collapsed server-side into one
 * flag, so the UI can say *which* half is outstanding.
 */
export function readyForAgreement(detail: {
  readonly outcome: CommitteeOutcomeDto;
  readonly bankData: BankDataStatusDto;
}): boolean {
  return detail.outcome.state === 'approved' && detail.bankData.state === 'complete';
}
