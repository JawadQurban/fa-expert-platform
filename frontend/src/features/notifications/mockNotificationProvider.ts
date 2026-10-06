import type { ExpertHubApiError } from '../../shared/services/apiClient';
import { applySlaInput, listSlaMatrix } from '../../shared/sla/mockSlaMatrix';
import type { NotificationService } from './notificationService';
import {
  validateRouting,
  validateSla,
  validateTemplate,
  placeholdersUsed,
  type NotificationEventDto,
  type NotificationLogDto,
  type NotificationLogQuery,
  type NotificationMatrixDto,
  type NotificationMatrixRowDto,
  type NotificationTemplateDto,
  type NonEmptyAudience,
  type RouteEventInput,
  type SlaInput,
  type TemplateInput,
} from './notification.types';

/**
 * Versioned **mock** provider for CAP-07.
 *
 * ⚠️ **The event catalogue below is not invented.** Every one of the twenty
 * events is a notification point an approved journey states, and each carries
 * the citation and the journey's own words about who is notified. Ten journeys
 * contribute: J-01, J-02, J-03, J-06, J-11, J-12, J-18, J-19, J-21, J-22.
 *
 * ⚠️ **Every matrix row starts unrouted, and `modelStatus` is `unapproved`.**
 * `DM-GAP-08` is the approved routing — which event notifies whom, from which
 * template — and it does not exist. The journeys say *that* someone is notified
 * and usually *who*, but nobody has approved the central matrix, and a seeded
 * one would be indistinguishable from an approved one. So the routing is empty
 * and the evidence is on screen next to it.
 *
 * ⚠️ **No template is seeded either.** `BR-0701` allows only approved bilingual
 * templates and none has been written, so inventing message bodies would have
 * put words in the Academy's mouth. The template list ships empty.
 *
 * ⚠️ MOCK DATA (clearly labelled). ⚠️ Deterministic clock.
 */

/** ⚠️ MOCK — the fixed "today". */
const MOCK_NOW = '2026-08-27T09:00:00Z';

/**
 * The placeholder vocabulary a template body may use. ⚠️ MOCK — §8.7 never
 * enumerates the placeholders, so this is the set the seeded events imply and
 * is the list `validateTemplate` checks against. → `Q33`.
 */
const KNOWN_PLACEHOLDERS: readonly string[] = [
  'recipientName',
  'trainerName',
  'serviceName',
  'referenceNumber',
  'agreementEndDate',
  'agreementDuration',
  'programName',
  'programDates',
  'slotNumber',
  'reasonText',
  'actionUrl',
  'deadlineDate',
];

/**
 * §8.7.3's «مصفوفة الإشعارات» covers «كل الأحداث القادمة من القدرات الاثنتي
 * عشرة» (`BR-0703`). These twenty are the events the built journeys name — the
 * catalogue is therefore *incomplete by construction*, and the screen says so:
 * a capability with no journey has not yet declared its events.
 */
