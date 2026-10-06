import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import { createMockExecutionProvider } from './mockExecutionProvider';
import type { EngagementDetailDto } from './engagementDetail.types';

/**
 * Expert Hub engagement-execution service — journey **J-21**.
 *
 * **It reads, and only reads.** Every fact on an engagement's detail belongs to
 * a system outside the browser:
 *
 * - the plan data, the venue and the Teams URL come from **FAST** (F1/AC-1, F2)
 * - the enrolment list and the attendance come from FAST's `PlanTaker`
 *   (F3/AC-3, F4/AC-1) — ⚠️ not supplied (`Q20`), so the API names the gap
 * - the trainee evaluations come **directly from MTM**, "without FAST as an
 *   intermediary" (F6/AC-2) — ⚠️ no integration yet (`Q29`)
 * - the lifecycle status is derived from the schedule (F5/AC-1)
 *
 * so there is **no write operation on this interface at all** — nothing to
 * complete an engagement, edit a date, or mark attendance. The trainer follows
 * an engagement; they do not administer one.
 *
 * The frontend never calls FAST or MTM. Both arrive through the Expert Hub API
 * (`02C` §5), which is also the only place a credential for either exists.
 */

export const EXECUTION_API_VERSION = 'v1';

export interface ExecutionService {
  /** F1 — one engagement, with everything J-21 shows on it. */
  getEngagement(engagementId: string): Promise<Result<EngagementDetailDto, ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpExecutionProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): ExecutionService {
  const base = `${EXECUTION_API_VERSION}/me/engagements`;
  return {
    getEngagement(engagementId) {
      return client.get<EngagementDetailDto>(`${base}/${encodeURIComponent(engagementId)}`);
    },
  };
}

function createDefaultService(): ExecutionService {
  return isModuleLive('execution') ? createHttpExecutionProvider() : createMockExecutionProvider();
}

let serviceInstance: ExecutionService | null = null;

export function getExecutionService(): ExecutionService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/** Test seam: inject a seeded/failing provider (`null` restores the default). */
export function setExecutionServiceForTesting(service: ExecutionService | null): void {
  serviceInstance = service;
}
