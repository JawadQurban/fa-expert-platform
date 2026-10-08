import type { Result } from '@/types';
import { buildSlaInstance, SLA_IDS } from '../../shared/sla/mockSlaMatrix';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import type {
  ApplicationStatus,
  ApplicationSummaryDto,
  MyApplicationsListDto,
  MyApplicationsQuery,
} from './application.types';
import { APPLICATION_STATUSES } from './application.types';
import type { ApplicationDraftDto } from './applicationForm.types';
import type { SlaDto } from '../../shared/types/sla';
import type { MergedDataGroup } from '../agreements/agreement.types';
import {
  buildMockAgreementDocument,
  toApplicantDocument,
} from '../agreements/mockAgreementTemplate';
import type {
  ApplicantAgreementDto,
  ApplicantInterviewDto,
  ApplicationDetailDto,
  InterviewSlotDto,
  ServiceOutcome,
  TimelineStageDto,
} from './applicationDetail.types';
import { APPLICATION_STAGES, validateApplicantAgreementDecision } from './applicationDetail.types';
import type { AddServiceRequestInput } from './addService.types';
import { validateAttachmentFile, validateCompleteness } from './applicationValidation';
import type { ValidationMessages } from './applicationValidation';
import { APPLICATION_FORM_SCHEMA } from './applicationSchema';
import type { ApplicationsService } from './applicationsService';

/**
 * Versioned **mock** provider for `CAP-API-01` (list-my-applications) — stands in
 * for the future Expert Hub ASP.NET Core API until it exists. It simulates the
 * *server's* responsibilities (search, filtering, paging, the `BR-0101`
 * one-active-application flag, per-status counts) so the page consumes exactly
 * the contract the real endpoint will return and swapping providers changes no
 * UI logic. Never calls FAST / MTM / ERP / SSO — those sit behind the future
 * API only (`02C` §5).
 *
 * ⚠️ MOCK DATA (clearly labeled): the seed below exists to exercise every
 * trainer-facing presentation status (`P-05` 11 values + the neutral `updating`
 * partial state). A real trainer's history would respect `BR-0101` (one
 * un-decided application at a time) — the flag itself is still **computed from
 * the data**, exactly as the server will compute it.
 */

/** Un-decided statuses for `BR-0101` (decided = approved / active / rejected / closed). */
const UNDECIDED_STATUSES: ReadonlySet<string> = new Set([
  'draft',
  'submitted',
  'under-review',
  'interview-scheduled',
  'interview-completed',
  'approval-in-progress',
  'agreement-pending',
  'updating',
]);

