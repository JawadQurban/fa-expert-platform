import type { Locale } from '@/types';
import { getMyApplicationsContent } from '../applications/myApplications.content';
import type { AssignmentRequestStatus, AssignmentServiceType } from './assignment.types';
import type {
  CentreRequestType,
  CentreRequestValidationCode,
  CONSULTATION_TYPES,
  DeliveryMode,
  LANGUAGES,
  PERIODS,
  TRAINEE_LEVELS,
} from './centreRequestForm.types';
import { arNumber } from '../../shared/formatting';

/**
 * EH-INT-09 (Assignment Requests) copy — Arabic authoritative, English
 * best-effort.
 *
 * Two things this copy is deliberate about:
 *
 * - **The pulled data is labelled as pulled.** F3/AC-1 says there is no manual
 *   entry, so every panel says where its values came from. A read-only field
 *   with no explanation looks like a form someone disabled by mistake.
 * - **The undefined services say *why* they are unavailable.** J-16's matrices
 *   for Consultant, Content Developer and Question Writer are empty and marked
 *   pending. "Not available" would read as a bug; "the data for this service is
 *   not defined yet" is the truth.
 */

export interface AssignmentsContent {
  readonly documentTitle: string;
  readonly listTitle: string;
  readonly listDescription: string;
  readonly create: string;
  readonly resultsLabel: string;
  readonly columns: {
    readonly reference: string;
    readonly service: string;
    readonly program: string;
    readonly headcount: string;
    readonly status: string;
    readonly created: string;
  };
  readonly statuses: Readonly<Record<AssignmentRequestStatus, string>>;
  readonly headcountValue: (count: number) => string;
  /** F4/AC-2 — a multi-person request is a distinct case, and is marked. */
  readonly multiHeadcountNote: string;
  readonly empty: { readonly title: string; readonly body: string };

