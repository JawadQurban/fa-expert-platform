import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import type { DirectoryListDto, DirectoryQuery, PublicTrainerProfileDto } from './directory.types';
import { createMockDirectoryProvider } from './mockDirectoryProvider';

/**
 * Expert Hub public directory service (`CAP-10`, EH-PUB-02/03) — the **only**
 * data source the public directory pages consume. Two providers implement the
 * same versioned contract:
 *
 * - **HTTP provider** — the future *public* Expert Hub API endpoints, reached
 *   through the shared `apiClient` (which never talks to FAST/MTM directly —
 *   `02C` §5; the directory reads the Expert-Hub-owned consent-gated projection,
 *   `BR-1005`). Selected automatically once `VITE_EXPERT_HUB_API_BASE_URL` is set.
 * - **Mock provider** — the versioned in-memory stand-in used until then.
 *
 * These endpoints require **no auth** (public, `BR-1002` gates on consent, not on
 * the caller). Swapping mock → real API is configuration, not a UI change.
 */

/** API version prefix baked into every directory endpoint. */
export const DIRECTORY_API_VERSION = 'v1';

export interface DirectoryService {
  /** EH-PUB-02: one page of the consent-visible trainer projection. */
  listDirectory(query: DirectoryQuery): Promise<Result<DirectoryListDto, ExpertHubApiError>>;
  /**
   * EH-PUB-03: one public profile by id. Returns `404` for an unknown id **and**
   * for a known-but-not-consented id — the two are indistinguishable to a public
   * caller (privacy, `BR-1007`).
   */
  getPublicTrainer(id: string): Promise<Result<PublicTrainerProfileDto, ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned public endpoint shape. */
export function createHttpDirectoryProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): DirectoryService {
  return {
    listDirectory(query) {
      const params = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
      });
      if (query.search != null && query.search.trim() !== '') {
        params.set('search', query.search.trim());
      }
      // No `specialty`: the API refuses it with 400 — no taxonomy (`Q16`).
      return client.get<DirectoryListDto>(
        `${DIRECTORY_API_VERSION}/directory?${params.toString()}`
      );
    },
    getPublicTrainer(id) {
      return client.get<PublicTrainerProfileDto>(
        `${DIRECTORY_API_VERSION}/directory/${encodeURIComponent(id)}`
      );
    },
  };
}

function createDefaultService(): DirectoryService {
  return isModuleLive('directory') ? createHttpDirectoryProvider() : createMockDirectoryProvider();
}

let serviceInstance: DirectoryService | null = null;

/** The application-wide directory service instance the pages consume. */
export function getDirectoryService(): DirectoryService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/**
 * Test seam: inject a seeded/failing provider (pass `null` to restore the
 * default). Test-only — production code never calls this.
 */
export function setDirectoryServiceForTesting(service: DirectoryService | null): void {
  serviceInstance = service;
}