/** Deterministic demo dataset (fixed ISO dates — no runtime clock dependency). */
export const MOCK_APPLICATIONS: readonly ApplicationSummaryDto[] = [
  {
    id: 'app-012',
    reference: null,
    services: ['content-developer'],
    status: 'draft',
    createdAt: '2026-07-18T09:00:00Z',
    submittedAt: null,
    updatedAt: '2026-07-21T14:30:00Z',
  },
  {
    id: 'app-011',
    reference: 'EH-2026-00151',
    services: ['trainer', 'consultant'],
    status: 'agreement-pending',
    createdAt: '2026-06-20T08:00:00Z',
    submittedAt: '2026-06-22T10:15:00Z',
    updatedAt: '2026-07-15T11:00:00Z',
  },
  {
    // ⚠️ MOCK **interview-exemption** scenario (J-08). Screening exempted this
    // consultant service from the interview, so the application went straight
    // from review to the approval committee — it never held an
    // `interview-scheduled` or `interview-completed` status. J-08/F2/AC-3 says
    // the trainer must see the interview step as **passed** without learning
    // there was an exemption; that falls out of the timeline being derived from
    // the business status alone, with no exemption field anywhere in the
    // trainer-facing contract.
    id: 'app-010',
    reference: 'EH-2026-00147',
    services: ['consultant'],
    status: 'approval-in-progress',
    createdAt: '2026-06-01T08:00:00Z',
    submittedAt: '2026-06-02T09:40:00Z',
    updatedAt: '2026-07-10T09:05:00Z',
  },
  {
    id: 'app-009',
    reference: 'EH-2026-00142',
    services: ['trainer'],
    status: 'interview-completed',
    createdAt: '2026-05-18T08:00:00Z',
    submittedAt: '2026-05-19T12:00:00Z',
    updatedAt: '2026-07-05T16:20:00Z',
  },
  {
    id: 'app-008',
    reference: 'EH-2026-00138',
    services: ['question-writer'],
    status: 'interview-scheduled',
    createdAt: '2026-05-10T08:00:00Z',
    submittedAt: '2026-05-11T10:00:00Z',
    updatedAt: '2026-06-28T13:45:00Z',
  },
  {
    id: 'app-007',
    reference: 'EH-2026-00133',
    services: ['speaker'],
    status: 'under-review',
    createdAt: '2026-05-02T08:00:00Z',
    submittedAt: '2026-05-03T09:00:00Z',
    updatedAt: '2026-06-20T10:10:00Z',
  },
  {
    id: 'app-006',
    reference: 'EH-2026-00129',
    services: ['trainer'],
    status: 'submitted',
    createdAt: '2026-04-25T08:00:00Z',
    submittedAt: '2026-04-26T08:30:00Z',
    updatedAt: '2026-06-15T09:00:00Z',
  },
  // Partial aggregation (04 §11): a row whose live aggregation is momentarily
  // incomplete renders the neutral `updating` presentation state.
  {
    id: 'app-005',
    reference: 'EH-2026-00124',
    services: ['consultant'],
    status: 'updating',
    createdAt: '2026-04-12T08:00:00Z',
    submittedAt: '2026-04-13T11:00:00Z',
    updatedAt: '2026-06-10T08:00:00Z',
  },
  {
    id: 'app-004',
    reference: 'EH-2025-00097',
    services: ['trainer', 'content-developer'],
    status: 'active',
    createdAt: '2025-11-03T08:00:00Z',
    submittedAt: '2025-11-04T09:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'app-003',
    reference: 'EH-2025-00081',
    services: ['consultant'],
    status: 'approved',
    createdAt: '2025-09-14T08:00:00Z',
    submittedAt: '2025-09-15T09:30:00Z',
    updatedAt: '2025-12-20T15:00:00Z',
  },
  {
    id: 'app-002',
    reference: 'EH-2025-00064',
    services: ['speaker'],
    status: 'rejected',
    createdAt: '2025-06-08T08:00:00Z',
    submittedAt: '2025-06-09T10:00:00Z',
    updatedAt: '2025-08-01T12:00:00Z',
  },
  {
    id: 'app-001',
    reference: 'EH-2025-00048',
    services: ['question-writer'],
    status: 'closed',
    createdAt: '2025-03-02T08:00:00Z',
    submittedAt: '2025-03-03T09:00:00Z',
    updatedAt: '2025-05-15T08:00:00Z',
  },
];

/**
 * The resumable demo draft — matches the `app-012` draft row in
 * `MOCK_APPLICATIONS`, with a few saved values so "resume" visibly restores
 * state. `BR-0102`: the basic applicant profile (name/email) is reused —
 * prefilled here as the mock of the profile-reuse the real API performs.
 */
export const MOCK_DRAFT: ApplicationDraftDto = {
  id: 'app-012',
  schemaVersion: APPLICATION_FORM_SCHEMA.version,
  services: ['content-developer'],
  values: {
    // Saved values across three sections, so "resume" visibly restores state
    // (field ids are the supplied `DM-GAP-01` map's — `applicationSchema.ts`).
    firstNameAr: 'خبير',
    lastNameAr: 'تجريبي',
    responsibilities: 'مسؤولية محفوظة في المسودة.',
    participationTypes: ['workshops'],
  },
  attachments: [],
  updatedAt: '2026-07-21T14:30:00Z',
};

/**
 * `BR-0102` profile-reuse prefill applied to a **fresh** draft.
 *
 * Empty on purpose since the supplied field map (`DM-GAP-01`) landed: the
 * form's identity fields are FOUR-part names, and the session carries one
 * display name — splitting it would fabricate data. The real prefill happens
 * server-side when FAST supplies the structured name columns the workbook
 * maps these fields to (`dbo.AspNetUsers.FirstNameAr`…).
 */
const PROFILE_PREFILL: ApplicationDraftDto['values'] = {};

/** Server-side completeness check messages (`BR-0105`/`BR-0109` — the mock
 *  "server" enforces the same rules regardless of channel; only validity
 *  matters here, the UI carries the localized copy). */
const SERVER_MESSAGES: ValidationMessages = {
  required: 'required',
  maxLength: () => 'max-length',
  invalidValue: 'invalid',
  dateNotFuture: 'future',
  dateNotPast: 'past',
  fileFormat: () => 'format',
  fileSize: () => 'size',
  fileCount: () => 'count',
};