const EVENTS: readonly NotificationEventDto[] = [
  /* ── CAP-01 — applications and add-service ────────────────────────────── */
  {
    eventCode: 'EV-0101',
    capabilityCode: 'CAP-01',
    nameAr: 'تأكيد استلام طلب الانضمام',
    nameEn: 'Application submission confirmed',
    source: 'J-01 — user flow 7',
    journeyAudienceAr: 'مقدّم الطلب — «إشعار داخل المنصة وإشعار بالبريد».',
    journeyAudienceEn: 'The applicant — “in-app + notification”.',
  },
  {
    eventCode: 'EV-0102',
    capabilityCode: 'CAP-01',
    nameAr: 'دعوة تفعيل لمرشَّح داخليًا',
    nameEn: 'Activation invitation for an internally nominated applicant',
    source: 'J-02/F3/AC-1 + AC-2',
    journeyAudienceAr:
      'المرشَّح، فورًا عند تقديم الموظف للطلب — «بقالب مختلف عن تأكيد التقديم الذاتي».',
    journeyAudienceEn:
      'The nominee, immediately on staff submission — “a distinct template from the self-submission confirmation”.',
  },
  {
    eventCode: 'EV-0103',
    capabilityCode: 'CAP-01',
    nameAr: 'اعتماد طلب إضافة خدمة بعد رفع الملحق',
    nameEn: 'Add-service request approved, addendum live',
    source: 'J-03/F3/AC-6',
    journeyAudienceAr: 'المدرب — يُشعَر بالاعتماد وبالملحق المحدَّث.',
    journeyAudienceEn: 'The trainer — notified of the approval and the updated addendum.',
  },
  {
    eventCode: 'EV-0104',
    capabilityCode: 'CAP-01',
    nameAr: 'رفض طلب إضافة خدمة',
    nameEn: 'Add-service request rejected',
    source: 'J-03/F3/AC-7',
    journeyAudienceAr: 'المدرب — يُشعَر بالنتيجة **دون سبب الرفض**.',
    journeyAudienceEn: 'The trainer — notified of the outcome **without the rejection reason**.',
  },

  /* ── CAP-02 — screening, interviews, signing ──────────────────────────── */
  {
    eventCode: 'EV-0201',
    capabilityCode: 'CAP-02',
    nameAr: 'توفّر مواعيد المقابلة',
    nameEn: 'Interview slots available',
    source: 'J-06/F1/AC-1 (BR-0206)',
    journeyAudienceAr:
      'مقدّم الطلب — بريد وإشعار داخل المنصة معًا؛ والاختيار يتم من البوابة لا من البريد.',
    journeyAudienceEn:
      'The applicant — email and in-platform together; the choice is made in the portal, never in the email.',
  },
  {
    eventCode: 'EV-0202',
    capabilityCode: 'CAP-02',
    nameAr: 'تذكير باختيار موعد المقابلة',
    nameEn: 'Reminder to choose an interview slot',
    source: 'J-06/F1/AC-4',
    journeyAudienceAr: 'مقدّم الطلب — «تذكيرات تُرسل وفق مصفوفة الإشعارات».',
    journeyAudienceEn: 'The applicant — “reminders sent per the Notification Matrix”.',
  },
  {
    eventCode: 'EV-0203',
    capabilityCode: 'CAP-02',
    nameAr: 'تأكيد موعد المقابلة ودعوة الاجتماع',
    nameEn: 'Interview slot confirmed, meeting invitation issued',
    source: 'J-06 — user flow 5',
    journeyAudienceAr:
      'مقدّم الطلب وأعضاء اللجنة — دعوة الاجتماع مع إشعار مواز في المنصة بنفس الوقت والرابط.',
    journeyAudienceEn:
      'The applicant and the committee members — the meeting invite plus a parallel in-platform notification carrying the same time and link.',
  },
  {
    eventCode: 'EV-0204',
    capabilityCode: 'CAP-02',
    nameAr: 'الاتفاقية جاهزة لتوقيع المتقدم',
    nameEn: 'Agreement ready for the applicant to sign',
    source: 'J-11 — user flow 1 + F1/AC-1',
    journeyAudienceAr: 'مقدّم الطلب — يستلم الاتفاقية الموقّعة داخليًا بالكامل عبر إشعار.',
    journeyAudienceEn:
      'The applicant — receives the fully internally-signed agreement via notification.',
  },

  /* ── CAP-03 — agreement lifecycle ─────────────────────────────────────── */
  {
    eventCode: 'EV-0301',
    capabilityCode: 'CAP-03',
    nameAr: 'تنبيه قرب انتهاء الاتفاقية — 90 يومًا',
    nameEn: 'Agreement expiry alert — 90 days',
    source: 'J-12/F1/AC-2 (BR-0303)',
    journeyAudienceAr: 'المدرب وموظفو إدارة المدربين معًا.',
    journeyAudienceEn: 'Both the trainer and Trainer Management staff.',
  },
  {
    eventCode: 'EV-0302',
    capabilityCode: 'CAP-03',
    nameAr: 'تنبيه قرب انتهاء الاتفاقية — 30 يومًا',
    nameEn: 'Agreement expiry alert — 30 days',
    source: 'J-12/F1/AC-3 (BR-0303, extended)',
    journeyAudienceAr: 'المدرب وموظفو إدارة المدربين معًا.',
    journeyAudienceEn: 'Both the trainer and Trainer Management staff.',
  },
  {
    eventCode: 'EV-0303',
    capabilityCode: 'CAP-03',
    nameAr: 'تنبيه قرب انتهاء الاتفاقية — 5 أيام',
    nameEn: 'Agreement expiry alert — 5 days',
    source: 'J-12/F1/AC-4 (BR-0303, extended)',
    journeyAudienceAr: 'المدرب وموظفو إدارة المدربين معًا — التنبيه الأخير.',
    journeyAudienceEn: 'Both the trainer and Trainer Management staff — the final alert.',
  },
  {
    eventCode: 'EV-0304',
    capabilityCode: 'CAP-03',
    nameAr: 'تجديد الاتفاقية',
    nameEn: 'Agreement renewed',
    source: 'J-12/F2/AC-3',
    journeyAudienceAr: 'المدرب — مع المدة الجديدة صراحةً في نص الإشعار.',
    journeyAudienceEn: 'The trainer — with the new duration stated in the message.',
  },

  /* ── CAP-05 — assignment, execution, withdrawal ───────────────────────── */
  {
    eventCode: 'EV-0501',
    capabilityCode: 'CAP-05',
    nameAr: 'عرض إسناد للمرشح الأعلى ترتيبًا',
    nameEn: 'Assignment offer sent to the top-ranked candidate',
    source: 'J-18/F1/AC-1 + AC-2',
    journeyAudienceAr:
      'المرشح الأعلى ترتيبًا **وحده** لكل فتحة؛ المرشحون الاحتياطيون لا يُشعَرون حتى يأتي دورهم.',
    journeyAudienceEn:
      'The top-ranked candidate **only**, per slot; backup candidates receive nothing until their turn.',
  },
  {
    eventCode: 'EV-0502',
    capabilityCode: 'CAP-05',
    nameAr: 'رفض صريح لعرض الإسناد',
    nameEn: 'Assignment offer explicitly rejected',
    source: 'J-18/F2/AC-2 (BR-0507)',
    journeyAudienceAr: 'الموظفون — فورًا.',
    journeyAudienceEn: 'Staff — immediately.',
  },
  {
    eventCode: 'EV-0503',
    capabilityCode: 'CAP-05',
    nameAr: 'انتهاء مهلة عرض الإسناد دون رد',
    nameEn: 'Assignment offer expired with no response',
    source: 'J-18/F2/AC-4',
    journeyAudienceAr:
      'الموظف الذي رشّح المرشحين **تحديدًا** — «إشعار مستقل عن إشعار الرفض الصريح».',
    journeyAudienceEn:
      'The staff member who nominated the candidates **specifically** — “a distinct notification from explicit rejection”.',
  },
  {
    eventCode: 'EV-0504',
    capabilityCode: 'CAP-05',
    nameAr: 'استنفاد كل مرشحي الفتحة',
    nameEn: 'Slot exhausted all approved candidates',
    source: 'J-19/F1/AC-2',
    journeyAudienceAr: 'الموظفون — «إشعار مستقل عن إشعار رفض أو انتهاء مهلة مرشح واحد».',
    journeyAudienceEn:
      'Staff — “distinct from a single candidate’s rejection/expiry notification”.',
  },
  {
    eventCode: 'EV-0505',
    capabilityCode: 'CAP-05',
    nameAr: 'تغيير مواعيد البرنامج في فاست',
    nameEn: 'Programme dates changed in FAST',
    source: 'J-21/F1/AC-3',
    journeyAudienceAr: 'المدرب — إشعار فوري بالتغيير.',
    journeyAudienceEn: 'The trainer — an immediate notification of the change.',
  },
  {
    eventCode: 'EV-0506',
    capabilityCode: 'CAP-05',
    nameAr: 'اعتذار المدرب عن ارتباط',
    nameEn: 'Trainer withdrew from an engagement',
    source: 'J-22/F1/AC-4',
    journeyAudienceAr: 'الموظف المسؤول — فورًا.',
    journeyAudienceEn: 'The responsible staff member — immediately.',
  },
  {
    eventCode: 'EV-0507',
    capabilityCode: 'CAP-05',
    nameAr: 'فك ارتباط المدرب من قِبل الإدارة',
    nameEn: 'Staff de-linked a trainer from an engagement',
    source: 'J-22/F2/AC-4',
    journeyAudienceAr: 'المدرب — مع السبب المختار.',
    journeyAudienceEn: 'The trainer — along with the selected reason.',
  },
  {
    eventCode: 'EV-0508',
    capabilityCode: 'CAP-05',
    nameAr: 'إلغاء الخطة بالكامل من فاست',
    nameEn: 'Plan fully cancelled in FAST',
    source: 'J-22/F3/AC-4',
    journeyAudienceAr:
      'كل مدرب مرتبط بالخطة — مع توضيح أن السبب هو إلغاء الأكاديمية للخطة بالكامل.',
    journeyAudienceEn:
      'Every linked trainer — clarifying the reason is the Academy’s full cancellation of the plan.',
  },
];

