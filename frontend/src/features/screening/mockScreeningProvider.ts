import type { Result } from '@/types';
import { buildSlaInstance, SLA_IDS } from '../../shared/sla/mockSlaMatrix';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import type { ApplicationService } from '../applications/application.types';
import { MOCK_INBOX } from '../internal/mockInternalProvider';
import {
  MOCK_EVALUATION_MODEL_VERSION,
  MOCK_SCORE_THRESHOLDS,
  buildMockCriteria,
  weightedTotal,
} from './mockEvaluationModel';
import type { ScreeningService } from './screeningService';
import type {
  CommitteeMemberDto,
  QualitativeInsightDto,
  ScreeningAttachmentDto,
  ScreeningDecisionInput,
  ScreeningDecisionResultDto,
  ScreeningDetailDto,
  ScreeningSectionDto,
  ScreeningSlaDto,
  ServiceScoreDto,
} from './screening.types';

/**
 * Versioned **mock** provider for EH-INT-03 (Screening & Initial Decision —
 * J-05/J-08). Simulates the *server's* responsibilities: score computation per
 * the evaluation model, the separate AI qualitative pass, SLA state, and
 * recording a decision (including the auto-rejection of services the manager did
 * not accept, J-05/F5/AC-2). Swapping this for the HTTP provider changes no UI
 * logic.
 *
 * ⚠️ MOCK DATA (clearly labelled): applicant answers, AI text, and committee
 * names are representative development data. Scores derive from the equally
 * mock evaluation model (`mockEvaluationModel.ts`, `DM-GAP-02` open).
 */

/** Deterministic per-application raw criterion results (0–100, 5 criteria). */
const MOCK_RAW_SCORES: Readonly<Record<string, readonly number[]>> = {
  'app-3001': [90, 80, 85, 75, 70],
  'app-3002': [70, 55, 65, 60, 80],
  'app-3003': [85, 90, 80, 70, 75],
  'app-3004': [60, 50, 55, 45, 65],
  'app-3005': [88, 82, 90, 86, 78],
  'app-3006': [72, 68, 74, 70, 66],
  'app-3007': [80, 76, 84, 72, 70],
  'app-3008': [78, 70, 76, 82, 74],
  'app-3009': [92, 88, 90, 84, 80],
  'app-3010': [86, 80, 88, 82, 76],
  'app-3011': [74, 70, 72, 68, 72],
  'app-3012': [66, 58, 62, 56, 70],
  'app-3013': [52, 44, 48, 40, 60],
  'app-3014': [82, 78, 80, 74, 72],
};

const DEFAULT_RAW_SCORES = [75, 70, 72, 68, 70] as const;

/** Interview committee pool (J-05/F5/AC-3) — staff selectable per service. */
export const MOCK_COMMITTEE_POOL: readonly CommitteeMemberDto[] = [
  {
    id: 'stf-01',
    name: 'د. أحمد الزهراني',
    roleTitle: { ar: 'مدير إدارة المدربين', en: 'Trainer Management Manager' },
  },
  {
    id: 'stf-02',
    name: 'أ. لطيفة العمري',
    roleTitle: { ar: 'أخصائي أول تدريب', en: 'Senior Training Specialist' },
  },
  {
    id: 'stf-03',
    name: 'د. بندر الرشيد',
    roleTitle: { ar: 'مستشار المحتوى التدريبي', en: 'Training Content Advisor' },
  },
  {
    id: 'stf-04',
    name: 'أ. جواهر السالم',
    roleTitle: { ar: 'منسّق البرامج', en: 'Programs Coordinator' },
  },
];

