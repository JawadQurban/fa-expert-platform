import type { SlaDto } from '../../shared/types/sla';
import { validateESignature } from '../../shared/types/eSignature';
import type { ESignatureInput, ESignatureValidationCode } from '../../shared/types/eSignature';
import type { AgreementDocumentDto, MergedDataGroup } from '../agreements/agreement.types';
import type { ApplicationPresentationStatus, ApplicationService } from './application.types';
import type {
  ApplicationEntryDto,
  ApplicationFieldValue,
  ApplicationFormSchemaDto,
} from './applicationForm.types';
import type { ProfileBankDataDto } from '../profile/profile.types';
import type { LocalizedText } from '../../shared/types/localizedText';

/**
 * EH-TP-03 (Application Details) contracts — CAP-01/02/03, flow J1
 * (tracking + action portion). New Expert Hub types consumed only through
 * `applicationsService` (the versioned mock today, the Expert Hub ASP.NET Core
 * API later); the React app never calls FAST / MTM / ERP / SSO directly (`02C`).
 *
 * Two invariants from the docs are encoded structurally:
 * - **Business status vs. sync status are separate** (`§0.9`): `status` is the
 *   trainer presentation vocabulary; `sync` is a *separate* field, present only
 *   post-signature and never surfaced as a raw failure (`syncState` has no
 *   `failed` — a stalled sync stays `processing` to the trainer, `04` §11/§J5).
 * - **The action panel is stage-driven, not audience-driven** (`04` §6): the
 *   server decides the single available `action`; the page renders it.
 *
 * **Conformed to journey J-06 on 2026-08-19** (`DECISIONS.md` P-49/P-50). The
 * applicant's half of interview scheduling was one action wide — "confirm a
 * slot" — which left an applicant no proposed slot suits with no way forward.
 * J-06/F4 gives them a reschedule request, before *and* after confirming, and
 * F1/AC-4 puts a 3-business-day clock on the selection.
 *
 * **Conformed to journey J-11 on 2026-08-19** (`DECISIONS.md` P-42/P-43). The
 * page previously modelled the agreement step as *upload a signed PDF*, which
 * came from the superseded page spec. J-11/F1 gives the applicant **three**
 * decisions on the agreement — e-sign, reject, request modification — and
 * AC-3 requires the signature to be captured *inside the platform* with the
 * same mechanism J-10 uses. The upload path is gone.
 */

/** Timeline stages (a trainer-facing grouping of the `P-05` presentation flow). */
export const APPLICATION_STAGES = [
  'submitted',
  'under-review',
  'interview',
  'approval',
  'agreement',
  'active',
] as const;

export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

export type StageState = 'complete' | 'current' | 'upcoming' | 'rejected';

/**
 * One stage of the trainer-facing timeline.
 *
 * **J-08/F2/AC-3** — an application whose interview was *exempted* must show the
 * interview step as **passed**, without disclosing that an exemption was granted.
 * That is guaranteed here by omission: this DTO carries a state and nothing else.
 * There is no exemption flag, no reason, no `skipped` state — so no component
 * can render one, and the exempted path is indistinguishable from a completed
 * interview. The state itself is derived server-side from the business status.
 */
export interface TimelineStageDto {
  readonly id: ApplicationStage;
  readonly state: StageState;
}

export type ServiceOutcome = 'pending' | 'accepted' | 'rejected';

export interface PerServiceOutcomeDto {
  readonly service: ApplicationService;
  readonly outcome: ServiceOutcome;
}

export interface InterviewSlotDto {
  readonly id: string;
  /** ISO timestamp of the slot start. */
  readonly startsAt: string;
}

/* ------------------------------------------------------------------ *
 * The applicant's view of their interview — J-06 (F1, F2, F4)
 * ------------------------------------------------------------------ */

/** A reschedule the applicant has already asked for and is waiting on (F4/AC-4). */
export interface RescheduleRequestDto {
  readonly requestedAt: string;
  /** The applicant's optional note. J-06 does not require a reason — see P-50. */
  readonly note: string | null;
}

/**
 * Everything the applicant can see and do about their interview.
 *
 * `canRequestReschedule` is **server-decided** (P-J9), not inferred from the
 * other fields, because J-06/F4 makes it available in two different situations —
 * before selecting (AC-1) and after confirming (AC-2) — and unavailable in a
 * third (a request is already pending). The server also owns the one rule the
 * journey leaves open: J-06's open item 4 says the **maximum number of
 * reschedules is undefined**, so no limit is invented here; when one is decided
 * it changes this boolean and nothing else.
 */
