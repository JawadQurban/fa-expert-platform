import type { Locale } from '@/types';
import type {
  DeliveryMechanism,
  OfferStatus,
  RequestLanguage,
  SlotSyncState,
  TrainingMaterialStatus,
} from './offer.types';
import { arNumber } from '../../shared/formatting';

/**
 * J-18 copy — Arabic authoritative, English best-effort.
 *
 * Three things this copy is deliberate about:
 *
 * - **Nobody is told they "sent" an offer.** F1/AC-1 makes sending automatic, so
 *   the internal panel reports what the system did; it never offers a verb the
 *   contract cannot honour.
 * - **Expiry reads differently from rejection.** F2/AC-4 requires a distinct
 *   notification, and a shared label would erase the distinction at the last
 *   step.
 * - **The training-material status is named, not reduced to yes/no.** F5/AC-1 is
 *   explicit that it is a defined list; the trainer is shown where their
 *   material stands.
 *
 * Engagement status labels are not here: they live with the status vocabulary
 * in `contracts/engagementStatus.ts`, which every page reads.
 */

export interface EngagementsContent {
  readonly documentTitle: string;
  readonly title: string;
  readonly intro: string;

  readonly offers: {
    readonly heading: string;
    readonly description: string;
    readonly emptyTitle: string;
    readonly emptyBody: string;
    readonly slotLabel: (slot: number) => string;
    readonly windowNote: string;
    readonly slaRemaining: (days: number) => string;
    readonly slaLastDay: string;
    readonly slaExpired: string;
    readonly detailsHeading: string;
    readonly priceLabel: string;
    readonly priceUnavailable: string;
    readonly accept: string;
    readonly reject: string;
    readonly irreversibleNote: string;
    readonly acceptedTitle: string;
    readonly acceptedBody: string;
    readonly rejectedTitle: string;
    readonly rejectedBody: string;
    readonly goneTitle: string;
    readonly goneBody: string;
  };

  readonly fields: {
    readonly programName: string;
    readonly reference: string;
    readonly specialization: string;
    readonly days: string;
    readonly language: string;
    readonly deliveryMode: string;
    readonly city: string;
    readonly schedule: string;
  };
  readonly deliveryModes: Readonly<Record<DeliveryMechanism, string>>;
  readonly languages: Readonly<Record<RequestLanguage, string>>;

  readonly engagements: {
    readonly heading: string;
    readonly description: string;
    readonly emptyTitle: string;
    readonly emptyBody: string;
    readonly confirmedAt: (date: string) => string;
    readonly materialHeading: string;
    readonly materialStatusLabel: string;
    readonly statuses: Readonly<Record<TrainingMaterialStatus, string>>;
    readonly uploadTitle: string;
    readonly uploadBody: string;
    /** The way into J-20's submission path. */
    readonly uploadAction: string;
    /** J-21/F5/AC-2 — the dashboard splits active from completed. */
    readonly pastHeading: string;
    readonly pastDescription: string;
    readonly pastEmptyTitle: string;
    readonly pastEmptyBody: string;
    /** The way into J-21's follow-up page. */
    readonly followUpAction: string;
  };

  readonly tracking: {
    readonly heading: string;
    readonly description: string;
    readonly automaticNote: string;
    readonly slotHeading: (slot: number) => string;
    readonly awaiting: (name: string) => string;
    readonly sentAt: (date: string) => string;
    readonly noOffer: string;
    readonly confirmed: (name: string) => string;
    readonly backupsHeading: string;
    readonly backupsEmpty: string;
    readonly backupRow: (rank: number, name: string) => string;
    readonly historyHeading: string;
    /** The live offer is part of the history too, as the server serves it. */
    readonly outcomes: Readonly<Record<OfferStatus, string>>;
    readonly fastHeading: string;
    readonly fastStates: Readonly<Record<SlotSyncState, string>>;
    readonly exhaustedTitle: string;
    readonly exhaustedBody: string;
    /** J-19's entry point — the slot needs a new candidate set. */
    readonly reRouteAction: string;
    readonly notificationNote: string;
  };

