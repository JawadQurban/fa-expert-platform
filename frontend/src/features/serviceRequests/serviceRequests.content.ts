import type { Locale } from '@/types';
import { getMyApplicationsContent } from '../applications/myApplications.content';
import {
  getDirectoryContent,
  getTrainerClassificationLabels,
} from '../directory/directory.content';
import type { ServiceRequestStatus, ServiceRequestValidationCode } from './serviceRequest.types';
import { arNumber } from '../../shared/formatting';

/**
 * EH-INT-02b (Service Requests) copy — Arabic authoritative, English
 * best-effort. Pages render structure only.
 *
 * Service, specialty and classification labels are reused from their single
 * approved sources so the same trainer is described with the same words on the
 * decision screen as on their own profile and in the public directory.
 *
 * **Rejection-reason labels are NOT here.** J-03's open item leaves it
 * unresolved whether the list is shared with CAP-02, so it arrives as served
 * configuration on the detail (`LocalizedText`) rather than as authored UI copy
 * that would quietly settle the question.
 */

export interface ServiceRequestsContent {
  readonly documentTitle: string;
  readonly listTitle: string;
  readonly listDescription: string;
  readonly pendingCount: (count: number) => string;
  readonly resultsLabel: string;
  readonly filters: {
    readonly regionLabel: string;
    readonly searchLabel: string;
    readonly searchPlaceholder: string;
    readonly serviceLabel: string;
    readonly statusLabel: string;
    readonly allOption: string;
    readonly clear: string;
    /** Introduces the row of currently-applied filters. */
    readonly activeHeading: string;
    /** Accessible name for a chip's remove control. */
    readonly removeFilter: (label: string, value: string) => string;
  };
  readonly columns: {
    readonly reference: string;
    readonly trainer: string;
    readonly service: string;
    readonly status: string;
    readonly submitted: string;
    readonly open: string;
  };
  readonly statuses: Readonly<Record<ServiceRequestStatus, string>>;
  readonly empty: { readonly title: string; readonly body: string };

  readonly detail: {
    readonly documentTitle: (reference: string) => string;
    readonly breadcrumbLabel: string;
    readonly breadcrumbList: string;
    readonly heading: string;
    readonly requestedServiceLabel: string;
    readonly submittedAtLabel: string;
    /** F1/AC-2 — only the delta was collected, so the panel says so. */
    readonly submittedHeading: string;
    readonly submittedEmpty: string;
    readonly attachmentsHeading: string;
    readonly attachmentsEmpty: string;
    /** F2/AC-1 — the trainer's full approved profile, beside the request. */
    readonly context: {
      readonly heading: string;
      readonly description: string;
      readonly servicesLabel: string;
      readonly specialtiesLabel: string;
      readonly classificationLabel: string;
      readonly evaluationLabel: string;
      readonly evaluationPending: string;
      readonly agreementLabel: string;
      readonly agreementEndsAt: (date: string) => string;
      readonly agreementNone: string;
    };
  };

  /** F3 — the single administrative decision. */
  readonly decision: {
    readonly heading: string;
    /** F3/AC-1 — stated, because a missing screening step should not look lost. */
    readonly directRouteNote: string;
    readonly approve: string;
    readonly reject: string;
    readonly blocked: Readonly<Record<'not-authorized' | 'already-decided', string>>;
    readonly errors: Readonly<Record<ServiceRequestValidationCode, string>>;
    readonly approveDialog: {
      readonly title: string;
      readonly body: string;
      /** F3/AC-4 — the addendum is the thing that finalizes the approval. */
      readonly addendumLabel: string;
      readonly addendumHint: string;
      readonly browseLabel: string;
      readonly removeLabel: string;
      readonly noteLabel: string;
      readonly noSignatureNote: string;
      readonly confirm: string;
      readonly cancel: string;
      readonly dismiss: string;
      readonly formatError: string;
      readonly sizeError: string;
      /** 422 — the server refused the file under the same rule. */
      readonly uploadRefused: string;
      /** 400 `file-required` — an empty file. */
      readonly uploadEmpty: string;
      readonly uploadForbidden: string;
      readonly uploadFailed: string;
    };
    readonly rejectDialog: {
      readonly title: string;
      readonly body: string;
      readonly reasonLabel: string;
      readonly reasonPlaceholder: string;
      readonly otherLabel: string;
      /** F3/AC-7 — the trainer is told the outcome, never the reason. */
      readonly reasonPrivacyNote: string;
      readonly confirm: string;
      readonly cancel: string;
      readonly dismiss: string;
    };
    readonly outcome: {
      readonly approvedTitle: string;
      readonly approvedBody: (service: string) => string;
      readonly rejectedTitle: string;
      readonly decidedBy: (name: string, date: string) => string;
      readonly addendumLabel: string;
      readonly reasonLabel: string;
    };
  };

