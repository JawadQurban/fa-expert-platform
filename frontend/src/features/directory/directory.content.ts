import type { Locale } from '@/types';
import type { DirectorySpecialty, TrainerClassification } from './directory.types';
import { arNumber } from '../../shared/formatting';

/**
 * EH-PUB-02 / EH-PUB-03 (Public Trainer Directory + Profile) copy — Arabic
 * authoritative, English best-effort. The page/components render structure only;
 * all human-readable strings live here.
 *
 * Specialty labels are the display side of the **mock taxonomy**
 * (`directory.types.ts`) — representative demo values, not the approved public
 * whitelist (`G12`).
 *
 * The classification, bio, evaluation and "by the numbers" copy was removed on
 * 2026-08-19: J-24/F2/AC-1 enumerates the public fields exhaustively, so no
 * public string may exist for anything outside it (`DECISIONS.md` P-40/P-41).
 * The classification *labels* survive as a standalone export because the
 * trainer's own profile and the portal home render them privately — they are
 * deliberately no longer reachable from a public content object.
 */

export interface DirectoryContent {
  readonly documentTitle: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  /** Hero highlight figures — derived counts over **public** fields only. */
  readonly stats: {
    readonly experts: string;
    readonly specialties: string;
    readonly programs: string;
  };
  readonly resultsCount: (shown: number, total: number) => string;
  readonly filters: {
    readonly regionLabel: string;
    readonly searchLabel: string;
    readonly searchPlaceholder: string;
    readonly clear: string;
  };
  readonly card: {
    readonly viewProfile: (name: string) => string;
    readonly specialtiesLabel: string;
    readonly cityLabel: string;
    readonly programsLabel: string;
    readonly viewProfileShort: string;
  };
  readonly classifications: Readonly<Record<TrainerClassification, string>>;
  readonly resultsLabel: string;
  readonly empty: {
    readonly title: string;
    readonly body: string;
  };
  readonly errors: {
    readonly loadTitle: string;
    readonly loadBody: string;
    readonly retry: string;
  };
  readonly pagination: {
    readonly label: string;
    readonly previous: string;
    readonly next: string;
  };
  readonly specialties: Readonly<Record<DirectorySpecialty, string>>;
}

/** EH-PUB-03 — the single public profile page. */
export interface PublicProfileContent {
  readonly documentTitle: (name: string) => string;
  readonly breadcrumbLabel: string;
  readonly breadcrumbDirectory: string;
  readonly specialtiesLabel: string;
  readonly backToDirectory: string;
  /** `P-331` — the trainer's approved short bio. */
  readonly bioHeading: string;
  /** Programs delivered with the Academy — the last field J-24/F2/AC-1 allows. */
  readonly programs: {
    readonly heading: string;
    readonly empty: string;
  };
  /** Neutral "not available" — never reveals whether the trainer exists but
   *  withheld consent (`BR-1007`, privacy). */
  readonly notFound: {
    readonly title: string;
    readonly body: string;
  };
  readonly errors: {
    readonly loadTitle: string;
    readonly loadBody: string;
    readonly retry: string;
  };
  readonly specialties: Readonly<Record<DirectorySpecialty, string>>;
}

const SPECIALTIES_AR: Record<DirectorySpecialty, string> = {
  leadership: 'القيادة والإدارة',
  finance: 'المالية والمحاسبة',
  'digital-transformation': 'التحول الرقمي',
  'data-analytics': 'تحليل البيانات',
  'human-resources': 'الموارد البشرية',
  'project-management': 'إدارة المشاريع',
  cybersecurity: 'الأمن السيبراني',
  'customer-experience': 'تجربة العميل',
};

const SPECIALTIES_EN: Record<DirectorySpecialty, string> = {
  leadership: 'Leadership & Management',
  finance: 'Finance & Accounting',
  'digital-transformation': 'Digital Transformation',
  'data-analytics': 'Data Analytics',
  'human-resources': 'Human Resources',
  'project-management': 'Project Management',
  cybersecurity: 'Cybersecurity',
  'customer-experience': 'Customer Experience',
};

/**
 * Classification labels. **Not public** — J-24/F2/AC-1 omits classification from
 * the public profile, so these are exported on their own rather than hanging off
 * `DirectoryContent`. Consumed by the trainer's own profile (EH-TP-04) and the
 * portal home, which are authenticated, trainer-private surfaces.
 */
const CLASSIFICATIONS_AR: Record<TrainerClassification, string> = {
  expert: 'خبير معتمد',
  senior: 'مدرب أول',
  certified: 'مدرب معتمد',
};

const CLASSIFICATIONS_EN: Record<TrainerClassification, string> = {
  expert: 'Certified Expert',
  senior: 'Senior Trainer',
  certified: 'Certified Trainer',
};

const CLASSIFICATION_LABELS: Record<Locale, Record<TrainerClassification, string>> = {
  ar: CLASSIFICATIONS_AR,
  en: CLASSIFICATIONS_EN,
};

/** Private-surface classification labels — see the note on `CLASSIFICATIONS_AR`. */
export function getTrainerClassificationLabels(
  locale: Locale
): Readonly<Record<TrainerClassification, string>> {
  return CLASSIFICATION_LABELS[locale] ?? CLASSIFICATION_LABELS.ar;
}

