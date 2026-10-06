import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import { createMockServiceRequestProvider } from './mockServiceRequestProvider';
import type {
  UploadedAddendumDto,
  ServiceRequestDecisionInput,
  ServiceRequestDetailDto,
  ServiceRequestFilters,
  ServiceRequestListDto,
} from './serviceRequest.types';

/**
 * Expert Hub service-request service — EH-INT-02b (CAP-01/03, journey **J-03**
 * F2+F3). Two providers implement the same versioned contract; swapping mock →
 * real API is configuration, not a UI change.
 *
 * The decision returns the **whole refreshed detail** rather than an ack,
 * because finalizing an approval changes several things at once (F3/AC-5: "the
 * update reflects everywhere the trainer's services/agreement are shown") and
 * only the server knows what moved.
 */

export const SERVICE_REQUESTS_API_VERSION = 'v1';

export interface ServiceRequestService {
  /** F2/AC-2 — the queue, searchable and filterable. */
  listServiceRequests(
    filters: ServiceRequestFilters
  ): Promise<Result<ServiceRequestListDto, ExpertHubApiError>>;
  /** F2/AC-1 — the request **with** the trainer's full approved profile. */
  getServiceRequest(id: string): Promise<Result<ServiceRequestDetailDto, ExpertHubApiError>>;
  /**
   * F3/AC-4 — store the addendum FIRST; an approval then carries the returned
   * `attachmentId` (J-01's document rule, 422 on format/size).
   */
  uploadAddendum(file: File): Promise<Result<UploadedAddendumDto, ExpertHubApiError>>;
  /**
   * F3 — the single administrative decision. Approving carries its addendum
   * (AC-4); rejecting carries its reason (AC-3). Neither routes to screening.
   */
  decideServiceRequest(
    id: string,
    input: ServiceRequestDecisionInput
  ): Promise<Result<ServiceRequestDetailDto, ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpServiceRequestProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): ServiceRequestService {
  return {
    listServiceRequests(filters) {
      const query = new URLSearchParams();
      if (filters.search.trim() !== '') {
        query.set('search', filters.search.trim());
      }
      if (filters.service !== 'all') {
        query.set('service', filters.service);
      }
      if (filters.status !== 'all') {
        query.set('status', filters.status);
      }
      const suffix = query.toString() === '' ? '' : `?${query.toString()}`;
      return client.get<ServiceRequestListDto>(
        `${SERVICE_REQUESTS_API_VERSION}/internal/service-requests${suffix}`
      );
    },
    getServiceRequest(id) {
      return client.get<ServiceRequestDetailDto>(
        `${SERVICE_REQUESTS_API_VERSION}/internal/service-requests/${encodeURIComponent(id)}`
      );
    },
    uploadAddendum(file) {
      // The application form's multipart shape: the file and what it is for.
      const payload = new FormData();
      payload.append('purpose', 'service-addendum');
      payload.append('file', file);
      return client.post<UploadedAddendumDto>(
        `${SERVICE_REQUESTS_API_VERSION}/internal/attachments`,
        payload
      );
    },
    decideServiceRequest(id, input) {
      // A plain JSON call carrying the stored addendum's id (`uploadAddendum`).
      return client.post<ServiceRequestDetailDto>(
        `${SERVICE_REQUESTS_API_VERSION}/internal/service-requests/${encodeURIComponent(id)}/decision`,
        input
      );
    },
  };
}

function createDefaultService(): ServiceRequestService {
  return isModuleLive('serviceRequests')
    ? createHttpServiceRequestProvider()
    : createMockServiceRequestProvider();
}

let serviceInstance: ServiceRequestService | null = null;

export function getServiceRequestService(): ServiceRequestService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/** Test seam: inject a seeded/failing provider (`null` restores the default). */
export function setServiceRequestServiceForTesting(service: ServiceRequestService | null): void {
  serviceInstance = service;
}