const MOCK_SECTIONS: readonly ScreeningSectionDto[] = [
  {
    id: 'personal',
    title: { ar: 'المعلومات الأساسية', en: 'Basic information' },
    fields: [
      { id: 'fullName', label: { ar: 'الاسم الكامل', en: 'Full name' }, value: '—' },
      { id: 'email', label: { ar: 'البريد الإلكتروني', en: 'Email' }, value: '—' },
      { id: 'phone', label: { ar: 'رقم الجوال', en: 'Mobile number' }, value: '+966500000000' },
      { id: 'city', label: { ar: 'مدينة الإقامة', en: 'City of residence' }, value: 'الرياض' },
    ],
  },
  {
    id: 'education',
    title: { ar: 'المؤهلات العلمية', en: 'Educational qualifications' },
    fields: [
      {
        id: 'degree',
        label: { ar: 'أعلى مؤهل', en: 'Highest qualification' },
        value: 'دكتوراه في المالية',
      },
      {
        id: 'university',
        label: { ar: 'الجهة المانحة', en: 'Awarding institution' },
        value: 'جامعة الملك سعود',
      },
      { id: 'gradYear', label: { ar: 'سنة التخرج', en: 'Graduation year' }, value: '2014' },
    ],
  },
  {
    id: 'certifications',
    title: { ar: 'الشهادات المهنية', en: 'Professional certifications' },
    fields: [
      {
        id: 'certs',
        label: { ar: 'الشهادات', en: 'Certifications' },
        value: 'CFA · CMA · شهادة مدرب معتمد (CPT)',
      },
      {
        id: 'memberships',
        label: { ar: 'العضويات', en: 'Memberships' },
        value: 'الهيئة السعودية للمحاسبين القانونيين',
      },
    ],
  },
  {
    id: 'experience',
    title: { ar: 'الخبرة العملية', en: 'Practical experience' },
    fields: [
      { id: 'years', label: { ar: 'سنوات الخبرة', en: 'Years of experience' }, value: '12' },
      {
        id: 'currentRole',
        label: { ar: 'المسمى الحالي', en: 'Current role' },
        value: 'مدير إدارة المخاطر',
      },
      {
        id: 'summary',
        label: { ar: 'ملخص الخبرة', en: 'Experience summary' },
        value:
          'خبرة تمتد لاثني عشر عامًا في إدارة المخاطر المالية والامتثال داخل القطاع المصرفي، مع قيادة فرق متعددة التخصصات وبناء أطر حوكمة معتمدة.',
        qualitative: true,
      },
    ],
  },
  {
    id: 'training-content',
    title: { ar: 'الخبرة التدريبية والمحتوى', en: 'Training experience & content' },
    fields: [
      {
        id: 'programs',
        label: { ar: 'برامج سبق تقديمها', en: 'Programs previously delivered' },
        value: 'إدارة المخاطر التشغيلية · التحليل المالي المتقدم · حوكمة الالتزام',
      },
      {
        id: 'approach',
        label: { ar: 'منهجية التدريب', en: 'Training approach' },
        value:
          'أعتمد على التعلم التطبيقي عبر دراسات حالة من السوق المحلي، مع تمارين جماعية وتقييم مستمر يقيس أثر التدريب على أداء المشاركين.',
        qualitative: true,
      },
      {
        id: 'materials',
        label: { ar: 'مواد تدريبية جاهزة', en: 'Ready training material' },
        value: 'نعم',
      },
    ],
  },
  {
    id: 'availability',
    title: { ar: 'الجاهزية والإتاحة', en: 'Availability & readiness' },
    fields: [
      { id: 'mode', label: { ar: 'نمط التقديم', en: 'Delivery mode' }, value: 'حضوري وعن بُعد' },
      {
        id: 'languages',
        label: { ar: 'لغات التقديم', en: 'Delivery languages' },
        value: 'العربية · الإنجليزية',
      },
      {
        id: 'notice',
        label: { ar: 'مدة الإشعار المطلوبة', en: 'Required notice period' },
        value: 'أسبوعان',
      },
    ],
  },
];

const MOCK_ATTACHMENTS: readonly ScreeningAttachmentDto[] = [
  {
    id: 'att-cv',
    name: 'CV.pdf',
    type: { ar: 'السيرة الذاتية', en: 'Curriculum vitae' },
    format: 'pdf',
    sizeKb: 820,
    previewUrl: null,
  },
  {
    id: 'att-degree',
    name: 'PhD-Certificate.pdf',
    type: { ar: 'الشهادة العلمية', en: 'Academic certificate' },
    format: 'pdf',
    sizeKb: 640,
    previewUrl: null,
  },
  {
    id: 'att-cpt',
    name: 'CPT.pdf',
    type: { ar: 'شهادة مهنية', en: 'Professional certificate' },
    format: 'pdf',
    sizeKb: 410,
    previewUrl: null,
  },
];

/**
 * ⚠️ MOCK AI OUTPUT — assistive text only. Never contributes to the score
 * (`BR-0202`); the shape keeps it on its own field so it structurally cannot.
 */
const MOCK_INSIGHT: QualitativeInsightDto = {
  summary: {
    ar: 'تُظهر الإجابات النوعية خبرة تطبيقية واضحة في القطاع المالي ومنهجية تدريب قائمة على دراسات الحالة، مع تركيز على قياس الأثر.',
    en: 'The qualitative answers show applied experience in the financial sector and a case-study-based training approach with a focus on measuring impact.',
  },
  strengths: [
    { ar: 'ربط المحتوى التدريبي بالسوق المحلي', en: 'Links training content to the local market' },
    { ar: 'وضوح منهجية قياس أثر التدريب', en: 'Clear approach to measuring training impact' },
  ],
  considerations: [
    {
      ar: 'لم تُذكر تجارب تدريب عن بُعد بشكل صريح',
      en: 'Remote delivery experience is not stated explicitly',
    },
  ],
  analyzedFieldIds: ['summary', 'approach'],
  generatedAt: '2026-07-25T09:12:00Z',
  modelVersion: 'mock-insight.1',
};

