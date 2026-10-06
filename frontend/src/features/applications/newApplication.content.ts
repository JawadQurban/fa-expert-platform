import type { Locale } from '@/types';
import type { ApplicationService } from './application.types';
import type { ValidationMessages } from './applicationValidation';
import { getMyApplicationsContent } from './myApplications.content';

/**
 * EH-TP-05 (New Application) copy — Arabic authoritative, English best-effort.
 * Service labels are **reused from the one approved source**
 * (`myApplications.content.ts`) so the five BRD §6 labels never fork. Field and
 * section labels live in the form schema itself (`BR-0103` — centrally
 * configured), not here.
 */

export interface NewApplicationContent {
  readonly documentTitle: string;
  readonly title: string;
  readonly intro: string;
  readonly breadcrumbLabel: string;
  readonly breadcrumbApplications: string;
  readonly stepperLabel: string;
  /**
   * The wizard's fixed steps. The steps BETWEEN them are one per schema
   * section and take their names from the schema itself
   * (`dm-gap-01.2026-09-21`), so a new section needs no copy here.
   */
  readonly steps: {
    readonly services: string;
    readonly attachments: string;
    readonly review: string;
  };
  /**
   * One line under each step's name (FADS kit, EH-TP-05). They describe THIS
   * form's own steps — what the person is about to do — and claim nothing
   * about what a service covers.
   */
  /** Shown when the Academy's own record filled fields in (owner ruling). */
  readonly prefill: {
    readonly title: string;
    readonly body: string;
  };
  readonly stepDescriptions: {
    readonly services: string;
    readonly attachments: string;
    readonly review: string;
  };
  /** Repeatable groups — the nouns themselves come from the schema. */
  readonly repeatable: {
    readonly remove: string;
    readonly removeLabel: (entry: string) => string;
    readonly added: (entry: string) => string;
    readonly removed: (entry: string) => string;
    readonly empty: string;
  };
  readonly services: Readonly<Record<ApplicationService, string>>;
  readonly serviceStep: {
    readonly legend: string;
    readonly hint: string;
    /** `BR-0113`: Speaker is internal-only — never self-service selectable. */
    readonly speakerNote: string;
    readonly noneSelectedError: string;
    readonly requiredBecause: (services: string) => string;
    /** Live-region announcement when the visible/required fields change. */
    readonly fieldsUpdated: string;
  };
  readonly attachmentsStep: {
    readonly intro: string;
    readonly requiredTag: string;
    readonly optionalTag: string;
    readonly hint: (formats: string, maxMb: number, maxCount: number) => string;
    readonly browseLabel: string;
    readonly removeLabel: string;
    readonly uploadFailed: string;
    /** The proxy refused the body before the API saw it (413). */
    readonly uploadTooLargeForServer: string;
    /** Appended to an unexpected failure so it can be reported precisely. */
    readonly uploadFailureCode: (status: number) => string;
  };
  readonly review: {
    readonly intro: string;
    readonly servicesTitle: string;
    readonly attachmentsTitle: string;
    readonly missingTitle: string;
    readonly notProvided: string;
    readonly editSection: string;
    readonly yes: string;
    readonly no: string;
  };
  readonly actions: {
    readonly next: string;
    readonly back: string;
    readonly saveDraft: string;
    readonly submit: string;
    readonly retry: string;
    readonly goToApplications: string;
    readonly viewDetails: string;
  };
  readonly draft: {
    readonly resumedNotice: string;
    readonly savedPrefix: string;
    readonly saving: string;
    readonly saveFailed: string;
  };
  readonly confirm: {
    readonly title: string;
    readonly body: string;
    readonly confirmLabel: string;
    readonly cancelLabel: string;
    readonly dismissLabel: string;
  };
  readonly unsaved: {
    readonly title: string;
    readonly body: string;
    readonly leaveLabel: string;
    readonly stayLabel: string;
    readonly dismissLabel: string;
  };
  readonly success: {
    readonly title: string;
    readonly body: string;
    readonly referenceLabel: string;
  };
  readonly blocked: {
    readonly title: string;
    readonly body: string;
    readonly viewCurrent: string;
  };
  /** J-01/F3/AC-4 — an accredited trainer adds a service (J-03) instead of
   *  re-applying, so this block needs its own wording and its own exit. */
  readonly blockedTrainer: {
    readonly title: string;
    readonly body: string;
    readonly addService: string;
  };
  readonly schemaUnavailable: {
    readonly title: string;
    readonly body: string;
  };
  /** Control labels for the DS DatePicker the `date` fields render. */
  readonly datePicker: {
    readonly placeholder: string;
    readonly todayLabel: string;
    readonly previousMonthLabel: string;
    readonly nextMonthLabel: string;
    readonly yearDropdownLabel: string;
  };
  /** Control labels for the DS NumberInput the `number` fields render. */
  readonly numberInput: {
    readonly incrementLabel: string;
    readonly decrementLabel: string;
  };
  readonly errors: {
    readonly loadFailedTitle: string;
    readonly loadFailedBody: string;
    readonly submitFailedTitle: string;
    readonly submitFailedBody: string;
  };
  readonly validation: ValidationMessages & {
    readonly summaryTitle: string;
    readonly missingAttachment: (label: string) => string;
  };
}

