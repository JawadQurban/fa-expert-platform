using System.Globalization;
using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Fast;
using ExpertHub.Infrastructure.Notifications;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Assignments;

/// <summary>
/// B-11 — what FAST decides about a plan, carried into the engagements on it.
/// Two facts only originate in FAST (J-21/F1/AC-3, J-22/F3):
/// <list type="bullet">
/// <item><b>The dates moved.</b> The request takes FAST's first and last
/// schedule day, each live engagement records <c>ScheduleChangedAt</c>, and its
/// trainer is told (EV-0505).</item>
/// <item><b>The plan was cancelled.</b> Every live engagement ends as
/// <c>cancelled</c>, actor <c>fast</c>, with FAST's own reason code; the request
/// closes, so nobody is offered a plan that no longer exists; each trainer is
/// told (EV-0508).</item>
/// </list>
/// Only requests linked to a FAST plan (RUN-030) with a live engagement are
/// read. A plan FAST cannot answer for is skipped and read again next time.
/// </summary>
internal static class FastPlanStatusSync
{
    /// <summary>`ENGAGEMENT_TERMINATION.reason` for a FAST cancellation.</summary>
    internal const string CancelledReason = "plan-cancelled";

    internal static async Task<int> SyncAsync(
        ExpertHubDbContext db, FastTrainingApi fast, NotificationDispatcher dispatcher, DateTime now, CancellationToken ct)
    {
        if (!fast.IsConfigured)
        {
            return 0;
        }
        var live = await (
            from engagement in db.Engagements
            join slot in db.AssignmentSlots on engagement.SlotId equals slot.SlotId
            join request in db.AssignmentRequests on slot.RequestId equals request.RequestId
            where engagement.Status == EngagementStatuses.Upcoming
            select new { engagement, slot, request })
            .ToListAsync(ct);

        var changed = 0;
        foreach (var group in live.GroupBy(row => row.request.RequestId))
        {
            var request = group.First().request;
            var form = JsonSerializer.Deserialize<CreateRequestInputWire>(request.FormValues, AssignmentEndpoints.WireJson);
            if (form?.FastPlanId is not { Length: > 0 } planId)
            {
                continue;
            }
            var status = await fast.PlanStatusAsync(planId, ct);
            if (!status.Ok || status.Value is null)
            {
                continue;
            }
            var rows = group.Select(row => (row.engagement, row.slot)).ToList();
            if (status.Value.Status?.Code == FastPlanStatuses.Canceled)
            {
                await CancelAsync(db, dispatcher, request, rows, status.Value.Cancellation, now, ct);
                changed++;
            }
            else if (await RescheduleAsync(db, dispatcher, request, form, rows, status.Value.ScheduleDays, now, ct))
            {
                changed++;
            }
        }
        await db.SaveChangesAsync(ct);
        return changed;
    }

    private static async Task CancelAsync(
        ExpertHubDbContext db, NotificationDispatcher dispatcher, AssignmentRequest request,
        List<(Engagement Engagement, AssignmentSlot Slot)> rows, FastPlanCancellation? cancellation,
        DateTime now, CancellationToken ct)
    {
        foreach (var (engagement, slot) in rows)
        {
            engagement.Status = EngagementStatuses.Cancelled;
            db.EngagementTerminations.Add(new EngagementTermination
            {
                TerminationId = Guid.NewGuid(),
                EngagementId = engagement.EngagementId,
                Kind = EngagementStatuses.Cancelled,
                Actor = "fast",
                // FAST's own reason, rendered as given (J-22/F3/AC-1); the code
                // beside it. A cancellation with no reason still says what it is.
                // The column holds 60 characters; the full text, if longer,
                // stays in FAST.
                Reason = Fit(cancellation?.Reason?.NameAr ?? cancellation?.Reason?.NameEn ?? CancelledReason),
                Note = cancellation?.ReasonOther,
                FastCancelReasonCode = Fit(cancellation?.Reason?.Code ?? cancellation?.Reason?.Id),
                OccurredAt = cancellation?.CanceledOn ?? now,
            });
            await OfferService.RaiseAsync(dispatcher, db, "EV-0508", slot, ct, engagement.TrainerId);
        }
        request.Status = AssignmentRequestStatuses.Closed;
    }

