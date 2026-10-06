import type { Locale } from '@/types';
import type { TrainerClassification } from '../directory/directory.types';
import { getTrainerClassificationLabels } from '../directory/directory.content';
import { arNumber, formatNumber } from '../../shared/formatting';

/**
 * EH-TP-01 (Portal Home) copy — Arabic authoritative, English best-effort. The
 * page/components render structure only. Classification labels are reused from
 * `directory.content` (single source).
 */
export interface HomeContent {
  readonly documentTitle: string;
  readonly eyebrow: string;
  readonly greeting: (name: string) => string;
  readonly subtitle: string;
  readonly summaryLine: (inProgress: number) => string;
  readonly primaryCta: string;
  readonly metricsLabel: string;
  readonly metrics: {
    readonly total: string;
    readonly inProgress: string;
    readonly approved: string;
    readonly programs: string;
  };
  readonly rating: {
    readonly heading: string;
    readonly ariaLabel: (score: number) => string;
    readonly outOf: (score: number) => string;
    readonly lastRefreshed: (date: string) => string;
    readonly pending: string;
    readonly unavailable: string;
    readonly notRated: string;
  };
  readonly visibility: {
    readonly heading: string;
    readonly on: string;
    readonly off: string;
    readonly manage: string;
  };
  readonly shortcuts: {
    readonly heading: string;
    readonly applicationsTitle: string;
    readonly applicationsDesc: string;
    readonly newApplicationTitle: string;
    readonly newApplicationDesc: string;
    readonly profileTitle: string;
    readonly profileDesc: string;
    /** J-18/F3/AC-2 — the dashboard entry into "My Engagements". */
    readonly engagementsTitle: string;
    readonly engagementsDesc: string;
    readonly directoryTitle: string;
    readonly directoryDesc: string;
  };
  readonly notifications: {
    readonly heading: string;
    readonly empty: string;
    readonly unread: string;
    readonly at: (date: string) => string;
  };
  readonly empty: {
    readonly title: string;
    readonly body: string;
    readonly cta: string;
  };
  /** J-14 — the prompt a FAST-sourced trainer sees once per session. */
  readonly completeProfile: {
    readonly title: string;
    readonly body: string;
    readonly fromAcademy: string;
    readonly complete: string;
    readonly later: string;
  };
  readonly errors: {
    readonly loadTitle: string;
    readonly loadBody: string;
    readonly retry: string;
    readonly sessionTitle: string;
    readonly sessionBody: string;
  };
  readonly classifications: Readonly<Record<TrainerClassification, string>>;
  /**
   * Shown in place of a classification by somebody who is not a trainer — the
   * baseline role, named. Never «مدرب معتمد», which is what the portal used to
   * call people who had never applied.
   */
  readonly individualStanding: string;
  /**
   * The two figures in the identity band. Worded in full because they stand
   * alone up there — «قيد المعالجة» beside a number says «in progress», but
   * not what is.
   */
  readonly band: {
    readonly inProgress: string;
    readonly rating: string;
  };
}

const ar: HomeContent = {
  documentTitle: 'الرئيسية — منصة الخبراء والمدربين',
  eyebrow: 'مساحتي',
  greeting: (name) => `مرحبًا، ${name}`,
  subtitle: 'نظرة سريعة على حالتك وأهم إجراءاتك في مكان واحد.',
  summaryLine: (inProgress) =>
    inProgress === 0
      ? 'لا توجد طلبات قيد المعالجة حاليًا.'
      : `لديك ${arNumber(inProgress)} طلبًا قيد المعالجة.`,
  primaryCta: 'عرض طلباتي',
  metricsLabel: 'مؤشرات سريعة',
  metrics: {
    total: 'إجمالي الطلبات',
    inProgress: 'الطلبات قيد المعالجة',
    approved: 'الطلبات المعتمدة',
    programs: 'البرامج',
  },
  rating: {
    heading: 'تقييمي العام',
    ariaLabel: (score) => `التقييم العام: ${score} من 5`,
    outOf: (score) => `${score} من 5`,
    lastRefreshed: (date) => `آخر تحديث: ${date}`,
    pending: 'يجري احتساب تقييمك، وسيظهر قريبًا.',
    unavailable: 'التقييم غير متاح حاليًا.',
    notRated: 'لا يوجد تقييم بعد.',
  },
  visibility: {
    heading: 'الظهور في الدليل',
    on: 'ظاهر للعموم',
    off: 'غير ظاهر',
    manage: 'إدارة الظهور',
  },
  shortcuts: {
    heading: 'روابط سريعة',
    applicationsTitle: 'طلباتي',
    applicationsDesc: 'تابع حالة طلباتك وأكمل الإجراءات المطلوبة.',
    newApplicationTitle: 'تقديم طلب جديد',
    newApplicationDesc: 'ابدأ طلب انضمام جديدًا للخدمات المتاحة.',
    profileTitle: 'ملفي الشخصي',
    profileDesc: 'حدّث بياناتك واطّلع على نطاقك المعتمد.',
    engagementsTitle: 'ارتباطاتي',
    engagementsDesc: 'عروض الإسناد الواردة إليك وارتباطاتك المؤكَّدة.',
    directoryTitle: 'دليل الخبراء والمدربين',
    directoryDesc: 'تصفّح الخبراء المعتمدين الظاهرين للعموم.',
  },
  notifications: {
    heading: 'آخر الإشعارات',
    empty: 'لا توجد إشعارات جديدة.',
    unread: 'غير مقروء',
    at: (date) => date,
  },
  empty: {
    title: 'لا يوجد نشاط بعد',
    body: 'ابدأ رحلتك بتقديم طلب انضمام؛ ستظهر حالتك ومؤشراتك هنا فور توفرها.',
    cta: 'تقديم طلب جديد',
  },
  completeProfile: {
    title: 'أكمل بيانات ملفك',
    body:
      'صلاحيتك كمدرب جاءت من سجلك في الأكاديمية المالية، ولم تُستكمل بعد ' +
      'إجراءات الاعتماد في منصة الخبراء. أكمل الحقول الناقصة لتتمكن من ' +
      'التقديم على الخدمات.',
    fromAcademy:
      'ما هو موجود في سجل الأكاديمية — الاسم والمؤهلات والشهادات المهنية — ' +
      'معبّأ مسبقًا ولا يحتاج إلى إعادة إدخال.',
    complete: 'إكمال البيانات',
    later: 'لاحقًا',
  },
  errors: {
    loadTitle: 'تعذّر تحميل الصفحة',
    loadBody: 'حدث خطأ أثناء تحميل صفحتك الرئيسية. يُرجى المحاولة مرة أخرى.',
    retry: 'إعادة المحاولة',
    sessionTitle: 'انتهت الجلسة',
    sessionBody: 'انتهت جلستك. يُرجى تسجيل الدخول مرة أخرى للمتابعة.',
  },
  classifications: getTrainerClassificationLabels('ar'),
  // The role they actually hold, named as the Academy names it.
  individualStanding: 'مستخدم مسجل',
  band: {
    inProgress: 'طلبات قيد المعالجة',
    rating: 'التقييم العام',
  },
};

