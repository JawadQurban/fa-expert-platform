import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import { createMockEngagementProvider } from './mockEngagementProvider';
import type {
  AssignmentOfferDto,
  AssignmentSlotDto,
  MyEngagementDto,
  RespondToOfferInput,
} from './offer.types';

/**
 * Expert Hub offers & engagements service — journey **J-18**.
 *
 * **There is no `sendOffer`.** F1/AC-1 sends offers automatically to the
 * top-ranked candidate "with no additional manual staff action", so nothing on
 * this interface can send one: an offer exists because J-17's approval created
 * it, and the only writes here are the trainer's own answer.
 *
 * Expiry is likewise the **server's** (F2/AC-3, "automatically expires"). The
 * client renders a countdown; it never decides that three days have passed.
 */

export const ENGAGEMENTS_API_VERSION = 'v1';

export interface EngagementService {
  /* ── the trainer's side ────────────────────────────────────────────── */

  /** Offers awaiting this trainer's answer (F2/AC-1). */
  listMyOffers(): Promise<Result<readonly AssignmentOfferDto[], ExpertHubApiError>>;
  /** F3/AC-2 — the "My Engagements" section, populated the moment one is accepted. */
  listMyEngagements(): Promise<Result<readonly MyEngagementDto[], ExpertHubApiError>>;
  /**
   * F2/AC-1 — accept or reject. On accept the server confirms the engagement
   * (F3), writes `PlanTrainer.TrainerId` to FAST (F4) and checks the plan's
   * training-material status (F5) — all of which is why this returns nothing the
   * client could have computed.
   */
  respondToOffer(
    offerId: string,
    input: RespondToOfferInput
  ): Promise<Result<readonly MyEngagementDto[], ExpertHubApiError>>;

  /* ── the internal tracking side ────────────────────────────────────── */

  /** Per-slot offer state for one request: live offer, backups, history, sync. */
  getRequestSlots(
    requestId: string
  ): Promise<Result<readonly AssignmentSlotDto[], ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpEngagementProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): EngagementService {
  const base = ENGAGEMENTS_API_VERSION;
  return {
    listMyOffers() {
      return client.get<readonly AssignmentOfferDto[]>(`${base}/me/assignment-offers`);
    },
    listMyEngagements() {
      return client.get<readonly MyEngagementDto[]>(`${base}/me/engagements`);
    },
    respondToOffer(offerId, input) {
      return client.post<readonly MyEngagementDto[]>(
        `${base}/me/assignment-offers/${encodeURIComponent(offerId)}/response`,
        input
      );
    },
    getRequestSlots(requestId) {
      return client.get<readonly AssignmentSlotDto[]>(
        `${base}/internal/assignment-requests/${encodeURIComponent(requestId)}/slots`
      );
    },
  };
}

function createDefaultService(): EngagementService {
  return isModuleLive('engagements')
    ? createHttpEngagementProvider()
    : createMockEngagementProvider();
}

let serviceInstance: EngagementService | null = null;

export function getEngagementService(): EngagementService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/** Test seam: inject a seeded/failing provider (`null` restores the default). */
export function setEngagementServiceForTesting(service: EngagementService | null): void {
  serviceInstance = service;
}
