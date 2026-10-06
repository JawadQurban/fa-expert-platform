import type { Locale } from '@/types';
import {
  SLOT_CYCLE_STATUS,
  type PreviousOfferOutcome,
  type SiblingSlotState,
  type SlotActionErrorCode,
  type SlotCycleStatus,
} from './reRouting.types';
import { arNumber } from '../../shared/formatting';

/**
 * J-19 copy — Arabic authoritative, English best-effort.
 *
 * The copy carries two rules the UI alone cannot express:
 *
 * - **A familiar name reappearing is the rule, not a bug.** F2/AC-3 lets a
 *   candidate who already refused this slot be matched again, so the page says
 *   so beside the list of who refused. Staff would otherwise report it.
 * - **The cycle repeats without limit.** F3/AC-3 triggers no escalation, so the
 *   page states that plainly instead of leaving a repeatedly-exhausted slot
 *   looking like a dead end.
 */

export interface ReRoutingContent {
  readonly documentTitle: (reference: string, slot: number) => string;
  readonly breadcrumbLabel: string;
  readonly breadcrumbList: string;
  readonly breadcrumbRequest: string;
  readonly heading: string;
  readonly slotLabel: (slot: number) => string;
  readonly cycleLabel: (cycle: number) => string;
  readonly statuses: Readonly<Record<SlotCycleStatus, string>>;

  /** F1 — why this page exists at all. */
  readonly exhaustedTitle: string;
  readonly exhaustedBody: string;
  /** F3/AC-3 — no escalation, ever. */
  readonly noLimitNote: string;

  /** F2/AC-2 — the rest of the request, untouched. */
  readonly siblingsHeading: string;
  readonly siblingsNote: string;
  readonly siblingStates: Readonly<Record<SiblingSlotState, string>>;
  readonly siblingRow: (slot: number) => string;

  /** F2/AC-3 — who already refused. */
  readonly historyHeading: string;
  readonly historyNote: string;
  readonly historyOutcomes: Readonly<Record<PreviousOfferOutcome, string>>;
  readonly historyRow: (name: string, sentOn: string) => string;

  /** F3/AC-3 — every pass this slot has made through the cycle. */
  readonly cyclesHeading: string;
  readonly cycleRow: (cycle: number, openedOn: string) => string;

  /** F2/AC-1 — the slot-scoped run. */
  readonly matchHeading: string;
  readonly matchNote: string;
  readonly runEngine: string;
  readonly running: string;
  readonly modelVersion: (version: string) => string;
  readonly rankedHeading: string;
  readonly scoreLabel: string;
  readonly criteria: Readonly<Record<'language' | 'delivery-mode' | 'evaluation', string>>;
  readonly excludedHeading: string;
  readonly excludedNote: string;
  readonly exclusionReasons: Readonly<
    Record<'specialization' | 'location' | 'schedule-conflict' | 'file-status', string>
  >;
  readonly manualSearchLabel: string;
  readonly selectedCount: (selected: number, required: number) => string;
  readonly poolSizeNote: (required: number) => string;
  readonly sendPool: string;
  readonly priceLabel: string;
  readonly priceUnavailable: string;
  readonly returningCandidate: string;

  /** F3 — the fresh approval cycle. */
  readonly decisionHeading: string;
  readonly decisionNote: string;
  readonly approve: string;
  readonly reject: string;
  readonly rankLabel: (name: string) => string;
  readonly rankHint: string;
  readonly submitDecision: string;
  readonly decidedTitle: string;
  readonly decidedBody: string;
  readonly fullRejectionTitle: string;
  readonly fullRejectionBody: string;
  readonly notAuthorized: string;

  readonly errors: Readonly<{
    loadTitle: string;
    loadBody: string;
    noCycleTitle: string;
    noCycleBody: string;
    actionFailed: string;
    poolSizeWrong: string;
    decisionsIncomplete: string;
    rankingMismatch: string;
    /** A `409`: the slot moved on under the page, which has re-read it. */
    staleState: string;
    /** The server's `400` codes on the pool actions. */
    server: Readonly<Record<SlotActionErrorCode, string>>;
    retry: string;
    backToRequest: string;
  }>;
}

const fmtAr = (value: number) => arNumber(value);