const en: HomeContent = {
  documentTitle: 'Home — Expert Hub',
  eyebrow: 'My space',
  greeting: (name) => `Welcome, ${name}`,
  subtitle: 'A quick view of your status and key actions in one place.',
  summaryLine: (inProgress) =>
    inProgress === 0
      ? 'You have no applications in progress right now.'
      : `You have ${formatNumber(inProgress, 'en')} application(s) in progress.`,
  primaryCta: 'View my applications',
  metricsLabel: 'At a glance',
  metrics: {
    total: 'Total applications',
    inProgress: 'Applications in progress',
    approved: 'Approved applications',
    programs: 'Programs',
  },
  rating: {
    heading: 'My overall rating',
    ariaLabel: (score) => `Overall rating: ${score} out of 5`,
    outOf: (score) => `${score} out of 5`,
    lastRefreshed: (date) => `Last updated: ${date}`,
    pending: 'Your rating is being calculated and will appear soon.',
    unavailable: 'Your rating is currently unavailable.',
    notRated: 'Not rated yet.',
  },
  visibility: {
    heading: 'Directory visibility',
    on: 'Visible to the public',
    off: 'Hidden',
    manage: 'Manage visibility',
  },
  shortcuts: {
    heading: 'Quick links',
    applicationsTitle: 'My applications',
    applicationsDesc: 'Track your applications and complete any required steps.',
    newApplicationTitle: 'New application',
    newApplicationDesc: 'Start a new application for the available services.',
    profileTitle: 'My profile',
    profileDesc: 'Update your details and review your approved scope.',
    engagementsTitle: 'My engagements',
    engagementsDesc: 'The assignment offers waiting on you and your confirmed engagements.',
    directoryTitle: 'Expert & Trainer Directory',
    directoryDesc: 'Browse the accredited experts visible to the public.',
  },
  notifications: {
    heading: 'Recent notifications',
    empty: 'No new notifications.',
    unread: 'Unread',
    at: (date) => date,
  },
  empty: {
    title: 'No activity yet',
    body: 'Start by submitting an application; your status and metrics will appear here as soon as they exist.',
    cta: 'New application',
  },
  completeProfile: {
    title: 'Complete your profile',
    body:
      'Your trainer access comes from your record at the Financial Academy; ' +
      'Expert Hub’s own accreditation has not been completed. Fill in what ' +
      'is missing so you can apply for services.',
    fromAcademy:
      'What the Academy already holds — your name, qualifications and ' +
      'professional certifications — is filled in for you.',
    complete: 'Complete my data',
    later: 'Later',
  },
  errors: {
    loadTitle: 'Could not load the page',
    loadBody: 'Something went wrong while loading your home page. Please try again.',
    retry: 'Try again',
    sessionTitle: 'Session expired',
    sessionBody: 'Your session has expired. Please log in again to continue.',
  },
  classifications: getTrainerClassificationLabels('en'),
  individualStanding: 'Individual',
  band: {
    inProgress: 'Applications in progress',
    rating: 'Overall rating',
  },
};

const CONTENT: Record<Locale, HomeContent> = { ar, en };

export function getHomeContent(locale: Locale): HomeContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
