import type { ExpertHubApiError } from '../../shared/services/apiClient';
import type { AccessService } from './accessService';
import {
  ROLE_CODES,
  validateAssignRole,
  type AccessAuditEntryDto,
  type AssignedRoleDto,
  type AssignRoleInput,
  type CentreDto,
  type DataScope,
  type PermissionDto,
  type PermissionMatrixDto,
  type RoleCode,
  type RoleDto,
  type RolePermissionDto,
  type UserAccessDto,
} from './access.types';

/**
 * Versioned **mock** provider for CAP-08.
 *
 * The permission list below is **not invented**: all 58 entries are the
 * feature codes `BRD-TRN-001` itself defines across CAP-01…CAP-10, extracted
 * from the document. §8.8.4 makes the permission list exactly the feature list,
 * so this is the real shape of the matrix — 58 rows × 6 roles.
 *
 * ⚠️ **Every grant starts ungranted and `modelStatus` is `unapproved`.**
 * `DM-GAP-07` is the approved role×permission contents, and it does not exist.
 * Seeding a plausible matrix would have turned a gap into an invented policy —
 * so the grid ships empty and says why, and the System Administrator fills it.
 *
 * ⚠️ **Labels are extracted from the BRD's PDF tables and are wrapped**, so most
 * are truncated fragments. The **codes** are verified; the wording is not, which
 * is what `labelNeedsVerification` records.
 *
 * ⚠️ MOCK DATA (clearly labelled). ⚠️ Deterministic clock.
 */

/** ⚠️ MOCK — the fixed "today". */
const MOCK_NOW = '2026-08-27T09:00:00Z';

/** §8.8.5 — the six approved roles, with the BRD's own descriptions. */
const ROLES: readonly RoleDto[] = [
  {
    roleCode: 'trainer',
    nameAr: 'مدرب',
    nameEn: 'Trainer',
    descriptionAr:
      'يدير ملفه الشخصي، ويتابع طلباته، وإسناداته، ومستحقاته، ويستخدم الخدمات المخصصة له.',
    descriptionEn: 'Manages their own profile, applications, engagements and entitlements.',
    isSystem: true,
  },
  {
    roleCode: 'staff',
    nameAr: 'موظف إدارة المدربين',
    nameEn: 'Trainer Management staff',
    descriptionAr:
      'ينفذ العمليات التشغيلية اليومية عبر دورة حياة المدرب: الفرز، والتقييم، والاعتماد، وإدارة الملفات، والإسناد، ومتابعة المستحقات.',
    descriptionEn:
      'Runs the daily operations across the trainer lifecycle, per the permissions granted.',
    isSystem: true,
  },
  {
    roleCode: 'manager',
    nameAr: 'مدير إدارة المدربين',
    nameEn: 'Trainer Management manager',
    descriptionAr:
      'يشرف على أعمال إدارة المدربين، ويملك جميع صلاحيات الموظف، بالإضافة إلى الاعتماد والقرارات الإشرافية.',
    descriptionEn:
      'Supervises the department; holds every staff permission plus supervisory approvals.',
    isSystem: true,
  },
  {
    roleCode: 'centre_coordinator',
    nameAr: 'منسق مركز',
    nameEn: 'Centre coordinator',
    descriptionAr:
      'ينشئ طلبات إسناد المدربين ويتابعها لمركزه، ويراجع حالة الطلبات والتعيينات ضمن نطاق طلبه فقط.',
    descriptionEn:
      'Raises and tracks assignment requests for their own centre, and sees only their own scope.',
    isSystem: true,
  },
  {
    roleCode: 'system_administrator',
    nameAr: 'مشرف النظام',
    nameEn: 'System Administrator',
    descriptionAr:
      'يدير إعدادات المنصة، والأدوار، والصلاحيات، وقوائم التوجيه، والإعدادات التشغيلية.',
    descriptionEn:
      'Manages platform settings, roles, permissions, routing lists and operational configuration.',
    isSystem: true,
  },
  {
    roleCode: 'executive',
    nameAr: 'الإدارة العليا',
    nameEn: 'Senior management',
    descriptionAr:
      'تطلع على مؤشرات الأداء والتقارير على مستوى المنصة، بصلاحيات القراءة والتصدير فقط دون تنفيذ أي عمليات تشغيلية.',
    descriptionEn:
      'Reads platform-wide indicators and reports. Read and export only — no operational actions.',
    isSystem: true,
  },
  {
    // ⚠️ The baseline role, held by everybody who signs in — an amendment to
    // §8.8.5's six (owner ruling, 2026-09-08). Last, because it is appended to
    // the BRD's order rather than part of it.
    roleCode: 'individual',
    nameAr: 'مستخدم مسجل',
    nameEn: 'Individual',
    descriptionAr:
      'كل من يدخل المنصة. يتصفح صفحته الرئيسية ويقدّم طلباته ويتابعها، ولا يصل إلى ما يخص المدربين المعتمدين.',
    descriptionEn:
      'Everybody who signs in: their home page and their own applications, and nothing that belongs to an accredited trainer.',
    isSystem: true,
  },
];

