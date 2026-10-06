import type { Result } from '@/types';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import type { ApproverDto, SequenceTemplateDto } from '../../shared/types/sequence';
import { MOCK_INBOX } from '../internal/mockInternalProvider';
import { MOCK_COMMITTEE_POOL } from '../screening/mockScreeningProvider';
import { buildMockAgreementDocument, MOCK_AGREEMENT_FIELDS } from './mockAgreementTemplate';
import { addendumFileIssue } from '../serviceRequests/serviceRequest.types';
import type { AgreementService } from './agreementService';
import type {
  AgreementDetailDto,
  AgreementFieldValues,
  AgreementStage,
  AgreementViewerDto,
  FormSigningSequenceInput,
  MergedDataGroup,
  PrepareAgreementInput,
  SigningDecisionInput,
  SigningMemberDto,
} from './agreement.types';

/**
 * Versioned **mock** provider for EH-INT-06a (J-10). It simulates the server's
 * responsibilities, which is where this journey's real logic lives:
 *
 * - **Gating preparation** on both J-09 outcomes (F1/AC-1).
 * - **Merging trainer and bank data after** the creator's fields, never before
 *   and never as an input (F1/AC-2).
 * - **Advancing the sequence** on approval, and attaching a signature when a
 *   designated signer signs (F3/AC-3+AC-4).
 * - **Sending to the applicant only when the sequence is complete *and* a
 *   signature is attached** (F3/AC-5) — a signature alone never sends.
 * - **Resuming from the requesting person** after a modification (F4/AC-3).
 *
 * ⚠️ MOCK DATA (clearly labelled): approver pool reuses the screening committee
 * pool; merged trainer/bank values are representative development data.
 */

const APPROVER_POOL: readonly ApproverDto[] = MOCK_COMMITTEE_POOL.map((member) => ({
  id: member.id,
  name: member.name,
  roleTitle: member.roleTitle,
}));

/** ⚠️ MOCK saved signing-sequence templates (F2/AC-2). */
const SEED_TEMPLATES: readonly SequenceTemplateDto[] = [
  {
    id: 'sig-tpl-standard',
    name: 'تسلسل التوقيع المعتاد',
    members: [
      { approverId: 'stf-02', obligation: 'mandatory' },
      { approverId: 'stf-01', obligation: 'mandatory', isSigner: true },
    ],
  },
];

/**
 * ⚠️ MOCK merged data. In production this is assembled server-side from the
 * trainer profile and the bank data collected at J-09/F6 — the creator never
 * types any of it (F1/AC-2).
 */
function buildMergedData(applicantName: string): readonly MergedDataGroup[] {
  return [
    {
      id: 'trainer',
      title: { ar: 'بيانات المدرب', en: 'Trainer data' },
      entries: [
        { label: { ar: 'الاسم', en: 'Name' }, value: applicantName },
        { label: { ar: 'رقم الهوية', en: 'National ID' }, value: '1XXXXXXXXX' },
        { label: { ar: 'المدينة', en: 'City' }, value: 'الرياض' },
      ],
    },
    {
      id: 'bank',
      title: { ar: 'البيانات المصرفية', en: 'Bank data' },
      entries: [
        { label: { ar: 'اسم البنك', en: 'Bank name' }, value: 'البنك الأهلي' },
        { label: { ar: 'رقم الآيبان', en: 'IBAN' }, value: 'SA0380000000608010167519' },
        { label: { ar: 'الاسم على البطاقة', en: 'Name on card' }, value: applicantName },
      ],
    },
  ];
}

