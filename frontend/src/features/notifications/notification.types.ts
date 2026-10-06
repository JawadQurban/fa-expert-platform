import type { Locale } from '@/types';

/**
 * Communication & notification contracts — **CAP-07** (`BRD-TRN-001` §8.7),
 * catalogued as journey **J-25**.
 *
 * ⚠️ **Built from the BRD, not from a journey** (`Q17`) — §8.7 supplies the
 * capability definition, its scope, four entities, five features and six
 * business rules. Where §8.7 is silent nothing is invented.
 *
 * §8.7.1 calls this «القدرة الأفقية» — the *horizontal* capability. It owns the
 * channels, the templates and the routing for events raised by all twelve
 * capabilities, and that ownership is what most of the structure below defends.
 *
 * Four rules shape these types:
 *
 * - **`BR-0701`** — «كل الإشعارات الرسمية تصدر من قوالب معتمدة ثنائية اللغة…
 *   لا يُسمح بصياغات حرة في أي إشعار نظامي». *No free-form wording in any system
 *   notification.* So **no type here carries a message body except the template
 *   itself**, and a matrix row can only point at an **approved** template — a
 *   draft cannot be routed, because `RoutedMatrixRowDto` accepts only an
 *   approved template's id.
 * - **`BR-0702`** — a matrix event fires email **and** in-platform **together**,
 *   «معًا». So the matrix row has **no channel field at all**: there is nothing
 *   to choose, and a per-channel toggle would imply there is. Channel appears
 *   only on the log, where it records what actually happened.
 * - **`BR-0703`** — «كل قدرة تُطلق حدثها فقط، وCAP-07 تتولى تحديد المستلم
 *   والقالب والقناة». The event catalogue is **read-only here**: a capability
 *   declares its events, this capability routes them. There is no create-event
 *   operation anywhere.
 * - **`BR-0707`** — the actual notification is sent in **one** language, chosen
 *   from the recipient's primary-language field; «لا تُرسل نسخة ثنائية اللغة
 *   بنفس الرسالة». So `NotificationLogDto.language` is a single `Locale` and
 *   there is no `'both'`. The *template* is bilingual; the *send* is not.
 *
 * ⚠️ §8.7.5 numbers its rules 0701, 0702, 0703, 0704, 0705 and **0707**.
 * `BR-0706` does not exist in the document — the same numbering gap as
 * `BR-0604` in §8.6.5. Recorded, not filled.
 */

/* ------------------------------------------------------------------ *
 * §8.7.2 — two channels, always both
 * ------------------------------------------------------------------ */

/**
 * §8.7.2: «إرسال إشعارات عبر قناتين: البريد الإلكتروني، وإشعارات داخل المنصة».
 *
 * Used **only** by the log. `BR-0702` fires both together, so a matrix row has
 * no channel to configure — see the module note.
 */
export const NOTIFICATION_CHANNELS = ['email', 'in-platform'] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

/* ------------------------------------------------------------------ *
 * §8.7.3 — the event catalogue
 * ------------------------------------------------------------------ */

/**
 * One event a capability raises. **Declared by the capability, routed here**
 * (`BR-0703`), which is why this type is read-only and the service has no
 * operation that creates one.
 *
 * `source` and `journeyAudience*` carry the **evidence**, not the routing: the
 * journey's own words about who is notified. They are why the event exists at
 * all, and they let a System Administrator route it without going back to ten
 * journey documents. The routing itself is `DM-GAP-08` and lives on the matrix
 * row, empty until someone approves it.
 */
export interface NotificationEventDto {
  readonly eventCode: string;
  /** `CAP-01` … `CAP-12` — the capability that raises it. */
  readonly capabilityCode: string;
  readonly nameAr: string;
  readonly nameEn: string;
  /** Where the event is stated, e.g. `J-18/F2/AC-4`. Never blank. */
  readonly source: string;
  /** What the source says about who is notified — evidence for routing. */
  readonly journeyAudienceAr: string;
  readonly journeyAudienceEn: string;
}

/* ------------------------------------------------------------------ *
 * §8.7.3 — the bilingual template
 * ------------------------------------------------------------------ */

/**
 * `BR-0701` — «قوالب معتمدة ثنائية اللغة (عربي/إنجليزي)». A template is
 * approved only when **both** languages are complete, which is what
 * `validateTemplate` checks and what the union below records.
 *
 * `version` exists because the log records the version that was actually sent:
 * editing a template must not rewrite the history of what people received.
 */