  readonly success: { readonly approved: string; readonly rejected: string };
  readonly errors: {
    readonly loadTitle: string;
    readonly loadBody: string;
    readonly notFoundTitle: string;
    readonly notFoundBody: string;
    readonly unauthorizedTitle: string;
    readonly unauthorizedBody: string;
    readonly actionFailed: string;
    readonly retry: string;
    readonly backToList: string;
  };

  readonly services: ReturnType<typeof getMyApplicationsContent>['services'];
  readonly specialties: ReturnType<typeof getDirectoryContent>['specialties'];
  readonly classifications: ReturnType<typeof getTrainerClassificationLabels>;
}

const ar: ServiceRequestsContent = {
  documentTitle: 'طلبات إضافة الخدمات — منصة الخبراء',
  listTitle: 'طلبات إضافة الخدمات',
  listDescription:
    'طلبات المدربين المعتمدين لتوسيع نطاق خدماتهم. تُحال مباشرة إلى القرار الإداري دون فرز أو مقابلة.',
  pendingCount: (count) =>
    count === 1 ? 'طلب واحد بانتظار القرار' : `${arNumber(count)} طلبات بانتظار القرار`,
  resultsLabel: 'طلبات إضافة الخدمات',
  filters: {
    regionLabel: 'تصفية الطلبات',
    searchLabel: 'بحث باسم المدرب',
    searchPlaceholder: 'اكتب اسم المدرب',
    serviceLabel: 'الخدمة المطلوبة',
    statusLabel: 'الحالة',
    allOption: 'الكل',
    clear: 'مسح التصفية',
    activeHeading: 'التصفية النشطة:',
    removeFilter: (label, value) => `أزل تصفية ${label}: ${value}`,
  },
  columns: {
    reference: 'رقم الطلب',
    trainer: 'المدرب',
    service: 'الخدمة المطلوبة',
    status: 'الحالة',
    submitted: 'تاريخ التقديم',
    open: 'فتح الطلب',
  },
  statuses: {
    pending: 'بانتظار القرار',
    approved: 'معتمد',
    rejected: 'مرفوض',
  },
  empty: {
    title: 'لا توجد طلبات مطابقة',
    body: 'لم نعثر على طلبات تطابق هذه التصفية. جرّب توسيع نطاق البحث.',
  },

  detail: {
    documentTitle: (reference) => `${reference} — طلب إضافة خدمة`,
    breadcrumbLabel: 'مسار التنقل',
    breadcrumbList: 'طلبات إضافة الخدمات',
    heading: 'طلب إضافة خدمة',
    requestedServiceLabel: 'الخدمة المطلوبة',
    submittedAtLabel: 'تاريخ التقديم',
    submittedHeading: 'البيانات المُقدَّمة',
    submittedEmpty: 'لم تُطلب بيانات إضافية لهذه الخدمة؛ ملف المدرب يغطيها بالكامل.',
    attachmentsHeading: 'المرفقات',
    attachmentsEmpty: 'لا توجد مرفقات مطلوبة لهذه الخدمة.',
    context: {
      heading: 'ملف المدرب المعتمد',
      description: 'يُتخذ القرار على ضوء ملف المدرب الكامل، لا على الطلب منفردًا.',
      servicesLabel: 'الخدمات المعتمدة حاليًا',
      specialtiesLabel: 'مجالات التخصص',
      classificationLabel: 'التصنيف',
      evaluationLabel: 'التقييم العام',
      evaluationPending: 'لم يُحتسب بعد',
      agreementLabel: 'الاتفاقية السارية',
      agreementEndsAt: (date) => `تنتهي بتاريخ ${date}`,
      agreementNone: 'لا توجد اتفاقية سارية',
    },
  },

  decision: {
    heading: 'القرار الإداري',
    directRouteNote:
      'يُحال هذا الطلب مباشرة إلى القرار الإداري: لا فرز ولا مقابلة، لأن اعتماد المدرب قائم بالفعل.',
    approve: 'اعتماد الطلب',
    reject: 'رفض الطلب',
    blocked: {
      'not-authorized': 'ليست لديك صلاحية اتخاذ القرار على هذا الطلب.',
      'already-decided': 'صدر القرار على هذا الطلب.',
    },
    errors: {
      'addendum-missing': 'يجب إرفاق ملحق الاتفاقية قبل اعتماد الطلب.',
      'reason-missing': 'يجب اختيار سبب الرفض.',
      'reason-text-missing': 'يجب كتابة السبب عند اختيار «سبب آخر».',
    },
    approveDialog: {
      title: 'اعتماد الطلب وإرفاق الملحق',
      body: 'لا يكتمل الاعتماد إلا بإرفاق ملحق الاتفاقية الحالية للمدرب.',
      addendumLabel: 'ملحق الاتفاقية',
      addendumHint: 'الصيغ المقبولة: pdf, doc, docx — الحد الأقصى 1 م.ب.',
      browseLabel: 'اختر ملفًا',
      removeLabel: 'إزالة',
      noteLabel: 'ملاحظة داخلية (اختياري)',
      noSignatureNote:
        'لا تُنشأ اتفاقية جديدة ولا يُطلب توقيع إلكتروني إضافي؛ الملحق يُضاف إلى الاتفاقية القائمة.',
      confirm: 'اعتماد وإرفاق الملحق',
      cancel: 'إلغاء',
      dismiss: 'إغلاق',
      formatError: 'صيغة الملف غير مقبولة. الصيغ المسموحة: pdf, doc, docx.',
      sizeError: 'حجم الملف يتجاوز الحد الأقصى (1 م.ب).',
      uploadRefused: 'رُفض الملف: يجب أن يكون pdf أو doc أو docx وألا يتجاوز 1 م.ب.',
      uploadEmpty: 'الملف فارغ. اختر ملفًا آخر.',
      uploadForbidden: 'ليست لديك صلاحية رفع ملحق الاتفاقية.',
      uploadFailed: 'تعذّر رفع الملحق. يُرجى المحاولة مرة أخرى.',
    },
    rejectDialog: {
      title: 'رفض الطلب',
      body: 'اختر سبب الرفض من القائمة المعتمدة.',
      reasonLabel: 'سبب الرفض',
      reasonPlaceholder: 'اختر السبب',
      otherLabel: 'وضّح السبب',
      reasonPrivacyNote: 'يُبلَّغ المدرب بنتيجة الطلب دون ذكر السبب. السبب للسجل الداخلي فقط.',
      confirm: 'تأكيد الرفض',
      cancel: 'إلغاء',
      dismiss: 'إغلاق',
    },
    outcome: {
      approvedTitle: 'اعتُمد الطلب',
      approvedBody: (service) => `أُضيفت خدمة «${service}» إلى نطاق المدرب المعتمد.`,
      rejectedTitle: 'رُفض الطلب',
      decidedBy: (name, date) => `${name} — ${date}`,
      addendumLabel: 'الملحق المرفق',
      reasonLabel: 'سبب الرفض (داخلي)',
    },
  },

  success: {
    approved: 'اعتُمد الطلب وأُرفق الملحق.',
    rejected: 'سُجّل رفض الطلب.',
  },
  errors: {
    loadTitle: 'تعذّر تحميل الطلبات',
    loadBody: 'حدث خطأ أثناء التحميل. يُرجى المحاولة مرة أخرى.',
    notFoundTitle: 'الطلب غير موجود',
    notFoundBody: 'تعذّر العثور على هذا الطلب.',
    unauthorizedTitle: 'لا تملك صلاحية الوصول',
    unauthorizedBody: 'هذه الصفحة متاحة لأصحاب الصلاحية فقط.',
    actionFailed: 'تعذّر تنفيذ القرار. يُرجى المحاولة مرة أخرى.',
    retry: 'إعادة المحاولة',
    backToList: 'العودة إلى الطلبات',
  },

  services: getMyApplicationsContent('ar').services,
  specialties: getDirectoryContent('ar').specialties,
  classifications: getTrainerClassificationLabels('ar'),
};