export interface MockAgreementProviderOptions {
  readonly latencyMs?: number;
  readonly failWith?: ExpertHubApiError;
  readonly now?: number;
  readonly viewer?: Partial<AgreementViewerDto>;
  /** Simulate the J-09 gate. Both true by default (J-09 already completed). */
  readonly gate?: { readonly committeeApproved: boolean; readonly bankDataComplete: boolean };
  /** Start with the fields already saved, so the page opens at formation. */
  readonly prepared?: boolean;
  /** Start with a formed, running signing sequence. */
  readonly seedSequence?: readonly {
    approverId: string;
    obligation: 'mandatory' | 'optional';
    isSigner?: boolean;
  }[];
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockAgreementProvider(
  options: MockAgreementProviderOptions = {}
): AgreementService {
  const {
    latencyMs = 300,
    failWith,
    now = new Date('2026-07-30T09:00:00Z').getTime(),
    viewer: viewerOverride,
    gate = { committeeApproved: true, bankDataComplete: true },
    prepared = false,
    seedSequence,
  } = options;

  const timestamp = new Date(now).toISOString();

  let fieldValues: AgreementFieldValues = prepared
    ? { startDate: '2026-08-01', endDate: '2027-07-31', referenceNote: '' }
    : {};
  let isPrepared = prepared;
  /** Each preparation that changes the content freezes a new document version. */
  let versionNumber = prepared ? 1 : 0;
  let documentAttachmentId = 'mock-agreement-file';
  let uploads = 0;
  let sequence: SigningMemberDto[] = [];
  let templates: SequenceTemplateDto[] = [...SEED_TEMPLATES];
  let signaturesAttached = false;
  let sentToApplicantAt: string | null = null;

  function startSequence(
    members: readonly {
      approverId: string;
      obligation: 'mandatory' | 'optional';
      isSigner?: boolean;
    }[]
  ) {
    sequence = members.map((member, index) => {
      const approver = APPROVER_POOL.find((candidate) => candidate.id === member.approverId);
      return {
        approverId: member.approverId,
        name: approver?.name ?? member.approverId,
        roleTitle: approver?.roleTitle ?? { ar: '—', en: '—' },
        obligation: member.obligation,
        isSigner: member.isSigner === true,
        position: index + 1,
        // F2/AC-5 — the document routes automatically to the first person.
        state: index === 0 ? 'current' : 'waiting',
        decidedAt: null,
        note: null,
      };
    });
  }

  if (seedSequence != null) {
    startSequence(seedSequence);
  }

  const sequenceComplete = () =>
    sequence.length > 0 &&
    sequence.every((member) => member.state === 'approved' || member.state === 'signed');

  /** Hands the turn on, then applies the send rule (F3/AC-5) if the chain ended. */
  function advance() {
    const next = sequence.find((member) => member.state === 'waiting');
    if (next != null) {
      sequence = sequence.map((member) =>
        member.approverId === next.approverId ? { ...member, state: 'current' } : member
      );
      return;
    }
    // `BR-0213` — BOTH conditions, never one. A signature with an unfinished
    // sequence does not send, and a finished sequence with no signature does not
    // send either.
    if (sequenceComplete() && signaturesAttached) {
      sentToApplicantAt = timestamp;
    }
  }

  function resolveStage(): AgreementStage {
    if (!gate.committeeApproved || !gate.bankDataComplete) {
      return 'blocked';
    }
    if (sentToApplicantAt != null) {
      return 'sent-to-applicant';
    }
    if (sequence.some((member) => member.state === 'modification-requested')) {
      return 'modification-requested';
    }
    if (!isPrepared) {
      return 'preparation';
    }
    return sequence.length === 0 ? 'formation' : 'in-progress';
  }

  function buildDetail(applicationId: string): AgreementDetailDto | null {
    const row = MOCK_INBOX.find((item) => item.id === applicationId);
    if (row == null) {
      return null;
    }
    const current = sequence.find((member) => member.state === 'current');
    const viewerApproverId = viewerOverride?.approverId ?? current?.approverId ?? null;
    const isCurrentViewer = current != null && current.approverId === viewerApproverId;

    return {
      applicationId: row.id,
      reference: row.reference,
      applicantName: row.applicantName,
      // F1/AC-3 — exactly the approved services, server-derived.
      approvedServices: row.services,
      gate,
      stage: resolveStage(),
      fieldSchema: MOCK_AGREEMENT_FIELDS,
      fieldValues,
      // F1/AC-2 — merged only after the creator's fields are saved.
      mergedData: isPrepared ? buildMergedData(row.applicantName) : [],
      sequence,
      approverPool: APPROVER_POOL,
      templates,
      // `G26` — document storage unresolved; no fabricated URL.
      documentUrl: null,
      sequenceComplete: sequenceComplete(),
      signaturesAttached,
      sentToApplicantAt,
      viewer: {
        isCreator: viewerOverride?.isCreator ?? true,
        approverId: viewerApproverId,
        canDecide: viewerOverride?.canDecide ?? isCurrentViewer,
        isSigner: viewerOverride?.isSigner ?? current?.isSigner ?? false,
        canResubmit:
          viewerOverride?.canResubmit ??
          sequence.some((member) => member.state === 'modification-requested'),
      },
      document: isPrepared
        ? buildMockAgreementDocument(
            versionNumber,
            fieldValues,
            buildMergedData(row.applicantName),
            timestamp,
            documentAttachmentId
          )
        : null,
    };
  }

  function resolve(applicationId: string): Result<AgreementDetailDto, ExpertHubApiError> {
    const detail = buildDetail(applicationId);
    return detail == null
      ? { ok: false, error: { status: 404, message: 'Application not found' } }
      : { ok: true, value: detail };
  }

  return {
    async getAgreementDetail(applicationId) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      return resolve(applicationId);
    },

    async uploadAgreementDocument(file: File) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      if (file.size === 0) {
        return { ok: false, error: { status: 400, message: 'file-required' } };
      }
      if (addendumFileIssue(file) != null) {
        return { ok: false, error: { status: 422, message: 'format-or-size' } };
      }
      uploads += 1;
      return {
        ok: true,
        value: {
          attachmentId: `mock-agreement-file-${uploads}`,
          fileName: file.name,
          sizeBytes: file.size,
        },
      };
    },

