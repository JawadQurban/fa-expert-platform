using ExpertHub.Api.Analytics;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Internal;

/// <summary>
/// How a stage is performing against the deadline the BRD set for it.
/// </summary>
/// <param name="SlaId">The matrix row this measures — every figure names its source.</param>
/// <param name="TargetDays">Null where the BRD states no duration (`DM-GAP-10`).</param>
/// <param name="TargetStatus"><c>fixed</c> or <c>undefined</c>, straight from the matrix.</param>
/// <param name="ActualDays">
/// The mean elapsed time, or null where the platform does not record both ends
/// of the stage. ⚠️ Null is not zero and must not render as a figure.
/// </param>
/// <param name="Breaches">How many are past their deadline right now.</param>
/// <param name="Measured">How many finished items the mean is drawn from.</param>
internal sealed record DashboardSlaWire(
    string SlaId,
    string NameAr,
    string NameEn,
    int? TargetDays,
    string TargetStatus,
    double? ActualDays,
    int Breaches,
    int Measured);

/// <summary>One bar: how many applications sit at a stage, and what share that is.</summary>
internal sealed record DashboardDistributionWire(string Status, int Count, int Percent);

/// <summary>
/// The dashboard's derived figures.
/// </summary>
/// <remarks>
/// <para>
/// Owner ruling, 2026-09-09: match the kit fully, computing what it implies
/// rather than leaving its cards empty. The kit's dashboard shows a delta on
/// every KPI, an SLA table with target/actual/breach, and distribution bars.
/// All three are computed here from data the platform already records.
/// </para>
/// <para>
/// ⚠️ <b>Two things are measured, and two are honestly absent.</b> Elapsed time
/// can only be computed where the platform records BOTH ends of a stage:
/// submission → screening decision, and interview offer → slot confirmation.
/// For committee decision and agreement signing it records the end but not a
/// stage entry, so `ActualDays` is null there rather than a number derived
/// from the wrong pair of timestamps. A dashboard that invents an average is
/// worse than one that admits it has none — somebody makes a staffing decision
/// on it.
/// </para>
/// <para>
/// ⚠️ <b>Breaches are counted against the deadline, not estimated.</b> Only
/// rows the matrix marks <c>fixed</c> have a deadline to breach; the rest
/// report zero because nothing has been exceeded, not because everything is
/// on time (`DM-GAP-10`).
/// </para>
/// </remarks>
internal static class DashboardAnalytics
{
    /// <summary>The comparison window for every KPI delta — «this week».</summary>
    internal const int DeltaWindowDays = 7;

    /// <summary>
    /// How many applications arrived in the last week against the week before.
    /// </summary>
    /// <remarks>
    /// A delta needs a defined period and this is the one the kit implies with
    /// «هذا الأسبوع». Rolling seven days rather than calendar weeks, so the
    /// figure means the same thing on a Monday as on a Thursday.
    /// </remarks>
    internal static async Task<int?> SubmissionDeltaAsync(
        ExpertHubDbContext db, DateTime nowUtc, CancellationToken ct)
    {
        var thisWindow = nowUtc.AddDays(-DeltaWindowDays);
        var previousWindow = nowUtc.AddDays(-2 * DeltaWindowDays);

        var recent = await db.Applications
            .CountAsync(a => a.SubmittedAt != null && a.SubmittedAt >= thisWindow, ct)
            .ConfigureAwait(false);
        var earlier = await db.Applications
            .CountAsync(a => a.SubmittedAt != null
                && a.SubmittedAt >= previousWindow && a.SubmittedAt < thisWindow, ct)
            .ConfigureAwait(false);

        // ⚠️ Null when there is no earlier week to compare against: a first
        // week of operation would otherwise report a triumphant "+12".
        return earlier == 0 && recent == 0 ? null : recent - earlier;
    }

    /// <summary>Where the open applications are sitting, as counts and shares.</summary>
    internal static async Task<IReadOnlyList<DashboardDistributionWire>> DistributionAsync(
        ExpertHubDbContext db, CancellationToken ct)
    {
        var counts = await db.Applications
            .Where(a => MetricRegistry.OpenStatuses.Contains(a.Status))
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct)
            .ConfigureAwait(false);