const directoryAr: DirectoryContent = {
  documentTitle: 'دليل الخبراء والمدربين — منصة الخبراء',
  eyebrow: 'الدليل العام',
  title: 'دليل الخبراء والمدربين المعتمدين',
  description:
    'تصفّح نخبة الخبراء والمدربين المعتمدين الذين وافقوا على الظهور العام، وابحث عنهم بالاسم.',
  stats: {
    experts: 'خبيرًا ومدربًا معتمدًا',
    specialties: 'مجالات تخصص',
    programs: 'برنامجًا نُفِّذ مع الأكاديمية',
  },
  resultsCount: (shown, total) =>
    total === 0 ? 'لا توجد نتائج' : `عرض ${arNumber(shown)} من ${arNumber(total)}`,
  filters: {
    regionLabel: 'تصفية الدليل',
    searchLabel: 'بحث',
    searchPlaceholder: 'ابحث بالاسم',
    clear: 'مسح التصفية',
  },
  card: {
    viewProfile: (name) => `عرض الملف العام لـ${name}`,
    cityLabel: 'المدينة',
    programsLabel: 'البرامج',
    viewProfileShort: 'عرض الملف التعريفي',
    specialtiesLabel: 'مجالات التخصص',
  },
  classifications: getTrainerClassificationLabels('ar'),
  resultsLabel: 'نتائج الدليل',
  empty: {
    title: 'لا يوجد خبراء مطابقون',
    body: 'لم نعثر على خبراء يطابقون هذه التصفية. جرّب توسيع نطاق البحث.',
  },
  errors: {
    loadTitle: 'تعذّر تحميل الدليل',
    loadBody: 'حدث خطأ أثناء تحميل دليل الخبراء. يُرجى المحاولة مرة أخرى.',
    retry: 'إعادة المحاولة',
  },
  pagination: {
    label: 'تنقل بين صفحات الدليل',
    previous: 'السابق',
    next: 'التالي',
  },
  specialties: SPECIALTIES_AR,
};

const directoryEn: DirectoryContent = {
  documentTitle: 'Expert & Trainer Directory — Expert Hub',
  eyebrow: 'Public directory',
  title: 'Accredited Expert & Trainer Directory',
  description:
    'Browse accredited experts and trainers who consented to appear publicly, and search them by name.',
  stats: {
    experts: 'accredited experts & trainers',
    specialties: 'specialty areas',
    programs: 'programs delivered with the Academy',
  },
  resultsCount: (shown, total) => (total === 0 ? 'No results' : `Showing ${shown} of ${total}`),
  filters: {
    regionLabel: 'Filter the directory',
    searchLabel: 'Search',
    searchPlaceholder: 'Search by name',
    clear: 'Clear filters',
  },
  card: {
    viewProfile: (name) => `View the public profile of ${name}`,
    cityLabel: 'City',
    programsLabel: 'Programmes',
    viewProfileShort: 'View profile',
    specialtiesLabel: 'Areas of specialty',
  },
  classifications: getTrainerClassificationLabels('en'),
  resultsLabel: 'Directory results',
  empty: {
    title: 'No matching experts',
    body: 'We could not find experts matching this filter. Try broadening your search.',
  },
  errors: {
    loadTitle: 'Could not load the directory',
    loadBody: 'Something went wrong while loading the directory. Please try again.',
    retry: 'Try again',
  },
  pagination: {
    label: 'Directory pages',
    previous: 'Previous',
    next: 'Next',
  },
  specialties: SPECIALTIES_EN,
};

const profileAr: PublicProfileContent = {
  documentTitle: (name) => `${name} — دليل الخبراء والمدربين`,
  breadcrumbLabel: 'مسار التنقل',
  breadcrumbDirectory: 'دليل الخبراء والمدربين',
  specialtiesLabel: 'مجالات التخصص',
  backToDirectory: 'العودة إلى الدليل',
  bioHeading: 'نبذة مختصرة',
  programs: {
    heading: 'البرامج المنفَّذة مع الأكاديمية',
    empty: 'لم تُسجَّل بعد برامج منفَّذة مع الأكاديمية لهذا المدرب.',
  },
  notFound: {
    title: 'هذا الملف غير متاح',
    body: 'الملف الذي تبحث عنه غير متاح للعرض العام. يمكنك العودة إلى الدليل واستعراض الخبراء المتاحين.',
  },
  errors: {
    loadTitle: 'تعذّر تحميل الملف',
    loadBody: 'حدث خطأ أثناء تحميل الملف العام. يُرجى المحاولة مرة أخرى.',
    retry: 'إعادة المحاولة',
  },
  specialties: SPECIALTIES_AR,
};

const profileEn: PublicProfileContent = {
  documentTitle: (name) => `${name} — Expert & Trainer Directory`,
  breadcrumbLabel: 'Breadcrumb',
  breadcrumbDirectory: 'Expert & Trainer Directory',
  specialtiesLabel: 'Areas of specialty',
  backToDirectory: 'Back to the directory',
  bioHeading: 'Short bio',
  programs: {
    heading: 'Programs delivered with the Academy',
    empty: 'No programs delivered with the Academy have been recorded for this trainer yet.',
  },
  notFound: {
    title: 'This profile is not available',
    body: 'The profile you are looking for is not available for public view. You can return to the directory to browse available experts.',
  },
  errors: {
    loadTitle: 'Could not load the profile',
    loadBody: 'Something went wrong while loading the public profile. Please try again.',
    retry: 'Try again',
  },
  specialties: SPECIALTIES_EN,
};

const DIRECTORY_CONTENT: Record<Locale, DirectoryContent> = {
  ar: directoryAr,
  en: directoryEn,
};

const PROFILE_CONTENT: Record<Locale, PublicProfileContent> = {
  ar: profileAr,
  en: profileEn,
};

export function getDirectoryContent(locale: Locale): DirectoryContent {
  return DIRECTORY_CONTENT[locale] ?? DIRECTORY_CONTENT.ar;
}

export function getPublicProfileContent(locale: Locale): PublicProfileContent {
  return PROFILE_CONTENT[locale] ?? PROFILE_CONTENT.ar;
}
