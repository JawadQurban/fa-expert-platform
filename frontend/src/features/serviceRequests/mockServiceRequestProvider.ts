import type { Result } from '@/types';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import type { ServiceRequestService } from './serviceRequestService';
import {
  addendumFileIssue,
  NO_ACTIVE_AGREEMENT_REASON,
  validateServiceRequestDecision,
  type RejectionReasonOptionDto,
  type ServiceRequestDecisionInput,
  type ServiceRequestDetailDto,
  type ServiceRequestFilters,
  type ServiceRequestSummaryDto,
  type TrainerContextDto,
} from './serviceRequest.types';

/**
 * Versioned **mock** provider for EH-INT-02b (J-03/F2 + F3). It simulates the
 * server's responsibilities, which is where this journey's rules live:
 *
 * - **Serving the trainer's full approved profile with the request** (F2/AC-1),
 *   so a decision is never taken on the request alone.
 * - **Refusing an approval that carries no addendum** (F3/AC-4) and a rejection
 *   that carries no reason (F3/AC-3) — the same gates the UI applies, applied
 *   again, because a client that skipped the form must not get through.
 * - **Finalizing on the addendum** (F3/AC-5): the approved service joins the
 *   trainer's current services in the same write, which is what "the update
 *   reflects everywhere the trainer's services/agreement are shown" means from
 *   the frontend's side.
 *
 * ⚠️ MOCK DATA (clearly labelled): trainers, references and the addendum
 * validation are representative development data.
 *
 * ⚠️ The **rejection reason list is served as configuration**, not imported from
 * the screening feature. J-03's open item 2 leaves it unresolved whether the
 * list is shared with CAP-02; seeding the mock from the same five entries is a
 * *development convenience*, not a decision that they are one list.
 */

const MOCK_REJECTION_REASONS: readonly RejectionReasonOptionDto[] = [
  {
    id: 'insufficient-qualifications',
    label: { ar: 'عدم استيفاء المؤهلات المطلوبة', en: 'Insufficient qualifications' },
    requiresText: false,
  },
  {
    id: 'insufficient-experience',
    label: { ar: 'الخبرة العملية غير كافية للخدمة المطلوبة', en: 'Insufficient experience' },
    requiresText: false,
  },
  {
    id: 'incomplete-documents',
    label: { ar: 'المستندات غير مكتملة', en: 'Incomplete documents' },
    requiresText: false,
  },
  {
    id: 'specialty-not-required',
    label: { ar: 'التخصص غير مطلوب حاليًا', en: 'Specialty not currently required' },
    requiresText: false,
  },
  // F3/AC-3 — "or free text under Other".
  { id: 'other', label: { ar: 'سبب آخر', en: 'Other' }, requiresText: true },
  // RB-03 — the platform's own reason; served for its label, never offered.
  {
    id: NO_ACTIVE_AGREEMENT_REASON,
    label: {
      ar: 'لا توجد اتفاقية سارية — يلزم تجديد الاتفاقية',
      en: 'No active agreement — the agreement must be renewed',
    },
    requiresText: false,
    system: true,
  },
];

/** ⚠️ MOCK trainer profiles, as F2/AC-1 requires them to appear. */
const MOCK_TRAINERS: Readonly<Record<string, TrainerContextDto>> = {
  'trn-001': {
    trainerId: 'trn-001',
    name: 'د. سارة العتيبي',
    currentServices: ['consultant'],
    specialties: ['leadership', 'human-resources'],
    classification: 'expert',
    evaluationOverall: 4.5,
    agreement: { reference: 'AGR-2026-00042', status: 'active', endsAt: '2027-06-30T23:59:59Z' },
  },
  'trn-002': {
    trainerId: 'trn-002',
    name: 'أ. خالد المطيري',
    currentServices: ['trainer'],
    specialties: ['finance'],
    classification: 'senior',
    evaluationOverall: 4.0,
    agreement: { reference: 'AGR-2025-00311', status: 'active', endsAt: '2026-12-31T23:59:59Z' },
  },
  'trn-003': {
    trainerId: 'trn-003',
    name: 'م. نورة الشمري',
    currentServices: ['trainer', 'content-developer'],
    specialties: ['digital-transformation', 'data-analytics'],
    classification: 'certified',
    // Not every trainer has a calculated rating yet (`02D`, P-06).
    evaluationOverall: null,
    agreement: { reference: 'AGR-2026-00108', status: 'active', endsAt: '2027-02-28T23:59:59Z' },
  },
};

