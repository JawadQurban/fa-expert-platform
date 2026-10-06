import type { Locale } from '@/types';
import type { EngagementStatus } from '../../contracts/engagementStatus';
import { arNumber } from '../../shared/formatting';

/**
 * J-21 copy — Arabic authoritative, English best-effort.
 *
 * What this copy is deliberate about:
 *
 * - **Completion is explained as a date.** F5/AC-1 makes it automatic, so a
 *   trainer who wonders why their engagement moved is told what moved it —
 *   rather than assuming someone closed it.
 * - **The enrollee list says why it holds only names.** F3/AC-2 is a privacy
 *   rule; a list with nothing but names looks incomplete unless it says it is
 *   deliberate.
 * - **Evaluations are labelled as MTM's raw values.** `02D` requires a raw
 *   source value to stay distinguishable from any calculated indicator, so the
 *   page never presents these as the trainer's rating.
 * - **A missing source says so.** Where the API answers `available: false`
 *   (`Q20` enrolment and attendance, `Q29` evaluations) or has no venue or
 *   meeting link, the copy names the gap instead of showing an empty list.
 *
 * Status labels live with the status vocabulary (`contracts/engagementStatus.ts`).
 */

export interface ExecutionContent {
  readonly documentTitle: (reference: string) => string;
  readonly breadcrumbLabel: string;
  readonly breadcrumbEngagements: string;
  readonly heading: string;
  readonly statusExplanation: Readonly<Record<EngagementStatus, string>>;
  readonly confirmedAt: (date: string) => string;

  /** F1/AC-3 — the plan's dates moved in FAST. */
  readonly scheduleChangedTitle: string;
  readonly scheduleChangedBody: (date: string) => string;

  readonly detailsHeading: string;

  /** F2 — the link or the venue. */
  readonly locationHeading: string;
  readonly onlineLabel: string;
  readonly joinAction: string;
  readonly meetingUnavailable: string;
  readonly venueLabel: string;
  /** No venue name or inside/outside-Academy scope reaches the API. */
  readonly venueUnavailable: string;

  /** F3 + F4 — the enrollees. */
  readonly enrolmentHeading: string;
  readonly enrolmentCount: (count: number) => string;
  readonly namesOnlyNote: string;
  readonly sourceNote: string;
  readonly enrolmentEmpty: string;
  /** `Q20` — FAST's `PlanTaker` is not supplied. */
  readonly enrolmentUnavailable: string;
  readonly attendanceHeading: string;
  readonly attendanceUnavailable: string;

  /** F6 — the MTM evaluations. */
  readonly evaluationsHeading: string;
  readonly evaluationsNote: string;
  readonly evaluationsEmpty: string;
  /** `Q29` — no MTM integration. */
  readonly evaluationsUnavailable: string;
  readonly evaluationValue: (value: string, low: string, high: string) => string;
  readonly evaluationReceived: (date: string) => string;
  readonly evaluationProgram: (program: string) => string;

  readonly errors: {
    readonly loadTitle: string;
    readonly loadBody: string;
    readonly notFoundTitle: string;
    readonly notFoundBody: string;
    readonly retry: string;
    readonly back: string;
  };
}

const fmtAr = (value: number) => arNumber(value);