/**
 * §8.8.4 — one permission per capability feature. These 58 codes are the
 * BRD's own, not a guess.
 */
const PERMISSIONS: readonly PermissionDto[] = [
  {
    permissionId: 'F-0101',
    capabilityCode: 'CAP-01',
    featureCode: 'F-0101',
    nameAr: 'تقديم طلب انضمام',
    nameEn: 'Submit a join application',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0102',
    capabilityCode: 'CAP-01',
    featureCode: 'F-0102',
    nameAr: 'ترشيح متقدّم من داخل الأكاديمية',
    nameEn: 'Nominate an applicant internally',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0104',
    capabilityCode: 'CAP-01',
    featureCode: 'F-0104',
    nameAr: 'طلب إضافة خدمة',
    nameEn: 'Request an added service',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0105',
    capabilityCode: 'CAP-01',
    featureCode: 'F-0105',
    nameAr: 'إدخال بيانات متقدّم نيابةً عنه',
    nameEn: 'Enter applicant details on their behalf',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0201',
    capabilityCode: 'CAP-02',
    featureCode: 'F-0201',
    nameAr: 'الفرز الأولي للطلبات',
    nameEn: 'Initial application screening',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0202',
    capabilityCode: 'CAP-02',
    featureCode: 'F-0202',
    nameAr: 'جدولة المقابلات',
    nameEn: 'Schedule interviews',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0203',
    capabilityCode: 'CAP-02',
    featureCode: 'F-0203',
    nameAr: 'تقييم المقابلة',
    nameEn: 'Evaluate an interview',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0204',
    capabilityCode: 'CAP-02',
    featureCode: 'F-0204',
    nameAr: 'قرار لجنة الاعتماد',
    nameEn: 'Accreditation committee decision',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0205',
    capabilityCode: 'CAP-02',
    featureCode: 'F-0205',
    nameAr: 'إدارة سير الاعتماد',
    nameEn: 'Manage the approval sequence',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0206',
    capabilityCode: 'CAP-02',
    featureCode: 'F-0206',
    nameAr: 'استقبال توقيع المتقدّم',
    nameEn: 'Receive the applicant’s signature',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0301',
    capabilityCode: 'CAP-03',
    featureCode: 'F-0301',
    nameAr: 'إعداد الاتفاقية وتفعيلها',
    nameEn: 'Prepare and activate an agreement',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0302',
    capabilityCode: 'CAP-03',
    featureCode: 'F-0302',
    nameAr: 'تنبيهات قرب انتهاء الاتفاقية',
    nameEn: 'Agreement expiry alerts',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0303',
    capabilityCode: 'CAP-03',
    featureCode: 'F-0303',
    nameAr: 'تجديد الاتفاقية إداريًا',
    nameEn: 'Renew an agreement administratively',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0304',
    capabilityCode: 'CAP-03',
    featureCode: 'F-0304',
    nameAr: 'تعليق الاتفاقية أو إنهاؤها',
    nameEn: 'Suspend or end an agreement',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0305',
    capabilityCode: 'CAP-03',
    featureCode: 'F-0305',
    nameAr: 'إلحاق خدمة جديدة بالاتفاقية',
    nameEn: 'Add a service to an agreement',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0401',
    capabilityCode: 'CAP-04',
    featureCode: 'F-0401',
    nameAr: 'إنشاء ملف المدرب',
    nameEn: 'Create a trainer profile',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0402',
    capabilityCode: 'CAP-04',
    featureCode: 'F-0402',
    nameAr: 'عرض الملف الشامل للمدرب',
    nameEn: 'View the full trainer profile',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0403',
    capabilityCode: 'CAP-04',
    featureCode: 'F-0403',
    nameAr: 'تحديث المدرب لبياناته',
    nameEn: 'Trainer self-service updates',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0404',
    capabilityCode: 'CAP-04',
    featureCode: 'F-0404',
    nameAr: 'إدارة الخدمات المعتمدة',
    nameEn: 'Manage accredited services',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0405',
    capabilityCode: 'CAP-04',
    featureCode: 'F-0405',
    nameAr: 'عرض سجل البرامج المنفّذة',
    nameEn: 'View delivered programme history',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0406',
    capabilityCode: 'CAP-04',
    featureCode: 'F-0406',
    nameAr: 'عرض تقييمات المدرب',
    nameEn: 'View trainer ratings',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0407',
    capabilityCode: 'CAP-04',
    featureCode: 'F-0407',
    nameAr: 'عرض طلبات المدربين',
    nameEn: 'View trainers’ applications',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0408',
    capabilityCode: 'CAP-04',
    featureCode: 'F-0408',
    nameAr: 'عرض بيانات المدرب الأساسية',
    nameEn: 'View core trainer data',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0409',
    capabilityCode: 'CAP-04',
    featureCode: 'F-0409',
    nameAr: 'كشف تعارض الارتباطات',
    nameEn: 'Detect engagement conflicts',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0410',
    capabilityCode: 'CAP-04',
    featureCode: 'F-0410',
    nameAr: 'البحث في قاعدة المدربين',
    nameEn: 'Search the trainer base',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0411',
    capabilityCode: 'CAP-04',
    featureCode: 'F-0411',
    nameAr: 'ضبط حالة ملف المدرب',
    nameEn: 'Set a trainer’s file status',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0412',
    capabilityCode: 'CAP-04',
    featureCode: 'F-0412',
    nameAr: 'تغذية محرك المطابقة ببيانات الملف',
    nameEn: 'Feed the matching engine from the profile',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0413',
    capabilityCode: 'CAP-04',
    featureCode: 'F-0413',
    nameAr: 'إدارة سجل المدرب لدى الأكاديمية',
    nameEn: 'Manage the trainer’s Academy record',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0501',
    capabilityCode: 'CAP-05',
    featureCode: 'F-0501',
    nameAr: 'إنشاء طلب إسناد',
    nameEn: 'Raise an assignment request',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0502',
    capabilityCode: 'CAP-05',
    featureCode: 'F-0502',
    nameAr: 'الترشيح الآلي للمدربين',
    nameEn: 'Automatic candidate matching',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0503',
    capabilityCode: 'CAP-05',
    featureCode: 'F-0503',
    nameAr: 'البحث اليدوي وترشيح المدربين',
    nameEn: 'Search and nominate candidates manually',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0504',
    capabilityCode: 'CAP-05',
    featureCode: 'F-0504',
    nameAr: 'موافقة المركز على المرشحين',
    nameEn: 'Centre approval of candidates',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0505',
    capabilityCode: 'CAP-05',
    featureCode: 'F-0505',
    nameAr: 'إدارة عروض الإسناد',
    nameEn: 'Manage assignment offers',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0506',
    capabilityCode: 'CAP-05',
    featureCode: 'F-0506',
    nameAr: 'رفع المادة التدريبية واعتمادها',
    nameEn: 'Upload and approve training material',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0507',
    capabilityCode: 'CAP-05',
    featureCode: 'F-0507',
    nameAr: 'متابعة تنفيذ الارتباط',
    nameEn: 'Follow up engagement execution',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0508',
    capabilityCode: 'CAP-05',
    featureCode: 'F-0508',
    nameAr: 'إلغاء ارتباط مدرب',
    nameEn: 'De-link a trainer from an engagement',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0601',
    capabilityCode: 'CAP-06',
    featureCode: 'F-0601',
    nameAr: 'عرض مستحقاتي',
    nameEn: 'View my entitlements',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0602',
    capabilityCode: 'CAP-06',
    featureCode: 'F-0602',
    nameAr: 'عرض مستحقات المدربين',
    nameEn: 'View trainers’ entitlements',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0603',
    capabilityCode: 'CAP-06',
    featureCode: 'F-0603',
    nameAr: 'ربط المستحق بالاتفاقية والبرنامج',
    nameEn: 'Link an entitlement to its agreement and programme',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0701',
    capabilityCode: 'CAP-07',
    featureCode: 'F-0701',
    nameAr: 'استقبال الإشعارات عبر القنوات',
    nameEn: 'Receive notifications across channels',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0702',
    capabilityCode: 'CAP-07',
    featureCode: 'F-0702',
    nameAr: 'إدارة مصفوفة الإشعارات',
    nameEn: 'Manage the notification matrix',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0703',
    capabilityCode: 'CAP-07',
    featureCode: 'F-0703',
    nameAr: 'إدارة قوالب الرسائل',
    nameEn: 'Manage message templates',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0704',
    capabilityCode: 'CAP-07',
    featureCode: 'F-0704',
    nameAr: 'إدارة المهل الزمنية',
    nameEn: 'Manage deadlines',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0705',
    capabilityCode: 'CAP-07',
    featureCode: 'F-0705',
    nameAr: 'عرض سجل الإشعارات',
    nameEn: 'View the notification log',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0801',
    capabilityCode: 'CAP-08',
    featureCode: 'F-0801',
    nameAr: 'إدارة مصفوفة الصلاحيات',
    nameEn: 'Manage the permission matrix',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0802',
    capabilityCode: 'CAP-08',
    featureCode: 'F-0802',
    nameAr: 'إسناد الأدوار للمستخدمين',
    nameEn: 'Assign roles to users',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0805',
    capabilityCode: 'CAP-08',
    featureCode: 'F-0805',
    nameAr: 'عرض سجل التدقيق',
    nameEn: 'View the audit log',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0806',
    capabilityCode: 'CAP-08',
    featureCode: 'F-0806',
    nameAr: 'إدارة الحساب الشخصي',
    nameEn: 'Manage your own account',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0901',
    capabilityCode: 'CAP-09',
    featureCode: 'F-0901',
    nameAr: 'لوحة مؤشرات إدارة المدربين',
    nameEn: 'Trainer-management dashboard',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0902',
    capabilityCode: 'CAP-09',
    featureCode: 'F-0902',
    nameAr: 'لوحة مؤشرات المدير',
    nameEn: 'Manager dashboard',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0903',
    capabilityCode: 'CAP-09',
    featureCode: 'F-0903',
    nameAr: 'لوحة مؤشرات منسق المركز',
    nameEn: 'Centre coordinator dashboard',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0904',
    capabilityCode: 'CAP-09',
    featureCode: 'F-0904',
    nameAr: 'لوحة الإدارة العليا',
    nameEn: 'Executive dashboard',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0905',
    capabilityCode: 'CAP-09',
    featureCode: 'F-0905',
    nameAr: 'التقارير الدورية القابلة للتصدير',
    nameEn: 'Exportable periodic reports',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-0906',
    capabilityCode: 'CAP-09',
    featureCode: 'F-0906',
    nameAr: 'المؤشرات الشخصية للمدرب',
    nameEn: 'A trainer’s personal metrics',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-1001',
    capabilityCode: 'CAP-10',
    featureCode: 'F-1001',
    nameAr: 'صفحة الهبوط العامة',
    nameEn: 'Public landing page',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-1002',
    capabilityCode: 'CAP-10',
    featureCode: 'F-1002',
    nameAr: 'دليل المدربين العام',
    nameEn: 'Public trainer directory',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-1003',
    capabilityCode: 'CAP-10',
    featureCode: 'F-1003',
    nameAr: 'موافقة المدرب على الظهور العام',
    nameEn: 'Trainer consent to public listing',
    labelNeedsVerification: true,
  },
  {
    permissionId: 'F-1004',
    capabilityCode: 'CAP-10',
    featureCode: 'F-1004',
    nameAr: 'الملف العام للمدرب',
    nameEn: 'Public trainer profile',
    labelNeedsVerification: true,
  },
];

