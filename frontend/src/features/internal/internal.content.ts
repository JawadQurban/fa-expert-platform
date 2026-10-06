import type { Locale } from '@/types';
import type {
  ApplicationPresentationStatus,
  ApplicationService,
} from '../applications/application.types';
import { getMyApplicationsContent } from '../applications/myApplications.content';
import type { DashboardMetricId } from './internal.types';
import { arNumber, formatNumber, numberFormatter } from '../../shared/formatting';

/**
 * Internal / staff copy (EH-INT-01 Dashboard + EH-INT-02 Inbox) — Arabic
 * authoritative, English best-effort. Status + service labels are reused from
 * `myApplications.content` (single source). Pages render structure only.
 */

export interface InternalContent {
  readonly dashboard: {
    readonly documentTitle: string;
    readonly eyebrow: string;
    readonly greeting: (name: string) => string;
    readonly subtitle: string;
    readonly openSummary: (count: number) => string;
    readonly metricsLabel: string;
    readonly metrics: Readonly<Record<DashboardMetricId, string>>;
    /** The week-on-week change beside a KPI figure. */
    readonly delta: {
      readonly up: (count: string) => string;
      readonly down: (count: string) => string;
      readonly flat: string;
    };
    readonly sla: {
      readonly heading: string;
      readonly caption: string;
      readonly stage: string;
      readonly target: string;
      readonly actual: string;
      readonly breaches: string;
      readonly days: (count: string) => string;
      readonly measured: (count: string) => string;
      /** ⚠️ Never «0 أيام» — the BRD states no duration for this stage. */
      readonly targetUndefined: string;
      /** ⚠️ Never «0 أيام» — the platform records only one end of the stage. */
      readonly notMeasured: string;
      readonly empty: string;
    };
    readonly distribution: {
      readonly heading: string;
      readonly label: string;
      readonly empty: string;
    };
    readonly quickLinks: {
      readonly heading: string;
      readonly inboxTitle: string;
      readonly inboxDesc: string;
      /** EH-INT-02b — the J-03/F2 decision queue. */
      readonly serviceRequestsTitle: string;
      readonly serviceRequestsDesc: string;
      /** EH-INT-06 — the J-12 lifecycle queue. */
      readonly agreementsTitle: string;
      readonly agreementsDesc: string;
      /** EH-INT-07 — the J-15 trainer database. */
      readonly trainersTitle: string;
      readonly trainersDesc: string;
      /** EH-INT-09 — the J-16 assignment-request queue. */
      readonly assignmentsTitle: string;
      readonly assignmentsDesc: string;
      /** EH-INT-10 — the J-20 material & content review queue. */
      readonly submissionsTitle: string;
      readonly submissionsDesc: string;
      readonly directoryTitle: string;
      readonly directoryDesc: string;
    };
    readonly recent: {
      readonly heading: string;
      readonly viewAll: string;
      readonly empty: string;
      readonly submitted: (date: string) => string;
    };
    readonly guide: {
      readonly heading: string;
      readonly body: string;
      readonly mediaCaption: string;
    };
    readonly errors: {
      readonly loadTitle: string;
      readonly loadBody: string;
      readonly retry: string;
    };
  };
  readonly inbox: {
    readonly documentTitle: string;
    readonly title: string;
    readonly subtitle: string;
    /** The workspace root the breadcrumb starts from. */
    readonly breadcrumbRoot: string;
    readonly breadcrumbLabel: string;
    readonly countSummary: (total: number) => string;
    readonly filters: {
      readonly regionLabel: string;
      readonly searchLabel: string;
      readonly searchPlaceholder: string;
      readonly statusLabel: string;
      readonly allOption: string;
      readonly clear: string;
      /** Introduces the row of currently-applied filters. */
      readonly activeHeading: string;
      /** Accessible name for a chip's remove control. */
      readonly removeFilter: (label: string, value: string) => string;
    };
    readonly list: {
      readonly caption: string;
      readonly headers: {
        readonly reference: string;
        readonly applicant: string;
        readonly services: string;
        readonly status: string;
        readonly submittedAt: string;
        readonly age: string;
        readonly action: string;
      };
      readonly open: string;
      /** «٤ أيام» — how long this application has been waiting. */
      readonly age: (days: string) => string;
    };
    readonly empty: { readonly title: string; readonly body: string };
    readonly noResults: { readonly title: string; readonly body: string };
    readonly pagination: {
      readonly label: string;
      readonly previous: string;
      readonly next: string;
      /** «عرض ١–١٠ من ١٤» — which slice of the result this page shows. */
      readonly range: (from: number, to: number, total: number) => string;
    };
    readonly errors: {
      readonly loadTitle: string;
      readonly loadBody: string;
      readonly sessionTitle: string;
      readonly sessionBody: string;
      readonly unauthorizedTitle: string;
      readonly unauthorizedBody: string;
      readonly retry: string;
    };
  };
  readonly statuses: Readonly<Record<ApplicationPresentationStatus, string>>;
  readonly services: Readonly<Record<ApplicationService, string>>;
}

