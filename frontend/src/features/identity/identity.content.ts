import type { Locale } from '@/types';
import type { IdType, IdentityValidationCode } from './identity.types';

/**
 * Identity Linking copy (J-01's prerequisite layer) — Arabic authoritative,
 * English best-effort. The gate renders structure only.
 *
 * The five outcome messages are the visible face of J-01 §5's decision table, so
 * each one names what happens next rather than only what went wrong: a blocked
 * applicant who is not told where to go instead has been stopped, not helped.
 */

export interface IdentityContent {
  readonly heading: string;
  readonly description: string;
  /** Governing rule 3 — verification is not eligibility, said out loud. */
  readonly verificationNote: string;

  readonly idTypeLegend: string;
  readonly idTypes: Readonly<Record<IdType, string>>;
  readonly idTypeHints: Readonly<Record<IdType, string>>;

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

  readonly manual: {
    readonly heading: string;
    /** J-01 §3A — there is no Yaqeen path here, and the applicant should know. */
    readonly description: string;
    readonly documentNumberLabel: string;
    readonly documentNumberHint: string;
    readonly dobLabel: string;
    readonly fullNameLabel: string;
    readonly submit: string;
    /** J-01 §3B — matching happens at submission for this path. */
    readonly deferredNote: string;
  };

  readonly errors: Readonly<Record<IdentityValidationCode, string>>;

  /** J-01 §5 — one message per row of the decision table. */
  readonly outcomes: {
    readonly verifiedTitle: string;
    readonly noMatchTitle: string;
    readonly noMatchBody: string;
    readonly matchedTitle: string;
    readonly matchedBody: string;
    readonly blockedTrainerTitle: string;
    readonly blockedTrainerBody: string;
    readonly blockedTrainerAction: string;
    readonly blockedOpenTitle: string;
    readonly blockedOpenBody: string;
    readonly blockedOpenAction: string;
    readonly continueToForm: string;
  };

  /** Governing rule 2 — a guest may fill the form but not save a draft. */
  readonly guest: {
    readonly bannerTitle: string;
    readonly bannerBody: string;
    readonly signInAction: string;
    readonly saveDraftBlockedTitle: string;
    readonly saveDraftBlockedBody: string;
  };

  /**
   * RB-01 — no identity provider is configured. Nothing can be verified here,
   * so the applicant is sent to sign in instead of being shown a result.
   */
  readonly unavailable: {
    readonly title: string;
    readonly body: string;
  };

  readonly loadError: string;
  readonly retry: string;
}

const ar: IdentityContent = {
  heading: 'تأكيد الهوية',
  description:
    'قبل تعبئة الطلب نحتاج إلى تحديد هويتك، والتحقق ممّا إذا كان لديك حساب أو طلب قائم لدى الأكاديمية.',
  verificationNote:
    'التحقق من الهوية لا يعني قبول الطلب؛ أهليتك للتقديم تُفحص بعد ذلك بناءً على حالة حسابك.',

  idTypeLegend: 'نوع الهوية',
  idTypes: {
    'citizen-resident': 'مواطن أو مقيم',
    'foreigner-gcc': 'أجنبي أو من دول الخليج',
  },
  idTypeHints: {
    'citizen-resident': 'يتم التحقق عبر «يقين» باستخدام رقم الهوية وتاريخ الميلاد.',
    'foreigner-gcc': 'لا يتوفّر تحقق عبر «يقين» لهذه الفئة؛ تُدخل البيانات يدويًا.',
  },

  yaqeen: {
    heading: 'التحقق عبر يقين',
    description: 'أدخل رقم الهوية أو الإقامة وتاريخ الميلاد للتحقق عبر «يقين».',
    nationalIdLabel: 'رقم الهوية أو الإقامة',
    nationalIdHint: 'عشرة أرقام.',
    dobLabel: 'تاريخ الميلاد',
    submit: 'التحقق عبر يقين',
    verifying: 'جارٍ التحقق عبر يقين…',
    failedTitle: 'تعذّر التحقق من هويتك',
    failedBody:
      'لم تتطابق البيانات المُدخلة مع سجلات «يقين». يُرجى التأكد من رقم الهوية وتاريخ الميلاد وإعادة المحاولة.',
  },

  manual: {
    heading: 'إدخال بيانات الهوية',
    description:
      'لا يتوفّر تحقق إلكتروني عبر «يقين» لغير المواطنين والمقيمين، لذا تُدخل البيانات يدويًا وتُراجَع لاحقًا.',
    documentNumberLabel: 'رقم جواز السفر أو الهوية الخليجية',
    documentNumberHint: 'كما يظهر في الوثيقة.',
    dobLabel: 'تاريخ الميلاد',
    fullNameLabel: 'الاسم الكامل',
    submit: 'المتابعة',
    deferredNote:
      'سيتم التحقق من وجود حساب سابق لك عند تقديم الطلب، عبر البريد الإلكتروني الذي ستُدخله.',
  },

  errors: {
    'national-id-required': 'يجب إدخال رقم الهوية أو الإقامة.',
    'national-id-format': 'رقم الهوية أو الإقامة يتكوّن من عشرة أرقام.',
    'dob-required': 'يجب إدخال تاريخ الميلاد.',
    'document-number-required': 'يجب إدخال رقم الوثيقة.',
    'full-name-required': 'يجب إدخال الاسم الكامل.',
  },

  outcomes: {
    verifiedTitle: 'تم التحقق من هويتك',
    noMatchTitle: 'لا يوجد حساب سابق',
    noMatchBody:
      'يمكنك تعبئة الطلب الآن. سيُنشأ حسابك ويُربط ببياناتك عند تقديم الطلب. لحفظ مسودة قبل ذلك يلزم تسجيل الدخول.',
    matchedTitle: 'وجدنا حسابك السابق',
    matchedBody: 'طلبك السابق مُغلق، ويمكنك التقديم من جديد. عبّأنا لك بياناتك الأساسية.',
    blockedTrainerTitle: 'أنت مدرب معتمد لدينا',
    blockedTrainerBody:
      'حسابك يحمل اعتمادًا ساريًا كمدرب، فلا حاجة لتقديم طلب انضمام جديد. لتوسيع نطاق خدماتك، قدّم طلب إضافة خدمة من بوابتك.',
    blockedTrainerAction: 'إضافة خدمة',
    blockedOpenTitle: 'لديك طلب قائم',
    blockedOpenBody:
      'لا يمكن تقديم أكثر من طلب في الوقت نفسه. يمكنك متابعة حالة طلبك القائم من بوابتك.',
    blockedOpenAction: 'متابعة طلبي',
    continueToForm: 'المتابعة إلى الطلب',
  },

  guest: {
    bannerTitle: 'أنت تعبّئ الطلب كزائر',
    bannerBody:
      'يمكنك تعبئة الطلب كاملًا، لكن حفظ مسودة يتطلّب حسابًا. سجّل الدخول في أي وقت لحفظ ما أدخلته.',
    signInAction: 'تسجيل الدخول',
    saveDraftBlockedTitle: 'حفظ المسودة يتطلّب تسجيل الدخول',
    saveDraftBlockedBody:
      'سجّل الدخول أو أنشئ حسابًا لحفظ مسودتك. المسودة المحفوظة تبقى دون انتهاء صلاحية.',
  },

  unavailable: {
    title: 'التحقق من الهوية غير متاح حاليًا',
    body: 'لا يمكن التحقق من هويتك هنا في الوقت الحالي، ولم يُسجَّل أي شيء. سجّل الدخول بحسابك لدى الأكاديمية لمتابعة التقديم.',
  },

  loadError: 'تعذّر إتمام التحقق. يُرجى المحاولة مرة أخرى.',
  retry: 'إعادة المحاولة',
};

