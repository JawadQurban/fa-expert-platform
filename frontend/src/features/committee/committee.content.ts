import type { Locale } from '@/types';
import type { ApplicationService } from '../applications/application.types';
import { getMyApplicationsContent } from '../applications/myApplications.content';
import { getScreeningContent } from '../screening/screening.content';
import type { RejectionReasonId } from '../screening/screening.types';
import type {
  ApproverObligation,
  BankDataState,
  FormationValidationCode,
  MemberDecisionState,
} from './committee.types';
import { arNumber, formatNumber } from '../../shared/formatting';

/**
 * EH-INT-05 copy (J-09 Approval Committee Decision) — Arabic authoritative,
 * English best-effort. The rejection reason list is imported from the screening
 * content: `BR-0219` defines **one platform-wide list**, so a second copy here
 * would be a second source of truth.
 */

export interface CommitteeContent {
  readonly documentTitle: (reference: string) => string;
  readonly backToInbox: string;
  /** The breadcrumb's first level — the inbox, named as the header names it. */
  readonly inboxCrumb: string;
  readonly eyebrow: string;
  readonly context: {
    readonly heading: string;
    readonly description: string;
    readonly screeningLabel: string;
    readonly interviewLabel: string;
    readonly exemptedLabel: string;
    readonly exemptionReasonLabel: string;
    readonly outOf: (value: string, max: string) => string;
    readonly wholeApplicationNote: string;
  };
  readonly formation: {
    readonly heading: string;
    readonly description: string;
    readonly templateLabel: string;
    readonly templatePlaceholder: string;
    readonly templateNone: string;
    readonly templateCopyNote: string;
    readonly membersHeading: string;
    readonly membersHint: string;
    readonly obligations: Readonly<Record<ApproverObligation, string>>;
    readonly obligationLegend: (name: string) => string;
    readonly mandatoryNote: string;
    readonly moveUp: string;
    readonly moveDown: string;
    readonly remove: string;
    readonly addHeading: string;
    readonly addPlaceholder: string;
    readonly add: string;
    readonly positionLabel: (position: number) => string;
    readonly saveTemplateLabel: string;
    readonly saveTemplateNameLabel: string;
    readonly submit: string;
    readonly errorsHeading: string;
    /** Only the formation rules J-09 enables — it never designates e-signers,
     *  so `no-signer-designated` carries no copy here. */
    readonly errors: Readonly<
      Record<Exclude<FormationValidationCode, 'no-signer-designated'>, string>
    >;
  };
  readonly sequence: {
    readonly heading: string;
    readonly description: string;
    readonly states: Readonly<Record<MemberDecisionState, string>>;
    readonly decidedAt: (date: string) => string;
    readonly you: string;
    readonly noteLabel: string;
  };
  readonly decision: {
    readonly heading: string;
    readonly description: string;
    readonly notYourTurnTitle: string;
    readonly notYourTurnBody: string;
    readonly noteLabel: string;
    readonly noteHint: string;
    readonly approve: string;
    readonly reject: string;
    readonly requestModification: string;
  };
  readonly approveDialog: {
    readonly title: string;
    readonly bodyAdvances: string;
    readonly bodyFinal: string;
    readonly confirm: string;
    readonly cancel: string;
  };
  readonly rejectDialog: {
    readonly title: string;
    readonly mandatoryWarning: string;
    readonly optionalWarning: string;
    readonly reasonLabel: string;
    readonly reasonPlaceholder: string;
    readonly otherLabel: string;
    readonly reasonRequired: string;
    readonly otherRequired: string;
    readonly confirm: string;
    readonly cancel: string;
  };
  readonly modificationDialog: {
    readonly title: string;
    readonly body: string;
    readonly noteLabel: string;
    readonly noteRequired: string;
    readonly confirm: string;
    readonly cancel: string;
  };
  readonly modificationBanner: {
    readonly title: string;
    readonly body: (name: string) => string;
    readonly resumeNote: string;
    readonly resubmit: string;
  };
  readonly outcome: {
    readonly approvedTitle: string;
    readonly approvedBody: string;
    readonly rejectedTitle: string;
    readonly rejectedBody: (name: string) => string;
    readonly reasonLabel: string;
    readonly optionalRejectionsHeading: string;
    readonly optionalRejectionsNote: string;
  };
  readonly bankData: {
    readonly heading: string;
    readonly description: string;
    readonly states: Readonly<Record<BankDataState, string>>;
    readonly requestedNote: string;
    readonly completeNote: string;
    readonly notRequestedNote: string;
    readonly gateReady: string;
    readonly gateBlocked: string;
    /** Link on to EH-INT-06a once both conditions are met (J-10). */
    readonly goToAgreement: string;
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
    /** 403 `only-application-creator` — J-09/F1/AC-2, `BR-0215`. */
    readonly onlyApplicationCreator: string;
    readonly retry: string;
  };
  readonly rejectionReasons: Readonly<Record<RejectionReasonId, string>>;
  readonly services: Readonly<Record<ApplicationService, string>>;
}

