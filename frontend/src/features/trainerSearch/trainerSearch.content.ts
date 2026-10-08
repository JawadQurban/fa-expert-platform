import type { Locale } from '@/types';
import { getMyApplicationsContent } from '../applications/myApplications.content';
import {
  getDirectoryContent,
  getTrainerClassificationLabels,
} from '../directory/directory.content';
import { getAgreementLifecycleContent } from '../agreementLifecycle/agreementLifecycle.content';
import type { TrainerFileStatus } from './trainerSearch.types';
import { arNumber } from '../../shared/formatting';

/**
 * EH-INT-07 / EH-INT-08 (Trainer Search & Unified Profile) copy — Arabic
 * authoritative, English best-effort.
 *
 * Service, specialty, classification and agreement-status labels are all reused
 * from their single approved sources, so one trainer is described with the same
 * words on the internal profile, their own profile, the public directory and the
 * agreements screen.
 *
 * The **file-status** labels are new and internal-only. *Idle* is worded as a
 * monitoring signal rather than a restriction, because J-13 is explicit that it
 * has "no effect on matching eligibility" — a label like "inactive" would invite
 * staff to treat it as one.
 */

export interface TrainerSearchContent {
  readonly documentTitle: string;
  readonly title: string;
  readonly description: string;
  /** J-15 scope — this is oversight, not candidate selection (that is J-17). */
  readonly scopeNote: string;
  readonly resultsLabel: string;
  readonly resultsCount: (count: number) => string;
  readonly filters: {
    readonly regionLabel: string;
    readonly searchLabel: string;
    readonly searchPlaceholder: string;
    readonly serviceLabel: string;
    readonly fileStatusLabel: string;
    readonly minCertificationsLabel: string;
    readonly allOption: string;
    /** Introduces the row of currently-applied filters. */
    readonly activeHeading: string;
    /** Accessible name for a chip's remove control. */
    readonly removeFilter: (label: string, value: string) => string;
    /** A numeric floor, worded — «٣ فأكثر». */
    readonly atLeast: (value: string) => string;
    readonly clear: string;
  };
  readonly columns: {
    readonly name: string;
    readonly services: string;
    readonly specialties: string;
    readonly fileStatus: string;
    readonly evaluation: string;
    readonly experience: string;
  };
  readonly fileStatuses: Readonly<Record<TrainerFileStatus, string>>;
  /** J-13 — *Idle* is a monitoring signal, not an eligibility restriction. */
  readonly idleNote: string;
  readonly notEvaluated: string;
  /** «—» when unknown — the API has no numeric years source. */
  readonly yearsValue: (years: number | null) => string;
  readonly empty: { readonly title: string; readonly body: string };

  readonly profile: {
    readonly documentTitle: (name: string) => string;
    readonly breadcrumbLabel: string;
    readonly breadcrumbSearch: string;
    readonly personalHeading: string;
    /** `P-331` — the approved short bio. */
    readonly bioHeading: string;
    readonly emailLabel: string;
    readonly phoneLabel: string;
    readonly cityLabel: string;
    readonly classificationLabel: string;
    readonly experienceLabel: string;
    readonly qualificationLabel: string;
    readonly certificationsHeading: string;
    readonly servicesLabel: string;
    readonly specialtiesLabel: string;
    readonly fileStatusLabel: string;
    readonly recordHeading: string;
    readonly recordEmpty: string;
    readonly recordEntry: (role: string, year: string) => string;
    readonly evaluationHeading: string;
    /** AC-1 asks for the last sync date explicitly. */
    readonly evaluationSynced: (date: string) => string;
    readonly evaluationNeverSynced: string;
    readonly agreementHeading: string;
    readonly agreementNone: string;
    readonly agreementTerm: (start: string, end: string) => string;
  };

