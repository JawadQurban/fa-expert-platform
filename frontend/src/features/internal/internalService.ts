import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import type { DashboardDto, InboxListDto, InboxQuery } from './internal.types';
import { createMockInternalProvider } from './mockInternalProvider';

/**
 * Expert Hub internal/staff service — EH-INT-01 (Dashboard, CAP-09) + EH-INT-02
 * (Application Inbox, CAP-01). The **only** data source those pages consume. Two
 * providers implement the same versioned contract:
 *
 * - **HTTP provider** — the future Expert Hub API (staff endpoints), reached
 *   through the shared `apiClient`. Selected once `VITE_EXPERT_HUB_API_BASE_URL`
 *   is set.
 * - **Mock provider** — the versioned in-memory stand-in used until then.
 *
 * Swapping mock → real API is configuration, not a UI change.
 */

export const INTERNAL_API_VERSION = 'v1';

export interface InternalService {
  /** EH-INT-01: role-scoped operational summary (derived counts + recent peek). */
  getDashboard(): Promise<Result<DashboardDto, ExpertHubApiError>>;
  /** EH-INT-02: the staff application inbox (all applicants, role-scoped). */
  getInbox(query: InboxQuery): Promise<Result<InboxListDto, ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpInternalProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): InternalService {
  return {
    getDashboard() {
      return client.get<DashboardDto>(`${INTERNAL_API_VERSION}/internal/dashboard`);
    },
    getInbox(query) {
      const params = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
      });
      if (query.search != null && query.search.trim() !== '') {
        params.set('search', query.search.trim());
      }
      if (query.status != null && query.status !== 'all') {
        params.set('status', query.status);
      }
      return client.get<InboxListDto>(
        `${INTERNAL_API_VERSION}/internal/applications?${params.toString()}`
      );
    },
  };
}

function createDefaultService(): InternalService {
  return isModuleLive('internal') ? createHttpInternalProvider() : createMockInternalProvider();
}

let serviceInstance: InternalService | null = null;

/** The application-wide internal service instance the pages consume. */
export function getInternalService(): InternalService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/**
 * Test seam: inject a seeded/failing provider (pass `null` to restore the
 * default). Test-only — production code never calls this.
 */
export function setInternalServiceForTesting(service: InternalService | null): void {
  serviceInstance = service;
}
