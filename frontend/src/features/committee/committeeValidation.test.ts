import { describe, expect, it } from 'vitest';
import {
  allMandatoryApproved,
  currentMember,
  readyForAgreement,
  validateFormation,
  validateMemberDecision,
} from './committee.types';
import type { BankDataStatusDto, CommitteeOutcomeDto, SequenceMemberDto } from './committee.types';

/**
 * J-09's rules as unit tests. They sit in the contract module, not the
 * component, so they hold for every future caller — including J-10, which
 * reuses the same sequence-formation mechanics.
 */
function member(
  approverId: string,
  obligation: 'mandatory' | 'optional',
  state: SequenceMemberDto['state'],
  position = 1
): SequenceMemberDto {
  return {
    approverId,
    name: approverId,
    roleTitle: { ar: '—', en: '—' },
    obligation,
    position,
    state,
    decidedAt: null,
    note: null,
  };
}

const APPROVED_OUTCOME: CommitteeOutcomeDto = {
  state: 'approved',
  decidedAt: '2026-07-29T09:00:00Z',
  rejectedByName: null,
  rejectionReason: null,
  optionalRejections: [],
};

const COMPLETE_BANK: BankDataStatusDto = {
  state: 'complete',
  requestedAt: '2026-07-29T09:00:00Z',
  completedAt: '2026-07-29T12:00:00Z',
};

describe('validateFormation (J-09/F2)', () => {
  it('requires at least one member', () => {
    expect(validateFormation({ members: [], saveAsTemplateName: '' }, false)).toEqual([
      'no-members',
    ]);
  });

  it('refuses an all-optional sequence, which could never reach approval', () => {
    const issues = validateFormation(
      {
        members: [{ approverId: 'a', obligation: 'optional' }],
        saveAsTemplateName: '',
      },
      false
    );
    expect(issues).toEqual(['no-mandatory-member']);
  });

  it('refuses the same member twice', () => {
    const issues = validateFormation(
      {
        members: [
          { approverId: 'a', obligation: 'mandatory' },
          { approverId: 'a', obligation: 'optional' },
        ],
        saveAsTemplateName: '',
      },
      false
    );
    expect(issues).toContain('duplicate-member');
  });

  it('requires a name when saving a template (F2/AC-3)', () => {
    const issues = validateFormation(
      {
        members: [{ approverId: 'a', obligation: 'mandatory' }],
        saveAsTemplateName: '   ',
      },
      true
    );
    expect(issues).toEqual(['template-name-missing']);
  });

  it('passes for a mixed mandatory/optional sequence', () => {
    expect(
      validateFormation(
        {
          members: [
            { approverId: 'a', obligation: 'mandatory' },
            { approverId: 'b', obligation: 'optional' },
          ],
          saveAsTemplateName: '',
        },
        false
      )
    ).toEqual([]);
  });
});

describe('validateMemberDecision (J-09/F7, F8)', () => {
  it('needs nothing extra to approve', () => {
    expect(validateMemberDecision({ kind: 'approve', note: '' })).toEqual([]);
  });

  it('requires a note on a modification request (BR-0217)', () => {
    expect(validateMemberDecision({ kind: 'request-modification', note: '  ' })).toEqual([
      'note-missing',
    ]);
    expect(validateMemberDecision({ kind: 'request-modification', note: 'fix section 3' })).toEqual(
      []
    );
  });

  it('requires free text when the rejection reason is "other" (BR-0219)', () => {
    expect(
      validateMemberDecision({ kind: 'reject', reason: 'other', reasonOther: '', note: '' })
    ).toEqual(['reason-other-missing']);
    expect(
      validateMemberDecision({
        kind: 'reject',
        reason: 'incomplete-documents',
        reasonOther: '',
        note: '',
      })
    ).toEqual([]);
  });
});

describe('allMandatoryApproved (BR-0211 revised, F4/AC-4)', () => {
  it('ignores optional members entirely', () => {
    const sequence = [
      member('a', 'mandatory', 'approved', 1),
      member('b', 'optional', 'rejected', 2),
    ];
    expect(allMandatoryApproved(sequence)).toBe(true);
  });

  it('is false while any mandatory member has not approved', () => {
    const sequence = [
      member('a', 'mandatory', 'approved', 1),
      member('b', 'mandatory', 'current', 2),
    ];
    expect(allMandatoryApproved(sequence)).toBe(false);
  });

  it('is false when a mandatory member rejected', () => {
    expect(allMandatoryApproved([member('a', 'mandatory', 'rejected')])).toBe(false);
  });

  it('is false for an all-optional sequence (nothing to satisfy)', () => {
    expect(allMandatoryApproved([member('a', 'optional', 'approved')])).toBe(false);
  });
});

describe('currentMember', () => {
  it('finds the member whose turn it is', () => {
    const sequence = [
      member('a', 'mandatory', 'approved', 1),
      member('b', 'mandatory', 'current', 2),
    ];
    expect(currentMember(sequence)?.approverId).toBe('b');
  });

  it('returns null when the sequence is not running', () => {
    expect(currentMember([member('a', 'mandatory', 'approved')])).toBeNull();
  });
});

describe('readyForAgreement (F5/AC-3 — the J-10 gate)', () => {
  it('needs both final approval and complete bank data', () => {
    expect(readyForAgreement({ outcome: APPROVED_OUTCOME, bankData: COMPLETE_BANK })).toBe(true);
  });

  it('is false with approval but no bank data', () => {
    expect(
      readyForAgreement({
        outcome: APPROVED_OUTCOME,
        bankData: { state: 'requested', requestedAt: '2026-07-29T09:00:00Z', completedAt: null },
      })
    ).toBe(false);
  });

  it('is false with bank data but no final approval', () => {
    expect(
      readyForAgreement({
        outcome: { ...APPROVED_OUTCOME, state: 'in-progress' },
        bankData: COMPLETE_BANK,
      })
    ).toBe(false);
  });
});
