import type { Locale } from '@/types';
import {
  SUBMISSION_STATUS,
  type SubmissionKind,
  type SubmissionRoundDecision,
  type SubmissionStatus,
  type SubmissionSyncState,
} from './submission.types';
import { arNumber } from '../../shared/formatting';

/**
 * J-20 copy — Arabic authoritative, English best-effort.
 *
 * Three things this copy carries that the UI alone cannot:
 *
 * - **Why the upload slot is open**, which differs per path: FAST held "Not
 *   Available" (F1/AC-1) versus the engagement was confirmed (F4/AC-1). Without
 *   it, an upload box appearing on one engagement and not another looks
 *   arbitrary.
 * - **That there is no rejection.** The coordinator's second option is *asking
 *   for another upload*, so it is labelled as that and never as "reject".
 * - **That no approval deadline exists** (open item 1). Every other queue in
 *   this product shows an SLA; saying plainly that this one has none is better
 *   than an unexplained absence.
 */

export interface SubmissionsContent {
  readonly documentTitle: string;
  readonly title: string;
  readonly intro: string;
  readonly kinds: Readonly<Record<SubmissionKind, string>>;
  readonly kindReason: Readonly<Record<SubmissionKind, string>>;
  readonly statuses: Readonly<Record<SubmissionStatus, string>>;
  readonly emptyTitle: string;
  readonly emptyBody: string;
  readonly openedOn: (date: string) => string;

  /** The submitter's side. */
  readonly uploadHeading: string;
  readonly uploadLabel: string;
  /** `G26`/`G27` — only the name is recorded; said, not hidden. */
  readonly uploadHint: string;
  readonly uploadAction: string;
  readonly uploadedTitle: string;
  readonly uploadedBody: string;
  readonly changesRequestedTitle: string;
  readonly changesRequestedBody: string;
  readonly coordinatorNote: string;
  readonly approvedTitle: string;
  readonly approvedBody: Readonly<Record<SubmissionKind, string>>;

  /** The review history, shared by both sides. */
  readonly roundsHeading: string;
  readonly roundLabel: (round: number) => string;
  readonly roundPending: string;
  readonly roundOutcomes: Readonly<Record<SubmissionRoundDecision, string>>;
  readonly previewUnavailable: string;

  /** The coordinator's side. */
  readonly review: {
    readonly documentTitle: string;
    readonly queueTitle: string;
    readonly queueIntro: string;
    readonly breadcrumbLabel: string;
    readonly breadcrumbQueue: string;
    readonly emptyTitle: string;
    readonly emptyBody: string;
    readonly openAction: string;
    readonly detailTitle: string;
    readonly submittedBy: (name: string) => string;
    readonly decisionHeading: string;
    readonly decisionNote: string;
    readonly approve: string;
    readonly requestNewUpload: string;
    readonly noteLabel: string;
    readonly noteHint: string;
    readonly submitRequest: string;
    readonly cancel: string;
    readonly approvedTitle: string;
    readonly approvedSync: string;
    readonly approvedNoSync: string;
    readonly requestedTitle: string;
    readonly requestedBody: string;
    /** Open item 1 — stated, not invented. */
    readonly noSlaNote: string;
    readonly syncHeading: string;
    readonly syncStates: Readonly<Record<SubmissionSyncState, string>>;
    readonly syncDirectionNote: string;
  };

  readonly errors: {
    readonly loadTitle: string;
    readonly loadBody: string;
    readonly notFoundTitle: string;
    readonly notFoundBody: string;
    readonly actionFailed: string;
    readonly noteRequired: string;
    readonly retry: string;
    readonly back: string;
  };
}

