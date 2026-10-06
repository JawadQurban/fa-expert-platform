import type { ExpertHubApiError } from '../../shared/services/apiClient';
import type { AssignmentService } from './assignmentService';
import type { AssignmentRequestSummaryDto, PulledRequestDataDto } from './assignment.types';
import {
  brochureFileIssue,
  isProgramLike,
  headcountOf,
  nomineesOf,
  serviceTypeFor,
  validateCentreRequest,
  type CreateCentreRequestInput,
} from './centreRequestForm.types';
import {
  poolSizeFor,
  validatePool,
  validatePoolDecision,
  type CandidatePoolDto,
  type ExcludedCandidateDto,
  type MatchCandidateDto,
  type MatchExclusionReason,
  type MatchingModelDto,
  type MatchingRunDto,
  type PoolDecisionInput,
  type PoolMemberDto,
  type SendPoolInput,
  type WeightedCriterionScore,
} from './matching.types';

/**
 * Versioned **mock** provider for EH-INT-09. It stands in for the Expert Hub
 * API, which in turn brokers FAST — the browser never touches FAST itself.
 *
 * ⚠️ 2026-08-30 — request capture follows the owner's centre form
 * (`DM-GAP-06`): `createRequest` takes the workbook's fields and validates its
 * per-type rules. The FAST plan seeds remain because the SEEDED requests (and
 * the matching/offer journeys built on them) still carry pulled FAST data —
 * F3/AC-2's separation of programme- and plan-level values still holds there.
 *
 * ⚠️ MOCK DATA (clearly labelled): programs, plans and fees are representative
 * development data, not real FAST records.
 *
 * ⚠️ Deterministic clock — `now` is a fixed instant, so the "end date has
 * passed" exclusion is reproducible rather than drifting with the wall clock.
 */

/** ⚠️ MOCK — the fixed "today" the end-date exclusion is measured against. */
const MOCK_NOW = '2026-08-20T09:00:00Z';

interface MockPlanSeed {
  readonly planId: string;
  readonly programId: string;
  readonly planName: string;
  /** F2/AC-2 — a FAST status; `final-closed` is excluded from selection. */
  readonly fastStatus: 'open' | 'in-progress' | 'final-closed';
  readonly startsAt: string;
  readonly endsAt: string;
  readonly days: number;
  readonly hours: number;
  readonly programFee: number;
  readonly language: string;
  readonly deliveryMode: 'in-class' | 'online';
  readonly country: string;
  readonly city: string;
  readonly meetingUrl: string | null;
  readonly trainingMaterialName: string | null;
}

/** ⚠️ MOCK **Program-level** data — the identity brief lives only here. */
const MOCK_PROGRAMS = {
  'prg-001': {
    programId: 'prg-001',
    identityBrief: {
      ar: 'برنامج تنفيذي يستهدف القيادات الوسطى في القطاع المالي، ويركّز على مهارات القيادة واتخاذ القرار.',
      en: 'An executive programme for middle leadership in the financial sector, focused on leadership and decision-making.',
    },
    name: { ar: 'برنامج القيادة التنفيذية', en: 'Executive Leadership Programme' },
    specialization: 'القيادة والإدارة',
  },
  'prg-002': {
    programId: 'prg-002',
    identityBrief: {
      ar: 'برنامج متخصص في حوكمة البيانات وأدوات التحليل للقطاع المصرفي.',
      en: 'A specialist programme in data governance and analytics for the banking sector.',
    },
    name: { ar: 'برنامج حوكمة البيانات', en: 'Data Governance Programme' },
    specialization: 'تحليل البيانات',
  },
  'prg-003': {
    programId: 'prg-003',
    identityBrief: {
      ar: 'برنامج تأسيسي في التخطيط المالي الشخصي والمؤسسي.',
      en: 'A foundation programme in personal and corporate financial planning.',
    },
    name: { ar: 'برنامج التخطيط المالي', en: 'Financial Planning Programme' },
    specialization: 'المالية والمحاسبة',
  },
} as const;

