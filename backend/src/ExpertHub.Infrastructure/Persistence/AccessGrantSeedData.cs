using ExpertHub.Core.Domain;

namespace ExpertHub.Infrastructure.Persistence;

/// <summary>
/// ⚠️ **THE DEFAULT ROLE×PERMISSION MATRIX — A DRAFT, NOT THE APPROVED ONE.**
///
/// `DM-GAP-07` is still open: nobody has approved a role×permission matrix,
/// which is why CAP-08 still serves `modelStatus: unapproved` and the screen
/// still says the grid is a working draft.
/// </summary>
/// <remarks>
/// <para>
/// Owner ruling, 2026-08-31: permissions must be enforced at FEATURE level,
/// and a matrix with no rows would have made every internal endpoint 403.
/// So these grants are seeded and enforced — derived, line by line, from the
/// BRD's own role descriptions already seeded on `ROLE` (§8.8.5):
/// </para>
/// <list type="bullet">
/// <item>Trainer — «يدير ملفه الشخصي، ويتابع طلباته، وإسناداته، ومستحقاته»:
/// their own record, at <c>own</c> scope.</item>
/// <item>Staff — «الفرز، والتقييم، والاعتماد، وإدارة الملفات، والإسناد،
/// ومتابعة المستحقات»: the daily operational features.</item>
/// <item>Manager — «يملك جميع صلاحيات الموظف، بالإضافة إلى الاعتماد والقرارات
/// الإشرافية»: literally every Staff grant, plus the committee decision,
/// administrative renewal, agreement state and the audit trail.</item>
/// <item>Centre coordinator — «لمركزه … ضمن نطاق طلبه فقط»: assignment
/// requests at <c>centre</c> scope (`P-140`).</item>
/// <item>System administrator — «إعدادات المنصة، والأدوار، والصلاحيات،
/// وقوائم التوجيه»: configuration, never operations.</item>
/// <item>Executive — «القراءة والتصدير فقط دون تنفيذ أي عمليات تشغيلية»:
/// dashboards and reports, and nothing that acts.</item>
/// </list>
/// <para>
/// <b>Every row here is provisional.</b> The System Administrator changes any
/// of them in the CAP-08 access screen without a deployment (`BR-0203`), and
/// the approved matrix replaces this seed as data. Where the BRD's own
/// description does not decide a feature, it is left UNGRANTED — the fail-closed
/// direction — rather than guessed generously.
/// </para>
/// </remarks>
internal static class AccessGrantSeedData
{
    internal static readonly object[] Grants =
    [
        /* Trainer — 18 features, own scope. */
        new { RoleId = 1, PermissionId = 1, Scope = DataScope.Own }, // F-0101
        new { RoleId = 1, PermissionId = 3, Scope = DataScope.Own }, // F-0104
        new { RoleId = 1, PermissionId = 4, Scope = DataScope.Own }, // F-0105
        new { RoleId = 1, PermissionId = 10, Scope = DataScope.Own }, // F-0206
        new { RoleId = 1, PermissionId = 18, Scope = DataScope.Own }, // F-0403
        new { RoleId = 1, PermissionId = 20, Scope = DataScope.Own }, // F-0405
        new { RoleId = 1, PermissionId = 21, Scope = DataScope.Own }, // F-0406
        new { RoleId = 1, PermissionId = 33, Scope = DataScope.Own }, // F-0505
        new { RoleId = 1, PermissionId = 34, Scope = DataScope.Own }, // F-0506
        new { RoleId = 1, PermissionId = 35, Scope = DataScope.Own }, // F-0507
        new { RoleId = 1, PermissionId = 36, Scope = DataScope.Own }, // F-0508
        new { RoleId = 1, PermissionId = 37, Scope = DataScope.Own }, // F-0601
        new { RoleId = 1, PermissionId = 48, Scope = DataScope.Own }, // F-0806
        new { RoleId = 1, PermissionId = 54, Scope = DataScope.Own }, // F-0906
        new { RoleId = 1, PermissionId = 55, Scope = DataScope.Own }, // F-1001
        new { RoleId = 1, PermissionId = 56, Scope = DataScope.Own }, // F-1002
        new { RoleId = 1, PermissionId = 57, Scope = DataScope.Own }, // F-1003
        new { RoleId = 1, PermissionId = 58, Scope = DataScope.Own }, // F-1004
        /* Staff — 34 features, all scope. */
        new { RoleId = 2, PermissionId = 2, Scope = DataScope.All }, // F-0102
        new { RoleId = 2, PermissionId = 5, Scope = DataScope.All }, // F-0201
        new { RoleId = 2, PermissionId = 6, Scope = DataScope.All }, // F-0202
        new { RoleId = 2, PermissionId = 7, Scope = DataScope.All }, // F-0203
        new { RoleId = 2, PermissionId = 9, Scope = DataScope.All }, // F-0205
        new { RoleId = 2, PermissionId = 11, Scope = DataScope.All }, // F-0301
        new { RoleId = 2, PermissionId = 12, Scope = DataScope.All }, // F-0302
        new { RoleId = 2, PermissionId = 15, Scope = DataScope.All }, // F-0305
        new { RoleId = 2, PermissionId = 16, Scope = DataScope.All }, // F-0401
        new { RoleId = 2, PermissionId = 17, Scope = DataScope.All }, // F-0402
        new { RoleId = 2, PermissionId = 19, Scope = DataScope.All }, // F-0404
        new { RoleId = 2, PermissionId = 20, Scope = DataScope.All }, // F-0405
        new { RoleId = 2, PermissionId = 21, Scope = DataScope.All }, // F-0406
        new { RoleId = 2, PermissionId = 22, Scope = DataScope.All }, // F-0407
        new { RoleId = 2, PermissionId = 23, Scope = DataScope.All }, // F-0408
        new { RoleId = 2, PermissionId = 24, Scope = DataScope.All }, // F-0409
        new { RoleId = 2, PermissionId = 25, Scope = DataScope.All }, // F-0410
        new { RoleId = 2, PermissionId = 26, Scope = DataScope.All }, // F-0411
        new { RoleId = 2, PermissionId = 28, Scope = DataScope.All }, // F-0413
        new { RoleId = 2, PermissionId = 30, Scope = DataScope.All }, // F-0502
        new { RoleId = 2, PermissionId = 31, Scope = DataScope.All }, // F-0503
        new { RoleId = 2, PermissionId = 33, Scope = DataScope.All }, // F-0505
        new { RoleId = 2, PermissionId = 34, Scope = DataScope.All }, // F-0506
        new { RoleId = 2, PermissionId = 35, Scope = DataScope.All }, // F-0507
        new { RoleId = 2, PermissionId = 36, Scope = DataScope.All }, // F-0508
        new { RoleId = 2, PermissionId = 38, Scope = DataScope.All }, // F-0602
        new { RoleId = 2, PermissionId = 39, Scope = DataScope.All }, // F-0603
        new { RoleId = 2, PermissionId = 44, Scope = DataScope.All }, // F-0705
        new { RoleId = 2, PermissionId = 48, Scope = DataScope.All }, // F-0806
        new { RoleId = 2, PermissionId = 49, Scope = DataScope.All }, // F-0901
        new { RoleId = 2, PermissionId = 54, Scope = DataScope.All }, // F-0906
        new { RoleId = 2, PermissionId = 55, Scope = DataScope.All }, // F-1001
        new { RoleId = 2, PermissionId = 56, Scope = DataScope.All }, // F-1002
        new { RoleId = 2, PermissionId = 58, Scope = DataScope.All }, // F-1004
        /* Manager — 41 features, all scope. */
        new { RoleId = 3, PermissionId = 2, Scope = DataScope.All }, // F-0102
        new { RoleId = 3, PermissionId = 5, Scope = DataScope.All }, // F-0201
        new { RoleId = 3, PermissionId = 6, Scope = DataScope.All }, // F-0202
        new { RoleId = 3, PermissionId = 7, Scope = DataScope.All }, // F-0203
        new { RoleId = 3, PermissionId = 8, Scope = DataScope.All }, // F-0204
        new { RoleId = 3, PermissionId = 9, Scope = DataScope.All }, // F-0205
        new { RoleId = 3, PermissionId = 11, Scope = DataScope.All }, // F-0301
        new { RoleId = 3, PermissionId = 12, Scope = DataScope.All }, // F-0302
        new { RoleId = 3, PermissionId = 13, Scope = DataScope.All }, // F-0303
        new { RoleId = 3, PermissionId = 14, Scope = DataScope.All }, // F-0304
        new { RoleId = 3, PermissionId = 15, Scope = DataScope.All }, // F-0305
        new { RoleId = 3, PermissionId = 16, Scope = DataScope.All }, // F-0401
        new { RoleId = 3, PermissionId = 17, Scope = DataScope.All }, // F-0402
        new { RoleId = 3, PermissionId = 19, Scope = DataScope.All }, // F-0404
        new { RoleId = 3, PermissionId = 20, Scope = DataScope.All }, // F-0405
        new { RoleId = 3, PermissionId = 21, Scope = DataScope.All }, // F-0406
        new { RoleId = 3, PermissionId = 22, Scope = DataScope.All }, // F-0407
        new { RoleId = 3, PermissionId = 23, Scope = DataScope.All }, // F-0408
        new { RoleId = 3, PermissionId = 24, Scope = DataScope.All }, // F-0409
        new { RoleId = 3, PermissionId = 25, Scope = DataScope.All }, // F-0410
        new { RoleId = 3, PermissionId = 26, Scope = DataScope.All }, // F-0411
        new { RoleId = 3, PermissionId = 28, Scope = DataScope.All }, // F-0413
        new { RoleId = 3, PermissionId = 30, Scope = DataScope.All }, // F-0502
        new { RoleId = 3, PermissionId = 31, Scope = DataScope.All }, // F-0503
        new { RoleId = 3, PermissionId = 32, Scope = DataScope.All }, // F-0504
        new { RoleId = 3, PermissionId = 33, Scope = DataScope.All }, // F-0505
        new { RoleId = 3, PermissionId = 34, Scope = DataScope.All }, // F-0506
        new { RoleId = 3, PermissionId = 35, Scope = DataScope.All }, // F-0507
        new { RoleId = 3, PermissionId = 36, Scope = DataScope.All }, // F-0508
        new { RoleId = 3, PermissionId = 38, Scope = DataScope.All }, // F-0602
        new { RoleId = 3, PermissionId = 39, Scope = DataScope.All }, // F-0603
        new { RoleId = 3, PermissionId = 44, Scope = DataScope.All }, // F-0705
        new { RoleId = 3, PermissionId = 47, Scope = DataScope.All }, // F-0805
        new { RoleId = 3, PermissionId = 48, Scope = DataScope.All }, // F-0806
        new { RoleId = 3, PermissionId = 49, Scope = DataScope.All }, // F-0901
        new { RoleId = 3, PermissionId = 50, Scope = DataScope.All }, // F-0902
        new { RoleId = 3, PermissionId = 53, Scope = DataScope.All }, // F-0905
        new { RoleId = 3, PermissionId = 54, Scope = DataScope.All }, // F-0906
        new { RoleId = 3, PermissionId = 55, Scope = DataScope.All }, // F-1001
        new { RoleId = 3, PermissionId = 56, Scope = DataScope.All }, // F-1002
        new { RoleId = 3, PermissionId = 58, Scope = DataScope.All }, // F-1004
        /* CentreCoordinator — 7 features, centre scope. */
        new { RoleId = 4, PermissionId = 29, Scope = DataScope.Centre }, // F-0501
        new { RoleId = 4, PermissionId = 32, Scope = DataScope.Centre }, // F-0504
        new { RoleId = 4, PermissionId = 35, Scope = DataScope.Centre }, // F-0507
        new { RoleId = 4, PermissionId = 48, Scope = DataScope.Centre }, // F-0806
        new { RoleId = 4, PermissionId = 51, Scope = DataScope.Centre }, // F-0903
        new { RoleId = 4, PermissionId = 55, Scope = DataScope.Centre }, // F-1001
        new { RoleId = 4, PermissionId = 56, Scope = DataScope.Centre }, // F-1002
        /* SystemAdministrator — 11 features, all scope. */
        new { RoleId = 5, PermissionId = 28, Scope = DataScope.All }, // F-0413
        new { RoleId = 5, PermissionId = 41, Scope = DataScope.All }, // F-0702
        new { RoleId = 5, PermissionId = 42, Scope = DataScope.All }, // F-0703
        new { RoleId = 5, PermissionId = 43, Scope = DataScope.All }, // F-0704
        new { RoleId = 5, PermissionId = 44, Scope = DataScope.All }, // F-0705
        new { RoleId = 5, PermissionId = 45, Scope = DataScope.All }, // F-0801
        new { RoleId = 5, PermissionId = 46, Scope = DataScope.All }, // F-0802
        new { RoleId = 5, PermissionId = 47, Scope = DataScope.All }, // F-0805
        new { RoleId = 5, PermissionId = 48, Scope = DataScope.All }, // F-0806
        new { RoleId = 5, PermissionId = 55, Scope = DataScope.All }, // F-1001
        new { RoleId = 5, PermissionId = 56, Scope = DataScope.All }, // F-1002
        /* Executive — 6 features, all scope. */
        new { RoleId = 6, PermissionId = 47, Scope = DataScope.All }, // F-0805
        new { RoleId = 6, PermissionId = 48, Scope = DataScope.All }, // F-0806
        new { RoleId = 6, PermissionId = 52, Scope = DataScope.All }, // F-0904
        new { RoleId = 6, PermissionId = 53, Scope = DataScope.All }, // F-0905
        new { RoleId = 6, PermissionId = 55, Scope = DataScope.All }, // F-1001
        new { RoleId = 6, PermissionId = 56, Scope = DataScope.All }, // F-1002
    ];
}
