using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Analytics;

/// <summary>
/// What each metric code counts — CAP-09's whole computation, and every line
/// of it is a <b>read</b>.
/// </summary>
/// <remarks>
/// <para>
/// §8.9.1: «تمتلك هذه القدرة تعريفات فقط، ولا تمتلك أي بيانات مصدرية». That
/// is enforced here by shape: <see cref="CountAsync"/> takes the context and
/// returns an <see cref="int"/>, so there is no return path through which a
/// change could be staged, and the module's endpoints never call
/// <c>SaveChanges</c>. A test asserts the change tracker is empty after a
/// dashboard read, which is the rule stated in the one place it can be
/// checked rather than promised.
/// </para>
/// <para>
/// ⚠️ The computation is <b>code, not data</b>, and that is `DM-GAP-09`
/// (`Q26`) taken at its word: §8.9 supplies no formulas, so
/// `METRIC_DEFINITION.formula` is null on every row and there is nothing to
/// interpret. Building an expression language to evaluate formulas nobody has
/// written would be a large invention that would still be waiting for the
/// same answer. When the definitions arrive, they go in that column and this
/// registry becomes its evaluator.
/// </para>
/// </remarks>
internal static class MetricRegistry
{
    /// <summary>Everything still moving — `BR-0101`'s un-decided set without
    /// `draft`, since a draft has not reached staff at all.</summary>
    internal static readonly string[] OpenStatuses =
    [
        ApplicationStatuses.Submitted,
        ApplicationStatuses.UnderReview,
        ApplicationStatuses.InterviewScheduled,
        ApplicationStatuses.InterviewCompleted,
        ApplicationStatuses.ApprovalInProgress,
        ApplicationStatuses.AgreementPending,
    ];

    /// <summary>
    /// The application status a tile drills into, or null when the tile does
    /// not open the application inbox at all. The material tile is the null
    /// case, and it is why the wire carries a <em>target</em> rather than a
    /// bare status: a submission has no application status to filter by.
    /// </summary>
    internal static string? InboxStatusOf(string metricCode) => metricCode switch
    {
        MetricCodes.AwaitingScreening => ApplicationStatuses.Submitted,
        MetricCodes.InScreening => ApplicationStatuses.UnderReview,
        MetricCodes.Interviews => ApplicationStatuses.InterviewScheduled,
        MetricCodes.AwaitingDecision => ApplicationStatuses.ApprovalInProgress,
        _ => null,
    };

    /// <summary>
    /// One metric's value. An unknown code counts nothing rather than
    /// throwing: a definition row can outlive the build that knew how to
    /// compute it, and a dashboard that loses a tile is better than a
    /// dashboard that 500s.
    /// </summary>
    internal static Task<int> CountAsync(
        ExpertHubDbContext db, string metricCode, CancellationToken ct)
    {
        if (InboxStatusOf(metricCode) is { } status)
        {
            return db.Applications.AsNoTracking().CountAsync(a => a.Status == status, ct);
        }
        return metricCode == MetricCodes.MaterialsAwaitingApproval
            ? db.MaterialSubmissions.AsNoTracking()
                .CountAsync(s => s.Status == SubmissionStatuses.PendingApproval, ct)
            : Task.FromResult(0);
    }
}