  readonly form: {
    readonly documentTitle: string;
    readonly breadcrumbLabel: string;
    readonly breadcrumbList: string;
    readonly title: string;
    readonly intro: string;
    /** Kept for the list and matching pages: the accreditation service labels. */
    readonly services: Readonly<Record<AssignmentServiceType, string>>;
    /* — الخيارات الرئيسية (the workbook's main options) — */
    readonly mainHeading: string;
    readonly centreLabel: string;
    readonly requestTypeLabel: string;
    readonly responsibleLabel: string;
    readonly responsibleHint: string;
    /** Notion «Assignment Matrix» — «نوع الطلب». */
    readonly requestTypes: Readonly<Record<CentreRequestType, string>>;
    /* — بيانات البرنامج التدريبي — */
    readonly detailsHeading: string;
    /** Field labels, per the matrix's form that uses each wording. */
    readonly fields: {
      /** Forms 1–2 «اسم البرنامج». */
      readonly programName: string;
      /** Form 3 «اسم الفعالية». */
      readonly eventName: string;
      /** Form 4 «اسم البرنامج/المحتوى». */
      readonly contentTitle: string;
      /** Form 5 «اسم الاختبار». */
      readonly testName: string;
      readonly daysCount: string;
      /** Forms 1–3 «التاريخ المقرر». */
      readonly dateFrom: string;
      readonly dateTo: string;
      /** Forms 4–5 — the same Arabic wording, "Required date" in English. */
      readonly requiredDateFrom: string;
      readonly requiredDateTo: string;
      /** Form 6 «التاريخ المطلوب لتقديم الاستشارة». */
      readonly consultationDateFrom: string;
      readonly consultationDateTo: string;
      readonly period: string;
      readonly deliveryMechanism: string;
      readonly city: string;
      readonly trainingLanguage: string;
      readonly contentLanguage: string;
      readonly consultationLanguage: string;
      readonly traineeLevel: string;
      /** Forms 2–3 «اسم العميل (البرامج الخاصة)». */
      readonly clientName: string;
      /** Forms 4–5 — same Arabic wording, "Client name" in English. */
      readonly clientNameShort: string;
      /** Forms 1–3 «إضافة مدرب محدد من اختيار العميل / المركز». */
      readonly specificNominee: string;
      /** Forms 4–5 «إضافة مدرب/مختص محدد». */
      readonly specificPerson: string;
      /** Form 6 «إضافة استشاري محدد من اختيار العميل / المركز». */
      readonly specificConsultant: string;
      readonly consultationTopic: string;
      readonly expectedHours: string;
      readonly consultationType: string;
      readonly beneficiary: string;
      readonly specializationDomain: string;
      /** J-16/F4 — «العدد المطلوب من الخبراء»; ≥ 1, no approved maximum. */
      readonly requiredHeadcount: string;
      /** Forms 1–3 «النشرة التعريفية». */
      readonly brochure: string;
      /** Forms 4–5 — same Arabic wording, "Brief / brochure" in English. */
      readonly briefBrochure: string;
      /** Form 6 «المرفقات». */
      readonly attachments: string;
      readonly notes: string;
    };
    /** The matrix's option lists. */
    readonly options: {
      readonly daysOther: string;
      readonly periods: Readonly<Record<(typeof PERIODS)[number], string>>;
      readonly deliveryModes: Readonly<Record<DeliveryMode, string>>;
      readonly languages: Readonly<Record<(typeof LANGUAGES)[number], string>>;
      readonly traineeLevels: Readonly<Record<(typeof TRAINEE_LEVELS)[number], string>>;
      readonly consultationTypes: Readonly<Record<(typeof CONSULTATION_TYPES)[number], string>>;
    };
    readonly cityHint: string;
    readonly hoursHint: string;
    readonly headcountHint: string;
    /** J-16/F5 — what naming a person does to the request. */
    readonly nomineeHint: string;
    readonly nomineeNotEligible: string;
    /* — the repeatable named-expert picker (up to `requiredHeadcount`) — */
    readonly addNominee: string;
    /** Names the picker on slot n, and the card it fills. */
    readonly nomineeSlot: (position: number) => string;
    readonly nomineeRemove: (position: number) => string;
    /** The identifying value the nominee lookup serves beside the name. */
    readonly nomineeReference: (id: string) => string;
    /** Announced politely whenever the count changes. */
    readonly nomineeCount: (chosen: number, headcount: number) => string;
    /** Why «+ إضافة خبير» is unavailable. */
    readonly nomineeLimit: (headcount: number) => string;
    readonly notesPlaceholder: string;
    readonly optionalHint: string;
    /** F2/AC-3 survives the redesign: the request creates nothing in FAST. */
    readonly noCreateNote: string;
    readonly submit: string;
    /** «النشرة التعريفية» — stored before the request is sent. */
    readonly upload: {
      /** J-01's document rule, stated beside the uploader. */
      readonly hint: string;
      readonly browseLabel: string;
      readonly removeLabel: string;
      readonly formatError: string;
      readonly sizeError: string;
      /** 422 — the server refused the file under the same rule. */
      readonly refused: string;
      /** 400 `file-required` — an empty file. */
      readonly empty: string;
      readonly forbidden: string;
      readonly failed: string;
    };
    readonly errors: Readonly<Record<CentreRequestValidationCode, string>>;
    readonly successTitle: string;
    readonly successBody: (reference: string) => string;
    readonly successNext: string;
    readonly backToList: string;
    readonly createAnother: string;
  };

  /** J-17 — matching, the pool, and the requesting party's decision. */
  readonly matching: {
    readonly documentTitle: (reference: string) => string;
    readonly heading: string;
    readonly poolSizeNote: (required: number, pool: number) => string;
    /** F1 — the engine. */
    readonly runEngine: string;
    readonly running: string;
    /** Says the model is a draft. The internal version id is not shown —
     *  it identifies a seed row, and means nothing to a matching officer. */
    readonly modelVersion: (version: string) => string;
    readonly rankedHeading: string;
    readonly scoreLabel: string;
    readonly criteria: Readonly<Record<'language' | 'delivery-mode' | 'evaluation', string>>;
    /** F1/AC-2 — excluded entirely, and the page says why. */
    readonly excludedHeading: string;
    readonly excludedNote: string;
    readonly exclusionReasons: Readonly<
      Record<'specialization' | 'location' | 'schedule-conflict' | 'file-status', string>
    >;
    /** F2 — the manual path. */
    readonly manualHeading: string;
    readonly manualDescription: string;
    readonly manualSearchLabel: string;
    readonly selectedCount: (selected: number, required: number) => string;
    /** F3 — sending the pool. */
    readonly sendPool: string;
    readonly sendNote: string;
    readonly priceLabel: string;
    readonly priceUnavailable: string;
    readonly priceSource: (reference: string) => string;
    readonly identityCardLink: string;
    /** F4 — the requesting party. */
    readonly decisionHeading: string;
    readonly decisionDescription: string;
    readonly approve: string;
    readonly reject: string;
    readonly rankHeading: string;
    readonly rankHint: string;
    readonly rankLabel: (name: string) => string;
    readonly submitDecision: string;
    readonly decidedHeading: string;
    readonly goingForward: string;
    readonly backups: string;
    readonly fullRejectionTitle: string;
    readonly fullRejectionBody: string;
    readonly errors: Readonly<
      Record<'pool-size-wrong' | 'decisions-incomplete' | 'ranking-mismatch', string>
    >;
    readonly notAuthorized: string;
    readonly poolSentTitle: string;
    readonly poolSentBody: string;
  };