/**
 * The screening countdown, from the **central** matrix (`BR-0705`).
 *
 * Returns `null` today, because `SLA-0202` has no duration — J-05 never states
 * one. This used to be a local `SCREENING_SLA_DAYS = 5`, a number no document
 * contains, rendered as though it were policy. Set a duration on the deadline
 * console and the badge appears here with no further change.
 */
function buildSla(submittedAt: string, now: number): ScreeningSlaDto | null {
  return buildSlaInstance(SLA_IDS.screeningDecision, submittedAt, new Date(now).toISOString());
}

function buildScores(services: readonly ApplicationService[], id: string): ServiceScoreDto[] {
  const raw = MOCK_RAW_SCORES[id] ?? DEFAULT_RAW_SCORES;
  return services.map((service) => {
    const criteria = buildMockCriteria(service, raw);
    return {
      service,
      score: weightedTotal(criteria),
      threshold: MOCK_SCORE_THRESHOLDS[service],
      criteria,
      modelVersion: MOCK_EVALUATION_MODEL_VERSION,
    };
  });
}

function withApplicantValues(
  sections: readonly ScreeningSectionDto[],
  name: string,
  email: string
): readonly ScreeningSectionDto[] {
  return sections.map((section) =>
    section.id !== 'personal'
      ? section
      : {
          ...section,
          fields: section.fields.map((field) =>
            field.id === 'fullName'
              ? { ...field, value: name }
              : field.id === 'email'
                ? { ...field, value: email }
                : field
          ),
        }
  );
}

/** Statuses at which an application is still awaiting its screening decision. */
const PENDING_STATUSES: ReadonlySet<string> = new Set(['submitted', 'under-review']);

export interface MockScreeningProviderOptions {
  readonly latencyMs?: number;
  readonly failWith?: ExpertHubApiError;
  /** Fixed "now" so SLA output is deterministic in tests. */
  readonly now?: number;
  /** Overrides the resolved detail entirely (test seam). */
  readonly seed?: ScreeningDetailDto;
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockScreeningProvider(
  options: MockScreeningProviderOptions = {}
): ScreeningService {
  const {
    latencyMs = 300,
    failWith,
    now = new Date('2026-07-27T09:00:00Z').getTime(),
    seed,
  } = options;

  return {
    async getScreeningDetail(
      applicationId: string
    ): Promise<Result<ScreeningDetailDto, ExpertHubApiError>> {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      if (seed != null) {
        return { ok: true, value: seed };
      }
      const row = MOCK_INBOX.find((item) => item.id === applicationId);
      if (row == null) {
        return { ok: false, error: { status: 404, message: 'Application not found' } };
      }
      const email = `${row.id}@example.sa`;
      const services = row.services;
      return {
        ok: true,
        value: {
          id: row.id,
          reference: row.reference,
          applicantName: row.applicantName,
          applicantEmail: email,
          source: row.id.endsWith('2') ? 'internal-nomination' : 'self-service',
          services,
          status: row.status,
          submittedAt: row.submittedAt,
          sla: buildSla(row.submittedAt, now),
          scores: buildScores(services, row.id),
          insight: MOCK_INSIGHT,
          sections: withApplicantValues(MOCK_SECTIONS, row.applicantName, email),
          attachments: MOCK_ATTACHMENTS,
          committeePool: MOCK_COMMITTEE_POOL,
          decisionPending: PENDING_STATUSES.has(row.status),
          decision: null,
        },
      };
    },

    async submitDecision(
      applicationId: string,
      decision: ScreeningDecisionInput
    ): Promise<Result<ScreeningDecisionResultDto, ExpertHubApiError>> {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const row = MOCK_INBOX.find((item) => item.id === applicationId);
      if (row == null) {
        return { ok: false, error: { status: 404, message: 'Application not found' } };
      }
      const decidedAt = new Date(now).toISOString();

      if (decision.kind === 'reject') {
        // J-05/F5/AC-7: rejection is a whole-application decision.
        return {
          ok: true,
          value: {
            applicationId,
            status: 'rejected',
            acceptedServices: [],
            autoRejectedServices: row.services,
            exemptedServices: [],
            decidedAt,
          },
        };
      }

      const accepted = decision.services.map((item) => item.service);
      // J-05/F5/AC-2: every requested service not accepted is auto-rejected.
      const autoRejected = row.services.filter((service) => !accepted.includes(service));
      const exempted = decision.services
        .filter((item) => item.path === 'exemption')
        .map((item) => item.service);
      // J-08/F2: exemption-only decisions skip J-06 and go straight to committee.
      const allExempted = exempted.length === accepted.length;

      return {
        ok: true,
        value: {
          applicationId,
          status: allExempted ? 'approval-in-progress' : 'interview-scheduled',
          acceptedServices: accepted,
          autoRejectedServices: autoRejected,
          exemptedServices: exempted,
          decidedAt,
        },
      };
    },
  };
}
