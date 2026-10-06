import type { LocalizedText } from './localizedText';

/**
 * **P-J1 — Sequence formation vocabulary.**
 *
 * Shared because two journeys form an ordered chain of people over the same
 * mechanics: J-09/F2 forms the **approval committee** that decides an
 * application's fate, and J-10/F2 forms the **internal signing sequence** that
 * reviews and signs the resulting agreement.
 *
 * J-10/F2/AC-2 says the mechanics apply "exactly"; J-10/F2/AC-3 insists the two
 * are nonetheless **distinct entities** and must not be conflated. That is why
 * the *vocabulary* lives here while each feature keeps its own DTOs, service,
 * and recorded state — shared mechanism, separate records.
 */

/** Someone selectable for a sequence. */
export interface ApproverDto {
  readonly id: string;
  readonly name: string;
  readonly roleTitle: LocalizedText;
}

/** Classification chosen when the sequence is formed (J-09/F2/AC-2). */
export type ApproverObligation = 'mandatory' | 'optional';

/** One position in a sequence, before it starts running. */
export interface SequenceMemberInput {
  readonly approverId: string;
  readonly obligation: ApproverObligation;
  /**
   * J-10/F2/AC-4 — designates this person as an actual **e-signer**. Unused by
   * J-09, whose members approve but never sign anything.
   */
  readonly isSigner?: boolean;
}

/** A saved, named arrangement. Reuse **copies** its members (J-09/F2/AC-5). */
export interface SequenceTemplateDto {
  readonly id: string;
  readonly name: string;
  readonly members: readonly SequenceMemberInput[];
}

export interface SequenceFormationInput {
  readonly members: readonly SequenceMemberInput[];
  /** Non-empty to also save this arrangement as a reusable template. */
  readonly saveAsTemplateName: string;
}

/**
 * Every rule the shared formation gate can report. A feature enables only the
 * rules that apply to it, and supplies copy only for those — see
 * `validateSequenceFormation`.
 */
export type FormationValidationCode =
  | 'no-members'
  | 'no-mandatory-member'
  | 'duplicate-member'
  | 'no-signer-designated'
  | 'template-name-missing';

export interface FormationRules {
  /** Whether the sequence must contain at least one mandatory member. */
  readonly requireMandatory: boolean;
  /** J-10 only: the sequence must designate at least one e-signer. */
  readonly requireSigner: boolean;
  /** The creator ticked "save as template", so a name is required. */
  readonly savingTemplate: boolean;
}

/**
 * The single formation gate for both journeys.
 *
 * `requireMandatory` exists because "finally approved" is *defined* as all
 * mandatory members approving (J-09/F4/AC-4) — an all-optional committee could
 * never reach approval.
 *
 * `requireSigner` is the J-10 equivalent: the signed agreement is only sent once
 * an e-signature is attached (J-10/F3/AC-5), so a signing sequence with nobody
 * designated could never complete. Both are refused at formation rather than
 * stalling silently later.
 */
export function validateSequenceFormation(
  input: SequenceFormationInput,
  rules: FormationRules
): readonly FormationValidationCode[] {
  const issues: FormationValidationCode[] = [];

  if (input.members.length === 0) {
    issues.push('no-members');
  } else {
    if (rules.requireMandatory && !input.members.some((m) => m.obligation === 'mandatory')) {
      issues.push('no-mandatory-member');
    }
    if (rules.requireSigner && !input.members.some((m) => m.isSigner === true)) {
      issues.push('no-signer-designated');
    }
    if (new Set(input.members.map((m) => m.approverId)).size !== input.members.length) {
      issues.push('duplicate-member');
    }
  }

  if (rules.savingTemplate && input.saveAsTemplateName.trim() === '') {
    issues.push('template-name-missing');
  }

  return issues;
}
