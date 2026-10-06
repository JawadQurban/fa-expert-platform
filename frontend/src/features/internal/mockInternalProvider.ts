import type { Result } from '@/types';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import type { ApplicationStatus } from '../applications/application.types';
import type {
  DashboardDto,
  DashboardMetricDto,
  InboxApplicationDto,
  InboxListDto,
  InboxQuery,
} from './internal.types';
import type { InternalService } from './internalService';

/**
 * Versioned **mock** provider for the internal/staff side — EH-INT-01 (Dashboard)
 * + EH-INT-02 (Application Inbox). Simulates the *server's* responsibilities:
 * role-scoped listing, search, status filter, paging, and the derived
 * operational counts the dashboard shows. Swapping this for the HTTP provider
 * changes no UI logic.
 *
 * ⚠️ MOCK DATA (clearly labelled): representative multi-applicant pipeline. The
 * dashboard "metrics" are **derived counts** over this data, not the undefined
 * management KPI set (`DM-GAP-09`/`G13`).
 */

/** Deterministic staff inbox — varied applicants across the pipeline (fixed dates). */
export const MOCK_INBOX: readonly InboxApplicationDto[] = [
  {
    id: 'app-3001',
    reference: 'EH-2026-00212',
    applicantName: 'د. سارة العتيبي',
    services: ['trainer', 'consultant'],
    status: 'submitted',
    submittedAt: '2026-07-25T09:00:00Z',
    updatedAt: '2026-07-25T09:00:00Z',
  },
  {
    id: 'app-3002',
    reference: 'EH-2026-00211',
    applicantName: 'أ. خالد المطيري',
    services: ['content-developer'],
    status: 'submitted',
    submittedAt: '2026-07-24T11:30:00Z',
    updatedAt: '2026-07-24T11:30:00Z',
  },
  {
    id: 'app-3003',
    reference: 'EH-2026-00208',
    applicantName: 'د. نورة القحطاني',
    services: ['consultant'],
    status: 'under-review',
    submittedAt: '2026-07-22T08:15:00Z',
    updatedAt: '2026-07-24T10:00:00Z',
  },
  {
    id: 'app-3004',
    reference: 'EH-2026-00205',
    applicantName: 'أ. عبدالله الشهري',
    services: ['trainer'],
    status: 'under-review',
    submittedAt: '2026-07-21T13:00:00Z',
    updatedAt: '2026-07-23T09:20:00Z',
  },
  {
    id: 'app-3005',
    reference: 'EH-2026-00201',
    applicantName: 'د. ريم الدوسري',
    services: ['trainer', 'content-developer'],
    status: 'interview-scheduled',
    submittedAt: '2026-07-18T10:00:00Z',
    updatedAt: '2026-07-22T14:00:00Z',
  },
  {
    id: 'app-3006',
    reference: 'EH-2026-00198',
    applicantName: 'أ. فهد الغامدي',
    services: ['question-writer'],
    status: 'interview-scheduled',
    submittedAt: '2026-07-17T09:30:00Z',
    updatedAt: '2026-07-21T11:00:00Z',
  },
  {
    id: 'app-3007',
    reference: 'EH-2026-00194',
    applicantName: 'د. منى الحربي',
    services: ['consultant'],
    status: 'interview-completed',
    submittedAt: '2026-07-14T08:00:00Z',
    updatedAt: '2026-07-20T15:30:00Z',
  },
  {
    id: 'app-3008',
    reference: 'EH-2026-00190',
    applicantName: 'أ. ماجد السبيعي',
    services: ['content-developer'],
    status: 'approval-in-progress',
    submittedAt: '2026-07-10T10:00:00Z',
    updatedAt: '2026-07-19T09:00:00Z',
  },
  {
    id: 'app-3009',
    reference: 'EH-2026-00187',
    applicantName: 'د. هند الزهراني',
    services: ['trainer'],
    status: 'approval-in-progress',
    submittedAt: '2026-07-08T12:00:00Z',
    updatedAt: '2026-07-18T16:00:00Z',
  },
  {
    id: 'app-3010',
    reference: 'EH-2026-00180',
    applicantName: 'أ. طلال العنزي',
    services: ['trainer'],
    status: 'approved',
    submittedAt: '2026-07-01T09:00:00Z',
    updatedAt: '2026-07-15T10:00:00Z',
  },
  {
    id: 'app-3011',
    reference: 'EH-2026-00176',
    applicantName: 'د. عبير الشمري',
    services: ['consultant', 'trainer'],
    status: 'interview-scheduled',
    submittedAt: '2026-07-16T09:00:00Z',
    updatedAt: '2026-07-20T09:00:00Z',
  },
  {
    id: 'app-3012',
    reference: 'EH-2026-00171',
    applicantName: 'أ. سلطان البقمي',
    services: ['question-writer'],
    status: 'submitted',
    submittedAt: '2026-07-23T14:00:00Z',
    updatedAt: '2026-07-23T14:00:00Z',
  },
  {
    id: 'app-3013',
    reference: 'EH-2026-00166',
    applicantName: 'د. لمياء الفيفي',
    services: ['content-developer'],
    status: 'rejected',
    submittedAt: '2026-06-28T09:00:00Z',
    updatedAt: '2026-07-12T11:00:00Z',
  },
  {
    id: 'app-3014',
    reference: 'EH-2026-00160',
    applicantName: 'أ. راكان الحارثي',
    services: ['consultant'],
    status: 'under-review',
    submittedAt: '2026-07-20T08:00:00Z',
    updatedAt: '2026-07-24T08:00:00Z',
  },
];

