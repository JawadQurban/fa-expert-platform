import type { TagVariant } from '@ds/primitives';
import type { Locale } from '@/types';

/**
 * The engagement status vocabulary — **one module**, read by J-18's "My
 * Engagements", J-21's detail page and J-22's withdrawal and de-link actions.
 *
 * It exists because those pages drifted from the API: they spelled
 * `in-progress` while the server sends `in_progress`, so an engagement under
 * delivery landed in "Past engagements" with no label. No component declares
 * a status literal of its own any more.
 *
 * The values are `EngagementStatuses` (`ExpertHub.Core/Domain/Assignments.cs`),
 * served as `lifecycle` on GET v1/me/engagements and as `status` on
 * GET v1/me/engagements/{id}:
 *
 * - `upcoming | in_progress | completed` — derived by the server from the
 *   schedule alone (J-21/F5/AC-1). Nothing administrative produces them.
 * - `withdrawn` — ended early by the trainer **or** by staff (`P-111`). Who did
 *   it is `termination.actor`, never the status.
 * - `cancelled` — FAST cancelled the plan (J-22/F3). Nothing here can.
 */
export const ENGAGEMENT_STATUSES = [
  'upcoming',
  'in_progress',
  'completed',
  'withdrawn',
  'cancelled',
] as const;

export type EngagementStatus = (typeof ENGAGEMENT_STATUSES)[number];

/** J-22 — the two early endings. The termination record says why. */
export type EngagementTerminationKind = Extract<EngagementStatus, 'withdrawn' | 'cancelled'>;

/**
 * J-21/F1/AC-1 — "active": confirmed, not completed, not ended early. An
 * allow-list, so a status added later is inactive by default rather than
 * appearing among the trainer's live engagements.
 */
export function isActive(status: EngagementStatus): boolean {
  return status === 'upcoming' || status === 'in_progress';
}

/**
 * J-22/F1 + F2 — only an upcoming engagement may be withdrawn from or de-linked.
 * The server enforces it (`engagement-not-upcoming`), so this only decides
 * whether the action is offered at all.
 */
export function canTerminate(status: EngagementStatus): boolean {
  return status === 'upcoming';
}

/** Text + variant, never colour alone (WCAG 1.4.1). */
export const ENGAGEMENT_STATUS_TAG: Readonly<Record<EngagementStatus, TagVariant>> = {
  upcoming: 'information',
  in_progress: 'success',
  completed: 'neutral',
  withdrawn: 'warning',
  cancelled: 'warning',
};

/** Arabic authoritative, English best-effort. J-22/F3/AC-5 — three distinct end-states, three distinct words. */
const LABELS: Readonly<Record<Locale, Readonly<Record<EngagementStatus, string>>>> = {
  ar: {
    upcoming: 'لم يبدأ بعد',
    in_progress: 'جارٍ التنفيذ',
    completed: 'منتهٍ',
    withdrawn: 'أُنهي قبل التنفيذ',
    cancelled: 'ملغى',
  },
  en: {
    upcoming: 'Upcoming',
    in_progress: 'In progress',
    completed: 'Completed',
    withdrawn: 'Withdrawn',
    cancelled: 'Cancelled',
  },
};

/** A value the vocabulary does not know is shown as sent, never as blank. */
export function engagementStatusLabel(status: EngagementStatus, locale: Locale): string {
  return (LABELS[locale] ?? LABELS.ar)[status] ?? status;
}
