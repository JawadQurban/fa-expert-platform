using ExpertHub.Core.Domain;

namespace ExpertHub.Infrastructure.Persistence;

/// <summary>
/// BRD facts seeded by migration — NOT the matrix. `DM-GAP-07` (the approved
/// role×permission contents) stays empty on purpose; what is seeded here is
/// what the BRD itself fixes and every screen needs to exist at all:
/// </summary>
/// <remarks>
/// <para>
/// <b>The six roles</b> of §8.8.5, with the BRD's own bilingual names and
/// descriptions, and <b>the 58 permissions</b> — §8.8.4 makes the permission
/// list exactly the BRD's feature list. Extracted from the frontend's
/// `mockAccessProvider.ts` (the contract's own copy of the same BRD data) by
/// script, not retyped; the Arabic labels carry `LabelNeedsVerification`
/// because the PDF's wrapped tables may have truncated them (P-139).
/// </para>
/// <para>
/// Stable ids on purpose: seeds are identity data referenced by grants, so
/// they never renumber. Roles are 1–6 in the BRD's own order; permissions are
/// 1–58 in feature-code order.
/// </para>
/// </remarks>
internal static class AccessSeedData
{
    internal static readonly object[] Roles =
    [
        new
        {
            // ⚠️ Seventh, and an amendment to §8.8.5's six — owner ruling of
            // 2026-09-08. Named for the Academy's own `Individual` role so
            // both systems say the same word about the same person.
            RoleId = 7,
            Code = RoleCode.Individual,
            NameAr = "مستخدم مسجل",
            NameEn = "Individual",
            DescriptionAr = "كل من يدخل المنصة. يتصفح صفحته الرئيسية ويقدّم طلباته ويتابعها، ولا يصل إلى ما يخص المدربين المعتمدين.",
            DescriptionEn = "Everybody who signs in: their home page and their own applications, and nothing that belongs to an accredited trainer.",
            IsSystem = true,
        },
        new
        {
            RoleId = 1,
            Code = RoleCode.Trainer,
            NameAr = "مدرب",
            NameEn = "Trainer",
            DescriptionAr = "يدير ملفه الشخصي، ويتابع طلباته، وإسناداته، ومستحقاته، ويستخدم الخدمات المخصصة له.",
            DescriptionEn = "Manages their own profile, applications, engagements and entitlements.",
            IsSystem = true,
        },
        new
        {
            RoleId = 2,
            Code = RoleCode.Staff,
            NameAr = "موظف إدارة المدربين",
            NameEn = "Trainer Management staff",
            DescriptionAr = "ينفذ العمليات التشغيلية اليومية عبر دورة حياة المدرب: الفرز، والتقييم، والاعتماد، وإدارة الملفات، والإسناد، ومتابعة المستحقات.",
            DescriptionEn = "Runs the daily operations across the trainer lifecycle, per the permissions granted.",
            IsSystem = true,
        },
        new
        {
            RoleId = 3,
            Code = RoleCode.Manager,
            NameAr = "مدير إدارة المدربين",
            NameEn = "Trainer Management manager",
            DescriptionAr = "يشرف على أعمال إدارة المدربين، ويملك جميع صلاحيات الموظف، بالإضافة إلى الاعتماد والقرارات الإشرافية.",
            DescriptionEn = "Supervises the department; holds every staff permission plus supervisory approvals.",
            IsSystem = true,
        },
        new
        {
            RoleId = 4,
            Code = RoleCode.CentreCoordinator,
            NameAr = "منسق مركز",
            NameEn = "Centre coordinator",
            DescriptionAr = "ينشئ طلبات إسناد المدربين ويتابعها لمركزه، ويراجع حالة الطلبات والتعيينات ضمن نطاق طلبه فقط.",
            DescriptionEn = "Raises and tracks assignment requests for their own centre, and sees only their own scope.",
            IsSystem = true,
        },
        new
        {
            RoleId = 5,
            Code = RoleCode.SystemAdministrator,
            NameAr = "مشرف النظام",
            NameEn = "System Administrator",
            DescriptionAr = "يدير إعدادات المنصة، والأدوار، والصلاحيات، وقوائم التوجيه، والإعدادات التشغيلية.",
            DescriptionEn = "Manages platform settings, roles, permissions, routing lists and operational configuration.",
            IsSystem = true,
        },
        new
        {
            RoleId = 6,
            Code = RoleCode.Executive,
            NameAr = "الإدارة العليا",
            NameEn = "Senior management",
            DescriptionAr = "تطلع على مؤشرات الأداء والتقارير على مستوى المنصة، بصلاحيات القراءة والتصدير فقط دون تنفيذ أي عمليات تشغيلية.",
            DescriptionEn = "Reads platform-wide indicators and reports. Read and export only — no operational actions.",
            IsSystem = true,
        },
    ];