const en: IdentityContent = {
  heading: 'Confirm your identity',
  description:
    'Before you fill in the application we need to establish who you are, and whether you already have an account or an application with the Academy.',
  verificationNote:
    'Verifying your identity does not approve your application; your eligibility is checked separately, based on your account status.',

  idTypeLegend: 'ID type',
  idTypes: {
    'citizen-resident': 'Citizen or resident',
    'foreigner-gcc': 'Foreigner or GCC national',
  },
  idTypeHints: {
    'citizen-resident': 'Verified through Yaqeen, using your ID number and date of birth.',
    'foreigner-gcc':
      'No Yaqeen verification exists for this category; details are entered manually.',
  },

  yaqeen: {
    heading: 'Verify through Yaqeen',
    description: 'Enter your National ID or Iqama number and date of birth to verify via Yaqeen.',
    nationalIdLabel: 'National ID or Iqama number',
    nationalIdHint: 'Ten digits.',
    dobLabel: 'Date of birth',
    submit: 'Verify with Yaqeen',
    verifying: 'Verifying with Yaqeen…',
    failedTitle: 'We could not verify your identity',
    failedBody:
      'The details you entered did not match Yaqeen records. Please check your ID number and date of birth, then try again.',
  },

  manual: {
    heading: 'Enter your identity details',
    description:
      'No Yaqeen verification is available for non-citizens and non-residents, so these details are entered manually and reviewed later.',
    documentNumberLabel: 'Passport or GCC ID number',
    documentNumberHint: 'As it appears on the document.',
    dobLabel: 'Date of birth',
    fullNameLabel: 'Full name',
    submit: 'Continue',
    deferredNote:
      'We will check for an existing account when you submit the application, using the email address you provide.',
  },

  errors: {
    'national-id-required': 'Enter your National ID or Iqama number.',
    'national-id-format': 'The National ID or Iqama number is ten digits.',
    'dob-required': 'Enter your date of birth.',
    'document-number-required': 'Enter your document number.',
    'full-name-required': 'Enter your full name.',
  },

  outcomes: {
    verifiedTitle: 'Your identity is verified',
    noMatchTitle: 'No existing account',
    noMatchBody:
      'You can fill in the application now. Your account will be created and linked when you submit. Saving a draft before then requires signing in.',
    matchedTitle: 'We found your previous account',
    matchedBody:
      'Your previous application is closed, so you can apply again. We have filled in your basic details.',
    blockedTrainerTitle: 'You are already an accredited trainer',
    blockedTrainerBody:
      'Your account holds an active trainer accreditation, so a new application is not needed. To widen your scope, request an additional service from your portal.',
    blockedTrainerAction: 'Add a service',
    blockedOpenTitle: 'You already have an open application',
    blockedOpenBody:
      'You cannot have more than one application at a time. You can track your existing one from your portal.',
    blockedOpenAction: 'Track my application',
    continueToForm: 'Continue to the application',
  },

  guest: {
    bannerTitle: 'You are filling this in as a guest',
    bannerBody:
      'You can complete the whole application, but saving a draft requires an account. Sign in at any time to keep what you have entered.',
    signInAction: 'Sign in',
    saveDraftBlockedTitle: 'Saving a draft requires signing in',
    saveDraftBlockedBody:
      'Sign in or create an account to save your draft. A saved draft never expires.',
  },

  unavailable: {
    title: 'Identity verification is not available right now',
    body: 'We cannot verify your identity here at the moment, and nothing was recorded. Sign in with your Academy account to continue your application.',
  },

  loadError: 'We could not complete the check. Please try again.',
  retry: 'Try again',
};

const CONTENT: Record<Locale, IdentityContent> = { ar, en };

export function getIdentityContent(locale: Locale): IdentityContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