export interface ApplicantInterviewDto {
  /** F1/AC-1 — the slots prepared at screening, for the applicant to choose from. */
  readonly proposedSlots: readonly InterviewSlotDto[];
  /** `null` until they confirm one (F1/AC-5). */
  readonly selectedSlotId: string | null;
  /**
   * F1/AC-4 — 3 business days to select, server-computed (P-J4). `null` once a
   * slot is confirmed or a reschedule is pending: there is no deadline to show
   * when there is nothing to decide.
   */
  readonly selectionSla: SlaDto | null;
  /** F4/AC-1 + AC-2 — server-decided, see above. */
  readonly canRequestReschedule: boolean;
  /** F4/AC-4 — set while the applicant waits for new slots to be proposed. */
  readonly pendingReschedule: RescheduleRequestDto | null;
  /**
   * F2/AC-3 — the interview ticket number. **Survives reschedules** (F4/AC-6):
   * a reschedule never issues a new number, which is why this is a plain field
   * on the interview rather than something derived from the confirmed slot.
   */
  readonly ticketNumber: string | null;
  /**
   * F2/AC-1 — the Teams meeting link, shown here because F1/AC-2 is explicit
   * that the email is "a notification channel only, never the place where the
   * action is taken". `null` while the Teams integration is undocumented — it is
   * absent from the `CAP-12` integration table (J-06 open item 1), so no link is
   * fabricated.
   */
  readonly meetingUrl: string | null;
}

/** F4 — what the applicant sends when no proposed time works. */
export interface RequestRescheduleInput {
  /** Optional: J-06/F4 asks for no reason, so requiring one would invent a rule. */
  readonly note: string;
}

export type AttachmentKind = 'applicant' | 'agreement';

export interface DetailAttachmentDto {
  readonly id: string;
  readonly name: string;
  readonly kind: AttachmentKind;
  /** Which required document this is — several files share a filename. */
  readonly label: LocalizedText | null;
  /** Where to open it. `null` only when the row carries no stored file. */
  readonly url: string | null;
}

/**
 * The single stage-driven action the trainer can take right now.
 *
 * `decide-agreement` replaced the old `sign-agreement` on 2026-08-19: signing is
 * one of **three** decisions J-11/F1 puts in front of the applicant, not the
 * action itself. Naming it after one outcome hid the other two.
 *
 * `manage-interview` likewise replaced `select-slot`, for the same reason:
 * J-06/F4/AC-1 makes "request a different time" an alternative to selecting, and
 * AC-2 keeps it available *after* a slot is confirmed. An action named after one
 * of those hides the rest.
 */
export type DetailAction =
  | 'none'
  | 'manage-interview'
  /**
   * `J-09/F6` — final approval is in, and the applicant must supply their bank
   * data before an agreement can be prepared (`AC-3`). It outranks
   * `decide-agreement` for that reason: there is no agreement to decide on
   * until this is done.
   */
  | 'provide-bank-data'
  | 'decide-agreement';

/**
 * Agreement record state. `awaiting-decision` (not "awaiting-signature") because
 * J-11/F1 offers three outcomes; `declined` and `modification-requested` are the
 * other two resting states. The file itself lives in storage (`G26`).
 */
export type AgreementState =
  'not-ready' | 'awaiting-decision' | 'signed' | 'declined' | 'modification-requested';

/* ------------------------------------------------------------------ *
 * The applicant's view of the agreement — J-11/F1
 * ------------------------------------------------------------------ */

/**
 * What the applicant decided, once they have. Kept as a discriminated record
 * rather than three booleans so an impossible combination cannot be expressed.
 */
export type ApplicantDecisionKind = 'sign' | 'reject' | 'request-modification';

export interface ApplicantDecisionRecordDto {
  readonly kind: ApplicantDecisionKind;
  readonly decidedAt: string;
  /** The applicant's note. Mandatory on a modification request (F1/AC-5). */
  readonly note: string | null;
}

/**
 * The agreement as the applicant sees it before deciding (F1/AC-2: they "can
 * preview or fully download it before deciding — showing **all** agreement data
 * without exception").
 *
 * - `document` — the complete agreement as frozen for signing: the legal text,
 *   the terms the creator entered and the merged data. This is what the UI
 *   renders, and what an acceptance is recorded against.
 * - `dataGroups` — the live merged data only (kept on the wire; the document's
 *   own `mergedData` is the version-exact copy).
 * - `documentUrl` — a generated PDF. No PDF is generated, so it stays `null`;
 *   the UI says so rather than offering a link to a file that does not exist.
 */
export interface ApplicantAgreementDto {
  /** When J-10 sent the fully internally-signed agreement (F1/AC-1). */
  readonly sentAt: string;
  /** Live merged data — superseded in the UI by `document.mergedData`. */
  readonly dataGroups: readonly MergedDataGroup[];
  /** `G26` — `null`: no PDF exists. */
  readonly documentUrl: string | null;
  /** F1/AC-2 — the whole agreement, no field withheld. */
  readonly document: AgreementDocumentDto;
  /** `null` until the applicant decides; then the decision is a matter of record. */
  readonly decision: ApplicantDecisionRecordDto | null;
}