const ar: ReRoutingContent = {
  documentTitle: (reference, slot) => `${reference} — إعادة توجيه المقعد ${fmtAr(slot)}`,
  breadcrumbLabel: 'مسار التنقل',
  breadcrumbList: 'طلبات الإسناد',
  breadcrumbRequest: 'المطابقة والترشيح',
  heading: 'إعادة التوجيه بعد رفض العرض',
  slotLabel: (slot) => `المقعد رقم ${fmtAr(slot)}`,
  cycleLabel: (cycle) => `الدورة رقم ${fmtAr(cycle)}`,
  statuses: {
    [SLOT_CYCLE_STATUS.exhausted]: 'بحاجة إلى مرشحين جدد',
    [SLOT_CYCLE_STATUS.awaitingApproval]: 'بانتظار قرار الجهة الطالبة',
    [SLOT_CYCLE_STATUS.decided]: 'صدر القرار',
  },

  exhaustedTitle: 'استُنفد جميع المرشحين المعتمدين لهذا المقعد',
  exhaustedBody:
    'رفض جميع المرشحين المعتمدين والمرتَّبين لهذا المقعد أو انتهت مدة ردّهم دون قبول. أعد المطابقة لهذا المقعد وحده.',
  noLimitNote: 'تتكرر دورة إعادة المطابقة دون حد أقصى، ولا يترتب على تكرارها أي إجراء تصعيدي.',

  siblingsHeading: 'بقية مقاعد الطلب',
  siblingsNote: 'لا تتأثر هذه المقاعد بإعادة المطابقة، ولا يُعاد فتح مقعد مؤكَّد.',
  siblingStates: {
    confirmed: 'ارتباط مؤكَّد',
    'awaiting-response': 'بانتظار رد المرشح',
    exhausted: 'بحاجة إلى مرشحين جدد',
    'no-offer': 'لا يوجد عرض قائم',
  },
  siblingRow: (slot) => `المقعد رقم ${fmtAr(slot)}`,

  historyHeading: 'من سبق ترشيحه لهذا المقعد',
  historyNote:
    'لا يُستبعد أي منهم من الدورة الجديدة؛ يمكن ترشيحه مجددًا ما دام مطابقًا للمعايير اليوم.',
  historyOutcomes: {
    'awaiting-response': 'بانتظار رد المرشح',
    accepted: 'قَبِل العرض',
    rejected: 'رفض صريح',
    expired: 'انتهاء المدة دون رد',
  },
  historyRow: (name, sentOn) => `${name} — أُرسل العرض في ${sentOn}`,

  cyclesHeading: 'دورات إعادة التوجيه لهذا المقعد',
  cycleRow: (cycle, openedOn) => `الدورة رقم ${fmtAr(cycle)} — بدأت في ${openedOn}`,

  matchHeading: 'مطابقة جديدة لهذا المقعد',
  matchNote: 'تقتصر المطابقة على هذا المقعد وحده، ولا تشمل الطلب بالكامل.',
  runEngine: 'تشغيل محرك المطابقة',
  running: 'جارٍ التشغيل…',
  modelVersion: () => 'نموذج المطابقة: نسخة مبدئية — الأوزان غير معتمدة بعد.',
  rankedHeading: 'المرشحون المرتّبون',
  scoreLabel: 'الدرجة',
  criteria: {
    language: 'اللغة',
    'delivery-mode': 'نمط التقديم',
    evaluation: 'التقييم والتصنيف',
  },
  excludedHeading: 'مستبعدون',
  excludedNote: 'استُبعد هؤلاء كليًا لعدم استيفاء معيار إقصائي، ولا يمكن ترشيحهم لهذا المقعد.',
  exclusionReasons: {
    specialization: 'التخصص غير مطابق',
    location: 'المدينة غير مطابقة',
    'schedule-conflict': 'تعارض مع ارتباط مؤكَّد',
    'file-status': 'حالة الملف غير نشطة',
  },
  manualSearchLabel: 'بحث باسم المدرب',
  selectedCount: (selected, required) => `اخترت ${fmtAr(selected)} من ${fmtAr(required)}`,
  poolSizeNote: (required) =>
    `المقعد الواحد يحتاج ${fmtAr(required)} مرشحين بالضبط — لا أقل ولا أكثر.`,
  sendPool: 'إرسال القائمة إلى الجهة الطالبة',
  priceLabel: 'السعر',
  priceUnavailable: 'لا يوجد سعر لهذا النمط في اتفاقيته.',
  returningCandidate: 'سبق ترشيحه لهذا المقعد',

  decisionHeading: 'قرار الجهة الطالبة',
  decisionNote: 'راجع كل مرشح على حدة: اقبله أو ارفضه، ثم رتّب المقبولين حسب الأفضلية.',
  approve: 'قبول',
  reject: 'رفض',
  rankLabel: (name) => `ترتيب ${name}`,
  rankHint: 'رتّب المرشحين المقبولين من الأفضل إلى ما دونه.',
  submitDecision: 'اعتماد القرار',
  decidedTitle: 'اعتُمد المرشحون',
  decidedBody: 'أُرسل عرض الإسناد آليًا إلى المرشح الأعلى ترتيبًا في هذا المقعد.',
  fullRejectionTitle: 'رُفضت القائمة الجديدة بالكامل',
  fullRejectionBody: 'عاد المقعد إلى حالة الحاجة إلى مرشحين، ويمكن تشغيل دورة مطابقة جديدة.',
  notAuthorized: 'ليست لديك صلاحية هذا الإجراء على هذا المقعد.',

  errors: {
    loadTitle: 'تعذّر تحميل البيانات',
    loadBody: 'حدث خطأ أثناء التحميل. يُرجى المحاولة مرة أخرى.',
    noCycleTitle: 'لا توجد دورة إعادة توجيه لهذا المقعد',
    noCycleBody:
      'إعادة التوجيه متاحة فقط للمقعد الذي استُنفد جميع مرشحيه. المقعد المؤكَّد لا يُعاد فتحه.',
    actionFailed: 'تعذّر تنفيذ الإجراء. يُرجى المحاولة مرة أخرى.',
    poolSizeWrong: 'عدد المرشحين يجب أن يكون ثلاثة بالضبط لهذا المقعد.',
    decisionsIncomplete: 'يجب اتخاذ قرار لكل مرشح في القائمة.',
    rankingMismatch: 'ترتيب الأفضلية يجب أن يشمل المقبولين جميعًا دون سواهم.',
    staleState: 'تغيّرت حالة المقعد منذ فتح الصفحة، وعُرضت أحدث حالة له. راجعها ثم أعد المحاولة.',
    server: {
      'pool-size': 'عدد المرشحين يجب أن يكون ثلاثة بالضبط لهذا المقعد.',
      'excluded-candidate':
        'في القائمة مرشح لا يستوفي أحد المعايير الإقصائية اليوم. أزله واختر غيره.',
      'preference-order-invalid': 'ترتيب الأفضلية يجب أن يشمل المقبولين جميعًا دون سواهم.',
      'no-approved-candidate': 'اقبل مرشحًا واحدًا على الأقل، أو اتخذ قرارًا لكل مرشح.',
    },
    retry: 'إعادة المحاولة',
    backToRequest: 'العودة إلى الطلب',
  },
};

