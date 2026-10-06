namespace ExpertHub.Core.Domain;

/*
 * CAP-09 — `10` §3.10. «تمتلك هذه القدرة تعريفات فقط، ولا تمتلك أي بيانات
 * مصدرية» (§8.9.1): the capability owns NO source data. Everything here is a
 * definition or a placement; not one type in this file describes an
 * operational fact, and no code in the module writes to an entity that does.
 *
 * Recorded deviation from `10` §3.10 — `REPORT_DEFINITION` and `REPORT_RUN`
 * are NOT built. The export half (`F-0905`) has no service contract, no
 * screen and no definitions (`Q26`/`DM-GAP-09` supplies neither reports nor
 * parameters), so a table with no reader and no writer would be exactly the
 * dead entry `P-123` warns about. Same handling as CAP-05's `EXT_FAST_*`
 * mirrors: named as unbuilt rather than built as scaffolding.
 */

/// <summary>
/// `METRIC_DEFINITION` — one measure the platform can display, named and
/// attributed to the capability that owns the data it counts.
/// </summary>
/// <remarks>
/// ⚠️ <b>`formula` is deliberately null on every seeded row</b>, and that is
/// `DM-GAP-09` (`Q26`) held honestly rather than filled. §8.9 defines no
/// formulas, so there is nothing to store and nothing to interpret; the
/// computation lives in <c>MetricRegistry</c>, keyed by
/// <see cref="Code"/>. Building a formula language to evaluate expressions
/// nobody has written would be the largest invention in the product, and it
/// would still need the definitions this column is waiting for. When they
/// arrive, this column is where they go.
/// </remarks>
public sealed class MetricDefinition
{
    public Guid MetricId { get; set; }

    /// <summary>The wire id the dashboard contract renders — a closed set the
    /// frontend's own <c>DashboardMetricId</c> union fixes.</summary>
    public required string Code { get; set; }

    public required string NameAr { get; set; }

    public required string NameEn { get; set; }

    /// <summary>Which capability owns the data — CAP-09 owns none of it.</summary>
    public required string SourceCapability { get; set; }

    /// <summary>⚠️ Null until `Q26` answers. See the remarks above.</summary>
    public string? Formula { get; set; }

    /// <summary>`count` today; the level the measure aggregates at.</summary>
    public required string AggregationLevel { get; set; }
}

/// <summary>
/// `DASHBOARD` — one per role (`F-0901`…`F-0904`). The role is the whole of
/// the scoping rule: §8.9.1 says CAP-09's data scope follows CAP-08, so a
/// dashboard is reached through the caller's role and never through a
/// parameter they could change.
/// </summary>
public sealed class DashboardDefinition
{
    public Guid DashboardId { get; set; }

    public int RoleId { get; set; }

    /// <summary>The feature that opens it, so the gate and the row agree.</summary>
    public required string FeatureCode { get; set; }

    public required string NameAr { get; set; }

    public required string NameEn { get; set; }
}

/// <summary>
/// `DASHBOARD_METRIC` — which measures a role's dashboard carries, in order.
/// </summary>
/// <remarks>
/// A dashboard with no rows here is <b>named but empty</b>, which is the
/// designed state for the centre coordinator (`F-0903`) and the executive
/// (`F-0904`): §8.9 names their dashboards and defines none of their metrics
/// (`Q26`). An empty dashboard says "nobody has decided what belongs here";
/// a dashboard filled with the employee's tiles would say something the
/// Academy never said.
/// </remarks>
public sealed class DashboardMetricPlacement
{
    public Guid DashboardId { get; set; }

    public Guid MetricId { get; set; }

    public int OrderIndex { get; set; }
}

/// <summary>
/// The metric codes the dashboard contract can render — fixed by
/// `internal.types.ts`'s <c>DashboardMetricId</c> union, not chosen here.
/// </summary>
public static class MetricCodes
{
    /* The four pipeline groupings (`P-22`), each drilling into the inbox. */
    public const string AwaitingScreening = "awaiting-screening";
    public const string InScreening = "in-screening";
    public const string Interviews = "interviews";
    public const string AwaitingDecision = "awaiting-decision";

    /// <summary>«مواد بانتظار الاعتماد» — the third tile §8.9's `F-0902`
    /// names, and the only one of the three that was not already built. It
    /// drills into the submission queue rather than the application inbox,
    /// because a material submission has no application status.</summary>
    public const string MaterialsAwaitingApproval = "materials-awaiting-approval";
}
