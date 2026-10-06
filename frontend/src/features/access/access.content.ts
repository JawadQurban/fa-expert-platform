import type { Locale } from '@/types';
import type { DataScope, FastExpertPower, RoleCode } from './access.types';
import { arNumber } from '../../shared/formatting';

/**
 * CAP-08 copy — Arabic authoritative, English best-effort.
 *
 * What this copy has to carry, because the screens alone cannot:
 *
 * - **The grid is a draft, not policy.** `DM-GAP-07` is unapproved, so the page
 *   says so at the top. An empty matrix that looked authoritative would be worse
 *   than no matrix.
 * - **Why there is no "grant to this user" control.** `BR-0801` allows grants
 *   only through roles, and an administrator who expects a per-user override
 *   should be told it is the rule rather than a missing feature.
 * - **Why there is no "add role" button.** §8.8.5 fixes six.
 */

/**
 * The area each permission belongs to, named for the people who read this
 * screen. Codes like `CAP-04` identify a capability in the requirements
 * document; they say nothing to an administrator deciding who may edit a
 * trainer's profile.
 */
const AR_CAPABILITY_NAMES: Readonly<Record<string, string>> = {
  'CAP-01': 'الطلبات والترشيح',
  'CAP-02': 'الفرز والتقييم',
  'CAP-03': 'الاتفاقيات',
  'CAP-04': 'ملفات المدربين',
  'CAP-05': 'الإسناد والارتباطات',
  'CAP-06': 'المستحقات المالية',
  'CAP-07': 'الإشعارات والمهل',
  'CAP-08': 'الصلاحيات والمستخدمون',
  'CAP-09': 'المؤشرات والتقارير',
  'CAP-10': 'الواجهة العامة',
};

const EN_CAPABILITY_NAMES: Readonly<Record<string, string>> = {
  'CAP-01': 'Applications & nominations',
  'CAP-02': 'Screening & evaluation',
  'CAP-03': 'Agreements',
  'CAP-04': 'Trainer profiles',
  'CAP-05': 'Assignment & engagements',
  'CAP-06': 'Financial entitlements',
  'CAP-07': 'Notifications & deadlines',
  'CAP-08': 'Access & users',
  'CAP-09': 'Dashboards & reports',
  'CAP-10': 'Public presence',
};

export interface AccessContent {
  /** The two CAP-08 screens cross-link; the header carries the area once. */
  readonly nav: {
    readonly label: string;
    readonly permissions: string;
    readonly users: string;
  };

  readonly matrix: {
    readonly documentTitle: string;
    readonly title: string;
    readonly intro: string;
    readonly unapprovedTitle: string;
    readonly unapprovedBody: string;
    readonly labelsNote: (count: number) => string;
    readonly rolesFixedNote: string;
    readonly noDirectGrantNote: string;
    readonly capabilityLabel: string;
    readonly capabilityOption: (code: string, count: number) => string;
    /** The area a permission belongs to, named rather than coded. */
    readonly capabilityNames: Readonly<Record<string, string>>;
    readonly capabilityHint: string;
    readonly searchScopeNote: string;
    readonly featureLabel: string;
    readonly searchLabel: string;
    readonly searchPlaceholder: string;
    readonly grantedLabel: (role: string, feature: string) => string;
    readonly scopeLabel: (role: string, feature: string) => string;
    readonly grantedCount: (granted: number, total: number) => string;
    readonly empty: string;
  };

  readonly users: {
    readonly documentTitle: string;
    readonly title: string;
    readonly intro: string;
    readonly searchLabel: string;
    readonly searchPlaceholder: string;
    readonly noRoles: string;
    readonly assignHeading: string;
    readonly roleLegend: string;
    readonly centreLabel: string;
    readonly centreHint: string;
    readonly assign: string;
    readonly revoke: (role: string) => string;
    readonly assignedBy: (name: string, date: string) => string;
    readonly scopedTo: (centre: string) => string;
    readonly empty: string;
    /** What FAST says — beside, never instead of, the roles granted here. */
    readonly fastHeading: string;
    readonly fastNote: string;
    readonly fastNever: string;
    readonly fastIdNumber: string;
    readonly fastOrganization: string;
    readonly fastJobTitle: string;
    readonly fastEmployee: string;
    readonly fastRoles: string;
    readonly fastPowers: string;
    readonly fastSynced: (date: string) => string;
    readonly fastPowerNames: Readonly<Record<FastExpertPower, string>>;
  };