/** ⚠️ MOCK queue. */
const SEED_REQUESTS: readonly ServiceRequestSummaryDto[] = [
  {
    id: 'asr-001',
    reference: 'EH-ASR-2026-0041',
    trainerId: 'trn-001',
    trainerName: 'د. سارة العتيبي',
    requestedService: 'trainer',
    status: 'pending',
    submittedAt: '2026-08-14T09:20:00Z',
  },
  {
    id: 'asr-002',
    reference: 'EH-ASR-2026-0040',
    trainerId: 'trn-002',
    trainerName: 'أ. خالد المطيري',
    requestedService: 'question-writer',
    status: 'pending',
    submittedAt: '2026-08-12T11:05:00Z',
  },
  {
    id: 'asr-003',
    reference: 'EH-ASR-2026-0037',
    trainerId: 'trn-003',
    trainerName: 'م. نورة الشمري',
    requestedService: 'consultant',
    status: 'approved',
    submittedAt: '2026-08-04T08:40:00Z',
  },
];

export interface MockServiceRequestProviderOptions {
  readonly latencyMs?: number;
  readonly failWith?: ExpertHubApiError;
  readonly seed?: readonly ServiceRequestSummaryDto[];
  /** Simulate a viewer who may look but not decide (J-03 open item 1). */
  readonly canDecide?: boolean;
  /** RB-03 — the trainer holds no active agreement. */
  readonly noActiveAgreement?: boolean;
  readonly now?: string;
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

/** ⚠️ MOCK delta fields — what F1/AC-2 asked this trainer for, and nothing else. */
function submittedFieldsFor(request: ServiceRequestSummaryDto) {
  return request.requestedService === 'trainer'
    ? [{ label: { ar: 'عدد الساعات التدريبية', en: 'Training hours' }, value: '480' }]
    : [
        {
          label: { ar: 'وصف نموذج عمل سابق', en: 'Sample work summary' },
          value: 'إعداد بنك أسئلة لبرنامج الامتثال المصرفي، 2025.',
        },
      ];
}

export function createMockServiceRequestProvider(
  options: MockServiceRequestProviderOptions = {}
): ServiceRequestService {
  const {
    latencyMs = 300,
    failWith,
    seed = SEED_REQUESTS,
    canDecide = true,
    noActiveAgreement = false,
    now = '2026-08-19T10:00:00Z',
  } = options;

  let requests: ServiceRequestSummaryDto[] = seed.map((request) => ({ ...request }));
  const decisions = new Map<string, ServiceRequestDetailDto['decision']>();
  /** Stored addenda by id, as the server's ATTACHMENT table holds them. */
  const addenda = new Map<string, string>();
  // A seeded request that is already decided carries its decision record: a
  // status with no outcome behind it is a state the server cannot produce.
  for (const request of requests) {
    if (request.status === 'approved') {
      decisions.set(request.id, {
        kind: 'approve',
        decidedAt: '2026-08-06T09:00:00Z',
        decidedByName: 'مدير الاعتماد',
        reasonId: null,
        reasonText: null,
        addendumFileName: 'addendum-asr-0037.pdf',
        // Recorded before the upload existed: the name, and no document.
        addendumUrl: null,
        note: null,
      });
    } else if (request.status === 'rejected') {
      decisions.set(request.id, {
        kind: 'reject',
        decidedAt: '2026-08-06T09:00:00Z',
        decidedByName: 'مدير الاعتماد',
        reasonId: 'incomplete-documents',
        reasonText: null,
        addendumFileName: null,
        addendumUrl: null,
        note: null,
      });
    }
  }
  // F3/AC-5 — approving widens the trainer's scope; held here as the server holds it.
  const trainers: Record<string, TrainerContextDto> = Object.fromEntries(
    Object.entries(MOCK_TRAINERS).map(([id, trainer]) => [id, { ...trainer }])
  );

  function buildDetail(id: string): ServiceRequestDetailDto | null {
    const request = requests.find((candidate) => candidate.id === id);
    if (request == null) {
      return null;
    }
    const decision = decisions.get(id) ?? null;
    return {
      ...request,
      trainerContext: { ...trainers[request.trainerId] },
      submittedFields: submittedFieldsFor(request),
      submittedAttachments:
        request.requestedService === 'trainer'
          ? [
              {
                id: `${request.id}-att-1`,
                label: { ar: 'شهادة تدريب المدربين', en: 'Train-the-trainer certificate' },
                fileName: 'ttt-certificate.pdf',
              },
            ]
          : [],
      rejectionReasons: MOCK_REJECTION_REASONS,
      decision,
      viewer: {
        canDecide: canDecide && request.status === 'pending' && !noActiveAgreement,
        blockedReason: !canDecide
          ? 'not-authorized'
          : request.status !== 'pending'
            ? 'already-decided'
            : noActiveAgreement
              ? 'no-active-agreement'
              : null,
      },
    };
  }

  function resolve(id: string): Result<ServiceRequestDetailDto, ExpertHubApiError> {
    const detail = buildDetail(id);
    return detail == null
      ? { ok: false, error: { status: 404, message: 'Service request not found.' } }
      : { ok: true, value: detail };
  }

  return {
    async listServiceRequests(filters: ServiceRequestFilters) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const search = filters.search.trim().toLowerCase();
      // F2/AC-2 — search by trainer name, filter by requested service and status.
      const items = requests.filter(
        (request) =>
          (search === '' || request.trainerName.toLowerCase().includes(search)) &&
          (filters.service === 'all' || request.requestedService === filters.service) &&
          (filters.status === 'all' || request.status === filters.status)
      );
      return {
        ok: true,
        value: {
          items,
          totalCount: items.length,
          pendingCount: requests.filter((request) => request.status === 'pending').length,
        },
      };
    },

    async getServiceRequest(id: string) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      return resolve(id);
    },