/** ⚠️ MOCK users, to exercise `F-0802`. */
const SEED_USERS: readonly UserAccessDto[] = [
  {
    userId: 'usr-001',
    displayName: 'منى الشهراني',
    email: 'm.alshahrani@fa.gov.sa',
    isActive: true,
    roles: [{ roleCode: 'staff', assignedByName: 'مشرف النظام', assignedAt: MOCK_NOW }],
    // Read at her last sign-in (`P-227`). Note she is staff in FAST and holds
    // no expert power there — exactly the context an administrator wants
    // before granting anything here, and still not a grant.
    fastProfile: {
      idNumber: '1105419996',
      organization: 'الأكاديمية المالية',
      jobTitle: 'أخصائي تدريب',
      isEmployee: true,
      fastRoles: ['مستخدم مسجل تابع لجهة'],
      expertPowers: [],
      lastSyncedAt: MOCK_NOW,
    },
  },
  {
    userId: 'usr-002',
    displayName: 'عبدالعزيز التميمي',
    email: 'a.altamimi@fa.gov.sa',
    isActive: true,
    roles: [{ roleCode: 'manager', assignedByName: 'مشرف النظام', assignedAt: MOCK_NOW }],
  },
  {
    userId: 'usr-003',
    displayName: 'لطيفة العمار',
    email: 'l.alammar@fa.gov.sa',
    isActive: true,
    fastProfile: {
      idNumber: '1000499630',
      organization: 'الأكاديمية المالية',
      jobTitle: null,
      isEmployee: true,
      fastRoles: ['منسق مركز تدريب'],
      expertPowers: ['reviewer', 'question_author'],
      lastSyncedAt: MOCK_NOW,
    },
    // The one role that carries a scope — §8.8.5.
    roles: [
      {
        roleCode: 'centre_coordinator',
        scopeRef: 'ctr-riyadh',
        scopeName: 'مركز الرياض',
        assignedByName: 'مشرف النظام',
        assignedAt: MOCK_NOW,
      },
    ],
  },
  {
    // ⚠️ No `fastProfile`: nobody has read his record yet. The screen must
    // say that, not show an empty panel that reads as "FAST has nothing".
    userId: 'usr-004',
    displayName: 'فيصل الدوسري',
    email: 'f.aldosari@fa.gov.sa',
    isActive: true,
    roles: [],
  },
];

