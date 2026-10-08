import type { Result } from '@/types';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import type { ApplicationService } from '../applications/application.types';
import { MOCK_INBOX } from '../internal/mockInternalProvider';
import { MOCK_COMMITTEE_POOL } from '../screening/mockScreeningProvider';
import {
  MOCK_INTERVIEW_MODEL,
  MOCK_INTERVIEW_PASS_THRESHOLD,
  MOCK_INTERVIEW_RESULT_MAX_SCORE,
} from './mockInterviewModel';
import type { InterviewService } from './interviewService';
import {
  allMembersResponded,
  noServicePassed,
  type CommitteeMemberResponseDto,
  type InterviewDetailDto,
  type InterviewEvaluationInput,
  type InterviewViewerDto,
  type PostInterviewDecisionInput,
  type PostInterviewDecisionSummaryDto,
  type RescheduleInput,
  type ServiceEvaluationInput,
  type ServiceInterviewResultDto,
} from './interview.types';

/**
 * Versioned **mock** provider for EH-INT-04 (J-07 + the J-06 staff reschedule).
 * It simulates the *server's* responsibilities, which is where the journey's
 * hardest rules actually live:
 *
 * - The consolidated result is computed **only** once every assigned member has
 *   responded (`BR-0220`, F2/AC-1) — before that the provider returns `result:
 *   null`, so no partial average can reach the UI.
 * - Non-attendance entries are **excluded** from the average rather than scored
 *   as zero (F2/AC-2), and the count of exclusions is reported.
 * - Each accepted service is averaged independently (F1/AC-2).
 * - A reschedule keeps the **same** interview number (J-06/F4/AC-6).
 *
 * ⚠️ MOCK DATA (clearly labelled): committee names are reused from the screening
 * pool; axis scores are representative development data.
 */

/** Recorded evaluations per member — the mock's in-memory "database". */
interface StoredEvaluation {
  readonly memberId: string;
  readonly attended: boolean;
  /** Weighted 0–100 total per service; empty when the member did not attend. */
  readonly perService: Readonly<Record<string, number>>;
}

/** Seed: two of three assigned members have already responded. */
const SEED_MEMBER_IDS = ['stf-01', 'stf-02', 'stf-03'] as const;

const SEED_EVALUATIONS: readonly StoredEvaluation[] = [
  { memberId: 'stf-01', attended: true, perService: { trainer: 84, consultant: 76 } },
  { memberId: 'stf-02', attended: false, perService: {} },
];

/**
 * One member's total for a service, as the API computes it: each criterion
 * contributes (rating ÷ its max) × weight, a percentage of 100.
 */
function weightedServiceScore(evaluation: ServiceEvaluationInput): number {
  const total = MOCK_INTERVIEW_MODEL.axes.reduce((sum, axis) => {
    const entry = evaluation.axisScores.find((score) => score.axisId === axis.id);
    return sum + ((entry?.score ?? 0) / axis.maxScore) * axis.weight;
  }, 0);
  return Math.round(total * 100) / 100;
}

/**
 * F2/AC-2 — average of **submitted (attended)** evaluations only, per service.
 * Non-attendance is filtered out before averaging; it is never a zero.
 */
function computeResults(
  services: readonly ApplicationService[],
  evaluations: readonly StoredEvaluation[]
): readonly ServiceInterviewResultDto[] {
  const attended = evaluations.filter((evaluation) => evaluation.attended);
  const excluded = evaluations.length - attended.length;

  return services.map((service) => {
    const scores = attended
      .map((evaluation) => evaluation.perService[service])
      .filter((score): score is number => score != null);
    const average =
      scores.length === 0
        ? 0
        : Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100) / 100;
    return {
      service,
      average,
      maxScore: MOCK_INTERVIEW_RESULT_MAX_SCORE,
      countedEvaluations: scores.length,
      excludedNonAttendance: excluded,
      passThreshold: MOCK_INTERVIEW_PASS_THRESHOLD,
      passed: average >= MOCK_INTERVIEW_PASS_THRESHOLD,
    };
  });
}

function buildCommittee(
  evaluations: readonly StoredEvaluation[]
): readonly CommitteeMemberResponseDto[] {
  return SEED_MEMBER_IDS.map((memberId) => {
    const pool = MOCK_COMMITTEE_POOL.find((member) => member.id === memberId);
    const stored = evaluations.find((evaluation) => evaluation.memberId === memberId);
    return {
      memberId,
      name: pool?.name ?? memberId,
      roleTitle: pool?.roleTitle ?? { ar: '—', en: '—' },
      state: stored == null ? 'pending' : stored.attended ? 'submitted' : 'did-not-attend',
      respondedAt: stored == null ? null : '2026-07-28T10:00:00Z',
    };
  });
}