  /** F2 — the Identity Card. */
  readonly identityCard: {
    readonly heading: string;
    readonly description: string;
    /** The inner panel's four groups (Notion, 2026-09-29). */
    readonly sections: {
      readonly overview: string;
      readonly experience: string;
      readonly academic: string;
      readonly relatedFields: string;
    };
    readonly fields: {
      readonly photo: string;
      readonly name: string;
      readonly sector: string;
      readonly participationTypes: string;
      readonly experience: string;
      readonly recentRoles: string;
      readonly academicQualifications: string;
      readonly relatedFields: string;
      readonly certifications: string;
      readonly socialAccounts: string;
    };
    /** A role still held. */
    readonly current: string;
    /** ⚠️ `Q19` — two matrix rows have no source field yet. */
    readonly missingSource: string;
    readonly missingList: (fields: string) => string;
    readonly export: string;
    /** `G26` — no document generation, and no approved template here. */
    readonly exportUnavailable: string;
  };

  readonly errors: {
    readonly loadTitle: string;
    readonly loadBody: string;
    readonly notFoundTitle: string;
    readonly notFoundBody: string;
    readonly retry: string;
    readonly backToSearch: string;
  };

  readonly services: ReturnType<typeof getMyApplicationsContent>['services'];
  readonly specialties: ReturnType<typeof getDirectoryContent>['specialties'];
  readonly classifications: ReturnType<typeof getTrainerClassificationLabels>;
  readonly agreementStatuses: ReturnType<typeof getAgreementLifecycleContent>['statuses'];
}

