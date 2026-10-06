import type { Locale } from '@/types';
import type { IconName } from '@ds/primitives/Icon/Icon.types';
import { expertHubPaths } from '../../app/router/paths';

/**
 * Expert Hub landing page (`EH-PUB-01`) content — modeled on the official
 * Financial Academy "منصة الخبراء" (Expert Platform) marketing page supplied by
 * the Product Owner. Arabic is authoritative (copy transcribed from the
 * reference); English is a best-effort translation for the locale toggle. CTA
 * targets come from the Expert Hub path registry — never the Hackathon router.
 *
 * ⚠️ **Needs confirmation (CLAUDE.md — "mark unverifiable requirements"):** the
 * reference exposed the copy for "من يمكنه التقديم؟" only. The two sibling
 * guideline tabs — "المجالات المطلوبة" and "شروط الانضمام" — are populated from
 * BRD-grounded material (service types §6, screening/evaluation criteria) as a
 * faithful stand-in; replace with the official copy once provided (see the
 * `TODO(content)` markers). No DGA requirement is invented.
 */

export interface LandingCardItem {
  readonly id: string;
  readonly icon: IconName;
  readonly text: string;
}

export interface LandingStep {
  readonly id: string;
  readonly icon: IconName;
  readonly title: string;
  readonly description: string;
}

export interface LandingGuidelineTab {
  readonly id: string;
  readonly label: string;
  readonly heading: string;
  readonly intro?: string;
  readonly items: readonly string[];
}

export interface LandingContent {
  readonly documentTitle: string;
  readonly metaDescription: string;
  readonly hero: {
    readonly eyebrow: string;
    readonly title: string;
    readonly subtitle: string;
    readonly invitation: {
      readonly heading: string;
      readonly body: string;
      readonly ctaLabel: string;
      readonly ctaHref: string;
      readonly imageAlt: string;
    };
  };
  readonly about: {
    readonly eyebrow: string;
    readonly title: string;
    readonly switcherLabel: string;
    readonly aboutTab: {
      readonly id: string;
      readonly label: string;
      readonly heading: string;
      readonly imageAlt: string;
      readonly paragraphs: readonly string[];
    };
    readonly whyTab: {
      readonly id: string;
      readonly label: string;
      readonly heading: string;
      readonly ctaLabel: string;
      readonly ctaHref: string;
      readonly items: readonly LandingCardItem[];
    };
    readonly goalsTab: {
      readonly id: string;
      readonly label: string;
      readonly heading: string;
      readonly items: readonly LandingCardItem[];
    };
  };
  readonly eligibility: {
    readonly eyebrow: string;
    readonly title: string;
    readonly guidelinesLabel: string;
    readonly ctaLabel: string;
    readonly ctaHref: string;
    readonly ctaTitle: string;
    readonly ctaBody: string;
    readonly tabs: readonly LandingGuidelineTab[];
  };
  readonly collaboration: {
    readonly eyebrow: string;
    readonly title: string;
    readonly body: string;
    readonly sectionLabel: string;
    readonly steps: readonly LandingStep[];
  };
  readonly finalCta: {
    readonly eyebrow: string;
    readonly title: string;
    readonly body: string;
    readonly primaryCtaLabel: string;
    readonly primaryCtaHref: string;
    readonly secondaryCtaLabel: string;
    readonly secondaryCtaHref: string;
  };
}

const APPLY_HREF = expertHubPaths.applicationsNew;
const DIRECTORY_HREF = expertHubPaths.directory;

