import { describe, expect, it } from 'vitest';
import {
  createServiceDecision,
  validateAcceptDecision,
  validateRejectDecision,
} from './screening.types';
import type { AcceptDecisionInput } from './screening.types';

/**
 * J-05/F5/AC-4 and AC-8 as unit tests. The gate lives in the contract module,
 * not in the component, so the rule holds for every future caller (the staff
 * page today, an API-side re-check or a different surface later).
 */
function acceptWith(...services: AcceptDecisionInput['services']): AcceptDecisionInput {
  return { kind: 'accept', services };
}

describe('validateAcceptDecision (J-05/F5/AC-4)', () => {
  it('rejects an empty selection', () => {
    expect(validateAcceptDecision(acceptWith())).toEqual([
      { code: 'no-service-selected', service: null },
    ]);
  });

  it('requires slots AND committee together on the interview path', () => {
    const issues = validateAcceptDecision(acceptWith(createServiceDecision('trainer')));
    expect(issues.map((issue) => issue.code)).toEqual(['slots-missing', 'committee-missing']);
  });

  it('still blocks when only one half of the interview path is provided', () => {
    const withSlotsOnly = {
      ...createServiceDecision('trainer'),
      slots: ['2026-08-01T09:00'],
    };
    expect(validateAcceptDecision(acceptWith(withSlotsOnly)).map((issue) => issue.code)).toEqual([
      'committee-missing',
    ]);

    const withCommitteeOnly = {
      ...createServiceDecision('trainer'),
      committeeMemberIds: ['stf-01'],
    };
    expect(
      validateAcceptDecision(acceptWith(withCommitteeOnly)).map((issue) => issue.code)
    ).toEqual(['slots-missing']);
  });

  it('passes when slots and committee are both present', () => {
    const complete = {
      ...createServiceDecision('trainer'),
      slots: ['2026-08-01T09:00'],
      committeeMemberIds: ['stf-01'],
    };
    expect(validateAcceptDecision(acceptWith(complete))).toEqual([]);
  });

  it('requires a reason on the exemption path (J-08/F1/AC-2)', () => {
    const exempt = { ...createServiceDecision('trainer'), path: 'exemption' as const };
    expect(validateAcceptDecision(acceptWith(exempt)).map((issue) => issue.code)).toEqual([
      'exemption-reason-missing',
    ]);
  });

  it('requires free text when the exemption reason is "other"', () => {
    const exempt = {
      ...createServiceDecision('trainer'),
      path: 'exemption' as const,
      exemptionReason: 'other' as const,
    };
    expect(validateAcceptDecision(acceptWith(exempt)).map((issue) => issue.code)).toEqual([
      'exemption-reason-other-missing',
    ]);
  });

  it('allows one service to be exempted while another goes to interview (J-08/F1/AC-3)', () => {
    const interview = {
      ...createServiceDecision('trainer'),
      slots: ['2026-08-01T09:00'],
      committeeMemberIds: ['stf-01'],
    };
    const exempt = {
      ...createServiceDecision('consultant'),
      path: 'exemption' as const,
      exemptionReason: 'expert' as const,
    };
    expect(validateAcceptDecision(acceptWith(interview, exempt))).toEqual([]);
  });

  it('reports every incomplete service at once, not one at a time', () => {
    const issues = validateAcceptDecision(
      acceptWith(createServiceDecision('trainer'), createServiceDecision('consultant'))
    );
    expect(issues).toHaveLength(4);
    expect(new Set(issues.map((issue) => issue.service))).toEqual(
      new Set(['trainer', 'consultant'])
    );
  });
});

describe('validateRejectDecision (J-05/F5/AC-8, BR-0219)', () => {
  it('accepts a listed reason', () => {
    expect(
      validateRejectDecision({
        kind: 'reject',
        reason: 'incomplete-documents',
        reasonOther: '',
      })
    ).toEqual([]);
  });

  it('requires free text when the reason is "other"', () => {
    expect(validateRejectDecision({ kind: 'reject', reason: 'other', reasonOther: '   ' })).toEqual(
      [{ code: 'reason-other-missing' }]
    );
  });
});
