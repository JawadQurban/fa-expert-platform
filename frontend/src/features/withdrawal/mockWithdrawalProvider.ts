import type { Result } from '@/types';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { canTerminate } from '../../contracts/engagementStatus';
import { createMockExecutionProvider } from '../execution/mockExecutionProvider';
import type { WithdrawalService } from './withdrawalService';
import {
  TERMINATION_ERROR_DETAILS,
  validateTermination,
  type DelinkTrainerInput,
  type TerminationResultDto,
  type WithdrawFromEngagementInput,
} from './withdrawal.types';

/**
 * Versioned **mock** provider for J-22.
 *
 * It answers for the two operations people have, and **nothing answers for F3**
 * — that is the point. A plan cancellation is not something anyone here can
 * request; the mock execution provider simply serves an already-cancelled
 * engagement (`eng-4`), which is exactly how one would arrive in production:
 * received from FAST, applied, and visible after the fact.
 *
 * The engagements it guards are **J-21's mock engagements**, read through that
 * provider, so the two mocks cannot disagree about what is upcoming. Its
 * refusals are `TerminateAsync`'s, in the server's order and with the server's
 * `detail` text: 404 → 409 `Already ended.` → 409 `engagement-not-upcoming` →
 * 400 `reason-required` / `note-required`. The result is
 * `contracts/fixtures/me.engagement-termination.json`'s shape.
 *
 * ⚠️ MOCK DATA (clearly labelled). ⚠️ Deterministic clock.
 * ⚠️ The notice deadline (`termination-deadline-passed`) is not simulated.
 */

/** ⚠️ MOCK — the fixed "today". */
const MOCK_NOW = '2026-08-20T09:00:00Z';

export interface MockWithdrawalProviderOptions {
  readonly latencyMs?: number;
  readonly failWith?: ExpertHubApiError;
  readonly now?: string;
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockWithdrawalProvider(
  options: MockWithdrawalProviderOptions = {}
): WithdrawalService {
  const { latencyMs = 300, failWith, now = MOCK_NOW } = options;
  const engagements = createMockExecutionProvider({ latencyMs: 0, now });
  const terminated = new Set<string>();

  async function terminate(
    engagementId: string,
    input: WithdrawFromEngagementInput | DelinkTrainerInput
  ): Promise<Result<TerminationResultDto, ExpertHubApiError>> {
    await delay(latencyMs);
    if (failWith != null) {
      return { ok: false, error: failWith };
    }
    const found = await engagements.getEngagement(engagementId);
    if (!found.ok) {
      return found;
    }
    const { status } = found.value;
    if (terminated.has(engagementId) || status === 'withdrawn' || status === 'cancelled') {
      return { ok: false, error: { status: 409, message: TERMINATION_ERROR_DETAILS.alreadyEnded } };
    }
    // F1 — "before its execution date"; only an upcoming engagement ends here.
    if (!canTerminate(status)) {
      return { ok: false, error: { status: 409, message: TERMINATION_ERROR_DETAILS.notUpcoming } };
    }
    // The same gate the UI applies, applied again here.
    const [issue] = validateTermination(input);
    if (issue != null) {
      return { ok: false, error: { status: 400, message: issue } };
    }
    terminated.add(engagementId);
    return {
      ok: true,
      // F1/AC-5 + F2/AC-5 — the slot goes back to matching.
      value: { engagementId, kind: 'withdrawn', occurredAt: now, slotReopened: true },
    };
  }

  return {
    withdrawFromEngagement: terminate,
    delinkTrainer: terminate,
  };
}

export { MOCK_NOW };
