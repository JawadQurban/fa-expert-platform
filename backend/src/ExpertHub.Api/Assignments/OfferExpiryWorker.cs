using ExpertHub.Infrastructure.Notifications;
using ExpertHub.Infrastructure.Persistence;

namespace ExpertHub.Api.Assignments;

/// <summary>
/// J-18/F2/AC-3 — «expiry is automatic». Every few minutes, offers whose
/// response window (`SLA-0501`) has closed are expired and their slot is passed
/// to the next approved candidate, or exhausted for J-19.
/// </summary>
/// <remarks>
/// Before this, an offer only expired when its trainer answered LATE: a
/// candidate who never answered held the slot forever, no backup was offered
/// and re-routing never began. The transition does not depend on email or any
/// other delivery — it is state, and the notification event is raised beside
/// it. Idle when no database is configured, like the outbox publisher.
/// </remarks>
public sealed partial class OfferExpiryWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<OfferExpiryWorker> _logger;
    private readonly bool _databaseConfigured;
    private readonly TimeSpan _interval;

    public OfferExpiryWorker(
        IServiceScopeFactory scopes, IConfiguration configuration, ILogger<OfferExpiryWorker> logger)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        _scopes = scopes;
        _logger = logger;
        _databaseConfigured = !string.IsNullOrWhiteSpace(configuration.GetConnectionString("ExpertHub"));
        _interval = TimeSpan.FromMinutes(
            Math.Max(1, configuration.GetValue("Assignments:OfferExpirySweepMinutes", 5)));
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
                var db = scope.ServiceProvider.GetRequiredService<ExpertHubDbContext>();
                var dispatcher = scope.ServiceProvider.GetRequiredService<NotificationDispatcher>();
                var expired = await OfferService.ExpireDueOffersAsync(
                    db, dispatcher, DateTime.UtcNow, stoppingToken, _logger);
                if (expired > 0)
                {
                    LogExpired(_logger, expired);
                }
            }
            catch (Exception exception) when (exception is not OperationCanceledException
                || !stoppingToken.IsCancellationRequested)
            {
                // A failed sweep must never take the host down; the next one retries.
                LogSweepFailed(_logger, exception);
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    [LoggerMessage(EventId = 5301, Level = LogLevel.Information,
        Message = "Expired {Count} assignment offer(s) whose response window had closed.")]
    private static partial void LogExpired(ILogger logger, int count);

    [LoggerMessage(EventId = 5302, Level = LogLevel.Warning, Message = "Assignment offer expiry sweep failed.")]
    private static partial void LogSweepFailed(ILogger logger, Exception exception);
}
