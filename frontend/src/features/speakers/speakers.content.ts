import type { Locale } from '@/types';
import type { SpeakerTextField } from './speaker.types';
import { arNumber } from '../../shared/formatting';
import { getMyApplicationsContent } from '../applications/myApplications.content';

/**
 * EH-INT-11 (Speaker records, J-04) copy — Arabic authoritative, English
 * best-effort. Pages render structure only.
 *
 * The eleven field labels are the owner's "Speaker Record" matrix, verbatim and
 * in its order. The email and history wording is deliberately precise: both are
 * **not yet available from FAST**, which is not the same as "none", and a
 * sentence that blurred the two would be a false statement about the speaker.
 */

export interface SpeakersContent {
  /** The page-head action on the trainer database that opens this list. */
  readonly openLink: string;
  /** The tag that marks a speaker wherever one is listed — the approved
   *  service label, so a speaker is called the same thing everywhere. */
  readonly speakerTag: string;

  readonly list: {
    readonly documentTitle: string;
    readonly title: string;
    readonly description: string;
    readonly add: string;
    readonly resultsLabel: string;
    readonly resultsCount: (count: number) => string;
    readonly search: {
      readonly regionLabel: string;
      readonly label: string;
      readonly placeholder: string;
      readonly clear: string;
    };
    readonly columns: {
      readonly name: string;
      readonly title: string;
      readonly created: string;
    };
    /** A speaker with no title recorded. */
    readonly noTitle: string;
    readonly empty: { readonly title: string; readonly body: string };
    readonly noResults: { readonly title: string; readonly body: (search: string) => string };
    readonly pagination: {
      readonly label: string;
      readonly previous: string;
      readonly next: string;
    };
  };

  readonly detail: {
    readonly documentTitle: (name: string) => string;
    readonly breadcrumbLabel: string;
    readonly breadcrumbList: string;
    readonly edit: string;
    readonly createdOn: (date: string) => string;
    readonly updatedOn: (date: string) => string;
    readonly namesHeading: string;
    readonly nameArLabel: string;
    readonly nameEnLabel: string;
    readonly titleLabel: string;
    readonly notRecorded: string;
    readonly bioHeading: string;
    readonly bioEmpty: string;
    readonly contactHeading: string;
    readonly emailLabel: string;
    /** Owner ruling (2026-10-13) — read from FAST, which cannot serve it yet. */
    readonly emailPendingFast: string;
    readonly emailUnavailable: string;
    /** F3 — deferred until FAST links speakers to events. */
    readonly historyHeading: string;
    readonly historyPendingTitle: string;
    readonly historyPendingBody: string;
    /** Only when FAST HAS answered, with nothing. */
    readonly historyEmpty: string;
    readonly historyLabel: string;
    readonly historyColumns: {
      readonly event: string;
      readonly date: string;
      readonly role: string;
    };
  };

  readonly form: {
    readonly createDocumentTitle: string;
    readonly createTitle: string;
    readonly createLead: string;
    readonly editDocumentTitle: (name: string) => string;
    readonly editTitle: string;
    readonly editLead: (name: string) => string;
    /** AC-4 — the creation email is not sent yet, said once and plainly. */
    readonly emailNotice: string;
    readonly sections: {
      readonly identity: string;
      readonly arabicName: string;
      readonly englishName: string;
      readonly bio: string;
    };
    /** The matrix's eleven labels, in its order (row 1 is the photo). */
    readonly photoLabel: string;
    readonly fields: Readonly<Record<SpeakerTextField, string>>;
    readonly bioHint: (max: string) => string;
    readonly photo: {
      readonly hint: string;
      readonly browseLabel: string;
      readonly removeLabel: string;
      readonly current: string;
      readonly formatError: string;
      readonly sizeError: string;
      readonly refused: string;
      readonly forbidden: string;
      readonly failed: string;
      readonly invalid: string;
    };
    readonly errors: {
      readonly summaryTitle: string;
      readonly required: (label: string) => string;
      readonly tooLong: (label: string, max: string) => string;
      readonly saveFailed: string;
      readonly duplicate: string;
      readonly saveAnyway: string;
    };
    readonly create: string;
    readonly save: string;
    readonly cancel: string;
    readonly unsaved: {
      readonly title: string;
      readonly body: string;
      readonly leaveLabel: string;
      readonly stayLabel: string;
      readonly dismissLabel: string;
    };
  };

  readonly success: {
    readonly created: string;
    readonly updated: string;
  };

  readonly errors: {
    readonly loadTitle: string;
    readonly loadBody: string;
    readonly detailLoadTitle: string;
    readonly detailLoadBody: string;
    readonly notFoundTitle: string;
    readonly notFoundBody: string;
    readonly retry: string;
    readonly backToList: string;
  };
}