const ar: ExecutionContent = {
  documentTitle: (reference) => `${reference} — متابعة الارتباط`,
  breadcrumbLabel: 'مسار التنقل',
  breadcrumbEngagements: 'ارتباطاتي',
  heading: 'متابعة الارتباط',
  statusExplanation: {
    upcoming: 'يبدأ التنفيذ في تاريخ بداية الخطة.',
    in_progress: 'التاريخ اليوم يقع داخل فترة تنفيذ الخطة.',
    completed:
      'انتقل الارتباط تلقائيًا إلى «الارتباطات السابقة» بعد تجاوز تاريخ نهاية الخطة، دون أي إجراء إداري.',
    withdrawn: 'أُنهي هذا الارتباط قبل موعد تنفيذه، وعاد المقعد إلى مسار المطابقة.',
    cancelled: 'أُلغيت الخطة بالكامل من قِبل الأكاديمية، فانتهى الارتباط المرتبط بها.',
  },
  confirmedAt: (date) => `تأكَّد في ${date}`,

  scheduleChangedTitle: 'تغيّرت مواعيد الخطة',
  scheduleChangedBody: (date) =>
    `حُدِّثت مواعيد الخطة في نظام FAST بتاريخ ${date}، والمواعيد المعروضة هنا هي المواعيد الجديدة.`,

  detailsHeading: 'بيانات البرنامج والخطة',

  locationHeading: 'مكان التنفيذ',
  onlineLabel: 'رابط الجلسة التدريبية',
  joinAction: 'فتح الجلسة',
  meetingUnavailable: 'لم يصل رابط الجلسة من نظام FAST بعد.',
  venueLabel: 'المقر',
  venueUnavailable: 'لم تصل تفاصيل المقر من نظام FAST بعد؛ المعروض هو المدينة المحددة في الطلب.',

  enrolmentHeading: 'المسجّلون',
  enrolmentCount: (count) => (count === 1 ? 'مسجّل واحد' : `${fmtAr(count)} مسجّلين`),
  namesOnlyNote: 'تُعرض الأسماء فقط، دون أي بيانات أخرى عن المسجّلين.',
  sourceNote: 'المصدر: جدول المسجّلين في نظام FAST.',
  enrolmentEmpty: 'لا يوجد مسجّلون بعد.',
  enrolmentUnavailable:
    'بيانات المسجّلين غير متاحة حاليًا؛ لم يُربط جدول المسجّلين في نظام FAST بالمنصة بعد.',
  attendanceHeading: 'الحضور والغياب',
  attendanceUnavailable:
    'بيانات الحضور غير متاحة حاليًا؛ لم يُربط مصدرها في نظام FAST بالمنصة بعد.',

  evaluationsHeading: 'تقييمات المتدربين',
  evaluationsNote:
    'تصل هذه التقييمات مباشرة من نظام MTM بقيمها كما وردت، وهي ليست التقييم المحتسب لملفك.',
  evaluationsEmpty: 'لم تصل تقييمات بعد.',
  evaluationsUnavailable: 'تقييمات المتدربين غير متاحة حاليًا؛ لم يُربط نظام MTM بالمنصة بعد.',
  evaluationValue: (value, low, high) => `${value} على مقياس من ${low} إلى ${high}`,
  evaluationReceived: (date) => `وردت في ${date}`,
  evaluationProgram: (program) => `البرنامج: ${program}`,

  errors: {
    loadTitle: 'تعذّر تحميل البيانات',
    loadBody: 'حدث خطأ أثناء التحميل. يُرجى المحاولة مرة أخرى.',
    notFoundTitle: 'الارتباط غير موجود',
    notFoundBody: 'لم يُعثر على هذا الارتباط ضمن ارتباطاتك.',
    retry: 'إعادة المحاولة',
    back: 'العودة إلى ارتباطاتي',
  },
};

const en: ExecutionContent = {
  documentTitle: (reference) => `${reference} — engagement follow-up`,
  breadcrumbLabel: 'Breadcrumb',
  breadcrumbEngagements: 'My engagements',
  heading: 'Engagement follow-up',
  statusExplanation: {
    upcoming: 'Delivery begins on the plan’s start date.',
    in_progress: 'Today falls inside the plan’s delivery window.',
    completed:
      'The engagement moved to “Past engagements” automatically once the plan’s end date passed — no administrative action was involved.',
    withdrawn: 'This engagement ended before its delivery date, and the slot returned to matching.',
    cancelled: 'The Academy cancelled the plan in full, so the engagement linked to it ended.',
  },
  confirmedAt: (date) => `Confirmed on ${date}`,

  scheduleChangedTitle: 'The plan’s dates changed',
  scheduleChangedBody: (date) =>
    `The plan’s dates were updated in FAST on ${date}; the dates shown here are the new ones.`,

  detailsHeading: 'Programme and plan details',

  locationHeading: 'Where it takes place',
  onlineLabel: 'Training session link',
  joinAction: 'Open the session',
  meetingUnavailable: 'The session link has not arrived from FAST yet.',
  venueLabel: 'Venue',
  venueUnavailable:
    'Venue details have not arrived from FAST yet; the city shown is the one on the request.',

  enrolmentHeading: 'Enrollees',
  enrolmentCount: (count) => (count === 1 ? '1 enrollee' : `${count} enrollees`),
  namesOnlyNote: 'Only names are shown — no other data about enrollees.',
  sourceNote: 'Source: the enrollee table in FAST.',
  enrolmentEmpty: 'Nobody has enrolled yet.',
  enrolmentUnavailable:
    'Enrollee data is not available yet; the FAST enrollee table is not connected to the platform.',
  attendanceHeading: 'Attendance',
  attendanceUnavailable:
    'Attendance data is not available yet; its FAST source is not connected to the platform.',

  evaluationsHeading: 'Trainee evaluations',
  evaluationsNote:
    'These arrive directly from MTM with the values as submitted; they are not the calculated rating on your profile.',
  evaluationsEmpty: 'No evaluations have arrived yet.',
  evaluationsUnavailable:
    'Trainee evaluations are not available yet; MTM is not connected to the platform.',
  evaluationValue: (value, low, high) => `${value} on a scale of ${low} to ${high}`,
  evaluationReceived: (date) => `Received on ${date}`,
  evaluationProgram: (program) => `Programme: ${program}`,

  errors: {
    loadTitle: 'Could not load the data',
    loadBody: 'Something went wrong while loading. Please try again.',
    notFoundTitle: 'Engagement not found',
    notFoundBody: 'It could not be found among your engagements.',
    retry: 'Try again',
    back: 'Back to my engagements',
  },
};

const CONTENT: Record<Locale, ExecutionContent> = { ar, en };

export function getExecutionContent(locale: Locale): ExecutionContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
