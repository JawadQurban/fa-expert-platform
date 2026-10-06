import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import { createMockCommitteeProvider } from './mockCommitteeProvider';
import type {
  CommitteeDetailDto,
  FormCommitteeInput,
  MemberDecisionInput,
} from './committee.types';

/**
 * Expert Hub approval-committee service — EH-INT-05 (CAP-02, journey J-09).
 * Two providers implement the same versioned contract; swapping mock → real API
 * is configuration, not a UI change.
 *
 * Every mutation returns the **whole refreshed detail** rather than an ack,
 * because a single member decision can change several things at once: advance
 * the sequence, halt it, finalize the outcome, and trigger bank-data collection
 * in parallel (F4/AC-5). Only the server knows which of those happened.
 */

export const COMMITTEE_API_VERSION = 'v1';

export interface CommitteeService {
  /** Context, sequence, templates, outcome, bank-data status, viewer rights. */
  getCommitteeDetail(applicationId: string): Promise<Result<CommitteeDetailDto, ExpertHubApiError>>;
  /** J-09/F2 — the creator forms the sequence (optionally saving a template). */
  formCommittee(
    applicationId: string,
    input: FormCommitteeInput
  ): Promise<Result<CommitteeDetailDto, ExpertHubApiError>>;
  /** J-09/F4/F7/F8 — the current member approves, rejects, or asks for changes. */
  submitMemberDecision(
    applicationId: string,
    input: MemberDecisionInput
  ): Promise<Result<CommitteeDetailDto, ExpertHubApiError>>;
  /** J-09/F7/AC-3+AC-4 — creator re-submits; the sequence resumes from the
   *  member who asked, preserving approvals already given. */
  resubmitAfterModification(
    applicationId: string
  ): Promise<Result<CommitteeDetailDto, ExpertHubApiError>>;
}

/** Future-API provider — already wired to the versioned endpoint shape. */
export function createHttpCommitteeProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): CommitteeService {
  const base = (applicationId: string) =>
    `${COMMITTEE_API_VERSION}/internal/applications/${encodeURIComponent(applicationId)}/committee`;

  return {
    getCommitteeDetail(applicationId) {
      return client.get<CommitteeDetailDto>(base(applicationId));
    },
    formCommittee(applicationId, input) {
      return client.post<CommitteeDetailDto>(`${base(applicationId)}/formation`, input);
    },
    submitMemberDecision(applicationId, input) {
      return client.post<CommitteeDetailDto>(`${base(applicationId)}/decisions`, input);
    },
    resubmitAfterModification(applicationId) {
      return client.post<CommitteeDetailDto>(`${base(applicationId)}/resubmit`);
    },
  };
}

function createDefaultService(): CommitteeService {
  return isModuleLive('committee') ? createHttpCommitteeProvider() : createMockCommitteeProvider();
}

let serviceInstance: CommitteeService | null = null;

export function getCommitteeService(): CommitteeService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/** Test seam: inject a seeded/failing provider (`null` restores the default). */
export function setCommitteeServiceForTesting(service: CommitteeService | null): void {
  serviceInstance = service;
}