/** ⚠️ MOCK **Plan-level** data — every operational detail lives only here. */
const MOCK_PLANS: readonly MockPlanSeed[] = [
  {
    planId: 'pln-1001',
    programId: 'prg-001',
    planName: 'الدفعة الخريفية 2026',
    fastStatus: 'open',
    startsAt: '2026-10-05T08:00:00Z',
    endsAt: '2026-10-08T14:00:00Z',
    days: 4,
    hours: 20,
    programFee: 48000,
    language: 'العربية',
    deliveryMode: 'in-class',
    country: 'السعودية',
    city: 'الرياض',
    meetingUrl: null,
    trainingMaterialName: null,
  },
  {
    planId: 'pln-1002',
    programId: 'prg-002',
    planName: 'الدفعة الافتراضية 2026',
    fastStatus: 'in-progress',
    startsAt: '2026-11-02T08:00:00Z',
    endsAt: '2026-11-04T12:00:00Z',
    days: 3,
    hours: 12,
    programFee: 27000,
    language: 'الإنجليزية',
    deliveryMode: 'online',
    country: 'السعودية',
    city: 'الرياض',
    // Row 11 — carried because FAST supplies it; shown to the trainer only at
    // engagement confirmation (J-21), never here.
    meetingUrl: 'https://teams.microsoft.com/l/meetup-join/mock-plan-1002',
    trainingMaterialName: 'حقيبة حوكمة البيانات.pdf',
  },
  {
    // F2/AC-2 — excluded: FAST status is Final Closed.
    planId: 'pln-0900',
    programId: 'prg-003',
    planName: 'الدفعة الربيعية 2026',
    fastStatus: 'final-closed',
    startsAt: '2026-03-01T08:00:00Z',
    endsAt: '2026-03-04T14:00:00Z',
    days: 4,
    hours: 18,
    programFee: 36000,
    language: 'العربية',
    deliveryMode: 'in-class',
    country: 'السعودية',
    city: 'جدة',
    meetingUrl: null,
    trainingMaterialName: null,
  },
  {
    // F2/AC-2 — excluded: the end date has passed.
    planId: 'pln-0950',
    programId: 'prg-003',
    planName: 'الدفعة الصيفية 2026',
    fastStatus: 'open',
    startsAt: '2026-06-01T08:00:00Z',
    endsAt: '2026-06-05T14:00:00Z',
    days: 5,
    hours: 25,
    programFee: 40000,
    language: 'العربية',
    deliveryMode: 'in-class',
    country: 'السعودية',
    city: 'الدمام',
    meetingUrl: null,
    trainingMaterialName: null,
  },
];

/** ⚠️ MOCK existing requests, so a fresh submission is not the only row. */
const SEED_REQUESTS: readonly AssignmentRequestSummaryDto[] = [
  {
    requestId: 'asg-001',
    reference: 'EH-ASG-2026-0018',
    serviceType: 'trainer',
    programName: MOCK_PROGRAMS['prg-001'].name,
    requiredHeadcount: 2,
    status: 'matching',
    createdAt: '2026-08-17T10:00:00Z',
    createdByName: 'منسّق البرامج',
  },
];

/* ------------------------------------------------------------------ *
 * J-17 — the matching engine
 * ------------------------------------------------------------------ */

/**
 * ⚠️ **`DM-GAP-05`** — these weights are **not approved**. They are served as
 * configuration so the page renders whatever model it receives, exactly as the
 * screening evaluation matrix does (P-24). The real model replaces this object
 * and nothing else.
 */
const MOCK_MATCHING_MODEL: MatchingModelDto = {
  version: 'mock-dm-gap-05-draft.1',
  // The API's seeded model (`Cap05SeedData`), mirrored — one set of numbers, not two.
  weights: { language: 34, 'delivery-mode': 33, evaluation: 33 },
  tieBreakNote: {
    ar: '⚠️ قاعدة كسر التعادل غير معتمدة بعد؛ يُرتَّب المتساوون بحسب التقييم ثم الاسم.',
    en: '⚠️ The tie-breaking rule is not approved yet; ties fall back to evaluation, then name.',
  },
};

