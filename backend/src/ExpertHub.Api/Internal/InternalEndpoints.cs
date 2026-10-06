using ExpertHub.Api.Analytics;
using ExpertHub.Api.Applications;
using ExpertHub.Api.Auth;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Internal;

/*
 * EH-INT-01 (Internal Dashboard) + EH-INT-02 (Application Inbox), behind
 * `internalService.ts`:
 *
 *   GET v1/internal/dashboard
 *   GET v1/internal/applications?page=&pageSize=&search=&status=
 *
 * These two are the ENTRY to every internal journey: the inbox supplies the
 * application ids that screening, the interview, the committee and the
 * agreement pages then open. That coupling is why they had to go live
 * together with those modules — a live screening page reached from a demo
 * inbox looks up an id the database never had, and answers, correctly,
 * "الطلب غير موجود" (found on the testing server, 2026-08-31).
 *
 * ⚠️ The dashboard metrics are DERIVED operational counts over the pipeline,
 * not the management KPI set — `DM-GAP-09`/`G13` are still open, and this
 * serves groupings the data already supports rather than inventing measures
 * nobody approved. The same "derived, not invented" line the trainer's own
 * summary cards hold.
 *
 * 2026-09-02 (BE-12, CAP-09): the dashboard is no longer a hard-coded tile
 * list. It resolves the caller's ROLE to their `DASHBOARD` row and serves
 * that row's `DASHBOARD_METRIC` placements in order — §8.9.1's «data scope
 * follows CAP-08» as a lookup rather than as a branch, so the centre
 * coordinator and the executive correctly get their own (empty) dashboards
 * instead of the employee's tiles. `MetricRegistry` computes the values, and
 * every line of it is a read.
 */

internal sealed record InboxApplicationWire(
    string Id, string Reference, string ApplicantName,
    IReadOnlyList<string> Services, string Status, string SubmittedAt, string UpdatedAt);

internal sealed record InboxListWire(
    IReadOnlyList<InboxApplicationWire> Items, int TotalCount, int Page, int PageSize,
    int PageCount, int TotalOpen);

/// <summary>
/// Where a tile drills. Four of the five open the application inbox filtered
/// by a status; «مواد بانتظار الاعتماد» opens the submission queue, which has
/// no application status — so the wire carries a TARGET rather than a bare
/// status, and a tile that does not belong to the inbox cannot pretend to.
/// </summary>
internal sealed record DashboardMetricTargetWire(string Queue, string? Status);

internal sealed record DashboardMetricWire(
    string Id, int Value, DashboardMetricTargetWire Target);

internal sealed record DashboardWire(
    IReadOnlyList<DashboardMetricWire> Metrics,
    IReadOnlyList<InboxApplicationWire> Recent,
    int TotalOpen,
    // How many more applications arrived this week than last. Null when there
    // is no earlier week to compare against (`DashboardAnalytics`).
    int? SubmissionDelta,
    IReadOnlyList<DashboardDistributionWire> Distribution,
    IReadOnlyList<DashboardSlaWire> Sla);

/// <summary>The staff entry points.</summary>
public static class InternalEndpoints
{
    /// <summary>Everything still moving — shared with CAP-09's registry so
    /// the inbox's "open" and the dashboard's agree by construction.</summary>
    private static string[] OpenStatuses => MetricRegistry.OpenStatuses;