export interface MockInterviewProviderOptions {
  readonly latencyMs?: number;
  readonly failWith?: ExpertHubApiError;
  readonly now?: number;
  /** Who is looking — drives `viewer` (the server decides this for real). */
  readonly viewer?: Partial<InterviewViewerDto>;
  /** Start with every member already responded (result available immediately). */
  readonly allResponded?: boolean;
  /** Overrides the last member's per-service totals when `allResponded` is set. */
  readonly lastScores?: Readonly<Record<string, number>>;
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockInterviewProvider(
  options: MockInterviewProviderOptions = {}
): InterviewService {
  const {
    latencyMs = 300,
    failWith,
    now = new Date('2026-07-28T09:00:00Z').getTime(),
    viewer: viewerOverride,
    allResponded = false,
    lastScores,
  } = options;

  /** Mutable per-instance state, so a submission visibly advances the committee. */
  let evaluations: StoredEvaluation[] = allResponded
    ? [
        ...SEED_EVALUATIONS,
        {
          memberId: 'stf-03',
          attended: true,
          perService: lastScores ?? { trainer: 80, consultant: 64 },
        },
      ]
    : [...SEED_EVALUATIONS];
  let rescheduleCount = 0;
  let scheduledAt = '2026-07-30T08:00:00Z';
  let decision: PostInterviewDecisionSummaryDto | null = null;

  const buildDetail = (applicationId: string): InterviewDetailDto | null => {
    const row = MOCK_INBOX.find((item) => item.id === applicationId);
    if (row == null) {
      return null;
    }
    const committee = buildCommittee(evaluations);
    const complete = allMembersResponded(committee);
    const viewerMemberId = viewerOverride?.memberId ?? 'stf-03';
    const alreadyResponded = evaluations.some(
      (evaluation) => evaluation.memberId === viewerMemberId
    );

    return {
      applicationId: row.id,
      reference: row.reference,
      applicantName: row.applicantName,
      acceptedServices: row.services,
      exemptedServices: [],
      rescheduleRequest: null,
      ticket: {
        number: `INT-${row.reference.slice(-5)}`,
        scheduledAt,
        // Teams is not in the CAP-12 integration table yet (J-06 open item 1).
        meetingUrl: null,
        rescheduleCount,
      },
      model: MOCK_INTERVIEW_MODEL,
      committee,
      // `BR-0220` — no result at all until every member has responded.
      result: complete ? computeResults(row.services, evaluations) : null,
      viewer: {
        memberId: viewerMemberId,
        canEvaluate: viewerOverride?.canEvaluate ?? !alreadyResponded,
        // `BR-0208` — the screening decision-maker only.
        canDecide: viewerOverride?.canDecide ?? true,
        canReschedule: viewerOverride?.canReschedule ?? true,
        // As the server: only the decision-maker may reject.
        canReject: viewerOverride?.canReject ?? viewerOverride?.canDecide ?? true,
        fullNoShow: viewerOverride?.fullNoShow ?? false,
      },
      decision,
    };
  };

  const resolveDetail = (applicationId: string): Result<InterviewDetailDto, ExpertHubApiError> => {
    const detail = buildDetail(applicationId);
    return detail == null
      ? { ok: false, error: { status: 404, message: 'Interview not found' } }
      : { ok: true, value: detail };
  };

  return {
    async getInterviewDetail(applicationId) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      return resolveDetail(applicationId);
    },

    async submitEvaluation(applicationId: string, input: InterviewEvaluationInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const memberId = viewerOverride?.memberId ?? 'stf-03';
      const stored: StoredEvaluation =
        input.kind === 'did-not-attend'
          ? { memberId, attended: false, perService: {} }
          : {
              memberId,
              attended: true,
              perService: Object.fromEntries(
                input.services.map((service) => [service.service, weightedServiceScore(service)])
              ),
            };
      evaluations = [
        ...evaluations.filter((evaluation) => evaluation.memberId !== memberId),
        stored,
      ];
      return resolveDetail(applicationId);
    },

    async submitDecision(applicationId: string, input: PostInterviewDecisionInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      // The API's rule: nothing is forwarded when no service passed.
      const current = buildDetail(applicationId);
      if (
        input.kind === 'forward' &&
        noServicePassed(current?.result ?? null, current?.exemptedServices ?? [])
      ) {
        return { ok: false, error: { status: 409, message: 'no-service-passed' } };
      }
      const summary: PostInterviewDecisionSummaryDto = {
        kind: input.kind,
        decidedAt: new Date(now).toISOString(),
        decidedByName: 'مدير الفرز',
        rejectionReason: input.kind === 'reject' ? input.reason : null,
      };
      decision = summary;
      return { ok: true, value: summary };
    },

    async requestReschedule(applicationId: string, input: RescheduleInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const firstSlot = input.slots.find((slot) => slot.trim() !== '');
      if (firstSlot != null) {
        scheduledAt = new Date(firstSlot).toISOString();
      }
      // J-06/F4/AC-6 — the same interview ticket number is retained.
      rescheduleCount += 1;
      return resolveDetail(applicationId);
    },
  };
}