/** Non-decided statuses count as "open". */
const OPEN_STATUSES: ReadonlySet<string> = new Set([
  'submitted',
  'under-review',
  'interview-scheduled',
  'interview-completed',
  'approval-in-progress',
  'agreement-pending',
]);

export interface MockInternalProviderOptions {
  readonly seed?: readonly InboxApplicationDto[];
  readonly latencyMs?: number;
  readonly failWith?: ExpertHubApiError;
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

function countByStatus(items: readonly InboxApplicationDto[], status: ApplicationStatus): number {
  return items.filter((item) => item.status === status).length;
}

function matches(item: InboxApplicationDto, query: InboxQuery): boolean {
  if (query.status != null && query.status !== 'all' && item.status !== query.status) {
    return false;
  }
  const search = query.search?.trim().toLowerCase() ?? '';
  if (search !== '') {
    const haystack = `${item.reference} ${item.applicantName}`.toLowerCase();
    if (!haystack.includes(search)) {
      return false;
    }
  }
  return true;
}

export function createMockInternalProvider(
  options: MockInternalProviderOptions = {}
): InternalService {
  const { seed = MOCK_INBOX, latencyMs = 300, failWith } = options;

  return {
    async getDashboard(): Promise<Result<DashboardDto, ExpertHubApiError>> {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const metrics: DashboardMetricDto[] = [
        {
          id: 'awaiting-screening',
          value: countByStatus(seed, 'submitted'),
          target: { queue: 'applications', status: 'submitted' },
        },
        {
          id: 'in-screening',
          value: countByStatus(seed, 'under-review'),
          target: { queue: 'applications', status: 'under-review' },
        },
        {
          id: 'interviews',
          value: countByStatus(seed, 'interview-scheduled'),
          target: { queue: 'applications', status: 'interview-scheduled' },
        },
        {
          id: 'awaiting-decision',
          value: countByStatus(seed, 'approval-in-progress'),
          target: { queue: 'applications', status: 'approval-in-progress' },
        },
        {
          // ⚠️ MOCK — CAP-05 owns the submission queue and this provider has
          // no seed for it, so the tile shows zero rather than a made-up count.
          id: 'materials-awaiting-approval',
          value: 0,
          target: { queue: 'submissions' },
        },
      ];
      const recent = [...seed]
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
        .slice(0, 5);
      const totalOpen = seed.filter((item) => OPEN_STATUSES.has(item.status)).length;
      /*
       * ⚠️ MOCK analytics. `submissionDelta` is null on purpose: a demo
       * dataset has no earlier week to compare against, and the dashboard has
       * to render that case before it renders a cheerful figure.
       */
      return {
        ok: true,
        value: {
          metrics,
          recent,
          totalOpen,
          submissionDelta: null,
          distribution: [
            { status: 'under-review', count: 4, percent: 50 },
            { status: 'interview-scheduled', count: 2, percent: 25 },
            { status: 'awaiting-committee', count: 2, percent: 25 },
          ],
          sla: [
            {
              slaId: 'SLA-0201',
              nameAr: 'اختيار مقدّم الطلب لموعد المقابلة',
              nameEn: 'Applicant selects an interview slot',
              targetDays: 3,
              targetStatus: 'fixed',
              // Not measured: the platform records the deadline, not the choice.
              actualDays: null,
              breaches: 1,
              measured: 0,
            },
            {
              slaId: 'SLA-0202',
              nameAr: 'قرار الفرز',
              nameEn: 'Screening decision',
              // Undefined target with a real actual — the pair the table has
              // to render without implying the stage is instant.
              targetDays: null,
              targetStatus: 'undefined',
              actualDays: 3.2,
              breaches: 0,
              measured: 6,
            },
          ],
        },
      };
    },

    async getInbox(query: InboxQuery): Promise<Result<InboxListDto, ExpertHubApiError>> {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const filtered = seed.filter((item) => matches(item, query));
      const pageCount = Math.max(1, Math.ceil(filtered.length / query.pageSize));
      const page = Math.min(Math.max(1, query.page), pageCount);
      const start = (page - 1) * query.pageSize;
      const totalOpen = seed.filter((item) => OPEN_STATUSES.has(item.status)).length;
      return {
        ok: true,
        value: {
          items: filtered.slice(start, start + query.pageSize),
          totalCount: filtered.length,
          page,
          pageSize: query.pageSize,
          pageCount,
          totalOpen,
        },
      };
    },
  };
}