/**
 * ⚠️ MOCK candidate pool — a trainer base wide enough to fill a two-slot
 * request (six candidates) with exclusions left over to demonstrate F1/AC-2.
 */
interface MockCandidateSeed {
  readonly trainerId: string;
  readonly name: string;
  readonly classification: 'expert' | 'senior' | 'certified';
  readonly evaluationOverall: number | null;
  /** Row 1 — exclusionary. */
  readonly specializations: readonly string[];
  /** Row 2 — exclusionary unless the plan is online. */
  readonly city: string;
  /** Row 3 — exclusionary. Confirmed engagements, as date ranges. */
  readonly engagements: readonly { readonly startsAt: string; readonly endsAt: string }[];
  /** Row 4 — exclusionary; only `active` passes. */
  readonly fileStatus: 'active' | 'idle' | 'suspended' | 'expired';
  /** Row 5 — weighted. */
  readonly languages: readonly string[];
  /** Row 6 — weighted. */
  readonly deliveryModes: readonly ('in-class' | 'online')[];
  readonly priceInClass: number | null;
  readonly priceOnline: number | null;
  readonly agreementReference: string;
}

const MOCK_CANDIDATES: readonly MockCandidateSeed[] = [
  {
    trainerId: 'trn-101',
    name: 'د. سارة العتيبي',
    classification: 'expert',
    evaluationOverall: 4.8,
    specializations: ['القيادة والإدارة'],
    city: 'الرياض',
    engagements: [],
    fileStatus: 'active',
    languages: ['العربية', 'الإنجليزية'],
    deliveryModes: ['in-class', 'online'],
    priceInClass: 9000,
    priceOnline: 7000,
    agreementReference: 'AGR-2026-00042',
  },
  {
    trainerId: 'trn-102',
    name: 'أ. خالد المطيري',
    classification: 'senior',
    evaluationOverall: 4.2,
    specializations: ['القيادة والإدارة'],
    city: 'الرياض',
    engagements: [],
    fileStatus: 'active',
    languages: ['العربية'],
    deliveryModes: ['in-class'],
    priceInClass: 7500,
    priceOnline: null,
    agreementReference: 'AGR-2025-00311',
  },
  {
    trainerId: 'trn-103',
    name: 'م. نورة الشمري',
    classification: 'certified',
    evaluationOverall: 3.9,
    specializations: ['القيادة والإدارة'],
    city: 'الرياض',
    engagements: [],
    fileStatus: 'active',
    languages: ['العربية', 'الإنجليزية'],
    deliveryModes: ['in-class', 'online'],
    priceInClass: 6000,
    priceOnline: 5000,
    agreementReference: 'AGR-2026-00108',
  },
  {
    trainerId: 'trn-104',
    name: 'أ. ريم القحطاني',
    classification: 'senior',
    evaluationOverall: 4.5,
    specializations: ['القيادة والإدارة'],
    city: 'الرياض',
    engagements: [],
    fileStatus: 'active',
    languages: ['العربية'],
    deliveryModes: ['in-class', 'online'],
    priceInClass: 8000,
    priceOnline: 6500,
    agreementReference: 'AGR-2026-00201',
  },
  {
    trainerId: 'trn-105',
    name: 'د. فهد الدوسري',
    classification: 'expert',
    evaluationOverall: 4.1,
    specializations: ['القيادة والإدارة'],
    city: 'الرياض',
    engagements: [],
    fileStatus: 'active',
    languages: ['الإنجليزية'],
    deliveryModes: ['online'],
    priceInClass: null,
    priceOnline: 8500,
    agreementReference: 'AGR-2026-00233',
  },
  {
    trainerId: 'trn-106',
    name: 'أ. هند العنزي',
    classification: 'certified',
    evaluationOverall: null,
    specializations: ['القيادة والإدارة'],
    city: 'الرياض',
    engagements: [],
    fileStatus: 'active',
    languages: ['العربية'],
    deliveryModes: ['in-class'],
    priceInClass: 5500,
    priceOnline: null,
    agreementReference: 'AGR-2026-00240',
  },
  {
    // Row 1 — excluded: wrong specialization.
    trainerId: 'trn-107',
    name: 'أ. ماجد الحربي',
    classification: 'senior',
    evaluationOverall: 4.9,
    specializations: ['الأمن السيبراني'],
    city: 'الرياض',
    engagements: [],
    fileStatus: 'active',
    languages: ['العربية'],
    deliveryModes: ['in-class'],
    priceInClass: 7000,
    priceOnline: null,
    agreementReference: 'AGR-2026-00250',
  },
  {
    // Row 2 — excluded: wrong city (the seeded plan is in-class in الرياض).
    trainerId: 'trn-108',
    name: 'د. لمياء السالم',
    classification: 'expert',
    evaluationOverall: 4.7,
    specializations: ['القيادة والإدارة'],
    city: 'جدة',
    engagements: [],
    fileStatus: 'active',
    languages: ['العربية'],
    deliveryModes: ['in-class'],
    priceInClass: 8800,
    priceOnline: null,
    agreementReference: 'AGR-2026-00260',
  },
  {
    // Row 3 — excluded: a confirmed engagement overlapping the plan dates.
    trainerId: 'trn-109',
    name: 'أ. طارق الزهراني',
    classification: 'senior',
    evaluationOverall: 4.4,
    specializations: ['القيادة والإدارة'],
    city: 'الرياض',
    engagements: [{ startsAt: '2026-10-06T08:00:00Z', endsAt: '2026-10-09T14:00:00Z' }],
    fileStatus: 'active',
    languages: ['العربية'],
    deliveryModes: ['in-class'],
    priceInClass: 7200,
    priceOnline: null,
    agreementReference: 'AGR-2026-00270',
  },
  {
    // Row 4 — excluded: file status is not active.
    trainerId: 'trn-110',
    name: 'أ. عبير الشهري',
    classification: 'certified',
    evaluationOverall: 4.0,
    specializations: ['القيادة والإدارة'],
    city: 'الرياض',
    engagements: [],
    fileStatus: 'suspended',
    languages: ['العربية'],
    deliveryModes: ['in-class'],
    priceInClass: 6200,
    priceOnline: null,
    agreementReference: 'AGR-2026-00280',
  },
];

