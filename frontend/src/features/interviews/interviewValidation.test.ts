import { describe, expect, it } from 'vitest';
import { MOCK_INTERVIEW_MODEL } from './mockInterviewModel';
import {
  allMembersResponded,
  createServiceEvaluation,
  noServicePassed,
  pendingMembers,
  validateEvaluation,
  validatePostInterviewDecision,
  validateReschedule,
} from './interview.types';
import type { CommitteeMemberResponseDto, ServiceEvaluationInput } from './interview.types';

/**
 * J-07's rules as unit tests. They live in the contract module rather than the
 * component so they hold for every future caller — the staff page today, an
 * API-side re-check or a different surface later.
 */
const model = MOCK_INTERVIEW_MODEL;

function fullyScored(service: 'trainer' | 'consultant'): ServiceEvaluationInput {
  return {
    ...createServiceEvaluation(service, model),
    axisScores: model.axes.map((axis) => ({ axisId: axis.id, score: 4 })),
    recommendation: 'recommend',
  };
}

function member(
  memberId: string,
  state: CommitteeMemberResponseDto['state']
): CommitteeMemberResponseDto {
  return {
    memberId,
    name: memberId,
    roleTitle: { ar: '—', en: '—' },
    state,
    respondedAt: state === 'pending' ? null : '2026-07-28T10:00:00Z',
  };
}

describe('validateEvaluation (J-07/F1)', () => {
  it('requires every axis of every accepted service to be scored', () => {
    const issues = validateEvaluation(
      { kind: 'evaluation', services: [createServiceEvaluation('trainer', model)] },
      model
    );
    // One issue per unscored axis — and nothing for the recommendation.
    expect(issues.filter((issue) => issue.code === 'axis-score-missing')).toHaveLength(
      model.axes.length
    );
    expect(issues).toHaveLength(model.axes.length);
  });

  it('accepts a fully scored service with no recommendation (optional)', () => {
    const service = { ...fullyScored('trainer'), recommendation: null };
    expect(validateEvaluation({ kind: 'evaluation', services: [service] }, model)).toEqual([]);
  });

  it('reports each service independently (AC-2)', () => {
    const issues = validateEvaluation(
      {
        kind: 'evaluation',
        services: [fullyScored('trainer'), createServiceEvaluation('consultant', model)],
      },
      model
    );
    // The complete service contributes nothing; only the empty one is flagged.
    expect(new Set(issues.map((issue) => issue.service))).toEqual(new Set(['consultant']));
  });

  it('treats a score of 0 as scored, and null as missing (never coerced), on a model without named levels', () => {
    const unscaled = { ...model, ratingScale: null };
    const zeroed: ServiceEvaluationInput = {
      ...fullyScored('trainer'),
      axisScores: model.axes.map((axis) => ({ axisId: axis.id, score: 0 })),
    };
    expect(validateEvaluation({ kind: 'evaluation', services: [zeroed] }, unscaled)).toEqual([]);
  });

  it('accepts only the approved 1–5 levels on the approved model', () => {
    for (const outOfScale of [0, 6, 4.5]) {
      const scored: ServiceEvaluationInput = {
        ...fullyScored('trainer'),
        axisScores: model.axes.map((axis) => ({ axisId: axis.id, score: outOfScale })),
      };
      expect(
        validateEvaluation({ kind: 'evaluation', services: [scored] }, model).filter(
          (issue) => issue.code === 'axis-score-missing'
        )
      ).toHaveLength(model.axes.length);
    }
  });

  it('passes for a fully scored evaluation', () => {
    expect(
      validateEvaluation({ kind: 'evaluation', services: [fullyScored('trainer')] }, model)
    ).toEqual([]);
  });

  it('accepts non-attendance without any scoring (AC-3)', () => {
    expect(validateEvaluation({ kind: 'did-not-attend' }, model)).toEqual([]);
  });
});

