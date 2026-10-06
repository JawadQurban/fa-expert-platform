using System.Globalization;
using ExpertHub.Core.Domain;
using ExpertHub.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ExpertHub.Infrastructure.Integration;

/// <summary>
/// The one gate every crossing goes through — CAP-12's mechanism (`08` §4.2):
/// ownership check → idempotency key → outbox <b>in the same transaction as
/// the business change</b> → publish from the outbox → record the crossing →
/// reconcile drift. Built before any capability needs it, so none of them
/// grows an ad-hoc <c>HttpClient</c> call of its own.
/// </summary>
/// <remarks>
/// Both methods only STAGE changes on the scoped <see cref="ExpertHubDbContext"/>;
/// the caller commits them together with its business change in one
/// <c>SaveChanges</c>. That ordering is the whole point of an outbox: a crash
/// between the two must leave a message to retry, never a business change
/// nobody was told about — and never a remote system told about a change the
/// platform failed to commit.
/// </remarks>
public sealed class IntegrationHub
{
    private readonly ExpertHubDbContext _db;

    public IntegrationHub(ExpertHubDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Stages an outbound write: the mastership check (`P-129`), the
    /// idempotent outbox message, and the `REPLICATION_STATE` row marked
    /// <c>pending</c> (`P-135` — the change is queued and shown as pending,
    /// never applied remotely and hoped for).
    /// </summary>
    /// <returns>
    /// The staged message — or the already-staged one when the same
    /// `(entity, entity_id, version)` was enqueued before: a retry after an
    /// ambiguous timeout must not create a second message (`08` §4.2 rule 2).
    /// </returns>
    /// <exception cref="MastershipViolationException">
    /// The element is not registered for the system, or Expert Hub does not
    /// master it. Rejected with the reason; nothing is staged.
    /// </exception>
    public async Task<OutboxMessage> EnqueueOutboundAsync(
        string systemCode,
        string elementName,
        string entityType,
        Guid entityId,
        int entityVersion,
        string operation,
        string payload,
        CancellationToken cancellationToken = default)
    {
        var element = await RequireElementAsync(systemCode, elementName, cancellationToken)
            .ConfigureAwait(false);
        if (!string.Equals(element.OwningSystem, OwningSystems.ExpertHub, StringComparison.Ordinal))
        {
            throw new MastershipViolationException(
                $"'{elementName}' is mastered by '{element.OwningSystem}', not Expert Hub " +
                $"(BR-1201). An outbound write would be overwritten at the next replication, " +
                $"so it is rejected here instead (P-129).");
        }

        var idempotencyKey = OutboundKey(entityType, entityId, entityVersion);
        var existing = _db.OutboxMessages.Local
                .FirstOrDefault(m => m.IdempotencyKey == idempotencyKey)
            ?? await _db.OutboxMessages
                .FirstOrDefaultAsync(m => m.IdempotencyKey == idempotencyKey, cancellationToken)
                .ConfigureAwait(false);
        if (existing is not null)
        {
            return existing;
        }

        var now = DateTime.UtcNow;
        var message = new OutboxMessage
        {
            OutboxMessageId = Guid.NewGuid(),
            SystemCode = systemCode,
            ElementName = elementName,
            EntityType = entityType,
            EntityId = entityId,
            EntityVersion = entityVersion,
            Operation = operation,
            Payload = payload,
            IdempotencyKey = idempotencyKey,
            Status = OutboxStatuses.Pending,
            AttemptCount = 0,
            NextAttemptAt = now,
            CreatedAt = now,
        };
        _db.OutboxMessages.Add(message);

        var state = await FindStateAsync(entityType, entityId, systemCode, cancellationToken)
            .ConfigureAwait(false);
        if (state is null)
        {
            _db.ReplicationStates.Add(new ReplicationState
            {
                StateId = Guid.NewGuid(),
                EntityType = entityType,
                LocalEntityId = entityId,
                SystemCode = systemCode,
                MasterSide = MasterSides.ExpertHub,
                LocalVersion = entityVersion,
                DriftStatus = DriftStatuses.Pending,
            });
        }
        else
        {
            state.LocalVersion = entityVersion;
            state.DriftStatus = DriftStatuses.Pending;
        }

        return message;
    }

    /// <summary>
    /// Stages the bookkeeping of an inbound apply — call it in the same
    /// transaction as the mirrored row the importer writes: `REPLICATION_STATE`
    /// becomes <c>in_sync</c> with a fresh <c>last_synced_at</c> (`BR-1203` —
    /// the last known state, visibly dated), and the crossing lands in
    /// `INTEGRATION_LOG` (`BR-1204`).
    /// </summary>
    /// <exception cref="MastershipViolationException">
    /// The element is not registered, or Expert Hub masters it — a remote
    /// edit to a platform-mastered entity is refused, not silently absorbed
    /// (`08` §1.1's warning, in the inbound direction).
    /// </exception>
    public async Task RecordInboundAsync(
        string systemCode,
        string elementName,
        string entityType,
        Guid localEntityId,
        string remoteEntityId,
        int? remoteVersion,
        CancellationToken cancellationToken = default)
    {
        var element = await RequireElementAsync(systemCode, elementName, cancellationToken)
            .ConfigureAwait(false);
        if (string.Equals(element.OwningSystem, OwningSystems.ExpertHub, StringComparison.Ordinal))
        {
            throw new MastershipViolationException(
                $"'{elementName}' is mastered by Expert Hub; an inbound apply from " +
                $"'{systemCode}' would overwrite the master's version and is rejected (P-129).");
        }

        var now = DateTime.UtcNow;
        var state = await FindStateAsync(entityType, localEntityId, systemCode, cancellationToken)
            .ConfigureAwait(false);
        if (state is null)
        {
            state = new ReplicationState
            {
                StateId = Guid.NewGuid(),
                EntityType = entityType,
                LocalEntityId = localEntityId,
                SystemCode = systemCode,
                MasterSide = MasterSides.Remote,
                DriftStatus = DriftStatuses.InSync,
            };
            _db.ReplicationStates.Add(state);
        }

        state.RemoteEntityId = remoteEntityId;
        state.RemoteVersion = remoteVersion;
        state.LastSyncedAt = now;
        state.DriftStatus = DriftStatuses.InSync;

        _db.AppendIntegrationLog(new IntegrationLogEntry
        {
            LogId = Guid.NewGuid(),
            SystemCode = systemCode,
            Operation = "consume",
            EntityType = entityType,
            EntityId = localEntityId,
            IdempotencyKey = InboundKey(entityType, remoteEntityId, remoteVersion),
            Outcome = IntegrationOutcomes.Success,
            AttemptNumber = 1,
            OccurredAt = now,
        });
    }

    /// <summary>`(entity, entity_id, version)` — `08` §4.2 rule 2, spelled once.</summary>
    internal static string OutboundKey(string entityType, Guid entityId, int entityVersion) =>
        string.Create(
            CultureInfo.InvariantCulture,
            $"{entityType}:{entityId:D}:v{entityVersion}");

    private static string InboundKey(string entityType, string remoteEntityId, int? remoteVersion) =>
        string.Create(
            CultureInfo.InvariantCulture,
            $"{entityType}:{remoteEntityId}:r{remoteVersion?.ToString(CultureInfo.InvariantCulture) ?? "unversioned"}");

    private async Task<DataElement> RequireElementAsync(
        string systemCode,
        string elementName,
        CancellationToken cancellationToken)
    {
        var element = await _db.DataElements
            .FirstOrDefaultAsync(
                e => e.SystemCode == systemCode && e.ElementName == elementName,
                cancellationToken)
            .ConfigureAwait(false);
        return element ?? throw new MastershipViolationException(
            $"'{elementName}' is not a registered data element of '{systemCode}' " +
            $"(DATA_ELEMENT, BR-1201). An unregistered element does not cross; register it " +
            $"in the source-of-truth matrix first.");
    }

    private async Task<ReplicationState?> FindStateAsync(
        string entityType,
        Guid localEntityId,
        string systemCode,
        CancellationToken cancellationToken) =>
        _db.ReplicationStates.Local.FirstOrDefault(r =>
            r.EntityType == entityType
            && r.LocalEntityId == localEntityId
            && r.SystemCode == systemCode)
        ?? await _db.ReplicationStates
            .FirstOrDefaultAsync(
                r => r.EntityType == entityType
                    && r.LocalEntityId == localEntityId
                    && r.SystemCode == systemCode,
                cancellationToken)
            .ConfigureAwait(false);
}
