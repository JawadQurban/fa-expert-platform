import type { Locale } from '@/types';
import type { ApplicationService } from './application.types';
import type { SlaState } from '../../shared/types/sla';
import type { ApplicationStage, ServiceOutcome, SyncState } from './applicationDetail.types';
import { getMyApplicationsContent } from './myApplications.content';
import { arNumber, formatDate } from '../../shared/formatting';

/**
 * EH-TP-03 (Application Details) copy — Arabic authoritative, English
 * best-effort. Service labels + the 11-value status labels are reused from the
 * one approved source (`myApplications.content.ts`) so they never fork. The
 * page/components render structure only.
 */

export interface ApplicationDetailContent {
  readonly documentTitle: (reference: string) => string;
  readonly breadcrumbLabel: string;
  readonly breadcrumbApplications: string;
  readonly summary: {
    readonly heading: string;
    readonly referenceLabel: string;
    readonly servicesLabel: string;
    readonly submittedLabel: string;
    readonly updatedLabel: string;
    readonly draftReference: string;
    readonly notSubmitted: string;
    /** EH-TP-06 entry point — shown for an approved/active application. */
    readonly addService: string;
  };
  readonly stages: Readonly<Record<ApplicationStage, string>>;
  readonly timeline: {
    readonly heading: string;
    readonly label: string;
    readonly currentHint: string;
  };
  readonly perService: {
    readonly heading: string;
    readonly outcomes: Readonly<Record<ServiceOutcome, string>>;
  };
  readonly rejection: {
    readonly heading: string;
  };
  readonly action: {
    readonly heading: string;
    readonly readOnly: string;
  };
  /** J-06 — the applicant's half of interview scheduling (F1, F2, F4). */
  readonly interview: {
    readonly heading: string;
    readonly slotLegend: string;
    readonly slotHint: string;
    readonly selectSlot: string;
    /** F1/AC-4 — the 3-business-day selection clock (P-J4). */
    readonly sla: {
      readonly labels: Readonly<Record<SlaState, string>>;
      readonly remaining: (days: number) => string;
      readonly overdue: (days: number) => string;
    };
    /** F1/AC-5 — the confirmed time, and what comes with it. */
    readonly confirmedHeading: string;
    readonly confirmedAt: (slot: string) => string;
    readonly ticketLabel: string;
    readonly joinMeeting: string;
    readonly meetingPending: string;
    /** F4 — asking for a different time. */
    readonly reschedule: {
      readonly beforeSelecting: string;
      readonly afterConfirming: string;
      readonly action: string;
      readonly dialogTitle: string;
      readonly dialogBody: string;
      readonly noteLabel: string;
      readonly noteHint: string;
      readonly confirm: string;
      readonly cancel: string;
      readonly dismiss: string;
      /** F4/AC-4 — waiting for the new slots to be proposed. */
      readonly pendingTitle: string;
      readonly pendingBody: string;
      readonly yourNoteLabel: string;
    };
  };
  /**
   * J-11/F1/AC-2 — the agreement, readable in full before any decision is taken.
   * `downloadUnavailable` is shown instead of a link while `G26` (document
   * storage) is open: the data below it is the complete agreement, so the
   * applicant is never asked to decide on something they cannot read.
   */
  readonly agreementPreview: {
    readonly heading: string;
    readonly sentAt: (date: string) => string;
    readonly download: string;
    readonly downloadUnavailable: string;
  };
  /** J-11/F1 — the applicant's three decisions on the agreement. */
  readonly agreementDecision: {
    readonly heading: string;
    readonly description: string;
    readonly sign: string;
    readonly reject: string;
    readonly requestModification: string;
    readonly errors: {
      readonly 'signature-missing': string;
      readonly 'note-missing': string;
    };
    readonly signDialog: {
      readonly title: string;
      readonly body: string;
      readonly signatureLabel: string;
      readonly signatureHint: string;
      readonly confirm: string;
      readonly cancel: string;
      readonly dismiss: string;
    };
    /** AC-4 — permanence is stated at the moment of decision, not afterwards. */
    readonly rejectDialog: {
      readonly title: string;
      readonly warning: string;
      readonly body: string;
      readonly noteLabel: string;
      readonly noteHint: string;
      readonly acknowledgeLabel: string;
      readonly confirm: string;
      readonly cancel: string;
      readonly dismiss: string;
    };
    readonly modificationDialog: {
      readonly title: string;
      readonly body: string;
      readonly noteLabel: string;
      readonly noteHint: string;
      readonly confirm: string;
      readonly cancel: string;
      readonly dismiss: string;
    };
    /** The resting states after a decision (AC-4, AC-5 → AC-7). */
    readonly declinedNotice: string;
    readonly modificationNotice: string;
    readonly yourNoteLabel: string;
  };
  readonly sync: {
    readonly heading: string;
    readonly labels: Readonly<Record<Exclude<SyncState, 'none'>, string>>;
    readonly processingBody: string;
    readonly synchronizedBody: string;
  };
  readonly attachments: {
    readonly heading: string;
    readonly kinds: { readonly applicant: string; readonly agreement: string };
    readonly download: string;
    readonly empty: string;
  };
  readonly confirmSlot: {
    readonly title: string;
    readonly body: (slot: string) => string;
    readonly confirm: string;
    readonly cancel: string;
    readonly dismiss: string;
  };
  readonly success: {
    readonly slot: string;
    readonly rescheduleRequested: string;
    readonly signed: string;
    readonly bankDataSaved: string;
    readonly rejected: string;
    readonly modificationRequested: string;
  };
  readonly errors: {
    readonly loadTitle: string;
    readonly loadBody: string;
    readonly notFoundTitle: string;
    readonly notFoundBody: string;
    readonly unauthorizedTitle: string;
    readonly unauthorizedBody: string;
    readonly sessionTitle: string;
    readonly sessionBody: string;
    readonly actionFailed: string;
    readonly retry: string;
    readonly homeLabel: string;
  };
  readonly services: Readonly<Record<ApplicationService, string>>;
  readonly statuses: ReturnType<typeof getMyApplicationsContent>['statuses'];
  readonly formatSlot: (iso: string) => string;
}

