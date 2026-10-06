import type { Locale } from '@/types';
import type { ApplicationService } from '../applications/application.types';
import { getMyApplicationsContent } from '../applications/myApplications.content';
import type { DirectorySpecialty, TrainerClassification } from '../directory/directory.types';
import type { ProfileAgreementStatus, ProfileLockReason, TrainerBioStatus } from './profile.types';
import {
  getDirectoryContent,
  getTrainerClassificationLabels,
} from '../directory/directory.content';
import type { BankDataFieldId, BankDataFormatFieldId } from './profile.types';

/**
 * EH-TP-04 (My Profile) copy — Arabic authoritative, English best-effort. The
 * page/components render structure only. Service labels are reused from
 * `myApplications.content` and specialty/classification labels from
 * `directory.content` so the same trainer is described with the same words
 * everywhere (single source).
 */

/**
 * FAST-owned fields are no longer enumerated here. J-14/F1/AC-1 makes the
 * application-form schema the single field list, so which fields are
 * request-change is a **per-field, server-decided** property
 * (`ProfileFieldStateDto.editability`), not a constant this file can know.
 */

export interface ProfileContent {
  readonly documentTitle: string;
  readonly title: string;
  readonly subtitle: string;
  readonly tabs: {
    readonly overview: string;
    readonly services: string;
    readonly programs: string;
    readonly ratings: string;
    readonly visibility: string;
  };
  readonly header: {
    readonly classificationLabel: string;
    readonly emailLabel: string;
    readonly ratingAria: (score: number) => string;
    readonly reviewsScore: (score: number) => string;
    readonly noRating: string;
    /** Shown in place of a classification for somebody with no trainer file. */
    readonly notAccredited: string;
    readonly notAccreditedTitle: string;
    readonly notAccreditedBody: string;
  };
  /**
   * **J-14/F1** — the self-service form. Field *labels* deliberately live in the
   * application-form schema, not here: AC-1 requires the same fields, so they
   * must carry the same words. Only the surrounding chrome is authored here.
   */
  readonly fields: {
    readonly heading: string;
    readonly description: string;
    readonly save: string;
    readonly saved: string;
    /** FAST-owned provenance + change request (`BR-0404`, P-16). */
    readonly sourceLabel: string;
    readonly lastSync: (date: string) => string;
    readonly requestChange: string;
    readonly pendingChange: (value: string) => string;
    readonly unavailableTitle: string;
    readonly unavailableBody: string;
    /** **F2** — a locked field always says *why*. */
    readonly lockReasons: Readonly<Record<ProfileLockReason, string>>;
  };
  /** J-14/F2 — the three Locked Fields rows, visible and never editable. */
  readonly lockedFacts: {
    readonly heading: string;
    readonly description: string;
    readonly classificationLabel: string;
    readonly evaluationLabel: string;
    readonly evaluationPending: string;
    readonly agreementLabel: string;
    readonly agreementStatuses: Readonly<Record<ProfileAgreementStatus, string>>;
    readonly agreementEndsAt: (date: string) => string;
    readonly agreementNone: string;
  };
  readonly certificates: {
    readonly heading: string;
    readonly description: string;
    readonly empty: string;
    readonly uploadLabel: string;
    /** The served `professional-certificate` rule, stated beside the uploader. */
    readonly uploadHint: (formats: string, maxSizeMb: number) => string;
    readonly browseLabel: string;
    readonly removeLabel: string;
    readonly uploaded: string;
    readonly removed: string;
    readonly formatError: (formats: string) => string;
    readonly sizeError: (maxSizeMb: number) => string;
    /** 422 — the server refused the file under the certificate rule. */
    readonly refused: string;
    /** 400 `file-required` — an empty file. */
    readonly emptyFile: string;
    /** 404 — no trainer profile to attach it to. */
    readonly noProfile: string;
    /** 409 `certificate-rule-unavailable`. */
    readonly ruleUnavailable: string;
    readonly failed: string;
  };
  readonly scope: {
    readonly heading: string;
    readonly servicesHeading: string;
    readonly specialtiesHeading: string;
    readonly empty: string;
  };
  readonly programs: {
    readonly heading: string;
    readonly empty: string;
  };
  readonly ratings: {
    readonly heading: string;
    readonly overallHeading: string;
    readonly perProgramHeading: string;
    readonly outOf: (score: number) => string;
    readonly ratingAria: (label: string, score: number) => string;
    readonly lastRefreshed: (date: string) => string;
    readonly pending: string;
    readonly unavailable: string;
    readonly empty: string;
  };
  /** `P-331` — the short bio: AI-drafted from the CV, confirmed, then approved. */
  readonly bio: {
    readonly heading: string;
    readonly description: string;
    readonly label: string;
    readonly helper: string;
    readonly draftFromCv: string;
    readonly submit: string;
    readonly submitted: string;
    readonly draftRequested: string;
    readonly status: Readonly<Record<TrainerBioStatus, string>>;
    readonly draftingBody: string;
    readonly refresh: string;
    readonly aiDraftBody: string;
    readonly aiUnavailableBody: string;
    readonly aiOff: string;
    readonly noCv: string;
    readonly pendingBody: string;
    readonly returnedTitle: string;
    readonly publishedLabel: string;
    readonly publishedWhileReview: string;
    readonly lengthError: (max: number) => string;
    readonly conflict: string;
    readonly failed: string;
  };
  readonly visibility: {
    readonly heading: string;
    readonly description: string;
    readonly toggleLabel: string;
    readonly toggleOnDescription: string;
    readonly on: string;
    readonly off: string;
  };
  /** J-09/F6 — opens only after preliminary approval. */
  readonly bankData: {
    readonly heading: string;
    readonly requestedTitle: string;
    readonly requestedBody: string;
    readonly completeTitle: string;
    readonly completeBody: string;
    readonly completedAt: (date: string) => string;
    /** Shown when the form opened with what the Academy already holds. */
    readonly prefilledTitle: string;
    readonly prefilledBody: string;
    readonly fields: Readonly<Record<BankDataFieldId, string>>;
    readonly requiredError: string;
    /** J-09 «Bank Data Field Validation Rules» — one message per formatted field. */
    readonly formatErrors: Readonly<Record<BankDataFormatFieldId, string>>;
    readonly errorsHeading: string;
    readonly save: string;
    readonly savedToast: string;
  };
  readonly requestModal: {
    readonly title: (field: string) => string;
    readonly inputLabel: (field: string) => string;
    readonly hint: string;
    readonly submit: string;
    readonly cancel: string;
    readonly dismiss: string;
    readonly submitted: string;
  };
  readonly consentModal: {
    readonly title: string;
    readonly enableBody: string;
    readonly disableBody: string;
    readonly confirm: string;
    readonly cancel: string;
    readonly dismiss: string;
    readonly enabled: string;
    readonly disabled: string;
  };
  readonly errors: {
    readonly loadTitle: string;
    readonly loadBody: string;
    readonly retry: string;
    readonly sessionTitle: string;
    readonly sessionBody: string;
    readonly actionFailed: string;
    readonly homeLabel: string;
  };
  /** `P-265` — the Academy's records beyond the one in the fields. */
  readonly academyRecords: {
    readonly heading: string;
    readonly description: string;
    readonly dated: (date: string) => string;
    readonly unnamed: string;
    readonly unknownInstitution: string;
    readonly editElsewhere: string;
    /** The Academy's own trainer contracts (`P-266`). */
    readonly contractsHeading: string;
    readonly contractsNote: string;
    readonly contractUnnamed: string;
    readonly contractPeriod: (from: string, to: string) => string;
  };
  readonly services: Readonly<Record<ApplicationService, string>>;
  readonly specialties: Readonly<Record<DirectorySpecialty, string>>;
  readonly classifications: Readonly<Record<TrainerClassification, string>>;
}

