import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import { createMockEntitlementProvider } from './mockEntitlementProvider';
import type {
  EntitlementQuery,
  StaffEntitlementDto,
  TrainerEntitlementDto,
} from './entitlement.types';

/**
 * Expert Hub financial entitlement service — **CAP-06** (`BRD-TRN-001` §8.6),
 * catalogued as **J-28**.
 *
 * **This interface has two operations and both are reads.**
 *
 * `BR-0601` forbids entering or editing the disbursement status, amount or date
 * "by hand, under any circumstance — they are consumed whole from ERP", and the
 * capability definition adds that it "calculates no amount and creates no
 * disbursement order". `BR-0605` removes even the dispute path: enquiries are
 * handled outside the platform in this release.
 *
 * So there is no input type on this contract, nothing to submit, nothing to
 * correct, and nothing to escalate. Every rule in §8.6.5 is about what must
 * *not* happen here, and the shortest way to honour all four was to give the
 * contract no way to do anything at all.
 *
 * ⚠️ The browser never reaches ERP. Every value arrives through the Expert Hub
 * API (`02C` §5), which is also the only place an ERP credential exists.
 */

export const ENTITLEMENTS_API_VERSION = 'v1';

export interface EntitlementService {
  /**
   * `F-0601` — the signed-in trainer's own record. Returns only fully-linked
   * entitlements, because `BR-0603` says an incomplete one "stays hidden from
   * the trainer" — which is why the return type has no shape for one.
   */
  listMyEntitlements(): Promise<Result<readonly TrainerEntitlementDto[], ExpertHubApiError>>;
  /**
   * `F-0602` — the staff view: any trainer's record, tied to their agreement and
   * programmes, **including the incomplete records their trainer cannot see**.
   */
  listEntitlements(
    query: EntitlementQuery
  ): Promise<Result<readonly StaffEntitlementDto[], ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpEntitlementProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): EntitlementService {
  const base = ENTITLEMENTS_API_VERSION;
  return {
    listMyEntitlements() {
      return client.get<readonly TrainerEntitlementDto[]>(`${base}/me/entitlements`);
    },
    listEntitlements(query) {
      const params = new URLSearchParams();
      if (query.trainer.trim() !== '') {
        params.set('trainer', query.trainer.trim());
      }
      if (query.onlyIncomplete) {
        params.set('linkage', 'incomplete');
      }
      const suffix = params.toString() === '' ? '' : `?${params.toString()}`;
      return client.get<readonly StaffEntitlementDto[]>(`${base}/internal/entitlements${suffix}`);
    },
  };
}

function createDefaultService(): EntitlementService {
  return isModuleLive('entitlements')
    ? createHttpEntitlementProvider()
    : createMockEntitlementProvider();
}

let serviceInstance: EntitlementService | null = null;

export function getEntitlementService(): EntitlementService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/** Test seam: inject a seeded/failing provider (`null` restores the default). */
export function setEntitlementServiceForTesting(service: EntitlementService | null): void {
  serviceInstance = service;
}
