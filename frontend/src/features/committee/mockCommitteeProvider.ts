import type { Result } from '@/types';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { MOCK_INBOX } from '../internal/mockInternalProvider';
import { MOCK_INTERVIEW_RESULT_MAX_SCORE } from '../interviews/mockInterviewModel';
import { MOCK_COMMITTEE_POOL } from '../screening/mockScreeningProvider';
import type { CommitteeService } from './committeeService';
import {
  allMandatoryApproved,
  type ApproverDto,
  type BankDataStatusDto,
  type CommitteeDetailDto,
  type CommitteeOutcomeDto,
  type CommitteeViewerDto,
  type FormCommitteeInput,
  type MemberDecisionInput,
  type SequenceMemberDto,
  type SequenceTemplateDto,
  type ServiceOutcomeContextDto,
} from './committee.types';

/**
 * Versioned **mock** provider for EH-INT-05 (J-09). It simulates the server's
 * responsibilities, which is where this journey's real logic lives:
 *
 * - **Advancing the sequence** on approval (F4/AC-2), and finalizing only once
 *   every *mandatory* member has approved (F4/AC-4).
 * - **Halting immediately** on a mandatory member's rejection (F4/AC-3), while
 *   an optional member's rejection is recorded as a note and the sequence
 *   continues untouched (F4/AC-4, `BR-0211` revised).
 * - **Triggering bank-data collection in parallel** with final approval
 *   (F4/AC-5 + F6), never as a step after it.
 * - **Resuming from the requesting member** after a modification, preserving
 *   approvals already given (F7/AC-4, `BR-0218`).
 * - **Copying, not linking, a reused template** (F2/AC-5).
 *
 * ⚠️ MOCK DATA (clearly labelled): approver pool reuses the screening committee
 * pool; scores are representative development data.
 */

/** Approver pool — the same staff directory the screening committee draws on. */
const APPROVER_POOL: readonly ApproverDto[] = MOCK_COMMITTEE_POOL.map((member) => ({
  id: member.id,
  name: member.name,
  roleTitle: member.roleTitle,
}));

/** ⚠️ MOCK saved templates (F2/AC-4). */
const SEED_TEMPLATES: readonly SequenceTemplateDto[] = [
  {
    id: 'tpl-standard',
    name: 'لجنة الاعتماد المعتادة',
    members: [
      { approverId: 'stf-01', obligation: 'mandatory' },
      { approverId: 'stf-02', obligation: 'mandatory' },
      { approverId: 'stf-04', obligation: 'optional' },
    ],
  },
  {
    id: 'tpl-fast-track',
    name: 'مسار مختصر (عضوان)',
    members: [
      { approverId: 'stf-01', obligation: 'mandatory' },
      { approverId: 'stf-03', obligation: 'optional' },
    ],
  },
];

/**
 * ⚠️ MOCK per-application screening + interview context (F3/AC-2). Interview
 * averages are on the approved interview model's percentage scale.
 */
const CONTEXT_BY_SERVICE: Readonly<
  Record<string, { screening: number; interview: number | null }>
> = {
  trainer: { screening: 82.5, interview: 82 },
  consultant: { screening: 78.0, interview: 78 },
  'content-developer': { screening: 76.5, interview: null },
  'question-writer': { screening: 71.0, interview: 72 },
  speaker: { screening: 0, interview: null },
};

function buildContext(services: readonly string[]): readonly ServiceOutcomeContextDto[] {
  return services.map((service) => {
    const entry = CONTEXT_BY_SERVICE[service] ?? { screening: 0, interview: null };
    const exempted = entry.interview == null;
    return {
      service: service as ServiceOutcomeContextDto['service'],
      screeningScore: entry.screening,
      interviewAverage: entry.interview,
      interviewMaxScore: MOCK_INTERVIEW_RESULT_MAX_SCORE,
      exempted,
      exemptionReason: exempted
        ? {
            ar: 'تعاون سابق موثَّق مع الأكاديمية',
            en: 'Documented prior collaboration with the Academy',
          }
        : null,
    };
  });
}