/**
 * ⚠️ MOCK sends, to exercise `F-0705`. Deliberately mixed: `BR-0702` fires both
 * channels for one event, so a successful event produces **two** log rows, and a
 * per-channel failure is exactly the case `US-0705` exists for.
 */
const SEED_LOG: readonly NotificationLogDto[] = [
  {
    logId: 'log-001',
    eventCode: 'EV-0301',
    recipientName: 'د. سارة العتيبي',
    channel: 'email',
    language: 'ar',
    templateCode: 'TPL-AGREEMENT-EXPIRY-90',
    templateVersion: 1,
    sentAt: '2026-08-26T07:15:00Z',
    sendStatus: 'success',
  },
  {
    logId: 'log-002',
    eventCode: 'EV-0301',
    recipientName: 'د. سارة العتيبي',
    channel: 'in-platform',
    language: 'ar',
    templateCode: 'TPL-AGREEMENT-EXPIRY-90',
    templateVersion: 1,
    sentAt: '2026-08-26T07:15:00Z',
    sendStatus: 'success',
  },
  {
    logId: 'log-003',
    eventCode: 'EV-0501',
    recipientName: 'أ. ريم القحطاني',
    channel: 'email',
    language: 'ar',
    templateCode: 'TPL-ASSIGNMENT-OFFER',
    templateVersion: 2,
    sentAt: '2026-08-26T10:02:00Z',
    sendStatus: 'failure',
    failureReason: 'رفض خادم البريد العنوان: صندوق المستلم ممتلئ.',
  },
  {
    logId: 'log-004',
    eventCode: 'EV-0501',
    recipientName: 'أ. ريم القحطاني',
    channel: 'in-platform',
    language: 'ar',
    templateCode: 'TPL-ASSIGNMENT-OFFER',
    templateVersion: 2,
    sentAt: '2026-08-26T10:02:00Z',
    sendStatus: 'success',
  },
  {
    logId: 'log-005',
    eventCode: 'EV-0204',
    recipientName: 'John Miller',
    // `BR-0707` — one language per send, taken from the recipient's profile.
    language: 'en',
    channel: 'email',
    templateCode: 'TPL-AGREEMENT-READY',
    templateVersion: 1,
    sentAt: '2026-08-25T12:40:00Z',
    sendStatus: 'success',
  },
  {
    logId: 'log-006',
    eventCode: 'EV-0503',
    recipientName: 'أ. منى الشهراني',
    channel: 'email',
    language: 'ar',
    templateCode: 'TPL-OFFER-EXPIRED-STAFF',
    templateVersion: 1,
    sentAt: '2026-08-24T06:00:00Z',
    sendStatus: 'failure',
    failureReason: 'انتهت مهلة الاتصال بخادم البريد بعد ثلاث محاولات.',
  },
];