    public static RouteGroupBuilder MapInternalEndpoints(this RouteGroupBuilder v1)
    {
        var internalGroup = v1.MapGroup("/internal")
            .RequireAuthorization(AuthenticationSetup.InternalPolicy);

        // CAP-09 `F-0901`→`F-0904` — the role's own dashboard. Gated on ANY
        // of the four (`P-195`): every internal role reaches this route, and
        // WHICH dashboard they get is decided by their role, not by the gate.
        internalGroup.MapGet("/dashboard", async (
            HttpContext http, ExpertHubDbContext db, CancellationToken ct) =>
        {
            var rows = await LoadAsync(db, ct);
            var recent = rows
                .Where(r => r.SubmittedAtRaw is not null)
                .OrderByDescending(r => r.SubmittedAtRaw)
                .Take(5)
                .Select(r => r.Wire)
                .ToList();
            var now = DateTime.UtcNow;
            return Results.Ok(new DashboardWire(
                await MetricsForCallerAsync(http, db, ct),
                recent,
                rows.Count(r => OpenStatuses.Contains(r.Wire.Status)),
                await DashboardAnalytics.SubmissionDeltaAsync(db, now, ct),
                await DashboardAnalytics.DistributionAsync(db, ct),
                await DashboardAnalytics.SlaAsync(db, now, ct)));
        })
            .WithName("InternalDashboard")
            .RequireAnyFeature("F-0901", "F-0902", "F-0903", "F-0904");

        // F-0407 عرض طلبات — the application inbox.
        internalGroup.MapGet("/applications", async (
            int page,
            int pageSize,
            string? search,
            string? status,
            ExpertHubDbContext db,
            CancellationToken ct) =>
        {
            var rows = await LoadAsync(db, ct);
            var filtered = rows
                .Where(r =>
                    (string.IsNullOrWhiteSpace(status) || r.Wire.Status == status)
                    && (string.IsNullOrWhiteSpace(search)
                        || r.Wire.Reference.Contains(search.Trim(), StringComparison.OrdinalIgnoreCase)
                        || r.Wire.ApplicantName.Contains(search.Trim(), StringComparison.OrdinalIgnoreCase)))
                .Select(r => r.Wire)
                .ToList();

            var safePageSize = Math.Clamp(pageSize, 1, 100);
            var pageCount = Math.Max(1, (int)Math.Ceiling(filtered.Count / (double)safePageSize));
            var safePage = Math.Clamp(page, 1, pageCount);
            return Results.Ok(new InboxListWire(
                [.. filtered.Skip((safePage - 1) * safePageSize).Take(safePageSize)],
                filtered.Count,
                safePage,
                safePageSize,
                pageCount,
                rows.Count(r => OpenStatuses.Contains(r.Wire.Status))));
        })
            .WithName("ApplicationInbox")
            .RequireFeature("F-0407");

        return v1;
    }

    /// <summary>
    /// The caller's dashboard, resolved through their role — §8.9.1's «data
    /// scope follows CAP-08», expressed as a join rather than as a branch.
    /// </summary>
    /// <remarks>
    /// A role with no `DASHBOARD` row, or one whose dashboard carries no
    /// placements, gets an empty tile list. That is the DESIGNED state for
    /// the centre coordinator and the executive: §8.9 names their dashboards
    /// and defines none of their metrics (`Q26`), and an empty dashboard says
    /// "nobody has decided what belongs here" where the employee's tiles
    /// would say something the Academy never said.
    /// </remarks>
    private static async Task<List<DashboardMetricWire>> MetricsForCallerAsync(
        HttpContext http, ExpertHubDbContext db, CancellationToken ct)
    {
        var actor = await ActorResolution.ResolveActorAsync(http, db, ct);
        var placements = await (
            from userRole in db.UserRoles
            join dashboard in db.Dashboards on userRole.RoleId equals dashboard.RoleId
            join placement in db.DashboardMetrics
                on dashboard.DashboardId equals placement.DashboardId
            join metric in db.MetricDefinitions on placement.MetricId equals metric.MetricId
            where userRole.UserId == actor.UserId
            orderby placement.OrderIndex
            select new { metric.Code, placement.OrderIndex }).ToListAsync(ct);

        var metrics = new List<DashboardMetricWire>(placements.Count);
        // Distinct by code: a person may hold two roles, and a tile appearing
        // twice is a bug the union of their dashboards must not produce.
        foreach (var placement in placements.DistinctBy(p => p.Code))
        {
            var status = MetricRegistry.InboxStatusOf(placement.Code);
            metrics.Add(new DashboardMetricWire(
                placement.Code,
                await MetricRegistry.CountAsync(db, placement.Code, ct),
                new DashboardMetricTargetWire(
                    status is null ? "submissions" : "applications", status)));
        }
        return metrics;
    }

    /// <summary>
    /// Every application staff can see — <b>drafts excluded</b>: an unsubmitted
    /// draft is the applicant's private working copy and has no reference yet
    /// (`BR-0107`), so it is not an item in anybody's queue.
    /// </summary>
    private static async Task<List<(InboxApplicationWire Wire, DateTime? SubmittedAtRaw)>> LoadAsync(
        ExpertHubDbContext db,
        CancellationToken ct)
    {
        var applications = await (
            from application in db.Applications
            join applicant in db.Users on application.ApplicantUserId equals applicant.UserId
            where application.Status != ApplicationStatuses.Draft
            orderby application.SubmittedAt descending
            select new { application, applicant.FullNameAr }).ToListAsync(ct);

        var services = await db.ApplicationServices.ToListAsync(ct);
        return [.. applications.Select(row => (
            new InboxApplicationWire(
                row.application.ApplicationId.ToString(),
                row.application.Reference ?? string.Empty,
                row.FullNameAr,
                [.. services
                    .Where(s => s.ApplicationId == row.application.ApplicationId)
                    .Select(s => s.Service)],
                row.application.Status,
                ApplicationEndpoints.Iso(
                    row.application.SubmittedAt ?? row.application.CreatedAt),
                ApplicationEndpoints.Iso(row.application.UpdatedAt)),
            row.application.SubmittedAt))];
    }
}