/** ⚠️ MOCK centres, for the coordinator's scope picker (§8.8.5). */
export const MOCK_CENTRES: readonly CentreDto[] = [
  { centreId: 'ctr-riyadh', nameAr: 'مركز الرياض', nameEn: 'Riyadh centre' },
  { centreId: 'ctr-jeddah', nameAr: 'مركز جدة', nameEn: 'Jeddah centre' },
  { centreId: 'ctr-dammam', nameAr: 'مركز الدمام', nameEn: 'Dammam centre' },
];

export interface MockAccessProviderOptions {
  readonly latencyMs?: number;
  readonly failWith?: ExpertHubApiError;
  readonly now?: string;
  readonly actorName?: string;
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockAccessProvider(options: MockAccessProviderOptions = {}): AccessService {
  const { latencyMs = 300, failWith, now = MOCK_NOW, actorName = 'مشرف النظام' } = options;

  // `DM-GAP-07` — every cell starts ungranted. Nothing is assumed.
  let grants: RolePermissionDto[] = [];
  let users: UserAccessDto[] = SEED_USERS.map((user) => ({ ...user }));
  let audit: AccessAuditEntryDto[] = [];
  let auditCounter = 0;

  /** `BR-0806` — append-only. Nothing in this file removes or edits an entry. */
  function record(kind: AccessAuditEntryDto['kind'], summaryAr: string, summaryEn: string): void {
    auditCounter += 1;
    audit = [
      {
        entryId: `aud-${String(auditCounter).padStart(4, '0')}`,
        kind,
        actorName,
        summaryAr,
        summaryEn,
        occurredAt: now,
      },
      ...audit,
    ];
  }

  function matrix(): PermissionMatrixDto {
    return {
      roles: ROLES,
      permissions: PERMISSIONS,
      grants,
      modelStatus: 'unapproved',
      unverifiedLabelCount: PERMISSIONS.filter((p) => p.labelNeedsVerification).length,
    };
  }

  function findUser(userId: string): UserAccessDto | undefined {
    return users.find((user) => user.userId === userId);
  }

  return {
    async getPermissionMatrix() {
      await delay(latencyMs);
      return failWith != null ? { ok: false, error: failWith } : { ok: true, value: matrix() };
    },

    async setGrant(
      roleCode: RoleCode,
      permissionId: string,
      granted: boolean,
      dataScope: DataScope | null
    ) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      if (!ROLE_CODES.includes(roleCode)) {
        return { ok: false, error: { status: 400, message: 'Unknown role.' } };
      }
      const permission = PERMISSIONS.find((p) => p.permissionId === permissionId);
      if (permission == null) {
        return { ok: false, error: { status: 404, message: 'Unknown permission.' } };
      }
      grants = [
        ...grants.filter(
          (grant) => !(grant.roleCode === roleCode && grant.permissionId === permissionId)
        ),
        // §8.8.3 — an ungranted permission has no scope to carry.
        { roleCode, permissionId, granted, dataScope: granted ? (dataScope ?? 'all') : null },
      ];
      record(
        'grant-changed',
        `${granted ? 'مُنحت' : 'سُحبت'} صلاحية ${permission.featureCode} للدور ${roleCode}`,
        `${granted ? 'Granted' : 'Revoked'} ${permission.featureCode} for ${roleCode}`
      );
      return { ok: true, value: matrix() };
    },

    async listUsers(query: string) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const term = query.trim().toLowerCase();
      return {
        ok: true,
        value: users.filter(
          (user) =>
            term === '' ||
            user.displayName.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term)
        ),
      };
    },

    async listCentres() {
      await delay(latencyMs);
      return failWith != null
        ? { ok: false, error: failWith }
        : { ok: true, value: [...MOCK_CENTRES] };
    },

    async assignRole(userId: string, input: AssignRoleInput) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const user = findUser(userId);
      if (user == null) {
        return { ok: false, error: { status: 404, message: 'User not found.' } };
      }
      if (validateAssignRole(input, user.roles).length > 0) {
        return { ok: false, error: { status: 400, message: 'Invalid role assignment.' } };
      }
      const assigned: AssignedRoleDto =
        input.roleCode === 'centre_coordinator'
          ? {
              roleCode: 'centre_coordinator',
              scopeRef: input.scopeRef,
              scopeName:
                MOCK_CENTRES.find((centre) => centre.centreId === input.scopeRef)?.nameAr ??
                input.scopeRef,
              assignedByName: actorName,
              assignedAt: now,
            }
          : { roleCode: input.roleCode, assignedByName: actorName, assignedAt: now };
      const updated: UserAccessDto = { ...user, roles: [...user.roles, assigned] };
      users = users.map((candidate) => (candidate.userId === userId ? updated : candidate));
      record(
        'role-assigned',
        `أُسند الدور ${input.roleCode} إلى ${user.displayName}`,
        `Assigned ${input.roleCode} to ${user.displayName}`
      );
      return { ok: true, value: updated };
    },

    async revokeRole(userId: string, roleCode: RoleCode) {
      await delay(latencyMs);
      if (failWith != null) {
        return { ok: false, error: failWith };
      }
      const user = findUser(userId);
      if (user == null) {
        return { ok: false, error: { status: 404, message: 'User not found.' } };
      }
      const updated: UserAccessDto = {
        ...user,
        roles: user.roles.filter((role) => role.roleCode !== roleCode),
      };
      users = users.map((candidate) => (candidate.userId === userId ? updated : candidate));
      record(
        'role-revoked',
        `سُحب الدور ${roleCode} من ${user.displayName}`,
        `Revoked ${roleCode} from ${user.displayName}`
      );
      return { ok: true, value: updated };
    },

    async listAuditTrail() {
      await delay(latencyMs);
      return failWith != null ? { ok: false, error: failWith } : { ok: true, value: [...audit] };
    },
  };
}

export { MOCK_NOW, ROLES as MOCK_ROLES, PERMISSIONS as MOCK_PERMISSIONS };