function slotFormatter(locale: Locale) {
  return (iso: string) =>
    formatDate(new Date(iso), locale, {
      dateStyle: 'full',
      timeStyle: 'short',
    });
}

const ar: ApplicationDetailContent = {
  documentTitle: (reference) => `${reference} | طلباتي — منصة الخبراء والمدربين`,
  breadcrumbLabel: 'مسار التنقل',
  breadcrumbApplications: 'طلباتي',
  summary: {
    heading: 'تفاصيل الطلب',
    referenceLabel: 'رقم الطلب',
    servicesLabel: 'الخدمات',
    submittedLabel: 'تاريخ التقديم',
    updatedLabel: 'آخر تحديث',
    draftReference: 'مسودة — بدون رقم مرجعي',
    notSubmitted: 'لم يُقدَّم بعد',
    addService: 'إضافة خدمة',
  },
  stages: {
    submitted: 'التقديم',
    'under-review': 'المراجعة',
    interview: 'المقابلة',
    approval: 'الاعتماد',
    agreement: 'الاتفاقية',
    active: 'مكتمل',
  },
  timeline: {
    heading: 'مراحل الطلب',
    label: 'مسار مراحل الطلب',
    currentHint: 'المرحلة الحالية',
  },
  perService: {
    heading: 'نتيجة كل خدمة',
    outcomes: { pending: 'قيد المراجعة', accepted: 'مقبول', rejected: 'غير مقبول' },
  },
  rejection: {
    heading: 'سبب عدم القبول',
  },
  action: {
    heading: 'الإجراء المطلوب',
    readOnly: 'لا يوجد إجراء مطلوب منك في هذه المرحلة. سنُعلمك عند أي تحديث على حالة طلبك.',
  },
  interview: {
    heading: 'موعد المقابلة',
    slotLegend: 'اختر موعد المقابلة',
    slotHint: 'اختر الموعد الأنسب لك من المواعيد المتاحة أدناه.',
    selectSlot: 'تأكيد الموعد',
    sla: {
      labels: {
        within: 'ضمن المهلة',
        approaching: 'تقترب المهلة',
        breached: 'انتهت المهلة',
      },
      remaining: (days) =>
        days === 1
          ? 'أمامك يوم عمل واحد لاختيار موعدك.'
          : `أمامك ${arNumber(days)} أيام عمل لاختيار موعدك.`,
      overdue: (days) =>
        days === 1
          ? 'مضى يوم عمل على انتهاء مهلة الاختيار. يمكنك الاختيار الآن أو طلب موعد آخر.'
          : `مضت ${arNumber(days)} أيام عمل على انتهاء مهلة الاختيار. يمكنك الاختيار الآن أو طلب موعد آخر.`,
    },
    confirmedHeading: 'موعدك المؤكَّد',
    confirmedAt: (slot) => `موعد مقابلتك: ${slot}`,
    ticketLabel: 'رقم المقابلة',
    joinMeeting: 'الانضمام إلى الاجتماع',
    meetingPending: 'سيصلك رابط الاجتماع قبل الموعد، وسيظهر هنا أيضًا.',
    reschedule: {
      beforeSelecting: 'لا يناسبك أي من المواعيد المقترحة؟ يمكنك طلب مواعيد أخرى.',
      afterConfirming: 'إن طرأ ما يمنعك عن هذا الموعد، يمكنك طلب موعد آخر.',
      action: 'طلب موعد آخر',
      dialogTitle: 'طلب موعد آخر للمقابلة',
      dialogBody:
        'سيصل طلبك إلى فريق الفرز ليقترح مواعيد جديدة، ثم تختار منها كالمعتاد. رقم مقابلتك لا يتغيّر.',
      noteLabel: 'ملاحظتك (اختياري)',
      noteHint: 'ذكر الأوقات التي تناسبك يساعد الفريق على اقتراح مواعيد أنسب.',
      confirm: 'إرسال الطلب',
      cancel: 'إلغاء',
      dismiss: 'إغلاق',
      pendingTitle: 'طلب الموعد الآخر قيد المعالجة',
      pendingBody: 'وصل طلبك. سنُعلمك فور اقتراح مواعيد جديدة لتختار منها.',
      yourNoteLabel: 'ملاحظتك',
    },
  },
  agreementPreview: {
    heading: 'الاتفاقية',
    sentAt: (date) => `تم إرسال الاتفاقية إليك بتاريخ ${date}`,
    download: 'تنزيل الاتفاقية',
    downloadUnavailable:
      'تنزيل نسخة PDF غير متاح حاليًا. جميع بنود الاتفاقية وبياناتها معروضة كاملةً أدناه للاطلاع عليها قبل اتخاذ قرارك.',
  },
  agreementDecision: {
    heading: 'قرارك على الاتفاقية',
    description:
      'بعد اطلاعك على الاتفاقية كاملةً، اختر أحد الخيارات الثلاثة: التوقيع الإلكتروني لاعتمادها، أو رفضها، أو طلب تعديل عليها.',
    sign: 'التوقيع الإلكتروني واعتماد الاتفاقية',
    reject: 'رفض الاتفاقية',
    requestModification: 'طلب تعديل',
    errors: {
      'signature-missing': 'يجب كتابة اسمك الكامل للتوقيع.',
      'note-missing': 'يجب كتابة التعديل المطلوب.',
    },
    signDialog: {
      title: 'التوقيع الإلكتروني على الاتفاقية',
      body: 'بتوقيعك تصبح الاتفاقية سارية وتتحوّل حالة طلبك إلى «معتمد»، ويُسجَّل قبولك على نسخة الاتفاقية المعروضة تحديدًا.',
      signatureLabel: 'الاسم الكامل (التوقيع الإلكتروني)',
      signatureHint:
        'اكتب اسمك الكامل كما يظهر في هويتك. يُسجَّل قبولك داخليًا باسمك ووقت الإجراء ونسخة الاتفاقية التي اطّلعت عليها — وهو ليس توقيعًا إلكترونيًا معتمدًا، إذ لا يوجد مزوّد توقيع إلكتروني مرتبط بالمنصة.',
      confirm: 'توقيع واعتماد',
      cancel: 'إلغاء',
      dismiss: 'إغلاق',
    },
    rejectDialog: {
      title: 'رفض الاتفاقية',
      warning:
        'قرار نهائي: برفض الاتفاقية يُغلق طلبك نهائيًا، ولا يمكن التراجع أو إعادة التقديم على هذا الطلب.',
      body: 'إن كان لديك ملاحظة على بنود الاتفاقية فيمكنك بدلًا من ذلك «طلب تعديل» ليعود الطلب إلى مُعدّ الاتفاقية.',
      noteLabel: 'سبب الرفض (اختياري)',
      noteHint: 'يساعدنا توضيح السبب على تحسين الخدمة، وهو غير إلزامي.',
      acknowledgeLabel: 'أفهم أن رفض الاتفاقية يُغلق الطلب نهائيًا.',
      confirm: 'تأكيد الرفض النهائي',
      cancel: 'إلغاء',
      dismiss: 'إغلاق',
    },
    modificationDialog: {
      title: 'طلب تعديل على الاتفاقية',
      body: 'ستُرسل ملاحظتك إلى مُعدّ الاتفاقية لتعديلها، ثم تعود إليك بعد اكتمال اعتمادها داخليًا من جديد.',
      noteLabel: 'التعديل المطلوب',
      noteHint: 'وضّح البند المطلوب تعديله والتعديل الذي ترغب به.',
      confirm: 'إرسال طلب التعديل',
      cancel: 'إلغاء',
      dismiss: 'إغلاق',
    },
    declinedNotice: 'رفضت هذه الاتفاقية، وأُغلق الطلب نهائيًا.',
    modificationNotice:
      'أُرسل طلب التعديل إلى مُعدّ الاتفاقية. ستصلك الاتفاقية المعدّلة بعد اعتمادها داخليًا من جديد.',
    yourNoteLabel: 'ملاحظتك',
  },
  sync: {
    heading: 'حالة المزامنة',
    labels: { processing: 'قيد المعالجة', synchronized: 'تمت المزامنة' },
    processingBody:
      'اعتمادك مكتمل. تجري الآن مزامنة بياناتك مع الأنظمة ذات العلاقة، وقد تستغرق بعض الوقت.',
    synchronizedBody: 'اكتملت مزامنة بياناتك مع الأنظمة ذات العلاقة.',
  },
  attachments: {
    heading: 'المرفقات',
    kinds: { applicant: 'مستند مُقدَّم', agreement: 'اتفاقية' },
    download: 'تنزيل',
    empty: 'لا توجد مرفقات.',
  },
  confirmSlot: {
    title: 'تأكيد موعد المقابلة',
    body: (slot) => `سيتم تأكيد موعد مقابلتك: ${slot}. هل تريد المتابعة؟`,
    confirm: 'تأكيد',
    cancel: 'إلغاء',
    dismiss: 'إغلاق',
  },
  success: {
    slot: 'تم تأكيد موعد مقابلتك.',
    rescheduleRequested: 'أُرسل طلبك للحصول على موعد آخر.',
    bankDataSaved: 'تم حفظ بياناتك المصرفية، وسيتابع فريق الأكاديمية إعداد الاتفاقية.',
    signed: 'تم توقيع الاتفاقية إلكترونيًا، وأصبح طلبك معتمدًا.',
    rejected: 'تم تسجيل رفضك للاتفاقية، وأُغلق الطلب نهائيًا.',
    modificationRequested: 'أُرسل طلب التعديل إلى مُعدّ الاتفاقية.',
  },
  errors: {
    loadTitle: 'تعذّر تحميل الطلب',
    loadBody: 'حدث خطأ أثناء تحميل تفاصيل الطلب. يُرجى المحاولة مرة أخرى.',
    notFoundTitle: 'الطلب غير موجود',
    notFoundBody: 'تعذّر العثور على هذا الطلب، أو أنه لا يخصّ حسابك.',
    unauthorizedTitle: 'لا تملك صلاحية الوصول',
    unauthorizedBody: 'ليست لديك الصلاحية اللازمة لعرض هذا الطلب.',
    sessionTitle: 'انتهت الجلسة',
    sessionBody: 'انتهت جلستك. يُرجى تسجيل الدخول مرة أخرى للمتابعة.',
    actionFailed: 'تعذّر إتمام العملية. يُرجى المحاولة مرة أخرى.',
    retry: 'إعادة المحاولة',
    homeLabel: 'العودة إلى طلباتي',
  },
  services: getMyApplicationsContent('ar').services,
  statuses: getMyApplicationsContent('ar').statuses,
  formatSlot: slotFormatter('ar'),
};

