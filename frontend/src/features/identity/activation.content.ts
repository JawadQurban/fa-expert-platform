import type { Locale } from '@/types';
import { getMyApplicationsContent } from '../applications/myApplications.content';
import type { ActivationTokenProblem } from './activation.types';

/**
 * J-02/F4 (Nominee Account Activation) copy — Arabic authoritative, English
 * best-effort.
 *
 * The tone matters more than usual here. The nominee did not start this: staff
 * submitted an application **on their behalf**, and this link may be the first
 * they hear of it. So the page says who nominated them and for what before it
 * asks them for anything, and it names what activation gives them — otherwise
 * "verify your identity" arrives as an unexplained demand from an institution
 * they were not expecting to hear from.
 */

export interface ActivationContent {
  readonly documentTitle: string;
  readonly heading: string;
  /** Says plainly that someone else started this. */
  readonly intro: (name: string) => string;
  readonly referenceLabel: string;
  readonly statusLabel: string;
  /** AC-4 — access does not wait for the screening stage, and says so. */
  readonly accessNote: string;

  readonly yaqeen: {
    readonly heading: string;
    readonly description: string;
    readonly nationalIdLabel: string;
    readonly nationalIdHint: string;
    readonly dobLabel: string;
    readonly submit: string;
    readonly verifying: string;
    readonly failedTitle: string;
    readonly failedBody: string;
  };

  readonly email: {
    readonly heading: string;
    /** AC-1 — for this ID type the emailed link *is* the verification. */
    readonly description: string;
    readonly submit: string;
  };

  readonly existingAccount: {
    readonly heading: string;
    /** AC-3 — nothing is verified twice. */
    readonly description: string;
    readonly submit: string;
  };

  readonly success: {
    readonly title: string;
    readonly body: string;
    readonly openApplication: string;
    readonly openPortal: string;
  };

  readonly problems: Readonly<Record<ActivationTokenProblem, { title: string; body: string }>>;
  /** RB-01 — no identity provider is configured: nothing is activated or verified. */
  readonly unavailable: { readonly title: string; readonly body: string };
  readonly errors: {
    readonly loadTitle: string;
    readonly loadBody: string;
    readonly retry: string;
    readonly home: string;
  };

  readonly statuses: ReturnType<typeof getMyApplicationsContent>['statuses'];
}

const ar: ActivationContent = {
  documentTitle: 'تفعيل الحساب — منصة الخبراء والمدربين',
  heading: 'تفعيل حسابك',
  intro: (name) =>
    `مرحبًا ${name}. قدّمت الأكاديمية المالية طلب انضمام باسمك. فعّل حسابك للاطلاع على الطلب ومتابعته بنفسك.`,
  referenceLabel: 'رقم الطلب',
  statusLabel: 'حالة الطلب',
  accessNote:
    'بعد التفعيل يصبح لك وصول كامل إلى بوابة المدربين لمتابعة طلبك والتصرف فيه، أيًا كانت المرحلة التي بلغها.',

  yaqeen: {
    heading: 'التحقق عبر يقين',
    description: 'أدخل رقم الهوية أو الإقامة وتاريخ الميلاد للتحقق من هويتك عبر «يقين».',
    nationalIdLabel: 'رقم الهوية أو الإقامة',
    nationalIdHint: 'عشرة أرقام.',
    dobLabel: 'تاريخ الميلاد',
    submit: 'التحقق وتفعيل الحساب',
    verifying: 'جارٍ التحقق عبر يقين…',
    failedTitle: 'تعذّر التحقق من هويتك',
    failedBody:
      'لم تتطابق البيانات المُدخلة مع سجلات «يقين». يُرجى التأكد من رقم الهوية وتاريخ الميلاد وإعادة المحاولة.',
  },

  email: {
    heading: 'تأكيد التفعيل',
    description:
      'وصلك هذا الرابط على بريدك الإلكتروني، وهو ما يثبت هويتك لهذه الفئة. لا حاجة إلى خطوة تحقق إضافية.',
    submit: 'تفعيل الحساب',
  },

  existingAccount: {
    heading: 'لديك حساب لدى الأكاديمية',
    description:
      'وجدنا حسابًا مرتبطًا ببياناتك، فلا داعي لإعادة التحقق. سجّل الدخول إليه لربط الطلب بحسابك.',
    submit: 'تسجيل الدخول',
  },

  success: {
    title: 'تم تفعيل حسابك',
    body: 'أصبح بإمكانك متابعة طلبك والتصرف فيه من بوابة المدربين.',
    openApplication: 'عرض طلبي',
    openPortal: 'الذهاب إلى البوابة',
  },

  problems: {
    invalid: {
      title: 'رابط التفعيل غير صالح',
      body: 'تعذّر التعرّف على هذا الرابط. تأكد من نسخه كاملًا من رسالة البريد الإلكتروني.',
    },
    expired: {
      title: 'انتهت صلاحية رابط التفعيل',
      body: 'لم يعد هذا الرابط صالحًا. تواصل مع إدارة المدربين لإرسال رابط جديد.',
    },
    'already-used': {
      title: 'سبق استخدام رابط التفعيل',
      body: 'فُعِّل الحساب من قبل. يمكنك تسجيل الدخول مباشرة لمتابعة طلبك.',
    },
  },
  unavailable: {
    title: 'تفعيل الحساب غير متاح حاليًا',
    body: 'لا يمكن التحقق من رابط التفعيل أو من هويتك في الوقت الحالي، ولم يُفعَّل أي حساب. إن كان لديك حساب لدى الأكاديمية فسجّل الدخول به، أو تواصل مع إدارة المدربين.',
  },
  errors: {
    loadTitle: 'تعذّر إتمام التفعيل',
    loadBody: 'حدث خطأ أثناء المعالجة. يُرجى المحاولة مرة أخرى.',
    retry: 'إعادة المحاولة',
    home: 'الصفحة الرئيسية',
  },

  statuses: getMyApplicationsContent('ar').statuses,
};