  readonly roles: Readonly<Record<RoleCode, string>>;
  readonly scopes: Readonly<Record<DataScope, string>>;
  readonly scopeDescriptions: Readonly<Record<DataScope, string>>;

  readonly audit: {
    readonly heading: string;
    readonly immutableNote: string;
    readonly empty: string;
    readonly entry: (actor: string, date: string) => string;
  };

  readonly errors: {
    readonly loadTitle: string;
    readonly loadBody: string;
    readonly actionFailed: string;
    readonly scopeRequired: string;
    readonly alreadyAssigned: string;
    readonly retry: string;
  };
}

const ar: AccessContent = {
  nav: {
    label: 'إدارة الأدوار والصلاحيات',
    permissions: 'مصفوفة الصلاحيات',
    users: 'المستخدمون والأدوار',
  },

  matrix: {
    documentTitle: 'مصفوفة الصلاحيات — منصة الخبراء',
    title: 'مصفوفة الأدوار والصلاحيات',
    intro: 'اربط كل دور بصلاحياته المتاحة ونطاق بياناته، من مكان واحد وبمنطق موحّد.',
    unapprovedTitle: 'هذه المصفوفة مسوّدة عمل ولم تُعتمد بعد',
    unapprovedBody:
      'لم تصل بعد مصفوفة الأدوار والصلاحيات المعتمدة، فالشبكة تبدأ فارغة عمدًا ولم تُملأ بافتراضات. ما تحدده هنا هو المصدر حتى تُعتمد.',
    labelsNote: (count) =>
      `⚠️ ${arNumber(count)} من مسميات الخصائص مكتوبة بحسب ما تؤديه الخاصية فعليًا في المنصة، وتحتاج إلى مطابقتها مع صياغة وثيقة المتطلبات.`,
    rolesFixedNote: 'الأدوار الستة معتمدة في وثيقة المتطلبات، ولا تُضاف أو تُحذف من هنا.',
    noDirectGrantNote:
      'لا تُمنح أي صلاحية لمستخدم بعينه؛ تُمنح حصرًا عبر دور. لذلك لا يوجد استثناء فردي في هذه الشاشة.',
    capabilityLabel: 'القدرة',
    capabilityOption: (code, count) =>
      `${AR_CAPABILITY_NAMES[code] ?? code} — ${arNumber(count)} خاصية`,
    capabilityNames: AR_CAPABILITY_NAMES,
    capabilityHint: 'تُضبط الصلاحيات قدرةً بقدرة، لأن كل صلاحية هي خاصية داخل قدرة واحدة.',
    searchScopeNote: 'البحث يشمل كل القدرات. أفرغ حقل البحث للعودة إلى قدرة واحدة.',
    featureLabel: 'الخاصية',
    searchLabel: 'بحث في الصلاحيات',
    searchPlaceholder: 'رمز الخاصية أو القدرة',
    grantedLabel: (role, feature) => `منح ${feature} للدور ${role}`,
    scopeLabel: (role, feature) => `نطاق بيانات ${feature} للدور ${role}`,
    grantedCount: (granted, total) => `مُنحت ${arNumber(granted)} من ${arNumber(total)} صلاحية`,
    empty: 'لا توجد صلاحيات مطابقة للبحث.',
  },

  users: {
    documentTitle: 'المستخدمون والأدوار — منصة الخبراء',
    title: 'المستخدمون والأدوار',
    intro: 'أسند دورًا واحدًا أو أكثر لكل مستخدم، ليصل كل شخص لما يخص عمله دون صلاحيات زائدة.',
    searchLabel: 'بحث بالاسم أو البريد',
    searchPlaceholder: 'الاسم أو البريد الإلكتروني',
    noRoles: 'لا توجد أدوار مسندة — لا وصول.',
    assignHeading: 'إسناد دور',
    roleLegend: 'اختر الدور',
    centreLabel: 'المركز',
    centreHint: 'دور منسق المركز مقيَّد بمركز واحد، ولا يُسند بدونه.',
    assign: 'إسناد',
    revoke: (role) => `سحب دور ${role}`,
    assignedBy: (name, date) => `أسنده ${name} في ${date}`,
    scopedTo: (centre) => `مقيَّد بـ${centre}`,
    empty: 'لا يوجد مستخدمون مطابقون.',
    fastHeading: 'بياناته في الأكاديمية المالية',
    fastNote: 'للاطلاع فقط. الأدوار الممنوحة هنا هي وحدها ما يحدد صلاحياته في المنصة.',
    fastNever: 'لم تُقرأ بياناته بعد؛ تُقرأ عند أول دخول له إلى المنصة.',
    fastIdNumber: 'رقم الهوية',
    fastOrganization: 'الجهة',
    fastJobTitle: 'المسمى الوظيفي',
    fastEmployee: 'منسوب للأكاديمية',
    fastRoles: 'أدواره في الأكاديمية المالية',
    fastPowers: 'صلاحيات الخبراء المسجَّلة لديه',
    fastSynced: (date) => `آخر تحديث للبيانات: ${date}`,
    fastPowerNames: {
      corrector: 'مصحِّح',
      reviewer: 'مراجع',
      question_author: 'كاتب أسئلة',
    },
  },

  roles: {
    trainer: 'مدرب',
    staff: 'موظف إدارة المدربين',
    manager: 'مدير إدارة المدربين',
    centre_coordinator: 'منسق مركز',
    system_administrator: 'مشرف النظام',
    executive: 'الإدارة العليا',
    individual: 'مستخدم مسجل',
  },
  scopes: { all: 'كل البيانات', own: 'بياناته فقط', centre: 'نطاق مركزه' },
  scopeDescriptions: {
    all: 'وصول على مستوى المنصة.',
    own: 'السجلات التي يملكها المستخدم نفسه.',
    centre: 'السجلات التابعة لمركزه فقط.',
  },

  audit: {
    heading: 'سجل التدقيق',
    immutableNote: 'كل تغيير على الأدوار أو الصلاحيات يُسجَّل هنا، ولا يُعدَّل ولا يُحذف.',
    empty: 'لا توجد تغييرات بعد.',
    entry: (actor, date) => `${actor} — ${date}`,
  },

  errors: {
    loadTitle: 'تعذّر تحميل البيانات',
    loadBody: 'حدث خطأ أثناء التحميل. يُرجى المحاولة مرة أخرى.',
    actionFailed: 'تعذّر تنفيذ الإجراء. يُرجى المحاولة مرة أخرى.',
    scopeRequired: 'يجب اختيار المركز عند إسناد دور منسق مركز.',
    alreadyAssigned: 'هذا الدور مُسند لهذا المستخدم بالفعل.',
    retry: 'إعادة المحاولة',
  },
};

