import type { ExpertHubApiError } from '../../shared/services/apiClient';
import type { EngagementStatus } from '../../contracts/engagementStatus';
import servedDetail from '../../contracts/fixtures/me.engagement-detail.json';
import servedTerminated from '../../contracts/fixtures/me.engagement-detail.terminated.json';
import type { RequestDetailsDto } from '../engagements/offer.types';
import type { ExecutionService } from './executionService';
import type { EngagementDetailDto } from './engagementDetail.types';

/**
 * Versioned **mock** provider for J-21.
 *
 * Every record is the real API response
 * (`contracts/fixtures/me.engagement-detail.json`, `.terminated.json`) with only
 * its values changed, so the mock cannot drift into a shape the server never
 * serves — including the named gaps: enrolment and attendance stay
 * `available: false` (`Q20`), evaluations `available: false` (`Q29`), and
 * `meetingUrl` stays `null`.
 *
 * The clock is the other point of this mock: **F5/AC-1 makes the status a
 * function of the schedule**, so `statusFor` derives it the way
 * `OfferService.Lifecycle` does and nothing can set it. A test moves `now`.
 *
 * - `eng-1` — **upcoming**, in person.
 * - `eng-2` — **in progress**, online, with the dates changed in FAST (F1/AC-3).
 * - `eng-3` — **completed**.
 * - `eng-4` — **cancelled** by FAST (J-22/F3), seeded already terminated: the
 *   platform has no path to cancel a plan (F3/AC-2), so nothing here produced it.
 * - `eng-5` — **withdrawn** by staff (J-22/F2), the served terminated record.
 *
 * ⚠️ MOCK DATA (clearly labelled). ⚠️ Deterministic clock.
 */

/** ⚠️ MOCK — the fixed "today" every status is derived against. */
const MOCK_NOW = '2026-08-20T09:00:00Z';

const DAY_MS = 24 * 60 * 60 * 1000;

/** The served shapes. JSON widens the string unions, so they are narrowed once here. */
const SERVED = servedDetail as EngagementDetailDto;
const SERVED_TERMINATED = servedTerminated as EngagementDetailDto;
const SERVED_DETAILS = servedDetail.details as RequestDetailsDto;

/**
 * **F5/AC-1, as the server computes it.** Purely the schedule: before the start
 * ⇒ upcoming; past the end ⇒ completed; otherwise in progress. A date-only end
 * (midnight) covers that whole day, exactly as `OfferService.Lifecycle` reads it.
 */
function statusFor(now: string, dateFrom: string | null, dateTo: string | null): EngagementStatus {
  const today = new Date(now).getTime();
  if (dateFrom == null || dateTo == null || today < new Date(dateFrom).getTime()) {
    return 'upcoming';
  }
  const to = new Date(dateTo).getTime();
  const end = to % DAY_MS === 0 ? to + DAY_MS : to;
  return today >= end ? 'completed' : 'in_progress';
}

function seed(
  engagementId: string,
  details: Partial<RequestDetailsDto>,
  rest: Partial<EngagementDetailDto> = {}
): EngagementDetailDto {
  return {
    ...SERVED,
    engagementId,
    confirmedAt: '2026-08-15T09:00:00Z',
    details: { ...SERVED_DETAILS, ...details },
    ...rest,
  };
}

/** ⚠️ MOCK seeds. */
const SEEDS: readonly EngagementDetailDto[] = [
  seed('eng-1', {
    reference: 'ASR-2026-0018',
    dateFrom: '2026-10-05T00:00:00Z',
    dateTo: '2026-10-08T00:00:00Z',
  }),
  seed(
    'eng-2',
    {
      reference: 'ASR-2026-0021',
      dateFrom: '2026-08-18T00:00:00Z',
      dateTo: '2026-08-25T00:00:00Z',
      deliveryMechanism: 'online',
    },
    // F1/AC-3 — FAST moved the dates, and the trainer should see that it did.
    { scheduleChangedAt: '2026-08-17T11:00:00Z' }
  ),
  seed('eng-3', {
    reference: 'ASR-2026-0009',
    dateFrom: '2026-06-01T00:00:00Z',
    dateTo: '2026-06-04T00:00:00Z',
  }),
  seed(
    'eng-4',
    {
      reference: 'ASR-2026-0027',
      dateFrom: '2026-09-14T00:00:00Z',
      dateTo: '2026-09-17T00:00:00Z',
    },
    {
      termination: {
        kind: 'cancelled',
        actor: 'fast',
        // ⚠️ FAST's own reason and code — this project holds no such list.
        reason: 'أُلغيت الخطة لعدم اكتمال النصاب.',
        note: null,
        fastCancelReasonCode: 'PCR-014',
        occurredAt: '2026-08-19T13:00:00Z',
      },
    }
  ),
  seed(
    'eng-5',
    {
      reference: 'ASR-2026-0030',
      dateFrom: '2026-09-18T00:00:00Z',
      dateTo: '2026-09-19T00:00:00Z',
    },
    { termination: SERVED_TERMINATED.termination }
  ),
];

export interface MockExecutionProviderOptions {
  readonly latencyMs?: number;
  readonly failWith?: ExpertHubApiError;
  /** Move "today" to walk an engagement across F5/AC-1's boundary. */
  readonly now?: string;
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockExecutionProvider(
  options: MockExecutionProviderOptions = {}
): ExecutionService {
  const { latencyMs = 300, failWith, now = MOCK_NOW } = options;

  return {
    async getEngagement(engagementId: string) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const found = SEEDS.find((candidate) => candidate.engagementId === engagementId);
      if (found == null) {
        return { ok: false, error: { status: 404, message: 'Engagement not found.' } };
      }
      return {
        ok: true,
        value: {
          ...found,
          // F5/AC-1 — the schedule decides… unless J-22 ended it early, in which
          // case the termination stands.
          status:
            found.termination?.kind ??
            statusFor(now, found.details?.dateFrom ?? null, found.details?.dateTo ?? null),
        },
      };
    },
  };
}

export { MOCK_NOW, statusFor };