const en: ActivationContent = {
  documentTitle: 'Activate your account — Expert Hub',
  heading: 'Activate your account',
  intro: (name) =>
    `Hello ${name}. The Financial Academy submitted an application in your name. Activate your account to see it and follow it yourself.`,
  referenceLabel: 'Application reference',
  statusLabel: 'Application status',
  accessNote:
    'Once activated you have full Trainer Portal access to track and act on your application, whatever stage it has reached.',

  yaqeen: {
    heading: 'Verify through Yaqeen',
    description: 'Enter your National ID or Iqama number and date of birth to verify via Yaqeen.',
    nationalIdLabel: 'National ID or Iqama number',
    nationalIdHint: 'Ten digits.',
    dobLabel: 'Date of birth',
    submit: 'Verify and activate',
    verifying: 'Verifying with Yaqeen…',
    failedTitle: 'We could not verify your identity',
    failedBody:
      'The details you entered did not match Yaqeen records. Please check your ID number and date of birth, then try again.',
  },

  email: {
    heading: 'Confirm activation',
    description:
      'This link reached you by email, which is the verification for your category. No further step is needed.',
    submit: 'Activate my account',
  },

  existingAccount: {
    heading: 'You already have an Academy account',
    description:
      'We found an account linked to your details, so there is nothing to verify again. Sign in to link the application to it.',
    submit: 'Sign in',
  },

  success: {
    title: 'Your account is active',
    body: 'You can now track and act on your application from the Trainer Portal.',
    openApplication: 'View my application',
    openPortal: 'Go to the portal',
  },

  problems: {
    invalid: {
      title: 'This activation link is not valid',
      body: 'We could not recognise this link. Check that you copied all of it from the email.',
    },
    expired: {
      title: 'This activation link has expired',
      body: 'The link is no longer valid. Contact Trainer Management to have a new one sent.',
    },
    'already-used': {
      title: 'This activation link was already used',
      body: 'The account has already been activated. You can sign in directly to follow your application.',
    },
  },
  unavailable: {
    title: 'Account activation is not available right now',
    body: 'We cannot check this activation link or verify your identity at the moment, and no account was activated. If you have an Academy account, sign in with it, or contact Trainer Management.',
  },
  errors: {
    loadTitle: 'Activation could not be completed',
    loadBody: 'Something went wrong. Please try again.',
    retry: 'Try again',
    home: 'Home',
  },

  statuses: getMyApplicationsContent('en').statuses,
};

const CONTENT: Record<Locale, ActivationContent> = { ar, en };

export function getActivationContent(locale: Locale): ActivationContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
