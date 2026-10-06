import type { Locale } from '@/types';
import { getMyApplicationsContent } from '../applications/myApplications.content';
import type {
  AgreementLifecycleInput,
  AgreementStatus,
  ExpiryMilestone,
  TemplateValidationCode,
} from './agreementLifecycle.types';
import { arNumber } from '../../shared/formatting';

/**
 * EH-INT-06 (Agreement Lifecycle) copy — Arabic authoritative, English
 * best-effort. Pages render structure only.
 *
 * Two things this copy is careful about:
 *
 * - **The term length is stated, never asked for.** Every renewal message names
 *   the term the trainer will receive, because `BR-0302` decides it and the
 *   staff member should see what the rule produced (F2/AC-2, AC-3).
 * - **Ending and expiring are worded differently.** J-13's matrix defines
 *   *expired* as ending **without renewal** — a lapse — while *ended* is a
 *   deliberate act. Using one word for both would hide which happened.
 */

export interface AgreementLifecycleContent {
  readonly documentTitle: string;
  readonly listTitle: string;
  readonly listDescription: string;
  readonly expiringCount: (count: number) => string;
  readonly resultsLabel: string;
  readonly filters: {
    readonly regionLabel: string;
    readonly searchLabel: string;
    readonly searchPlaceholder: string;
    readonly statusLabel: string;
    readonly milestoneLabel: string;
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
    readonly services: string;
    readonly status: string;
    readonly expiry: string;
  };
  readonly statuses: Readonly<Record<AgreementStatus, string>>;
  /** F1/AC-2–4 — the three `BR-0303` thresholds, plus either side of them. */
  /**
   * A formatter rather than a lookup: the reminder offsets are configuration
   * (`BR-0705`), so the copy is given the number and phrases it.
   */
  readonly milestone: (milestone: ExpiryMilestone) => string;
  readonly daysRemaining: (days: number) => string;
  readonly daysOverdue: (days: number) => string;
  readonly empty: { readonly title: string; readonly body: string };
  readonly templateLink: string;

  readonly detail: {
    readonly documentTitle: (reference: string) => string;
    readonly breadcrumbLabel: string;
    readonly breadcrumbList: string;
    readonly heading: string;
    readonly trainerLabel: string;
    readonly servicesLabel: string;
    readonly termLabel: string;
    readonly termValue: (start: string, end: string) => string;
    readonly renewalCountLabel: string;
    readonly renewalCountValue: (count: number) => string;
    readonly documentUnavailable: string;
    readonly historyHeading: string;
    readonly historyKinds: Readonly<Record<string, string>>;
    readonly historyEntry: (name: string, date: string) => string;
    readonly historyTerm: (years: number) => string;
  };

  /** F2 + F3 — the lifecycle actions. */
  readonly actions: {
    readonly heading: string;
    /** F2/AC-1 — renewal is direct; the absence of re-screening is stated. */
    readonly directRenewalNote: string;
    readonly labels: Readonly<Record<AgreementLifecycleInput['kind'], string>>;
    readonly noneAvailable: string;
    readonly noteLabel: string;
    readonly cancel: string;
    readonly dismiss: string;
    readonly renewDialog: {
      readonly title: string;
      /** F2/AC-2 — names the term the rule produced. */
      readonly body: (years: number, endsAt: string) => string;
      readonly termNote: (years: number) => string;
      readonly confirm: string;
    };
    readonly suspendDialog: {
      readonly title: string;
      readonly body: string;
      readonly confirm: string;
    };
    readonly reactivateDialog: {
      readonly title: string;
      readonly body: string;
      readonly confirm: string;
    };
    readonly endDialog: {
      readonly title: string;
      readonly warning: string;
      readonly body: string;
      readonly acknowledgeLabel: string;
      readonly confirm: string;
    };
    readonly success: Readonly<Record<AgreementLifecycleInput['kind'], string>>;
  };