const ar: SubmissionsContent = {
  documentTitle: 'المواد والمحتوى — منصة الخبراء',
  title: 'رفع المواد والمحتوى',
  intro: 'ما هو مطلوب منك رفعه على ارتباطاتك المؤكَّدة، وحالة اعتماده.',
  kinds: {
    'training-material': 'المادة العلمية',
    'service-content': 'المحتوى المرتبط بالخدمة',
  },
  kindReason: {
    'training-material': 'فُتح باب الرفع لأن الخطة لا تتضمن مادة علمية مرفقة.',
    'service-content': 'فُتح باب الرفع فور تأكيد ارتباطك، ولا يعتمد على أي حقل في نظام FAST.',
  },
  statuses: {
    [SUBMISSION_STATUS.awaitingUpload]: 'بانتظار الرفع',
    [SUBMISSION_STATUS.pendingApproval]: 'مرفوع — بانتظار الاعتماد',
    [SUBMISSION_STATUS.changesRequested]: 'مطلوب رفع نسخة جديدة',
    [SUBMISSION_STATUS.approved]: 'معتمد',
  },
  emptyTitle: 'لا توجد مواد مطلوبة منك',
  emptyBody: 'يظهر هنا ما يُطلب رفعه عند تأكيد ارتباط يستدعي ذلك.',
  openedOn: (date) => `فُتح باب الرفع في ${date}`,

  uploadHeading: 'رفع الملف',
  uploadLabel: 'اختر الملف',
  uploadHint:
    'يُسجَّل اسم الملف فقط حاليًا، ولا يُحفظ الملف نفسه إلى أن تُعتمد آلية حفظ المستندات.',
  uploadAction: 'رفع الملف',
  uploadedTitle: 'تم رفع الملف',
  uploadedBody: 'وصل الملف إلى منسّق البرنامج لمراجعته واعتماده.',
  changesRequestedTitle: 'مطلوب رفع نسخة جديدة',
  changesRequestedBody: 'راجع ملاحظة المنسّق أدناه ثم ارفع نسخة جديدة.',
  coordinatorNote: 'ملاحظة المنسّق',
  approvedTitle: 'اعتُمد الملف',
  approvedBody: {
    'training-material': 'أُرسلت نسخة من المادة لتحديث الخطة في نظام FAST.',
    'service-content': 'حُفظ المحتوى داخل المنصة، ولا تُرسل نسخة إلى نظام FAST في هذا المسار.',
  },

  roundsHeading: 'سجل المراجعة',
  roundLabel: (round) => `الجولة ${arNumber(round)}`,
  roundPending: 'بانتظار القرار',
  roundOutcomes: {
    [SUBMISSION_STATUS.approved]: 'اعتُمد',
    [SUBMISSION_STATUS.changesRequested]: 'طُلبت نسخة جديدة',
  },
  previewUnavailable:
    'المعاينة والتنزيل غير متاحين حاليًا، وسيُتاحان عند اعتماد آلية حفظ المستندات.',

  review: {
    documentTitle: 'مراجعة المواد والمحتوى — منصة الخبراء',
    queueTitle: 'المواد والمحتوى بانتظار الاعتماد',
    queueIntro: 'ما رفعه المدربون ومطوّرو المحتوى على ارتباطاتهم، بانتظار قرارك.',
    breadcrumbLabel: 'مسار التنقل',
    breadcrumbQueue: 'المواد والمحتوى',
    emptyTitle: 'لا يوجد ما ينتظر الاعتماد',
    emptyBody: 'يظهر هنا ما يرفعه أصحاب الارتباطات فور وصوله.',
    openAction: 'فتح',
    detailTitle: 'مراجعة الملف',
    submittedBy: (name) => `رفعه ${name}`,
    decisionHeading: 'القرار',
    decisionNote:
      'الخياران المتاحان: اعتماد الملف، أو إرسال ملاحظة تفتح فرصة رفع جديدة. لا يوجد رفض نهائي.',
    approve: 'اعتماد الملف',
    requestNewUpload: 'طلب رفع نسخة جديدة',
    noteLabel: 'الملاحظة',
    noteHint: 'وضّح المطلوب تعديله؛ تصل الملاحظة إلى صاحب الارتباط مع فرصة الرفع الجديدة.',
    submitRequest: 'إرسال الملاحظة',
    cancel: 'إلغاء',
    approvedTitle: 'اعتُمد الملف',
    approvedSync: 'أُرسلت نسخة لتحديث حقل المادة العلمية على الخطة في نظام FAST.',
    approvedNoSync: 'حُفظ المحتوى داخل المنصة، ولا يُزامَن مع نظام FAST في هذا المسار.',
    requestedTitle: 'أُرسلت الملاحظة',
    requestedBody: 'فُتحت فرصة رفع جديدة، وستُعاد المراجعة عند وصول النسخة الجديدة.',
    noSlaNote: '⚠️ لم تُحدَّد مدة قياسية للاعتماد في هذا المسار بعد.',
    syncHeading: 'المزامنة مع نظام FAST',
    syncStates: {
      none: 'لم تبدأ',
      processing: 'قيد المزامنة',
      synchronized: 'تمت المزامنة',
    },
    syncDirectionNote: 'تُدار حالة المادة داخل المنصة، والمزامنة باتجاه واحد: من المنصة إلى FAST.',
  },

  errors: {
    loadTitle: 'تعذّر تحميل البيانات',
    loadBody: 'حدث خطأ أثناء التحميل. يُرجى المحاولة مرة أخرى.',
    notFoundTitle: 'الملف غير موجود',
    notFoundBody: 'لم يُعثر على هذا الطلب، أو لم يعد بانتظار قرار.',
    actionFailed: 'تعذّر تنفيذ الإجراء. يُرجى المحاولة مرة أخرى.',
    noteRequired: 'الملاحظة مطلوبة عند طلب رفع نسخة جديدة.',
    retry: 'إعادة المحاولة',
    back: 'العودة',
  },
};