export interface MockApplicationsProviderOptions {
  /** Dataset override (tests seed their own scenarios). Defaults to the demo set. */
  readonly seed?: readonly ApplicationSummaryDto[];
  /** Simulated network latency. Keep 0 in tests. */
  readonly latencyMs?: number;
  /** When set, every call fails with this error (error-state testing). */
  readonly failWith?: ExpertHubApiError;
  /** EH-TP-05: draft override (`null` = no existing draft). Defaults to `MOCK_DRAFT`
   *  when the seed contains a draft row, else none. */
  readonly draftSeed?: ApplicationDraftDto | null;
  /** J-01/F3/AC-4: the matched account already holds an active Trainer role,
   *  so a new application is refused and the applicant is sent to J-03. */
  readonly hasApprovedTrainerRole?: boolean;
  /** EH-TP-05: simulate the `G5` field-map-unavailable blocked state. */
  readonly schemaUnavailable?: boolean;
  /** RB-03: the trainer holds no active agreement — an add-service request is
   *  rejected on submission. */
  readonly noActiveAgreement?: boolean;
  /** EH-TP-05: what the Academy already knows, keyed by field code. */
  readonly prefill?: Record<string, string>;
  /** EH-TP-05: make uploads fail (upload-error / retry testing). */
  readonly uploadFailWith?: ExpertHubApiError;
  /** EH-TP-03 / J-11: make the applicant's agreement decision fail (error / retry). */
  readonly decisionFailWith?: ExpertHubApiError;
  /** EH-TP-06: simulate the FAST-unavailable state (can't read current services). */
  readonly addServiceFastUnavailable?: boolean;
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

function matchesQuery(item: ApplicationSummaryDto, query: MyApplicationsQuery): boolean {
  const search = query.search?.trim().toLowerCase() ?? '';
  if (search !== '' && !(item.reference ?? '').toLowerCase().includes(search)) {
    return false;
  }
  if (query.status != null && query.status !== 'all' && item.status !== query.status) {
    return false;
  }
  if (query.service != null && query.service !== 'all' && !item.services.includes(query.service)) {
    return false;
  }
  return true;
}

/* ── EH-TP-03 detail derivation ──────────────────────────────────────────── */

/** Fixed demo interview slots (deterministic — no runtime clock). */
const MOCK_SLOTS: readonly InterviewSlotDto[] = [
  { id: 'slot-1', startsAt: '2026-08-03T09:00:00Z' },
  { id: 'slot-2', startsAt: '2026-08-04T11:00:00Z' },
  { id: 'slot-3', startsAt: '2026-08-05T13:30:00Z' },
];

/** Ids whose detail demonstrates the stage-driven slot-selection action. */
const SLOT_SELECTION_IDS: ReadonlySet<string> = new Set(['app-008']);

/**
 * ⚠️ MOCK interview-selection SLA (J-06/F1/AC-4 — 3 business days, provisional
 * per `Q8`). Deterministic: the real server computes this against the Academy
 * calendar, which the frontend deliberately does not model (see
 * `shared/types/sla.ts`).
 */
/**
 * J-06/F1/AC-4's 3-business-day clock, from the **central** matrix
 * (`SLA-0201`, `BR-0705`). ⚠️ MOCK start instant, so the countdown is stable.
 */
const MOCK_SELECTION_STARTED_AT = '2026-06-30T09:00:00Z';
/** ⚠️ MOCK — the fixed "today" this file's countdown is measured against. */
const MOCK_NOW = '2026-07-02T09:00:00Z';
const MOCK_SELECTION_SLA: SlaDto | null = buildSlaInstance(
  SLA_IDS.interviewSlotSelection,
  MOCK_SELECTION_STARTED_AT,
  MOCK_NOW
);

/**
 * ⚠️ MOCK interview ticket (J-06/F2/AC-3). Issued once and **retained across
 * reschedules** (F4/AC-6) — the mock never regenerates it, which is the whole
 * behaviour that AC needs.
 */
const MOCK_TICKET_NUMBER = 'INT-2026-0417';

/** The applicant's interview view; `null` outside the interview stage. */
function buildInterview(summary: ApplicationSummaryDto): ApplicantInterviewDto | null {
  if (!SLOT_SELECTION_IDS.has(summary.id)) {
    return null;
  }
  return {
    proposedSlots: MOCK_SLOTS,
    selectedSlotId: null,
    selectionSla: MOCK_SELECTION_SLA,
    // F4/AC-1 — available *instead of* selecting, from the very first render.
    canRequestReschedule: true,
    pendingReschedule: null,
    ticketNumber: MOCK_TICKET_NUMBER,
    // `CAP-12` has no Teams entry (J-06 open item 1) — no fabricated link.
    meetingUrl: null,
  };
}

/**
 * ⚠️ MOCK reviewer-authored rejection reason (clearly labeled). Free-text the
 * real API returns verbatim from the reviewer's decision — authored in Arabic
 * (the primary language), shown as-is regardless of UI locale (never a UI
 * string / never machine-translated). The real reason text is the backend's.
 */
const MOCK_REJECTION_REASON =
  'بعد مراجعة الطلب والمستندات المرفقة، تبيّن عدم استيفاء الحد الأدنى من الخبرة العملية المطلوبة للخدمة المطلوبة. يمكنك تحديث بياناتك وإعادة التقديم لاحقًا.';

/**
 * ⚠️ MOCK agreement data — J-11/F1/AC-2 requires the applicant to see the
 * agreement's data in full "without exception" before deciding. In production
 * the server returns the same groups J-10 merged (trainer data, bank data, the
 * template fields); the shape is `MergedDataGroup`, shared with J-10 so the
 * applicant reads exactly what the internal signers approved rather than a
 * separately-assembled summary that could diverge from it.
 */
function buildAgreementData(summary: ApplicationSummaryDto): readonly MergedDataGroup[] {
  return [
    {
      id: 'terms',
      title: { ar: 'بنود الاتفاقية', en: 'Agreement terms' },
      entries: [
        {
          label: { ar: 'رقم الطلب', en: 'Application reference' },
          value: summary.reference ?? '—',
        },
        { label: { ar: 'تاريخ البداية', en: 'Start date' }, value: '2026-09-01' },
        { label: { ar: 'تاريخ النهاية', en: 'End date' }, value: '2027-08-31' },
        { label: { ar: 'مدة الاتفاقية', en: 'Duration' }, value: 'سنة واحدة' },
      ],
    },
    {
      id: 'trainer',
      title: { ar: 'بيانات المدرب', en: 'Trainer data' },
      entries: [
        { label: { ar: 'الاسم', en: 'Name' }, value: 'المستخدم التجريبي' },
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
      ],
    },
  ];
}

/** Which timeline stage is "current" for a given presentation status. */
function currentStageIndex(status: ApplicationSummaryDto['status']): number {
  switch (status) {
    case 'submitted':
      return 0;
    case 'under-review':
    case 'updating':
      return 1;
    case 'interview-scheduled':
    case 'interview-completed':
      return 2;
    case 'approval-in-progress':
    case 'rejected':
      return 3;
    case 'agreement-pending':
      return 4;
    default:
      return 5; // approved / active / closed / draft
  }
}

function buildTimeline(status: ApplicationSummaryDto['status']): TimelineStageDto[] {
  const current = currentStageIndex(status);
  const rejected = status === 'rejected';
  return APPLICATION_STAGES.map((id, index) => ({
    id,
    state:
      rejected && index === current
        ? 'rejected'
        : index < current
          ? 'complete'
          : index === current
            ? 'current'
            : 'upcoming',
  }));
}

function outcomeForStatus(status: ApplicationSummaryDto['status']): ServiceOutcome {
  if (status === 'approved' || status === 'active') {
    return 'accepted';
  }
  if (status === 'rejected') {
    return 'rejected';
  }
  return 'pending';
}

/** Derive a full read-only detail from a list summary; interactive scenarios
 *  (slot selection / agreement signing) are layered on top. */
function deriveDetail(summary: ApplicationSummaryDto): ApplicationDetailDto {
  const signed = summary.status === 'approved' || summary.status === 'active';
  const outcome = outcomeForStatus(summary.status);
  // No signed-agreement PDF: the API generates none (the agreement is a
  // versioned document, rendered in-page).
  const attachments = [
    { id: `${summary.id}-cv`, name: 'cv.pdf', kind: 'applicant' as const, label: null, url: null },
  ];
  const selectsSlot = SLOT_SELECTION_IDS.has(summary.id);
  const awaitingDecision = summary.status === 'agreement-pending';
  return {
    id: summary.id,
    reference: summary.reference,
    services: summary.services,
    status: summary.status,
    // The form the applicant answered, exactly as the API serves it — the
    // demo shows a submitted application's own answers, including several
    // qualifications, rather than a page with the answers missing.
    formSchema: APPLICATION_FORM_SCHEMA,
    values: MOCK_DRAFT.values,
    entries: MOCK_DRAFT.entries,
    createdAt: summary.createdAt,
    submittedAt: summary.submittedAt,
    updatedAt: summary.updatedAt,
    timeline: buildTimeline(summary.status),
    perServiceOutcomes: summary.services.map((service) => ({ service, outcome })),
    rejectionReason: summary.status === 'rejected' ? MOCK_REJECTION_REASON : null,
    attachments,
    action: selectsSlot ? 'manage-interview' : awaitingDecision ? 'decide-agreement' : 'none',
    // ⚠️ MOCK — the demo seed has nobody sitting at the bank-data gate, so the
    // section is absent rather than shown empty. The live API supplies it the
    // moment final approval asks for it (`J-09/F6`).
    bankData: null,
    interview: buildInterview(summary),
    agreementState: awaitingDecision ? 'awaiting-decision' : signed ? 'signed' : 'not-ready',
    // J-11/F1/AC-1 — the agreement exists for the applicant only once J-10 sent
    // it. Before that the field is `null`, so no decision panel can be rendered.
    agreement:
      awaitingDecision || signed
        ? {
            sentAt: summary.updatedAt,
            dataGroups: buildAgreementData(summary),
            // `P-333` — the agreement file staff uploaded for this trainer.
            documentUrl: '/v1/attachments/mock-agreement-file',
            // J-11/F1/AC-2 — the frozen version the applicant reads and decides on:
            // the creator's terms as fields, the trainer/bank data as merged groups.
            document: toApplicantDocument(
              buildMockAgreementDocument(
                1,
                { startDate: '2026-09-01', endDate: '2027-08-31' },
                buildAgreementData(summary).filter((group) => group.id !== 'terms'),
                summary.updatedAt
              )
            ),
            decision: signed ? { kind: 'sign', decidedAt: summary.updatedAt, note: null } : null,
          }
        : null,
    sync: signed ? 'synchronized' : 'none',
  };
}

export function createMockApplicationsProvider(
  options: MockApplicationsProviderOptions = {}
): ApplicationsService {
  const {
    seed = MOCK_APPLICATIONS,
    latencyMs = 300,
    failWith,
    schemaUnavailable,
    prefill = {},
    uploadFailWith,
    hasApprovedTrainerRole = false,
    noActiveAgreement = false,
  } = options;

  // EH-TP-05 draft state, held in the provider closure exactly as the future
  // API holds it server-side. Cloned so tests never mutate the shared seed.
  const initialDraft =
    options.draftSeed !== undefined
      ? options.draftSeed
      : seed.some((item) => item.status === 'draft')
        ? MOCK_DRAFT
        : null;
  let draft: ApplicationDraftDto | null =
    initialDraft == null
      ? null
      : {
          ...initialDraft,
          values: { ...initialDraft.values },
          attachments: [...initialDraft.attachments],
        };
  let attachmentCounter = 0;
  let submitCounter = 0;
  let draftCounter = 0;

  // EH-TP-03: per-id detail state, held in the closure exactly as the server
  // holds it. Derived on first access from the matching list summary; actions
  // (slot select / sign) mutate it in place so a re-fetch reflects the change.
  const details = new Map<string, ApplicationDetailDto>();
  const { decisionFailWith } = options;

  function loadDetail(id: string): ApplicationDetailDto | null {
    const existing = details.get(id);
    if (existing != null) {
      return existing;
    }
    const summary = seed.find((item) => item.id === id);
    if (summary == null) {
      return null;
    }
    const derived = deriveDetail(summary);
    details.set(id, derived);
    return derived;
  }

  return {
    async listMyApplications(
      query: MyApplicationsQuery
    ): Promise<Result<MyApplicationsListDto, ExpertHubApiError>> {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }

      const filtered = seed.filter((item) => matchesQuery(item, query));
      const pageCount = Math.max(1, Math.ceil(filtered.length / query.pageSize));
      const page = Math.min(Math.max(1, query.page), pageCount);
      const start = (page - 1) * query.pageSize;

      const statusCounts = Object.fromEntries(
        APPLICATION_STATUSES.map((status) => [
          status,
          seed.filter((item) => item.status === status).length,
        ])
      ) as Record<ApplicationStatus, number>;

      const blocking = seed.find((item) => UNDECIDED_STATUSES.has(item.status));

      return {
        ok: true,
        value: {
          items: filtered.slice(start, start + query.pageSize),
          totalCount: filtered.length,
          page,
          pageSize: query.pageSize,
          pageCount,
          canCreateNew: blocking == null,
          activeApplicationId: blocking?.id ?? null,
          totalApplications: seed.length,
          statusCounts,
        },
      };
    },

    async getApplicationPrefill() {
      await delay(latencyMs);
      // ⚠️ Empty by default: the mock stands in for a person the Academy holds
      // nothing about, which is the state the form must handle first.
      return { ok: true as const, value: prefill };
    },

    async getApplicationFormSchema() {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      if (schemaUnavailable === true) {
        // `04` EH-TP-05 §11 Field-map-unavailable: the `G5` config is missing —
        // the shell renders but the real fields cannot (explicit blocked state).
        return { ok: false, error: { status: 404, message: 'Field map not configured (G5).' } };
      }
      return { ok: true, value: APPLICATION_FORM_SCHEMA };
    },

    async startOrResumeDraft() {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      // J-01/F3/AC-4 — an already-accredited trainer never re-applies; they add
      // a service instead (J-03). Checked before the draft, because holding an
      // approved Trainer role outranks any half-finished draft.
      if (hasApprovedTrainerRole) {
        return {
          ok: true,
          value: {
            draft: null,
            resumed: false,
            blockReason: 'approved-trainer',
            blockedByApplicationId: null,
          },
        };
      }
      if (draft != null) {
        return {
          ok: true,
          value: { draft, resumed: true, blockReason: null, blockedByApplicationId: null },
        };
      }
      // `BR-0101`: a non-draft un-decided application blocks starting a new one.
      const blocking = seed.find(
        (item) => item.status !== 'draft' && UNDECIDED_STATUSES.has(item.status)
      );
      if (blocking != null) {
        return {
          ok: true,
          value: {
            draft: null,
            resumed: false,
            blockReason: 'open-application',
            blockedByApplicationId: blocking.id,
          },
        };
      }
      draftCounter += 1;
      draft = {
        id: `draft-${draftCounter}`,
        schemaVersion: APPLICATION_FORM_SCHEMA.version,
        services: [],
        // `BR-0102`: the applicant's basic profile is reused on later applications.
        values: { ...PROFILE_PREFILL },
        attachments: [],
        updatedAt: new Date().toISOString(),
      };
      return {
        ok: true,
        value: { draft, resumed: false, blockReason: null, blockedByApplicationId: null },
      };
    },

    async saveDraft(input) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      if (draft == null) {
        return { ok: false, error: { status: 404, message: 'No draft to save.' } };
      }
      // `BR-0107`: saving a draft never issues a reference number.
      draft = {
        ...draft,
        services: input.services,
        values: { ...input.values },
        entries: input.entries,
        updatedAt: new Date().toISOString(),
      };
      return { ok: true, value: draft };
    },

