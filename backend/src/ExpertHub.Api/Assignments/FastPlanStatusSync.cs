using System.Globalization;
using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Fast;
using ExpertHub.Infrastructure.Integration;
using ExpertHub.Infrastructure.Notifications;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Assignments;

/// <summary>
/// B-11 — what FAST decides about a plan, carried into the engagements on it.
/// Two facts only originate in FAST (J-21/F1/AC-3, J-22/F3):
/// <list type="bullet">
/// <item><b>The timetable moved.</b> The request takes FAST's first and last
/// schedule day, each live engagement records <c>ScheduleChangedAt</c>, and its
/// trainer is told (EV-0505). P-374 — a change in session times alone, on the
/// same days, counts too.</item>
/// <item><b>The plan was cancelled.</b> Every live engagement ends as
/// <c>cancelled</c>, actor <c>fast</c>, with FAST's own reason code; the request
/// closes, so nobody is offered a plan that no longer exists; each trainer is
/// told (EV-0508).</item>
/// <item><b>P-374 — the trainer is no longer on the plan.</b> FAST drops a
/// plan's trainers when it reschedules it. A trainer Expert Hub had placed
/// (<c>synchronized</c>) who is missing from the plan is queued to be added
/// again; FAST's assignment is idempotent, so this is safe to repeat.</item>
/// </list>
/// Only requests linked to a FAST plan (RUN-030) with a live engagement are
/// read. A plan FAST cannot answer for is skipped and read again next time.
/// </summary>
internal static partial class FastPlanStatusSync
{
    /// <summary>`ENGAGEMENT_TERMINATION.reason` for a FAST cancellation.</summary>
    internal const string CancelledReason = "plan-cancelled";

    /// <summary>
    /// The first outbox version a re-assignment may use: 1 is the assignment
    /// at confirmation and 2 the removal (`EngagementEndpoints`), whose
    /// idempotency key must stay free.
    /// </summary>
    private const int FirstRestoreVersion = 3;

    internal static async Task<int> SyncAsync(
        ExpertHubDbContext db, FastTrainingApi fast, NotificationDispatcher dispatcher, DateTime now, CancellationToken ct,
        ILogger? logger = null)
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
            else
            {
                if (await RescheduleAsync(db, dispatcher, request, form, rows, status.Value.ScheduleDays, now, ct))
                {
                    changed++;
                }
                changed += await RestoreTrainersAsync(db, fast, planId, rows, logger, ct);
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
            await OfferService.RaiseAsync(dispatcher, db, "EV-0508", slot, ct, engagement.TrainerId,
                new Dictionary<string, string>
                {
                    ["reasonText"] = cancellation?.Reason?.NameAr ?? cancellation?.Reason?.NameEn ?? CancelledReason,
                    ["reasonText@en"] = cancellation?.Reason?.NameEn ?? cancellation?.Reason?.NameAr ?? CancelledReason,
                });
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
        var datesMoved = DayOf(form.DateFrom) != from || DayOf(form.DateTo) != to;
        // The first read only records the timetable: there is nothing earlier
        // to compare the times with.
        var fingerprint = Fingerprint(days);
        var timesMoved = request.FastScheduleFingerprint is not null && request.FastScheduleFingerprint != fingerprint;
        request.FastScheduleFingerprint = fingerprint;
        if (!datesMoved && !timesMoved)
        {
            return false;
        }
        if (datesMoved)
        {
            request.FormValues = JsonSerializer.Serialize(form with { DateFrom = from, DateTo = to }, AssignmentEndpoints.WireJson);
        }
        foreach (var (engagement, slot) in rows)
        {
            engagement.ScheduleChangedAt = now;
            // P-372 E-044 — the new first day and its start time.
            var first = days.OrderBy(d => d.Date).First();
            await OfferService.RaiseAsync(dispatcher, db, "EV-0505", slot, ct, engagement.TrainerId,
                new Dictionary<string, string>
                {
                    ["date"] = from == to ? from : $"{from} – {to}",
                    ["time"] = first.StartTime.ToString(@"hh\:mm", CultureInfo.InvariantCulture),
                });
        }
        return true;
    }

