import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import { createMockInterviewProvider } from './mockInterviewProvider';
import type {
  InterviewDetailDto,
  InterviewEvaluationInput,
  PostInterviewDecisionInput,
  PostInterviewDecisionSummaryDto,
  RescheduleInput,
} from './interview.types';

/**
 * Expert Hub interview service — EH-INT-04 (CAP-02, journey J-07 + the staff
 * half of J-06). The **only** data source that page consumes. Two providers
 * implement the same versioned contract:
 *
 * - **HTTP provider** — the future Expert Hub API, reached through the shared
 *   `apiClient`. Selected once `VITE_EXPERT_HUB_API_BASE_URL` is set.
 * - **Mock provider** — the versioned in-memory stand-in used until then.
 *
 * `submitEvaluation` returns the **whole refreshed detail** rather than an ack:
 * a member's submission can be the one that completes the committee and
 * therefore triggers the result calculation (`BR-0220`), so the server is the
 * only thing that decides whether a result now exists.
 */

export const INTERVIEW_API_VERSION = 'v1';

export interface InterviewService {
  /** The interview ticket, model, committee responses, result, and viewer rights. */
  getInterviewDetail(applicationId: string): Promise<Result<InterviewDetailDto, ExpertHubApiError>>;
  /** J-07/F1 — one member's evaluation, or their non-attendance. */
  submitEvaluation(
    applicationId: string,
    input: InterviewEvaluationInput
  ): Promise<Result<InterviewDetailDto, ExpertHubApiError>>;
  /** J-07/F3 — forward to the approval committee, or reject directly. */
  submitDecision(
    applicationId: string,
    input: PostInterviewDecisionInput
  ): Promise<Result<PostInterviewDecisionSummaryDto, ExpertHubApiError>>;
  /** J-06/F4/AC-3 — staff-triggered reschedule; the same ticket is retained. */
  requestReschedule(
    applicationId: string,
    input: RescheduleInput
  ): Promise<Result<InterviewDetailDto, ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpInterviewProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): InterviewService {
  const base = (applicationId: string) =>
    `${INTERVIEW_API_VERSION}/internal/applications/${encodeURIComponent(applicationId)}/interview`;

  return {
    getInterviewDetail(applicationId) {
      return client.get<InterviewDetailDto>(base(applicationId));
    },
    submitEvaluation(applicationId, input) {
      return client.post<InterviewDetailDto>(`${base(applicationId)}/evaluations`, input);
    },
    submitDecision(applicationId, input) {
      return client.post<PostInterviewDecisionSummaryDto>(`${base(applicationId)}/decision`, input);
    },
    requestReschedule(applicationId, input) {
      return client.post<InterviewDetailDto>(`${base(applicationId)}/reschedule`, input);
    },
  };
}

function createDefaultService(): InterviewService {
  return isModuleLive('interviews') ? createHttpInterviewProvider() : createMockInterviewProvider();
}

let serviceInstance: InterviewService | null = null;

/** The application-wide interview service instance the page consumes. */
export function getInterviewService(): InterviewService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/**
 * Test seam: inject a seeded/failing provider (pass `null` to restore the
 * default). Test-only — production code never calls this.
 */
export function setInterviewServiceForTesting(service: InterviewService | null): void {
  serviceInstance = service;
}