    async prepareAgreement(applicationId: string, input: PrepareAgreementInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      // F1/AC-1 — refuse preparation while either J-09 outcome is outstanding.
      if (!gate.committeeApproved || !gate.bankDataComplete) {
        return { ok: false, error: { status: 409, message: 'Agreement preconditions not met' } };
      }
      // `P-333` — the uploaded file is required, as the server requires it.
      if (input.documentAttachmentId.trim() === '') {
        return { ok: false, error: { status: 400, message: 'agreement-document-required' } };
      }
      if (
        !isPrepared ||
        JSON.stringify(input.values) !== JSON.stringify(fieldValues) ||
        input.documentAttachmentId !== documentAttachmentId
      ) {
        versionNumber += 1;
      }
      fieldValues = { ...input.values };
      documentAttachmentId = input.documentAttachmentId;
      isPrepared = true;
      return resolve(applicationId);
    },

    async formSigningSequence(applicationId: string, input: FormSigningSequenceInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      startSequence(input.members);
      const templateName = input.saveAsTemplateName.trim();
      if (templateName !== '') {
        templates = [
          ...templates,
          {
            id: `sig-tpl-${templates.length + 1}`,
            name: templateName,
            members: input.members.map((member) => ({ ...member })),
          },
        ];
      }
      return resolve(applicationId);
    },

    async submitSigningDecision(applicationId: string, input: SigningDecisionInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const current = sequence.find((member) => member.state === 'current');
      if (current == null) {
        return { ok: false, error: { status: 409, message: 'No member is currently deciding' } };
      }

      if (input.kind === 'request-modification') {
        // F4 — the sequence pauses; completed steps are untouched so it can
        // resume from this exact person (F4/AC-3).
        sequence = sequence.map((member) =>
          member.approverId === current.approverId
            ? { ...member, state: 'modification-requested', decidedAt: timestamp, note: input.note }
            : member
        );
        return resolve(applicationId);
      }

      const signed = input.kind === 'sign-and-approve';
      if (signed) {
        signaturesAttached = true;
      }
      sequence = sequence.map((member) =>
        member.approverId === current.approverId
          ? {
              ...member,
              state: signed ? 'signed' : 'approved',
              decidedAt: timestamp,
              note: input.note || null,
            }
          : member
      );
      advance();
      return resolve(applicationId);
    },

    async resubmitAgreement(applicationId: string) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      // F4/AC-3 — resume from the person who asked; earlier steps stand.
      sequence = sequence.map((member) =>
        member.state === 'modification-requested'
          ? { ...member, state: 'current', decidedAt: null }
          : member
      );
      return resolve(applicationId);
    },
  };
}
