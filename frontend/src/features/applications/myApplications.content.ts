import type { Locale } from '@/types';
import type { ApplicationPresentationStatus, ApplicationService } from './application.types';

/**
 * EH-TP-02 (My Applications) copy — Arabic authoritative, English best-effort.
 * Status labels are the locked 11-value trainer presentation vocabulary
 * (`DECISIONS.md` P-05) plus the neutral `updating` partial state (`04` §11);
 * service labels are the five BRD §6 types. All copy lives here — the page and
 * its components render structure only.
 */

export interface MyApplicationsContent {
  readonly documentTitle: string;
  readonly title: string;
  readonly description: string;
  readonly summary: {
    readonly sectionLabel: string;
    readonly total: string;
    readonly draft: string;
    readonly underReview: string;
    readonly approved: string;
    readonly requiresAction: string;
  };
  readonly actions: {
    readonly newApplication: string;
    readonly blockedExplanation: string;
    readonly blockedLinkLabel: string;
    readonly resumeDraft: string;
    readonly viewDetails: string;
    readonly retry: string;
    readonly clearFilters: string;
    readonly applyNow: string;
  };
  readonly filters: {
    readonly regionLabel: string;
    readonly searchLabel: string;
    readonly searchPlaceholder: string;
    readonly statusLabel: string;
    readonly serviceLabel: string;
    readonly allOption: string;
  };
  readonly list: {
    readonly caption: string;
    readonly headers: {
      readonly reference: string;
      readonly services: string;
      readonly status: string;
      readonly submittedAt: string;
      readonly updatedAt: string;
      readonly action: string;
    };
    readonly draftReferenceLabel: string;
    readonly notSubmittedLabel: string;
  };
  readonly statuses: Readonly<Record<ApplicationPresentationStatus, string>>;
  readonly services: Readonly<Record<ApplicationService, string>>;
  readonly pagination: {
    readonly label: string;
    readonly previous: string;
    readonly next: string;
  };
  readonly empty: {
    readonly noApplicationsTitle: string;
    readonly noApplicationsBody: string;
    readonly noResultsTitle: string;
    readonly noResultsBody: string;
  };
  readonly errors: {
    readonly loadFailedTitle: string;
    readonly loadFailedBody: string;
    readonly unauthorizedTitle: string;
    readonly unauthorizedBody: string;
    readonly sessionExpiredTitle: string;
    readonly sessionExpiredBody: string;
  };
}

const ar: MyApplicationsContent = {
  documentTitle: 'طلباتي | منصة الخبراء والمدربين',
  title: 'طلباتي',
  description: 'تابع جميع طلبات انضمامك وحالاتها في مكان واحد، وأكمل مسوداتك أو قدّم طلبًا جديدًا.',
  summary: {
    sectionLabel: 'ملخص الطلبات',
    total: 'إجمالي الطلبات',
    draft: 'مسودات',
    underReview: 'الطلبات قيد المعالجة',
    approved: 'الطلبات المعتمدة',
    requiresAction: 'الطلبات التي تتطلب إجراءً',
  },
  actions: {
    newApplication: 'تقديم طلب جديد',
    blockedExplanation:
      'لا يمكن إنشاء طلب جديد وأنت تملك طلبًا قيد المعالجة — يمكنك متابعة طلبك الحالي.',
    blockedLinkLabel: 'عرض الطلب الحالي',
    resumeDraft: 'أكمل الطلب',
    viewDetails: 'عرض التفاصيل',
    retry: 'إعادة المحاولة',
    clearFilters: 'مسح عوامل التصفية',
    applyNow: 'قدّم طلب الانضمام',
  },
  filters: {
    regionLabel: 'تصفية الطلبات',
    searchLabel: 'البحث برقم الطلب',
    searchPlaceholder: 'مثال: EH-2026-00142',
    statusLabel: 'الحالة',
    serviceLabel: 'الخدمة',
    allOption: 'الكل',
  },
  list: {
    caption: 'قائمة طلباتي',
    headers: {
      reference: 'رقم الطلب',
      services: 'الخدمة',
      status: 'الحالة',
      submittedAt: 'تاريخ التقديم',
      updatedAt: 'آخر تحديث',
      action: 'الإجراء',
    },
    draftReferenceLabel: 'مسودة — بدون رقم مرجعي',
    notSubmittedLabel: 'لم يُقدَّم بعد',
  },
  statuses: {
    draft: 'مسودة',
    submitted: 'مُقدَّم',
    'under-review': 'قيد المراجعة',
    'interview-scheduled': 'مقابلة مجدولة',
    'interview-completed': 'مقابلة مكتملة',
    'approval-in-progress': 'الاعتماد قيد الإجراء',
    approved: 'معتمد',
    'agreement-pending': 'بانتظار توقيع الاتفاقية',
    active: 'نشط',
    rejected: 'مرفوض',
    closed: 'مغلق',
    updating: 'قيد التحديث',
  },
  services: {
    trainer: 'مدرب',
    consultant: 'مستشار',
    'content-developer': 'مطوّر محتوى',
    'question-writer': 'كاتب أسئلة',
    speaker: 'متحدث',
  },
  pagination: {
    label: 'التنقل بين صفحات الطلبات',
    previous: 'السابق',
    next: 'التالي',
  },
  empty: {
    noApplicationsTitle: 'لا توجد طلبات بعد',
    noApplicationsBody: 'ابدأ رحلتك مع الأكاديمية المالية بتقديم طلب انضمامك الأول.',
    noResultsTitle: 'لا توجد نتائج مطابقة',
    noResultsBody: 'جرّب تعديل البحث أو مسح عوامل التصفية.',
  },
  errors: {
    loadFailedTitle: 'تعذّر تحميل الطلبات',
    loadFailedBody: 'حدث خطأ أثناء تحميل قائمة طلباتك. يُرجى المحاولة مرة أخرى.',
    unauthorizedTitle: 'لا تملك صلاحية الوصول',
    unauthorizedBody: 'ليست لديك الصلاحية اللازمة لعرض هذه الطلبات.',
    sessionExpiredTitle: 'انتهت الجلسة',
    sessionExpiredBody: 'انتهت جلستك. يُرجى تسجيل الدخول مرة أخرى للمتابعة.',
  },
};