const ar: CommitteeContent = {
  documentTitle: (reference) => `لجنة الاعتماد ${reference} — منصة الخبراء والمدربين`,
  backToInbox: 'العودة إلى صندوق الطلبات',
  inboxCrumb: 'صندوق الطلبات',
  eyebrow: 'لجنة الاعتماد',
  context: {
    heading: 'نتائج المراحل السابقة',
    description:
      'نتيجة الفرز الأولي ونتيجة المقابلة المجمّعة لكل خدمة — دون عرض التقييمات الفردية للأعضاء.',
    screeningLabel: 'نتيجة الفرز',
    interviewLabel: 'نتيجة المقابلة',
    exemptedLabel: 'مستثنى من المقابلة',
    exemptionReasonLabel: 'سبب الاستثناء',
    outOf: (value, max) => `${value} من ${max}`,
    wholeApplicationNote: 'قرار اللجنة يصدر على الطلب ككل، لا على كل خدمة على حدة.',
  },
  formation: {
    heading: 'تشكيل لجنة الاعتماد',
    description:
      'اختر الأعضاء، ورتّب تسلسل الاعتماد، وحدّد لكل عضو ما إذا كان إلزاميًا أو اختياريًا.',
    templateLabel: 'قالب محفوظ',
    templatePlaceholder: 'اختر قالبًا',
    templateNone: 'بدون قالب — تشكيل جديد',
    templateCopyNote: 'تعديل القالب هنا يخص هذا الطلب فقط ولا يغيّر القالب المحفوظ.',
    membersHeading: 'تسلسل الاعتماد',
    membersHint: 'يصل الطلب إلى الأعضاء بالترتيب المحدّد أدناه.',
    obligations: {
      mandatory: 'إلزامي',
      optional: 'اختياري',
    },
    obligationLegend: (name) => `تصنيف العضو: ${name}`,
    mandatoryNote:
      'لا يُعتمد الطلب نهائيًا إلا بموافقة جميع الأعضاء الإلزاميين. رفض العضو الاختياري يُسجَّل كملاحظة فقط.',
    moveUp: 'تقديم في الترتيب',
    moveDown: 'تأخير في الترتيب',
    remove: 'إزالة العضو',
    addHeading: 'إضافة عضو',
    addPlaceholder: 'اختر عضوًا',
    add: 'إضافة',
    positionLabel: (position) => `الترتيب ${arNumber(position)}`,
    saveTemplateLabel: 'حفظ هذا التشكيل كقالب لإعادة استخدامه',
    saveTemplateNameLabel: 'اسم القالب',
    submit: 'اعتماد التشكيل وبدء التسلسل',
    errorsHeading: 'أكمل ما يلي قبل بدء التسلسل',
    errors: {
      'no-members': 'أضف عضوًا واحدًا على الأقل إلى التسلسل.',
      'no-mandatory-member':
        'أضف عضوًا إلزاميًا واحدًا على الأقل — الاعتماد النهائي يتطلب موافقة الأعضاء الإلزاميين.',
      'duplicate-member': 'لا يمكن تكرار العضو نفسه في التسلسل.',
      'template-name-missing': 'اكتب اسمًا للقالب قبل حفظه.',
    },
  },
  sequence: {
    heading: 'تسلسل الاعتماد',
    description: 'ينتقل الطلب تلقائيًا إلى العضو التالي بعد كل موافقة.',
    states: {
      waiting: 'بانتظار الدور',
      current: 'الدور الحالي',
      approved: 'وافق',
      rejected: 'رفض',
      'modification-requested': 'طلب تعديلًا',
    },
    decidedAt: (date) => `في ${date}`,
    you: 'أنت',
    noteLabel: 'ملاحظة',
  },
  decision: {
    heading: 'قرارك',
    description: 'وافق على الطلب، أو ارفضه، أو اطلب تعديلًا مع ملاحظة إلزامية.',
    notYourTurnTitle: 'ليس دورك حاليًا',
    notYourTurnBody: 'ستتمكن من اتخاذ القرار عند وصول الطلب إلى دورك في التسلسل.',
    noteLabel: 'ملاحظة (اختيارية)',
    noteHint: 'ملاحظة تُسجَّل مع قرارك.',
    approve: 'موافقة',
    reject: 'رفض',
    requestModification: 'طلب تعديل',
  },
  approveDialog: {
    title: 'تأكيد الموافقة',
    bodyAdvances: 'ستُسجَّل موافقتك وينتقل الطلب تلقائيًا إلى العضو التالي في التسلسل.',
    bodyFinal:
      'أنت آخر عضو إلزامي — بموافقتك يُعتمد الطلب نهائيًا، ويُطلب من المتقدم استكمال بياناته المصرفية في الوقت نفسه.',
    confirm: 'تأكيد الموافقة',
    cancel: 'إلغاء',
  },
  rejectDialog: {
    title: 'تأكيد الرفض',
    mandatoryWarning:
      'أنت عضو إلزامي — رفضك يوقف الطلب فورًا ويُسجَّل رفضًا نهائيًا للمتقدم. لا يمكن التراجع عنه.',
    optionalWarning:
      'أنت عضو اختياري — يُسجَّل رفضك كملاحظة في سجل القرار فقط، ويستمر التسلسل دون توقف.',
    reasonLabel: 'سبب الرفض',
    reasonPlaceholder: 'اختر السبب',
    otherLabel: 'اذكر السبب',
    reasonRequired: 'اختر سبب الرفض للمتابعة.',
    otherRequired: 'اذكر سبب الرفض.',
    confirm: 'تأكيد الرفض',
    cancel: 'إلغاء',
  },
  modificationDialog: {
    title: 'طلب تعديل',
    body: 'يتوقف التسلسل مؤقتًا وتصل ملاحظتك إلى منشئ الطلب وإلى جميع أعضاء اللجنة.',
    noteLabel: 'الملاحظة',
    noteRequired: 'اكتب الملاحظة — لا يمكن إرسال طلب التعديل بدونها.',
    confirm: 'إرسال طلب التعديل',
    cancel: 'إلغاء',
  },
  modificationBanner: {
    title: 'طلب تعديل قائم',
    body: (name) => `طلب ${name} تعديلًا على الطلب.`,
    resumeNote:
      'بعد إعادة الإرسال يستأنف التسلسل من العضو نفسه، دون التأثير على الموافقات السابقة.',
    resubmit: 'إعادة إرسال الطلب بعد التعديل',
  },
  outcome: {
    approvedTitle: 'اعتُمد الطلب نهائيًا',
    approvedBody: 'وافق جميع الأعضاء الإلزاميين. النتيجة متاحة لمنشئ الطلب لبدء إعداد الاتفاقية.',
    rejectedTitle: 'رُفض الطلب نهائيًا',
    rejectedBody: (name) => `أوقف ${name} الطلب برفض إلزامي.`,
    reasonLabel: 'سبب الرفض',
    optionalRejectionsHeading: 'اعتراضات الأعضاء الاختياريين',
    optionalRejectionsNote: 'مسجَّلة كملاحظات فقط — لم تؤثر على نتيجة الاعتماد.',
  },
  bankData: {
    heading: 'البيانات المصرفية للمتقدم',
    description: 'تُطلب من المتقدم بالتوازي مع الاعتماد النهائي، وتُستكمل قبل إعداد الاتفاقية.',
    states: {
      'not-requested': 'لم تُطلب بعد',
      requested: 'بانتظار استكمال المتقدم',
      complete: 'مكتملة',
    },
    requestedNote: 'فُتح للمتقدم استكمال البيانات المصرفية بعد الاعتماد النهائي، وهي بانتظاره.',
    completeNote: 'استكمل المتقدم بياناته المصرفية.',
    notRequestedNote: 'تُطلب تلقائيًا فور اكتمال الاعتماد النهائي.',
    gateReady: 'اكتمل الشرطان: الاعتماد النهائي والبيانات المصرفية — يمكن بدء إعداد الاتفاقية.',
    gateBlocked: 'لا يمكن بدء إعداد الاتفاقية قبل اكتمال الاعتماد النهائي والبيانات المصرفية معًا.',
    goToAgreement: 'الانتقال إلى إعداد الاتفاقية',
  },
  errors: {
    loadTitle: 'تعذّر تحميل بيانات اللجنة',
    loadBody: 'حدث خطأ أثناء تحميل بيانات لجنة الاعتماد. يُرجى المحاولة مرة أخرى.',
    notFoundTitle: 'الطلب غير موجود',
    notFoundBody: 'لم نعثر على طلب بهذا المعرّف.',
    sessionTitle: 'انتهت الجلسة',
    sessionBody: 'انتهت جلستك. يُرجى تسجيل الدخول مرة أخرى للمتابعة.',
    unauthorizedTitle: 'لا تملك صلاحية الوصول',
    unauthorizedBody: 'ليست لديك الصلاحية اللازمة لعرض لجنة الاعتماد لهذا الطلب.',
    submitTitle: 'تعذّر حفظ الإجراء',
    submitBody: 'حدث خطأ ولم يُحفظ الإجراء. يُرجى المحاولة مرة أخرى.',
    onlyApplicationCreator:
      'لا يشكّل لجنة الاعتماد إلا منشئ الطلب — الموظف الذي اتخذ قرار الفرز عليه.',
    retry: 'إعادة المحاولة',
  },
  rejectionReasons: getScreeningContent('ar').rejectionReasons,
  services: getMyApplicationsContent('ar').services,
};