/* ------------------------------------------------------------------ *
 * The applicant's decision — J-11/F1/AC-3 · AC-4 · AC-5
 * ------------------------------------------------------------------ */

/**
 * AC-3 — e-sign **within the platform**, using the shared P-J10 mechanism. The
 * input extends `ESignatureInput` rather than redeclaring the field, so "the
 * same mechanism as J-10" is a fact about the types, not a claim in a comment.
 */
export interface ApplicantSignInput extends ESignatureInput {
  readonly kind: 'sign';
}

/**
 * AC-4 — rejection **permanently closes** the application: no return path, no
 * automatic re-submission. The note is optional: the journey does not require a
 * reason, and requiring one would be an invented rule. What the journey *does*
 * state is the permanence, so the UI warns and asks for an explicit confirmation
 * (the J-05/F5/AC-7 precedent for an irreversible decision).
 */
export interface ApplicantRejectInput {
  readonly kind: 'reject';
  readonly note: string;
}

/**
 * AC-5 — the note is returned to the agreement's creator (the J-10 preparer), so
 * it is **mandatory**: a modification request with nothing to act on would stall
 * the chain at a person who cannot tell what to change.
 */
export interface ApplicantModificationInput {
  readonly kind: 'request-modification';
  readonly note: string;
}

export type ApplicantAgreementDecisionInput =
  ApplicantSignInput | ApplicantRejectInput | ApplicantModificationInput;

export type ApplicantDecisionValidationCode = 'note-missing' | ESignatureValidationCode;

/**
 * F1/AC-3 + AC-5 — a signature must actually be given, and a modification
 * request must carry its note. Rejection needs neither; its gate is the
 * confirmation of permanence, which is a UI act, not a field.
 */
export function validateApplicantAgreementDecision(
  input: ApplicantAgreementDecisionInput
): readonly ApplicantDecisionValidationCode[] {
  if (input.kind === 'sign') {
    const issue = validateESignature(input);
    return issue == null ? [] : [issue];
  }
  if (input.kind === 'request-modification') {
    return input.note.trim() === '' ? ['note-missing'] : [];
  }
  return [];
}

/**
 * FAST synchronization state — a **separate track** shown only post-signature
 * (`§0.9`, `04` §J5). Deliberately no `failed`: a stalled/failed sync is shown
 * to the trainer as `processing`, never as a raw failure, and never reverts the
 * Approved business status.
 */
export type SyncState = 'none' | 'processing' | 'synchronized';

export interface ApplicationDetailDto {
  readonly id: string;
  /** Issued at submission only (`BR-0107`); `null` would mean a draft. */
  readonly reference: string | null;
  readonly services: readonly ApplicationService[];
  readonly status: ApplicationPresentationStatus;
  readonly createdAt: string;
  readonly submittedAt: string | null;
  readonly updatedAt: string;
  readonly timeline: readonly TimelineStageDto[];
  readonly perServiceOutcomes: readonly PerServiceOutcomeDto[];
  /**
   * The reviewer-authored reason for a rejection, shown to the trainer so the
   * decision is never a bare status. Present **only** when `status === 'rejected'`;
   * `null` for every other state. Free-text authored content (Arabic-primary),
   * not a translated UI string. Exact field/placement pending BRD confirmation
   * (**Needs Confirmation** — no explicit BR located for the reason payload).
   */
  readonly rejectionReason: string | null;
  readonly attachments: readonly DetailAttachmentDto[];
  /** The one action available at the current stage (server-decided). */
  readonly action: DetailAction;
  /**
   * `J-09/F6` — the bank-data request. `null` until final approval asks for
   * it, so the section cannot render on an application that never reached
   * that stage. The same shape the profile's own section consumes, because it
   * is the same section: it simply has to be reachable BEFORE a trainer
   * profile exists, which is the whole point of `F6`.
   */
  /**
   * The form the applicant answered and their answers, served against THEIR
   * schema version so an application submitted months ago still renders with
   * its own labels and option lists. `entries` carries the repeatable
   * sections; it is absent for a version that had none.
   */
  readonly formSchema: ApplicationFormSchemaDto;
  readonly values: Readonly<Record<string, ApplicationFieldValue>>;
  readonly entries?: Readonly<Record<string, readonly ApplicationEntryDto[]>>;
  readonly bankData: ProfileBankDataDto | null;
  /**
   * J-06 — present from the moment screening proposes slots until the interview
   * is behind them; `null` at every other stage, so no interview UI can render
   * over an interview that does not exist.
   */
  readonly interview: ApplicantInterviewDto | null;
  readonly agreementState: AgreementState;
  /**
   * J-11/F1 — present only once J-10 has sent the fully internally-signed
   * agreement. `null` at every earlier stage, so there is no way to render a
   * decision panel over an agreement that does not exist yet.
   */
  readonly agreement: ApplicantAgreementDto | null;
  /** `none` until the agreement is signed (`§0.9`). */
  readonly sync: SyncState;
}
