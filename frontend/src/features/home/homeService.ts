import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import type { PortalHomeDto } from './home.types';
import { createMockHomeProvider } from './mockHomeProvider';

/**
 * Expert Hub portal-home service (`CAP-09` personal, EH-TP-01) — the **only** data
 * source the Portal Home consumes. Two providers implement the same versioned
 * contract:
 *
 * - **HTTP provider** — the future Expert Hub API personal-summary endpoint
 *   (aggregates live-read metrics + the persisted calculated rating server-side).
 *   Selected once `VITE_EXPERT_HUB_API_BASE_URL` is set.
 * - **Mock provider** — the versioned in-memory stand-in used until then.
 *
 * Swapping mock → real API is configuration, not a UI change.
 */
export const HOME_API_VERSION = 'v1';

export interface HomeService {
  getPortalHome(): Promise<Result<PortalHomeDto, ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpHomeProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): HomeService {
  return {
    getPortalHome() {
      return client.get<PortalHomeDto>(`${HOME_API_VERSION}/me/home`);
    },
  };
}

function createDefaultService(): HomeService {
  return isModuleLive('home') ? createHttpHomeProvider() : createMockHomeProvider();
}

let serviceInstance: HomeService | null = null;

/** The application-wide home service instance the page consumes. */
export function getHomeService(): HomeService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/**
 * Test seam: inject a seeded/failing provider (pass `null` to restore the
 * default). Test-only — production code never calls this.
 */
export function setHomeServiceForTesting(service: HomeService | null): void {
  serviceInstance = service;
}
