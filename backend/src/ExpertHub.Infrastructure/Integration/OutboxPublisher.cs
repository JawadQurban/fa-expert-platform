using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ExpertHub.Infrastructure.Integration;

/// <summary>
/// Publishes from the outbox — the second half of `08` §4.2's
/// outbox-then-publish. Polls for due pending messages, attempts each on the
/// channel, and records every attempt in `INTEGRATION_LOG` (`BR-1204`).
/// Failure backs off exponentially and never abandons the message: `BR-1203`
/// says an outage means retry-with-state, not a business change quietly
/// dropped.
/// </summary>
public sealed partial class OutboxPublisher : BackgroundService
{
    /// <summary>Failed attempts before `REPLICATION_STATE` flips from
    /// <c>pending</c> to <c>drifted</c> — the "discover the drift before a
    /// user does" line of `08` §4.2 rule 5.</summary>
    internal const int DriftAfterAttempts = 3;

    private const int BatchSize = 50;

    private readonly IServiceScopeFactory _scopes;
    private readonly IIntegrationChannel _channel;
    private readonly ILogger<OutboxPublisher> _logger;
    private readonly bool _databaseConfigured;
    private readonly TimeSpan _interval;

    public OutboxPublisher(
        IServiceScopeFactory scopes,
        IIntegrationChannel channel,
        IConfiguration configuration,
        ILogger<OutboxPublisher> logger)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        _scopes = scopes;
        _channel = channel;
        _logger = logger;
        _databaseConfigured =
            !string.IsNullOrWhiteSpace(configuration.GetConnectionString("ExpertHub"));
        _interval = TimeSpan.FromSeconds(
            configuration.GetValue("Integration:PublishIntervalSeconds", 30));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // No database or no channel: nothing to publish from, or to. The
        // outbox still fills (P-135 — queued, shown as pending); this loop
        // just has no work until a deployment configures the missing piece,
        // which takes a restart anyway.
        if (!_databaseConfigured || !_channel.IsConfigured)
        {
            LogIdle(_logger, _databaseConfigured ? "channel" : "database");
            return;
        }

        using var timer = new PeriodicTimer(_interval);
        while (await timer.WaitForNextTickAsync(stoppingToken).ConfigureAwait(false))
        {
            try
            {
                using var scope = _scopes.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ExpertHubDbContext>();
                await PublishDueAsync(db, _channel, DateTime.UtcNow, stoppingToken)
                    .ConfigureAwait(false);
            }
            // ⚠️ `is not OperationCanceledException` alone would NOT hold this:
            // an HttpClient timeout throws TaskCanceledException, which derives
            // from it, so a slow channel would fault ExecuteAsync and .NET's
            // default StopHost would stop the whole API. Only a cancellation
            // that this host actually requested is allowed through.
            catch (Exception exception) when (exception is not OperationCanceledException
                || !stoppingToken.IsCancellationRequested)
            {
                LogPublishCycleFailed(_logger, exception);
            }
        }
    }

    /// <summary>
    /// One publish pass — separated from the timer loop so tests drive it
    /// directly against a real database and a fake channel.
    /// </summary>
    /// <returns>How many messages were published.</returns>
    internal static async Task<int> PublishDueAsync(
        ExpertHubDbContext db,
        IIntegrationChannel channel,
        DateTime nowUtc,
        CancellationToken cancellationToken)
    {
        if (!channel.IsConfigured)
        {
            return 0;
        }

        var due = await db.OutboxMessages
            .Where(m => m.Status == OutboxStatuses.Pending && m.NextAttemptAt <= nowUtc)
            .OrderBy(m => m.CreatedAt)
            .Take(BatchSize)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var published = 0;
        foreach (var message in due)
        {
            var attempt = message.AttemptCount + 1;
            IntegrationAttemptResult result;
            try
            {
                result = await channel.SendAsync(message, cancellationToken).ConfigureAwait(false);
            }
            // A channel timeout is a failed attempt, not a shutdown: it must be
            // recorded and retried, so only real cancellation escapes here.
            catch (Exception exception) when (exception is not OperationCanceledException
                || !cancellationToken.IsCancellationRequested)
            {
                result = IntegrationAttemptResult.Failure(exception.Message);
            }

            message.AttemptCount = attempt;
            var state = await db.ReplicationStates
                .FirstOrDefaultAsync(
                    r => r.EntityType == message.EntityType
                        && r.LocalEntityId == message.EntityId
                        && r.SystemCode == message.SystemCode,
                    cancellationToken)
                .ConfigureAwait(false);

            if (result.Succeeded)
            {
                message.Status = OutboxStatuses.Published;
                message.PublishedAt = nowUtc;
                message.LastError = null;
                if (state is not null)
                {
                    state.LastSyncedAt = nowUtc;
                    state.RemoteVersion = message.EntityVersion;
                    state.DriftStatus = DriftStatuses.InSync;
                }
                published++;
            }
            else
            {
                message.LastError = result.ErrorDetail;
                message.NextAttemptAt = nowUtc + Backoff(attempt);
                if (state is not null && attempt >= DriftAfterAttempts)
                {
                    state.DriftStatus = DriftStatuses.Drifted;
                }
            }

            db.AppendIntegrationLog(new IntegrationLogEntry
            {
                LogId = Guid.NewGuid(),
                SystemCode = message.SystemCode,
                Operation = "publish",
                EntityType = message.EntityType,
                EntityId = message.EntityId,
                IdempotencyKey = message.IdempotencyKey,
                Outcome = result.Succeeded ? IntegrationOutcomes.Success : IntegrationOutcomes.Failure,
                ErrorDetail = result.ErrorDetail,
                AttemptNumber = attempt,
                OccurredAt = nowUtc,
            });

            // Committed per message, not per batch: one poisoned message must
            // not roll back the attempts — and the BR-1204 log rows — of the
            // forty-nine that worked.
            await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        return published;
    }

    /// <summary>30s · 60s · 120s … capped at an hour. Never gives up (`BR-1203`).</summary>
    private static TimeSpan Backoff(int attempt) =>
        TimeSpan.FromSeconds(Math.Min(30 * Math.Pow(2, attempt - 1), 3600));

    [LoggerMessage(
        EventId = 1,
        Level = LogLevel.Information,
        Message = "Outbox publisher idle: no {Missing} configured. Outbound messages queue as pending.")]
    private static partial void LogIdle(ILogger logger, string missing);

    [LoggerMessage(
        EventId = 2,
        Level = LogLevel.Error,
        Message = "Outbox publish cycle failed; the next tick retries.")]
    private static partial void LogPublishCycleFailed(ILogger logger, Exception exception);
}