function arSpeakers(count: number): string {
  if (count === 1) {
    return 'متحدث واحد';
  }
  if (count === 2) {
    return 'متحدثان';
  }
  return count >= 3 && count <= 10 ? `${arNumber(count)} متحدثين` : `${arNumber(count)} متحدثًا`;
}

const ar: SpeakersContent = {
  openLink: 'سجل المتحدثين',
  speakerTag: getMyApplicationsContent('ar').services.speaker,

  list: {
    documentTitle: 'سجل المتحدثين — منصة الخبراء',
    title: 'سجل المتحدثين',
    description:
      'سجلات المتحدثين الذين تستضيفهم الأكاديمية. المتحدث لا يُصنَّف ولا يُقيَّم ولا يُتعاقد معه.',
    add: 'إضافة متحدث',
    resultsLabel: 'المتحدثون',
    resultsCount: arSpeakers,
    search: {
      regionLabel: 'البحث في سجل المتحدثين',
      label: 'بحث بالاسم أو الصفة',
      placeholder: 'اكتب اسم المتحدث أو صفته',
      clear: 'مسح البحث',
    },
    columns: {
      name: 'المتحدث',
      title: 'صفة المتحدث',
      created: 'تاريخ الإضافة',
    },
    noTitle: '—',
    empty: {
      title: 'لا يوجد متحدثون بعد',
      body: 'أضف أول متحدث ليظهر هنا وفي قاعدة المدربين.',
    },
    noResults: {
      title: 'لا توجد نتائج لهذا البحث',
      body: (search) => `لم نعثر على متحدث يطابق «${search}». جرّب اسمًا أو صفة أخرى.`,
    },
    pagination: {
      label: 'صفحات سجل المتحدثين',
      previous: 'الصفحة السابقة',
      next: 'الصفحة التالية',
    },
  },

  detail: {
    documentTitle: (name) => `${name} — سجل المتحدث`,
    breadcrumbLabel: 'مسار التنقل',
    breadcrumbList: 'سجل المتحدثين',
    edit: 'تعديل',
    createdOn: (date) => `أُضيف في ${date}`,
    updatedOn: (date) => `آخر تحديث ${date}`,
    namesHeading: 'بيانات المتحدث',
    nameArLabel: 'الاسم (بالعربية)',
    nameEnLabel: 'الاسم (بالإنجليزية)',
    titleLabel: 'صفة المتحدث',
    notRecorded: 'غير مسجّل',
    bioHeading: 'نبذة عن المتحدث',
    bioEmpty: 'لم تُضف نبذة بعد.',
    contactHeading: 'التواصل',
    emailLabel: 'البريد الإلكتروني',
    emailPendingFast: 'غير متاح بعد — يُقرأ من ملف المتحدث في نظام فاست (FAST) حين يُتيحه النظام.',
    emailUnavailable: 'غير متاح حاليًا.',
    historyHeading: 'سجل المشاركات',
    historyPendingTitle: 'سيظهر سجل المشاركات تلقائيًا',
    historyPendingBody:
      'يُبنى سجل مشاركات المتحدث من نظام فاست (FAST)، وسيظهر هنا تلقائيًا حين يربط النظام المتحدث بالفعاليات.',
    historyEmpty: 'لا توجد مشاركات مسجّلة في نظام فاست (FAST) لهذا المتحدث.',
    historyLabel: 'مشاركات المتحدث',
    historyColumns: {
      event: 'الفعالية',
      date: 'التاريخ',
      role: 'الدور',
    },
  },

  form: {
    createDocumentTitle: 'إضافة متحدث — منصة الخبراء',
    createTitle: 'إضافة متحدث',
    createLead: 'أنشئ سجلًا لمتحدث تستضيفه الأكاديمية. الاسم الأول والأخير بالعربية مطلوبان.',
    editDocumentTitle: (name) => `تعديل ${name} — سجل المتحدث`,
    editTitle: 'تعديل سجل المتحدث',
    editLead: (name) => `تعديل بيانات ${name}.`,
    emailNotice:
      'البريد الإلكتروني للمتحدث يُقرأ من ملفه في نظام فاست (FAST) ولا يُدخل هنا. ولأن النظام لا يُتيحه بعد، فلن تُرسل رسالة الإنشاء إلى المتحدث حاليًا.',
    sections: {
      identity: 'الصورة والصفة',
      arabicName: 'الاسم بالعربية',
      englishName: 'الاسم بالإنجليزية',
      bio: 'النبذة',
    },
    photoLabel: 'الصورة الشخصية',
    fields: {
      title: 'صفة المتحدث',
      firstNameAr: 'الاسم الأول (بالعربية)',
      middleNameAr: 'الاسم الثاني (بالعربية)',
      thirdNameAr: 'الاسم الثالث (بالعربية)',
      lastNameAr: 'الاسم الأخير (بالعربية)',
      firstNameEn: 'الاسم الأول (بالإنجليزية)',
      middleNameEn: 'الاسم الثاني (بالإنجليزية)',
      thirdNameEn: 'الاسم الثالث (بالإنجليزية)',
      lastNameEn: 'الاسم الأخير (بالإنجليزية)',
      bio: 'نبذة عن المتحدث',
    },
    bioHint: (max) => `${max} حرف كحد أقصى.`,
    photo: {
      hint: 'صيغة JPG أو PNG، بحجم لا يتجاوز 1 ميجابايت.',
      browseLabel: 'اختيار صورة',
      removeLabel: 'إزالة الصورة',
      current: 'الصورة الحالية',
      formatError: 'الصيغة غير مقبولة. استخدم JPG أو PNG.',
      sizeError: 'حجم الصورة أكبر من 1 ميجابايت.',
      refused: 'رُفضت الصورة: الصيغة أو الحجم غير مقبول.',
      forbidden: 'ليست لديك صلاحية رفع الملفات.',
      failed: 'تعذّر رفع الصورة. حاول مرة أخرى.',
      invalid: 'تعذّر ربط الصورة بالسجل. ارفعها من جديد.',
    },
    errors: {
      summaryTitle: 'يُرجى تصحيح ما يلي قبل الحفظ:',
      required: (label) => `${label}: هذا الحقل مطلوب.`,
      tooLong: (label, max) => `${label}: لا يتجاوز ${max} حرف.`,
      saveFailed: 'تعذّر حفظ سجل المتحدث. حاول مرة أخرى.',
      duplicate: 'يوجد سجل متحدث بنفس الاسم الأول والأخير. تأكد أنه ليس الشخص نفسه قبل الإضافة.',
      saveAnyway: 'إضافة على أي حال',
    },
    create: 'إضافة المتحدث',
    save: 'حفظ التعديلات',
    cancel: 'إلغاء',
    unsaved: {
      title: 'مغادرة دون حفظ؟',
      body: 'لديك تغييرات لم تُحفظ في سجل المتحدث. إذا غادرت الآن ستفقدها.',
      leaveLabel: 'المغادرة دون حفظ',
      stayLabel: 'البقاء في الصفحة',
      dismissLabel: 'إغلاق',
    },
  },

  success: {
    created: 'أُضيف المتحدث إلى السجل.',
    updated: 'حُفظت التعديلات على سجل المتحدث.',
  },

  errors: {
    loadTitle: 'تعذّر تحميل سجل المتحدثين',
    loadBody: 'حدث خطأ أثناء تحميل قائمة المتحدثين. يُرجى المحاولة مرة أخرى.',
    detailLoadTitle: 'تعذّر تحميل سجل المتحدث',
    detailLoadBody: 'حدث خطأ أثناء تحميل بيانات المتحدث. يُرجى المحاولة مرة أخرى.',
    notFoundTitle: 'المتحدث غير موجود',
    notFoundBody: 'تعذّر العثور على هذا المتحدث في السجل.',
    retry: 'إعادة المحاولة',
    backToList: 'العودة إلى سجل المتحدثين',
  },
};

