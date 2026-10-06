import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import { createMockAgreementLifecycleProvider } from './mockAgreementLifecycleProvider';
import type {
  AgreementDetailDto,
  AgreementFilters,
  AgreementLifecycleInput,
  AgreementListDto,
  AgreementTemplateDto,
  SaveTemplateInput,
} from './agreementLifecycle.types';

/**
 * Expert Hub agreement-lifecycle service — EH-INT-06 (CAP-03, journey **J-12**).
 *
 * Every mutation returns the **whole refreshed detail** rather than an ack: a
 * renewal changes the status, the end date, the renewal count, the next term,
 * and the history in one write, and only the server knows the resulting shape
 * (F1/AC-1 + F2/AC-2 are both its arithmetic).
 */

export const AGREEMENTS_API_VERSION = 'v1';

export interface AgreementLifecycleService {
  listAgreements(filters: AgreementFilters): Promise<Result<AgreementListDto, ExpertHubApiError>>;
  getAgreement(id: string): Promise<Result<AgreementDetailDto, ExpertHubApiError>>;
  /**
   * F2 + F3 — renew, suspend, reactivate, or end. One endpoint, because the four
   * are mutually exclusive answers to "what happens to this agreement now", and
   * because the resulting state is the server's to compute either way.
   */
  applyLifecycleAction(
    id: string,
    input: AgreementLifecycleInput
  ): Promise<Result<AgreementDetailDto, ExpertHubApiError>>;
  /** F4 — the central template used across all agreement generation. */
  getTemplate(): Promise<Result<AgreementTemplateDto, ExpertHubApiError>>;
  saveTemplate(input: SaveTemplateInput): Promise<Result<AgreementTemplateDto, ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpAgreementLifecycleProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): AgreementLifecycleService {
  const base = `${AGREEMENTS_API_VERSION}/internal/agreements`;
  return {
    listAgreements(filters) {
      const query = new URLSearchParams();
      if (filters.search.trim() !== '') {
        query.set('search', filters.search.trim());
      }
      if (filters.status !== 'all') {
        query.set('status', filters.status);
      }
      if (filters.milestone !== 'all') {
        query.set('milestone', filters.milestone);
      }
      const suffix = query.toString() === '' ? '' : `?${query.toString()}`;
      return client.get<AgreementListDto>(`${base}${suffix}`);
    },
    getAgreement(id) {
      return client.get<AgreementDetailDto>(`${base}/${encodeURIComponent(id)}`);
    },
    applyLifecycleAction(id, input) {
      return client.post<AgreementDetailDto>(`${base}/${encodeURIComponent(id)}/lifecycle`, input);
    },
    getTemplate() {
      return client.get<AgreementTemplateDto>(`${base}/template`);
    },
    saveTemplate(input) {
      return client.post<AgreementTemplateDto>(`${base}/template`, input);
    },
  };
}

function createDefaultService(): AgreementLifecycleService {
  return isModuleLive('agreementLifecycle')
    ? createHttpAgreementLifecycleProvider()
    : createMockAgreementLifecycleProvider();
}

let serviceInstance: AgreementLifecycleService | null = null;

export function getAgreementLifecycleService(): AgreementLifecycleService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/** Test seam: inject a seeded/failing provider (`null` restores the default). */
export function setAgreementLifecycleServiceForTesting(
  service: AgreementLifecycleService | null
): void {
  serviceInstance = service;
}