const ar: ProfileContent = {
  documentTitle: 'ملفي الشخصي — منصة الخبراء والمدربين',
  title: 'ملفي الشخصي',
  subtitle: 'اطّلع على بياناتك المعتمدة، وحدّث الحقول التي يُسمح لك بتعديلها.',
  tabs: {
    overview: 'نظرة عامة',
    services: 'الخدمات والتخصصات',
    programs: 'البرامج',
    ratings: 'التقييمات',
    visibility: 'الظهور العام',
  },
  header: {
    classificationLabel: 'التصنيف',
    emailLabel: 'البريد الإلكتروني',
    ratingAria: (score) => `التقييم العام: ${score} من 5`,
    reviewsScore: (score) => `${score} من 5`,
    noRating: 'لا يوجد تقييم بعد',
    notAccredited: 'غير معتمد بعد',
    notAccreditedTitle: 'لم تُستكمل بيانات اعتمادك في منصة الخبراء',
    notAccreditedBody:
      'صلاحيتك كمدرب جاءت من سجلك في الأكاديمية، ولم تُستكمل بعد إجراءات ' +
      'الاعتماد في هذه المنصة. الحقول المعبّأة أدناه مصدرها سجل الأكاديمية، ' +
      'وما تبقّى فارغًا هو ما تحتاج المنصة إلى استكماله.',
  },
  fields: {
    heading: 'بياناتك',
    description:
      'هذه هي حقول طلب الانضمام نفسها. حدِّث ما تملكه واحفظه مباشرة — لا يترتّب على التحديث إعادة تقديم الطلب ولا دورة اعتماد جديدة.',
    save: 'حفظ التغييرات',
    saved: 'تم حفظ التغييرات بنجاح.',
    sourceLabel: 'المصدر: النظام الرسمي',
    lastSync: (date) => `آخر مزامنة: ${date}`,
    requestChange: 'طلب تغيير',
    pendingChange: (value) => `تغيير قيد الاعتماد: ${value}`,
    unavailableTitle: 'تعذّر تحميل البيانات المعتمدة',
    unavailableBody: 'يتم عرض آخر بيانات معروفة. قد لا تعكس أحدث تحديث حتى عودة الاتصال.',
    lockReasons: {
      classification: 'يُحدَّد عند الاعتماد',
      evaluation: 'محتسب آليًا',
      agreement: 'من الاتفاقية',
      'not-accredited': 'يُستكمل عند الاعتماد',
      'from-academy': 'من سجل الأكاديمية',
    },
  },
  lockedFacts: {
    heading: 'بيانات غير قابلة للتعديل',
    description: 'تُحدَّث هذه البيانات آليًا من مصدرها، ولا يمكن تعديلها من هنا.',
    classificationLabel: 'التصنيف',
    evaluationLabel: 'التقييم العام',
    evaluationPending: 'لم يُحتسب بعد',
    agreementLabel: 'حالة الاتفاقية',
    agreementStatuses: {
      active: 'سارية',
      suspended: 'موقوفة',
      expired: 'منتهية',
      ended: 'مُنهاة',
    },
    agreementEndsAt: (date) => `تنتهي بتاريخ ${date}`,
    agreementNone: 'لا توجد اتفاقية بعد',
  },
  certificates: {
    heading: 'الشهادات',
    description: 'أضف شهاداتك المهنية لدعم ملفك.',
    empty: 'لا توجد شهادات مضافة.',
    uploadLabel: 'إضافة شهادة',
    uploadHint: (formats, maxSizeMb) =>
      `الصيغ المقبولة: ${formats} — الحد الأقصى ${maxSizeMb} م.ب.`,
    browseLabel: 'اختر ملفًا',
    removeLabel: 'إزالة',
    uploaded: 'تمت إضافة الشهادة.',
    removed: 'تمت إزالة الشهادة.',
    formatError: (formats) => `صيغة الملف غير مقبولة. الصيغ المسموحة: ${formats}.`,
    sizeError: (maxSizeMb) => `حجم الملف يتجاوز الحد الأقصى (${maxSizeMb} م.ب).`,
    refused: 'رُفض الملف لأنه لا يطابق قاعدة الشهادة المهنية (الصيغة أو الحجم).',
    emptyFile: 'الملف فارغ. اختر ملفًا آخر.',
    noProfile: 'لا يوجد ملف مدرب لإضافة الشهادة إليه بعد.',
    ruleUnavailable:
      'تعذّرت إضافة الشهادة: قاعدة مرفقات الشهادة المهنية غير متاحة لطلبك. تواصل مع فريق إدارة المدربين.',
    failed: 'تعذّر رفع الشهادة. يُرجى المحاولة مرة أخرى.',
  },
  scope: {
    heading: 'النطاق المعتمد',
    servicesHeading: 'الخدمات المعتمدة',
    specialtiesHeading: 'مجالات التخصص',
    empty: 'لا يوجد نطاق معتمد بعد.',
  },
  programs: {
    heading: 'سجل البرامج',
    empty: 'لا توجد برامج مسجّلة بعد.',
  },
  ratings: {
    heading: 'التقييمات',
    overallHeading: 'التقييم العام',
    perProgramHeading: 'التقييم حسب البرنامج',
    outOf: (score) => `${score} من 5`,
    ratingAria: (label, score) => `${label}: ${score} من 5`,
    lastRefreshed: (date) => `آخر تحديث: ${date}`,
    pending: 'يجري احتساب تقييمك، وسيظهر قريبًا.',
    unavailable: 'التقييم غير متاح حاليًا.',
    empty: 'لا توجد تقييمات بعد.',
  },
  bio: {
    heading: 'النبذة المختصرة',
    description:
      'نبذة قصيرة عنك تظهر في ملفك بدليل الخبراء العام بعد أن يعتمدها فريق إدارة المدربين، إن كان ملفك ظاهرًا.',
    label: 'نص النبذة',
    helper: 'جملتان إلى ثلاث جمل عن مجال خبرتك ومؤهلاتك وما تقدّمه من تدريب أو استشارات.',
    draftFromCv: 'اقترح نبذة من سيرتي الذاتية',
    submit: 'إرسال للمراجعة',
    submitted: 'أُرسلت النبذة إلى فريق إدارة المدربين للمراجعة.',
    draftRequested: 'نعدّ مسودة من سيرتك الذاتية.',
    status: {
      none: 'لا توجد نبذة',
      drafting: 'جارٍ إعداد المسودة',
      ai_draft: 'مسودة مقترحة',
      ai_unavailable: 'تعذّر إعداد مسودة',
      pending_review: 'قيد المراجعة',
      returned: 'أُعيدت للتعديل',
      approved: 'معتمدة',
    },
    draftingBody:
      'نعدّ مسودة من سيرتك الذاتية، وقد يستغرق ذلك بضع دقائق. حدّث القسم لاحقًا، أو اكتب النبذة بنفسك الآن.',
    refresh: 'تحديث',
    aiDraftBody:
      'هذه مسودة مقترحة من سيرتك الذاتية. راجعها وعدّلها قبل إرسالها، فلن تُنشر قبل اعتمادها.',
    aiUnavailableBody: 'تعذّر إعداد مسودة من سيرتك الذاتية. اكتب النبذة بنفسك.',
    aiOff: 'الاقتراح من السيرة الذاتية غير متاح حاليًا. اكتب النبذة بنفسك.',
    noCv: 'لا توجد سيرة ذاتية مرفقة بطلبك لنقترح منها نبذة. اكتب النبذة بنفسك.',
    pendingBody:
      'النبذة قيد مراجعة فريق إدارة المدربين. يمكنك تعديلها وإعادة إرسالها قبل المراجعة.',
    returnedTitle: 'أُعيدت النبذة للتعديل',
    publishedLabel: 'النبذة المعتمدة',
    publishedWhileReview: 'تبقى النبذة المعتمدة ظاهرة حتى يُعتمد التعديل.',
    lengthError: (max) => `اكتب النبذة في حدود ${max} حرف.`,
    conflict: 'تغيّرت النبذة منذ فتح الصفحة. حدّث القسم ثم حاول مرة أخرى.',
    failed: 'تعذّر حفظ النبذة. حاول مرة أخرى.',
  },
  visibility: {
    heading: 'الظهور في الدليل العام',
    description:
      'عند التفعيل يظهر ملفك في دليل الخبراء العام. سيظهر للزوار: الاسم، والمجال، والنبذة المختصرة بعد اعتمادها، والبرامج المقدمة مع الأكاديمية، والصورة الشخصية، والتصنيف. يسري التغيير فورًا.',
    toggleLabel: 'إظهار ملفي في الدليل العام',
    toggleOnDescription: 'ملفك ظاهر حاليًا في الدليل العام.',
    on: 'ظاهر',
    off: 'غير ظاهر',
  },
  bankData: {
    heading: 'البيانات المصرفية',
    requestedTitle: 'اعتماد مبدئي — يُرجى استكمال بياناتك المصرفية',
    requestedBody:
      'حصل طلبك على الاعتماد المبدئي. استكمل البيانات المصرفية أدناه لتتمكن الأكاديمية من إعداد الاتفاقية. جميع الحقول مطلوبة.',
    completeTitle: 'اكتملت بياناتك المصرفية',
    completeBody: 'تم حفظ بياناتك المصرفية، ويمكن الآن بدء إعداد الاتفاقية.',
    completedAt: (date) => `حُفظت في ${date}`,
    prefilledTitle: 'عبّأنا الحقول بما لدى الأكاديمية من بياناتك',
    prefilledBody: 'راجعها وعدّل ما تغيّر منها قبل الحفظ. لن يُعتمد شيء منها إلّا بعد تأكيدك.',
    fields: {
      bankCountry: 'دولة البنك',
      bankCity: 'مدينة البنك',
      bankName: 'اسم البنك',
      branchName: 'اسم الفرع',
      iban: 'رقم الآيبان (IBAN)',
      swiftCode: 'رمز السويفت (SWIFT)',
      accountHolderName: 'الاسم على البطاقة المصرفية',
      accountNumber: 'رقم الحساب',
    },
    requiredError: 'هذا الحقل مطلوب.',
    formatErrors: {
      iban: 'أدخل رقم آيبان سعوديًا: يبدأ بـ SA ويليه 22 رقمًا (24 خانة).',
      swiftCode:
        'أدخل رمز سويفت من 8 أو 11 خانة: 4 أحرف للبنك، وحرفان للدولة، وخانتان للموقع، و3 خانات اختيارية للفرع.',
      accountNumber: 'أدخل رقم الحساب بالأرقام فقط.',
    },
    errorsHeading: 'أكمل الحقول التالية',
    save: 'حفظ البيانات المصرفية',
    savedToast: 'تم حفظ بياناتك المصرفية.',
  },
  requestModal: {
    title: (field) => `طلب تغيير: ${field}`,
    inputLabel: (field) => `القيمة الجديدة لـ${field}`,
    hint: 'سيُراجع طلبك من الجهة المختصة، وتبقى القيمة الحالية معروضة حتى اعتماده.',
    submit: 'إرسال الطلب',
    cancel: 'إلغاء',
    dismiss: 'إغلاق',
    submitted: 'تم إرسال طلب التغيير، وهو قيد الاعتماد.',
  },
  consentModal: {
    title: 'تأكيد تغيير الظهور',
    enableBody: 'سيظهر ملفك في الدليل العام فورًا. هل تريد المتابعة؟',
    disableBody: 'سيُخفى ملفك من الدليل العام فورًا. هل تريد المتابعة؟',
    confirm: 'تأكيد',
    cancel: 'إلغاء',
    dismiss: 'إغلاق',
    enabled: 'أصبح ملفك ظاهرًا في الدليل العام.',
    disabled: 'تم إخفاء ملفك من الدليل العام.',
  },
  errors: {
    loadTitle: 'تعذّر تحميل الملف',
    loadBody: 'حدث خطأ أثناء تحميل ملفك الشخصي. يُرجى المحاولة مرة أخرى.',
    retry: 'إعادة المحاولة',
    sessionTitle: 'انتهت الجلسة',
    sessionBody: 'انتهت جلستك. يُرجى تسجيل الدخول مرة أخرى للمتابعة.',
    actionFailed: 'تعذّر إتمام العملية. يُرجى المحاولة مرة أخرى.',
    homeLabel: 'العودة إلى طلباتي',
  },
  academyRecords: {
    heading: 'سجلات أخرى في الأكاديمية',
    description: 'مؤهلات وشهادات إضافية مسجّلة لديك في الأكاديمية المالية.',
    dated: (date) =>
      `مؤهلات وشهادات إضافية مسجّلة لديك في الأكاديمية المالية، بحسب آخر تحديث في ${date}.`,
    unnamed: 'بدون اسم',
    unknownInstitution: 'جهة غير محددة',
    editElsewhere: 'تُدار هذه السجلات في بوابة الأكاديمية المالية، ولا يمكن تعديلها من هنا.',
    contractsHeading: 'عقود التدريب في الأكاديمية',
    contractsNote:
      'هذه عقود مسجّلة لدى الأكاديمية المالية، وهي غير اتفاقية منصة الخبراء. ' +
      'تُعرض للاطلاع فقط، وتُدار من بوابة الأكاديمية.',
    contractUnnamed: 'عقد بدون رقم',
    contractPeriod: (from, to) => `${from} — ${to}`,
  },
  services: getMyApplicationsContent('ar').services,
  specialties: getDirectoryContent('ar').specialties,
  classifications: getTrainerClassificationLabels('ar'),
};