const en: ReRoutingContent = {
  documentTitle: (reference, slot) => `${reference} — re-routing slot ${slot}`,
  breadcrumbLabel: 'Breadcrumb',
  breadcrumbList: 'Assignment requests',
  breadcrumbRequest: 'Matching & nomination',
  heading: 'Re-routing after offer rejection',
  slotLabel: (slot) => `Slot ${slot}`,
  cycleLabel: (cycle) => `Cycle ${cycle}`,
  statuses: {
    [SLOT_CYCLE_STATUS.exhausted]: 'Needs new candidates',
    [SLOT_CYCLE_STATUS.awaitingApproval]: 'Awaiting the requesting party',
    [SLOT_CYCLE_STATUS.decided]: 'Decided',
  },

  exhaustedTitle: 'Every approved candidate for this slot is exhausted',
  exhaustedBody:
    'Every approved and ranked candidate for this slot rejected the offer or let it expire. Re-match this slot on its own.',
  noLimitNote:
    'The re-matching cycle repeats without limit, and repeating it triggers no escalation.',

  siblingsHeading: 'The request’s other slots',
  siblingsNote: 'These are unaffected by re-matching, and a confirmed slot is never reopened.',
  siblingStates: {
    confirmed: 'Engagement confirmed',
    'awaiting-response': 'Awaiting a candidate’s answer',
    exhausted: 'Needs new candidates',
    'no-offer': 'No live offer',
  },
  siblingRow: (slot) => `Slot ${slot}`,

  historyHeading: 'Previously nominated for this slot',
  historyNote:
    'None of them is excluded from the new cycle; any can be nominated again if they still match today.',
  historyOutcomes: {
    'awaiting-response': 'Awaiting their answer',
    accepted: 'Accepted',
    rejected: 'Explicitly rejected',
    expired: 'Expired with no response',
  },
  historyRow: (name, sentOn) => `${name} — offered on ${sentOn}`,

  cyclesHeading: 'This slot’s re-routing cycles',
  cycleRow: (cycle, openedOn) => `Cycle ${cycle} — opened on ${openedOn}`,

  matchHeading: 'New matching for this slot',
  matchNote: 'Matching is scoped to this slot alone, not to the whole request.',
  runEngine: 'Run the matching engine',
  running: 'Running…',
  modelVersion: () => 'Matching model: draft — the weights are not approved yet.',
  rankedHeading: 'Ranked candidates',
  scoreLabel: 'Score',
  criteria: {
    language: 'Language',
    'delivery-mode': 'Delivery mode',
    evaluation: 'Evaluation & classification',
  },
  excludedHeading: 'Excluded',
  excludedNote:
    'These candidates were excluded entirely for failing an exclusionary criterion, and cannot be nominated for this slot.',
  exclusionReasons: {
    specialization: 'Specialization does not match',
    location: 'City does not match',
    'schedule-conflict': 'Conflicts with a confirmed engagement',
    'file-status': 'File status is not active',
  },
  manualSearchLabel: 'Search by trainer name',
  selectedCount: (selected, required) => `${selected} of ${required} selected`,
  poolSizeNote: (required) => `One slot needs exactly ${required} candidates — no fewer, no more.`,
  sendPool: 'Send the list to the requesting party',
  priceLabel: 'Price',
  priceUnavailable: 'No price for this delivery mode in their agreement.',
  returningCandidate: 'Previously nominated for this slot',

  decisionHeading: 'Requesting party decision',
  decisionNote:
    'Review each candidate individually — approve or reject — then rank the approved by preference.',
  approve: 'Approve',
  reject: 'Reject',
  rankLabel: (name) => `Rank ${name}`,
  rankHint: 'Rank the approved candidates from most to least preferred.',
  submitDecision: 'Confirm the decision',
  decidedTitle: 'Candidates approved',
  decidedBody:
    'The assignment offer has gone automatically to the new top-ranked candidate for this slot.',
  fullRejectionTitle: 'The new list was rejected in full',
  fullRejectionBody: 'The slot needs candidates again, and a new matching cycle can simply be run.',
  notAuthorized: 'You do not have permission for this action on this slot.',

  errors: {
    loadTitle: 'Could not load the data',
    loadBody: 'Something went wrong while loading. Please try again.',
    noCycleTitle: 'This slot has no re-routing cycle',
    noCycleBody:
      'Re-routing is available only for a slot whose candidates are exhausted. A confirmed slot is never reopened.',
    actionFailed: 'The action could not be completed. Please try again.',
    poolSizeWrong: 'The list must hold exactly three candidates for this slot.',
    decisionsIncomplete: 'Every candidate in the list must be decided.',
    rankingMismatch: 'The preference order must contain exactly the approved candidates.',
    staleState:
      'The slot changed since this page opened, and its latest state is now shown. Review it and try again.',
    server: {
      'pool-size': 'The list must hold exactly three candidates for this slot.',
      'excluded-candidate':
        'A candidate in the list fails an exclusionary criterion today. Remove them and choose another.',
      'preference-order-invalid':
        'The preference order must contain exactly the approved candidates.',
      'no-approved-candidate': 'Approve at least one candidate, or decide every candidate.',
    },
    retry: 'Try again',
    backToRequest: 'Back to the request',
  },
};

const CONTENT: Record<Locale, ReRoutingContent> = { ar, en };

export function getReRoutingContent(locale: Locale): ReRoutingContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
