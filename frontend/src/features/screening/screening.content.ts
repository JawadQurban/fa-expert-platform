import type { Locale } from '@/types';
import type {
  ApplicationPresentationStatus,
  ApplicationService,
} from '../applications/application.types';
import { getMyApplicationsContent } from '../applications/myApplications.content';
import type {
  AcceptValidationCode,
  ApplicationSource,
  ExemptionReasonId,
  RejectionReasonId,
  SlaState,
} from './screening.types';
import { arNumber, formatNumber } from '../../shared/formatting';

/**
 * EH-INT-03 copy (J-05 Screening & Initial Decision + J-08 Interview Exemption)
 * — Arabic authoritative, English best-effort. Status and service labels are
 * reused from `myApplications.content` (single source across the product).
 *
 * The AI panel copy carries the advisory disclaimer required by `BR-0202` /
 * J-05/F4: the analysis is assistive and is never part of the official score.
 */

export interface ScreeningContent {
  readonly documentTitle: (reference: string) => string;
  /** Accessible name for the tablist that groups the review material. */
  readonly reviewTabsLabel: string;
  readonly backToInbox: string;
  /** Shown once the application has reached an interview stage (EH-INT-04). */
  readonly goToInterview: string;
  /** The breadcrumb's parent — the inbox, named as it is in the header. */
  readonly inboxCrumb: string;
  /** «قُدّم ٢٢ يوليو ٢٠٢٦» — the submission fact in the record head. */
  readonly submittedOn: (date: string) => string;
  /**
   * The application has moved past screening. This page is where the inbox
   * lands for EVERY stage, so it must be able to hand the reader on to
   * whichever stage the application is actually at — otherwise the chain dead
   * ends here and the next step is reachable only by typing a URL.
   */
  readonly goToCommittee: string;
  readonly goToAgreement: string;
  readonly currentStageNote: string;
  readonly eyebrow: string;
  readonly applicantLabel: string;
  readonly referenceLabel: string;
  readonly submittedLabel: string;
  readonly servicesLabel: string;
  readonly sourceLabel: string;
  readonly sources: Readonly<Record<ApplicationSource, string>>;
  readonly sla: {
    readonly heading: string;
    readonly labels: Readonly<Record<SlaState, string>>;
    readonly remaining: (days: number) => string;
    readonly overdue: (days: number) => string;
    readonly dueOn: (date: string) => string;
    /** ⚠️ Shown while no duration is configured centrally (`DM-GAP-10`). */
    readonly notConfigured: string;
  };
  readonly scores: {
    readonly heading: string;
    readonly description: string;
    readonly perServiceNote: string;
    readonly scoreOf: (service: string) => string;
    readonly outOf: (score: string) => string;
    /** The scale beside a score already shown on its own — «من ١٠٠». */
    readonly outOfScale: string;
    readonly thresholdLabel: (threshold: string) => string;
    readonly belowThreshold: string;
    readonly belowThresholdNote: string;
    readonly modelVersion: (version: string) => string;
    readonly criteriaHeading: string;
    readonly criterionHeaders: {
      readonly criterion: string;
      readonly weight: string;
      readonly rawScore: string;
      readonly weighted: string;
      readonly unresolved: string;
    };
  };
  readonly insight: {
    readonly heading: string;
    readonly advisoryTitle: string;
    readonly advisoryBody: string;
    readonly strengthsHeading: string;
    readonly considerationsHeading: string;
    readonly scopeNote: (fields: string) => string;
    readonly generatedAt: (date: string) => string;
    readonly unavailableTitle: string;
    readonly unavailableBody: string;
  };
  readonly form: {
    readonly heading: string;
    readonly description: string;
    readonly qualitativeTag: string;
    readonly emptyValue: string;
  };
  readonly attachments: {
    readonly heading: string;
    readonly description: string;
    readonly sizeLabel: (kb: string) => string;
    readonly preview: string;
    readonly unavailable: string;
    readonly empty: string;
  };
  readonly decision: {
    readonly heading: string;
    readonly description: string;
    readonly selectServicesHeading: string;
    readonly selectServicesHint: string;
    readonly autoRejectWarning: (services: string) => string;
    readonly pathHeading: (service: string) => string;
    readonly pathLegend: string;
    readonly pathInterview: string;
    readonly pathExemption: string;
    readonly slotsHeading: string;
    readonly slotsHint: string;
    readonly slotLabel: (index: number) => string;
    readonly addSlot: string;
    readonly removeSlot: string;
    readonly committeeHeading: string;
    readonly committeeHint: string;
    readonly exemptionReasonLabel: string;
    readonly exemptionReasonPlaceholder: string;
    readonly exemptionOtherLabel: string;
    readonly accept: string;
    readonly reject: string;
    readonly errorsHeading: string;
    readonly errors: Readonly<Record<AcceptValidationCode, (service: string) => string>>;
    readonly rejectReasonRequired: string;
    readonly rejectReasonOtherError: string;
  };
  readonly acceptDialog: {
    readonly title: string;
    readonly body: (services: string) => string;
    readonly autoRejected: (services: string) => string;
    readonly exempted: (services: string) => string;
    readonly confirm: string;
    readonly cancel: string;
  };
  readonly rejectDialog: {
    readonly title: string;
    readonly warning: string;
    readonly reasonLabel: string;
    readonly reasonPlaceholder: string;
    readonly otherLabel: string;
    readonly confirm: string;
    readonly cancel: string;
  };
  readonly recorded: {
    readonly acceptTitle: string;
    readonly acceptBody: (services: string) => string;
    readonly rejectTitle: string;
    readonly rejectBody: string;
    readonly decidedBy: (name: string, date: string) => string;
    readonly acceptedLabel: string;
    readonly autoRejectedLabel: string;
    readonly exemptedLabel: string;
    readonly reasonLabel: string;
    readonly backToInbox: string;
    /** Shown when the application has already moved past screening. */
    readonly alreadyScreened: string;
  };
  readonly toasts: {
    readonly accepted: string;
    readonly rejected: string;
  };
  readonly errors: {
    readonly loadTitle: string;
    readonly loadBody: string;
    readonly notFoundTitle: string;
    readonly notFoundBody: string;
    readonly sessionTitle: string;
    readonly sessionBody: string;
    readonly unauthorizedTitle: string;
    readonly unauthorizedBody: string;
    readonly submitTitle: string;
    readonly submitBody: string;
    readonly retry: string;
  };
  readonly rejectionReasons: Readonly<Record<RejectionReasonId, string>>;
  readonly exemptionReasons: Readonly<Record<ExemptionReasonId, string>>;
  readonly statuses: Readonly<Record<ApplicationPresentationStatus, string>>;
  readonly services: Readonly<Record<ApplicationService, string>>;
}

