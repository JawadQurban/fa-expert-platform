import type { Result } from '@/types';
import type { ExpertHubApiError } from '../../shared/services/apiClient';
import type { PortalHomeDto } from './home.types';
import type { HomeService } from './homeService';

/**
 * Versioned **mock** provider for `CAP-09` personal home (EH-TP-01). Stands in for
 * the future Expert Hub metrics/summary API — the real endpoint aggregates the
 * live-read personal figures (`BR-0904`) + the persisted calculated rating
 * (`02D`) server-side; here they're representative demo values consistent with
 * the profile mock (`خبير تجريبي`, overall 4.5, 3 programs).
 *
 * ⚠️ MOCK DATA (clearly labelled). Notification content stands in for the
 * undefined notification matrix (`DM-GAP-08`).
 */
export const MOCK_HOME: PortalHomeDto = {
  displayName: 'خبير تجريبي',
  classification: 'expert',
  applications: { total: 5, inProgress: 2, approved: 1, requiresAction: 1 },
  programsCount: 3,
  overallRating: 4.5,
  ratingState: 'calculated',
  ratingLastRefreshedAt: '2026-07-18T08:00:00Z',
  visibilityConsent: true,
  notifications: [
    {
      id: 'n-1',
      kind: 'success',
      title: 'تم اعتماد طلبك، ويمكنك الآن توقيع الاتفاقية.',
      at: '2026-07-27T09:10:00Z',
      read: false,
    },
    {
      id: 'n-2',
      kind: 'action',
      title: 'يلزم رفع مستند إضافي لأحد طلباتك.',
      at: '2026-07-24T14:00:00Z',
      read: false,
    },
    {
      id: 'n-3',
      kind: 'info',
      title: 'تم تحديث تقييمك العام بناءً على آخر البرامج.',
      at: '2026-07-18T08:00:00Z',
      read: true,
    },
  ],
  hasActivity: true,
};

/**
 * The empty-state seed: somebody who signed in and holds only the baseline
 * `individual` role.
 *
 * ⚠️ `classification: null` on purpose. This seed used to say `certified`,
 * which is precisely the fiction the portal was showing — a person who had
 * never applied, greeted as an accredited trainer.
 */
export const MOCK_HOME_EMPTY: PortalHomeDto = {
  displayName: 'مستخدم جديد',
  classification: null,
  applications: { total: 0, inProgress: 0, approved: 0, requiresAction: 0 },
  programsCount: 0,
  overallRating: null,
  ratingState: 'unavailable',
  ratingLastRefreshedAt: null,
  visibilityConsent: false,
  notifications: [],
  hasActivity: false,
};

export interface MockHomeProviderOptions {
  readonly seed?: PortalHomeDto;
  readonly latencyMs?: number;
  readonly failWith?: ExpertHubApiError;
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockHomeProvider(options: MockHomeProviderOptions = {}): HomeService {
  const { seed = MOCK_HOME, latencyMs = 300, failWith } = options;
  return {
    async getPortalHome(): Promise<Result<PortalHomeDto, ExpertHubApiError>> {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      return {
        ok: true,
        value: { ...seed, notifications: seed.notifications.map((n) => ({ ...n })) },
      };
    },
  };
}