    /// <summary>
    /// P-374 — puts back on the plan each trainer Expert Hub had placed there
    /// and FAST no longer lists. Only a <c>synchronized</c> slot is checked: an
    /// assignment still on its way belongs to the outbox, not to this pass.
    /// </summary>
    private static async Task<int> RestoreTrainersAsync(
        ExpertHubDbContext db, FastTrainingApi fast, string planId,
        List<(Engagement Engagement, AssignmentSlot Slot)> rows, ILogger? logger, CancellationToken ct)
    {
        var placed = rows
            .Where(row => row.Slot.FastSyncState == "synchronized"
                && row.Slot.ConfirmedEngagementId == row.Engagement.EngagementId)
            .ToList();
        if (placed.Count == 0)
        {
            return 0;
        }
        var plan = await fast.PlanDetailsAsync(planId, ct);
        if (!plan.Ok || plan.Value is null)
        {
            return 0;
        }
        var onPlan = (plan.Value.Trainers ?? [])
            .Select(t => Guid.TryParse(t.TrainerFastUserId, out var id) ? id : Guid.Empty)
            .ToHashSet();
        var hub = new IntegrationHub(db);
        var restored = 0;
        foreach (var (engagement, slot) in placed)
        {
            var fastUserId = await (
                    from profile in db.TrainerProfiles
                    join replica in db.FastProfiles on profile.UserId equals replica.UserId
                    where profile.TrainerId == engagement.TrainerId
                    select replica.FastUserId)
                .FirstOrDefaultAsync(ct);
            if (!Guid.TryParse(fastUserId, out var trainerFastUserId) || onPlan.Contains(trainerFastUserId))
            {
                continue;
            }
            var lastVersion = await db.OutboxMessages
                .Where(m => m.EntityType == "ENGAGEMENT" && m.EntityId == engagement.EngagementId)
                .MaxAsync(m => (int?)m.EntityVersion, ct) ?? 0;
            slot.FastSyncState = "processing";
            await hub.EnqueueOutboundAsync(
                IntegrationSystems.Fast,
                "engagement",
                "ENGAGEMENT",
                engagement.EngagementId,
                entityVersion: Math.Max(lastVersion + 1, FirstRestoreVersion),
                operation: "upsert",
                JsonSerializer.Serialize(new
                {
                    engagementId = engagement.EngagementId,
                    trainerId = engagement.TrainerId,
                    slotNumber = slot.SlotNumber,
                    restoredAfterFastRemoval = true,
                }, AssignmentEndpoints.WireJson),
                ct);
            if (logger is not null)
            {
                LogTrainerRestored(logger, engagement.EngagementId, planId);
            }
            restored++;
        }
        return restored;
    }

    /// <summary>The latest timetable, day by day with its times, as one hash.</summary>
    private static string Fingerprint(IEnumerable<FastScheduleDay> days) =>
        Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(
            string.Join(';', days
                .OrderBy(d => d.Date).ThenBy(d => d.StartTime)
                .Select(d => string.Create(CultureInfo.InvariantCulture,
                    $"{d.Date:yyyy-MM-dd} {d.StartTime:hh\\:mm}-{d.EndTime:hh\\:mm}"))))));

    [LoggerMessage(EventId = 5312, Level = LogLevel.Warning,
        Message = "FAST plan {PlanId} no longer lists the trainer of engagement {EngagementId}; the assignment is queued again.")]
    private static partial void LogTrainerRestored(ILogger logger, Guid engagementId, string planId);

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
                    stoppingToken,
                    _logger);
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
        Message = "FAST plan status: {Count} change(s) carried over (rescheduled, cancelled, or a trainer re-added).")]
    private static partial void LogChanged(ILogger logger, int count);

    [LoggerMessage(EventId = 5311, Level = LogLevel.Warning, Message = "FAST plan status pass failed.")]
    private static partial void LogFailed(ILogger logger, Exception exception);
}
