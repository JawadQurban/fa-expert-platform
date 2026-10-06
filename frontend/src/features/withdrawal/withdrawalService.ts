import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import { createMockWithdrawalProvider } from './mockWithdrawalProvider';
import type {
  DelinkTrainerInput,
  TerminationResultDto,
  WithdrawFromEngagementInput,
} from './withdrawal.types';

/**
 * Expert Hub withdrawal & cancellation service — journey **J-22**.
 *
 * **There is no `cancelPlan`, and there never can be.** F3/AC-2: "there is no
 * path to cancel a plan manually from within the platform **under any
 * circumstance** — cancellation originates exclusively from FAST". The only
 * thing this contract does with a cancellation is receive its consequences; the
 * cancelled engagements simply arrive already terminated, which is why F3 needs
 * no operation here at all.
 *
 * The two operations that do exist are the two J-22 grants to people, and they
 * are separate rather than one parameterised call — because F1 and F2 have
 * different actors, different reason lists, and different people to notify.
 */

export const WITHDRAWAL_API_VERSION = 'v1';

export interface WithdrawalService {
  /**
   * **F1** — the trainer ends their own confirmed engagement before its
   * execution date. Only this slot ends (AC-3); the slot returns to J-19 (AC-5).
   */
  withdrawFromEngagement(
    engagementId: string,
    input: WithdrawFromEngagementInput
  ): Promise<Result<TerminationResultDto, ExpertHubApiError>>;
  /**
   * **F2** — staff remove one trainer from a plan. Platform-side only: the plan
   * itself is untouched in FAST (AC-3), and nothing on this contract could touch
   * it if it wanted to.
   */
  delinkTrainer(
    engagementId: string,
    input: DelinkTrainerInput
  ): Promise<Result<TerminationResultDto, ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpWithdrawalProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): WithdrawalService {
  const base = WITHDRAWAL_API_VERSION;
  return {
    withdrawFromEngagement(engagementId, input) {
      return client.post<TerminationResultDto>(
        `${base}/me/engagements/${encodeURIComponent(engagementId)}/withdrawal`,
        input
      );
    },
    delinkTrainer(engagementId, input) {
      return client.post<TerminationResultDto>(
        `${base}/internal/engagements/${encodeURIComponent(engagementId)}/delink`,
        input
      );
    },
  };
}

function createDefaultService(): WithdrawalService {
  return isModuleLive('withdrawal')
    ? createHttpWithdrawalProvider()
    : createMockWithdrawalProvider();
}

let serviceInstance: WithdrawalService | null = null;

export function getWithdrawalService(): WithdrawalService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/** Test seam: inject a seeded/failing provider (`null` restores the default). */
export function setWithdrawalServiceForTesting(service: WithdrawalService | null): void {
  serviceInstance = service;
}