const en: AccessContent = {
  nav: {
    label: 'Roles and permissions administration',
    permissions: 'Permission matrix',
    users: 'Users & roles',
  },

  matrix: {
    documentTitle: 'Permission matrix — Expert Hub',
    title: 'Roles & permissions matrix',
    intro:
      'Bind each role to the permissions it may hold and the data it may see, from one place with one logic.',
    unapprovedTitle: 'This matrix is a working draft and is not approved',
    unapprovedBody:
      'The approved role × permission matrix has not arrived, so the grid starts empty on purpose rather than filled with assumptions. What you set here is the source until it is approved.',
    labelsNote: (count) =>
      `⚠️ ${count} feature names describe what each feature does in the platform, and still need matching against the requirements document’s own wording.`,
    rolesFixedNote:
      'The six roles are approved in the requirements document and are not added or removed here.',
    noDirectGrantNote:
      'No permission is granted to an individual user; grants are made exclusively through roles. There is therefore no per-user exception on this screen.',
    capabilityLabel: 'Capability',
    capabilityOption: (code, count) => `${EN_CAPABILITY_NAMES[code] ?? code} — ${count} features`,
    capabilityNames: EN_CAPABILITY_NAMES,
    capabilityHint:
      'Permissions are configured one capability at a time, because a permission is one feature within one capability.',
    searchScopeNote: 'Search covers every capability. Clear it to return to a single one.',
    featureLabel: 'Feature',
    searchLabel: 'Search permissions',
    searchPlaceholder: 'Feature or capability code',
    grantedLabel: (role, feature) => `Grant ${feature} to ${role}`,
    scopeLabel: (role, feature) => `Data scope of ${feature} for ${role}`,
    grantedCount: (granted, total) => `${granted} of ${total} permissions granted`,
    empty: 'No permissions match this search.',
  },

  users: {
    documentTitle: 'Users & roles — Expert Hub',
    title: 'Users & roles',
    intro:
      'Assign one or more roles to each user, so everyone reaches their own work and nothing more.',
    searchLabel: 'Search by name or email',
    searchPlaceholder: 'Name or email address',
    noRoles: 'No roles assigned — no access.',
    assignHeading: 'Assign a role',
    roleLegend: 'Choose the role',
    centreLabel: 'Centre',
    centreHint:
      'The centre coordinator role is scoped to one centre and is not assigned without it.',
    assign: 'Assign',
    revoke: (role) => `Revoke ${role}`,
    assignedBy: (name, date) => `Assigned by ${name} on ${date}`,
    scopedTo: (centre) => `Scoped to ${centre}`,
    fastHeading: 'Their Financial Academy record',
    fastNote:
      'For reference only. Only the roles granted here decide what they can do on the platform.',
    fastNever: 'Not read yet — it is read the first time they sign in to the platform.',
    fastIdNumber: 'Identity number',
    fastOrganization: 'Organization',
    fastJobTitle: 'Job title',
    fastEmployee: 'Academy staff',
    fastRoles: 'Their Financial Academy roles',
    fastPowers: 'Expert powers on record',
    fastSynced: (date) => `Last updated ${date}`,
    fastPowerNames: {
      corrector: 'Corrector',
      reviewer: 'Reviewer',
      question_author: 'Question author',
    },
    empty: 'No matching users.',
  },

  roles: {
    trainer: 'Trainer',
    staff: 'Trainer Management staff',
    manager: 'Trainer Management manager',
    centre_coordinator: 'Centre coordinator',
    system_administrator: 'System Administrator',
    executive: 'Senior management',
    individual: 'Individual',
  },
  scopes: { all: 'All data', own: 'Own records only', centre: 'Their centre' },
  scopeDescriptions: {
    all: 'Platform-wide access.',
    own: 'Only records the user owns.',
    centre: 'Only records belonging to their centre.',
  },

  audit: {
    heading: 'Audit trail',
    immutableNote:
      'Every role or permission change is recorded here, and is never edited or deleted.',
    empty: 'No changes yet.',
    entry: (actor, date) => `${actor} — ${date}`,
  },

  errors: {
    loadTitle: 'Could not load the data',
    loadBody: 'Something went wrong while loading. Please try again.',
    actionFailed: 'The action could not be completed. Please try again.',
    scopeRequired: 'Choose a centre when assigning the centre coordinator role.',
    alreadyAssigned: 'This user already holds that role.',
    retry: 'Try again',
  },
};

const CONTENT: Record<Locale, AccessContent> = { ar, en };

export function getAccessContent(locale: Locale): AccessContent {
  return CONTENT[locale] ?? CONTENT.ar;
}