  /** F4 — the central agreement template. */
  readonly template: {
    readonly documentTitle: string;
    readonly heading: string;
    readonly description: string;
    readonly servicesLabel: string;
    /** F4/AC-2 — say that the structure is built for more than one template. */
    readonly multiTemplateNote: string;
    readonly bodyLabel: string;
    readonly bodyHint: string;
    readonly fieldsHeading: string;
    readonly fieldsDescription: string;
    readonly fieldLabelLabel: string;
    readonly fieldTypeLabel: string;
    readonly fieldRequiredLabel: string;
    readonly types: Readonly<Record<'date' | 'text' | 'number', string>>;
    readonly save: string;
    readonly saved: string;
    readonly lastUpdated: (name: string, date: string) => string;
    readonly errors: Readonly<Record<TemplateValidationCode, string>>;
    readonly backToList: string;
  };

  readonly errors: {
    readonly loadTitle: string;
    readonly loadBody: string;
    readonly notFoundTitle: string;
    readonly notFoundBody: string;
    readonly actionFailed: string;
    readonly retry: string;
    readonly backToList: string;
  };

  readonly services: ReturnType<typeof getMyApplicationsContent>['services'];
}

const fmtAr = (value: number) => arNumber(value);

const ar: AgreementLifecycleContent = {
  documentTitle: 'إدارة الاتفاقيات — منصة الخبراء',
  listTitle: 'إدارة الاتفاقيات',
  listDescription:
    'متابعة تواريخ انتهاء الاتفاقيات وتجديدها إداريًا وإيقافها أو إنهاؤها. التجديد مباشر دون إعادة فرز أو مقابلة.',
  expiringCount: (count) =>
    count === 0
      ? 'لا توجد اتفاقيات تقترب من الانتهاء'
      : count === 1
        ? 'اتفاقية واحدة تقترب من الانتهاء أو انتهت'
        : `${fmtAr(count)} اتفاقيات تقترب من الانتهاء أو انتهت`,
  resultsLabel: 'الاتفاقيات',
  filters: {
    regionLabel: 'تصفية الاتفاقيات',
    searchLabel: 'بحث بالاسم أو رقم الاتفاقية',
    searchPlaceholder: 'اسم المدرب أو رقم الاتفاقية',
    statusLabel: 'الحالة',
    milestoneLabel: 'قرب الانتهاء',
    allOption: 'الكل',
    clear: 'مسح التصفية',
    activeHeading: 'التصفية النشطة:',
    removeFilter: (label, value) => `أزل تصفية ${label}: ${value}`,
  },
  columns: {
    reference: 'رقم الاتفاقية',
    trainer: 'المدرب',
    services: 'الخدمات',
    status: 'الحالة',
    expiry: 'تاريخ الانتهاء',
  },
  statuses: {
    active: 'سارية',
    suspended: 'موقوفة',
    expired: 'منتهية',
    ended: 'مُنهاة',
  },
  milestone: (milestone) => {
    if (milestone.kind === 'none') {
      return 'ضمن المدة';
    }
    if (milestone.kind === 'expired') {
      return 'انتهت المدة';
    }
    const days = fmtAr(milestone.daysBefore);
    return milestone.daysBefore <= 10 ? `تنتهي خلال ${days} أيام` : `تنتهي خلال ${days} يومًا`;
  },
  daysRemaining: (days) => (days === 1 ? 'يتبقّى يوم واحد' : `يتبقّى ${fmtAr(days)} يومًا`),
  daysOverdue: (days) =>
    days === 1 ? 'مضى يوم واحد على الانتهاء' : `مضى ${fmtAr(days)} يومًا على الانتهاء`,
  empty: {
    title: 'لا توجد اتفاقيات مطابقة',
    body: 'لم نعثر على اتفاقيات تطابق هذه التصفية. جرّب توسيع نطاق البحث.',
  },
  templateLink: 'نموذج الاتفاقية',

  detail: {
    documentTitle: (reference) => `${reference} — إدارة الاتفاقية`,
    breadcrumbLabel: 'مسار التنقل',
    breadcrumbList: 'إدارة الاتفاقيات',
    heading: 'الاتفاقية',
    trainerLabel: 'المدرب',
    servicesLabel: 'الخدمات المشمولة',
    termLabel: 'مدة الاتفاقية',
    termValue: (start, end) => `من ${start} إلى ${end}`,
    renewalCountLabel: 'عدد مرات التجديد',
    renewalCountValue: (count) => (count === 0 ? 'لم تُجدَّد بعد' : `${fmtAr(count)}`),
    documentUnavailable: 'تنزيل نسخة الاتفاقية غير متاح حاليًا.',
    historyHeading: 'سجل الاتفاقية',
    historyKinds: {
      activated: 'تفعيل الاتفاقية',
      renewed: 'تجديد الاتفاقية',
      suspended: 'إيقاف الاتفاقية',
      reactivated: 'إعادة تفعيل الاتفاقية',
      ended: 'إنهاء الاتفاقية',
    },
    historyEntry: (name, date) => `${name} — ${date}`,
    historyTerm: (years) => (years === 1 ? 'لمدة سنة واحدة' : `لمدة ${fmtAr(years)} سنوات`),
  },

  actions: {
    heading: 'إجراءات الاتفاقية',
    directRenewalNote:
      'التجديد إجراء إداري مباشر: لا يُعاد المدرب إلى الفرز أو المقابلة، لأن اعتماده قائم بالفعل.',
    labels: {
      renew: 'تجديد الاتفاقية',
      suspend: 'إيقاف الاتفاقية',
      reactivate: 'إعادة التفعيل',
      end: 'إنهاء الاتفاقية',
    },
    noneAvailable: 'لا تتوفّر إجراءات على هذه الاتفاقية.',
    noteLabel: 'ملاحظة داخلية (اختياري)',
    cancel: 'إلغاء',
    dismiss: 'إغلاق',
    renewDialog: {
      title: 'تجديد الاتفاقية',
      body: (years, endsAt) =>
        years === 1
          ? `ستُجدَّد الاتفاقية لمدة سنة واحدة، وتنتهي بتاريخ ${endsAt}.`
          : `ستُجدَّد الاتفاقية لمدة ${fmtAr(years)} سنوات، وتنتهي بتاريخ ${endsAt}.`,
      termNote: (years) =>
        years === 1
          ? 'المدة محدَّدة نظامًا: سنة واحدة للاعتماد الأول.'
          : `المدة محدَّدة نظامًا: ${fmtAr(years)} سنوات لكل تجديد.`,
      confirm: 'تأكيد التجديد',
    },
    suspendDialog: {
      title: 'إيقاف الاتفاقية',
      body: 'يوقف هذا الإجراء سريان الاتفاقية مؤقتًا. يمكن إعادة تفعيلها لاحقًا.',
      confirm: 'تأكيد الإيقاف',
    },
    reactivateDialog: {
      title: 'إعادة تفعيل الاتفاقية',
      body: 'تعود الاتفاقية إلى حالة «سارية» بتواريخها الحالية.',
      confirm: 'تأكيد إعادة التفعيل',
    },
    endDialog: {
      title: 'إنهاء الاتفاقية',
      warning: 'قرار نهائي: إنهاء الاتفاقية لا يمكن التراجع عنه، ولا يمكن تجديدها بعده.',
      body: 'إن كان الغرض إيقافًا مؤقتًا فاستخدم «إيقاف الاتفاقية» بدلًا من ذلك.',
      acknowledgeLabel: 'أفهم أن إنهاء الاتفاقية إجراء نهائي.',
      confirm: 'تأكيد الإنهاء النهائي',
    },
    success: {
      renew: 'تم تجديد الاتفاقية.',
      suspend: 'تم إيقاف الاتفاقية.',
      reactivate: 'تمت إعادة تفعيل الاتفاقية.',
      end: 'تم إنهاء الاتفاقية.',
    },
  },

  template: {
    documentTitle: 'نموذج الاتفاقية — منصة الخبراء',
    heading: 'نموذج الاتفاقية الموحّد',
    description:
      'النص الثابت وحقول الدمج المستخدمة في كل اتفاقية تُنشئها المنصة. أي تعديل هنا ينعكس على الاتفاقيات التي تُنشأ بعده.',
    servicesLabel: 'الخدمات المرتبطة',
    multiTemplateNote:
      'البنية مصمّمة لدعم أكثر من نموذج مستقبلًا، ويُربط كل نموذج بخدمة أو أكثر. حاليًا يخدم نموذج واحد الخدمات الأربع.',
    bodyLabel: 'نص الاتفاقية الثابت',
    bodyHint: 'النص القانوني الذي يظهر في كل اتفاقية.',
    fieldsHeading: 'حقول الدمج',
    fieldsDescription: 'الحقول التي يعبّئها مُعدّ الاتفاقية وتُدمج آليًا في النص.',
    fieldLabelLabel: 'اسم الحقل',
    fieldTypeLabel: 'النوع',
    fieldRequiredLabel: 'إلزامي',
    types: { date: 'تاريخ', text: 'نص', number: 'رقم' },
    save: 'حفظ النموذج',
    saved: 'تم حفظ النموذج.',
    lastUpdated: (name, date) => `آخر تعديل: ${name} — ${date}`,
    errors: {
      'body-required': 'يجب إدخال نص الاتفاقية.',
      'field-label-required': 'يجب إدخال اسم لكل حقل دمج.',
    },
    backToList: 'العودة إلى الاتفاقيات',
  },

  errors: {
    loadTitle: 'تعذّر تحميل الاتفاقيات',
    loadBody: 'حدث خطأ أثناء التحميل. يُرجى المحاولة مرة أخرى.',
    notFoundTitle: 'الاتفاقية غير موجودة',
    notFoundBody: 'تعذّر العثور على هذه الاتفاقية.',
    actionFailed: 'تعذّر تنفيذ الإجراء. يُرجى المحاولة مرة أخرى.',
    retry: 'إعادة المحاولة',
    backToList: 'العودة إلى الاتفاقيات',
  },

  services: getMyApplicationsContent('ar').services,
};

