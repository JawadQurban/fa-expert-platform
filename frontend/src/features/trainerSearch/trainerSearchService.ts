import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import { createMockTrainerSearchProvider } from './mockTrainerSearchProvider';
import type {
  BioDecision,
  PendingBioDto,
  TrainerProfileDto,
  TrainerSearchFilters,
  TrainerSearchListDto,
} from './trainerSearch.types';

/**
 * Expert Hub trainer-search service — EH-INT-07/08 (CAP-04, journey **J-15**).
 *
 * Filtering is the **server's** job. J-15/F1/AC-3 filters on file status, which
 * is calculated server-side (J-13/AC-9), so a client-side filter would be
 * filtering a projection against values it cannot recompute. The mock simulates the same query so the real endpoint drops in
 * with no UI change.
 */

export const TRAINER_SEARCH_API_VERSION = 'v1';

export interface TrainerSearchService {
  /** F1/AC-3 — browse and monitor. **Not** candidate selection; that is J-17. */
  searchTrainers(
    filters: TrainerSearchFilters
  ): Promise<Result<TrainerSearchListDto, ExpertHubApiError>>;
  /** F1/AC-1 — the whole profile in one payload, because it is one screen. */
  getTrainerProfile(trainerId: string): Promise<Result<TrainerProfileDto, ExpertHubApiError>>;
  /** `P-331` — the bios waiting for review, oldest first (`F-0401`). */
  getPendingBios(): Promise<Result<readonly PendingBioDto[], ExpertHubApiError>>;
  /** Approve or return one; answers the refreshed queue. A return needs a note. */
  decideBio(
    trainerId: string,
    decision: BioDecision,
    note: string,
    revision: number
  ): Promise<Result<readonly PendingBioDto[], ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpTrainerSearchProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): TrainerSearchService {
  const base = `${TRAINER_SEARCH_API_VERSION}/internal/trainers`;
  return {
    searchTrainers(filters) {
      const query = new URLSearchParams();
      if (filters.search.trim() !== '') {
        query.set('search', filters.search.trim());
      }
      for (const [key, value] of [
        ['service', filters.service],
        ['fileStatus', filters.fileStatus],
      ] as const) {
        if (value !== 'all') {
          query.set(key, value);
        }
      }
      if (filters.minCertifications != null) {
        query.set('minCertifications', String(filters.minCertifications));
      }
      // No `specialty`, `domain` or `minEvaluation`: the API answers each with
      // 400 — no taxonomy (`Q16`), no calculated rating (`DM-GAP-14`).
      const suffix = query.toString() === '' ? '' : `?${query.toString()}`;
      return client.get<TrainerSearchListDto>(`${base}${suffix}`);
    },
    getTrainerProfile(trainerId) {
      return client.get<TrainerProfileDto>(`${base}/${encodeURIComponent(trainerId)}`);
    },
    getPendingBios() {
      return client.get<readonly PendingBioDto[]>(
        `${TRAINER_SEARCH_API_VERSION}/internal/trainer-bios`
      );
    },
    decideBio(trainerId, decision, note, revision) {
      return client.post<readonly PendingBioDto[]>(
        `${base}/${encodeURIComponent(trainerId)}/bio/decision`,
        { decision, note, revision }
      );
    },
  };
}

function createDefaultService(): TrainerSearchService {
  return isModuleLive('trainerSearch')
    ? createHttpTrainerSearchProvider()
    : createMockTrainerSearchProvider();
}

let serviceInstance: TrainerSearchService | null = null;

export function getTrainerSearchService(): TrainerSearchService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/** Test seam: inject a seeded/failing provider (`null` restores the default). */
export function setTrainerSearchServiceForTesting(service: TrainerSearchService | null): void {
  serviceInstance = service;
}