/**
 * «اسم المركز» — the five operational centres of the approved Notion Assignment
 * Matrix, with the ids the API seeds. Arabic-only at source, so the English
 * label carries the same Arabic rather than an invented translation.
 */
const MOCK_CENTRES = [
  {
    value: 'ac000000-0000-0000-0000-000000000001',
    labelAr: 'البنوك والتمويل',
    labelEn: 'البنوك والتمويل',
  },
  {
    value: 'ac000000-0000-0000-0000-000000000002',
    labelAr: 'الأوراق المالية',
    labelEn: 'الأوراق المالية',
  },
  { value: 'ac000000-0000-0000-0000-000000000003', labelAr: 'التامين', labelEn: 'التامين' },
  {
    value: 'ac000000-0000-0000-0000-000000000004',
    labelAr: 'البرامج الخاصة',
    labelEn: 'البرامج الخاصة',
  },
  { value: 'ac000000-0000-0000-0000-000000000005', labelAr: 'القيادات', labelEn: 'القيادات' },
] as const;

const MOCK_RESPONSIBLE_EMPLOYEES = [
  { value: 'emp-001', labelAr: 'منسّق البرامج', labelEn: 'Programmes coordinator' },
  { value: 'emp-002', labelAr: 'أخصائي التدريب', labelEn: 'Training specialist' },
] as const;

const MOCK_NOMINEES = [
  { value: 'trn-101', labelAr: 'أحمد الغامدي', labelEn: 'Ahmed Al-Ghamdi' },
  { value: 'trn-102', labelAr: 'نورة القحطاني', labelEn: 'Noura Al-Qahtani' },
] as const;