describe('the approved interview model mirrored for mock mode (J-07)', () => {
  it('carries the ten approved criteria, weights summing to 100, and the 1–5 scale', () => {
    expect(model.axes.map((axis) => axis.id)).toEqual([
      'training-skills',
      'communication-skills',
      'training-camps-willingness',
      'energy-levels',
      'emotional-intelligence',
      'client-needs-flexibility',
      'community-giving-back',
      'organizational-values',
      'cultural-sensitivity',
      'thinking-comprehension',
    ]);
    expect(model.axes.map((axis) => axis.weight)).toEqual([
      33.3, 16.7, 16.7, 6.7, 6.7, 6.7, 3.3, 3.3, 3.3, 3.3,
    ]);
    const total = model.axes.reduce((sum, axis) => sum + axis.weight * 10, 0) / 10;
    expect(total).toBe(100);
    expect(model.ratingScale?.map((level) => level.label.en)).toEqual([
      'Very Poor',
      'Poor',
      'Acceptable',
      'Good',
      'Excellent',
    ]);
  });
});

describe('noServicePassed (the 70% pass mark)', () => {
  const base = {
    maxScore: 100,
    countedEvaluations: 1,
    excludedNonAttendance: 0,
    passThreshold: 70,
  };

  it('is true only when a result exists and every service did not pass', () => {
    expect(
      noServicePassed([
        { ...base, service: 'trainer', average: 60, passed: false },
        { ...base, service: 'consultant', average: 50, passed: false },
      ])
    ).toBe(true);
    expect(
      noServicePassed([
        { ...base, service: 'trainer', average: 70, passed: true },
        { ...base, service: 'consultant', average: 50, passed: false },
      ])
    ).toBe(false);
    expect(noServicePassed(null)).toBe(false);
  });

  it('keeps the application forwardable when another service was exempted from interview', () => {
    const allFailed = [
      { ...base, service: 'trainer' as const, average: 60, passed: false },
      { ...base, service: 'consultant' as const, average: 50, passed: false },
    ];
    expect(noServicePassed(allFailed, ['content-developer'])).toBe(false);
    expect(noServicePassed(allFailed, [])).toBe(true);
  });

  it('gates nothing on a model without a pass mark', () => {
    expect(
      noServicePassed([
        { ...base, service: 'trainer', average: 4.45, passThreshold: null, passed: null },
      ])
    ).toBe(false);
  });
});

describe('allMembersResponded / pendingMembers (BR-0220, F2/AC-1)', () => {
  it('is false while any assigned member is still pending', () => {
    const committee = [member('a', 'submitted'), member('b', 'pending')];
    expect(allMembersResponded(committee)).toBe(false);
    expect(pendingMembers(committee).map((entry) => entry.memberId)).toEqual(['b']);
  });

  it('counts non-attendance as a response, not as an absence of one', () => {
    const committee = [member('a', 'submitted'), member('b', 'did-not-attend')];
    expect(allMembersResponded(committee)).toBe(true);
    expect(pendingMembers(committee)).toEqual([]);
  });

  it('is false for an empty committee (nothing to average)', () => {
    expect(allMembersResponded([])).toBe(false);
  });
});

describe('validatePostInterviewDecision (J-07/F3/AC-2, BR-0219)', () => {
  it('needs no reason to forward', () => {
    expect(validatePostInterviewDecision({ kind: 'forward' })).toEqual([]);
  });

  it('accepts a listed rejection reason', () => {
    expect(
      validatePostInterviewDecision({
        kind: 'reject',
        reason: 'insufficient-experience',
        reasonOther: '',
      })
    ).toEqual([]);
  });

  it('requires free text when the reason is "other"', () => {
    expect(
      validatePostInterviewDecision({ kind: 'reject', reason: 'other', reasonOther: '  ' })
    ).toEqual(['reason-other-missing']);
  });
});

describe('validateReschedule (J-06/F4)', () => {
  it('requires at least one non-blank slot', () => {
    expect(validateReschedule({ slots: ['', '   '], note: '' })).toBe(false);
    expect(validateReschedule({ slots: ['2026-08-05T09:00'], note: '' })).toBe(true);
  });
});