const ar: ScreeningContent = {
  documentTitle: (reference) => `فرز الطلب ${reference} — منصة الخبراء والمدربين`,
  reviewTabsLabel: 'مواد المراجعة',
  backToInbox: 'العودة إلى صندوق الطلبات',
  goToInterview: 'الانتقال إلى تقييم المقابلة',
  inboxCrumb: 'صندوق الطلبات',
  submittedOn: (date) => `قُدّم ${date}`,
  goToCommittee: 'الانتقال إلى لجنة الاعتماد',
  goToAgreement: 'الانتقال إلى إعداد الاتفاقية',
  currentStageNote: 'تجاوز الطلب مرحلة الفرز. تابع من المرحلة الحالية:',
  eyebrow: 'الفرز الأولي',
  applicantLabel: 'مقدّم الطلب',
  referenceLabel: 'رقم الطلب',
  submittedLabel: 'تاريخ التقديم',
  servicesLabel: 'الخدمات المطلوبة',
  sourceLabel: 'مصدر الطلب',
  sources: {
    'self-service': 'تقديم ذاتي',
    'internal-nomination': 'ترشيح داخلي',
  },
  sla: {
    heading: 'مدة الإنجاز',
    labels: {
      within: 'ضمن المدة',
      approaching: 'تقترب المدة',
      breached: 'تجاوز المدة',
    },
    remaining: (days) => `متبقٍ ${arNumber(days)} يوم`,
    overdue: (days) => `متأخر ${arNumber(days)} يوم`,
    dueOn: (date) => `الموعد المستهدف: ${date}`,
    notConfigured: 'لم تُضبط مدة إنجاز للفرز بعد — تُحدَّد من شاشة إدارة المهل.',
  },
  scores: {
    heading: 'النتيجة الموضوعية',
    description:
      'تُحتسب النتيجة آليًا لكل خدمة على حدة وفق مصفوفة التقييم المعتمدة، دون أي تدخل بشري أو آلي.',
    perServiceNote: 'لكل خدمة نتيجة مستقلة — لا توجد نتيجة مجمّعة للطلب.',
    scoreOf: (service) => `نتيجة خدمة ${service}`,
    outOf: (score) => `${score} من 100`,
    outOfScale: 'من 100',
    thresholdLabel: (threshold) => `الحد الأدنى المعتمد: ${threshold}`,
    belowThreshold: 'دون الحد الأدنى',
    belowThresholdNote: 'مؤشر للعرض فقط ولا يؤثر تلقائيًا على القرار.',
    modelVersion: (version) => `إصدار نموذج التقييم: ${version}`,
    criteriaHeading: 'تفصيل المعايير',
    criterionHeaders: {
      criterion: 'المعيار',
      weight: 'الوزن',
      rawScore: 'الدرجة',
      weighted: 'الدرجة الموزونة',
      unresolved: 'غير مصنّف — يحتاج ضبط الإعدادات',
    },
  },
  insight: {
    heading: 'التحليل المساعد للأسئلة النوعية',
    advisoryTitle: 'معلومة مساعدة — ليست جزءًا من النتيجة',
    advisoryBody:
      'هذا التحليل مساعد فقط، ويقتصر على الأسئلة النوعية في نموذج الطلب. لا يُدمج في النتيجة الموضوعية بأي حال، ولا يشمل المرفقات.',
    strengthsHeading: 'نقاط القوة',
    considerationsHeading: 'ملاحظات للانتباه',
    scopeNote: (fields) => `نطاق التحليل: ${fields}`,
    generatedAt: (date) => `أُنتج في ${date}`,
    unavailableTitle: 'التحليل المساعد غير متوفر',
    unavailableBody: 'لم يُنتج تحليل للأسئلة النوعية لهذا الطلب. لا يؤثر ذلك على اتخاذ القرار.',
  },
  form: {
    heading: 'بيانات الطلب',
    description: 'استعرض أقسام النموذج حقلًا حقلًا قبل اتخاذ القرار.',
    qualitativeTag: 'سؤال نوعي',
    emptyValue: 'لم يُعبّأ',
  },
  attachments: {
    heading: 'المرفقات',
    description: 'المرفقات المرفوعة مع الطلب.',
    sizeLabel: (kb) => `${kb} كيلوبايت`,
    preview: 'معاينة',
    unavailable: 'المعاينة غير متاحة حاليًا',
    empty: 'لا توجد مرفقات مع هذا الطلب.',
  },
  decision: {
    heading: 'القرار',
    description:
      'حدّد الخدمات المقبولة، ولكل خدمة مقبولة اختر إمّا مواعيد مقابلة مع أعضاء اللجنة معًا، أو استثناءً من المقابلة مع سببه.',
    selectServicesHeading: 'الخدمات المقبولة',
    selectServicesHint: 'يمكن قبول أكثر من خدمة في القرار نفسه.',
    autoRejectWarning: (services) =>
      `الخدمات غير المحدّدة تُرفض تلقائيًا مع تسجيل تنبيه في القرار: ${services}`,
    pathHeading: (service) => `مسار خدمة ${service}`,
    pathLegend: 'مسار الخدمة بعد القبول',
    pathInterview: 'جدولة مقابلة',
    pathExemption: 'استثناء من المقابلة',
    slotsHeading: 'المواعيد المقترحة',
    slotsHint: 'أضف موعدًا واحدًا على الأقل ليختار منه المتقدم.',
    slotLabel: (index) => `الموعد ${arNumber(index)}`,
    addSlot: 'إضافة موعد',
    removeSlot: 'حذف الموعد',
    committeeHeading: 'أعضاء لجنة المقابلة',
    committeeHint: 'اختر عضوًا واحدًا على الأقل. يُرسل الموعد واللجنة معًا في الخطوة نفسها.',
    exemptionReasonLabel: 'سبب الاستثناء',
    exemptionReasonPlaceholder: 'اختر السبب',
    exemptionOtherLabel: 'اذكر السبب',
    accept: 'قبول الطلب',
    reject: 'رفض الطلب',
    errorsHeading: 'لا يمكن إتمام القرار قبل استكمال ما يلي',
    errors: {
      'no-service-selected': () => 'اختر خدمة واحدة على الأقل لقبولها.',
      'slots-missing': (service) => `أضف موعد مقابلة واحدًا على الأقل لخدمة ${service}.`,
      'committee-missing': (service) => `اختر عضو لجنة واحدًا على الأقل لخدمة ${service}.`,
      'exemption-reason-missing': (service) => `اختر سبب الاستثناء لخدمة ${service}.`,
      'exemption-reason-other-missing': (service) => `اذكر سبب الاستثناء لخدمة ${service}.`,
    },
    rejectReasonRequired: 'اختر سبب الرفض للمتابعة.',
    rejectReasonOtherError: 'اذكر سبب الرفض.',
  },
  acceptDialog: {
    title: 'تأكيد قبول الطلب',
    body: (services) => `سيتم قبول الخدمات التالية: ${services}.`,
    autoRejected: (services) => `وسترفض تلقائيًا: ${services}.`,
    exempted: (services) =>
      `الخدمات المستثناة من المقابلة تنتقل مباشرة إلى لجنة الاعتماد: ${services}.`,
    confirm: 'تأكيد القبول',
    cancel: 'إلغاء',
  },
  rejectDialog: {
    title: 'تأكيد رفض الطلب',
    warning: 'هذا الإجراء يرفض الطلب بالكامل بجميع خدماته. لا يمكن التراجع عنه.',
    reasonLabel: 'سبب الرفض',
    reasonPlaceholder: 'اختر السبب',
    otherLabel: 'اذكر السبب',
    confirm: 'تأكيد الرفض',
    cancel: 'إلغاء',
  },
  recorded: {
    acceptTitle: 'تم تسجيل قرار القبول',
    acceptBody: (services) => `قُبلت الخدمات التالية: ${services}.`,
    rejectTitle: 'تم تسجيل قرار الرفض',
    rejectBody: 'رُفض الطلب بالكامل بجميع خدماته.',
    decidedBy: (name, date) => `بواسطة ${name} في ${date}`,
    acceptedLabel: 'الخدمات المقبولة',
    autoRejectedLabel: 'الخدمات المرفوضة تلقائيًا',
    exemptedLabel: 'الخدمات المستثناة من المقابلة',
    reasonLabel: 'سبب الرفض',
    backToInbox: 'العودة إلى صندوق الطلبات',
    alreadyScreened:
      'فُرز هذا الطلب سابقًا وانتقل إلى المرحلة التالية. النتائج أعلاه متاحة للاطلاع.',
  },
  toasts: {
    accepted: 'تم تسجيل القرار وإشعار المتقدم.',
    rejected: 'تم تسجيل الرفض وإشعار المتقدم.',
  },
  errors: {
    loadTitle: 'تعذّر تحميل الطلب',
    loadBody: 'حدث خطأ أثناء تحميل بيانات الفرز. يُرجى المحاولة مرة أخرى.',
    notFoundTitle: 'الطلب غير موجود',
    notFoundBody: 'لم نعثر على طلب بهذا المعرّف. قد يكون حُذف أو أن الرابط غير صحيح.',
    sessionTitle: 'انتهت الجلسة',
    sessionBody: 'انتهت جلستك. يُرجى تسجيل الدخول مرة أخرى للمتابعة.',
    unauthorizedTitle: 'لا تملك صلاحية الوصول',
    unauthorizedBody: 'ليست لديك الصلاحية اللازمة لفرز هذا الطلب.',
    submitTitle: 'تعذّر تسجيل القرار',
    submitBody: 'حدث خطأ أثناء تسجيل القرار ولم يُحفظ. يُرجى المحاولة مرة أخرى.',
    retry: 'إعادة المحاولة',
  },
  // PENDING_APPROVED_REJECTION_REASON_MATRIX — no approved wording exists, so
  // these mirror the API's `ServiceRequestRejectionReasons` exactly: the API
  // stores that Arabic label on the rejected application, and the same code
  // must never read two ways.
  rejectionReasons: {
    'insufficient-qualifications': 'عدم استيفاء المؤهلات المطلوبة',
    'insufficient-experience': 'الخبرة العملية غير كافية للخدمة المطلوبة',
    'incomplete-documents': 'المستندات غير مكتملة',
    'specialty-not-required': 'التخصص غير مطلوب حاليًا',
    other: 'سبب آخر',
  },
  exemptionReasons: {
    expert: 'خبير',
    'prior-collaboration': 'تعاون سابق موثَّق مع الأكاديمية',
    other: 'أخرى (نص حر)',
  },
  statuses: getMyApplicationsContent('ar').statuses,
  services: getMyApplicationsContent('ar').services,
};