export interface MockAssignmentProviderOptions {
  readonly latencyMs?: number;
  readonly failWith?: ExpertHubApiError;
  readonly now?: string;
  /**
   * J-17 has two actors — Trainer Management staff who build the pool, and the
   * requesting party who decides on it. Both are granted by default so one
   * session can walk the journey; tests narrow it to check the split.
   */
  readonly viewer?: { readonly canMatch?: boolean; readonly canApprove?: boolean };
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockAssignmentProvider(
  options: MockAssignmentProviderOptions = {}
): AssignmentService {
  const { latencyMs = 300, failWith, now = MOCK_NOW, viewer } = options;

  let requests: AssignmentRequestSummaryDto[] = SEED_REQUESTS.map((request) => ({ ...request }));
  let counter = SEED_REQUESTS.length;
  /** Stored brochures by id, as the server's ATTACHMENT table holds them. */
  const brochures = new Map<string, string>();
  /** J-17 — one pool per request, held as the server holds it. */
  const pools = new Map<string, CandidatePoolDto>();

  function pulledFor(plan: MockPlanSeed): PulledRequestDataDto {
    const program = MOCK_PROGRAMS[plan.programId as keyof typeof MOCK_PROGRAMS];
    // F3/AC-2 — two objects, from two levels. Nothing merges them.
    return {
      program: {
        programId: program.programId,
        identityBrief: program.identityBrief,
        name: program.name,
        specialization: program.specialization,
      },
      plan: {
        planId: plan.planId,
        days: plan.days,
        hours: plan.hours,
        programFee: plan.programFee,
        language: plan.language,
        deliveryMode: plan.deliveryMode,
        country: plan.country,
        city: plan.city,
        startsAt: plan.startsAt,
        endsAt: plan.endsAt,
        meetingUrl: plan.meetingUrl,
        trainingMaterialName: plan.trainingMaterialName,
      },
    };
  }

  /* ── J-17 — the matching engine ─────────────────────────────────────── */

  /** The plan a request was raised against, needed for every matrix row. */
  function planForRequest(request: AssignmentRequestSummaryDto): MockPlanSeed | null {
    return (
      MOCK_PLANS.find(
        (plan) =>
          MOCK_PROGRAMS[plan.programId as keyof typeof MOCK_PROGRAMS].name.ar ===
          request.programName?.ar
      ) ?? null
    );
  }

  /** Rows 1–4 — every exclusionary criterion this candidate fails (F1/AC-2). */
  function exclusionsFor(
    candidate: MockCandidateSeed,
    plan: MockPlanSeed
  ): readonly MatchExclusionReason[] {
    const reasons: MatchExclusionReason[] = [];
    const program = MOCK_PROGRAMS[plan.programId as keyof typeof MOCK_PROGRAMS];

    // Row 1 — approved specializations vs the Program's specialization.
    if (!candidate.specializations.includes(program.specialization)) {
      reasons.push('specialization');
    }
    // Row 2 — the trainer's city vs the Plan's city, **unless online**. The
    // matrix's parenthetical is the whole rule: an online plan has no location.
    if (plan.deliveryMode !== 'online' && candidate.city !== plan.city) {
      reasons.push('location');
    }
    // Row 3 — any confirmed engagement overlapping the plan's dates.
    const planStart = new Date(plan.startsAt).getTime();
    const planEnd = new Date(plan.endsAt).getTime();
    if (
      candidate.engagements.some(
        (engagement) =>
          new Date(engagement.startsAt).getTime() <= planEnd &&
          new Date(engagement.endsAt).getTime() >= planStart
      )
    ) {
      reasons.push('schedule-conflict');
    }
    // Row 4 — an active file passes, and so does an idle one: J-13's `idle` has
    // «no effect on matching eligibility». Suspended and expired do not.
    if (candidate.fileStatus !== 'active' && candidate.fileStatus !== 'idle') {
      reasons.push('file-status');
    }
    return reasons;
  }

  /**
   * Rows 5–7 — the weighted criteria. **None of these can exclude anyone**
   * (F1/AC-3): every branch produces a score, and the lowest possible score is
   * zero, never a removal.
   */
  function scoresFor(
    candidate: MockCandidateSeed,
    plan: MockPlanSeed
  ): readonly WeightedCriterionScore[] {
    const { weights } = MOCK_MATCHING_MODEL;
    const raw: Readonly<Record<string, number>> = {
      // Row 5 — does the trainer deliver in the plan's language?
      language: candidate.languages.includes(plan.language) ? 1 : 0,
      // Row 6 — can they deliver in the plan's mode?
      'delivery-mode': candidate.deliveryModes.includes(plan.deliveryMode) ? 1 : 0,
      // Row 7 — evaluation and classification. An un-rated trainer scores on
      // classification alone rather than being penalised for having no rating.
      evaluation:
        (candidate.evaluationOverall == null ? 0.5 : candidate.evaluationOverall / 5) *
        (candidate.classification === 'expert'
          ? 1
          : candidate.classification === 'senior'
            ? 0.85
            : 0.7),
    };
    return (['language', 'delivery-mode', 'evaluation'] as const).map((criterion) => ({
      criterion,
      rawScore: raw[criterion],
      weight: weights[criterion],
      weighted: raw[criterion] * weights[criterion],
    }));
  }

  function toCandidate(candidate: MockCandidateSeed, plan: MockPlanSeed): MatchCandidateDto {
    const scores = scoresFor(candidate, plan);
    return {
      trainerId: candidate.trainerId,
      name: candidate.name,
      classification: candidate.classification,
      evaluationOverall: candidate.evaluationOverall,
      scores,
      totalScore: scores.reduce((sum, score) => sum + score.weighted, 0),
      price: {
        inClass: candidate.priceInClass,
        online: candidate.priceOnline,
        currency: 'SAR',
        agreementReference: candidate.agreementReference,
      },
    };
  }

  function emptyPool(requiredHeadcount: number): CandidatePoolDto {
    return { status: 'not-built', members: [], sentAt: null, requiredHeadcount };
  }

  return {
    async listRequests() {
      await delay(latencyMs);
      return failWith != null ? { ok: false, error: failWith } : { ok: true, value: [...requests] };
    },

    async getRequest(requestId: string) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const request = requests.find((candidate) => candidate.requestId === requestId);
      if (request == null) {
        return { ok: false, error: { status: 404, message: 'Assignment request not found.' } };
      }
      const plan = MOCK_PLANS.find(
        (candidate) =>
          MOCK_PROGRAMS[candidate.programId as keyof typeof MOCK_PROGRAMS].name.ar ===
          request.programName?.ar
      );
      return {
        ok: true,
        value: { ...request, pulled: plan == null ? null : pulledFor(plan) },
      };
    },

    async listCentres() {
      await delay(latencyMs);
      return failWith != null ? { ok: false, error: failWith } : { ok: true, value: MOCK_CENTRES };
    },

    async listResponsibleEmployees() {
      await delay(latencyMs);
      return failWith != null
        ? { ok: false, error: failWith }
        : { ok: true, value: MOCK_RESPONSIBLE_EMPLOYEES };
    },

    async listNomineeOptions() {
      await delay(latencyMs);
      return failWith != null ? { ok: false, error: failWith } : { ok: true, value: MOCK_NOMINEES };
    },

    async uploadBrochure(file: File) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      if (file.size === 0) {
        return { ok: false, error: { status: 400, message: 'file-required' } };
      }
      // J-01's document rule, re-checked as the server re-checks it.
      const issue = brochureFileIssue(file);
      if (issue != null) {
        return {
          ok: false,
          error: {
            status: 422,
            message: issue === 'size' ? 'The file is larger than 1 MB.' : 'Not an accepted format.',
          },
        };
      }
      const attachmentId = `att-brochure-${String(brochures.size + 1).padStart(3, '0')}`;
      brochures.set(attachmentId, file.name);
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

    async createRequest(input: CreateCentreRequestInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      // The same per-type gates the UI applies, applied again server-side —
      // and the brochure must be a document this server actually stored.
      if (validateCentreRequest(input).length > 0 || !brochures.has(input.attachmentId ?? '')) {
        return { ok: false, error: { status: 400, message: 'required-field-missing' } };
      }

      counter += 1;
      // The legacy single value reads back as a one-item list, so an old
      // payload behaves exactly as it used to.
      const named = nomineesOf(input);
      const title = isProgramLike(input.requestType)
        ? (input.programName ?? '')
        : (input.consultationTopic ?? '');
      // The reference is issued here, by the server — never by the page.
      const created: AssignmentRequestSummaryDto = {
        requestId: `asg-${String(counter).padStart(3, '0')}`,
        reference: `EH-ASG-2026-${String(1000 + counter).slice(1)}`,
        // Notion «Assignment Matrix» routing (form 3's Speaker routing is not
        // built — see `centreRequestForm.types.ts`).
        serviceType: serviceTypeFor(input.requestType),
        programName: { ar: title, en: title },
        requiredHeadcount: headcountOf(input),
        // J-16/F5 — a named expert skips matching on their own slot. Only when
        // every slot is named does the whole request bypass matching; a
        // partly-named request still has slots to match.
        status: named.length > 0 && named.length >= headcountOf(input) ? 'nominated' : 'matching',
        createdAt: now,
        createdByName: input.responsibleEmployee,
      };
      requests = [created, ...requests];
      return { ok: true, value: created };
    },

    /* ── J-17 ───────────────────────────────────────────────────────────── */

    async getMatching(requestId: string) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const request = requests.find((candidate) => candidate.requestId === requestId);
      if (request == null) {
        return { ok: false, error: { status: 404, message: 'Assignment request not found.' } };
      }
      const pool = pools.get(requestId) ?? emptyPool(request.requiredHeadcount);
      return {
        ok: true,
        value: {
          pool,
          // ⚠️ MOCK viewer. In production these are two different people
          // (Trainer Management staff, and the requesting party); the mock
          // grants both so one session can walk the whole journey.
          viewer: { canMatch: viewer?.canMatch ?? true, canApprove: viewer?.canApprove ?? true },
        },
      };
    },

