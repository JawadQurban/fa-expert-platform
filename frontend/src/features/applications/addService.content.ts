import type { Locale } from '@/types';
import type { ApplicationService } from './application.types';
import { getMyApplicationsContent } from './myApplications.content';

/**
 * EH-TP-06 (Add Service) copy — Arabic authoritative, English best-effort. The
 * page renders structure only; service labels are reused from
 * `myApplications.content` (single source). Field-level copy comes from
 * `newApplication.content` (the shared form engine).
 */
export interface AddServiceContent {
  readonly documentTitle: string;
  readonly breadcrumbLabel: string;
  readonly breadcrumbApplications: string;
  readonly breadcrumbCurrent: string;
  readonly title: string;
  readonly subtitle: string;
  readonly current: {
    readonly heading: string;
    readonly description: string;
    readonly sourceLabel: string;
  };
  /**
   * J-03/F1/AC-1 — the list carries only services the trainer can actually
   * request. There is no "already approved" suffix any more: approved services
   * are excluded from the control entirely and shown in `current` instead.
   */
  readonly selection: {
    readonly heading: string;
    readonly legend: string;
    readonly description: string;
    readonly noneAvailable: string;
  };
  readonly delta: {
    readonly heading: string;
    readonly description: string;
    readonly none: string;
  };
  readonly attachments: {
    readonly formatError: (formats: string) => string;
    readonly sizeError: (mb: number) => string;
    readonly countError: (n: number) => string;
    readonly browseLabel: string;
    readonly removeLabel: string;
  };
  readonly submit: string;
  readonly confirm: {
    readonly title: string;
    readonly body: (service: string) => string;
    readonly confirm: string;
    readonly cancel: string;
    readonly dismiss: string;
  };
  /** RB-03 — submitted with no active agreement: rejected automatically. */
  readonly noAgreement: {
    readonly title: string;
    readonly body: (requestId: string) => string;
  };
  readonly success: {
    readonly title: string;
    readonly body: (requestId: string) => string;
    readonly note: string;
    readonly backToApplication: string;
    readonly myApplications: string;
  };
  readonly errors: {
    readonly loadTitle: string;
    readonly loadBody: string;
    readonly retry: string;
    readonly notEligibleTitle: string;
    readonly notEligibleBody: string;
    readonly fastUnavailableTitle: string;
    readonly fastUnavailableBody: string;
    readonly duplicate: string;
    readonly submitFailed: string;
    readonly homeLabel: string;
  };
  readonly services: Readonly<Record<ApplicationService, string>>;
}

const ar: AddServiceContent = {
  documentTitle: 'إضافة خدمة — منصة الخبراء والمدربين',
  breadcrumbLabel: 'مسار التنقل',
  breadcrumbApplications: 'طلباتي',
  breadcrumbCurrent: 'إضافة خدمة',
  title: 'إضافة خدمة جديدة',
  subtitle: 'وسّع نطاق خدماتك المعتمدة دون الحاجة إلى تقديم طلب جديد كاملًا.',
  current: {
    heading: 'خدماتك المعتمدة حاليًا',
    description: 'هذه الخدمات معتمدة ومصدرها الأنظمة الرسمية، ولا يمكن طلبها مرة أخرى.',
    sourceLabel: 'المصدر: النظام الرسمي',
  },
  selection: {
    heading: 'اختر الخدمة الجديدة',
    legend: 'الخدمة المطلوب إضافتها',
    description: 'اختر خدمة واحدة لإضافتها. الخدمات المعتمدة مسبقًا غير قابلة للاختيار.',
    noneAvailable: 'جميع الخدمات المتاحة معتمدة لديك بالفعل، ولا توجد خدمة يمكن إضافتها.',
  },
  delta: {
    heading: 'البيانات المطلوبة للخدمة الجديدة',
    description: 'نطلب فقط البيانات غير المتوفرة سابقًا في ملفك.',
    none: 'لا توجد بيانات إضافية مطلوبة لهذه الخدمة؛ يمكنك إرسال الطلب مباشرة.',
  },
  attachments: {
    formatError: (formats) => `صيغة الملف غير مقبولة. الصيغ المسموحة: ${formats}.`,
    sizeError: (mb) => `حجم الملف يتجاوز الحد الأقصى (${mb} م.ب).`,
    countError: (n) => `الحد الأقصى لعدد الملفات هو ${n}.`,
    browseLabel: 'اختر ملفًا',
    removeLabel: 'إزالة',
  },
  submit: 'إرسال الطلب',
  confirm: {
    title: 'تأكيد إضافة الخدمة',
    body: (service) =>
      `سيتم إرسال طلب إضافة خدمة «${service}» للمراجعة والاعتماد. هل تريد المتابعة؟`,
    confirm: 'تأكيد الإرسال',
    cancel: 'إلغاء',
    dismiss: 'إغلاق',
  },
  noAgreement: {
    title: 'رُفض طلب إضافة الخدمة تلقائيًا',
    body: (requestId) =>
      `رقم طلبك: ${requestId}. لا توجد لديك اتفاقية سارية مع الأكاديمية، ولا تُضاف خدمة إلا ضمن اتفاقية سارية. تواصل مع إدارة المدربين لتجديد اتفاقيتك، ثم أعد تقديم الطلب.`,
  },
  success: {
    title: 'تم إرسال طلب إضافة الخدمة',
    body: (requestId) => `رقم طلبك: ${requestId}`,
    note: 'سيُوجَّه طلبك مباشرة للاعتماد دون الحاجة إلى فرز أو مقابلة، وسنُعلمك بالنتيجة.',
    backToApplication: 'العودة إلى تفاصيل الطلب',
    myApplications: 'الذهاب إلى طلباتي',
  },
  errors: {
    loadTitle: 'تعذّر تحميل الصفحة',
    loadBody: 'حدث خطأ أثناء تحميل بيانات الخدمة. يُرجى المحاولة مرة أخرى.',
    retry: 'إعادة المحاولة',
    notEligibleTitle: 'غير متاح',
    notEligibleBody: 'إضافة الخدمات متاحة للمدربين المعتمدين الذين لديهم اتفاقية سارية فقط.',
    fastUnavailableTitle: 'تعذّر التحقق من خدماتك المعتمدة',
    fastUnavailableBody:
      'لا يمكننا حاليًا قراءة خدماتك المعتمدة من الأنظمة الرسمية، لذا تعذّر بدء طلب إضافة خدمة. يُرجى المحاولة لاحقًا.',
    duplicate: 'هذه الخدمة معتمدة لديك بالفعل.',
    submitFailed: 'تعذّر إرسال الطلب. يُرجى المحاولة مرة أخرى.',
    homeLabel: 'العودة إلى طلباتي',
  },
  services: getMyApplicationsContent('ar').services,
};

