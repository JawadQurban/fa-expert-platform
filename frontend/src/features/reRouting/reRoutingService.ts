import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import type {
  CandidatePoolDto,
  MatchCandidateDto,
  MatchingRunDto,
  PoolDecisionInput,
  SendPoolInput,
} from '../assignments/matching.types';
import { createMockReRoutingProvider } from './mockReRoutingProvider';
import type { SlotCycleDto } from './reRouting.types';

/**
 * Expert Hub slot re-routing service — EH-INT-09d (CAP-05, journey **J-19**).
 *
 * **Every operation takes a slot number, and none takes only a request.** F2/AC-1
 * scopes re-matching "to that specific slot only — not the entire original
 * request", so a request-wide re-match is not something this contract can
 * express. J-17's request-scoped operations remain what they always were: the
 * *original* cycle, run once.
 *
 * **There is no escalate, no cancel-slot, and no reopen-slot.** F3/AC-3 says an
 * endlessly-exhausting slot simply repeats the cycle with "no escalation
 * mechanism triggered", and F2/AC-2 forbids touching a confirmed sibling — so
 * neither has an operation to reach for.
 */

export const RE_ROUTING_API_VERSION = 'v1';

export interface ReRoutingService {
  /** The slot's cycle: its status, pool, siblings, and who already refused. */
  getSlotCycle(
    requestId: string,
    slotNumber: number
  ): Promise<Result<SlotCycleDto, ExpertHubApiError>>;
  /**
   * **F2/AC-1** — re-run the engine for this slot. F2/AC-3: the same exclusion
   * rules as the original cycle, and **no** exclusion for having refused before.
   */
  runSlotMatching(
    requestId: string,
    slotNumber: number
  ): Promise<Result<MatchingRunDto, ExpertHubApiError>>;
  /** **F2/AC-1** — the manual path, scoped the same way. */
  searchSlotCandidates(
    requestId: string,
    slotNumber: number,
    query: string
  ): Promise<Result<readonly MatchCandidateDto[], ExpertHubApiError>>;
  /**
   * **F3/AC-1** — send the new set to the requesting party "exactly as in
   * J-17/F4", so it takes J-17's own input type and the same one-batch rule.
   * Answers with the **pool**, not the cycle — re-read the cycle afterwards.
   */
  sendSlotPool(
    requestId: string,
    slotNumber: number,
    input: SendPoolInput
  ): Promise<Result<CandidatePoolDto, ExpertHubApiError>>;
  /**
   * **F3/AC-2** — the requesting party's per-candidate decision and ranking. On
   * approval the J-18 offer cycle restarts for this slot with the new
   * top-ranked candidate; rejecting all of them exhausts the slot again and
   * opens the next cycle. Answers with the **pool** — re-read the cycle.
   */
  decideSlotPool(
    requestId: string,
    slotNumber: number,
    input: PoolDecisionInput
  ): Promise<Result<CandidatePoolDto, ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpReRoutingProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): ReRoutingService {
  const slotPath = (requestId: string, slotNumber: number) =>
    `${RE_ROUTING_API_VERSION}/internal/assignment-requests/${encodeURIComponent(requestId)}/slots/${String(slotNumber)}`;
  return {
    getSlotCycle(requestId, slotNumber) {
      return client.get<SlotCycleDto>(`${slotPath(requestId, slotNumber)}/cycle`);
    },
    runSlotMatching(requestId, slotNumber) {
      return client.post<MatchingRunDto>(`${slotPath(requestId, slotNumber)}/matching/run`);
    },
    searchSlotCandidates(requestId, slotNumber, query) {
      const suffix = query.trim() === '' ? '' : `?q=${encodeURIComponent(query.trim())}`;
      return client.get<readonly MatchCandidateDto[]>(
        `${slotPath(requestId, slotNumber)}/matching/candidates${suffix}`
      );
    },
    sendSlotPool(requestId, slotNumber, input) {
      return client.post<CandidatePoolDto>(`${slotPath(requestId, slotNumber)}/pool`, input);
    },
    decideSlotPool(requestId, slotNumber, input) {
      return client.post<CandidatePoolDto>(
        `${slotPath(requestId, slotNumber)}/pool/decision`,
        input
      );
    },
  };
}

function createDefaultService(): ReRoutingService {
  return isModuleLive('reRouting') ? createHttpReRoutingProvider() : createMockReRoutingProvider();
}

let serviceInstance: ReRoutingService | null = null;

export function getReRoutingService(): ReRoutingService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/** Test seam: inject a seeded/failing provider (`null` restores the default). */
export function setReRoutingServiceForTesting(service: ReRoutingService | null): void {
  serviceInstance = service;
}