const ar: LandingContent = {
  documentTitle: 'منصة الخبراء | الأكاديمية المالية',
  metaDescription:
    'منصة الخبراء بالأكاديمية المالية تجمع نخبة من الكفاءات المتخصصة للمساهمة في تمكين الجيل القادم من قادة القطاع المالي.',
  hero: {
    eyebrow: 'الأكاديمية المالية',
    title: 'منصة الخبراء',
    subtitle:
      'منصة تجمع نخبة من الكفاءات المتخصصة للمساهمة في تمكين الجيل القادم من قادة القطاع المالي.',
    invitation: {
      heading: 'منصة الخبراء لاستقطاب الكفاءات المتخصصة',
      body: 'إذا كنت تؤمن بقوة التعليم، وتطمح إلى إحداث أثر حقيقي في تطوير رأس المال البشري في القطاع المالي، ندعوك اليوم لتكون جزءًا من هذه الرحلة. انضم إلى منظومة تدريبية احترافية تجمع الخبرة والابتكار والجودة، وساهم في تمكين الجيل القادم من قادة القطاع المالي.',
      ctaLabel: 'انضم الآن',
      ctaHref: APPLY_HREF,
      imageAlt: 'خبير من خبراء الأكاديمية المالية',
    },
  },
  about: {
    eyebrow: 'معًا نصنع الأثر',
    title: 'عن المنصة',
    switcherLabel: 'أقسام التعريف بالمنصة',
    aboutTab: {
      id: 'about',
      label: 'عن المنصة',
      heading: 'عن المنصة',
      imageAlt: 'خبير يقدّم برنامجًا تدريبيًا',
      paragraphs: [
        'أطلقت الأكاديمية المالية منصة الخبراء لتكون وجهة نوعية تجمع نخبة الكفاءات في التدريب، وتطوير المحتوى، والتوجيه والإرشاد.',
        'تهدف المنصة إلى بناء بيئة تدريبية احترافية تسهم في تطوير رأس المال البشري بوصفه ركيزة أساسية لنمو القطاع المالي، وفق أعلى معايير الجودة والتأثير، وبما يواكب طموحات المملكة في المنافسة إقليميًا وعالميًا.',
      ],
    },
    whyTab: {
      id: 'why',
      label: 'لماذا تنضم إلى منصة الخبراء؟',
      heading: 'لماذا تنضم إلى منصة الخبراء؟',
      ctaLabel: 'انضم الآن',
      ctaHref: APPLY_HREF,
      items: [
        {
          id: 'vision',
          icon: 'give-star',
          text: 'الإسهام في تحقيق مستهدفات رؤية المملكة 2030 من خلال رفع كفاءة رأس المال البشري.',
        },
        {
          id: 'certificates',
          icon: 'task-done-01',
          text: 'الحصول على شهادات تقديم برامج أو إثبات خبرة معتمدة من الأكاديمية.',
        },
        {
          id: 'record',
          icon: 'note-done',
          text: 'بناء سجل مهني موثّق من خلال تقديم برامج معتمدة.',
        },
        {
          id: 'partner',
          icon: 'discover-circle',
          text: 'التعاون مع جهة رائدة في تطوير الكفاءات المالية.',
        },
        {
          id: 'opportunities',
          icon: 'presentation-line-chart-01',
          text: 'الوصول إلى فرص تدريبية معتمدة ومتنوعة ضمن بيئات احترافية.',
        },
      ],
    },
    goalsTab: {
      id: 'goals',
      label: 'أهداف المنصة',
      heading: 'أهداف المنصة',
      items: [
        {
          id: 'environment',
          icon: 'dashboard-square-01',
          text: 'تأسيس بيئة تدريبية بمعايير عالية.',
        },
        { id: 'talent', icon: 'dashboard-square-01', text: 'استقطاب كفاءات وخبرات محلية ودولية.' },
        {
          id: 'programs',
          icon: 'dashboard-square-01',
          text: 'تنفيذ برامج نوعية لتطوير رأس المال البشري.',
        },
        { id: 'sector', icon: 'dashboard-square-01', text: 'تعزيز الكفاءات في القطاع المالي.' },
      ],
    },
  },
  eligibility: {
    eyebrow: 'إرشادات الانضمام',
    title: 'من يمكنه الانضمام إلى منصة الخبراء',
    guidelinesLabel: 'إرشادات الانضمام',
    ctaLabel: 'انضم الآن',
    ctaHref: APPLY_HREF,
    ctaTitle: 'انضم إلى شبكة خبراء الأكاديمية المالية',
    ctaBody:
      'كن المدرب الذي يلهم الجيل القادم من المهنيين في القطاع المالي، وانضم إلى منصة الخبراء في الأكاديمية المالية.',
    tabs: [
      {
        id: 'who',
        label: 'من يمكنه التقديم؟',
        heading: 'من يمكنه التقديم؟',
        intro: 'نرحب بانضمام:',
        items: [
          'المدربون المستقلون المعتمدون.',
          'المدربون المحترفون الحاصلون على اعتماد من جهات معترف بها.',
          'الخبراء والممارسون المهنيون في المجالات المالية والإدارية والتخصصات الفنية ذات العلاقة.',
        ],
      },
      {
        // TODO(content): official copy pending — populated from BRD service types (§6).
        id: 'fields',
        label: 'المجالات المطلوبة',
        heading: 'المجالات المطلوبة',
        intro: 'تستقطب المنصة الكفاءات في المسارات التالية:',
        items: [
          'التدريب في المجالات المالية والمصرفية.',
          'الاستشارات المتخصصة لصالح الأكاديمية أو عملائها.',
          'تطوير المحتوى والمادة العلمية للبرامج التدريبية.',
          'إعداد بنوك الأسئلة والاختبارات المرتبطة بالبرامج.',
          'المشاركة كمتحدث في الفعاليات والمناسبات المتخصصة.',
        ],
      },
      {
        // TODO(content): official copy pending — populated from BRD screening/evaluation criteria.
        id: 'conditions',
        label: 'شروط الانضمام',
        heading: 'شروط الانضمام',
        intro: 'يخضع الانضمام لمعايير موحّدة تشمل:',
        items: [
          'خبرة مهنية مثبتة في المجال ذي العلاقة.',
          'اعتماد أو مؤهل من جهة معترف بها حيثما ينطبق.',
          'اجتياز معايير الفرز والتقييم الموحّدة لدى الأكاديمية.',
          'الالتزام بمعايير الجودة والأثر في تقديم الخدمات.',
        ],
      },
    ],
  },
  collaboration: {
    eyebrow: 'من الطلب إلى التعاون',
    title: 'آلية التعاون بعد الاعتماد',
    body: 'ندعوكم للانضمام إلى هذه المسيرة الطموحة، لتكونوا جزءًا من الخبراء الذين لا يكتفون بنقل المعرفة، بل يصنعون فرقًا حقيقيًا في حياة المتدربين وفي مستقبل القطاع المالي.',
    sectionLabel: 'مراحل الانضمام والتعاون',
    steps: [
      {
        id: 'apply',
        icon: 'note-add',
        title: 'تقديم الطلب',
        description: 'قدّم طلب انضمام واحدًا واختر خدمة أو أكثر، وأرفق مستنداتك المطلوبة.',
      },
      {
        id: 'screening',
        icon: 'search-list-01',
        title: 'الفرز والتقييم',
        description: 'يخضع طلبك للفرز والمقابلة والتقييم وفق معايير موحّدة ومعلنة.',
      },
      {
        id: 'accreditation',
        icon: 'task-done-01',
        title: 'الاعتماد والاتفاقية',
        description: 'بعد قرار لجنة الاعتماد، تُبرم اتفاقية تحدّد خدماتك المعتمدة.',
      },
      {
        id: 'collaboration',
        icon: 'dashboard-circle',
        title: 'التعاون والإسناد',
        description: 'تبدأ رحلتك في تقديم البرامج والخدمات ومتابعة إسناداتك ومستحقاتك من بوابتك.',
      },
    ],
  },
  finalCta: {
    eyebrow: 'ابدأ اليوم',
    title: 'انضم إلى شبكة خبراء الأكاديمية المالية',
    body: 'كن المدرب الذي يلهم الجيل القادم من المهنيين في القطاع المالي، وانضم إلى منصة الخبراء في الأكاديمية المالية.',
    primaryCtaLabel: 'انضم الآن',
    primaryCtaHref: APPLY_HREF,
    secondaryCtaLabel: 'تصفّح دليل الخبراء والمدربين',
    secondaryCtaHref: DIRECTORY_HREF,
  },
};