const en: SubmissionsContent = {
  documentTitle: 'Material & content — Expert Hub',
  title: 'Material & content submission',
  intro: 'What you have been asked to upload on your confirmed engagements, and where it stands.',
  kinds: {
    'training-material': 'Training material',
    'service-content': 'Service-linked content',
  },
  kindReason: {
    'training-material': 'Uploading is open because the plan carries no training material.',
    'service-content':
      'Uploading opened the moment your engagement was confirmed; it depends on no FAST field.',
  },
  statuses: {
    [SUBMISSION_STATUS.awaitingUpload]: 'Awaiting upload',
    [SUBMISSION_STATUS.pendingApproval]: 'Uploaded — pending approval',
    [SUBMISSION_STATUS.changesRequested]: 'A new upload is requested',
    [SUBMISSION_STATUS.approved]: 'Approved',
  },
  emptyTitle: 'Nothing is required from you',
  emptyBody: 'Anything you are asked to upload appears here when an engagement calls for it.',
  openedOn: (date) => `Upload opened on ${date}`,

  uploadHeading: 'Upload a file',
  uploadLabel: 'Choose a file',
  uploadHint:
    'For now only the file name is recorded; the file itself is not stored until document storage is approved.',
  uploadAction: 'Upload the file',
  uploadedTitle: 'File uploaded',
  uploadedBody: 'It has reached the programme coordinator for review and approval.',
  changesRequestedTitle: 'A new upload is requested',
  changesRequestedBody: 'Read the coordinator’s note below, then upload a new version.',
  coordinatorNote: 'Coordinator’s note',
  approvedTitle: 'File approved',
  approvedBody: {
    'training-material': 'A copy has been sent to update the plan in FAST.',
    'service-content': 'The content is stored in the platform; this path sends no copy to FAST.',
  },

  roundsHeading: 'Review history',
  roundLabel: (round) => `Round ${round}`,
  roundPending: 'Awaiting a decision',
  roundOutcomes: {
    [SUBMISSION_STATUS.approved]: 'Approved',
    [SUBMISSION_STATUS.changesRequested]: 'New upload requested',
  },
  previewUnavailable:
    'Preview and download are not available yet; they will be once document storage is approved.',

  review: {
    documentTitle: 'Material & content review — Expert Hub',
    queueTitle: 'Material & content awaiting approval',
    queueIntro:
      'What trainers and content developers have uploaded against their engagements, awaiting your decision.',
    breadcrumbLabel: 'Breadcrumb',
    breadcrumbQueue: 'Material & content',
    emptyTitle: 'Nothing is awaiting approval',
    emptyBody: 'Uploads appear here as soon as they arrive.',
    openAction: 'Open',
    detailTitle: 'Review the file',
    submittedBy: (name) => `Uploaded by ${name}`,
    decisionHeading: 'Decision',
    decisionNote:
      'Two options: approve the file, or send a note that opens a new upload opportunity. There is no outright rejection.',
    approve: 'Approve the file',
    requestNewUpload: 'Request a new upload',
    noteLabel: 'Note',
    noteHint:
      'Say what needs changing; the note reaches the submitter along with the new upload opportunity.',
    submitRequest: 'Send the note',
    cancel: 'Cancel',
    approvedTitle: 'File approved',
    approvedSync: 'A copy has been sent to update the training material field on the plan in FAST.',
    approvedNoSync: 'The content is stored in the platform; this path is not synced to FAST.',
    requestedTitle: 'Note sent',
    requestedBody:
      'A new upload opportunity is open, and review resumes when the new file arrives.',
    noSlaNote: '⚠️ No approval timeframe has been defined for this path yet.',
    syncHeading: 'FAST sync',
    syncStates: {
      none: 'Not started',
      processing: 'Syncing',
      synchronized: 'Synced',
    },
    syncDirectionNote:
      'Material status is managed inside the platform, and sync flows one way only: platform → FAST.',
  },

  errors: {
    loadTitle: 'Could not load the data',
    loadBody: 'Something went wrong while loading. Please try again.',
    notFoundTitle: 'Submission not found',
    notFoundBody: 'It could not be found, or it is no longer awaiting a decision.',
    actionFailed: 'The action could not be completed. Please try again.',
    noteRequired: 'A note is required when asking for a new upload.',
    retry: 'Try again',
    back: 'Back',
  },
};

const CONTENT: Record<Locale, SubmissionsContent> = { ar, en };

export function getSubmissionsContent(locale: Locale): SubmissionsContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