const ar: InternalContent = {
  dashboard: {
    documentTitle: 'لوحة العمل — منصة الخبراء والمدربين',
    eyebrow: 'مساحة العمل الداخلية',
    greeting: (name) => `مرحبًا، ${name}`,
    subtitle: 'نظرة سريعة على أولويات اليوم والطلبات التي تنتظر إجراءً.',
    openSummary: (count) => `لديك ${arNumber(count)} طلبًا مفتوحًا قيد المعالجة.`,
    metricsLabel: 'مؤشرات العمل',
    metrics: {
      'awaiting-screening': 'بانتظار الفرز',
      'in-screening': 'قيد الفرز',
      interviews: 'مقابلات مجدولة',
      'awaiting-decision': 'بانتظار القرار',
      'materials-awaiting-approval': 'مواد بانتظار الاعتماد',
    },
    delta: {
      up: (count) => `+${count} هذا الأسبوع`,
      down: (count) => `−${count} هذا الأسبوع`,
      flat: 'لا تغيّر عن الأسبوع الماضي',
    },
    sla: {
      heading: 'الالتزام بالمهل',
      caption: 'المهل المعتمدة في مصفوفة المهل، والمقاس منها فعليًا.',
      stage: 'المرحلة',
      target: 'المهلة',
      actual: 'المتوسط الفعلي',
      breaches: 'تجاوزات',
      days: (count) => `${count} يوم`,
      measured: (count) => `من ${count} حالة`,
      targetUndefined: 'لم تُحدَّد',
      notMeasured: 'غير مقاس',
      empty: 'لا توجد مهل معرّفة بعد.',
    },
    distribution: {
      heading: 'توزّع الطلبات على المراحل',
      label: 'توزّع الطلبات المفتوحة',
      empty: 'لا توجد طلبات مفتوحة.',
    },
    quickLinks: {
      heading: 'روابط سريعة',
      inboxTitle: 'صندوق الطلبات',
      inboxDesc: 'استعرض الطلبات الواردة وابدأ عملية الفرز.',
      serviceRequestsTitle: 'طلبات إضافة الخدمات',
      serviceRequestsDesc: 'قرارات إدارية مباشرة على طلبات المدربين المعتمدين.',
      submissionsTitle: 'المواد والمحتوى',
      submissionsDesc: 'مراجعة واعتماد ما يرفعه المدربون ومطوّرو المحتوى.',
      agreementsTitle: 'إدارة الاتفاقيات',
      agreementsDesc: 'متابعة قرب الانتهاء والتجديد والإيقاف والإنهاء.',
      trainersTitle: 'قاعدة المدربين',
      trainersDesc: 'ابحث واستعرض الملف الشامل لكل مدرب معتمد.',
      assignmentsTitle: 'طلبات الإسناد',
      assignmentsDesc: 'أنشئ طلب احتياج وتابع مساره في المطابقة.',
      directoryTitle: 'دليل الخبراء والمدربين',
      directoryDesc: 'تصفّح الخبراء المعتمدين الظاهرين للعموم.',
    },
    recent: {
      heading: 'أحدث الطلبات',
      viewAll: 'عرض جميع الطلبات',
      empty: 'لا توجد طلبات حديثة.',
      submitted: (date) => `قُدّم في ${date}`,
    },
    guide: {
      heading: 'دليل البدء السريع',
      body: 'تعرّف على مراحل معالجة الطلب: الفرز، ثم المقابلة، ثم قرار اللجنة، وصولًا إلى الاعتماد وتوقيع الاتفاقية.',
      mediaCaption: 'مخطط توضيحي لمراحل المعالجة',
    },
    errors: {
      loadTitle: 'تعذّر تحميل لوحة العمل',
      loadBody: 'حدث خطأ أثناء تحميل لوحة العمل. يُرجى المحاولة مرة أخرى.',
      retry: 'إعادة المحاولة',
    },
  },
  inbox: {
    documentTitle: 'صندوق الطلبات — منصة الخبراء والمدربين',
    title: 'صندوق الطلبات',
    subtitle: 'استعرض الطلبات الواردة، وافتح أي طلب لبدء الفرز.',
    breadcrumbRoot: 'لوحة العمل',
    breadcrumbLabel: 'مسار التنقل',
    countSummary: (total) => `${arNumber(total)} طلبًا في صندوق الوارد`,
    filters: {
      regionLabel: 'تصفية الطلبات',
      searchLabel: 'بحث',
      searchPlaceholder: 'ابحث بالاسم أو رقم الطلب',
      statusLabel: 'الحالة',
      allOption: 'كل الحالات',
      clear: 'مسح التصفية',
      activeHeading: 'التصفية النشطة:',
      removeFilter: (label, value) => `أزل تصفية ${label}: ${value}`,
    },
    list: {
      caption: 'قائمة الطلبات الواردة',
      headers: {
        reference: 'رقم الطلب',
        applicant: 'مقدّم الطلب',
        services: 'الخدمات',
        status: 'الحالة',
        submittedAt: 'تاريخ التقديم',
        age: 'المدة',
        action: 'إجراء',
      },
      open: 'فتح',
      age: (days) => `${days} يوم`,
    },
    empty: {
      title: 'لا توجد طلبات',
      body: 'لا توجد طلبات واردة حاليًا. ستظهر الطلبات الجديدة هنا فور تقديمها.',
    },
    noResults: {
      title: 'لا توجد نتائج مطابقة',
      body: 'لم نعثر على طلبات تطابق هذه التصفية. جرّب تعديل البحث أو الحالة.',
    },
    pagination: {
      label: 'تنقل بين صفحات الطلبات',
      previous: 'السابق',
      next: 'التالي',
      range: (from, to, total) => {
        const n = numberFormatter('ar');
        return `عرض ${n.format(from)}–${n.format(to)} من ${n.format(total)}`;
      },
    },
    errors: {
      loadTitle: 'تعذّر تحميل الطلبات',
      loadBody: 'حدث خطأ أثناء تحميل صندوق الطلبات. يُرجى المحاولة مرة أخرى.',
      sessionTitle: 'انتهت الجلسة',
      sessionBody: 'انتهت جلستك. يُرجى تسجيل الدخول مرة أخرى للمتابعة.',
      unauthorizedTitle: 'لا تملك صلاحية الوصول',
      unauthorizedBody: 'ليست لديك الصلاحية اللازمة لعرض صندوق الطلبات.',
      retry: 'إعادة المحاولة',
    },
  },
  statuses: getMyApplicationsContent('ar').statuses,
  services: getMyApplicationsContent('ar').services,
};

