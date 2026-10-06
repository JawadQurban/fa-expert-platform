namespace ExpertHub.Core.Domain;

/// <summary>
/// One outbound write waiting to be published — `OUTBOX_MESSAGE`. Not in `10`
/// §3.12's ERD by name; it is the table `08` §4.2 rule 3 mandates: the write
/// is committed here <b>in the same transaction as the business change</b>,
/// then published. A confirmed engagement must never be lost because FAST was
/// briefly unreachable — and FAST must never be told about a change the
/// platform failed to commit.
/// </summary>
public sealed class OutboxMessage
{
    public Guid OutboxMessageId { get; set; }

    public required string SystemCode { get; set; }

    /// <summary>The registered <see cref="DataElement.ElementName"/> being published.</summary>
    public required string ElementName { get; set; }

    public required string EntityType { get; set; }

    public Guid EntityId { get; set; }

    public int EntityVersion { get; set; }

    /// <summary>e.g. <c>upsert</c> — what the receiving side should do.</summary>
    public required string Operation { get; set; }

    /// <summary>The JSON the receiving side gets, as it was at commit time.</summary>
    public required string Payload { get; set; }

    /// <summary>`(entity, entity_id, version)` — unique, so a retry after an
    /// ambiguous timeout cannot create a second message (`08` §4.2 rule 2).</summary>
    public required string IdempotencyKey { get; set; }

    /// <summary>A value of <see cref="OutboxStatuses"/>.</summary>
    public required string Status { get; set; }

    public int AttemptCount { get; set; }

    /// <summary>Exponential backoff — the publisher skips a message until this passes.</summary>
    public DateTime NextAttemptAt { get; set; }

    public string? LastError { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? PublishedAt { get; set; }
}