    internal static readonly object[] Permissions =
    [
        new { PermissionId = 1, CapabilityCode = "CAP-01", FeatureCode = "F-0101", NameAr = "تقديم طلب انضمام", NameEn = "Submit a join application", LabelNeedsVerification = true },
        new { PermissionId = 2, CapabilityCode = "CAP-01", FeatureCode = "F-0102", NameAr = "ترشيح متقدّم من داخل الأكاديمية", NameEn = "Nominate an applicant internally", LabelNeedsVerification = true },
        new { PermissionId = 3, CapabilityCode = "CAP-01", FeatureCode = "F-0104", NameAr = "طلب إضافة خدمة", NameEn = "Request an added service", LabelNeedsVerification = true },
        new { PermissionId = 4, CapabilityCode = "CAP-01", FeatureCode = "F-0105", NameAr = "إدخال بيانات متقدّم نيابةً عنه", NameEn = "Enter applicant details on their behalf", LabelNeedsVerification = true },
        new { PermissionId = 5, CapabilityCode = "CAP-02", FeatureCode = "F-0201", NameAr = "الفرز الأولي للطلبات", NameEn = "Initial application screening", LabelNeedsVerification = true },
        new { PermissionId = 6, CapabilityCode = "CAP-02", FeatureCode = "F-0202", NameAr = "جدولة المقابلات", NameEn = "Schedule interviews", LabelNeedsVerification = true },
        new { PermissionId = 7, CapabilityCode = "CAP-02", FeatureCode = "F-0203", NameAr = "تقييم المقابلة", NameEn = "Evaluate an interview", LabelNeedsVerification = true },
        new { PermissionId = 8, CapabilityCode = "CAP-02", FeatureCode = "F-0204", NameAr = "قرار لجنة الاعتماد", NameEn = "Accreditation committee decision", LabelNeedsVerification = true },
        new { PermissionId = 9, CapabilityCode = "CAP-02", FeatureCode = "F-0205", NameAr = "إدارة سير الاعتماد", NameEn = "Manage the approval sequence", LabelNeedsVerification = true },
        new { PermissionId = 10, CapabilityCode = "CAP-02", FeatureCode = "F-0206", NameAr = "استقبال توقيع المتقدّم", NameEn = "Receive the applicant’s signature", LabelNeedsVerification = true },
        new { PermissionId = 11, CapabilityCode = "CAP-03", FeatureCode = "F-0301", NameAr = "إعداد الاتفاقية وتفعيلها", NameEn = "Prepare and activate an agreement", LabelNeedsVerification = true },
        new { PermissionId = 12, CapabilityCode = "CAP-03", FeatureCode = "F-0302", NameAr = "تنبيهات قرب انتهاء الاتفاقية", NameEn = "Agreement expiry alerts", LabelNeedsVerification = true },
        new { PermissionId = 13, CapabilityCode = "CAP-03", FeatureCode = "F-0303", NameAr = "تجديد الاتفاقية إداريًا", NameEn = "Renew an agreement administratively", LabelNeedsVerification = true },
        new { PermissionId = 14, CapabilityCode = "CAP-03", FeatureCode = "F-0304", NameAr = "تعليق الاتفاقية أو إنهاؤها", NameEn = "Suspend or end an agreement", LabelNeedsVerification = true },
        new { PermissionId = 15, CapabilityCode = "CAP-03", FeatureCode = "F-0305", NameAr = "إلحاق خدمة جديدة بالاتفاقية", NameEn = "Add a service to an agreement", LabelNeedsVerification = true },
        new { PermissionId = 16, CapabilityCode = "CAP-04", FeatureCode = "F-0401", NameAr = "إنشاء ملف المدرب", NameEn = "Create a trainer profile", LabelNeedsVerification = true },
        new { PermissionId = 17, CapabilityCode = "CAP-04", FeatureCode = "F-0402", NameAr = "عرض الملف الشامل للمدرب", NameEn = "View the full trainer profile", LabelNeedsVerification = true },
        new { PermissionId = 18, CapabilityCode = "CAP-04", FeatureCode = "F-0403", NameAr = "تحديث المدرب لبياناته", NameEn = "Trainer self-service updates", LabelNeedsVerification = true },
        new { PermissionId = 19, CapabilityCode = "CAP-04", FeatureCode = "F-0404", NameAr = "إدارة الخدمات المعتمدة", NameEn = "Manage accredited services", LabelNeedsVerification = true },
        new { PermissionId = 20, CapabilityCode = "CAP-04", FeatureCode = "F-0405", NameAr = "عرض سجل البرامج المنفّذة", NameEn = "View delivered programme history", LabelNeedsVerification = true },
        new { PermissionId = 21, CapabilityCode = "CAP-04", FeatureCode = "F-0406", NameAr = "عرض تقييمات المدرب", NameEn = "View trainer ratings", LabelNeedsVerification = true },
        new { PermissionId = 22, CapabilityCode = "CAP-04", FeatureCode = "F-0407", NameAr = "عرض طلبات المدربين", NameEn = "View trainers’ applications", LabelNeedsVerification = true },
        new { PermissionId = 23, CapabilityCode = "CAP-04", FeatureCode = "F-0408", NameAr = "عرض بيانات المدرب الأساسية", NameEn = "View core trainer data", LabelNeedsVerification = true },
        new { PermissionId = 24, CapabilityCode = "CAP-04", FeatureCode = "F-0409", NameAr = "كشف تعارض الارتباطات", NameEn = "Detect engagement conflicts", LabelNeedsVerification = true },
        new { PermissionId = 25, CapabilityCode = "CAP-04", FeatureCode = "F-0410", NameAr = "البحث في قاعدة المدربين", NameEn = "Search the trainer base", LabelNeedsVerification = true },
        new { PermissionId = 26, CapabilityCode = "CAP-04", FeatureCode = "F-0411", NameAr = "ضبط حالة ملف المدرب", NameEn = "Set a trainer’s file status", LabelNeedsVerification = true },
        new { PermissionId = 27, CapabilityCode = "CAP-04", FeatureCode = "F-0412", NameAr = "تغذية محرك المطابقة ببيانات الملف", NameEn = "Feed the matching engine from the profile", LabelNeedsVerification = true },
        new { PermissionId = 28, CapabilityCode = "CAP-04", FeatureCode = "F-0413", NameAr = "إدارة سجل المدرب لدى الأكاديمية", NameEn = "Manage the trainer’s Academy record", LabelNeedsVerification = true },
        new { PermissionId = 29, CapabilityCode = "CAP-05", FeatureCode = "F-0501", NameAr = "إنشاء طلب إسناد", NameEn = "Raise an assignment request", LabelNeedsVerification = true },
        new { PermissionId = 30, CapabilityCode = "CAP-05", FeatureCode = "F-0502", NameAr = "الترشيح الآلي للمدربين", NameEn = "Automatic candidate matching", LabelNeedsVerification = true },
        new { PermissionId = 31, CapabilityCode = "CAP-05", FeatureCode = "F-0503", NameAr = "البحث اليدوي وترشيح المدربين", NameEn = "Search and nominate candidates manually", LabelNeedsVerification = true },
        new { PermissionId = 32, CapabilityCode = "CAP-05", FeatureCode = "F-0504", NameAr = "موافقة المركز على المرشحين", NameEn = "Centre approval of candidates", LabelNeedsVerification = true },
        new { PermissionId = 33, CapabilityCode = "CAP-05", FeatureCode = "F-0505", NameAr = "إدارة عروض الإسناد", NameEn = "Manage assignment offers", LabelNeedsVerification = true },
        new { PermissionId = 34, CapabilityCode = "CAP-05", FeatureCode = "F-0506", NameAr = "رفع المادة التدريبية واعتمادها", NameEn = "Upload and approve training material", LabelNeedsVerification = true },
        new { PermissionId = 35, CapabilityCode = "CAP-05", FeatureCode = "F-0507", NameAr = "متابعة تنفيذ الارتباط", NameEn = "Follow up engagement execution", LabelNeedsVerification = true },
        new { PermissionId = 36, CapabilityCode = "CAP-05", FeatureCode = "F-0508", NameAr = "إلغاء ارتباط مدرب", NameEn = "De-link a trainer from an engagement", LabelNeedsVerification = true },
        new { PermissionId = 37, CapabilityCode = "CAP-06", FeatureCode = "F-0601", NameAr = "عرض مستحقاتي", NameEn = "View my entitlements", LabelNeedsVerification = true },
        new { PermissionId = 38, CapabilityCode = "CAP-06", FeatureCode = "F-0602", NameAr = "عرض مستحقات المدربين", NameEn = "View trainers’ entitlements", LabelNeedsVerification = true },
        new { PermissionId = 39, CapabilityCode = "CAP-06", FeatureCode = "F-0603", NameAr = "ربط المستحق بالاتفاقية والبرنامج", NameEn = "Link an entitlement to its agreement and programme", LabelNeedsVerification = true },
        new { PermissionId = 40, CapabilityCode = "CAP-07", FeatureCode = "F-0701", NameAr = "استقبال الإشعارات عبر القنوات", NameEn = "Receive notifications across channels", LabelNeedsVerification = true },
        new { PermissionId = 41, CapabilityCode = "CAP-07", FeatureCode = "F-0702", NameAr = "إدارة مصفوفة الإشعارات", NameEn = "Manage the notification matrix", LabelNeedsVerification = true },
        new { PermissionId = 42, CapabilityCode = "CAP-07", FeatureCode = "F-0703", NameAr = "إدارة قوالب الرسائل", NameEn = "Manage message templates", LabelNeedsVerification = true },
        new { PermissionId = 43, CapabilityCode = "CAP-07", FeatureCode = "F-0704", NameAr = "إدارة المهل الزمنية", NameEn = "Manage deadlines", LabelNeedsVerification = true },
        new { PermissionId = 44, CapabilityCode = "CAP-07", FeatureCode = "F-0705", NameAr = "عرض سجل الإشعارات", NameEn = "View the notification log", LabelNeedsVerification = true },
        new { PermissionId = 45, CapabilityCode = "CAP-08", FeatureCode = "F-0801", NameAr = "إدارة مصفوفة الصلاحيات", NameEn = "Manage the permission matrix", LabelNeedsVerification = true },
        new { PermissionId = 46, CapabilityCode = "CAP-08", FeatureCode = "F-0802", NameAr = "إسناد الأدوار للمستخدمين", NameEn = "Assign roles to users", LabelNeedsVerification = true },
        new { PermissionId = 47, CapabilityCode = "CAP-08", FeatureCode = "F-0805", NameAr = "عرض سجل التدقيق", NameEn = "View the audit log", LabelNeedsVerification = true },
        new { PermissionId = 48, CapabilityCode = "CAP-08", FeatureCode = "F-0806", NameAr = "إدارة الحساب الشخصي", NameEn = "Manage your own account", LabelNeedsVerification = true },
        new { PermissionId = 49, CapabilityCode = "CAP-09", FeatureCode = "F-0901", NameAr = "لوحة مؤشرات إدارة المدربين", NameEn = "Trainer-management dashboard", LabelNeedsVerification = true },
        new { PermissionId = 50, CapabilityCode = "CAP-09", FeatureCode = "F-0902", NameAr = "لوحة مؤشرات المدير", NameEn = "Manager dashboard", LabelNeedsVerification = true },
        new { PermissionId = 51, CapabilityCode = "CAP-09", FeatureCode = "F-0903", NameAr = "لوحة مؤشرات منسق المركز", NameEn = "Centre coordinator dashboard", LabelNeedsVerification = true },
        new { PermissionId = 52, CapabilityCode = "CAP-09", FeatureCode = "F-0904", NameAr = "لوحة الإدارة العليا", NameEn = "Executive dashboard", LabelNeedsVerification = true },
        new { PermissionId = 53, CapabilityCode = "CAP-09", FeatureCode = "F-0905", NameAr = "التقارير الدورية القابلة للتصدير", NameEn = "Exportable periodic reports", LabelNeedsVerification = true },
        new { PermissionId = 54, CapabilityCode = "CAP-09", FeatureCode = "F-0906", NameAr = "المؤشرات الشخصية للمدرب", NameEn = "A trainer’s personal metrics", LabelNeedsVerification = true },
        new { PermissionId = 55, CapabilityCode = "CAP-10", FeatureCode = "F-1001", NameAr = "صفحة الهبوط العامة", NameEn = "Public landing page", LabelNeedsVerification = true },
        new { PermissionId = 56, CapabilityCode = "CAP-10", FeatureCode = "F-1002", NameAr = "دليل المدربين العام", NameEn = "Public trainer directory", LabelNeedsVerification = true },
        new { PermissionId = 57, CapabilityCode = "CAP-10", FeatureCode = "F-1003", NameAr = "موافقة المدرب على الظهور العام", NameEn = "Trainer consent to public listing", LabelNeedsVerification = true },
        new { PermissionId = 58, CapabilityCode = "CAP-10", FeatureCode = "F-1004", NameAr = "الملف العام للمدرب", NameEn = "Public trainer profile", LabelNeedsVerification = true },
    ];
}
