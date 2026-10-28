import { describe, expect, it } from 'vitest';
import {
  createServiceDecision,
  interviewedServices,
  validateAcceptDecision,
  validateRejectDecision,
} from './screening.types';
import type { AcceptDecisionInput, InterviewPlan } from './screening.types';

/**
 * J-05/F5/AC-4 and AC-8 as unit tests. The gate lives in the contract module,
 * not in the component, so the rule holds for every future caller (the staff
 * page today, an API-side re-check or a different surface later).
 */
function acceptWith(...services: AcceptDecisionInput['services']): AcceptDecisionInput {
  return { kind: 'accept', services, interview: null };
}

/** P-384 — the application's ONE interview plan. */
function withPlan(input: AcceptDecisionInput, plan: Partial<InterviewPlan>): AcceptDecisionInput {
  return { ...input, interview: { slots: [], committeeMemberIds: [], ...plan } };
}

const COMPLETE_PLAN = { slots: ['2030-08-01T09:00'], committeeMemberIds: ['stf-01'] };

describe('validateAcceptDecision (J-05/F5/AC-4)', () => {
  it('rejects an empty selection', () => {
    expect(validateAcceptDecision(acceptWith())).toEqual([
      { code: 'no-service-selected', service: null },
    ]);
  });

  it('requires slots AND committee together for the application interview', () => {
    const issues = validateAcceptDecision(acceptWith(createServiceDecision('trainer')));
    expect(issues).toEqual([
      { code: 'slots-missing', service: null },
      { code: 'committee-missing', service: null },
    ]);
  });

  it('still blocks when only one half of the interview plan is provided', () => {
    const trainer = acceptWith(createServiceDecision('trainer'));
    expect(
      validateAcceptDecision(withPlan(trainer, { slots: ['2030-08-01T09:00'] })).map(
        (issue) => issue.code
      )
    ).toEqual(['committee-missing']);
    expect(
      validateAcceptDecision(withPlan(trainer, { committeeMemberIds: ['stf-01'] })).map(
        (issue) => issue.code
      )
    ).toEqual(['slots-missing']);
  });

  it('passes when slots and committee are both present', () => {
    expect(
      validateAcceptDecision(withPlan(acceptWith(createServiceDecision('trainer')), COMPLETE_PLAN))
    ).toEqual([]);
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
    const exempt = {
      ...createServiceDecision('consultant'),
      path: 'exemption' as const,
      exemptionReason: 'expert' as const,
    };
    const input = withPlan(acceptWith(createServiceDecision('trainer'), exempt), COMPLETE_PLAN);
    expect(validateAcceptDecision(input)).toEqual([]);
    // The one interview covers the trainer only; the exempted service stays out.
    expect(interviewedServices(input)).toEqual(['trainer']);
  });

  it('P-384: several interviewed services share ONE plan, so its gaps are reported once', () => {
    const issues = validateAcceptDecision(
      acceptWith(createServiceDecision('trainer'), createServiceDecision('consultant'))
    );
    expect(issues).toEqual([
      { code: 'slots-missing', service: null },
      { code: 'committee-missing', service: null },
    ]);
    const complete = withPlan(
      acceptWith(createServiceDecision('trainer'), createServiceDecision('consultant')),
      COMPLETE_PLAN
    );
    expect(validateAcceptDecision(complete)).toEqual([]);
    expect(interviewedServices(complete)).toEqual(['trainer', 'consultant']);
  });

  it('needs no interview plan when every accepted service is exempted', () => {
    const exempt = {
      ...createServiceDecision('trainer'),
      path: 'exemption' as const,
      exemptionReason: 'expert' as const,
    };
    expect(validateAcceptDecision(acceptWith(exempt))).toEqual([]);
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

describe('BUG-056 — screening slots start at least an hour from now', () => {
  it('flags a slot inside the next hour, for the application interview', () => {
    const now = new Date('2026-10-28T09:00:00Z');
    const trainer = acceptWith(createServiceDecision('trainer'));
    expect(
      validateAcceptDecision(
        withPlan(trainer, { slots: ['2026-10-28T09:20:00Z'], committeeMemberIds: ['stf-01'] }),
        now
      )
    ).toEqual([{ code: 'slot-too-soon', service: null }]);
    expect(
      validateAcceptDecision(
        withPlan(trainer, { slots: ['2026-10-28T10:20:00Z'], committeeMemberIds: ['stf-01'] }),
        now
      )
    ).toEqual([]);
  });
});