const ar: NewApplicationContent = {
  documentTitle: 'طلب جديد | منصة الخبراء والمدربين',
  title: 'طلب انضمام جديد',
  intro:
    'اختر الخدمة أو الخدمات التي ترغب في تقديمها، وأكمل الحقول المطلوبة، وأرفق مستنداتك، ثم راجع طلبك وقدّمه. يمكنك حفظ طلبك كمسودة في أي وقت.',
  breadcrumbLabel: 'مسار التنقل',
  breadcrumbApplications: 'طلباتي',
  stepperLabel: 'خطوات الطلب',
  steps: {
    services: 'اختيار الخدمات',
    attachments: 'المرفقات',
    review: 'المراجعة والتقديم',
  },
  prefill: {
    title: 'عبّأنا بعض الحقول من بياناتك لدى الأكاديمية',
    body: 'راجعها وعدّل ما تغيّر منها. لن يُرسل شيء حتى تكمل الطلب وترسله بنفسك.',
  },
  stepDescriptions: {
    services: 'اختر ما تتقدّم له',
    attachments: 'أرفق مستنداتك',
    review: 'راجع وأرسل',
  },
  repeatable: {
    remove: 'إزالة',
    removeLabel: (entry) => `إزالة ${entry}`,
    added: (entry) => `تمت إضافة ${entry}.`,
    removed: (entry) => `تم حذف ${entry}.`,
    empty: 'لم تُضف أي مدخلات بعد.',
  },
  services: getMyApplicationsContent('ar').services,
  serviceStep: {
    legend: 'الخدمات المطلوبة',
    hint: 'يمكنك اختيار خدمة واحدة أو أكثر في طلب واحد، وتتحدد الحقول المطلوبة تلقائيًا وفق اختيارك.',
    speakerNote:
      'خدمة «متحدث» تُسجَّل داخليًا من قبل الأكاديمية لمناسبات محددة، ولا تتوفر عبر التقديم الذاتي.',
    noneSelectedError: 'اختر خدمة واحدة على الأقل للمتابعة.',
    requiredBecause: (services) => `مطلوب لخدمة: ${services}`,
    fieldsUpdated: 'تم تحديث الحقول المطلوبة وفق الخدمات المختارة.',
  },
  attachmentsStep: {
    intro: 'أرفق المستندات المطلوبة وفق الخدمات التي اخترتها. يتم التحقق من الملف فور رفعه.',
    requiredTag: 'مطلوب',
    optionalTag: 'اختياري',
    hint: (formats, maxMb, maxCount) =>
      `الصيغ المقبولة: ${formats} — الحد الأقصى ${maxMb} م.ب لكل ملف، وعدد الملفات ${maxCount}.`,
    browseLabel: 'اختر ملفًا',
    removeLabel: 'إزالة',
    uploadFailed: 'تعذّر رفع الملف. أزِله ثم أعد المحاولة.',
    uploadTooLargeForServer:
      'حجم الملف أكبر مما يقبله الخادم. جرّب ملفًا أصغر، أو أبلغ الدعم الفني بذلك.',
    uploadFailureCode: (status) => ` (رمز ${status})`,
  },
  review: {
    intro: 'راجع بيانات طلبك قبل التقديم. يمكنك تعديل أي قسم قبل الإرسال.',
    servicesTitle: 'الخدمات المختارة',
    attachmentsTitle: 'المرفقات',
    missingTitle: 'عناصر ناقصة يجب إكمالها قبل التقديم',
    notProvided: 'لم يُدخل',
    editSection: 'تعديل',
    yes: 'نعم',
    no: 'لا',
  },
  actions: {
    next: 'التالي',
    back: 'السابق',
    saveDraft: 'حفظ كمسودة',
    submit: 'تقديم الطلب',
    retry: 'إعادة المحاولة',
    goToApplications: 'الذهاب إلى طلباتي',
    viewDetails: 'عرض تفاصيل الطلب',
  },
  draft: {
    resumedNotice: 'تم استئناف مسودتك المحفوظة.',
    savedPrefix: 'آخر حفظ:',
    saving: 'جارٍ الحفظ…',
    saveFailed: 'تعذّر حفظ المسودة. حاول مرة أخرى.',
  },
  confirm: {
    title: 'تأكيد تقديم الطلب',
    body: 'بعد التقديم سيُصدر رقم مرجعي لطلبك ولن يمكنك تعديله من هذه الصفحة. هل تريد المتابعة؟',
    confirmLabel: 'تأكيد التقديم',
    cancelLabel: 'إلغاء',
    dismissLabel: 'إغلاق',
  },
  unsaved: {
    title: 'تغييرات غير محفوظة',
    body: 'لديك تغييرات لم تُحفظ. إذا غادرت الصفحة الآن فستفقد هذه التغييرات.',
    leaveLabel: 'مغادرة دون حفظ',
    stayLabel: 'البقاء في الصفحة',
    dismissLabel: 'إغلاق',
  },
  success: {
    title: 'تم تقديم طلبك بنجاح',
    body: 'استلمت الأكاديمية طلبك وسيصلك إشعار عند كل تحديث لحالته. احتفظ برقمك المرجعي للمتابعة.',
    referenceLabel: 'الرقم المرجعي',
  },
  blocked: {
    title: 'لا يمكن إنشاء طلب جديد',
    body: 'لديك طلب قيد المعالجة، ولا يمكن تقديم طلب جديد قبل اكتمال معالجته.',
    viewCurrent: 'عرض الطلب الحالي',
  },
  blockedTrainer: {
    title: 'أنت مدرب معتمد بالفعل',
    body: 'حسابك يحمل دور مدرب معتمد، ولا حاجة لتقديم طلب انضمام جديد. لإضافة خدمة لم تُعتمد لك بعد، استخدم طلب «إضافة خدمة» من ملفك الشخصي — ولن يُطلب منك سوى الحقول الناقصة لتلك الخدمة.',
    addService: 'إضافة خدمة من ملفي',
  },
  schemaUnavailable: {
    title: 'نموذج الطلب غير متاح حاليًا',
    body: 'لم يتم اعتماد خريطة حقول الطلب بعد. يُرجى المحاولة لاحقًا أو التواصل مع الأكاديمية.',
  },
  errors: {
    loadFailedTitle: 'تعذّر تحميل نموذج الطلب',
    loadFailedBody: 'حدث خطأ أثناء تحميل النموذج. يُرجى المحاولة مرة أخرى.',
    submitFailedTitle: 'تعذّر تقديم الطلب',
    submitFailedBody: 'حدث خطأ أثناء تقديم طلبك. لم يُفقد ما أدخلته — حاول مرة أخرى.',
  },
  datePicker: {
    placeholder: 'اختر تاريخًا',
    todayLabel: 'اليوم',
    previousMonthLabel: 'الشهر السابق',
    nextMonthLabel: 'الشهر التالي',
    yearDropdownLabel: 'اختر السنة',
  },
  numberInput: {
    incrementLabel: 'زيادة',
    decrementLabel: 'إنقاص',
  },
  validation: {
    required: 'هذا الحقل مطلوب.',
    maxLength: (max) => `الحد الأقصى ${max} حرفًا.`,
    invalidValue: 'القيمة المدخلة غير صحيحة.',
    dateNotFuture: 'لا يمكن أن يكون التاريخ في المستقبل.',
    dateNotPast: 'لا يمكن أن يكون التاريخ في الماضي.',
    fileFormat: (formats) => `صيغة الملف غير مقبولة. الصيغ المسموحة: ${formats}.`,
    fileSize: (maxMb) => `حجم الملف يتجاوز الحد الأقصى (${maxMb} م.ب).`,
    fileCount: (max) => `الحد الأقصى لعدد الملفات هو ${max}.`,
    summaryTitle: 'أكمل العناصر التالية للمتابعة:',
    missingAttachment: (label) => `المرفق «${label}» مطلوب.`,
  },
};

