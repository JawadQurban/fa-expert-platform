import type { ExpertHubApiError } from '../../shared/services/apiClient';
import servedSubmission from '../../contracts/fixtures/internal.submission-detail.json';
import type { SubmissionService } from './submissionService';
import {
  canUpload,
  SUBMISSION_DECISION,
  SUBMISSION_STATUS,
  syncsToFast,
  type SubmissionDecisionInput,
  type SubmissionDto,
  type UploadSubmissionInput,
} from './submission.types';

/**
 * Versioned **mock** provider for J-20. Every record is the real API response
 * (`contracts/fixtures/internal.submission-detail.json`) with only its values
 * changed, so the mock cannot drift into a shape the server never serves. Its
 * errors mirror `EngagementEndpoints.cs` too (404 / 409 / 400 `file-required` /
 * 400 `note-required`).
 *
 * - `sub-001` — **training material**, awaiting upload (F1/AC-1). Approving it
 *   moves `syncState` to `processing` (F3/AC-1).
 * - `sub-002` — **service-linked content**, pending approval (F4/AC-1).
 *   Approving it leaves `syncState` untouched (F5/AC-5).
 *
 * ⚠️ MOCK DATA (clearly labelled). ⚠️ Deterministic clock.
 *
 * ⚠️ **Open item 2** — a confirmed *content developer* engagement cannot be
 * produced by the built path (J-16's matrix for that service is empty), so
 * `sub-002` is seeded directly.
 */

/** ⚠️ MOCK — the fixed "today". */
const MOCK_NOW = '2026-08-20T09:00:00Z';

/** The served shape. JSON widens the string unions, so it is narrowed once here. */
const SERVED = servedSubmission as SubmissionDto;

export interface MockSubmissionProviderOptions {
  readonly latencyMs?: number;
  readonly failWith?: ExpertHubApiError;
  readonly now?: string;
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

function seed(now: string): SubmissionDto[] {
  const trainerName = 'د. سارة العتيبي';
  return [
    {
      ...SERVED,
      submissionId: 'sub-001',
      engagementId: 'eng-1',
      kind: 'training-material',
      // F1/AC-1 — the slot is open because FAST said "Not Available".
      status: SUBMISSION_STATUS.awaitingUpload,
      syncState: 'none',
      trainerName,
      openedAt: now,
      rounds: [],
    },
    {
      ...SERVED,
      submissionId: 'sub-002',
      engagementId: 'eng-9',
      kind: 'service-content',
      // F4/AC-1 — open from the moment the engagement was confirmed.
      status: SUBMISSION_STATUS.pendingApproval,
      syncState: 'none',
      trainerName,
      openedAt: now,
      rounds: [
        {
          ...SERVED.rounds[0],
          roundNumber: 1,
          fileName: 'محتوى إدارة المخاطر.pdf',
          decision: null,
          note: null,
          decidedByName: null,
          decidedAt: null,
          uploadedAt: now,
        },
      ],
    },
  ];
}

export function createMockSubmissionProvider(
  options: MockSubmissionProviderOptions = {}
): SubmissionService {
  const { latencyMs = 300, failWith, now = MOCK_NOW } = options;

  const items = seed(now);
  const notFound = { ok: false, error: { status: 404, message: 'Submission not found.' } } as const;

  function indexOf(submissionId: string): number {
    return items.findIndex((item) => item.submissionId === submissionId);
  }

  return {
    async listMySubmissions() {
      await delay(latencyMs);
      return failWith != null ? { ok: false, error: failWith } : { ok: true, value: [...items] };
    },

    async uploadSubmission(submissionId: string, input: UploadSubmissionInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const index = indexOf(submissionId);
      if (index < 0) {
        return notFound;
      }
      const submission = items[index];
      if (!canUpload(submission)) {
        return { ok: false, error: { status: 409, message: 'Nothing to upload at this stage.' } };
      }
      if (input.fileName.trim() === '') {
        return { ok: false, error: { status: 400, message: 'file-required' } };
      }
      items[index] = {
        ...submission,
        // F1/AC-3 + F4/AC-3 — "Uploaded — Pending Approval".
        status: SUBMISSION_STATUS.pendingApproval,
        rounds: [
          ...submission.rounds,
          {
            roundNumber: submission.rounds.length + 1,
            fileName: input.fileName,
            decision: null,
            note: null,
            decidedByName: null,
            decidedAt: null,
            uploadedAt: now,
          },
        ],
      };
      return { ok: true, value: items[index] };
    },

    async listSubmissions() {
      await delay(latencyMs);
      // Every status, as the server serves it; the queue picks the pending ones.
      return failWith != null ? { ok: false, error: failWith } : { ok: true, value: [...items] };
    },

    async getSubmission(submissionId: string) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const index = indexOf(submissionId);
      return index < 0 ? notFound : { ok: true, value: items[index] };
    },

    async decideSubmission(submissionId: string, input: SubmissionDecisionInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const index = indexOf(submissionId);
      if (index < 0) {
        return notFound;
      }
      const submission = items[index];
      if (submission.status !== SUBMISSION_STATUS.pendingApproval) {
        return { ok: false, error: { status: 409, message: 'Nothing awaits a decision.' } };
      }
      const approved = input.decision === SUBMISSION_DECISION.approved;
      if (!approved && input.note.trim() === '') {
        return { ok: false, error: { status: 400, message: 'note-required' } };
      }

      const last = submission.rounds.length - 1;
      items[index] = {
        ...submission,
        // F2/AC-4 — a new upload opportunity, not a refusal.
        status: approved ? SUBMISSION_STATUS.approved : SUBMISSION_STATUS.changesRequested,
        // F3/AC-1 — the copy to FAST is automatic, only on approval, only for material.
        syncState: approved && syncsToFast(submission) ? 'processing' : submission.syncState,
        rounds: submission.rounds.map((round, i) =>
          i === last
            ? {
                ...round,
                decision: approved
                  ? SUBMISSION_STATUS.approved
                  : SUBMISSION_STATUS.changesRequested,
                note: approved ? null : input.note,
                decidedByName: 'منسّق البرنامج',
                decidedAt: now,
              }
            : round
        ),
      };
      return { ok: true, value: items[index] };
    },
  };
}

export { MOCK_NOW };