  readonly errors: {
    readonly loadTitle: string;
    readonly loadBody: string;
    readonly submitFailed: string;
    readonly retry: string;
  };
}

const fmtAr = (value: number) => arNumber(value);

const ar: AssignmentsContent = {
  documentTitle: 'طلبات الإسناد — منصة الخبراء',
  listTitle: 'طلبات الإسناد',
  listDescription: 'طلبات احتياج المراكز والجهات الطالبة، وحالتها في مسار المطابقة والترشيح.',
  create: 'إنشاء طلب إسناد',
  resultsLabel: 'طلبات الإسناد',
  columns: {
    reference: 'رقم الطلب',
    service: 'الخدمة',
    program: 'البرنامج',
    headcount: 'العدد المطلوب',
    status: 'الحالة',
    created: 'تاريخ الإنشاء',
  },
  statuses: {
    matching: 'قيد المطابقة',
    nominated: 'تم الترشيح',
    closed: 'مغلق',
  },
  headcountValue: (count) => (count === 1 ? 'شخص واحد' : `${fmtAr(count)} أشخاص`),
  multiHeadcountNote: 'طلب متعدد: يقبل ترشيح أكثر من شخص عليه.',
  empty: {
    title: 'لا توجد طلبات إسناد',
    body: 'ابدأ بإنشاء طلب إسناد جديد لتحديد الاحتياج.',
  },

  form: {
    documentTitle: 'طلب تقديم برنامج — منصة الخبراء',
    breadcrumbLabel: 'مسار التنقل',
    breadcrumbList: 'طلبات الإسناد',
    title: 'طلب تقديم البرنامج',
    intro:
      'نموذج طلب الخبير أو المدرب المستقل من المراكز: حدّد الخيارات الرئيسية، ثم أكمل بيانات الطلب حسب نوعه.',
    services: {
      trainer: 'مدرب',
      consultant: 'مستشار',
      'content-developer': 'مطوّر محتوى',
      'question-writer': 'كاتب أسئلة',
    },
    mainHeading: 'الخيارات الرئيسية',
    centreLabel: 'اسم المركز',
    requestTypeLabel: 'نوع الطلب',
    responsibleLabel: 'اسم المسؤول',
    responsibleHint: 'الموظف المُدخل للطلب.',
    requestTypes: {
      'general-program': 'برنامج تدريبي عام',
      'private-program': 'برنامج تدريبي خاص',
      'training-workshop': 'ورشة عمل',
      meeting: 'لقاء',
      seminar: 'ندوة',
      'content-development-request': 'تطوير محتوى',
      'question-writing': 'كتابة الأسئلة',
      'technical-presentations': 'عروض فنية / محاور البرامج',
      consultations: 'استشارات',
      other: 'أخرى',
    },
    detailsHeading: 'بيانات البرنامج التدريبي',
    fields: {
      programName: 'اسم البرنامج',
      eventName: 'اسم الفعالية',
      contentTitle: 'اسم البرنامج/المحتوى',
      testName: 'اسم الاختبار',
      daysCount: 'عدد الأيام',
      dateFrom: 'التاريخ المقرر (من)',
      dateTo: 'التاريخ المقرر (إلى)',
      requiredDateFrom: 'التاريخ المقرر (من)',
      requiredDateTo: 'التاريخ المقرر (إلى)',
      consultationDateFrom: 'التاريخ المطلوب لتقديم الاستشارة (من)',
      consultationDateTo: 'التاريخ المطلوب لتقديم الاستشارة (إلى)',
      period: 'الفترة',
      deliveryMechanism: 'آلية التنفيذ',
      city: 'المدينة / الموقع',
      trainingLanguage: 'لغة التدريب',
      contentLanguage: 'لغة المحتوى',
      consultationLanguage: 'لغة الاستشارة',
      traineeLevel: 'مستوى المتدربين',
      clientName: 'اسم العميل (البرامج الخاصة)',
      clientNameShort: 'اسم العميل (البرامج الخاصة)',
      specificNominee: 'إضافة مدرب محدد من اختيار العميل / المركز',
      specificPerson: 'إضافة مدرب/مختص محدد',
      specificConsultant: 'إضافة استشاري محدد من اختيار العميل / المركز',
      consultationTopic: 'موضوع الاستشارة',
      expectedHours: 'عدد الساعات المتوقعة',
      consultationType: 'نوع الاستشارة',
      beneficiary: 'الجهة المستفيدة من الاستشارة',
      specializationDomain: 'مجال التخصص',
      requiredHeadcount: 'العدد المطلوب من الخبراء',
      brochure: 'النشرة التعريفية',
      briefBrochure: 'النشرة التعريفية',
      attachments: 'المرفقات',
      notes: 'ملاحظات',
    },
    options: {
      daysOther: 'أخرى',
      periods: { morning: 'صباحية', evening: 'مسائية' },
      deliveryModes: { onsite: 'حضوري', online: 'عن بُعد', 'live-stream': 'بث مباشر' },
      languages: { ar: 'عربي', en: 'إنجليزي' },
      traineeLevels: { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' },
      consultationTypes: {
        individual: 'استشارة فردية',
        institutional: 'استشارة مؤسسية',
        'case-study': 'دراسة حالة',
        'assessment-audit': 'تقييم / تدقيق',
        other: 'أخرى',
      },
    },
    cityHint: 'اكتب اسم الموقع، أو «تيمز».',
    hoursHint: 'مثال: 6 ساعات.',
    headcountHint: 'عدد الخبراء المطلوبين لهذا الطلب (1 فأكثر).',
    nomineeHint:
      'كل خبير تسمّيه هنا يشغل مقعدًا واحدًا من العدد المطلوب ويُرسل العرض إليه مباشرة بعد التحقق من أهليته، وتمر المقاعد غير المسمّاة بالمطابقة.',
    nomineeNotEligible:
      'الشخص المحدد غير مؤهل لهذا الطلب حاليًا (حالة الملف أو الخدمة أو التخصص أو الموقع أو تعارض المواعيد).',
    addNominee: '+ إضافة خبير',
    nomineeSlot: (position) => `الخبير المحدد ${fmtAr(position)}`,
    nomineeRemove: (position) => `إزالة الخبير المحدد ${fmtAr(position)}`,
    nomineeReference: (id) => `المعرّف: ${id}`,
    nomineeCount: (chosen, headcount) =>
      `الخبراء المحددون: ${fmtAr(chosen)} من ${fmtAr(headcount)}`,
    nomineeLimit: (headcount) =>
      `بلغت العدد المطلوب (${fmtAr(headcount)}). ارفع العدد المطلوب من الخبراء لإضافة المزيد.`,
    notesPlaceholder: 'اكتب ملاحظاتك هنا',
    optionalHint: 'اختياري.',
    noCreateNote: 'هذا الطلب يصف الاحتياج فقط؛ لا يُنشئ برنامجًا أو خطة في نظام FAST بأي حال.',
    submit: 'إرسال الطلب',
    upload: {
      hint: 'الصيغ المقبولة: PDF وDOC وDOCX — الحد الأقصى 1 م.ب.',
      browseLabel: 'اختر ملفًا',
      removeLabel: 'إزالة',
      formatError: 'صيغة الملف غير مقبولة. الصيغ المسموحة: PDF وDOC وDOCX.',
      sizeError: 'حجم الملف يتجاوز الحد الأقصى (1 م.ب).',
      refused: 'رُفض الملف: يجب أن يكون PDF أو DOC أو DOCX وألا يتجاوز 1 م.ب.',
      empty: 'الملف فارغ. اختر ملفًا آخر.',
      forbidden: 'ليست لديك صلاحية رفع مرفقات طلبات الإسناد.',
      failed: 'تعذّر رفع الملف. يُرجى المحاولة مرة أخرى.',
    },
    errors: {
      'centre-required': 'اختر اسم المركز.',
      'request-type-required': 'اختر نوع الطلب.',
      'responsible-required': 'اختر اسم المسؤول.',
      'program-name-required': 'أدخل الاسم.',
      'days-invalid': 'اختر عدد الأيام.',
      'dates-required': 'حدّد التاريخ (من) و(إلى).',
      'dates-order': 'يجب ألا يسبق التاريخ (إلى) التاريخ (من).',
      'period-required': 'اختر الفترة.',
      'mechanism-required': 'اختر آلية التنفيذ.',
      'city-required': 'أدخل المدينة / الموقع.',
      'language-required': 'اختر اللغة.',
      'trainee-level-required': 'اختر مستوى المتدربين.',
      'client-required': 'أدخل اسم العميل.',
      'topic-required': 'أدخل موضوع الاستشارة.',
      'hours-invalid': 'أدخل عدد ساعات صحيحًا (1 فأكثر).',
      'consultation-type-required': 'اختر نوع الاستشارة.',
      'attachment-required': 'أرفق الملف المطلوب.',
      'domain-required': 'اختر مجال التخصص.',
      'headcount-invalid': 'أدخل عددًا صحيحًا للخبراء (1 فأكثر).',
      'duplicate-nominee': 'لا يمكن اختيار الخبير نفسه أكثر من مرة.',
      'nominees-exceed-headcount': 'عدد الخبراء المحددين يتجاوز العدد المطلوب.',
    },
    successTitle: 'تم إرسال الطلب',
    successBody: (reference) => `تم إنشاء طلب الإسناد برقم ${reference}.`,
    successNext: 'انتقل الطلب إلى مسار المطابقة والترشيح، وستصل التحديثات إلى فريق إدارة المدربين.',
    backToList: 'العودة إلى طلبات الإسناد',
    createAnother: 'إنشاء طلب آخر',
  },

  matching: {
    documentTitle: (reference) => `${reference} — المطابقة والترشيح`,
    heading: 'المطابقة والترشيح',
    poolSizeNote: (required, pool) =>
      `الطلب يحتاج ${fmtAr(required)}، ويجب إرسال ${fmtAr(pool)} مرشحًا بالضبط — ثلاثة لكل احتياج.`,
    runEngine: 'تشغيل محرك المطابقة',
    running: 'جارٍ التشغيل…',
    modelVersion: () => 'نموذج المطابقة: نسخة مبدئية — الأوزان غير معتمدة بعد.',
    rankedHeading: 'المرشحون المرتّبون',
    scoreLabel: 'الدرجة',
    criteria: {
      language: 'اللغة',
      'delivery-mode': 'نمط التقديم',
      evaluation: 'التقييم والتصنيف',
    },
    excludedHeading: 'مستبعدون',
    excludedNote: 'استُبعد هؤلاء كليًا لعدم استيفاء معيار إقصائي، ولا يمكن ترشيحهم لهذا الطلب.',
    exclusionReasons: {
      specialization: 'التخصص غير مطابق',
      location: 'المدينة غير مطابقة',
      'schedule-conflict': 'تعارض مع ارتباط مؤكَّد',
      'file-status': 'حالة الملف غير نشطة',
    },
    manualHeading: 'البحث اليدوي',
    manualDescription:
      'يمكنك بناء قائمة المرشحين يدويًا بدل محرك المطابقة. تبقى المعايير الإقصائية سارية عند الإرسال.',
    manualSearchLabel: 'بحث باسم المدرب',
    selectedCount: (selected, required) => `اخترت ${fmtAr(selected)} من ${fmtAr(required)}`,
    sendPool: 'إرسال القائمة إلى الجهة الطالبة',
    sendNote: 'تُرسل القائمة دفعة واحدة، ولا يُرسل المرشحون فرادى.',
    priceLabel: 'السعر',
    priceUnavailable: 'لا يوجد سعر لهذا النمط في اتفاقيته.',
    priceSource: (reference) => `المصدر: الاتفاقية ${reference}`,
    identityCardLink: 'عرض البطاقة التعريفية',
    decisionHeading: 'قرار الجهة الطالبة',
    decisionDescription: 'راجع كل مرشح على حدة: اقبله أو ارفضه. ثم رتّب المقبولين حسب الأفضلية.',
    approve: 'قبول',
    reject: 'رفض',
    rankHeading: 'ترتيب الأفضلية',
    rankHint: 'رتّب المرشحين المقبولين من الأفضل إلى ما دونه.',
    rankLabel: (name) => `ترتيب ${name}`,
    submitDecision: 'اعتماد القرار',
    decidedHeading: 'نتيجة المراجعة',
    goingForward: 'ينتقل إلى عرض الإسناد',
    backups: 'مرشح احتياطي',
    fullRejectionTitle: 'رُفضت القائمة بالكامل',
    fullRejectionBody:
      'فُتحت دورة إعادة توجيه للفتحة (J-19): شغّل المطابقة من جديد لبناء قائمة مرشحين جديدة.',
    errors: {
      'pool-size-wrong': 'عدد المرشحين يجب أن يكون ثلاثة لكل احتياج بالضبط — لا أقل ولا أكثر.',
      'decisions-incomplete': 'يجب اتخاذ قرار لكل مرشح في القائمة.',
      'ranking-mismatch': 'ترتيب الأفضلية يجب أن يشمل المقبولين جميعًا دون سواهم.',
    },
    notAuthorized: 'ليست لديك صلاحية هذا الإجراء على هذا الطلب.',
    poolSentTitle: 'أُرسلت قائمة المرشحين',
    poolSentBody: 'وصلت القائمة إلى الجهة الطالبة لمراجعتها.',
  },

  errors: {
    loadTitle: 'تعذّر تحميل البيانات',
    loadBody: 'حدث خطأ أثناء التحميل. يُرجى المحاولة مرة أخرى.',
    submitFailed: 'تعذّر إرسال الطلب. يُرجى المحاولة مرة أخرى.',
    retry: 'إعادة المحاولة',
  },
};

const en: AssignmentsContent = {
  documentTitle: 'Assignment requests — Expert Hub',
  listTitle: 'Assignment requests',
  listDescription:
    'Requests raised by centres and requesting parties, and where each stands in matching and nomination.',
  create: 'Create an assignment request',
  resultsLabel: 'Assignment requests',
  columns: {
    reference: 'Reference',
    service: 'Service',
    program: 'Programme',
    headcount: 'People needed',
    status: 'Status',
    created: 'Created',
  },
  statuses: {
    matching: 'In matching',
    nominated: 'Nominated',
    closed: 'Closed',
  },
  headcountValue: (count) => (count === 1 ? '1 person' : `${count} people`),
  multiHeadcountNote: 'Multi-person request: more than one nomination can be made against it.',
  empty: {
    title: 'No assignment requests',
    body: 'Create an assignment request to record a need.',
  },

  form: {
    documentTitle: 'Programme delivery request — Expert Hub',
    breadcrumbLabel: 'Breadcrumb',
    breadcrumbList: 'Assignment requests',
    title: 'Programme delivery request',
    intro:
      'The centres’ expert/independent-trainer request form: set the main options, then complete the request data for its type.',
    services: {
      trainer: 'Trainer',
      consultant: 'Consultant',
      'content-developer': 'Content developer',
      'question-writer': 'Question writer',
    },
    mainHeading: 'Main options',
    centreLabel: 'Center',
    requestTypeLabel: 'Request type',
    responsibleLabel: 'Requester name',
    responsibleHint: 'The employee entering the request.',
    requestTypes: {
      'general-program': 'General public program',
      'private-program': 'Private program',
      'training-workshop': 'Workshop',
      meeting: 'Meeting',
      seminar: 'Seminar',
      'content-development-request': 'Content development',
      'question-writing': 'Question writing',
      'technical-presentations': 'Technical presentations / program themes',
      consultations: 'Consultation',
      other: 'Other',
    },
    detailsHeading: 'Training programme data',
    fields: {
      programName: 'Program name',
      eventName: 'Event name',
      contentTitle: 'Title',
      testName: 'Test name',
      daysCount: 'Number of days',
      dateFrom: 'Scheduled date (from)',
      dateTo: 'Scheduled date (to)',
      requiredDateFrom: 'Required date (from)',
      requiredDateTo: 'Required date (to)',
      consultationDateFrom: 'Required date (from)',
      consultationDateTo: 'Required date (to)',
      period: 'Period',
      deliveryMechanism: 'Execution mode',
      city: 'City / location',
      trainingLanguage: 'Training language',
      contentLanguage: 'Content language',
      consultationLanguage: 'Consultation language',
      traineeLevel: 'Trainee level',
      clientName: 'Client name (private programs)',
      clientNameShort: 'Client name',
      specificNominee: 'Add a specific trainer (client/center choice)',
      specificPerson: 'Named person (optional)',
      specificConsultant: 'Named person (optional)',
      consultationTopic: 'Consultation subject',
      expectedHours: 'Expected hours',
      consultationType: 'Consultation type',
      beneficiary: 'Beneficiary entity',
      specializationDomain: 'Specialization / domain',
      requiredHeadcount: 'Required number of experts',
      brochure: 'Prospectus / brochure',
      briefBrochure: 'Brief / brochure',
      attachments: 'Attachments',
      notes: 'Notes',
    },
    // The Assignment Matrix gives these values in Arabic only. `languages` is confirmed by the
    // Application Form Matrix's own English («Arabic, English»); the rest stay
    // TEMPORARY_TRANSLATION_REQUIRES_BUSINESS_REVIEW (`23_BUSINESS_REVIEW.md` §3).
    options: {
      daysOther: 'Other',
      periods: { morning: 'Morning', evening: 'Evening' },
      deliveryModes: { onsite: 'On-site', online: 'Online', 'live-stream': 'Live stream' },
      languages: { ar: 'Arabic', en: 'English' },
      traineeLevels: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
      consultationTypes: {
        individual: 'Individual consultation',
        institutional: 'Institutional consultation',
        'case-study': 'Case study',
        'assessment-audit': 'Assessment / audit',
        other: 'Other',
      },
    },
    cityHint: 'Type the location name, or “Teams”.',
    hoursHint: 'Example: 6 hours.',
    headcountHint: 'How many experts this request needs (1 or more).',
    nomineeHint:
      'Each expert named here takes one of the required slots and receives the offer directly once their eligibility is checked; the slots left unnamed go through matching.',
    nomineeNotEligible:
      'The named person is not currently eligible for this request (file status, service, specialization, location or a schedule conflict).',
    addNominee: '+ Add expert',
    nomineeSlot: (position) => `Named expert ${position}`,
    nomineeRemove: (position) => `Remove named expert ${position}`,
    nomineeReference: (id) => `Reference: ${id}`,
    nomineeCount: (chosen, headcount) => `Named experts: ${chosen} of ${headcount}`,
    nomineeLimit: (headcount) =>
      `The required number (${headcount}) is reached. Raise the required number of experts to add more.`,
    notesPlaceholder: 'Write your notes here',
    optionalHint: 'Optional.',
    noCreateNote:
      'This request only describes the need; it never creates a programme or plan in FAST.',
    submit: 'Submit request',
    upload: {
      hint: 'Accepted formats: PDF, DOC, DOCX — up to 1 MB.',
      browseLabel: 'Choose a file',
      removeLabel: 'Remove',
      formatError: 'File format not accepted. Allowed: PDF, DOC, DOCX.',
      sizeError: 'The file exceeds the maximum size (1 MB).',
      refused: 'The file was refused: it must be a PDF, DOC or DOCX of 1 MB or less.',
      empty: 'The file is empty. Choose another file.',
      forbidden: 'You do not have permission to upload assignment-request attachments.',
      failed: 'The file could not be uploaded. Please try again.',
    },
    errors: {
      'centre-required': 'Choose the centre.',
      'request-type-required': 'Choose the request type.',
      'responsible-required': 'Choose the responsible employee.',
      'program-name-required': 'Enter the name.',
      'days-invalid': 'Choose the number of days.',
      'dates-required': 'Set the dates (from) and (to).',
      'dates-order': 'The date (to) cannot be before the date (from).',
      'period-required': 'Choose the period.',
      'mechanism-required': 'Choose the execution mode.',
      'city-required': 'Enter the city / location.',
      'language-required': 'Choose the language.',
      'trainee-level-required': 'Choose the trainee level.',
      'client-required': 'Enter the client name.',
      'topic-required': 'Enter the consultation subject.',
      'hours-invalid': 'Enter a valid number of hours (1 or more).',
      'consultation-type-required': 'Choose the consultation type.',
      'attachment-required': 'Attach the required file.',
      'domain-required': 'Choose the specialization / domain.',
      'headcount-invalid': 'Enter a valid number of experts (1 or more).',
      'duplicate-nominee': 'The same expert cannot be named more than once.',
      'nominees-exceed-headcount': 'More experts are named than the request requires.',
    },
    successTitle: 'Request submitted',
    successBody: (reference) => `Assignment request ${reference} was created.`,
    successNext:
      'The request entered the matching and nomination path; updates reach the trainer-management team.',
    backToList: 'Back to assignment requests',
    createAnother: 'Create another request',
  },

  matching: {
    documentTitle: (reference) => `${reference} — matching & nomination`,
    heading: 'Matching & nomination',
    poolSizeNote: (required, pool) =>
      `This request needs ${required}, so exactly ${pool} candidates must be sent — three per person needed.`,
    runEngine: 'Run the matching engine',
    running: 'Running…',
    modelVersion: () => 'Matching model: draft — the weights are not approved yet.',
    rankedHeading: 'Ranked candidates',
    scoreLabel: 'Score',
    criteria: {
      language: 'Language',
      'delivery-mode': 'Delivery mode',
      evaluation: 'Evaluation & classification',
    },
    excludedHeading: 'Excluded',
    excludedNote:
      'These candidates were excluded entirely for failing an exclusionary criterion, and cannot be nominated for this request.',
    exclusionReasons: {
      specialization: 'Specialization does not match',
      location: 'City does not match',
      'schedule-conflict': 'Conflicts with a confirmed engagement',
      'file-status': 'File status is not active',
    },
    manualHeading: 'Manual search',
    manualDescription:
      'You can build the candidate list yourself instead of using the engine. The exclusionary criteria still apply when sending.',
    manualSearchLabel: 'Search by trainer name',
    selectedCount: (selected, required) => `${selected} of ${required} selected`,
    sendPool: 'Send the list to the requesting party',
    sendNote: 'The list is sent as one batch; candidates are never sent one at a time.',
    priceLabel: 'Price',
    priceUnavailable: 'No price for this delivery mode in their agreement.',
    priceSource: (reference) => `Source: agreement ${reference}`,
    identityCardLink: 'View the identity card',
    decisionHeading: 'Requesting party decision',
    decisionDescription:
      'Review each candidate individually — approve or reject — then rank the approved by preference.',
    approve: 'Approve',
    reject: 'Reject',
    rankHeading: 'Preference order',
    rankHint: 'Rank the approved candidates from most to least preferred.',
    rankLabel: (name) => `Rank ${name}`,
    submitDecision: 'Confirm the decision',
    decidedHeading: 'Review outcome',
    goingForward: 'Moves to the assignment offer',
    backups: 'Ranked backup',
    fullRejectionTitle: 'The whole list was rejected',
    fullRejectionBody:
      'A re-routing cycle is open for the slot (J-19): run matching again to build a new candidate list.',
    errors: {
      'pool-size-wrong':
        'The list must hold exactly three candidates per person needed — no fewer, no more.',
      'decisions-incomplete': 'Every candidate in the list must be decided.',
      'ranking-mismatch': 'The preference order must contain exactly the approved candidates.',
    },
    notAuthorized: 'You do not have permission for this action on this request.',
    poolSentTitle: 'Candidate list sent',
    poolSentBody: 'The list has reached the requesting party for review.',
  },

  errors: {
    loadTitle: 'Could not load the data',
    loadBody: 'Something went wrong while loading. Please try again.',
    submitFailed: 'The request could not be submitted. Please try again.',
    retry: 'Try again',
  },
};

const CONTENT: Record<Locale, AssignmentsContent> = { ar, en };

export function getAssignmentsContent(locale: Locale): AssignmentsContent {
  return CONTENT[locale] ?? CONTENT.ar;
}

/** Service labels are reused from the one approved source where they overlap. */
export function assignmentServiceLabel(locale: Locale, service: AssignmentServiceType): string {
  return getMyApplicationsContent(locale).services[service];
}
