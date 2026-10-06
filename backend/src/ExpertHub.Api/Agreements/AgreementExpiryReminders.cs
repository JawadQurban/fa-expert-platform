using System.Globalization;
using System.Text.Json;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Notifications;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Api.Agreements;

/// <summary>
/// J-12/F1/AC-2 … AC-4 — the agreement expiry alerts at the offsets the central
/// SLA matrix carries for `SLA-0301` (seeded 90, 30, 5 days).
/// </summary>
/// <remarks>
/// <para>
/// The offsets are READ from the matrix, never restated here (`BR-0705`); the
/// event code for each is the one catalogued for it (`EV-0301` 90 days,
/// `EV-0302` 30, `EV-0303` 5). An offset with no catalogued event raises
/// nothing — an alert is not invented for it.
/// </para>
/// <para>
/// Idempotent: each alert is keyed on the agreement, its current end date and
/// the threshold, so however often this runs one alert is raised per threshold
/// — and a renewal (a new end date) starts a fresh set. Only the tightest
/// threshold already reached is raised, so a job that first runs 20 days before
/// expiry sends the 30-day alert, not a stale 90-day one as well.
/// </para>
/// </remarks>
public static class AgreementExpiryReminders
{
    private static readonly Dictionary<int, string> EventByOffset = new()
    {
        [90] = "EV-0301",
        [30] = "EV-0302",
        [5] = "EV-0303",
    };

    public static async Task<int> RaiseDueAsync(
        ExpertHubDbContext db, NotificationDispatcher dispatcher, DateTime now, CancellationToken ct)
    {
        var sla = await db.SlaMatrix.FirstOrDefaultAsync(r => r.SlaId == "SLA-0301", ct);
        var offsets = string.IsNullOrWhiteSpace(sla?.ReminderOffsets)
            ? []
            : JsonSerializer.Deserialize<int[]>(sla.ReminderOffsets) ?? [];
        if (offsets.Length == 0)
        {
            return 0;
        }

        var agreements = await db.Agreements
            .Where(a => a.Status == AgreementStatuses.Active && a.EndsAt != null && a.EndsAt > now)
            .ToListAsync(ct);
        var raised = 0;
        foreach (var agreement in agreements)
        {
            var endsAt = agreement.EndsAt!.Value;
            var daysRemaining = (int)Math.Ceiling((endsAt - now).TotalDays);
            var reached = offsets.Where(offset => daysRemaining <= offset).ToList();
            if (reached.Count == 0)
            {
                continue;
            }
            var threshold = reached.Min();
            if (!EventByOffset.TryGetValue(threshold, out var eventCode))
            {
                continue;
            }
            var outcome = await dispatcher.RaiseOnceAsync(
                eventCode,
                new NotificationEventContext(
                    SourceEntityId: agreement.AgreementId,
                    RecordSubjectUserId: agreement.TrainerUserId,
                    ActingStaffUserId: agreement.CreatedBy),
                new Dictionary<string, string>
                {
                    ["agreementReference"] = agreement.Reference,
                    ["daysRemaining"] = daysRemaining.ToString(CultureInfo.InvariantCulture),
                    ["endDate"] = endsAt.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                },
                string.Create(CultureInfo.InvariantCulture,
                    $"agreement-expiry:{agreement.AgreementId:N}:{endsAt:yyyyMMdd}:{threshold}"),
                ct);
            if (outcome is not null)
            {
                raised++;
            }
        }
        await db.SaveChangesAsync(ct);
        return raised;
    }
}

/// <summary>Runs <see cref="AgreementExpiryReminders"/> every
/// <c>Notifications:ReminderSweepMinutes</c> (default 60). Idle without a database.</summary>
public sealed partial class AgreementExpiryReminderWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<AgreementExpiryReminderWorker> _logger;
    private readonly bool _databaseConfigured;
    private readonly TimeSpan _interval;

    public AgreementExpiryReminderWorker(
        IServiceScopeFactory scopes, IConfiguration configuration, ILogger<AgreementExpiryReminderWorker> logger)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        _scopes = scopes;
        _logger = logger;
        _databaseConfigured = !string.IsNullOrWhiteSpace(configuration.GetConnectionString("ExpertHub"));
        _interval = TimeSpan.FromMinutes(
            Math.Max(1, configuration.GetValue("Notifications:ReminderSweepMinutes", 60)));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_databaseConfigured)
        {
            return;
        }
        using var timer = new PeriodicTimer(_interval);
        do
        {
            try
            {
                using var scope = _scopes.CreateScope();
                await AgreementExpiryReminders.RaiseDueAsync(
                    scope.ServiceProvider.GetRequiredService<ExpertHubDbContext>(),
                    scope.ServiceProvider.GetRequiredService<NotificationDispatcher>(),
                    DateTime.UtcNow,
                    stoppingToken);
            }
            catch (Exception exception) when (exception is not OperationCanceledException
                || !stoppingToken.IsCancellationRequested)
            {
                LogSweepFailed(_logger, exception);
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    [LoggerMessage(EventId = 5311, Level = LogLevel.Warning, Message = "Agreement expiry reminder sweep failed.")]
    private static partial void LogSweepFailed(ILogger logger, Exception exception);
}