const en: NewApplicationContent = {
  documentTitle: 'New Application | Expert & Trainer Hub',
  title: 'New join application',
  intro:
    'Choose the service(s) you want to offer, complete the required fields, attach your documents, then review and submit. You can save a draft at any time.',
  breadcrumbLabel: 'Breadcrumb',
  breadcrumbApplications: 'My applications',
  stepperLabel: 'Application steps',
  steps: {
    services: 'Select services',
    attachments: 'Attachments',
    review: 'Review & submit',
  },
  prefill: {
    title: 'We filled some fields in from your Financial Academy record',
    body: 'Check them and correct anything that has changed. Nothing is sent until you complete and submit the application yourself.',
  },
  stepDescriptions: {
    services: 'Choose what you are applying for',
    attachments: 'Attach your documents',
    review: 'Review and submit',
  },
  repeatable: {
    remove: 'Remove',
    removeLabel: (entry) => `Remove ${entry}`,
    added: (entry) => `${entry} added.`,
    removed: (entry) => `${entry} removed.`,
    empty: 'No entries added yet.',
  },
  services: getMyApplicationsContent('en').services,
  serviceStep: {
    legend: 'Requested services',
    hint: 'Select one or more services in a single application — the required fields adjust automatically.',
    speakerNote:
      'The “Speaker” service is registered internally by the Academy for specific events and is not available through self-service application.',
    noneSelectedError: 'Select at least one service to continue.',
    requiredBecause: (services) => `Required for: ${services}`,
    fieldsUpdated: 'The required fields were updated to match your selected services.',
  },
  attachmentsStep: {
    intro:
      'Attach the documents required for your selected services. Files are validated as soon as they are uploaded.',
    requiredTag: 'Required',
    optionalTag: 'Optional',
    hint: (formats, maxMb, maxCount) =>
      `Accepted formats: ${formats} — up to ${maxMb} MB per file, ${maxCount} file(s).`,
    browseLabel: 'Choose a file',
    removeLabel: 'Remove',
    uploadFailed: 'The file could not be uploaded. Remove it and try again.',
    uploadTooLargeForServer:
      'The file is larger than the server accepts. Try a smaller one, or report this to support.',
    uploadFailureCode: (status) => ` (code ${status})`,
  },
  review: {
    intro: 'Review your application before submitting. You can edit any section first.',
    servicesTitle: 'Selected services',
    attachmentsTitle: 'Attachments',
    missingTitle: 'Missing items to complete before submitting',
    notProvided: 'Not provided',
    editSection: 'Edit',
    yes: 'Yes',
    no: 'No',
  },
  actions: {
    next: 'Next',
    back: 'Back',
    saveDraft: 'Save draft',
    submit: 'Submit application',
    retry: 'Try again',
    goToApplications: 'Go to My applications',
    viewDetails: 'View application details',
  },
  draft: {
    resumedNotice: 'Your saved draft has been resumed.',
    savedPrefix: 'Last saved:',
    saving: 'Saving…',
    saveFailed: 'Could not save the draft. Try again.',
  },
  confirm: {
    title: 'Confirm submission',
    body: 'After submitting, a reference number is issued and the application can no longer be edited from this page. Continue?',
    confirmLabel: 'Confirm & submit',
    cancelLabel: 'Cancel',
    dismissLabel: 'Close',
  },
  unsaved: {
    title: 'Unsaved changes',
    body: 'You have unsaved changes. If you leave now, those changes will be lost.',
    leaveLabel: 'Leave without saving',
    stayLabel: 'Stay on this page',
    dismissLabel: 'Close',
  },
  success: {
    title: 'Your application has been submitted',
    body: 'The Academy has received your application; you will be notified on every status update. Keep your reference number for follow-up.',
    referenceLabel: 'Reference number',
  },
  blocked: {
    title: 'A new application cannot be started',
    body: 'You already have an application in progress; a new one cannot be submitted until it is decided.',
    viewCurrent: 'View current application',
  },
  blockedTrainer: {
    title: 'You are already an accredited trainer',
    body: 'Your account holds an approved Trainer role, so a new join application is not needed. To add a service you are not yet approved for, use the Add Service request from your profile — you will only be asked for the fields missing for that service.',
    addService: 'Add a service from my profile',
  },
  schemaUnavailable: {
    title: 'The application form is currently unavailable',
    body: 'The application field map has not been approved yet. Please try again later or contact the Academy.',
  },
  errors: {
    loadFailedTitle: 'Could not load the application form',
    loadFailedBody: 'Something went wrong while loading the form. Please try again.',
    submitFailedTitle: 'Could not submit the application',
    submitFailedBody:
      'Something went wrong while submitting. Nothing you entered was lost — try again.',
  },
  datePicker: {
    placeholder: 'Select a date',
    todayLabel: 'Today',
    previousMonthLabel: 'Previous month',
    nextMonthLabel: 'Next month',
    yearDropdownLabel: 'Select year',
  },
  numberInput: {
    incrementLabel: 'Increase',
    decrementLabel: 'Decrease',
  },
  validation: {
    required: 'This field is required.',
    maxLength: (max) => `Maximum length is ${max} characters.`,
    invalidValue: 'The entered value is invalid.',
    dateNotFuture: 'The date cannot be in the future.',
    dateNotPast: 'The date cannot be in the past.',
    fileFormat: (formats) => `File format not accepted. Allowed formats: ${formats}.`,
    fileSize: (maxMb) => `The file exceeds the maximum size (${maxMb} MB).`,
    fileCount: (max) => `The maximum number of files is ${max}.`,
    summaryTitle: 'Complete the following to continue:',
    missingAttachment: (label) => `The attachment “${label}” is required.`,
  },
};

const CONTENT: Record<Locale, NewApplicationContent> = { ar, en };

export function getNewApplicationContent(locale: Locale): NewApplicationContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