const en: ProfileContent = {
  documentTitle: 'My profile — Expert Hub',
  title: 'My profile',
  subtitle: 'Review your accredited data and update the fields you are allowed to edit.',
  tabs: {
    overview: 'Overview',
    services: 'Services & specialties',
    programs: 'Programs',
    ratings: 'Ratings',
    visibility: 'Public visibility',
  },
  header: {
    classificationLabel: 'Classification',
    emailLabel: 'Email',
    ratingAria: (score) => `Overall rating: ${score} out of 5`,
    reviewsScore: (score) => `${score} out of 5`,
    noRating: 'Not rated yet',
    notAccredited: 'Not accredited yet',
    notAccreditedTitle: 'Your Expert Hub accreditation is not complete',
    notAccreditedBody:
      'Your trainer access comes from the Academy’s own record; Expert Hub’s ' +
      'accreditation has not been completed. The fields filled in below come ' +
      'from that record, and whatever is still empty is what this platform ' +
      'needs.',
  },
  fields: {
    heading: 'Your details',
    description:
      'These are the same fields as your application. Update what you own and save directly — no resubmission and no new approval cycle is triggered.',
    save: 'Save changes',
    saved: 'Your changes were saved.',
    sourceLabel: 'Source: official system',
    lastSync: (date) => `Last synced: ${date}`,
    requestChange: 'Request a change',
    pendingChange: (value) => `Change pending approval: ${value}`,
    unavailableTitle: 'Could not load the accredited data',
    unavailableBody:
      'The last known data is shown. It may not reflect the latest update until the connection returns.',
    lockReasons: {
      classification: 'Set at accreditation',
      evaluation: 'Calculated automatically',
      agreement: 'From the agreement',
      'not-accredited': 'Completed at accreditation',
      'from-academy': 'From the Academy’s record',
    },
  },
  lockedFacts: {
    heading: 'Non-editable data',
    description: 'These are updated automatically from their source and cannot be edited here.',
    classificationLabel: 'Classification',
    evaluationLabel: 'Overall evaluation',
    evaluationPending: 'Not calculated yet',
    agreementLabel: 'Agreement status',
    agreementStatuses: {
      active: 'Active',
      suspended: 'Suspended',
      expired: 'Expired',
      ended: 'Ended',
    },
    agreementEndsAt: (date) => `Ends on ${date}`,
    agreementNone: 'No agreement yet',
  },
  certificates: {
    heading: 'Certificates',
    description: 'Add your professional certificates to support your profile.',
    empty: 'No certificates added.',
    uploadLabel: 'Add a certificate',
    uploadHint: (formats, maxSizeMb) => `Accepted formats: ${formats} — up to ${maxSizeMb} MB.`,
    browseLabel: 'Choose a file',
    removeLabel: 'Remove',
    uploaded: 'Certificate added.',
    removed: 'Certificate removed.',
    formatError: (formats) => `File format not accepted. Allowed: ${formats}.`,
    sizeError: (maxSizeMb) => `The file exceeds the maximum size (${maxSizeMb} MB).`,
    refused:
      'The file was refused: it does not meet the professional-certificate rule (format or size).',
    emptyFile: 'The file is empty. Choose another file.',
    noProfile: 'There is no trainer profile to add the certificate to yet.',
    ruleUnavailable:
      'The certificate could not be added: the professional-certificate attachment rule is not available for your application. Contact the trainer-management team.',
    failed: 'The certificate could not be uploaded. Please try again.',
  },
  scope: {
    heading: 'Approved scope',
    servicesHeading: 'Approved services',
    specialtiesHeading: 'Areas of specialty',
    empty: 'No approved scope yet.',
  },
  programs: {
    heading: 'Program history',
    empty: 'No programs recorded yet.',
  },
  ratings: {
    heading: 'Ratings',
    overallHeading: 'Overall rating',
    perProgramHeading: 'Rating by program',
    outOf: (score) => `${score} out of 5`,
    ratingAria: (label, score) => `${label}: ${score} out of 5`,
    lastRefreshed: (date) => `Last updated: ${date}`,
    pending: 'Your rating is being calculated and will appear soon.',
    unavailable: 'Your rating is currently unavailable.',
    empty: 'No ratings yet.',
  },
  bio: {
    heading: 'Short bio',
    description:
      'A short bio of you, shown on your public directory profile once the trainer management team approves it, if your profile is visible.',
    label: 'Bio text',
    helper:
      'Two to three sentences on your field of expertise, your qualifications and the training or consulting you deliver.',
    draftFromCv: 'Suggest a bio from my CV',
    submit: 'Submit for review',
    submitted: 'Your bio was sent to the trainer management team for review.',
    draftRequested: 'We are drafting a bio from your CV.',
    status: {
      none: 'No bio',
      drafting: 'Drafting',
      ai_draft: 'Suggested draft',
      ai_unavailable: 'Draft unavailable',
      pending_review: 'Under review',
      returned: 'Returned for changes',
      approved: 'Approved',
    },
    draftingBody:
      'We are drafting a bio from your CV; this can take a few minutes. Refresh this section later, or write the bio yourself now.',
    refresh: 'Refresh',
    aiDraftBody:
      'This draft was suggested from your CV. Review and edit it before you submit it; nothing is published before it is approved.',
    aiUnavailableBody: 'We could not draft a bio from your CV. Please write it yourself.',
    aiOff: 'Suggesting a bio from your CV is not available yet. Please write it yourself.',
    noCv: 'Your application has no CV to suggest a bio from. Please write it yourself.',
    pendingBody:
      'Your bio is being reviewed by the trainer management team. You can edit and resubmit it before then.',
    returnedTitle: 'Your bio was returned for changes',
    publishedLabel: 'Approved bio',
    publishedWhileReview: 'Your approved bio stays visible until the edit is approved.',
    lengthError: (max) => `Keep the bio within ${max} characters.`,
    conflict: 'Your bio changed since this page opened. Refresh the section and try again.',
    failed: 'Your bio could not be saved. Please try again.',
  },
  visibility: {
    heading: 'Visibility in the public directory',
    description:
      'When enabled, your profile appears in the public expert directory. Visitors will see: your name, field, short bio (once approved), programmes delivered with the Academy, personal photo and classification. The change takes effect immediately.',
    toggleLabel: 'Show my profile in the public directory',
    toggleOnDescription: 'Your profile is currently visible in the public directory.',
    on: 'Visible',
    off: 'Hidden',
  },
  bankData: {
    heading: 'Bank data',
    requestedTitle: 'Preliminary approval — please complete your bank data',
    requestedBody:
      'Your application received preliminary approval. Complete the bank data below so the Academy can prepare your agreement. Every field is required.',
    completeTitle: 'Your bank data is complete',
    completeBody: 'Your bank details are saved. Agreement preparation can now begin.',
    completedAt: (date) => `Saved on ${date}`,
    prefilledTitle: 'We filled these in from your Financial Academy record',
    prefilledBody:
      'Check them and correct anything that has changed before saving. Nothing is submitted until you confirm.',
    fields: {
      bankCountry: 'Bank country',
      bankCity: 'Bank city',
      bankName: 'Bank name',
      branchName: 'Branch name',
      iban: 'IBAN',
      swiftCode: 'SWIFT code',
      accountHolderName: 'Name on the bank card',
      accountNumber: 'Account number',
    },
    requiredError: 'This field is required.',
    formatErrors: {
      iban: 'Enter a Saudi IBAN: "SA" followed by 22 digits (24 characters).',
      swiftCode:
        'Enter an 8- or 11-character SWIFT code: 4-letter bank, 2-letter country, 2-character location, and an optional 3-character branch.',
      accountNumber: 'Enter the account number using digits only.',
    },
    errorsHeading: 'Complete the following fields',
    save: 'Save bank data',
    savedToast: 'Your bank data was saved.',
  },
  requestModal: {
    title: (field) => `Request change: ${field}`,
    inputLabel: (field) => `New value for ${field}`,
    hint: 'Your request will be reviewed by the competent authority; the current value stays shown until it is confirmed.',
    submit: 'Submit request',
    cancel: 'Cancel',
    dismiss: 'Close',
    submitted: 'Your change request was submitted and is pending confirmation.',
  },
  consentModal: {
    title: 'Confirm visibility change',
    enableBody: 'Your profile will appear in the public directory immediately. Continue?',
    disableBody: 'Your profile will be hidden from the public directory immediately. Continue?',
    confirm: 'Confirm',
    cancel: 'Cancel',
    dismiss: 'Close',
    enabled: 'Your profile is now visible in the public directory.',
    disabled: 'Your profile has been hidden from the public directory.',
  },
  errors: {
    loadTitle: 'Could not load your profile',
    loadBody: 'Something went wrong while loading your profile. Please try again.',
    retry: 'Try again',
    sessionTitle: 'Session expired',
    sessionBody: 'Your session has expired. Please log in again to continue.',
    actionFailed: 'The action could not be completed. Please try again.',
    homeLabel: 'Back to My applications',
  },
  academyRecords: {
    heading: 'Also on the Academy’s record',
    description: 'Further qualifications and certifications the Financial Academy holds for you.',
    dated: (date) =>
      `Further qualifications and certifications the Financial Academy holds for you, as of ${date}.`,
    unnamed: 'Unnamed',
    unknownInstitution: 'Institution not recorded',
    editElsewhere:
      'These are maintained in the Financial Academy’s own portal and cannot be changed here.',
    contractsHeading: 'Academy training contracts',
    contractsNote:
      'These are contracts held by the Financial Academy. They are not the ' +
      'Expert Hub agreement. Shown for reference only and managed in the ' +
      'Academy’s own portal.',
    contractUnnamed: 'Contract without a reference',
    contractPeriod: (from, to) => `${from} — ${to}`,
  },
  services: getMyApplicationsContent('en').services,
  specialties: getDirectoryContent('en').specialties,
  classifications: getTrainerClassificationLabels('en'),
};

const CONTENT: Record<Locale, ProfileContent> = { ar, en };

export function getProfileContent(locale: Locale): ProfileContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