export interface MockNotificationProviderOptions {
  readonly latencyMs?: number;
  readonly failWith?: ExpertHubApiError;
  readonly now?: string;
  readonly actorName?: string;
  /** `BR-0704` — server-decided (P-J9). Defaults to the System Administrator. */
  readonly canManageTemplates?: boolean;
  /** Seed templates, for tests that need an approved one to route with. */
  readonly templates?: readonly NotificationTemplateDto[];
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockNotificationProvider(
  options: MockNotificationProviderOptions = {}
): NotificationService {
  const {
    latencyMs = 300,
    failWith,
    now = MOCK_NOW,
    actorName = 'مشرف النظام',
    canManageTemplates = true,
    templates: seededTemplates = [],
  } = options;

  // `DM-GAP-08` — every event starts unrouted. Nothing is assumed.
  let rows: NotificationMatrixRowDto[] = [];
  let templates: NotificationTemplateDto[] = seededTemplates.map((template) => ({ ...template }));
  let templateCounter = seededTemplates.length;

  function matrix(): NotificationMatrixDto {
    return {
      events: EVENTS,
      rows: [...rows],
      templates: [...templates],
      modelStatus: 'unapproved',
      canManageTemplates,
      knownPlaceholders: KNOWN_PLACEHOLDERS,
    };
  }

  function replaceRow(next: NotificationMatrixRowDto) {
    rows = [...rows.filter((row) => row.eventCode !== next.eventCode), next];
  }

  return {
    async getMatrix() {
      await delay(latencyMs);
      return failWith != null ? { ok: false, error: failWith } : { ok: true, value: matrix() };
    },

    async routeEvent(eventCode: string, input: RouteEventInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      if (!EVENTS.some((event) => event.eventCode === eventCode)) {
        // `BR-0703` — events come from capabilities; routing invents none.
        return { ok: false, error: { status: 404, message: 'Unknown event.' } };
      }
      if (validateRouting(input, templates).length > 0) {
        return { ok: false, error: { status: 400, message: 'Invalid routing.' } };
      }
      replaceRow({
        status: 'routed',
        eventCode,
        templateId: input.templateId,
        // Validated non-empty just above, which is what the type demands.
        audience: input.audience as unknown as NonEmptyAudience,
        isActive: true,
      });
      return { ok: true, value: matrix() };
    },

    async setRowActive(eventCode: string, isActive: boolean) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const existing = rows.find((row) => row.eventCode === eventCode);
      if (existing == null || existing.status !== 'routed') {
        // An unrouted row has nothing to pause — the union says as much.
        return { ok: false, error: { status: 409, message: 'Event is not routed.' } };
      }
      replaceRow({ ...existing, isActive });
      return { ok: true, value: matrix() };
    },

    async saveTemplate(templateId: string | null, input: TemplateInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      if (!canManageTemplates) {
        // `BR-0704` — System Administrator only.
        return { ok: false, error: { status: 403, message: 'Not permitted.' } };
      }
      if (input.code.trim() === '') {
        return { ok: false, error: { status: 400, message: 'Template code is required.' } };
      }
      const used = [...placeholdersUsed(input.bodyAr), ...placeholdersUsed(input.bodyEn)];
      if (used.some((name) => !KNOWN_PLACEHOLDERS.includes(name))) {
        return { ok: false, error: { status: 400, message: 'Unknown placeholder.' } };
      }
      const existing = templates.find((template) => template.templateId === templateId);
      if (templateId != null && existing == null) {
        return { ok: false, error: { status: 404, message: 'Template not found.' } };
      }
      // Editing an approved template returns it to draft: the approval was of
      // the wording, and the wording changed. The log keeps the sent version.
      const saved: NotificationTemplateDto = {
        templateId: existing?.templateId ?? `tpl-${String(++templateCounter).padStart(3, '0')}`,
        code: input.code.trim(),
        subjectAr: input.subjectAr,
        subjectEn: input.subjectEn,
        bodyAr: input.bodyAr,
        bodyEn: input.bodyEn,
        placeholders: used,
        version: (existing?.version ?? 0) + 1,
        updatedAt: now,
        updatedByName: actorName,
        status: 'draft',
      };
      templates =
        existing == null
          ? [...templates, saved]
          : templates.map((template) =>
              template.templateId === existing.templateId ? saved : template
            );
      // A row pointing at a template that just left approval is no longer
      // routable, so it returns to unrouted rather than pointing at a draft.
      rows = rows.map((row) =>
        row.status === 'routed' && row.templateId === saved.templateId
          ? { status: 'unrouted', eventCode: row.eventCode }
          : row
      );
      return { ok: true, value: matrix() };
    },

    async approveTemplate(templateId: string) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      if (!canManageTemplates) {
        return { ok: false, error: { status: 403, message: 'Not permitted.' } };
      }
      const existing = templates.find((template) => template.templateId === templateId);
      if (existing == null) {
        return { ok: false, error: { status: 404, message: 'Template not found.' } };
      }
      if (validateTemplate(existing, KNOWN_PLACEHOLDERS).length > 0) {
        // `BR-0701` — both languages, complete, before it can be approved.
        return { ok: false, error: { status: 400, message: 'Template is incomplete.' } };
      }
      templates = templates.map((template) =>
        template.templateId === templateId ? { ...template, status: 'approved' } : template
      );
      return { ok: true, value: matrix() };
    },