    async uploadAddendum(file: File) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      if (file.size === 0) {
        return { ok: false, error: { status: 400, message: 'file-required' } };
      }
      // J-01's document rule, re-checked as the server re-checks it.
      const issue = addendumFileIssue(file);
      if (issue != null) {
        return {
          ok: false,
          error: {
            status: 422,
            message: issue === 'size' ? 'The file is larger than 1 MB.' : 'Not an accepted format.',
          },
        };
      }
      const attachmentId = `att-addendum-${String(addenda.size + 1).padStart(3, '0')}`;
      addenda.set(attachmentId, file.name);
      return {
        ok: true,
        value: {
          attachmentId,
          fileName: file.name,
          sizeBytes: file.size,
          downloadUrl: `/v1/attachments/${attachmentId}`,
          // Stored unchecked, exactly as the server stores it until `G27`.
          scanStatus: 'not-scanned',
        },
      };
    },

    async decideServiceRequest(id: string, requested: ServiceRequestDecisionInput) {
      let input = requested;
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const detail = buildDetail(id);
      if (detail == null) {
        return { ok: false, error: { status: 404, message: 'Service request not found.' } };
      }
      // RB-03 — with no active agreement, any decision records the
      // automatic rejection with the dedicated reason (not overridable).
      if (noActiveAgreement && detail.viewer.blockedReason === 'no-active-agreement') {
        input = { kind: 'reject', reasonId: NO_ACTIVE_AGREEMENT_REASON, reasonText: '' };
      } else if (!detail.viewer.canDecide) {
        return { ok: false, error: { status: 403, message: 'Not authorized to decide.' } };
      }
      // The same gates the UI applies (F3/AC-3, AC-4), applied again server-side.
      if (validateServiceRequestDecision(input, detail.rejectionReasons).length > 0) {
        return { ok: false, error: { status: 400, message: 'Invalid decision.' } };
      }

      if (input.kind === 'reject') {
        const reason = detail.rejectionReasons.find((candidate) => candidate.id === input.reasonId);
        decisions.set(id, {
          kind: 'reject',
          decidedAt: now,
          decidedByName: 'موظف تجريبي',
          reasonId: input.reasonId,
          reasonText: reason?.requiresText === true ? input.reasonText.trim() : null,
          addendumFileName: null,
          addendumUrl: null,
          note: null,
        });
        requests = requests.map((request) =>
          request.id === id ? { ...request, status: 'rejected' } : request
        );
        return resolve(id);
      }

      // F3/AC-4 — a name alone is not an addendum: the id must be a document
      // this server stored, and its name is read back from the store.
      const addendumName = addenda.get(input.addendum.attachmentId);
      if (addendumName == null) {
        return { ok: false, error: { status: 400, message: 'addendum-missing' } };
      }
      // F3/AC-4 → AC-5 — the addendum finalizes the approval, and in the same
      // write the service joins the trainer's approved scope. `BR-0305`: no new
      // agreement is created, and no signature is requested.
      decisions.set(id, {
        kind: 'approve',
        decidedAt: now,
        decidedByName: 'موظف تجريبي',
        reasonId: null,
        reasonText: null,
        addendumFileName: addendumName,
        addendumUrl: `/v1/attachments/${input.addendum.attachmentId}`,
        note: input.note.trim() || null,
      });
      requests = requests.map((request) =>
        request.id === id ? { ...request, status: 'approved' } : request
      );
      const trainerId = detail.trainerId;
      const trainer = trainers[trainerId];
      if (trainer != null && !trainer.currentServices.includes(detail.requestedService)) {
        trainers[trainerId] = {
          ...trainer,
          currentServices: [...trainer.currentServices, detail.requestedService],
        };
      }
      return resolve(id);
    },
  };
}