  readonly errors: {
    readonly loadTitle: string;
    readonly loadBody: string;
    readonly actionFailed: string;
    readonly retry: string;
  };
}

const fmtAr = (value: number) => arNumber(value);

const ar: EngagementsContent = {
  documentTitle: 'ارتباطاتي — منصة الخبراء',
  title: 'ارتباطاتي',
  intro: 'استعرض عروض الإسناد الواردة إليك وارتباطاتك المؤكَّدة.',

  offers: {
    heading: 'عروض الإسناد',
    description: 'يصلك عرض الإسناد بعد اعتماد الجهة الطالبة لترشيحك. لديك ثلاثة أيام للرد.',
    emptyTitle: 'لا توجد عروض بانتظار ردّك',
    emptyBody: 'سيصلك عرض إسناد عند اعتماد ترشيحك لأحد الطلبات.',
    slotLabel: (slot) => `المقعد رقم ${fmtAr(slot)}`,
    windowNote:
      'مدة الرد ثلاثة أيام. إن انقضت دون ردّ ينتهي العرض تلقائيًا وينتقل إلى المرشح التالي.',
    slaRemaining: (days) => `متبقٍ ${fmtAr(days)} أيام للرد`,
    slaLastDay: 'اليوم الأخير للرد',
    slaExpired: 'انتهت مدة الرد',
    detailsHeading: 'بيانات البرنامج والخطة',
    priceLabel: 'الأتعاب',
    priceUnavailable: 'غير محدَّدة',
    accept: 'قبول العرض',
    reject: 'رفض العرض',
    irreversibleNote:
      'القرار نهائي ولا يمكن التراجع عنه؛ وعند الرفض ينتقل العرض إلى المرشح التالي.',
    acceptedTitle: 'تأكَّد ارتباطك',
    acceptedBody: 'أُضيف الارتباط إلى «ارتباطاتي المؤكَّدة» أدناه.',
    rejectedTitle: 'رُفض العرض',
    rejectedBody: 'انتقل العرض إلى المرشح التالي في القائمة المعتمدة.',
    goneTitle: 'لم يعد العرض متاحًا',
    goneBody: 'انتهت مدة الرد على هذا العرض أو تغيّرت حالته. حدِّث الصفحة للاطلاع على الجديد.',
  },

  fields: {
    programName: 'اسم البرنامج',
    reference: 'رقم الطلب',
    specialization: 'مجال التخصص',
    days: 'عدد الأيام',
    language: 'لغة التقديم',
    deliveryMode: 'آلية التنفيذ',
    city: 'المدينة',
    schedule: 'تاريخ البداية والنهاية',
  },
  deliveryModes: { onsite: 'حضوري', online: 'عن بُعد', 'live-stream': 'بث مباشر' },
  languages: { ar: 'العربية', en: 'الإنجليزية' },

  engagements: {
    heading: 'ارتباطاتي المؤكَّدة',
    description: 'الارتباطات التي قبلتها، لمتابعتها حتى التنفيذ.',
    emptyTitle: 'لا توجد ارتباطات مؤكَّدة حاليًا',
    emptyBody: 'سيظهر الارتباط هنا فور قبولك لعرض الإسناد.',
    confirmedAt: (date) => `تأكَّد في ${date}`,
    materialHeading: 'المادة العلمية',
    materialStatusLabel: 'حالة المادة العلمية',
    statuses: {
      awaiting_upload: 'بانتظار الرفع',
      pending_approval: 'بانتظار الاعتماد',
      changes_requested: 'مطلوب تعديلات',
      approved: 'معتمدة',
    },
    uploadTitle: 'يمكنك رفع مادتك العلمية',
    uploadBody: 'ارفع مادتك العلمية عبر مسار تسليم المحتوى لتُراجَع وتُعتمد.',
    uploadAction: 'رفع المادة العلمية',
    pastHeading: 'الارتباطات السابقة',
    pastDescription:
      'ارتباطات انتهى تنفيذها بعد تجاوز تاريخ نهاية الخطة، أو أُنهيت قبل موعدها أو أُلغيت.',
    pastEmptyTitle: 'لا توجد ارتباطات سابقة',
    pastEmptyBody:
      'ينتقل الارتباط إلى هنا تلقائيًا عند انتهاء موعد تنفيذه، أو عند إنهائه قبل موعده أو إلغائه.',
    followUpAction: 'متابعة التنفيذ',
  },

  tracking: {
    heading: 'متابعة عروض الإسناد',
    description: 'حالة العرض القائم لكل مقعد، والمرشحون الاحتياطيون، وسجل الردود.',
    automaticNote: 'تُرسل العروض آليًا للمرشح الأعلى ترتيبًا في كل مقعد، دون أي إجراء يدوي.',
    slotHeading: (slot) => `المقعد رقم ${fmtAr(slot)}`,
    awaiting: (name) => `بانتظار رد ${name}`,
    sentAt: (date) => `أُرسل في ${date}`,
    noOffer: 'لا يوجد عرض قائم على هذا المقعد.',
    confirmed: (name) => `تأكَّد الارتباط مع ${name}`,
    backupsHeading: 'المرشحون الاحتياطيون',
    backupsEmpty: 'لا يوجد مرشحون احتياطيون متبقّون.',
    backupRow: (rank, name) => `${fmtAr(rank)}. ${name}`,
    historyHeading: 'سجل الردود',
    outcomes: {
      'awaiting-response': 'بانتظار الرد',
      accepted: 'قبول',
      rejected: 'رفض صريح',
      expired: 'انتهاء المدة دون رد',
    },
    fastHeading: 'المزامنة مع نظام FAST',
    fastStates: {
      none: 'لم تبدأ',
      processing: 'قيد المزامنة',
      synchronized: 'تمت المزامنة',
    },
    exhaustedTitle: 'استُنفد المرشحون على هذا المقعد',
    exhaustedBody: 'رفض جميع المرشحين المعتمدين أو انتهت مدة ردّهم، ويُفعَّل مسار إعادة التوجيه.',
    reRouteAction: 'إعادة توجيه هذا المقعد',
    notificationNote: 'إشعارات الرفض وانتهاء المدة تتبع مصفوفة الإشعارات، وهي غير معتمدة بعد.',
  },

  errors: {
    loadTitle: 'تعذّر تحميل البيانات',
    loadBody: 'حدث خطأ أثناء التحميل. يُرجى المحاولة مرة أخرى.',
    actionFailed: 'تعذّر تنفيذ الإجراء. يُرجى المحاولة مرة أخرى.',
    retry: 'إعادة المحاولة',
  },
};