const en: ApplicationDetailContent = {
  documentTitle: (reference) => `${reference} | My applications — Expert Hub`,
  breadcrumbLabel: 'Breadcrumb',
  breadcrumbApplications: 'My applications',
  summary: {
    heading: 'Application details',
    referenceLabel: 'Application no.',
    servicesLabel: 'Services',
    submittedLabel: 'Submission date',
    updatedLabel: 'Last updated',
    draftReference: 'Draft — no reference number',
    notSubmitted: 'Not submitted yet',
    addService: 'Add a service',
  },
  stages: {
    submitted: 'Submitted',
    'under-review': 'Review',
    interview: 'Interview',
    approval: 'Accreditation',
    agreement: 'Agreement',
    active: 'Complete',
  },
  timeline: {
    heading: 'Application stages',
    label: 'Application stage progress',
    currentHint: 'Current stage',
  },
  perService: {
    heading: 'Outcome per service',
    outcomes: { pending: 'Under review', accepted: 'Accepted', rejected: 'Not accepted' },
  },
  rejection: {
    heading: 'Reason for the decision',
  },
  action: {
    heading: 'Required action',
    readOnly:
      'No action is required from you at this stage. We will notify you of any status update.',
  },
  interview: {
    heading: 'Interview time',
    slotLegend: 'Choose your interview time',
    slotHint: 'Choose the time that suits you best from the slots below.',
    selectSlot: 'Confirm time',
    sla: {
      labels: {
        within: 'Within the deadline',
        approaching: 'Deadline approaching',
        breached: 'Deadline passed',
      },
      remaining: (days) =>
        days === 1
          ? 'You have 1 business day to choose your time.'
          : `You have ${days} business days to choose your time.`,
      overdue: (days) =>
        days === 1
          ? 'The selection deadline passed 1 business day ago. You can still choose, or ask for another time.'
          : `The selection deadline passed ${days} business days ago. You can still choose, or ask for another time.`,
    },
    confirmedHeading: 'Your confirmed time',
    confirmedAt: (slot) => `Your interview: ${slot}`,
    ticketLabel: 'Interview number',
    joinMeeting: 'Join the meeting',
    meetingPending:
      'The meeting link will reach you before the interview, and will appear here too.',
    reschedule: {
      beforeSelecting: 'None of the proposed times work for you? You can ask for different ones.',
      afterConfirming: 'If something prevents you from attending, you can ask for another time.',
      action: 'Ask for another time',
      dialogTitle: 'Ask for another interview time',
      dialogBody:
        'Your request goes to the screening team, who will propose new times for you to choose from. Your interview number does not change.',
      noteLabel: 'Your note (optional)',
      noteHint: 'Telling us which times suit you helps the team propose better ones.',
      confirm: 'Send the request',
      cancel: 'Cancel',
      dismiss: 'Close',
      pendingTitle: 'Your request is being handled',
      pendingBody:
        'We received your request. We will let you know as soon as new times are proposed.',
      yourNoteLabel: 'Your note',
    },
  },
  agreementPreview: {
    heading: 'The agreement',
    sentAt: (date) => `Sent to you on ${date}`,
    download: 'Download the agreement',
    downloadUnavailable:
      'PDF download is not available yet. The complete agreement terms and data are shown in full below, so you can review everything before deciding.',
  },
  agreementDecision: {
    heading: 'Your decision on the agreement',
    description:
      'Once you have reviewed the full agreement, choose one of three options: e-sign to approve it, reject it, or request a modification.',
    sign: 'E-sign and approve the agreement',
    reject: 'Reject the agreement',
    requestModification: 'Request a modification',
    errors: {
      'signature-missing': 'Type your full name to sign.',
      'note-missing': 'Describe the modification you are requesting.',
    },
    signDialog: {
      title: 'E-sign the agreement',
      body: 'Signing activates the agreement, moves your application to “Approved”, and records your acceptance against the exact agreement version shown.',
      signatureLabel: 'Full name (e-signature)',
      signatureHint:
        'Type your full name as it appears on your ID. Your acceptance is recorded internally with your name, the time and the agreement version you read — it is not a certified electronic signature, as no e-signature provider is integrated.',
      confirm: 'Sign and approve',
      cancel: 'Cancel',
      dismiss: 'Close',
    },
    rejectDialog: {
      title: 'Reject the agreement',
      warning:
        'Final decision: rejecting the agreement closes your application permanently. There is no way back and no re-submission for this application.',
      body: 'If you have a concern about specific terms, request a modification instead — the agreement returns to the person who prepared it.',
      noteLabel: 'Reason for rejecting (optional)',
      noteHint: 'Telling us why helps us improve the service. It is not required.',
      acknowledgeLabel:
        'I understand that rejecting the agreement closes my application permanently.',
      confirm: 'Confirm permanent rejection',
      cancel: 'Cancel',
      dismiss: 'Close',
    },
    modificationDialog: {
      title: 'Request a modification',
      body: 'Your note goes back to the person who prepared the agreement. The revised agreement returns to you once it has been internally approved again.',
      noteLabel: 'Requested modification',
      noteHint: 'Say which term you want changed and how.',
      confirm: 'Send the modification request',
      cancel: 'Cancel',
      dismiss: 'Close',
    },
    declinedNotice: 'You rejected this agreement, and the application is permanently closed.',
    modificationNotice:
      'Your modification request was sent to the agreement preparer. The revised agreement will reach you once it is internally approved again.',
    yourNoteLabel: 'Your note',
  },
  sync: {
    heading: 'Synchronization status',
    labels: { processing: 'Processing', synchronized: 'Synchronized' },
    processingBody:
      'Your accreditation is complete. Your data is now being synchronized with the relevant systems; this may take a while.',
    synchronizedBody: 'Your data has been synchronized with the relevant systems.',
  },
  attachments: {
    heading: 'Attachments',
    kinds: { applicant: 'Submitted document', agreement: 'Agreement' },
    download: 'Download',
    empty: 'No attachments.',
  },
  confirmSlot: {
    title: 'Confirm interview time',
    body: (slot) => `Your interview will be confirmed for: ${slot}. Continue?`,
    confirm: 'Confirm',
    cancel: 'Cancel',
    dismiss: 'Close',
  },
  success: {
    slot: 'Your interview time has been confirmed.',
    rescheduleRequested: 'Your request for another time has been sent.',
    bankDataSaved: 'Your bank details are saved. The Academy team will now prepare your agreement.',
    signed: 'The agreement has been e-signed and your application is now approved.',
    rejected: 'Your rejection was recorded and the application is permanently closed.',
    modificationRequested: 'Your modification request was sent to the agreement preparer.',
  },
  errors: {
    loadTitle: 'Could not load the application',
    loadBody: 'Something went wrong while loading the application details. Please try again.',
    notFoundTitle: 'Application not found',
    notFoundBody: 'We could not find this application, or it does not belong to your account.',
    unauthorizedTitle: 'You do not have access',
    unauthorizedBody: 'You do not have permission to view this application.',
    sessionTitle: 'Session expired',
    sessionBody: 'Your session has expired. Please log in again to continue.',
    actionFailed: 'The action could not be completed. Please try again.',
    retry: 'Try again',
    homeLabel: 'Back to My applications',
  },
  services: getMyApplicationsContent('en').services,
  statuses: getMyApplicationsContent('en').statuses,
  formatSlot: slotFormatter('en'),
};

const CONTENT: Record<Locale, ApplicationDetailContent> = { ar, en };

export function getApplicationDetailContent(locale: Locale): ApplicationDetailContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