const en: ScreeningContent = {
  documentTitle: (reference) => `Screening ${reference} — Expert Hub`,
  reviewTabsLabel: 'Review material',
  backToInbox: 'Back to the application inbox',
  goToInterview: 'Go to the interview evaluation',
  inboxCrumb: 'Application inbox',
  submittedOn: (date) => `Submitted ${date}`,
  goToCommittee: 'Go to the approval committee',
  goToAgreement: 'Go to agreement preparation',
  currentStageNote: 'This application has moved past screening. Continue from its current stage:',
  eyebrow: 'Initial screening',
  applicantLabel: 'Applicant',
  referenceLabel: 'Reference',
  submittedLabel: 'Submitted',
  servicesLabel: 'Requested services',
  sourceLabel: 'Source',
  sources: {
    'self-service': 'Self-submitted',
    'internal-nomination': 'Internal nomination',
  },
  sla: {
    heading: 'Service level',
    labels: {
      within: 'Within SLA',
      approaching: 'Approaching SLA',
      breached: 'SLA breached',
    },
    remaining: (days) => `${formatNumber(days, 'en')} days remaining`,
    overdue: (days) => `${formatNumber(days, 'en')} days overdue`,
    dueOn: (date) => `Due by ${date}`,
    notConfigured: 'No screening deadline is configured yet — it is set on the deadline console.',
  },
  scores: {
    heading: 'Objective score',
    description:
      'The score is calculated automatically per service against the approved evaluation matrix, with no human or AI input.',
    perServiceNote:
      'Each service is scored independently — there is no combined application score.',
    scoreOf: (service) => `${service} score`,
    outOf: (score) => `${score} out of 100`,
    outOfScale: 'out of 100',
    thresholdLabel: (threshold) => `Approved minimum: ${threshold}`,
    belowThreshold: 'Below minimum',
    belowThresholdNote: 'A display-only indicator with no automated effect on the decision.',
    modelVersion: (version) => `Evaluation model version: ${version}`,
    criteriaHeading: 'Criteria breakdown',
    criterionHeaders: {
      criterion: 'Criterion',
      weight: 'Weight',
      rawScore: 'Score',
      weighted: 'Weighted',
      unresolved: 'Unclassified — needs configuration',
    },
  },
  insight: {
    heading: 'Assistive analysis of qualitative questions',
    advisoryTitle: 'Advisory only — not part of the score',
    advisoryBody:
      'This analysis is assistive and covers only the qualitative questions in the application form. It is never merged into the objective score, and it does not read attachments.',
    strengthsHeading: 'Strengths',
    considerationsHeading: 'Points to consider',
    scopeNote: (fields) => `Analysis scope: ${fields}`,
    generatedAt: (date) => `Generated on ${date}`,
    unavailableTitle: 'Assistive analysis unavailable',
    unavailableBody:
      'No qualitative analysis was produced for this application. This does not affect the decision.',
  },
  form: {
    heading: 'Application data',
    description: 'Review the form sections field by field before deciding.',
    qualitativeTag: 'Qualitative question',
    emptyValue: 'Not provided',
  },
  attachments: {
    heading: 'Attachments',
    description: 'Files uploaded with the application.',
    sizeLabel: (kb) => `${kb} KB`,
    preview: 'Preview',
    unavailable: 'Preview is not available yet',
    empty: 'No attachments were uploaded with this application.',
  },
  decision: {
    heading: 'Decision',
    description:
      'Select the accepted services. For each accepted service choose either interview slots together with committee members, or an interview exemption with its reason.',
    selectServicesHeading: 'Accepted services',
    selectServicesHint: 'More than one service can be accepted in the same decision.',
    autoRejectWarning: (services) =>
      `Services left unselected are automatically rejected, with an alert logged against the decision: ${services}`,
    pathHeading: (service) => `${service} path`,
    pathLegend: 'Path after acceptance',
    pathInterview: 'Schedule an interview',
    pathExemption: 'Exempt from the interview',
    slotsHeading: 'Proposed slots',
    slotsHint: 'Add at least one slot for the applicant to choose from.',
    slotLabel: (index) => `Slot ${formatNumber(index, 'en')}`,
    addSlot: 'Add a slot',
    removeSlot: 'Remove slot',
    committeeHeading: 'Interview committee members',
    committeeHint:
      'Select at least one member. Slots and committee are sent together in the same step.',
    exemptionReasonLabel: 'Exemption reason',
    exemptionReasonPlaceholder: 'Select a reason',
    exemptionOtherLabel: 'State the reason',
    accept: 'Accept application',
    reject: 'Reject application',
    errorsHeading: 'The decision cannot be completed until the following is done',
    errors: {
      'no-service-selected': () => 'Select at least one service to accept.',
      'slots-missing': (service) => `Add at least one interview slot for ${service}.`,
      'committee-missing': (service) => `Select at least one committee member for ${service}.`,
      'exemption-reason-missing': (service) => `Select the exemption reason for ${service}.`,
      'exemption-reason-other-missing': (service) => `State the exemption reason for ${service}.`,
    },
    rejectReasonRequired: 'Select a rejection reason to continue.',
    rejectReasonOtherError: 'State the rejection reason.',
  },
  acceptDialog: {
    title: 'Confirm acceptance',
    body: (services) => `The following services will be accepted: ${services}.`,
    autoRejected: (services) => `These will be automatically rejected: ${services}.`,
    exempted: (services) =>
      `Services exempted from the interview go straight to the approval committee: ${services}.`,
    confirm: 'Confirm acceptance',
    cancel: 'Cancel',
  },
  rejectDialog: {
    title: 'Confirm rejection',
    warning: 'This rejects the entire application and all of its services. It cannot be undone.',
    reasonLabel: 'Rejection reason',
    reasonPlaceholder: 'Select a reason',
    otherLabel: 'State the reason',
    confirm: 'Confirm rejection',
    cancel: 'Cancel',
  },
  recorded: {
    acceptTitle: 'Acceptance recorded',
    acceptBody: (services) => `The following services were accepted: ${services}.`,
    rejectTitle: 'Rejection recorded',
    rejectBody: 'The entire application was rejected, with all of its services.',
    decidedBy: (name, date) => `By ${name} on ${date}`,
    acceptedLabel: 'Accepted services',
    autoRejectedLabel: 'Automatically rejected services',
    exemptedLabel: 'Services exempted from the interview',
    reasonLabel: 'Rejection reason',
    backToInbox: 'Back to the application inbox',
    alreadyScreened:
      'This application was already screened and has moved to the next stage. The results above remain available for review.',
  },
  toasts: {
    accepted: 'The decision was recorded and the applicant notified.',
    rejected: 'The rejection was recorded and the applicant notified.',
  },
  errors: {
    loadTitle: 'Could not load the application',
    loadBody: 'Something went wrong while loading the screening data. Please try again.',
    notFoundTitle: 'Application not found',
    notFoundBody: 'We could not find an application with this id. It may have been removed.',
    sessionTitle: 'Session expired',
    sessionBody: 'Your session has expired. Please log in again to continue.',
    unauthorizedTitle: 'You do not have access',
    unauthorizedBody: 'You do not have permission to screen this application.',
    submitTitle: 'Could not record the decision',
    submitBody: 'Something went wrong and the decision was not saved. Please try again.',
    retry: 'Try again',
  },
  rejectionReasons: {
    'insufficient-qualifications': 'Insufficient qualifications',
    'insufficient-experience': 'Insufficient experience',
    'incomplete-documents': 'Incomplete documents',
    'specialty-not-required': 'Specialty not currently required',
    other: 'Other',
  },
  exemptionReasons: {
    expert: 'Expert',
    'prior-collaboration': 'Documented prior collaboration with the Academy',
    other: 'Other (free text)',
  },
  statuses: getMyApplicationsContent('en').statuses,
  services: getMyApplicationsContent('en').services,
};

const CONTENT: Record<Locale, ScreeningContent> = { ar, en };

export function getScreeningContent(locale: Locale): ScreeningContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