const en: InternalContent = {
  dashboard: {
    documentTitle: 'Workspace — Expert Hub',
    eyebrow: 'Internal workspace',
    greeting: (name) => `Welcome, ${name}`,
    subtitle: "A quick view of today's priorities and the applications awaiting action.",
    openSummary: (count) => `You have ${formatNumber(count, 'en')} open applications in progress.`,
    metricsLabel: 'Work metrics',
    metrics: {
      'awaiting-screening': 'Awaiting screening',
      'in-screening': 'In screening',
      interviews: 'Interviews scheduled',
      'awaiting-decision': 'Awaiting decision',
      'materials-awaiting-approval': 'Materials awaiting approval',
    },
    delta: {
      up: (count) => `+${count} this week`,
      down: (count) => `−${count} this week`,
      flat: 'No change from last week',
    },
    sla: {
      heading: 'Deadline performance',
      caption: 'The deadlines set in the SLA matrix, and what is actually measured against them.',
      stage: 'Stage',
      target: 'Deadline',
      actual: 'Actual average',
      breaches: 'Breaches',
      days: (count) => `${count} days`,
      measured: (count) => `from ${count} cases`,
      targetUndefined: 'Not set',
      notMeasured: 'Not measured',
      empty: 'No deadlines are defined yet.',
    },
    distribution: {
      heading: 'Applications by stage',
      label: 'Open applications by stage',
      empty: 'No open applications.',
    },
    quickLinks: {
      heading: 'Quick links',
      inboxTitle: 'Application inbox',
      inboxDesc: 'Review incoming applications and start screening.',
      serviceRequestsTitle: 'Service addition requests',
      serviceRequestsDesc: 'Direct administrative decisions on accredited trainers’ requests.',
      submissionsTitle: 'Material & content',
      submissionsDesc: 'Review and approve what trainers and content developers upload.',
      agreementsTitle: 'Agreement management',
      agreementsDesc: 'Track expiry, renew, suspend and end agreements.',
      trainersTitle: 'Trainer database',
      trainersDesc: 'Search and review each accredited trainer’s unified profile.',
      assignmentsTitle: 'Assignment requests',
      assignmentsDesc: 'Raise a need and follow it through matching.',
      directoryTitle: 'Expert & Trainer Directory',
      directoryDesc: 'Browse the accredited experts visible to the public.',
    },
    recent: {
      heading: 'Recent applications',
      viewAll: 'View all applications',
      empty: 'No recent applications.',
      submitted: (date) => `Submitted on ${date}`,
    },
    guide: {
      heading: 'Quick-start guide',
      body: 'Get familiar with the application pipeline: screening, then interview, then the committee decision, through to accreditation and signing the agreement.',
      mediaCaption: 'Illustration of the processing stages',
    },
    errors: {
      loadTitle: 'Could not load the workspace',
      loadBody: 'Something went wrong while loading the workspace. Please try again.',
      retry: 'Try again',
    },
  },
  inbox: {
    documentTitle: 'Application inbox — Expert Hub',
    title: 'Application inbox',
    subtitle: 'Review incoming applications, and open one to start screening.',
    breadcrumbRoot: 'Workspace',
    breadcrumbLabel: 'Breadcrumb',
    countSummary: (total) => `${formatNumber(total, 'en')} applications in the inbox`,
    filters: {
      regionLabel: 'Filter applications',
      searchLabel: 'Search',
      searchPlaceholder: 'Search by name or reference',
      statusLabel: 'Status',
      allOption: 'All statuses',
      clear: 'Clear filters',
      activeHeading: 'Active filters:',
      removeFilter: (label, value) => `Remove ${label} filter: ${value}`,
    },
    list: {
      caption: 'Incoming applications',
      headers: {
        reference: 'Reference',
        applicant: 'Applicant',
        services: 'Services',
        status: 'Status',
        submittedAt: 'Submitted',
        age: 'Waiting',
        action: 'Action',
      },
      open: 'Open',
      age: (days) => `${days} days`,
    },
    empty: {
      title: 'No applications',
      body: 'There are no incoming applications right now. New ones appear here as soon as they are submitted.',
    },
    noResults: {
      title: 'No matching results',
      body: 'We could not find applications matching this filter. Try adjusting the search or status.',
    },
    pagination: {
      label: 'Inbox pages',
      previous: 'Previous',
      next: 'Next',
      range: (from, to, total) => {
        const n = numberFormatter('en');
        return `Showing ${n.format(from)}–${n.format(to)} of ${n.format(total)}`;
      },
    },
    errors: {
      loadTitle: 'Could not load applications',
      loadBody: 'Something went wrong while loading the inbox. Please try again.',
      sessionTitle: 'Session expired',
      sessionBody: 'Your session has expired. Please log in again to continue.',
      unauthorizedTitle: 'You do not have access',
      unauthorizedBody: 'You do not have permission to view the application inbox.',
      retry: 'Try again',
    },
  },
  statuses: getMyApplicationsContent('en').statuses,
  services: getMyApplicationsContent('en').services,
};

const CONTENT: Record<Locale, InternalContent> = { ar, en };

export function getInternalContent(locale: Locale): InternalContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
