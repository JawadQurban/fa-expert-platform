import type { Locale } from '@/types';

/**
 * Expert Hub application chrome copy — accessibility labels and the system pages
 * (login / callback / unauthorized / not-found / coming-soon). Owned by the
 * Expert Hub boundary and **Expert-Hub-neutral**: no Hackathon wording.
 *
 * Header content lives in `header.content.ts` and footer content in
 * `footer.content.ts` (each its own product config, kept out of this shell copy).
 *
 * Arabic is authoritative; English is a best-effort translation for the locale
 * toggle. Editing this chrome wording only ever touches this file.
 */

export interface ShellContent {
  readonly a11y: {
    readonly skipToContent: string;
    readonly mainLandmark: string;
  };
  readonly login: {
    readonly documentTitle: string;
    readonly title: string;
    readonly body: string;
    readonly ssoButtonLabel: string;
    readonly sessionExpiredNotice: string;
    readonly devNotice: string;
    readonly backHomeLabel: string;
    /** Shown while the silent SSO handshake auto-starts (P-178). */
    readonly redirectingNotice: string;
  };
  readonly callback: {
    readonly documentTitle: string;
    readonly signingIn: string;
    readonly failedTitle: string;
    readonly failedBody: string;
    readonly retryLabel: string;
  };
  readonly unauthorized: {
    readonly documentTitle: string;
    readonly title: string;
    readonly body: string;
    readonly homeLabel: string;
  };
  readonly notFound: {
    readonly documentTitle: string;
    readonly title: string;
    readonly body: string;
    readonly homeLabel: string;
  };
  readonly comingSoon: {
    readonly eyebrow: string;
    readonly body: string;
    readonly homeLabel: string;
  };
}

const ar: ShellContent = {
  a11y: {
    skipToContent: 'تخطَّ إلى المحتوى الرئيسي',
    mainLandmark: 'المحتوى الرئيسي',
  },
  login: {
    documentTitle: 'تسجيل الدخول | منصة الخبراء والمدربين',
    title: 'تسجيل الدخول',
    body: 'يتم تسجيل الدخول عبر نظام الهوية الخاص بالأكاديمية المالية (الدخول الموحّد).',
    ssoButtonLabel: 'المتابعة عبر الدخول الموحّد للأكاديمية',
    sessionExpiredNotice: 'انتهت جلستك، يُرجى تسجيل الدخول مرة أخرى.',
    devNotice: 'تنبيه: هذا الدخول الموحّد نسخة تطوير مؤقتة لأغراض العرض فقط، وليست مصادقة حقيقية.',
    backHomeLabel: 'العودة إلى الصفحة الرئيسية',
    redirectingNotice: 'جارٍ تحويلك إلى الدخول الموحّد للأكاديمية…',
  },
  callback: {
    documentTitle: 'جارٍ تسجيل الدخول…',
    signingIn: 'جارٍ تسجيل دخولك…',
    failedTitle: 'تعذّر تسجيل الدخول',
    failedBody: 'حدث خطأ أثناء إكمال تسجيل الدخول. يُرجى المحاولة مرة أخرى.',
    retryLabel: 'إعادة المحاولة',
  },
  unauthorized: {
    documentTitle: 'لا تملك صلاحية الوصول | منصة الخبراء والمدربين',
    title: 'لا تملك صلاحية الوصول',
    body: 'ليست لديك الصلاحية اللازمة لعرض هذه الصفحة. إذا كنت تعتقد أن هذا خطأ، تواصل مع مسؤول النظام.',
    homeLabel: 'العودة إلى الصفحة الرئيسية',
  },
  notFound: {
    documentTitle: 'الصفحة غير موجودة | منصة الخبراء والمدربين',
    title: 'الصفحة غير موجودة',
    body: 'تعذّر العثور على الصفحة المطلوبة.',
    homeLabel: 'العودة إلى الصفحة الرئيسية',
  },
  comingSoon: {
    eyebrow: 'قيد الإنشاء',
    body: 'هذه الصفحة قيد التطوير وستتوفّر في مرحلة لاحقة ضمن خطة بناء المنصة صفحةً صفحة.',
    homeLabel: 'العودة إلى الصفحة الرئيسية',
  },
};

const en: ShellContent = {
  a11y: {
    skipToContent: 'Skip to main content',
    mainLandmark: 'Main content',
  },
  login: {
    documentTitle: 'Log in | Expert & Independent Trainer Hub',
    title: 'Log in',
    body: 'Sign in with the Financial Academy identity system (single sign-on).',
    ssoButtonLabel: 'Continue with Academy single sign-on',
    sessionExpiredNotice: 'Your session has expired. Please log in again.',
    devNotice:
      'Notice: this single sign-on is a temporary development placeholder for demonstration only — it is not real authentication.',
    backHomeLabel: 'Back to home',
    redirectingNotice: 'Redirecting you to the Academy single sign-on…',
  },
  callback: {
    documentTitle: 'Signing you in…',
    signingIn: 'Signing you in…',
    failedTitle: 'Log in failed',
    failedBody: 'Something went wrong while completing your login. Please try again.',
    retryLabel: 'Try again',
  },
  unauthorized: {
    documentTitle: 'Not authorized | Expert & Independent Trainer Hub',
    title: 'You do not have access',
    body: 'You do not have permission to view this page. If you believe this is a mistake, contact your system administrator.',
    homeLabel: 'Back to home',
  },
  notFound: {
    documentTitle: 'Page not found | Expert & Independent Trainer Hub',
    title: 'Page not found',
    body: 'We could not find the page you were looking for.',
    homeLabel: 'Back to home',
  },
  comingSoon: {
    eyebrow: 'Coming soon',
    body: 'This page is under construction and will be delivered in a later stage of the page-by-page build.',
    homeLabel: 'Back to home',
  },
};

const SHELL_CONTENT: Record<Locale, ShellContent> = { ar, en };

export function getShellContent(locale: Locale): ShellContent {
  return SHELL_CONTENT[locale] ?? SHELL_CONTENT.ar;
}