const en: CommitteeContent = {
  documentTitle: (reference) => `Approval committee ${reference} — Expert Hub`,
  backToInbox: 'Back to the application inbox',
  inboxCrumb: 'Application inbox',
  eyebrow: 'Approval committee',
  context: {
    heading: 'Results from earlier stages',
    description:
      'The screening result and the consolidated interview result per service — individual member evaluations are not shown.',
    screeningLabel: 'Screening result',
    interviewLabel: 'Interview result',
    exemptedLabel: 'Exempted from the interview',
    exemptionReasonLabel: 'Exemption reason',
    outOf: (value, max) => `${value} out of ${max}`,
    wholeApplicationNote: 'The committee decides on the application as a whole, not per service.',
  },
  formation: {
    heading: 'Form the approval committee',
    description:
      'Select the members, arrange the approval order, and classify each member as mandatory or optional.',
    templateLabel: 'Saved template',
    templatePlaceholder: 'Select a template',
    templateNone: 'No template — build a new sequence',
    templateCopyNote:
      'Editing the template here applies to this application only and does not change the saved template.',
    membersHeading: 'Approval order',
    membersHint: 'The application reaches members in the order shown below.',
    obligations: {
      mandatory: 'Mandatory',
      optional: 'Optional',
    },
    obligationLegend: (name) => `Classification for ${name}`,
    mandatoryNote:
      'The application is only finally approved once every mandatory member approves. An optional member’s rejection is logged as a note.',
    moveUp: 'Move earlier',
    moveDown: 'Move later',
    remove: 'Remove member',
    addHeading: 'Add a member',
    addPlaceholder: 'Select a member',
    add: 'Add',
    positionLabel: (position) => `Position ${formatNumber(position, 'en')}`,
    saveTemplateLabel: 'Save this arrangement as a reusable template',
    saveTemplateNameLabel: 'Template name',
    submit: 'Confirm and start the sequence',
    errorsHeading: 'Complete the following before starting the sequence',
    errors: {
      'no-members': 'Add at least one member to the sequence.',
      'no-mandatory-member':
        'Add at least one mandatory member — final approval requires every mandatory member to approve.',
      'duplicate-member': 'The same member cannot appear twice in the sequence.',
      'template-name-missing': 'Enter a template name before saving it.',
    },
  },
  sequence: {
    heading: 'Approval sequence',
    description: 'The application advances to the next member automatically after each approval.',
    states: {
      waiting: 'Awaiting turn',
      current: 'Current turn',
      approved: 'Approved',
      rejected: 'Rejected',
      'modification-requested': 'Requested a modification',
    },
    decidedAt: (date) => `on ${date}`,
    you: 'You',
    noteLabel: 'Note',
  },
  decision: {
    heading: 'Your decision',
    description: 'Approve, reject, or request a modification with a mandatory note.',
    notYourTurnTitle: 'It is not your turn yet',
    notYourTurnBody: 'You can decide once the application reaches your position in the sequence.',
    noteLabel: 'Note (optional)',
    noteHint: 'A note recorded alongside your decision.',
    approve: 'Approve',
    reject: 'Reject',
    requestModification: 'Request a modification',
  },
  approveDialog: {
    title: 'Confirm approval',
    bodyAdvances:
      'Your approval is recorded and the application advances automatically to the next member.',
    bodyFinal:
      'You are the last mandatory member — your approval finally approves the application, and the applicant is asked to complete their bank data at the same time.',
    confirm: 'Confirm approval',
    cancel: 'Cancel',
  },
  rejectDialog: {
    title: 'Confirm rejection',
    mandatoryWarning:
      'You are a mandatory member — your rejection halts the application immediately and is recorded as a final rejection. It cannot be undone.',
    optionalWarning:
      'You are an optional member — your rejection is logged as a note on the decision record only, and the sequence continues.',
    reasonLabel: 'Rejection reason',
    reasonPlaceholder: 'Select a reason',
    otherLabel: 'State the reason',
    reasonRequired: 'Select a rejection reason to continue.',
    otherRequired: 'State the rejection reason.',
    confirm: 'Confirm rejection',
    cancel: 'Cancel',
  },
  modificationDialog: {
    title: 'Request a modification',
    body: 'The sequence pauses and your note reaches the application’s creator and every committee member.',
    noteLabel: 'Note',
    noteRequired: 'Write the note — a modification request cannot be sent without one.',
    confirm: 'Send the modification request',
    cancel: 'Cancel',
  },
  modificationBanner: {
    title: 'Modification requested',
    body: (name) => `${name} requested a modification to the application.`,
    resumeNote:
      'After re-submission the sequence resumes from the same member, leaving earlier approvals untouched.',
    resubmit: 'Re-submit after the modification',
  },
  outcome: {
    approvedTitle: 'Finally approved',
    approvedBody:
      'Every mandatory member approved. The result is available to the creator to begin agreement preparation.',
    rejectedTitle: 'Finally rejected',
    rejectedBody: (name) => `${name} halted the application with a mandatory rejection.`,
    reasonLabel: 'Rejection reason',
    optionalRejectionsHeading: 'Optional members’ objections',
    optionalRejectionsNote: 'Logged as notes only — they did not affect the outcome.',
  },
  bankData: {
    heading: 'Applicant bank data',
    description:
      'Requested from the applicant in parallel with final approval, and completed before agreement preparation.',
    states: {
      'not-requested': 'Not requested yet',
      requested: 'Awaiting the applicant',
      complete: 'Complete',
    },
    requestedNote: 'Bank data opened for the applicant after final approval, and is awaiting them.',
    completeNote: 'The applicant completed their bank data.',
    notRequestedNote: 'Requested automatically as soon as final approval completes.',
    gateReady:
      'Both conditions are met — final approval and bank data — so agreement preparation can begin.',
    gateBlocked:
      'Agreement preparation cannot begin until final approval and the bank data are both complete.',
    goToAgreement: 'Go to agreement preparation',
  },
  errors: {
    loadTitle: 'Could not load the committee',
    loadBody: 'Something went wrong while loading the approval committee. Please try again.',
    notFoundTitle: 'Application not found',
    notFoundBody: 'We could not find an application with this id.',
    sessionTitle: 'Session expired',
    sessionBody: 'Your session has expired. Please log in again to continue.',
    unauthorizedTitle: 'You do not have access',
    unauthorizedBody: 'You do not have permission to view this approval committee.',
    submitTitle: 'Could not save the action',
    submitBody: 'Something went wrong and the action was not saved. Please try again.',
    onlyApplicationCreator:
      'Only the application’s creator — the person who made its screening decision — can form the approval committee.',
    retry: 'Try again',
  },
  rejectionReasons: getScreeningContent('en').rejectionReasons,
  services: getMyApplicationsContent('en').services,
};

const CONTENT: Record<Locale, CommitteeContent> = { ar, en };

export function getCommitteeContent(locale: Locale): CommitteeContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