    async listSlaRows() {
      await delay(latencyMs);
      // `BR-0705` — the one matrix, shared with every capability that runs a
      // countdown. Not a copy held by this screen.
      return failWith != null
        ? { ok: false, error: failWith }
        : { ok: true, value: listSlaMatrix() };
    },

    async setSla(slaId: string, input: SlaInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      if (validateSla(input).length > 0) {
        return { ok: false, error: { status: 400, message: 'Invalid deadline.' } };
      }
      // The write goes to the shared matrix, so a duration set here is the one
      // the screening list, the offer card and the agreements table read.
      const updated = applySlaInput(slaId, input);
      return updated == null
        ? { ok: false, error: { status: 404, message: 'SLA row not found.' } }
        : { ok: true, value: updated };
    },

    async listLog(query: NotificationLogQuery) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const term = query.search.trim().toLowerCase();
      return {
        ok: true,
        value: SEED_LOG.filter((entry) => {
          if (query.sendStatus != null && entry.sendStatus !== query.sendStatus) {
            return false;
          }
          if (query.channel != null && entry.channel !== query.channel) {
            return false;
          }
          return (
            term === '' ||
            entry.recipientName.toLowerCase().includes(term) ||
            entry.eventCode.toLowerCase().includes(term) ||
            entry.templateCode.toLowerCase().includes(term)
          );
        }),
      };
    },
  };
}

export { MOCK_NOW, EVENTS as MOCK_EVENTS, SEED_LOG as MOCK_LOG, KNOWN_PLACEHOLDERS };