interface TemplateFields {
  readonly templateId: string;
  readonly code: string;
  readonly subjectAr: string;
  readonly subjectEn: string;
  readonly bodyAr: string;
  readonly bodyEn: string;
  /** Placeholder names the body may use, e.g. `trainerName`. */
  readonly placeholders: readonly string[];
  readonly version: number;
  readonly updatedAt: string;
  readonly updatedByName: string;
}

/**
 * A template is **either** a draft or approved, and only an approved one may be
 * routed. `BR-0701` is therefore not a check performed before sending — an
 * unapproved template cannot reach a matrix row in the first place.
 */
export type NotificationTemplateDto =
  | (TemplateFields & { readonly status: 'draft' })
  | (TemplateFields & { readonly status: 'approved' });

export type TemplateValidationCode =
  | 'code-required'
  | 'subject-ar-required'
  | 'subject-en-required'
  | 'body-ar-required'
  | 'body-en-required'
  | 'unknown-placeholder';

export interface TemplateInput {
  readonly code: string;
  readonly subjectAr: string;
  readonly subjectEn: string;
  readonly bodyAr: string;
  readonly bodyEn: string;
}

/** `{{name}}` — the only placeholder syntax the editor recognises. */
const PLACEHOLDER_PATTERN = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g;

export function placeholdersUsed(text: string): readonly string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(PLACEHOLDER_PATTERN)) {
    const name = match[1];
    if (name != null) {
      found.add(name);
    }
  }
  return [...found];
}

/**
 * `BR-0701` on the way in: a template cannot be **approved** while either
 * language is missing. Both languages are required together, not one now and
 * the other later, because a half-translated template would send Arabic to a
 * recipient whose primary language is English (`BR-0707`) or nothing at all.
 */
export function validateTemplate(
  input: TemplateInput,
  known: readonly string[]
): readonly TemplateValidationCode[] {
  const issues: TemplateValidationCode[] = [];
  if (input.code.trim() === '') {
    issues.push('code-required');
  }
  if (input.subjectAr.trim() === '') {
    issues.push('subject-ar-required');
  }
  if (input.subjectEn.trim() === '') {
    issues.push('subject-en-required');
  }
  if (input.bodyAr.trim() === '') {
    issues.push('body-ar-required');
  }
  if (input.bodyEn.trim() === '') {
    issues.push('body-en-required');
  }
  const used = [...placeholdersUsed(input.bodyAr), ...placeholdersUsed(input.bodyEn)];
  if (used.some((name) => !known.includes(name))) {
    issues.push('unknown-placeholder');
  }
  return issues;
}

/* ------------------------------------------------------------------ *
 * §8.7.3 — the notification matrix
 * ------------------------------------------------------------------ */

/**
 * Who an event notifies.
 *
 * The six role codes are §8.8.5's approved roles. The two relationship targets
 * are **quoted from journeys**, not invented: J-18/F2/AC-4 requires "the staff
 * member who nominated the candidates" specifically, and J-22/F1/AC-4 "the
 * responsible staff member" — neither is a role, both are a relationship to the
 * record. J-03/F3/AC-6 and a dozen others notify the person the record is about.
 *
 * ⚠️ **Which audience each event gets is `DM-GAP-08`** and is not seeded.
 */
export const AUDIENCE_CODES = [
  'record_subject',
  'acting_staff',
  'trainer',
  'staff',
  'manager',
  'centre_coordinator',
  'system_administrator',
  'executive',
] as const;

export type AudienceCode = (typeof AUDIENCE_CODES)[number];

/** At least one audience — an empty routing is the *unrouted* member instead. */
export type NonEmptyAudience = readonly [AudienceCode, ...AudienceCode[]];

/**
 * One row of the central matrix: event → template → audience.
 *
 * **A discriminated union, because a half-configured row must not be able to
 * fire.** `unrouted` carries neither a template nor an audience and has no
 * `isActive` to turn on; `routed` requires an approved template *and* at least
 * one audience. `BR-0701` and the "who is notified" half of `BR-0703` are
 * therefore unrepresentable-when-missing rather than validated at send time.
 *
 * There is **no `channel` field** — `BR-0702` sends both together.
 */
export type NotificationMatrixRowDto =
  | { readonly status: 'unrouted'; readonly eventCode: string }
  | {
      readonly status: 'routed';
      readonly eventCode: string;
      /** Always an **approved** template — the service refuses a draft. */
      readonly templateId: string;
      readonly audience: NonEmptyAudience;
      /** A routed row may still be paused; an unrouted one has nothing to pause. */
      readonly isActive: boolean;
    };

export interface RouteEventInput {
  readonly templateId: string;
  readonly audience: readonly AudienceCode[];
}

export type RoutingValidationCode =
  'template-required' | 'audience-required' | 'template-not-approved';