    private static async Task<bool> RescheduleAsync(
        ExpertHubDbContext db, NotificationDispatcher dispatcher, AssignmentRequest request,
        CreateRequestInputWire form, List<(Engagement Engagement, AssignmentSlot Slot)> rows,
        IReadOnlyList<FastScheduleDay>? schedule, DateTime now, CancellationToken ct)
    {
        var days = (schedule ?? []).ToList();
        if (days.Any(d => d.IsLatestSchedule))
        {
            days = [.. days.Where(d => d.IsLatestSchedule)];
        }
        if (days.Count == 0)
        {
            return false;
        }
        var from = days.Min(d => d.Date).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var to = days.Max(d => d.Date).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        if (DayOf(form.DateFrom) == from && DayOf(form.DateTo) == to)
        {
            return false;
        }
        request.FormValues = JsonSerializer.Serialize(form with { DateFrom = from, DateTo = to }, AssignmentEndpoints.WireJson);
        foreach (var (engagement, slot) in rows)
        {
            engagement.ScheduleChangedAt = now;
            await OfferService.RaiseAsync(dispatcher, db, "EV-0505", slot, ct, engagement.TrainerId);
        }
        return true;
    }

    [return: System.Diagnostics.CodeAnalysis.NotNullIfNotNull(nameof(value))]
    private static string? Fit(string? value) => value is { Length: > 60 } ? value[..60] : value;

    private static string? DayOf(string? value) =>
        DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed)
            ? parsed.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
            : null;
}

/// <summary>
/// Runs <see cref="FastPlanStatusSync"/> every <c>Fast:PlanStatusSyncMinutes</c>
/// (default 60). Idle with no database or no Training API.
/// </summary>
public sealed partial class FastPlanStatusWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<FastPlanStatusWorker> _logger;
    private readonly bool _databaseConfigured;
    private readonly TimeSpan _interval;

    public FastPlanStatusWorker(
        IServiceScopeFactory scopes, IConfiguration configuration, ILogger<FastPlanStatusWorker> logger)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        _scopes = scopes;
        _logger = logger;
        _databaseConfigured = !string.IsNullOrWhiteSpace(configuration.GetConnectionString("ExpertHub"));
        _interval = TimeSpan.FromMinutes(Math.Max(5, configuration.GetValue("Fast:PlanStatusSyncMinutes", 60)));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using (var probe = _scopes.CreateScope())
        {
            if (!_databaseConfigured || !probe.ServiceProvider.GetRequiredService<FastTrainingApi>().IsConfigured)
            {
                return;
            }
        }
        using var timer = new PeriodicTimer(_interval);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = _scopes.CreateScope();
                var changed = await FastPlanStatusSync.SyncAsync(
                    scope.ServiceProvider.GetRequiredService<ExpertHubDbContext>(),
                    scope.ServiceProvider.GetRequiredService<FastTrainingApi>(),
                    scope.ServiceProvider.GetRequiredService<NotificationDispatcher>(),
                    DateTime.UtcNow,
                    stoppingToken);
                if (changed > 0)
                {
                    LogChanged(_logger, changed);
                }
            }
            catch (Exception exception) when (exception is not OperationCanceledException
                || !stoppingToken.IsCancellationRequested)
            {
                // A failed pass must never take the host down; the next one retries.
                LogFailed(_logger, exception);
            }
        }
    }

    [LoggerMessage(EventId = 5310, Level = LogLevel.Information,
        Message = "FAST plan status: {Count} request(s) changed (rescheduled or cancelled in FAST).")]
    private static partial void LogChanged(ILogger logger, int count);

    [LoggerMessage(EventId = 5311, Level = LogLevel.Warning, Message = "FAST plan status pass failed.")]
    private static partial void LogFailed(ILogger logger, Exception exception);
}
