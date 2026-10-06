import type { Result } from '@/types';
import { isModuleLive } from '../../app/config/expertHubConfig';
import { createExpertHubApiClient } from '../../shared/services/apiClient';
import type { ExpertHubApiClient, ExpertHubApiError } from '../../shared/services/apiClient';
import { createMockSubmissionProvider } from './mockSubmissionProvider';
import type {
  SubmissionDecisionInput,
  SubmissionDto,
  UploadSubmissionInput,
} from './submission.types';

/**
 * Expert Hub material & content submission service — journey **J-20**.
 *
 * **There is no reject operation.** F2/AC-3 and F5/AC-3 give the coordinator two
 * options — approve, or send a note opening a new upload — so the decision input
 * has two members and nothing here can end a submission in refusal.
 *
 * **There is no sync operation either.** F3/AC-1 makes the FAST copy automatic
 * on approval, and F3/AC-2 makes the flow one-way (platform → FAST).
 *
 * ⚠️ **Open item 1** — no approval SLA is defined for either path, so no
 * deadline is carried anywhere in this contract.
 */

export const SUBMISSIONS_API_VERSION = 'v1';

export interface SubmissionService {
  /* ── the trainer's / content developer's side ──────────────────────── */

  /** `GET v1/me/submissions` — every submission slot of the signed-in person. */
  listMySubmissions(): Promise<Result<readonly SubmissionDto[], ExpertHubApiError>>;
  /**
   * F1/AC-2 + F4/AC-2 — `POST v1/me/submissions/{id}/upload` with `{ fileName }`.
   * 400 `file-required` without a name; 409 when no slot is open.
   */
  uploadSubmission(
    submissionId: string,
    input: UploadSubmissionInput
  ): Promise<Result<SubmissionDto, ExpertHubApiError>>;

  /* ── the coordinator's side ────────────────────────────────────────── */

  /**
   * `GET v1/internal/submissions` — **every** submission, in any status. The
   * queue shows the ones awaiting a decision (F2/AC-1 + F5/AC-1).
   */
  listSubmissions(): Promise<Result<readonly SubmissionDto[], ExpertHubApiError>>;
  getSubmission(submissionId: string): Promise<Result<SubmissionDto, ExpertHubApiError>>;
  /**
   * F2/AC-3 + F5/AC-3 — `POST v1/internal/submissions/{id}/decision` with
   * `{ decision: 'approved' }` or `{ decision: 'changes-requested', note }`.
   * 400 `note-required`; 409 when nothing awaits a decision.
   */
  decideSubmission(
    submissionId: string,
    input: SubmissionDecisionInput
  ): Promise<Result<SubmissionDto, ExpertHubApiError>>;
}

/** Real-API provider — the versioned endpoints in `EngagementEndpoints.cs`. */
export function createHttpSubmissionProvider(
  client: ExpertHubApiClient = createExpertHubApiClient()
): SubmissionService {
  const base = SUBMISSIONS_API_VERSION;
  return {
    listMySubmissions() {
      return client.get<readonly SubmissionDto[]>(`${base}/me/submissions`);
    },
    uploadSubmission(submissionId, input) {
      return client.post<SubmissionDto>(
        `${base}/me/submissions/${encodeURIComponent(submissionId)}/upload`,
        { fileName: input.fileName }
      );
    },
    listSubmissions() {
      return client.get<readonly SubmissionDto[]>(`${base}/internal/submissions`);
    },
    getSubmission(submissionId) {
      return client.get<SubmissionDto>(
        `${base}/internal/submissions/${encodeURIComponent(submissionId)}`
      );
    },
    decideSubmission(submissionId, input) {
      return client.post<SubmissionDto>(
        `${base}/internal/submissions/${encodeURIComponent(submissionId)}/decision`,
        input
      );
    },
  };
}

function createDefaultService(): SubmissionService {
  return isModuleLive('submissions')
    ? createHttpSubmissionProvider()
    : createMockSubmissionProvider();
}

let serviceInstance: SubmissionService | null = null;

export function getSubmissionService(): SubmissionService {
  serviceInstance ??= createDefaultService();
  return serviceInstance;
}

/** Test seam: inject a seeded/failing provider (`null` restores the default). */
export function setSubmissionServiceForTesting(service: SubmissionService | null): void {
  serviceInstance = service;
}
