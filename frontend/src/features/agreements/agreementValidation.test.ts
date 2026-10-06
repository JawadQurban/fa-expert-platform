import { describe, expect, it } from 'vitest';
import { validateSequenceFormation } from '../../shared/types/sequence';
import { MOCK_AGREEMENT_FIELDS } from './mockAgreementTemplate';
import {
  canPrepareAgreement,
  currentSigningMember,
  readyToSendToApplicant,
  validateAgreementFields,
  validateSigningDecision,
} from './agreement.types';
import type { SigningMemberDto } from './agreement.types';

/**
 * J-10's rules as unit tests, kept in the contract modules so they hold for every
 * caller — including the shared P-J1 gate that J-09 also uses.
 */
function member(
  approverId: string,
  state: SigningMemberDto['state'],
  isSigner = false
): SigningMemberDto {
  return {
    approverId,
    name: approverId,
    roleTitle: { ar: '—', en: '—' },
    obligation: 'mandatory',
    isSigner,
    position: 1,
    state,
    decidedAt: null,
    note: null,
  };
}

describe('canPrepareAgreement (J-10/F1/AC-1)', () => {
  it('needs both J-09 outcomes', () => {
    expect(canPrepareAgreement({ committeeApproved: true, bankDataComplete: true })).toBe(true);
  });

  it('is false with approval but no bank data', () => {
    expect(canPrepareAgreement({ committeeApproved: true, bankDataComplete: false })).toBe(false);
  });

  it('is false with bank data but no approval', () => {
    expect(canPrepareAgreement({ committeeApproved: false, bankDataComplete: true })).toBe(false);
  });
});

describe('validateAgreementFields (J-10/F1)', () => {
  it('reports every missing required field at once', () => {
    const issues = validateAgreementFields(MOCK_AGREEMENT_FIELDS, {});
    // Only start and end date are confirmed required (DM-GAP-16 is open).
    expect(issues.map((issue) => issue.fieldId)).toEqual(['startDate', 'endDate']);
  });

  it('ignores optional fields', () => {
    const issues = validateAgreementFields(MOCK_AGREEMENT_FIELDS, {
      startDate: '2026-08-01',
      endDate: '2027-07-31',
    });
    expect(issues).toEqual([]);
  });

  it('treats whitespace as missing', () => {
    const issues = validateAgreementFields(MOCK_AGREEMENT_FIELDS, {
      startDate: '   ',
      endDate: '2027-07-31',
    });
    expect(issues.map((issue) => issue.fieldId)).toEqual(['startDate']);
  });
});

describe('signing-sequence formation (J-10/F2/AC-4, shared P-J1 gate)', () => {
  const rules = { requireMandatory: true, requireSigner: true, savingTemplate: false };

  it('refuses a sequence with nobody designated to sign', () => {
    const issues = validateSequenceFormation(
      { members: [{ approverId: 'a', obligation: 'mandatory' }], saveAsTemplateName: '' },
      rules
    );
    expect(issues).toContain('no-signer-designated');
  });

  it('passes once at least one signer is designated', () => {
    const issues = validateSequenceFormation(
      {
        members: [
          { approverId: 'a', obligation: 'mandatory' },
          { approverId: 'b', obligation: 'mandatory', isSigner: true },
        ],
        saveAsTemplateName: '',
      },
      rules
    );
    expect(issues).toEqual([]);
  });

  it('does not impose the signer rule on J-09, which never signs', () => {
    const issues = validateSequenceFormation(
      { members: [{ approverId: 'a', obligation: 'mandatory' }], saveAsTemplateName: '' },
      { requireMandatory: true, requireSigner: false, savingTemplate: false }
    );
    expect(issues).toEqual([]);
  });

  it('allows the signer to sit anywhere in the order, not just last', () => {
    const issues = validateSequenceFormation(
      {
        members: [
          { approverId: 'a', obligation: 'mandatory', isSigner: true },
          { approverId: 'b', obligation: 'mandatory' },
        ],
        saveAsTemplateName: '',
      },
      rules
    );
    expect(issues).toEqual([]);
  });
});

describe('validateSigningDecision (J-10/F3/AC-4, F4/AC-1)', () => {
  it('needs nothing extra to approve', () => {
    expect(validateSigningDecision({ kind: 'approve', note: '' })).toEqual([]);
  });

  it('requires a signature name to sign', () => {
    expect(
      validateSigningDecision({ kind: 'sign-and-approve', signatureName: '  ', note: '' })
    ).toEqual(['signature-missing']);
    expect(
      validateSigningDecision({ kind: 'sign-and-approve', signatureName: 'أحمد', note: '' })
    ).toEqual([]);
  });

  it('requires a note on a modification request', () => {
    expect(validateSigningDecision({ kind: 'request-modification', note: ' ' })).toEqual([
      'note-missing',
    ]);
  });
});

describe('readyToSendToApplicant (J-10/F3/AC-5, BR-0213)', () => {
  it('needs the sequence complete AND a signature attached', () => {
    expect(readyToSendToApplicant({ sequenceComplete: true, signaturesAttached: true })).toBe(true);
  });

  it('a signature alone is not enough — the journey states this explicitly', () => {
    expect(readyToSendToApplicant({ sequenceComplete: false, signaturesAttached: true })).toBe(
      false
    );
  });

  it('a complete sequence with no signature is not enough either', () => {
    expect(readyToSendToApplicant({ sequenceComplete: true, signaturesAttached: false })).toBe(
      false
    );
  });
});

describe('currentSigningMember', () => {
  it('finds whose turn it is', () => {
    const sequence = [member('a', 'approved'), member('b', 'current', true)];
    expect(currentSigningMember(sequence)?.approverId).toBe('b');
  });

  it('returns null when nobody is mid-review', () => {
    expect(currentSigningMember([member('a', 'signed', true)])).toBeNull();
  });
});