const EMPTY_OUTCOME: CommitteeOutcomeDto = {
  state: 'not-formed',
  decidedAt: null,
  rejectedByName: null,
  rejectionReason: null,
  optionalRejections: [],
};

const NOT_REQUESTED: BankDataStatusDto = {
  state: 'not-requested',
  requestedAt: null,
  completedAt: null,
};

export interface MockCommitteeProviderOptions {
  readonly latencyMs?: number;
  readonly failWith?: ExpertHubApiError;
  readonly now?: number;
  /** Who is looking — the server decides this for real. */
  readonly viewer?: Partial<CommitteeViewerDto>;
  /** Start with a formed, running sequence instead of the formation step. */
  readonly seedSequence?: readonly { approverId: string; obligation: 'mandatory' | 'optional' }[];
  /** Bank data already complete (so the J-10 gate reads as satisfied). */
  readonly bankDataComplete?: boolean;
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockCommitteeProvider(
  options: MockCommitteeProviderOptions = {}
): CommitteeService {
  const {
    latencyMs = 300,
    failWith,
    now = new Date('2026-07-29T09:00:00Z').getTime(),
    viewer: viewerOverride,
    seedSequence,
    bankDataComplete = false,
  } = options;

  const timestamp = new Date(now).toISOString();

  /** Mutable per-instance state — a decision visibly advances the sequence. */
  let sequence: SequenceMemberDto[] = [];
  let templates: SequenceTemplateDto[] = [...SEED_TEMPLATES];
  let outcome: CommitteeOutcomeDto = EMPTY_OUTCOME;
  let bankData: BankDataStatusDto = bankDataComplete
    ? { state: 'complete', requestedAt: timestamp, completedAt: timestamp }
    : NOT_REQUESTED;

  /** Materializes formation input into the running sequence (first member current). */
  function startSequence(
    members: readonly { approverId: string; obligation: 'mandatory' | 'optional' }[]
  ) {
    sequence = members.map((member, index) => {
      const approver = APPROVER_POOL.find((candidate) => candidate.id === member.approverId);
      return {
        approverId: member.approverId,
        name: approver?.name ?? member.approverId,
        roleTitle: approver?.roleTitle ?? { ar: '—', en: '—' },
        obligation: member.obligation,
        position: index + 1,
        // F2/AC-6 — the sequence begins with the first member.
        state: index === 0 ? 'current' : 'waiting',
        decidedAt: null,
        note: null,
      };
    });
    outcome = { ...EMPTY_OUTCOME, state: 'in-progress' };
  }

  if (seedSequence != null) {
    startSequence(seedSequence);
  }

  /** F4/AC-2 — hand the turn to the next member who has not yet decided. */
  function advance() {
    const next = sequence.find((member) => member.state === 'waiting');
    if (next != null) {
      sequence = sequence.map((member) =>
        member.approverId === next.approverId ? { ...member, state: 'current' } : member
      );
      return;
    }
    // No one left waiting — the sequence is done. F4/AC-4: approval requires
    // every *mandatory* member to have approved; optional rejections do not
    // change that.
    if (allMandatoryApproved(sequence)) {
      outcome = { ...outcome, state: 'approved', decidedAt: timestamp };
      // F4/AC-5 + F6 — bank-data collection is triggered **in parallel** with the
      // result returning to the creator, not as a later step.
      if (bankData.state === 'not-requested') {
        bankData = { state: 'requested', requestedAt: timestamp, completedAt: null };
      }
    }
  }

  function buildDetail(applicationId: string): CommitteeDetailDto | null {
    const row = MOCK_INBOX.find((item) => item.id === applicationId);
    if (row == null) {
      return null;
    }
    const current = sequence.find((member) => member.state === 'current');
    const viewerApproverId = viewerOverride?.approverId ?? current?.approverId ?? null;

    return {
      applicationId: row.id,
      reference: row.reference,
      applicantName: row.applicantName,
      acceptedServices: row.services,
      context: buildContext(row.services),
      sequence,
      approverPool: APPROVER_POOL,
      templates,
      outcome,
      bankData,
      viewer: {
        isCreator: viewerOverride?.isCreator ?? true,
        approverId: viewerApproverId,
        canDecide:
          viewerOverride?.canDecide ?? (current != null && current.approverId === viewerApproverId),
        canResubmit: viewerOverride?.canResubmit ?? outcome.state === 'modification-requested',
      },
    };
  }

  function resolve(applicationId: string): Result<CommitteeDetailDto, ExpertHubApiError> {
    const detail = buildDetail(applicationId);
    return detail == null
      ? { ok: false, error: { status: 404, message: 'Application not found' } }
      : { ok: true, value: detail };
  }

  return {
    async getCommitteeDetail(applicationId) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      return resolve(applicationId);
    },

    async formCommittee(applicationId: string, input: FormCommitteeInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      startSequence(input.members);
      const templateName = input.saveAsTemplateName.trim();
      if (templateName !== '') {
        // F2/AC-3 — saved as a **copy**, so later per-application edits cannot
        // reach back into the stored template (F2/AC-5).
        templates = [
          ...templates,
          {
            id: `tpl-${templates.length + 1}`,
            name: templateName,
            members: input.members.map((member) => ({ ...member })),
          },
        ];
      }
      return resolve(applicationId);
    },

    async submitMemberDecision(applicationId: string, input: MemberDecisionInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const current = sequence.find((member) => member.state === 'current');
      if (current == null) {
        return { ok: false, error: { status: 409, message: 'No member is currently deciding' } };
      }

      if (input.kind === 'approve') {
        sequence = sequence.map((member) =>
          member.approverId === current.approverId
            ? { ...member, state: 'approved', decidedAt: timestamp, note: input.note || null }
            : member
        );
        advance();
        return resolve(applicationId);
      }

      if (input.kind === 'request-modification') {
        // F7 — the sequence pauses here; prior approvals are untouched so it can
        // resume from this exact member (F7/AC-4).
        sequence = sequence.map((member) =>
          member.approverId === current.approverId
            ? {
                ...member,
                state: 'modification-requested',
                decidedAt: timestamp,
                note: input.note,
              }
            : member
        );
        outcome = { ...outcome, state: 'modification-requested' };
        return resolve(applicationId);
      }

      // Rejection — the consequence depends entirely on the obligation.
      sequence = sequence.map((member) =>
        member.approverId === current.approverId
          ? { ...member, state: 'rejected', decidedAt: timestamp, note: input.note || null }
          : member
      );

      if (current.obligation === 'mandatory') {
        // F4/AC-3 — halts immediately with a final rejection.
        outcome = {
          ...outcome,
          state: 'rejected',
          decidedAt: timestamp,
          rejectedByName: current.name,
          rejectionReason: input.reason,
        };
        // Every later member is left waiting; the sequence does not advance.
        return resolve(applicationId);
      }

      // F4/AC-4 — an optional member's rejection is a note only; carry on.
      outcome = {
        ...outcome,
        optionalRejections: [
          ...outcome.optionalRejections,
          { approverId: current.approverId, name: current.name, note: input.note || null },
        ],
      };
      advance();
      return resolve(applicationId);
    },

    async resubmitAfterModification(applicationId: string) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      // F7/AC-4 — resume from the member who asked; earlier approvals stand.
      sequence = sequence.map((member) =>
        member.state === 'modification-requested'
          ? { ...member, state: 'current', decidedAt: null }
          : member
      );
      outcome = { ...outcome, state: 'in-progress' };
      return resolve(applicationId);
    },
  };
}
