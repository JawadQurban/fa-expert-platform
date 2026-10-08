import type { Locale } from '@/types';
import type { ApplicationService } from '../applications/application.types';
import { getMyApplicationsContent } from '../applications/myApplications.content';
import { getScreeningContent } from '../screening/screening.content';
import type { RejectionReasonId } from '../screening/screening.types';
import type {
  EvaluationValidationCode,
  InterviewRecommendation,
  MemberResponseState,
} from './interview.types';
import { arNumber, formatNumber } from '../../shared/formatting';

/**
 * EH-INT-04 copy (J-07 Interview Evaluation & Post-Interview Decision, plus the
 * J-06 staff reschedule) — Arabic authoritative, English best-effort.
 *
 * The **rejection reason list is imported from the screening content**, not
 * re-declared: J-07/F3/AC-2 points at the *platform-wide unified* list
 * (`BR-0219`), so a second copy here would be a second source of truth.
 */

export interface InterviewsContent {
  readonly documentTitle: (reference: string) => string;
  readonly backToInbox: string;
  /** The breadcrumb's first level — the inbox, named as the header names it. */
  readonly inboxCrumb: string;
  readonly eyebrow: string;
  readonly ticket: {
    readonly heading: string;
    readonly numberLabel: string;
    readonly scheduledLabel: string;
    readonly servicesLabel: string;
    readonly meetingLabel: string;
    readonly meetingPending: string;
    readonly join: string;
    readonly rescheduledCount: (count: number) => string;
    readonly reschedule: string;
    readonly rescheduleRequestedTitle: string;
    readonly rescheduleRequestedBody: (note: string | null) => string;
  };
  readonly committee: {
    readonly heading: string;
    readonly description: string;
    readonly states: Readonly<Record<MemberResponseState, string>>;
    readonly respondedAt: (date: string) => string;
    readonly awaiting: (count: number) => string;
    readonly complete: string;
    readonly you: string;
  };
  readonly evaluation: {
    readonly heading: string;
    readonly description: string;
    readonly perServiceNote: string;
    readonly serviceHeading: (service: string) => string;
    readonly axisScoreLabel: (axis: string) => string;
    readonly scorePlaceholder: string;
    readonly weightLabel: (weight: string) => string;
    /** One option of a model's named rating scale, e.g. «4 — Good». */
    readonly ratingOption: (score: string, label: string) => string;
    readonly recommendationLabel: string;
    readonly recommendationPlaceholder: string;
    readonly recommendationHint: string;
    readonly recommendations: Readonly<Record<InterviewRecommendation, string>>;
    readonly notesLabel: string;
    readonly notesHint: string;
    readonly submit: string;
    readonly didNotAttend: string;
    readonly didNotAttendHint: string;
    readonly errorsHeading: string;
    readonly errors: Readonly<Record<EvaluationValidationCode, (context: string) => string>>;
    readonly modelVersion: (version: string) => string;
    readonly submittedTitle: string;
    readonly submittedBody: string;
    readonly nonAttendanceRecordedTitle: string;
    readonly nonAttendanceRecordedBody: string;
    readonly notAMemberTitle: string;
    readonly notAMemberBody: string;
  };
  readonly didNotAttendDialog: {
    readonly title: string;
    readonly body: string;
    readonly confirm: string;
    readonly cancel: string;
  };
  readonly result: {
    readonly heading: string;
    readonly description: string;
    readonly pendingTitle: string;
    readonly pendingBody: (names: string) => string;
    readonly averageOf: (service: string) => string;
    readonly outOf: (average: string, max: string) => string;
    readonly counted: (count: number) => string;
    readonly excluded: (count: number) => string;
    readonly excludedNote: string;
    /** The model's display-only pass indicator — never a gate. */
    readonly thresholdMet: (threshold: string) => string;
    readonly thresholdNotMet: (threshold: string) => string;
    readonly thresholdNote: string;
  };
  readonly decision: {
    readonly heading: string;
    readonly description: string;
    readonly authorityNote: string;
    readonly forward: string;
    readonly reject: string;
    readonly blockedTitle: string;
    readonly blockedBody: string;
    readonly noPassTitle: string;
    readonly noPassBody: string;
    /** J-07/F3/AC-3 — every member marked «did not attend». */
    readonly noShowTitle: string;
    readonly noShowBody: string;
    /** J-07/F3/AC-4 — the new interview has not happened; rejection only. */
    readonly rejectOnlyTitle: string;
    readonly rejectOnlyBody: string;
  };
  readonly forwardDialog: {
    readonly title: string;
    readonly body: string;
    readonly notPassedNote: (services: string) => string;
    readonly confirm: string;
    readonly cancel: string;
  };
  readonly rejectDialog: {
    readonly title: string;
    readonly warning: string;
    readonly reasonLabel: string;
    readonly reasonPlaceholder: string;
    readonly otherLabel: string;
    readonly reasonRequired: string;
    readonly otherRequired: string;
    readonly confirm: string;
    readonly cancel: string;
  };
  readonly rescheduleDialog: {
    readonly title: string;
    readonly body: string;
    readonly slotsHeading: string;
    readonly slotsHint: string;
    readonly slotLabel: (index: number) => string;
    readonly addSlot: string;
    readonly removeSlot: string;
    readonly noteLabel: string;
    readonly slotRequired: string;
    readonly ticketRetained: string;
    readonly confirm: string;
    readonly cancel: string;
  };
  readonly recorded: {
    readonly forwardTitle: string;
    readonly forwardBody: string;
    readonly rejectTitle: string;
    readonly rejectBody: string;
    readonly reasonLabel: string;
    readonly decidedBy: (name: string, date: string) => string;
    /** Link to EH-INT-05, where a forwarded application continues (J-09). */
    readonly goToCommittee: string;
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
  readonly services: Readonly<Record<ApplicationService, string>>;
}

const ar: InterviewsContent = {
  documentTitle: (reference) => `تقييم مقابلة ${reference} — منصة الخبراء والمدربين`,
  backToInbox: 'العودة إلى صندوق الطلبات',
  inboxCrumb: 'صندوق الطلبات',
  eyebrow: 'تقييم المقابلة',
  ticket: {
    heading: 'تذكرة المقابلة',
    numberLabel: 'رقم المقابلة',
    scheduledLabel: 'موعد المقابلة',
    servicesLabel: 'الخدمات المقبولة',
    meetingLabel: 'رابط الاجتماع',
    meetingPending: 'يُنشأ الرابط تلقائيًا عبر التكامل عند تأكيد الموعد.',
    join: 'فتح الاجتماع',
    rescheduledCount: (count) => `أُعيدت الجدولة ${arNumber(count)} مرة`,
    reschedule: 'إعادة الجدولة',
    rescheduleRequestedTitle: 'طلب المتقدم مواعيد أخرى',
    rescheduleRequestedBody: (note) =>
      note == null
        ? 'لا تناسب المتقدمَ المواعيدُ المقترحة. اقترح مواعيد جديدة عبر «إعادة الجدولة».'
        : `لا تناسب المتقدمَ المواعيدُ المقترحة، وكتب: «${note}». اقترح مواعيد جديدة عبر «إعادة الجدولة».`,
  },
  committee: {
    heading: 'ردود أعضاء اللجنة',
    description: 'لا تُحتسب نتيجة المقابلة قبل رد جميع الأعضاء المعيّنين.',
    states: {
      pending: 'بانتظار الرد',
      submitted: 'قدّم تقييمه',
      'did-not-attend': 'لم يحضر',
    },
    respondedAt: (date) => `ردّ في ${date}`,
    awaiting: (count) => `بانتظار رد ${arNumber(count)} من الأعضاء`,
    complete: 'ردّ جميع الأعضاء — النتيجة محتسبة.',
    you: 'أنت',
  },
  evaluation: {
    heading: 'تقييمك الفردي',
    description: 'قيّم كل خدمة مقبولة على حدة وفق نموذج تقييم المقابلة المعتمد.',
    perServiceNote: 'التقييم مستقل لكل خدمة — لا توجد درجة مجمّعة للطلب.',
    serviceHeading: (service) => `تقييم خدمة ${service}`,
    axisScoreLabel: (axis) => `درجة: ${axis}`,
    scorePlaceholder: 'اختر الدرجة',
    weightLabel: (weight) => `الوزن ${weight}%`,
    ratingOption: (score, label) => `${score} — ${label}`,
    recommendationLabel: 'التوصية',
    recommendationPlaceholder: 'اختر التوصية',
    recommendationHint: 'اختياري.',
    recommendations: {
      recommend: 'أوصي بالاعتماد',
      'recommend-with-reservations': 'أوصي مع تحفظات',
      'not-recommend': 'لا أوصي بالاعتماد',
    },
    notesLabel: 'ملاحظات',
    notesHint: 'اختياري — ملاحظات تدعم التوصية.',
    submit: 'إرسال التقييم',
    didNotAttend: 'لم أحضر المقابلة',
    didNotAttendHint: 'يُستثنى تقييمك من الاحتساب ولا يُحسب صفرًا.',
    errorsHeading: 'أكمل ما يلي قبل إرسال التقييم',
    errors: {
      'axis-score-missing': (context) => `أدخل الدرجة لمعيار «${context}».`,
    },
    modelVersion: (version) => `إصدار نموذج التقييم: ${version}`,
    submittedTitle: 'تم تسجيل تقييمك',
    submittedBody: 'شكرًا لك. سيُحتسب متوسط النتيجة فور رد جميع أعضاء اللجنة.',
    nonAttendanceRecordedTitle: 'تم تسجيل عدم الحضور',
    nonAttendanceRecordedBody: 'استُثني تقييمك من الاحتساب ولم يُحسب صفرًا.',
    notAMemberTitle: 'لست عضوًا في لجنة هذه المقابلة',
    notAMemberBody: 'يمكنك متابعة ردود الأعضاء والنتيجة، دون تقديم تقييم.',
  },
  didNotAttendDialog: {
    title: 'تأكيد عدم الحضور',
    body: 'سيُسجَّل أنك لم تحضر المقابلة، ويُستثنى تقييمك من احتساب المتوسط — دون احتسابه صفرًا. لا يمكن التراجع عن هذا الإجراء.',
    confirm: 'تأكيد عدم الحضور',
    cancel: 'إلغاء',
  },
  result: {
    heading: 'نتيجة المقابلة',
    description: 'المتوسط محتسب من تقييمات الأعضاء الحاضرين فقط، لكل خدمة على حدة.',
    pendingTitle: 'النتيجة غير محتسبة بعد',
    pendingBody: (names) => `لا تُحتسب النتيجة ولا يُحوَّل الطلب قبل رد: ${names}`,
    averageOf: (service) => `متوسط خدمة ${service}`,
    outOf: (average, max) => `${average} من ${max}`,
    counted: (count) => `احتُسبت ${arNumber(count)} تقييمات`,
    excluded: (count) => `استُثني ${arNumber(count)} لعدم الحضور`,
    excludedNote: 'تقييمات «لم يحضر» مستثناة تمامًا ولا تُحتسب صفرًا.',
    thresholdMet: (threshold) => `ناجح — بلغ حد النجاح (${threshold} فأكثر)`,
    thresholdNotMet: (threshold) => `لم يجتز — دون حد النجاح (${threshold})`,
    thresholdNote:
      'الخدمة الناجحة يمكن تحويلها إلى لجنة الاعتماد التي تبقى صاحبة القرار، والخدمة التي لم تجتز حد النجاح لا تُحوَّل.',
  },
  decision: {
    heading: 'قرار ما بعد المقابلة',
    description: 'حوِّل الطلب إلى لجنة الاعتماد، أو ارفضه رفضًا مباشرًا مع ذكر السبب.',
    authorityNote:
      'هذا القرار محصور بمن شكّل لجنة المقابلة واتخذ قرار القبول الأولي في مرحلة الفرز.',
    forward: 'تحويل إلى لجنة الاعتماد',
    reject: 'رفض مباشر',
    blockedTitle: 'القرار غير متاح الآن',
    blockedBody: 'يتاح اتخاذ القرار بعد رد جميع أعضاء اللجنة واحتساب النتيجة.',
    noPassTitle: 'لا توجد خدمة ناجحة',
    noPassBody:
      'لم تبلغ أي خدمة حد النجاح، لذلك لا يمكن التحويل إلى لجنة الاعتماد. الإجراء المتاح هو الرفض المباشر.',
    noShowTitle: 'لم يحضر أي من أعضاء اللجنة',
    noShowBody:
      'سجّل جميع أعضاء اللجنة عدم الحضور. يمكنك إعادة جدولة المقابلة دون حد لعدد المرات، أو رفض الطلب مباشرة.',
    rejectOnlyTitle: 'المقابلة المعاد جدولتها لم تُعقد بعد',
    rejectOnlyBody:
      'يتاح التحويل إلى لجنة الاعتماد بعد انعقاد المقابلة واحتساب النتيجة، ويبقى الرفض المباشر متاحًا في أي وقت.',
  },
  forwardDialog: {
    title: 'تأكيد التحويل إلى لجنة الاعتماد',
    body: 'سيُحوَّل الطلب إلى لجنة الاعتماد مرفقًا بنتيجة الفرز ونتيجة المقابلة المجمّعة.',
    notPassedNote: (services) =>
      `لن تُحوَّل الخدمات التي لم تجتز حد النجاح وتُغلق دون اعتماد: ${services}.`,
    confirm: 'تأكيد التحويل',
    cancel: 'إلغاء',
  },
  rejectDialog: {
    title: 'تأكيد الرفض المباشر',
    warning: 'هذا الإجراء يرفض الطلب بالكامل دون عرضه على لجنة الاعتماد.',
    reasonLabel: 'سبب الرفض',
    reasonPlaceholder: 'اختر السبب',
    otherLabel: 'اذكر السبب',
    reasonRequired: 'اختر سبب الرفض للمتابعة.',
    otherRequired: 'اذكر سبب الرفض.',
    confirm: 'تأكيد الرفض',
    cancel: 'إلغاء',
  },
  rescheduleDialog: {
    title: 'إعادة جدولة المقابلة',
    body: 'اقترح مواعيد جديدة ليختار منها المتقدم، وتتكرر دورة الاختيار والتأكيد نفسها.',
    slotsHeading: 'المواعيد المقترحة الجديدة',
    slotsHint: 'أضف موعدًا واحدًا على الأقل ليختار منه المتقدم.',
    slotLabel: (index) => `الموعد ${arNumber(index)}`,
    addSlot: 'إضافة موعد',
    removeSlot: 'حذف الموعد',
    noteLabel: 'ملاحظة (اختيارية)',
    slotRequired: 'يجب تحديد موعد واحد على الأقل قبل الإرسال.',
    ticketRetained: 'يُحتفظ برقم المقابلة نفسه — إعادة الجدولة لا تُصدر رقمًا جديدًا.',
    confirm: 'إرسال المواعيد الجديدة',
    cancel: 'إلغاء',
  },
  recorded: {
    forwardTitle: 'حُوّل الطلب إلى لجنة الاعتماد',
    forwardBody: 'الطلب الآن في مسار لجنة الاعتماد.',
    rejectTitle: 'تم تسجيل الرفض المباشر',
    rejectBody: 'رُفض الطلب بالكامل دون عرضه على لجنة الاعتماد.',
    reasonLabel: 'سبب الرفض',
    decidedBy: (name, date) => `بواسطة ${name} في ${date}`,
    goToCommittee: 'الانتقال إلى لجنة الاعتماد',
  },
  errors: {
    loadTitle: 'تعذّر تحميل المقابلة',
    loadBody: 'حدث خطأ أثناء تحميل بيانات المقابلة. يُرجى المحاولة مرة أخرى.',
    notFoundTitle: 'المقابلة غير موجودة',
    notFoundBody: 'لم نعثر على مقابلة مرتبطة بهذا الطلب.',
    sessionTitle: 'انتهت الجلسة',
    sessionBody: 'انتهت جلستك. يُرجى تسجيل الدخول مرة أخرى للمتابعة.',
    unauthorizedTitle: 'لا تملك صلاحية الوصول',
    unauthorizedBody: 'ليست لديك الصلاحية اللازمة لعرض هذه المقابلة.',
    submitTitle: 'تعذّر حفظ الإجراء',
    submitBody: 'حدث خطأ ولم يُحفظ الإجراء. يُرجى المحاولة مرة أخرى.',
    retry: 'إعادة المحاولة',
  },
  rejectionReasons: getScreeningContent('ar').rejectionReasons,
  services: getMyApplicationsContent('ar').services,
};

const en: InterviewsContent = {
  documentTitle: (reference) => `Interview evaluation ${reference} — Expert Hub`,
  backToInbox: 'Back to the application inbox',
  inboxCrumb: 'Application inbox',
  eyebrow: 'Interview evaluation',
  ticket: {
    heading: 'Interview ticket',
    numberLabel: 'Interview number',
    scheduledLabel: 'Interview time',
    servicesLabel: 'Accepted services',
    meetingLabel: 'Meeting link',
    meetingPending:
      'The link is created automatically by the integration once the slot is confirmed.',
    join: 'Open the meeting',
    rescheduledCount: (count) => `Rescheduled ${formatNumber(count, 'en')} time(s)`,
    reschedule: 'Reschedule',
    rescheduleRequestedTitle: 'The applicant asked for other times',
    rescheduleRequestedBody: (note) =>
      note == null
        ? 'None of the proposed times suit the applicant. Propose new times with “Reschedule”.'
        : `None of the proposed times suit the applicant, who wrote: “${note}”. Propose new times with “Reschedule”.`,
  },
  committee: {
    heading: 'Committee responses',
    description:
      'The interview result is not calculated until every assigned member has responded.',
    states: {
      pending: 'Awaiting response',
      submitted: 'Evaluation submitted',
      'did-not-attend': 'Did not attend',
    },
    respondedAt: (date) => `Responded on ${date}`,
    awaiting: (count) => `Awaiting ${formatNumber(count, 'en')} member response(s)`,
    complete: 'All members have responded — the result is calculated.',
    you: 'You',
  },
  evaluation: {
    heading: 'Your individual evaluation',
    description: 'Score each accepted service separately against the approved interview model.',
    perServiceNote:
      'Evaluation is independent per service — there is no combined application score.',
    serviceHeading: (service) => `${service} evaluation`,
    axisScoreLabel: (axis) => `Score: ${axis}`,
    scorePlaceholder: 'Select a score',
    weightLabel: (weight) => `Weight ${weight}%`,
    ratingOption: (score, label) => `${score} — ${label}`,
    recommendationLabel: 'Recommendation',
    recommendationPlaceholder: 'Select a recommendation',
    recommendationHint: 'Optional.',
    recommendations: {
      recommend: 'Recommend for accreditation',
      'recommend-with-reservations': 'Recommend with reservations',
      'not-recommend': 'Do not recommend',
    },
    notesLabel: 'Notes',
    notesHint: 'Optional — notes supporting your recommendation.',
    submit: 'Submit evaluation',
    didNotAttend: 'I did not attend the interview',
    didNotAttendHint:
      'Your evaluation is excluded from the calculation and is not counted as zero.',
    errorsHeading: 'Complete the following before submitting',
    errors: {
      'axis-score-missing': (context) => `Enter a score for “${context}”.`,
    },
    modelVersion: (version) => `Interview model version: ${version}`,
    submittedTitle: 'Your evaluation was recorded',
    submittedBody:
      'Thank you. The average is calculated as soon as every committee member has responded.',
    nonAttendanceRecordedTitle: 'Non-attendance recorded',
    nonAttendanceRecordedBody:
      'Your evaluation was excluded from the calculation and was not counted as zero.',
    notAMemberTitle: 'You are not on this interview committee',
    notAMemberBody:
      'You can follow the member responses and the result, but cannot submit an evaluation.',
  },
  didNotAttendDialog: {
    title: 'Confirm non-attendance',
    body: 'You will be recorded as not having attended, and your evaluation will be excluded from the average — not counted as zero. This cannot be undone.',
    confirm: 'Confirm non-attendance',
    cancel: 'Cancel',
  },
  result: {
    heading: 'Interview result',
    description: 'The average is computed from attending members’ evaluations only, per service.',
    pendingTitle: 'The result is not calculated yet',
    pendingBody: (names) =>
      `The result is not calculated and the application is not forwarded until these members respond: ${names}`,
    averageOf: (service) => `${service} average`,
    outOf: (average, max) => `${average} out of ${max}`,
    counted: (count) => `${formatNumber(count, 'en')} evaluations counted`,
    excluded: (count) => `${formatNumber(count, 'en')} excluded for non-attendance`,
    excludedNote: '“Did not attend” entries are excluded entirely and are never counted as zero.',
    thresholdMet: (threshold) => `Passed — meets the pass mark (${threshold} or above)`,
    thresholdNotMet: (threshold) => `Did not pass — below the pass mark (${threshold})`,
    thresholdNote:
      'A service that passed can be forwarded to the approval committee, which still decides; a service that did not pass is not forwarded.',
  },
  decision: {
    heading: 'Post-interview decision',
    description:
      'Forward the application to the approval committee, or reject it directly with a reason.',
    authorityNote:
      'This decision is restricted to the person who formed the interview committee and made the initial screening acceptance.',
    forward: 'Forward to the approval committee',
    reject: 'Direct rejection',
    blockedTitle: 'The decision is not available yet',
    blockedBody:
      'The decision becomes available once every committee member has responded and the result is calculated.',
    noPassTitle: 'No service passed',
    noPassBody:
      'No service reached the pass mark, so the application cannot be forwarded to the approval committee. Direct rejection is the available action.',
    noShowTitle: 'No committee member attended',
    noShowBody:
      'Every committee member recorded that they did not attend. You can reschedule the interview, as many times as needed, or reject the application directly.',
    rejectOnlyTitle: 'The rescheduled interview has not taken place yet',
    rejectOnlyBody:
      'Forwarding to the approval committee becomes available once the interview takes place and the result is calculated. Direct rejection stays available at any time.',
  },
  forwardDialog: {
    title: 'Confirm forwarding to the approval committee',
    body: 'The application will be forwarded with its screening result and the consolidated interview result.',
    notPassedNote: (services) =>
      `Services that did not pass are not forwarded and close without accreditation: ${services}.`,
    confirm: 'Confirm forwarding',
    cancel: 'Cancel',
  },
  rejectDialog: {
    title: 'Confirm direct rejection',
    warning: 'This rejects the whole application without sending it to the approval committee.',
    reasonLabel: 'Rejection reason',
    reasonPlaceholder: 'Select a reason',
    otherLabel: 'State the reason',
    reasonRequired: 'Select a rejection reason to continue.',
    otherRequired: 'State the rejection reason.',
    confirm: 'Confirm rejection',
    cancel: 'Cancel',
  },
  rescheduleDialog: {
    title: 'Reschedule the interview',
    body: 'Propose new slots for the applicant to choose from; the same selection and confirmation flow repeats.',
    slotsHeading: 'New proposed slots',
    slotsHint: 'Add at least one slot for the applicant to choose from.',
    slotLabel: (index) => `Slot ${formatNumber(index, 'en')}`,
    addSlot: 'Add a slot',
    removeSlot: 'Remove slot',
    noteLabel: 'Note (optional)',
    slotRequired: 'At least one slot must be set before sending.',
    ticketRetained: 'The same interview number is retained — a reschedule never issues a new one.',
    confirm: 'Send the new slots',
    cancel: 'Cancel',
  },
  recorded: {
    forwardTitle: 'Forwarded to the approval committee',
    forwardBody: 'The application is now in the approval committee path.',
    rejectTitle: 'Direct rejection recorded',
    rejectBody: 'The application was rejected in full without going to the approval committee.',
    reasonLabel: 'Rejection reason',
    decidedBy: (name, date) => `By ${name} on ${date}`,
    goToCommittee: 'Go to the approval committee',
  },
  errors: {
    loadTitle: 'Could not load the interview',
    loadBody: 'Something went wrong while loading the interview. Please try again.',
    notFoundTitle: 'Interview not found',
    notFoundBody: 'We could not find an interview linked to this application.',
    sessionTitle: 'Session expired',
    sessionBody: 'Your session has expired. Please log in again to continue.',
    unauthorizedTitle: 'You do not have access',
    unauthorizedBody: 'You do not have permission to view this interview.',
    submitTitle: 'Could not save the action',
    submitBody: 'Something went wrong and the action was not saved. Please try again.',
    retry: 'Try again',
  },
  rejectionReasons: getScreeningContent('en').rejectionReasons,
  services: getMyApplicationsContent('en').services,
};

const CONTENT: Record<Locale, InterviewsContent> = { ar, en };

export function getInterviewsContent(locale: Locale): InterviewsContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