const en: ServiceRequestsContent = {
  documentTitle: 'Service addition requests — Expert Hub',
  listTitle: 'Service addition requests',
  listDescription:
    'Requests from accredited trainers to widen their scope. These route straight to an administrative decision — no screening, no interview.',
  pendingCount: (count) =>
    count === 1 ? '1 request awaiting a decision' : `${count} requests awaiting a decision`,
  resultsLabel: 'Service addition requests',
  filters: {
    regionLabel: 'Filter requests',
    searchLabel: 'Search by trainer name',
    searchPlaceholder: 'Type a trainer name',
    serviceLabel: 'Requested service',
    statusLabel: 'Status',
    allOption: 'All',
    clear: 'Clear filters',
    activeHeading: 'Active filters:',
    removeFilter: (label, value) => `Remove ${label} filter: ${value}`,
  },
  columns: {
    reference: 'Reference',
    trainer: 'Trainer',
    service: 'Requested service',
    status: 'Status',
    submitted: 'Submitted',
    open: 'Open request',
  },
  statuses: {
    pending: 'Awaiting decision',
    approved: 'Approved',
    rejected: 'Rejected',
  },
  empty: {
    title: 'No matching requests',
    body: 'No requests match this filter. Try broadening your search.',
  },

  detail: {
    documentTitle: (reference) => `${reference} — service addition request`,
    breadcrumbLabel: 'Breadcrumb',
    breadcrumbList: 'Service addition requests',
    heading: 'Service addition request',
    requestedServiceLabel: 'Requested service',
    submittedAtLabel: 'Submitted',
    submittedHeading: 'Submitted data',
    submittedEmpty: 'No extra data was requested for this service; the profile already covers it.',
    attachmentsHeading: 'Attachments',
    attachmentsEmpty: 'No attachments are required for this service.',
    context: {
      heading: "The trainer's approved profile",
      description: 'The decision is made against the full profile, not the request in isolation.',
      servicesLabel: 'Currently approved services',
      specialtiesLabel: 'Areas of specialty',
      classificationLabel: 'Classification',
      evaluationLabel: 'Overall evaluation',
      evaluationPending: 'Not calculated yet',
      agreementLabel: 'Active agreement',
      agreementEndsAt: (date) => `Ends on ${date}`,
      agreementNone: 'No active agreement',
    },
  },

  decision: {
    heading: 'Administrative decision',
    directRouteNote:
      'This request goes straight to an administrative decision: no screening and no interview, because the trainer is already accredited.',
    approve: 'Approve the request',
    reject: 'Reject the request',
    blocked: {
      'not-authorized': 'You do not have permission to decide on this request.',
      'already-decided': 'This request has already been decided.',
    },
    errors: {
      'addendum-missing': 'Attach the agreement addendum before approving.',
      'reason-missing': 'Select a rejection reason.',
      'reason-text-missing': 'Describe the reason when choosing “Other”.',
    },
    approveDialog: {
      title: 'Approve and attach the addendum',
      body: "The approval is not final until the addendum to the trainer's existing agreement is attached.",
      addendumLabel: 'Agreement addendum',
      addendumHint: 'Accepted formats: pdf, doc, docx — up to 1 MB.',
      browseLabel: 'Choose a file',
      removeLabel: 'Remove',
      noteLabel: 'Internal note (optional)',
      noSignatureNote:
        'No new agreement is created and no additional e-signature is required; the addendum attaches to the existing agreement.',
      confirm: 'Approve and attach',
      cancel: 'Cancel',
      dismiss: 'Close',
      formatError: 'File format not accepted. Allowed: pdf, doc, docx.',
      sizeError: 'The file exceeds the maximum size (1 MB).',
      uploadRefused: 'The file was refused: it must be a pdf, doc or docx of 1 MB or less.',
      uploadEmpty: 'The file is empty. Choose another file.',
      uploadForbidden: 'You do not have permission to upload the agreement addendum.',
      uploadFailed: 'The addendum could not be uploaded. Please try again.',
    },
    rejectDialog: {
      title: 'Reject the request',
      body: 'Choose a reason from the approved list.',
      reasonLabel: 'Rejection reason',
      reasonPlaceholder: 'Select a reason',
      otherLabel: 'Describe the reason',
      reasonPrivacyNote:
        'The trainer is notified of the outcome without the reason. The reason is for the internal record only.',
      confirm: 'Confirm rejection',
      cancel: 'Cancel',
      dismiss: 'Close',
    },
    outcome: {
      approvedTitle: 'Request approved',
      approvedBody: (service) => `“${service}” was added to the trainer’s approved scope.`,
      rejectedTitle: 'Request rejected',
      decidedBy: (name, date) => `${name} — ${date}`,
      addendumLabel: 'Attached addendum',
      reasonLabel: 'Rejection reason (internal)',
    },
  },

  success: {
    approved: 'The request was approved and the addendum attached.',
    rejected: 'The rejection was recorded.',
  },
  errors: {
    loadTitle: 'Could not load the requests',
    loadBody: 'Something went wrong while loading. Please try again.',
    notFoundTitle: 'Request not found',
    notFoundBody: 'We could not find this request.',
    unauthorizedTitle: 'You do not have access',
    unauthorizedBody: 'This page is available to authorized staff only.',
    actionFailed: 'The decision could not be recorded. Please try again.',
    retry: 'Try again',
    backToList: 'Back to requests',
  },

  services: getMyApplicationsContent('en').services,
  specialties: getDirectoryContent('en').specialties,
  classifications: getTrainerClassificationLabels('en'),
};

const CONTENT: Record<Locale, ServiceRequestsContent> = { ar, en };

export function getServiceRequestsContent(locale: Locale): ServiceRequestsContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
