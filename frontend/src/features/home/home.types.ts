import type { TrainerClassification } from '../directory/directory.types';
import type { RatingState } from '../profile/profile.types';

/**
 * EH-TP-01 (Portal Home) contracts — CAP-09 (personal), flow entry surface. A
 * read-only, **role-scoped** (`BR-0902` — own data only) personal overview the
 * trainer sees after login. Consumed **only** through `homeService` (mock now,
 * the future Expert Hub metrics/summary API later).
 *
 * The figures are **live-read, derived** personal metrics (`BR-0904` — no stored
 * source), not the deferred management KPI set (`G9`/`G13`). The rating is the
 * **calculated** indicator (`02D`, P-06) — never raw MTM, never editable — with
 * `pending` / `unavailable` states surfaced only on the rating tile (`§0.2`).
 */

/** Grouped application counts (presentation groupings over `P-05`, not metrics). */
export interface HomeApplicationsSummary {
  readonly total: number;
  readonly inProgress: number;
  readonly approved: number;
  /** Draft + agreement-pending — the states where the trainer must act. */
  readonly requiresAction: number;
}

export type HomeNotificationKind = 'info' | 'success' | 'action';

/** One item in the recent-notifications preview (P-09). */
export interface HomeNotificationDto {
  readonly id: string;
  readonly kind: HomeNotificationKind;
  readonly title: string;
  readonly at: string;
  readonly read: boolean;
}

export interface PortalHomeDto {
  readonly displayName: string;
  /**
   * ⚠️ **Null for anyone who is not a trainer.** A classification is a fact
   * about a trainer; the API used to answer `certified` for anyone with no
   * trainer file at all, so the portal greeted people who had never applied as
   * «مدرب معتمد». `null` is the honest answer, and the page says what they are
   * instead.
   */
  readonly classification: TrainerClassification | null;
  readonly applications: HomeApplicationsSummary;
  readonly programsCount: number;
  /** Calculated overall; `null` unless `ratingState === 'calculated'`. */
  readonly overallRating: number | null;
  readonly ratingState: RatingState;
  readonly ratingLastRefreshedAt: string | null;
  /** Public-directory visibility (`BR-1002`) — shown as a status, links to Profile. */
  readonly visibilityConsent: boolean;
  readonly notifications: readonly HomeNotificationDto[];
  /** `false` ⇒ a brand-new trainer with no activity yet (empty state). */
  readonly hasActivity: boolean;
}