    async uploadAttachment(ruleId, file, entryId) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      if (uploadFailWith != null) {
        return { ok: false, error: uploadFailWith };
      }
      if (draft == null) {
        return { ok: false, error: { status: 404, message: 'No draft.' } };
      }
      const rule = APPLICATION_FORM_SCHEMA.attachments.find((candidate) => candidate.id === ruleId);
      if (rule == null) {
        return { ok: false, error: { status: 400, message: 'Unknown attachment rule.' } };
      }
      // `BR-0106` re-validated server-side (the UI already validated on select).
      // A per-entry rule counts within its own entry: `maxCount: 1` means one
      // certificate per qualification, not one per application.
      const existingCount = draft.attachments.filter(
        (attachment) =>
          attachment.ruleId === ruleId && (attachment.entryId ?? null) === (entryId ?? null)
      ).length;
      const invalid = validateAttachmentFile(rule, file, existingCount, SERVER_MESSAGES);
      if (invalid != null) {
        return { ok: false, error: { status: 400, message: invalid } };
      }
      attachmentCounter += 1;
      const dto = {
        id: `att-${attachmentCounter}`,
        ruleId,
        fileName: file.name,
        sizeBytes: file.size,
        entryId: entryId ?? null,
      };
      draft = { ...draft, attachments: [...draft.attachments, dto] };
      return { ok: true, value: dto };
    },

    async removeAttachment(attachmentId) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      if (draft != null) {
        draft = {
          ...draft,
          attachments: draft.attachments.filter((attachment) => attachment.id !== attachmentId),
        };
      }
      return { ok: true, value: null };
    },

    async submitApplication(input) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      if (draft == null) {
        return { ok: false, error: { status: 404, message: 'No draft to submit.' } };
      }
      const candidate = {
        ...draft,
        services: input.services,
        values: { ...input.values },
        entries: input.entries,
      };
      // `BR-0105`/`BR-0109`: the "server" enforces the same completeness rules
      // regardless of channel — an incomplete submission is rejected here even
      // if the UI gate were bypassed.
      const completeness = validateCompleteness(
        APPLICATION_FORM_SCHEMA,
        candidate,
        'ar',
        SERVER_MESSAGES
      );
      if (!completeness.valid) {
        return { ok: false, error: { status: 400, message: 'Application incomplete (BR-0105).' } };
      }
      // `BR-0107`: the reference number is generated HERE, by the service, at
      // submit only — never by the page, never for drafts. Mock format only —
      // the real numbering algorithm is the backend's.
      submitCounter += 1;
      const reference = `EH-2026-9${String(submitCounter).padStart(4, '0')}`;
      const value = {
        applicationId: candidate.id,
        reference,
        submittedAt: new Date().toISOString(),
      };
      draft = null;
      return { ok: true, value };
    },

    async getApplication(id) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const detail = loadDetail(id);
      if (detail == null) {
        // Unknown/foreign id → 404 (the page renders the Expert Hub NotFound).
        return { ok: false, error: { status: 404, message: 'Application not found.' } };
      }
      return { ok: true, value: { ...detail } };
    },

    async selectInterviewSlot(id, slotId) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const detail = loadDetail(id);
      if (detail == null) {
        return { ok: false, error: { status: 404, message: 'Application not found.' } };
      }
      if (detail.action !== 'manage-interview' || detail.interview == null) {
        return {
          ok: false,
          error: { status: 409, message: 'No interview slot selection pending.' },
        };
      }
      if (!detail.interview.proposedSlots.some((slot) => slot.id === slotId)) {
        return { ok: false, error: { status: 400, message: 'Unknown slot.' } };
      }
      // `BR-0206` / F1/AC-5: slot confirmed → status becomes Interview Scheduled.
      const next: ApplicationDetailDto = {
        ...detail,
        status: 'interview-scheduled',
        // F4/AC-2 — the applicant may still ask to change a CONFIRMED time, so
        // the interview stays actionable rather than dropping to `none`.
        action: 'manage-interview',
        interview: {
          ...detail.interview,
          selectedSlotId: slotId,
          // Nothing left to decide against a clock.
          selectionSla: null,
          canRequestReschedule: true,
          pendingReschedule: null,
          // F2/AC-1 — the meeting is created at this moment. ⚠️ MOCK link: the
          // real one comes from the Teams integration, still undocumented.
          meetingUrl: 'https://teams.microsoft.com/l/meetup-join/mock-expert-hub-interview',
        },
        updatedAt: new Date().toISOString(),
      };
      details.set(id, next);
      return { ok: true, value: { ...next } };
    },

    async requestInterviewReschedule(id, input) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const detail = loadDetail(id);
      if (detail == null) {
        return { ok: false, error: { status: 404, message: 'Application not found.' } };
      }
      if (detail.interview == null || !detail.interview.canRequestReschedule) {
        return { ok: false, error: { status: 409, message: 'Reschedule not available.' } };
      }
      const requestedAt = new Date().toISOString();
      // F4/AC-4 — staff propose new slots and the F1 flow repeats; until then the
      // applicant is waiting, so the stale proposals are cleared rather than left
      // selectable. F4/AC-6 — `ticketNumber` is deliberately untouched.
      const next: ApplicationDetailDto = {
        ...detail,
        action: 'manage-interview',
        interview: {
          ...detail.interview,
          proposedSlots: [],
          selectedSlotId: null,
          selectionSla: null,
          canRequestReschedule: false,
          pendingReschedule: { requestedAt, note: input.note.trim() || null },
          meetingUrl: null,
        },
        updatedAt: requestedAt,
      };
      details.set(id, next);
      return { ok: true, value: { ...next } };
    },

    async saveBankData(id, fields) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      void fields;
      const detail = loadDetail(id);
      if (detail == null) {
        return { ok: false, error: { status: 404, message: 'Application not found.' } };
      }
      // The mock seeds nobody at the bank-data gate, so this hands the
      // application back unchanged rather than pretending to save.
      return { ok: true, value: { ...detail } };
    },
    async decideOnAgreement(id, input) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      if (decisionFailWith != null) {
        return { ok: false, error: decisionFailWith };
      }
      const detail = loadDetail(id);
      if (detail == null) {
        return { ok: false, error: { status: 404, message: 'Application not found.' } };
      }
      if (detail.action !== 'decide-agreement' || detail.agreement == null) {
        return { ok: false, error: { status: 409, message: 'No agreement awaiting a decision.' } };
      }
      // The same gate the UI applies, applied again here: a client that skipped
      // the form must not be able to record an unsigned signature or an empty
      // modification note (F1/AC-3, F1/AC-5).
      if (validateApplicantAgreementDecision(input).length > 0) {
        return { ok: false, error: { status: 400, message: 'Invalid agreement decision.' } };
      }

      const decidedAt = new Date().toISOString();
      const note = input.kind === 'sign' ? null : input.note.trim() || null;
      const agreement: ApplicantAgreementDto = {
        ...detail.agreement,
        decision: { kind: input.kind, decidedAt, note },
      };

      if (input.kind === 'reject') {
        // F1/AC-4 — **permanently** closed: no return path and no automatic
        // re-submission. `action` becomes `none` and nothing sets it back.
        const next: ApplicationDetailDto = {
          ...detail,
          status: 'closed',
          action: 'none',
          agreementState: 'declined',
          agreement,
          timeline: buildTimeline('closed'),
          updatedAt: decidedAt,
        };
        details.set(id, next);
        return { ok: true, value: { ...next } };
      }

      if (input.kind === 'request-modification') {
        // F1/AC-5 → AC-7 — the note goes back to the J-10 creator, who edits and
        // re-submits through a BRAND-NEW internal signing sequence. From the
        // applicant's side the application stays at the agreement stage with no
        // action pending; it returns when the new sequence completes.
        const next: ApplicationDetailDto = {
          ...detail,
          action: 'none',
          agreementState: 'modification-requested',
          agreement,
          updatedAt: decidedAt,
        };
        details.set(id, next);
        return { ok: true, value: { ...next } };
      }

      // F1/AC-3 — signing sets Approved immediately. The acceptance is recorded
      // against the document version (internal acceptance); the API generates
      // no signed PDF, so none is added to the attachments. FAST sync then runs
      // on a SEPARATE track (`sync: 'processing'`) and never reverts this status
      // (`§0.9`).
      const next: ApplicationDetailDto = {
        ...detail,
        status: 'approved',
        action: 'none',
        agreementState: 'signed',
        agreement,
        sync: 'processing',
        timeline: buildTimeline('approved'),
        updatedAt: decidedAt,
      };
      details.set(id, next);
      return { ok: true, value: { ...next } };
    },

    async getAddServiceContext(id) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const detail = loadDetail(id);
      if (detail == null) {
        return { ok: false, error: { status: 404, message: 'Application not found.' } };
      }
      // Entry: approved trainer with an active agreement (`§3`). `active` = has a
      // live agreement; `approved` = signed, agreement in place.
      const eligible = detail.status === 'approved' || detail.status === 'active';
      return {
        ok: true,
        value: {
          applicationId: id,
          reference: detail.reference ?? '',
          currentServices: detail.services,
          // `§9`/P-17: if FAST can't be read, current services can't be verified.
          fastAvailable: options.addServiceFastUnavailable !== true,
          eligible,
        },
      };
    },

    async submitAddServiceRequest(id, input: AddServiceRequestInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const detail = loadDetail(id);
      if (detail == null) {
        return { ok: false, error: { status: 404, message: 'Application not found.' } };
      }
      // `BR-0113`: Speaker is never self-service selectable.
      if (!APPLICATION_FORM_SCHEMA.selectableServices.includes(input.service)) {
        return {
          ok: false,
          error: { status: 400, message: 'Service not self-service selectable.' },
        };
      }
      // `BR-0110`: a service already approved cannot be requested again.
      if (detail.services.includes(input.service)) {
        return { ok: false, error: { status: 409, message: 'Service already approved.' } };
      }
      // `BR-0112`: routes straight to the admin decision path (no screening). The
      // mock issues a request reference; the real numbering is the backend's.
      submitCounter += 1;
      return {
        ok: true,
        value: {
          requestId: `EH-ASR-2026-${String(submitCounter).padStart(4, '0')}`,
          submittedAt: new Date().toISOString(),
          // RB-03 — as the server: recorded, and rejected at once.
          status: noActiveAgreement ? 'rejected' : 'pending',
          rejectionReason: noActiveAgreement ? 'no-active-agreement' : null,
        },
      };
    },
  };
}