const ar: TrainerSearchContent = {
  documentTitle: 'قاعدة المدربين — منصة الخبراء',
  title: 'قاعدة المدربين',
  description: 'ابحث في قاعدة المدربين المعتمدين واستعرض الملف الشامل لكل مدرب.',
  scopeNote:
    'هذه الشاشة للاستعراض والمتابعة. ترشيح المدربين لارتباط أو فعالية محدّدة يتم في مسار الإسناد، لا من هنا.',
  resultsLabel: 'نتائج البحث',
  resultsCount: (count) => (count === 1 ? 'مدرب واحد' : `${arNumber(count)} مدربًا`),
  filters: {
    regionLabel: 'تصفية قاعدة المدربين',
    searchLabel: 'بحث بالاسم',
    searchPlaceholder: 'اكتب اسم المدرب',
    serviceLabel: 'الخدمة',
    fileStatusLabel: 'حالة الملف',
    minCertificationsLabel: 'الحد الأدنى لعدد الشهادات',
    allOption: 'الكل',
    activeHeading: 'التصفية النشطة:',
    removeFilter: (label, value) => `أزل تصفية ${label}: ${value}`,
    atLeast: (value) => `${value} فأكثر`,
    clear: 'مسح التصفية',
  },
  columns: {
    name: 'المدرب',
    services: 'الخدمات',
    specialties: 'التخصصات',
    fileStatus: 'حالة الملف',
    evaluation: 'التقييم',
    experience: 'الخبرة',
  },
  fileStatuses: {
    active: 'نشط',
    idle: 'دون ارتباطات حديثة',
    suspended: 'موقوف',
    expired: 'منتهي',
  },
  idleNote: 'حالة «دون ارتباطات حديثة» للمتابعة فقط، ولا أثر لها على أهلية المدرب للترشيح.',
  notEvaluated: 'لم يُقيَّم بعد',
  yearsValue: (years) =>
    years == null ? '—' : years === 1 ? 'سنة واحدة' : `${arNumber(years)} سنة`,
  empty: {
    title: 'لا يوجد مدربون مطابقون',
    body: 'لم نعثر على مدربين يطابقون هذه التصفية. جرّب توسيع نطاق البحث.',
  },

  profile: {
    documentTitle: (name) => `${name} — الملف الشامل`,
    breadcrumbLabel: 'مسار التنقل',
    breadcrumbSearch: 'قاعدة المدربين',
    personalHeading: 'البيانات الشخصية',
    bioHeading: 'النبذة المختصرة المعتمدة',
    emailLabel: 'البريد الإلكتروني',
    phoneLabel: 'رقم الجوال',
    cityLabel: 'المدينة',
    classificationLabel: 'التصنيف',
    experienceLabel: 'سنوات الخبرة',
    qualificationLabel: 'المؤهل العلمي',
    certificationsHeading: 'الشهادات والعضويات المهنية',
    servicesLabel: 'الخدمات المعتمدة',
    specialtiesLabel: 'مجالات التخصص',
    fileStatusLabel: 'حالة الملف',
    recordHeading: 'السجل مع الأكاديمية',
    recordEmpty: 'لا توجد برامج أو مشاركات مسجّلة بعد.',
    recordEntry: (role, year) => `${role} — ${year}`,
    evaluationHeading: 'التقييم',
    evaluationSynced: (date) => `آخر مزامنة للتقييم: ${date}`,
    evaluationNeverSynced: 'لم تجرِ مزامنة للتقييم بعد.',
    agreementHeading: 'الاتفاقية',
    agreementNone: 'لا توجد اتفاقية مرتبطة.',
    agreementTerm: (start, end) => `من ${start} إلى ${end}`,
  },

  identityCard: {
    heading: 'البطاقة التعريفية',
    description:
      'بطاقة تُبنى من بيانات ملف المدرب وفق النموذج المعتمد، دون أي محتوى أو صياغة إضافية.',
    sections: {
      overview: 'نبذة عامة',
      experience: 'الخبرات',
      academic: 'المؤهلات الأكاديمية',
      relatedFields: 'المجالات ذات العلاقة',
    },
    fields: {
      photo: 'الصورة الشخصية',
      name: 'الاسم',
      sector: 'المجال',
      participationTypes: 'نوعية الأنشطة والمشاركات',
      experience: 'عدد سنوات الخبرة',
      recentRoles: 'أبرز الخبرات الأخيرة',
      academicQualifications: 'الشهادة / الجامعة / السنة',
      relatedFields: 'المجالات',
      certifications: 'الشهادات المهنية',
      socialAccounts: 'حساب LinkedIn',
    },
    current: 'حتى الآن',
    missingSource: 'لا يوجد مصدر لهذا الحقل في ملف المدرب حتى الآن.',
    missingList: (fields) => `حقول بلا مصدر في النظام: ${fields}.`,
    export: 'تصدير البطاقة (PDF)',
    exportUnavailable:
      'تصدير البطاقة كملف PDF غير متاح حاليًا: نموذج التصميم المعتمد وخدمة إنشاء المستندات لم يُربطا بعد.',
  },

  errors: {
    loadTitle: 'تعذّر تحميل قاعدة المدربين',
    loadBody: 'حدث خطأ أثناء التحميل. يُرجى المحاولة مرة أخرى.',
    notFoundTitle: 'المدرب غير موجود',
    notFoundBody: 'تعذّر العثور على هذا المدرب.',
    retry: 'إعادة المحاولة',
    backToSearch: 'العودة إلى قاعدة المدربين',
  },

  services: getMyApplicationsContent('ar').services,
  specialties: getDirectoryContent('ar').specialties,
  classifications: getTrainerClassificationLabels('ar'),
  agreementStatuses: getAgreementLifecycleContent('ar').statuses,
};

