namespace ExpertHub.Core.Domain;

/// <summary>
/// One attempted crossing, in either direction — `INTEGRATION_LOG`, `10`
/// §3.12. `BR-1204`: every crossing is logged, success or failure, with
/// enough to replay it. Append-only, the same way the audit trail is.
/// </summary>
public sealed class IntegrationLogEntry
{
    public Guid LogId { get; set; }

    public required string SystemCode { get; set; }

    /// <summary>What was attempted — e.g. <c>publish</c>, <c>consume</c>.</summary>
    public required string Operation { get; set; }

    public required string EntityType { get; set; }

    public Guid? EntityId { get; set; }

    /// <summary>`(entity, entity_id, version)` — a retry must not duplicate (`08` §4.2).</summary>
    public required string IdempotencyKey { get; set; }

    /// <summary>A value of <see cref="IntegrationOutcomes"/>.</summary>
    public required string Outcome { get; set; }

    public string? ErrorDetail { get; set; }

    public int AttemptNumber { get; set; }

    public DateTime OccurredAt { get; set; }
}