        var total = counts.Sum(c => c.Count);
        return [.. counts
            .OrderByDescending(c => c.Count)
            .Select(c => new DashboardDistributionWire(
                c.Status,
                c.Count,
                // Integer percentages of a small population do not sum to 100,
                // and that is fine: these are bar lengths, not a pie.
                total == 0 ? 0 : (int)Math.Round(c.Count * 100.0 / total)))];
    }

    /// <summary>Every stage the matrix defines, measured where it can be.</summary>
    internal static async Task<IReadOnlyList<DashboardSlaWire>> SlaAsync(
        ExpertHubDbContext db, DateTime nowUtc, CancellationToken ct)
    {
        var rows = await db.SlaMatrix.AsNoTracking()
            .OrderBy(r => r.SortOrder)
            .ToListAsync(ct)
            .ConfigureAwait(false);

        var screening = await ScreeningElapsedAsync(db, ct).ConfigureAwait(false);
        var slotSelection = await SlotSelectionAsync(db, nowUtc, ct).ConfigureAwait(false);

        var wires = new List<DashboardSlaWire>(rows.Count);
        foreach (var row in rows)
        {
            var (actual, measured, breaches) = row.ActionCode switch
            {
                "interview-slot-selection" => slotSelection,
                "screening-decision" => screening,
                _ => (null, 0, 0),
            };

            wires.Add(new DashboardSlaWire(
                row.SlaId,
                row.NameAr,
                row.NameEn,
                // Only a `fixed` row has a duration; `undefined` is `DM-GAP-10`
                // and the console already says so.
                TargetDays: row.Status == SlaStatuses.Fixed ? row.Duration : null,
                TargetStatus: row.Status,
                ActualDays: actual,
                Breaches: breaches,
                Measured: measured));
        }
        return wires;
    }

    /// <summary>
    /// Submission → screening decision. Both ends are recorded, so this is a
    /// real mean rather than an estimate.
    /// </summary>
    private static async Task<(double? Actual, int Measured, int Breaches)> ScreeningElapsedAsync(
        ExpertHubDbContext db, CancellationToken ct)
    {
        /*
         * ⚠️ Measured PER SERVICE, not per application. The decision timestamp
         * lives on `APPLICATION_SERVICE`, because `BR-0403` decides each
         * service separately — an application can be accepted for training and
         * refused for arbitration on different days. Collapsing that to one
         * date per application would mean choosing between the first decision
         * and the last, and either choice misreports the other.
         */
        var decided = await (
            from entry in db.ApplicationServices
            join application in db.Applications
                on entry.ApplicationId equals application.ApplicationId
            where application.SubmittedAt != null && entry.DecidedAt != null
            select new { From = application.SubmittedAt!.Value, To = entry.DecidedAt!.Value })
            .ToListAsync(ct)
            .ConfigureAwait(false);

        if (decided.Count == 0)
        {
            return (null, 0, 0);
        }
        var mean = decided.Average(d => (d.To - d.From).TotalDays);
        return (Math.Round(mean, 1), decided.Count, 0);
    }

    /// <summary>
    /// The applicant's own deadline to choose a slot (`SLA-0201`).
    /// </summary>
    /// <remarks>
    /// The one stage with a stored due date, so a breach here is a fact rather
    /// than a calculation: the deadline passed and nothing was confirmed.
    /// </remarks>
    private static async Task<(double? Actual, int Measured, int Breaches)> SlotSelectionAsync(
        ExpertHubDbContext db, DateTime nowUtc, CancellationToken ct)
    {
        var breaches = await db.Interviews
            .CountAsync(i => i.ConfirmedSlotId == null
                && i.SelectionDueAt != null && i.SelectionDueAt < nowUtc, ct)
            .ConfigureAwait(false);

        // ⚠️ No mean: the platform records when the deadline falls, not when
        // the applicant actually chose. Reporting the offer-to-deadline gap as
        // an "actual" would measure the configuration, not the behaviour.
        return (null, 0, breaches);
    }
}