const en: TrainerSearchContent = {
  documentTitle: 'Trainer database — Expert Hub',
  title: 'Trainer database',
  description: 'Search the accredited trainer base and review each trainer’s unified profile.',
  scopeNote:
    'This screen is for browsing and monitoring. Sourcing trainers for a specific assignment or event happens in the assignment flow, not here.',
  resultsLabel: 'Search results',
  resultsCount: (count) => (count === 1 ? '1 trainer' : `${count} trainers`),
  filters: {
    regionLabel: 'Filter the trainer database',
    searchLabel: 'Search by name',
    searchPlaceholder: 'Type a trainer name',
    serviceLabel: 'Service',
    fileStatusLabel: 'File status',
    minCertificationsLabel: 'Minimum certifications',
    allOption: 'All',
    activeHeading: 'Active filters:',
    removeFilter: (label, value) => `Remove ${label} filter: ${value}`,
    atLeast: (value) => `${value} or more`,
    clear: 'Clear filters',
  },
  columns: {
    name: 'Trainer',
    services: 'Services',
    specialties: 'Specialties',
    fileStatus: 'File status',
    evaluation: 'Evaluation',
    experience: 'Experience',
  },
  fileStatuses: {
    active: 'Active',
    idle: 'No recent engagements',
    suspended: 'Suspended',
    expired: 'Expired',
  },
  idleNote:
    '“No recent engagements” is a monitoring signal only — it has no effect on the trainer’s eligibility for nomination.',
  notEvaluated: 'Not evaluated yet',
  yearsValue: (years) => (years == null ? '—' : years === 1 ? '1 year' : `${years} years`),
  empty: {
    title: 'No matching trainers',
    body: 'No trainers match this filter. Try broadening your search.',
  },

  profile: {
    documentTitle: (name) => `${name} — unified profile`,
    breadcrumbLabel: 'Breadcrumb',
    breadcrumbSearch: 'Trainer database',
    personalHeading: 'Personal details',
    bioHeading: 'Approved short bio',
    emailLabel: 'Email',
    phoneLabel: 'Mobile',
    cityLabel: 'City',
    classificationLabel: 'Classification',
    experienceLabel: 'Years of experience',
    qualificationLabel: 'Academic qualification',
    certificationsHeading: 'Certifications & professional memberships',
    servicesLabel: 'Approved services',
    specialtiesLabel: 'Specialties',
    fileStatusLabel: 'File status',
    recordHeading: 'Record with the Academy',
    recordEmpty: 'No programmes or participations recorded yet.',
    recordEntry: (role, year) => `${role} — ${year}`,
    evaluationHeading: 'Evaluation',
    evaluationSynced: (date) => `Evaluation last synced: ${date}`,
    evaluationNeverSynced: 'The evaluation has never been synced.',
    agreementHeading: 'Agreement',
    agreementNone: 'No linked agreement.',
    agreementTerm: (start, end) => `${start} to ${end}`,
  },

  identityCard: {
    heading: 'Identity card',
    description:
      'A card built from the trainer’s profile fields in the approved template, with no additional content or custom wording.',
    sections: {
      overview: 'Overview',
      experience: 'Experience',
      academic: 'Academic qualifications',
      relatedFields: 'Related fields',
    },
    fields: {
      photo: 'Photo',
      name: 'Name',
      sector: 'Sector',
      participationTypes: 'Activities and participation',
      experience: 'Years of experience',
      recentRoles: 'Most recent roles',
      academicQualifications: 'Degree / university / year',
      relatedFields: 'Fields',
      certifications: 'Professional certificates',
      socialAccounts: 'LinkedIn',
    },
    current: 'present',
    missingSource: 'There is no source for this field in the trainer profile yet.',
    missingList: (fields) => `Fields with no source in the system: ${fields}.`,
    export: 'Export the card (PDF)',
    exportUnavailable:
      'PDF export is not available yet: the approved design template and the document-generation service are not wired up.',
  },

  errors: {
    loadTitle: 'Could not load the trainer database',
    loadBody: 'Something went wrong while loading. Please try again.',
    notFoundTitle: 'Trainer not found',
    notFoundBody: 'We could not find this trainer.',
    retry: 'Try again',
    backToSearch: 'Back to the trainer database',
  },

  services: getMyApplicationsContent('en').services,
  specialties: getDirectoryContent('en').specialties,
  classifications: getTrainerClassificationLabels('en'),
  agreementStatuses: getAgreementLifecycleContent('en').statuses,
};

const CONTENT: Record<Locale, TrainerSearchContent> = { ar, en };

export function getTrainerSearchContent(locale: Locale): TrainerSearchContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
