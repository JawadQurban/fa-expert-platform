import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import { createMockScreeningProvider } from './mockScreeningProvider';
import type {
  ScreeningDecisionInput,
  ScreeningDecisionResultDto,
  ScreeningDetailDto,
} from './screening.types';

/**
 * Expert Hub screening service — EH-INT-03 (CAP-02, journeys J-05 + J-08). The
 * **only** data source that page consumes. Two providers implement the same
 * versioned contract:
 *
 * - **HTTP provider** — the future Expert Hub API, reached through the shared
 *   `apiClient`. Selected once `VITE_EXPERT_HUB_API_BASE_URL` is set.
 * - **Mock provider** — the versioned in-memory stand-in used until then.
 *
 * Swapping mock → real API is configuration, not a UI change.
 */

export const SCREENING_API_VERSION = 'v1';

export interface ScreeningService {
  /** The Application Insight Page payload (J-05/F2): scores, AI insight, form, files, SLA. */
  getScreeningDetail(applicationId: string): Promise<Result<ScreeningDetailDto, ExpertHubApiError>>;
  /** Records the screening decision (J-05/F5, J-08/F1). The server owns auto-rejection. */
  submitDecision(
    applicationId: string,
    decision: ScreeningDecisionInput
  ): Promise<Result<ScreeningDecisionResultDto, ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpScreeningProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): ScreeningService {
  return {
    getScreeningDetail(applicationId) {
      return client.get<ScreeningDetailDto>(
        `${SCREENING_API_VERSION}/internal/applications/${encodeURIComponent(applicationId)}/screening`
      );
    },
    submitDecision(applicationId, decision) {
      return client.post<ScreeningDecisionResultDto>(
        `${SCREENING_API_VERSION}/internal/applications/${encodeURIComponent(applicationId)}/screening/decision`,
        decision
      );
    },
  };
}

function createDefaultService(): ScreeningService {
  return isModuleLive('screening') ? createHttpScreeningProvider() : createMockScreeningProvider();
}

let serviceInstance: ScreeningService | null = null;

/** The application-wide screening service instance the page consumes. */
export function getScreeningService(): ScreeningService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/**
 * Test seam: inject a seeded/failing provider (pass `null` to restore the
 * default). Test-only — production code never calls this.
 */
export function setScreeningServiceForTesting(service: ScreeningService | null): void {
  serviceInstance = service;
}