const en: SpeakersContent = {
  openLink: 'Speaker records',
  speakerTag: getMyApplicationsContent('en').services.speaker,

  list: {
    documentTitle: 'Speaker records — Expert Hub',
    title: 'Speaker records',
    description:
      'Records of the speakers the Academy hosts. A speaker is never classified, evaluated or contracted.',
    add: 'Add speaker',
    resultsLabel: 'Speakers',
    resultsCount: (count) => (count === 1 ? '1 speaker' : `${count} speakers`),
    search: {
      regionLabel: 'Search the speaker records',
      label: 'Search by name or title',
      placeholder: 'Type a speaker’s name or title',
      clear: 'Clear search',
    },
    columns: {
      name: 'Speaker',
      title: 'Speaker title/role',
      created: 'Added on',
    },
    noTitle: '—',
    empty: {
      title: 'No speakers yet',
      body: 'Add the first speaker to see them here and in the trainer database.',
    },
    noResults: {
      title: 'No results for this search',
      body: (search) => `No speaker matches “${search}”. Try another name or title.`,
    },
    pagination: {
      label: 'Speaker record pages',
      previous: 'Previous page',
      next: 'Next page',
    },
  },

  detail: {
    documentTitle: (name) => `${name} — speaker record`,
    breadcrumbLabel: 'Breadcrumb',
    breadcrumbList: 'Speaker records',
    edit: 'Edit',
    createdOn: (date) => `Added on ${date}`,
    updatedOn: (date) => `Last updated ${date}`,
    namesHeading: 'Speaker details',
    nameArLabel: 'Name (Arabic)',
    nameEnLabel: 'Name (English)',
    titleLabel: 'Speaker title/role',
    notRecorded: 'Not recorded',
    bioHeading: 'Speaker bio',
    bioEmpty: 'No bio has been added yet.',
    contactHeading: 'Contact',
    emailLabel: 'Email',
    emailPendingFast:
      'Not available yet — read from the speaker’s FAST profile once FAST provides it.',
    emailUnavailable: 'Not available at the moment.',
    historyHeading: 'Participation history',
    historyPendingTitle: 'The participation history will appear automatically',
    historyPendingBody:
      'A speaker’s participation history comes from FAST, and it will appear here automatically once FAST links the speaker to events.',
    historyEmpty: 'FAST has no recorded participations for this speaker.',
    historyLabel: 'Speaker participations',
    historyColumns: {
      event: 'Event',
      date: 'Date',
      role: 'Role',
    },
  },

  form: {
    createDocumentTitle: 'Add speaker — Expert Hub',
    createTitle: 'Add speaker',
    createLead:
      'Create a record for a speaker the Academy hosts. The Arabic first and last names are required.',
    editDocumentTitle: (name) => `Edit ${name} — speaker record`,
    editTitle: 'Edit speaker record',
    editLead: (name) => `Edit the details of ${name}.`,
    emailNotice:
      'The speaker’s email is read from their FAST profile and is not entered here. Because FAST does not provide it yet, the creation email will not be sent to the speaker for now.',
    sections: {
      identity: 'Photo and title',
      arabicName: 'Name in Arabic',
      englishName: 'Name in English',
      bio: 'Bio',
    },
    photoLabel: 'Profile picture',
    fields: {
      title: 'Speaker title/role',
      firstNameAr: 'First name (Arabic)',
      middleNameAr: 'Second name (Arabic)',
      thirdNameAr: 'Third name (Arabic)',
      lastNameAr: 'Last name (Arabic)',
      firstNameEn: 'First name (English)',
      middleNameEn: 'Second name (English)',
      thirdNameEn: 'Third name (English)',
      lastNameEn: 'Last name (English)',
      bio: 'Speaker bio',
    },
    bioHint: (max) => `Up to ${max} characters.`,
    photo: {
      hint: 'JPG or PNG, no larger than 1 MB.',
      browseLabel: 'Choose a photo',
      removeLabel: 'Remove the photo',
      current: 'Current photo',
      formatError: 'Format not accepted. Use JPG or PNG.',
      sizeError: 'The photo is larger than 1 MB.',
      refused: 'The photo was refused: its format or size is not accepted.',
      forbidden: 'You do not have permission to upload files.',
      failed: 'The photo could not be uploaded. Please try again.',
      invalid: 'The photo could not be linked to the record. Upload it again.',
    },
    errors: {
      summaryTitle: 'Please correct the following before saving:',
      required: (label) => `${label}: this field is required.`,
      tooLong: (label, max) => `${label}: no more than ${max} characters.`,
      saveFailed: 'The speaker record could not be saved. Please try again.',
      duplicate:
        'A speaker with the same first and last name already exists. Make sure it is not the same person before adding.',
      saveAnyway: 'Add anyway',
    },
    create: 'Add the speaker',
    save: 'Save changes',
    cancel: 'Cancel',
    unsaved: {
      title: 'Leave without saving?',
      body: 'You have unsaved changes to this speaker record. If you leave now they will be lost.',
      leaveLabel: 'Leave without saving',
      stayLabel: 'Stay on this page',
      dismissLabel: 'Close',
    },
  },

  success: {
    created: 'The speaker was added to the records.',
    updated: 'Your changes to the speaker record were saved.',
  },

  errors: {
    loadTitle: 'Could not load the speaker records',
    loadBody: 'Something went wrong while loading the speakers. Please try again.',
    detailLoadTitle: 'Could not load the speaker record',
    detailLoadBody: 'Something went wrong while loading this speaker. Please try again.',
    notFoundTitle: 'Speaker not found',
    notFoundBody: 'We could not find this speaker in the records.',
    retry: 'Try again',
    backToList: 'Back to speaker records',
  },
};

const CONTENT: Record<Locale, SpeakersContent> = { ar, en };

export function getSpeakersContent(locale: Locale): SpeakersContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
