namespace ExpertHub.Core.Domain;

/// <summary>
/// One shared entity instance and where the two sides stand —
/// `REPLICATION_STATE`, `10` §3.12. What makes entity-level mastership
/// (`08` §1.1, `P-129`) operable: which side is master, which versions each
/// side holds, and when they last agreed.
/// </summary>
/// <remarks>
/// This row is also `BR-1203` made visible: <see cref="LastSyncedAt"/> and
/// <see cref="DriftStatus"/> are what lets a screen say "last known state as
/// of …" instead of pretending a stale value is current — and what lets
/// reconciliation discover drift before a user does.
/// </remarks>
public sealed class ReplicationState
{
    public Guid StateId { get; set; }

    public required string EntityType { get; set; }

    public Guid LocalEntityId { get; set; }

    /// <summary>The other side's identifier, once known.</summary>
    public string? RemoteEntityId { get; set; }

    public required string SystemCode { get; set; }

    /// <summary>A value of <see cref="MasterSides"/> — whose version is authoritative.</summary>
    public required string MasterSide { get; set; }

    public int LocalVersion { get; set; }

    public int? RemoteVersion { get; set; }

    public DateTime? LastSyncedAt { get; set; }

    /// <summary>A value of <see cref="DriftStatuses"/>.</summary>
    public required string DriftStatus { get; set; }
}