const en: EngagementsContent = {
  documentTitle: 'My engagements — Expert Hub',
  title: 'My engagements',
  intro: 'Browse the assignment offers waiting on you and the engagements you have confirmed.',

  offers: {
    heading: 'Assignment offers',
    description:
      'An assignment offer reaches you once the requesting party approves your nomination. You have three days to respond.',
    emptyTitle: 'No offers are waiting on you',
    emptyBody: 'An offer will arrive when your nomination is approved for a request.',
    slotLabel: (slot) => `Slot ${slot}`,
    windowNote:
      'The response window is three days. If it passes with no answer the offer expires automatically and moves to the next candidate.',
    slaRemaining: (days) => `${days} days left to respond`,
    slaLastDay: 'Last day to respond',
    slaExpired: 'The response window has closed',
    detailsHeading: 'Programme and plan details',
    priceLabel: 'Fee',
    priceUnavailable: 'Not set',
    accept: 'Accept the offer',
    reject: 'Reject the offer',
    irreversibleNote:
      'This decision is final and cannot be undone; on rejection the offer moves to the next candidate.',
    acceptedTitle: 'Your engagement is confirmed',
    acceptedBody: 'It has been added to “Confirmed engagements” below.',
    rejectedTitle: 'Offer rejected',
    rejectedBody: 'The offer has moved to the next candidate on the approved list.',
    goneTitle: 'This offer is no longer open',
    goneBody:
      'Its response window closed or its status changed. Refresh the page to see the current state.',
  },

  fields: {
    programName: 'Programme name',
    reference: 'Request reference',
    specialization: 'Specialization / domain',
    days: 'Number of days',
    language: 'Language',
    deliveryMode: 'Delivery mode',
    city: 'City',
    schedule: 'Start and end date',
  },
  deliveryModes: { onsite: 'In person', online: 'Online', 'live-stream': 'Live stream' },
  languages: { ar: 'Arabic', en: 'English' },

  engagements: {
    heading: 'Confirmed engagements',
    description: 'The engagements you accepted, to track through to delivery.',
    emptyTitle: 'No confirmed engagements yet',
    emptyBody: 'An engagement will appear here as soon as you accept an assignment offer.',
    confirmedAt: (date) => `Confirmed on ${date}`,
    materialHeading: 'Training material',
    materialStatusLabel: 'Training material status',
    statuses: {
      awaiting_upload: 'Awaiting upload',
      pending_approval: 'Pending approval',
      changes_requested: 'Changes requested',
      approved: 'Approved',
    },
    uploadTitle: 'You can upload your training material',
    uploadBody: 'Submit your training material through the content submission path for review.',
    uploadAction: 'Upload training material',
    pastHeading: 'Past engagements',
    pastDescription:
      'Engagements that finished once the plan’s end date passed, or that were ended early or cancelled.',
    pastEmptyTitle: 'No past engagements',
    pastEmptyBody:
      'An engagement moves here automatically once its delivery window ends, or as soon as it is ended early or cancelled.',
    followUpAction: 'Follow up on delivery',
  },

  tracking: {
    heading: 'Offer tracking',
    description: 'The live offer on each slot, the ranked backups, and the response history.',
    automaticNote:
      'Offers are sent automatically to the top-ranked candidate on each slot, with no manual action.',
    slotHeading: (slot) => `Slot ${slot}`,
    awaiting: (name) => `Awaiting a response from ${name}`,
    sentAt: (date) => `Sent on ${date}`,
    noOffer: 'No live offer on this slot.',
    confirmed: (name) => `Engagement confirmed with ${name}`,
    backupsHeading: 'Ranked backups',
    backupsEmpty: 'No backups remain.',
    backupRow: (rank, name) => `${rank}. ${name}`,
    historyHeading: 'Response history',
    outcomes: {
      'awaiting-response': 'Awaiting a response',
      accepted: 'Accepted',
      rejected: 'Explicitly rejected',
      expired: 'Expired with no response',
    },
    fastHeading: 'FAST sync',
    fastStates: {
      none: 'Not started',
      processing: 'Syncing',
      synchronized: 'Synced',
    },
    exhaustedTitle: 'Candidates exhausted on this slot',
    exhaustedBody:
      'Every approved candidate rejected the offer or let it expire, so re-routing is triggered.',
    reRouteAction: 'Re-route this slot',
    notificationNote:
      'Rejection and expiry notifications follow the Notification Matrix, which is not approved yet.',
  },

  errors: {
    loadTitle: 'Could not load the data',
    loadBody: 'Something went wrong while loading. Please try again.',
    actionFailed: 'The action could not be completed. Please try again.',
    retry: 'Try again',
  },
};

const CONTENT: Record<Locale, EngagementsContent> = { ar, en };

export function getEngagementsContent(locale: Locale): EngagementsContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