const en: AgreementLifecycleContent = {
  documentTitle: 'Agreement management — Expert Hub',
  listTitle: 'Agreement management',
  listDescription:
    'Track expiry dates, renew agreements administratively, and suspend or end them. Renewal is direct — no re-screening and no interview.',
  expiringCount: (count) =>
    count === 0
      ? 'No agreements are nearing expiry'
      : count === 1
        ? '1 agreement is nearing expiry or has expired'
        : `${count} agreements are nearing expiry or have expired`,
  resultsLabel: 'Agreements',
  filters: {
    regionLabel: 'Filter agreements',
    searchLabel: 'Search by name or reference',
    searchPlaceholder: 'Trainer name or agreement reference',
    statusLabel: 'Status',
    milestoneLabel: 'Nearing expiry',
    allOption: 'All',
    clear: 'Clear filters',
    activeHeading: 'Active filters:',
    removeFilter: (label, value) => `Remove ${label} filter: ${value}`,
  },
  columns: {
    reference: 'Reference',
    trainer: 'Trainer',
    services: 'Services',
    status: 'Status',
    expiry: 'Expires',
  },
  statuses: {
    active: 'Active',
    suspended: 'Suspended',
    expired: 'Expired',
    ended: 'Ended',
  },
  milestone: (milestone) => {
    if (milestone.kind === 'none') {
      return 'Within term';
    }
    if (milestone.kind === 'expired') {
      return 'Term has expired';
    }
    return `Expires within ${milestone.daysBefore} days`;
  },
  daysRemaining: (days) => (days === 1 ? '1 day remaining' : `${days} days remaining`),
  daysOverdue: (days) => (days === 1 ? 'Expired 1 day ago' : `Expired ${days} days ago`),
  empty: {
    title: 'No matching agreements',
    body: 'No agreements match this filter. Try broadening your search.',
  },
  templateLink: 'Agreement template',

  detail: {
    documentTitle: (reference) => `${reference} — agreement management`,
    breadcrumbLabel: 'Breadcrumb',
    breadcrumbList: 'Agreement management',
    heading: 'Agreement',
    trainerLabel: 'Trainer',
    servicesLabel: 'Services covered',
    termLabel: 'Term',
    termValue: (start, end) => `${start} to ${end}`,
    renewalCountLabel: 'Times renewed',
    renewalCountValue: (count) => (count === 0 ? 'Not renewed yet' : `${count}`),
    documentUnavailable: 'Downloading the agreement document is not available yet.',
    historyHeading: 'Agreement history',
    historyKinds: {
      activated: 'Agreement activated',
      renewed: 'Agreement renewed',
      suspended: 'Agreement suspended',
      reactivated: 'Agreement reactivated',
      ended: 'Agreement ended',
    },
    historyEntry: (name, date) => `${name} — ${date}`,
    historyTerm: (years) => (years === 1 ? 'for 1 year' : `for ${years} years`),
  },

  actions: {
    heading: 'Agreement actions',
    directRenewalNote:
      'Renewal is a direct administrative action: the trainer is not routed back through screening or interview, because their accreditation already stands.',
    labels: {
      renew: 'Renew the agreement',
      suspend: 'Suspend the agreement',
      reactivate: 'Reactivate',
      end: 'End the agreement',
    },
    noneAvailable: 'No actions are available on this agreement.',
    noteLabel: 'Internal note (optional)',
    cancel: 'Cancel',
    dismiss: 'Close',
    renewDialog: {
      title: 'Renew the agreement',
      body: (years, endsAt) =>
        years === 1
          ? `The agreement will be renewed for 1 year, expiring on ${endsAt}.`
          : `The agreement will be renewed for ${years} years, expiring on ${endsAt}.`,
      termNote: (years) =>
        years === 1
          ? 'The term is set by rule: 1 year for a first accreditation.'
          : `The term is set by rule: ${years} years for every renewal.`,
      confirm: 'Confirm renewal',
    },
    suspendDialog: {
      title: 'Suspend the agreement',
      body: 'This pauses the agreement. It can be reactivated later.',
      confirm: 'Confirm suspension',
    },
    reactivateDialog: {
      title: 'Reactivate the agreement',
      body: 'The agreement returns to “Active” with its current dates.',
      confirm: 'Confirm reactivation',
    },
    endDialog: {
      title: 'End the agreement',
      warning:
        'Final decision: ending the agreement cannot be undone, and it cannot be renewed afterwards.',
      body: 'If you intend a temporary pause, use “Suspend the agreement” instead.',
      acknowledgeLabel: 'I understand that ending the agreement is final.',
      confirm: 'Confirm permanent ending',
    },
    success: {
      renew: 'The agreement was renewed.',
      suspend: 'The agreement was suspended.',
      reactivate: 'The agreement was reactivated.',
      end: 'The agreement was ended.',
    },
  },

  template: {
    documentTitle: 'Agreement template — Expert Hub',
    heading: 'Unified agreement template',
    description:
      'The fixed text and merge fields used in every agreement the platform generates. Changes here apply to agreements generated afterwards.',
    servicesLabel: 'Linked services',
    multiTemplateNote:
      'The structure is designed to support more than one template in future, each linked to one or more services. Today a single template serves all four.',
    bodyLabel: 'Fixed agreement text',
    bodyHint: 'The legal text that appears in every agreement.',
    fieldsHeading: 'Merge fields',
    fieldsDescription:
      'The fields the agreement preparer fills in, merged automatically into the text.',
    fieldLabelLabel: 'Field name',
    fieldTypeLabel: 'Type',
    fieldRequiredLabel: 'Required',
    types: { date: 'Date', text: 'Text', number: 'Number' },
    save: 'Save the template',
    saved: 'The template was saved.',
    lastUpdated: (name, date) => `Last edited: ${name} — ${date}`,
    errors: {
      'body-required': 'Enter the agreement text.',
      'field-label-required': 'Every merge field needs a name.',
    },
    backToList: 'Back to agreements',
  },

  errors: {
    loadTitle: 'Could not load the agreements',
    loadBody: 'Something went wrong while loading. Please try again.',
    notFoundTitle: 'Agreement not found',
    notFoundBody: 'We could not find this agreement.',
    actionFailed: 'The action could not be completed. Please try again.',
    retry: 'Try again',
    backToList: 'Back to agreements',
  },

  services: getMyApplicationsContent('en').services,
};

const CONTENT: Record<Locale, AgreementLifecycleContent> = { ar, en };

export function getAgreementLifecycleContent(locale: Locale): AgreementLifecycleContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