const en: MyApplicationsContent = {
  documentTitle: 'My Applications | Expert & Trainer Hub',
  title: 'My applications',
  description:
    'Track all your join applications and their statuses in one place, resume drafts, or start a new application.',
  summary: {
    sectionLabel: 'Applications summary',
    total: 'Total applications',
    draft: 'Drafts',
    underReview: 'Applications in progress',
    approved: 'Approved applications',
    requiresAction: 'Applications requiring action',
  },
  actions: {
    newApplication: 'New application',
    blockedExplanation:
      'You cannot start a new application while one is still in progress — you can follow up on your current application.',
    blockedLinkLabel: 'View current application',
    resumeDraft: 'Resume application',
    viewDetails: 'View details',
    retry: 'Try again',
    clearFilters: 'Clear filters',
    applyNow: 'Apply to join',
  },
  filters: {
    regionLabel: 'Filter applications',
    searchLabel: 'Search by application number',
    searchPlaceholder: 'e.g. EH-2026-00142',
    statusLabel: 'Status',
    serviceLabel: 'Service',
    allOption: 'All',
  },
  list: {
    caption: 'My applications list',
    headers: {
      reference: 'Application no.',
      services: 'Service',
      status: 'Status',
      submittedAt: 'Submission date',
      updatedAt: 'Last updated',
      action: 'Action',
    },
    draftReferenceLabel: 'Draft — no reference number',
    notSubmittedLabel: 'Not submitted yet',
  },
  statuses: {
    draft: 'Draft',
    submitted: 'Submitted',
    'under-review': 'Under review',
    'interview-scheduled': 'Interview scheduled',
    'interview-completed': 'Interview completed',
    'approval-in-progress': 'Approval in progress',
    approved: 'Approved',
    'agreement-pending': 'Agreement pending',
    active: 'Active',
    rejected: 'Rejected',
    closed: 'Closed',
    updating: 'Updating',
  },
  services: {
    trainer: 'Trainer',
    consultant: 'Consultant',
    'content-developer': 'Content developer',
    'question-writer': 'Question writer',
    speaker: 'Speaker',
  },
  pagination: {
    label: 'Applications pagination',
    previous: 'Previous',
    next: 'Next',
  },
  empty: {
    noApplicationsTitle: 'No applications yet',
    noApplicationsBody:
      'Start your journey with the Financial Academy by submitting your first application.',
    noResultsTitle: 'No matching results',
    noResultsBody: 'Try adjusting the search or clearing the filters.',
  },
  errors: {
    loadFailedTitle: 'Could not load applications',
    loadFailedBody: 'Something went wrong while loading your applications. Please try again.',
    unauthorizedTitle: 'You do not have access',
    unauthorizedBody: 'You do not have permission to view these applications.',
    sessionExpiredTitle: 'Session expired',
    sessionExpiredBody: 'Your session has expired. Please log in again to continue.',
  },
};

const CONTENT: Record<Locale, MyApplicationsContent> = { ar, en };

export function getMyApplicationsContent(locale: Locale): MyApplicationsContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