export function validateRouting(
  input: RouteEventInput,
  templates: readonly NotificationTemplateDto[]
): readonly RoutingValidationCode[] {
  const issues: RoutingValidationCode[] = [];
  const template = templates.find((candidate) => candidate.templateId === input.templateId);
  if (input.templateId.trim() === '' || template == null) {
    issues.push('template-required');
  } else if (template.status !== 'approved') {
    // `BR-0701` — a draft is not an approved template, so it cannot be routed.
    issues.push('template-not-approved');
  }
  if (input.audience.length === 0) {
    issues.push('audience-required');
  }
  return issues;
}

/* ------------------------------------------------------------------ *
 * §8.7.3 — the notification log
 * ------------------------------------------------------------------ */

/**
 * One actual send. `US-0705` wants the failures visible «حتى أتابع الإشعارات
 * المتعثرة» — so a failure carries its reason, and the union makes a success
 * with a failure reason (or the reverse) impossible.
 *
 * `language` is a single `Locale`: `BR-0707` sends one language per message,
 * chosen from the recipient's primary-language field. `templateVersion` records
 * what was actually sent, so editing a template never rewrites history.
 */
interface NotificationLogFields {
  readonly logId: string;
  readonly eventCode: string;
  readonly recipientName: string;
  readonly channel: NotificationChannel;
  readonly language: Locale;
  readonly templateCode: string;
  readonly templateVersion: number;
  readonly sentAt: string;
}

export type NotificationLogDto =
  | (NotificationLogFields & { readonly sendStatus: 'success' })
  | (NotificationLogFields & {
      readonly sendStatus: 'failure';
      /** Never empty on a failure — that is the whole point of `US-0705`. */
      readonly failureReason: string;
    });

export interface NotificationLogQuery {
  readonly search: string;
  /** `null` = every status. */
  readonly sendStatus: NotificationLogDto['sendStatus'] | null;
  readonly channel: NotificationChannel | null;
}

export const DEFAULT_LOG_QUERY: NotificationLogQuery = {
  search: '',
  sendStatus: null,
  channel: null,
};

export function hasActiveLogQuery(query: NotificationLogQuery): boolean {
  return query.search.trim() !== '' || query.sendStatus != null || query.channel != null;
}

/* ------------------------------------------------------------------ *
 * §8.7.3 / `F-0704` — the central SLA console
 * ------------------------------------------------------------------ */

/**
 * §8.7.2: «كل المهل الزمنية وتذكيراتها، مهما كانت القدرة المصدر للحدث» — every
 * deadline across the twelve capabilities, on one screen (`BR-0705`).
 *
 * **The vocabulary lives in `shared/types/sla.ts`, not here.** CAP-07 owns the
 * *screen*; four other features consume a deadline, and making them import it
 * from this module would have made CAP-07 a dependency of half the product.
 */
export { SLA_UNITS, validateSla, reminderMilestoneFor } from '../../shared/types/sla';
export type {
  SlaUnit,
  SlaMatrixRowDto,
  SlaInput,
  SlaValidationCode,
  ReminderMilestone,
} from '../../shared/types/sla';

/* ------------------------------------------------------------------ *
 * The matrix as served
 * ------------------------------------------------------------------ */

export interface NotificationMatrixDto {
  readonly events: readonly NotificationEventDto[];
  readonly rows: readonly NotificationMatrixRowDto[];
  readonly templates: readonly NotificationTemplateDto[];
  /**
   * ⚠️ `DM-GAP-08` — the approved routing does not exist. `unapproved` means the
   * matrix is a working draft and the page says so rather than presenting
   * invented routing as policy (the same handling as `DM-GAP-07`).
   */
  readonly modelStatus: 'unapproved' | 'approved';
  /**
   * `BR-0704` — creating and editing templates is the System Administrator's
   * alone. **Server-decided** (P-J9): no page reads a role to work this out.
   */
  readonly canManageTemplates: boolean;
  /**
   * The placeholder vocabulary a template body may use, **served**. It belongs
   * to whatever renders the message, not to the screen that writes it, so the
   * editor never carries a list of its own.
   *
   * ⚠️ §8.7 never enumerates the placeholders — the served set is derived
   * from the events the journeys describe. → `Q33`.
   */
  readonly knownPlaceholders: readonly string[];
}

/** Convenience for the matrix screen — rows keyed by their event. */
export function rowFor(
  rows: readonly NotificationMatrixRowDto[],
  eventCode: string
): NotificationMatrixRowDto {
  return rows.find((row) => row.eventCode === eventCode) ?? { status: 'unrouted', eventCode };
}
