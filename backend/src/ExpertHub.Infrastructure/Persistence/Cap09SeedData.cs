namespace ExpertHub.Infrastructure.Persistence;

/// <summary>
/// CAP-09's definitions — the only thing the capability owns (§8.9.1).
/// </summary>
/// <remarks>
/// <para>
/// ⚠️ <b>`DM-GAP-09`/`Q26` is open</b>, and this seed shows exactly where.
/// §8.9 names four dashboards and the tiles of <b>one</b> of them: `F-0902`'s
/// «طلبات قيد الفرز، مقابلات مجدولة، مواد بانتظار الاعتماد». Those three are
/// here. The centre coordinator's and the executive's dashboards are here
/// too — as rows with <b>no metrics at all</b>, because naming a dashboard is
/// not defining its contents, and filling them with the employee's tiles
/// would put figures in front of an executive that nobody chose for them.
/// </para>
/// <para>
/// Every `formula` is null for the same reason: §8.9 writes none. The
/// computation is in <c>MetricRegistry</c>, keyed by code.
/// </para>
/// </remarks>
internal static class Cap09SeedData
{
    /* Role ids, as `AccessSeedData` seeds them (`10` §3.2, `BR-0803`). */
    private const int StaffRole = 2;
    private const int ManagerRole = 3;
    private const int CentreCoordinatorRole = 4;
    private const int ExecutiveRole = 6;

    private static Guid MetricId(int index) =>
        new($"c9000000-0000-0000-0000-{index:D12}");

    private static Guid DashboardId(int index) =>
        new($"c9010000-0000-0000-0000-{index:D12}");

    internal static readonly Guid AwaitingScreening = MetricId(1);
    internal static readonly Guid InScreening = MetricId(2);
    internal static readonly Guid Interviews = MetricId(3);
    internal static readonly Guid AwaitingDecision = MetricId(4);
    internal static readonly Guid MaterialsAwaitingApproval = MetricId(5);

    internal static readonly Guid StaffDashboard = DashboardId(1);
    internal static readonly Guid ManagerDashboard = DashboardId(2);
    internal static readonly Guid CentreCoordinatorDashboard = DashboardId(3);
    internal static readonly Guid ExecutiveDashboard = DashboardId(4);

    internal static readonly object[] Metrics =
    [
        Metric(AwaitingScreening, Core.Domain.MetricCodes.AwaitingScreening,
            "بانتظار الفرز", "Awaiting screening", "CAP-01"),
        // «طلبات قيد الفرز» — F-0902, tile 1.
        Metric(InScreening, Core.Domain.MetricCodes.InScreening,
            "قيد الفرز", "In screening", "CAP-02"),
        // «مقابلات مجدولة» — F-0902, tile 2.
        Metric(Interviews, Core.Domain.MetricCodes.Interviews,
            "مقابلات مجدولة", "Interviews scheduled", "CAP-02"),
        Metric(AwaitingDecision, Core.Domain.MetricCodes.AwaitingDecision,
            "بانتظار القرار", "Awaiting decision", "CAP-02"),
        // «مواد بانتظار الاعتماد» — F-0902, tile 3, and the one this
        // increment added: CAP-05 built the submission queue it counts.
        Metric(MaterialsAwaitingApproval, Core.Domain.MetricCodes.MaterialsAwaitingApproval,
            "مواد بانتظار الاعتماد", "Materials awaiting approval", "CAP-05"),
    ];

    internal static readonly object[] Dashboards =
    [
        Dashboard(StaffDashboard, StaffRole, "F-0901",
            "لوحة مؤشرات إدارة المدربين", "Trainer management dashboard"),
        Dashboard(ManagerDashboard, ManagerRole, "F-0902",
            "لوحة مؤشرات المدير", "Manager dashboard"),
        // ⚠️ Named, and deliberately empty — `Q26`.
        Dashboard(CentreCoordinatorDashboard, CentreCoordinatorRole, "F-0903",
            "لوحة مؤشرات منسق المركز", "Centre coordinator dashboard"),
        Dashboard(ExecutiveDashboard, ExecutiveRole, "F-0904",
            "لوحة الإدارة العليا", "Executive dashboard"),
    ];

    internal static readonly object[] Placements =
    [
        .. Placed(StaffDashboard),
        .. Placed(ManagerDashboard),
        // Nothing for the coordinator or the executive. See the remarks.
    ];

    private static object[] Placed(Guid dashboardId) =>
    [
        new { DashboardId = dashboardId, MetricId = AwaitingScreening, OrderIndex = 1 },
        new { DashboardId = dashboardId, MetricId = InScreening, OrderIndex = 2 },
        new { DashboardId = dashboardId, MetricId = Interviews, OrderIndex = 3 },
        new { DashboardId = dashboardId, MetricId = AwaitingDecision, OrderIndex = 4 },
        new { DashboardId = dashboardId, MetricId = MaterialsAwaitingApproval, OrderIndex = 5 },
    ];

    private static object Metric(
        Guid metricId, string code, string nameAr, string nameEn, string sourceCapability) =>
        new
        {
            MetricId = metricId,
            Code = code,
            NameAr = nameAr,
            NameEn = nameEn,
            SourceCapability = sourceCapability,
            // ⚠️ `Q26` — no formula exists to store. Null says so.
            Formula = (string?)null,
            AggregationLevel = "count",
        };

    private static object Dashboard(
        Guid dashboardId, int roleId, string featureCode, string nameAr, string nameEn) =>
        new
        {
            DashboardId = dashboardId,
            RoleId = roleId,
            FeatureCode = featureCode,
            NameAr = nameAr,
            NameEn = nameEn,
        };
}