const en: LandingContent = {
  documentTitle: 'Expert Platform | Financial Academy',
  metaDescription:
    'The Financial Academy Expert Platform brings together elite specialized talent to help empower the next generation of financial-sector leaders.',
  hero: {
    eyebrow: 'The Financial Academy',
    title: 'Expert Platform',
    subtitle:
      'A platform that brings together elite specialized talent to help empower the next generation of financial-sector leaders.',
    invitation: {
      heading: 'The Expert Platform — attracting specialized talent',
      body: 'If you believe in the power of education and aspire to make a real impact on developing human capital in the financial sector, we invite you today to be part of this journey. Join a professional training ecosystem that combines expertise, innovation, and quality, and help empower the next generation of financial-sector leaders.',
      ctaLabel: 'Join now',
      ctaHref: APPLY_HREF,
      imageAlt: 'A Financial Academy expert',
    },
  },
  about: {
    eyebrow: 'Together we make an impact',
    title: 'About the platform',
    switcherLabel: 'Platform overview sections',
    aboutTab: {
      id: 'about',
      label: 'About the platform',
      heading: 'About the platform',
      imageAlt: 'An expert delivering a training program',
      paragraphs: [
        'The Financial Academy launched the Expert Platform as a distinctive destination bringing together elite talent in training, content development, mentoring, and guidance.',
        'The platform aims to build a professional training environment that helps develop human capital as a core pillar of financial-sector growth — to the highest standards of quality and impact, and in step with the Kingdom’s ambitions to compete regionally and globally.',
      ],
    },
    whyTab: {
      id: 'why',
      label: 'Why join the Expert Platform?',
      heading: 'Why join the Expert Platform?',
      ctaLabel: 'Join now',
      ctaHref: APPLY_HREF,
      items: [
        {
          id: 'vision',
          icon: 'give-star',
          text: 'Contribute to Saudi Vision 2030 targets by raising the efficiency of human capital.',
        },
        {
          id: 'certificates',
          icon: 'task-done-01',
          text: 'Earn program-delivery certificates or accredited proof of experience from the Academy.',
        },
        {
          id: 'record',
          icon: 'note-done',
          text: 'Build a documented professional record by delivering accredited programs.',
        },
        {
          id: 'partner',
          icon: 'discover-circle',
          text: 'Collaborate with a leading body in developing financial competencies.',
        },
        {
          id: 'opportunities',
          icon: 'presentation-line-chart-01',
          text: 'Access diverse, accredited training opportunities within professional environments.',
        },
      ],
    },
    goalsTab: {
      id: 'goals',
      label: 'Platform goals',
      heading: 'Platform goals',
      items: [
        {
          id: 'environment',
          icon: 'dashboard-square-01',
          text: 'Establish a training environment to high standards.',
        },
        {
          id: 'talent',
          icon: 'dashboard-square-01',
          text: 'Attract local and international talent and expertise.',
        },
        {
          id: 'programs',
          icon: 'dashboard-square-01',
          text: 'Deliver distinctive programs to develop human capital.',
        },
        {
          id: 'sector',
          icon: 'dashboard-square-01',
          text: 'Strengthen competencies across the financial sector.',
        },
      ],
    },
  },
  eligibility: {
    eyebrow: 'Join guidelines',
    title: 'Who can join the Expert Platform',
    guidelinesLabel: 'Join guidelines',
    ctaLabel: 'Join now',
    ctaHref: APPLY_HREF,
    ctaTitle: 'Join the Financial Academy experts network',
    ctaBody:
      'Be the trainer who inspires the next generation of financial-sector professionals — join the Expert Platform at the Financial Academy.',
    tabs: [
      {
        id: 'who',
        label: 'Who can apply?',
        heading: 'Who can apply?',
        intro: 'We welcome:',
        items: [
          'Accredited independent trainers.',
          'Professional trainers accredited by recognized bodies.',
          'Experts and professional practitioners in financial, administrative, and related technical specializations.',
        ],
      },
      {
        id: 'fields',
        label: 'Required fields',
        heading: 'Required fields',
        intro: 'The platform attracts talent across these tracks:',
        items: [
          'Training in financial and banking domains.',
          'Specialized consulting for the Academy or its clients.',
          'Developing content and academic material for training programs.',
          'Preparing question banks and assessments linked to programs.',
          'Speaking at specialized events and occasions.',
        ],
      },
      {
        id: 'conditions',
        label: 'Join conditions',
        heading: 'Join conditions',
        intro: 'Joining follows standardized criteria, including:',
        items: [
          'Proven professional experience in the relevant field.',
          'Accreditation or a qualification from a recognized body where applicable.',
          'Meeting the Academy’s standardized screening and evaluation criteria.',
          'Commitment to quality and impact standards in delivering services.',
        ],
      },
    ],
  },
  collaboration: {
    eyebrow: 'From application to collaboration',
    title: 'How collaboration works after accreditation',
    body: 'We invite you to join this ambitious journey — to be among the experts who do more than transfer knowledge, but make a real difference in trainees’ lives and in the future of the financial sector.',
    sectionLabel: 'Application and collaboration stages',
    steps: [
      {
        id: 'apply',
        icon: 'note-add',
        title: 'Submit your application',
        description:
          'Submit a single application, choose one or more services, and attach your documents.',
      },
      {
        id: 'screening',
        icon: 'search-list-01',
        title: 'Screening & evaluation',
        description:
          'Your application is screened, interviewed, and evaluated against standardized, published criteria.',
      },
      {
        id: 'accreditation',
        icon: 'task-done-01',
        title: 'Accreditation & agreement',
        description:
          'After the accreditation committee decision, an agreement defines your accredited services.',
      },
      {
        id: 'collaboration',
        icon: 'dashboard-circle',
        title: 'Collaboration & assignment',
        description:
          'Begin delivering programs and services and track your assignments and entitlements from your portal.',
      },
    ],
  },
  finalCta: {
    eyebrow: 'Start today',
    title: 'Join the Financial Academy experts network',
    body: 'Be the trainer who inspires the next generation of financial-sector professionals — join the Expert Platform at the Financial Academy.',
    primaryCtaLabel: 'Join now',
    primaryCtaHref: APPLY_HREF,
    secondaryCtaLabel: 'Browse the Expert & Trainer Directory',
    secondaryCtaHref: DIRECTORY_HREF,
  },
};

const LANDING_CONTENT: Record<Locale, LandingContent> = { ar, en };

export function getLandingContent(locale: Locale): LandingContent {
  return LANDING_CONTENT[locale] ?? LANDING_CONTENT.ar;
}