    async runMatching(requestId: string) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const request = requests.find((candidate) => candidate.requestId === requestId);
      const plan = request == null ? null : planForRequest(request);
      if (request == null || plan == null) {
        return { ok: false, error: { status: 404, message: 'Request or plan not found.' } };
      }

      const excluded: ExcludedCandidateDto[] = [];
      const ranked: MatchCandidateDto[] = [];
      for (const candidate of MOCK_CANDIDATES) {
        const reasons = exclusionsFor(candidate, plan);
        if (reasons.length > 0) {
          // F1/AC-2 — excluded ENTIRELY. Not ranked last; not ranked at all.
          excluded.push({
            trainerId: candidate.trainerId,
            name: candidate.name,
            reasons,
          });
          continue;
        }
        ranked.push(toCandidate(candidate, plan));
      }

      ranked.sort(
        (a, b) =>
          b.totalScore - a.totalScore ||
          // ⚠️ `DM-GAP-05` — the tie-break is unapproved; evaluation then name.
          (b.evaluationOverall ?? 0) - (a.evaluationOverall ?? 0) ||
          a.name.localeCompare(b.name)
      );

      const value: MatchingRunDto = {
        model: MOCK_MATCHING_MODEL,
        ranked,
        excluded,
        // F1/AC-4 — ONE cycle, one pool, sized to the headcount. Not N cycles.
        requiredPoolSize: poolSizeFor(request.requiredHeadcount),
      };
      return { ok: true, value };
    },

    async searchCandidates(requestId: string, query: string) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const request = requests.find((candidate) => candidate.requestId === requestId);
      const plan = request == null ? null : planForRequest(request);
      if (request == null || plan == null) {
        return { ok: false, error: { status: 404, message: 'Request or plan not found.' } };
      }
      const term = query.trim().toLowerCase();
      // F2/AC-1 — the manual path searches the base directly. It deliberately
      // does NOT pre-filter by the exclusionary criteria: staff may look at
      // anyone. F3/AC-3 is what stops an excluded trainer being *presented*.
      const items = MOCK_CANDIDATES.filter(
        (candidate) => term === '' || candidate.name.toLowerCase().includes(term)
      ).map((candidate) => toCandidate(candidate, plan));
      return { ok: true, value: items };
    },

    async sendPool(requestId: string, input: SendPoolInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const request = requests.find((candidate) => candidate.requestId === requestId);
      const plan = request == null ? null : planForRequest(request);
      if (request == null || plan == null) {
        return { ok: false, error: { status: 404, message: 'Request or plan not found.' } };
      }

      // F2/AC-2 — exactly three per slot, on either path.
      if (validatePool(input.trainerIds, request.requiredHeadcount).length > 0) {
        return {
          ok: false,
          error: {
            status: 400,
            message: `Pool must contain exactly ${poolSizeFor(request.requiredHeadcount)} candidates.`,
          },
        };
      }

      // F3/AC-3 — the exclusions are enforced before presentation "regardless of
      // which matching path was used". A manually-picked excluded trainer is
      // refused here, which is the only place that can be guaranteed.
      const members: PoolMemberDto[] = [];
      for (const trainerId of input.trainerIds) {
        const seed = MOCK_CANDIDATES.find((candidate) => candidate.trainerId === trainerId);
        if (seed == null) {
          return { ok: false, error: { status: 400, message: `Unknown candidate ${trainerId}.` } };
        }
        const reasons = exclusionsFor(seed, plan);
        if (reasons.length > 0) {
          return {
            ok: false,
            error: {
              status: 409,
              message: `Candidate ${trainerId} fails: ${reasons.join(', ')}.`,
            },
          };
        }
        members.push({
          trainerId: seed.trainerId,
          name: seed.name,
          price: {
            inClass: seed.priceInClass,
            online: seed.priceOnline,
            currency: 'SAR',
            agreementReference: seed.agreementReference,
          },
          decision: 'pending',
          preferenceRank: null,
        });
      }

      // F3/AC-1 — one batch. The whole pool changes state together.
      const pool: CandidatePoolDto = {
        status: 'sent',
        members,
        sentAt: now,
        requiredHeadcount: request.requiredHeadcount,
      };
      pools.set(requestId, pool);
      return { ok: true, value: pool };
    },

    async decidePool(requestId: string, input: PoolDecisionInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const request = requests.find((candidate) => candidate.requestId === requestId);
      const pool = pools.get(requestId);
      if (request == null || pool == null || pool.status !== 'sent') {
        return { ok: false, error: { status: 409, message: 'No pool awaiting a decision.' } };
      }
      if (validatePoolDecision(input, pool.members).length > 0) {
        return { ok: false, error: { status: 400, message: 'Invalid pool decision.' } };
      }

      const decisionById = new Map(
        input.decisions.map((entry) => [entry.trainerId, entry.decision])
      );
      const members: PoolMemberDto[] = pool.members.map((member) => {
        const decision = decisionById.get(member.trainerId) ?? 'rejected';
        const rankIndex = input.preferenceOrder.indexOf(member.trainerId);
        return {
          ...member,
          decision,
          // F4/AC-2 — 1-based preference among the approved.
          preferenceRank: decision === 'approved' && rankIndex >= 0 ? rankIndex + 1 : null,
        };
      });

      const decided: CandidatePoolDto = { ...pool, status: 'decided', members };
      pools.set(requestId, decided);

      // F4/AC-3 vs AC-4 — zero approvals restarts the cycle (J-19); at least one
      // approval moves the top-ranked forward per slot (J-18). The request's
      // status is the visible half of that decision.
      const anyApproved = members.some((member) => member.decision === 'approved');
      requests = requests.map((candidate) =>
        candidate.requestId === requestId
          ? { ...candidate, status: anyApproved ? 'nominated' : 'matching' }
          : candidate
      );
      if (!anyApproved) {
        // The cycle restarts: the pool is cleared so a new one can be built.
        pools.set(requestId, emptyPool(request.requiredHeadcount));
        return { ok: true, value: pools.get(requestId) as CandidatePoolDto };
      }
      return { ok: true, value: decided };
    },
  };
}

export { MOCK_NOW };