const en: AddServiceContent = {
  documentTitle: 'Add a service — Expert Hub',
  breadcrumbLabel: 'Breadcrumb',
  breadcrumbApplications: 'My applications',
  breadcrumbCurrent: 'Add a service',
  title: 'Add a new service',
  subtitle: 'Widen your approved scope without submitting a whole new application.',
  current: {
    heading: 'Your currently approved services',
    description:
      'These are accredited and sourced from official systems, and cannot be requested again.',
    sourceLabel: 'Source: official system',
  },
  selection: {
    heading: 'Choose the new service',
    legend: 'Service to add',
    description: 'Pick one service to add. Already-approved services are not selectable.',
    noneAvailable:
      'You are already approved for every available service — there is nothing to add.',
  },
  delta: {
    heading: 'Details required for the new service',
    description: 'We only ask for details not already on file.',
    none: 'No additional details are required for this service; you can submit the request directly.',
  },
  attachments: {
    formatError: (formats) => `File format not accepted. Allowed: ${formats}.`,
    sizeError: (mb) => `The file exceeds the maximum size (${mb} MB).`,
    countError: (n) => `You can upload at most ${n} file(s).`,
    browseLabel: 'Choose a file',
    removeLabel: 'Remove',
  },
  submit: 'Submit request',
  confirm: {
    title: 'Confirm add-service request',
    body: (service) =>
      `A request to add “${service}” will be sent for review and approval. Continue?`,
    confirm: 'Confirm & submit',
    cancel: 'Cancel',
    dismiss: 'Close',
  },
  noAgreement: {
    title: 'Add-service request rejected automatically',
    body: (requestId) =>
      `Your request number: ${requestId}. You have no active agreement with the Academy, and a service can only be added under one. Contact Trainer Management to renew your agreement, then submit the request again.`,
  },
  success: {
    title: 'Add-service request submitted',
    body: (requestId) => `Your request number: ${requestId}`,
    note: 'Your request goes straight to approval — no screening or interview — and we will notify you of the outcome.',
    backToApplication: 'Back to application details',
    myApplications: 'Go to My applications',
  },
  errors: {
    loadTitle: 'Could not load the page',
    loadBody: 'Something went wrong while loading the service data. Please try again.',
    retry: 'Try again',
    notEligibleTitle: 'Not available',
    notEligibleBody:
      'Adding services is available only to approved trainers with an active agreement.',
    fastUnavailableTitle: 'Could not verify your approved services',
    fastUnavailableBody:
      'We currently cannot read your approved services from the official systems, so an add-service request cannot be started. Please try again later.',
    duplicate: 'You are already approved for this service.',
    submitFailed: 'The request could not be submitted. Please try again.',
    homeLabel: 'Back to My applications',
  },
  services: getMyApplicationsContent('en').services,
};

const CONTENT: Record<Locale, AddServiceContent> = { ar, en };

export function getAddServiceContent(locale: Locale): AddServiceContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
