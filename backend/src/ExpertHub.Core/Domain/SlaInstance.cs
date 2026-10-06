namespace ExpertHub.Core.Domain;

/// <summary>
/// One live countdown on one specific record — `SLA_INSTANCE`, `10` §3.9;
/// what every P-J4 badge in the frontend renders. The state is decided by
/// the server, never derived in the UI (`P-51`): business days depend on the
/// Academy calendar, which the browser does not have and must not
/// approximate.
/// </summary>
/// <remarks>
/// The table ships with CAP-07 (it is the capability's own entity set) but no
/// instance is created yet: instances start when the capabilities whose
/// records carry deadlines arrive (BE-06's screening clock is the first).
/// </remarks>
public sealed class SlaInstance
{
    public Guid InstanceId { get; set; }

    public required string SlaId { get; set; }

    public required string EntityType { get; set; }

    public Guid EntityId { get; set; }

    public DateTime StartedAt { get; set; }

    public DateTime DueAt { get; set; }

    /// <summary>`within` | `approaching` | `breached` — server-decided.</summary>
    public required string State { get; set; }

    public DateTime? ResolvedAt { get; set; }
}
