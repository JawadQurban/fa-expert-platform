namespace ExpertHub.Core.Domain;

/// <summary>
/// One append-only audit record (`10` §3.2, `NFR-07`).
/// </summary>
/// <remarks>
/// `BR-0806` says the trail cannot be edited <i>by anyone, including an
/// administrator</i>. That is enforced three times, because an application
/// convention alone would make it untrue: the DbContext exposes no update or
/// delete path and throws if one is attempted, and the SQL grant script
/// (<c>scripts/sql/audit-log-append-only.sql</c>) gives the application
/// principal INSERT and SELECT on the table and nothing else.
/// </remarks>
public sealed class AuditLogEntry
{
    public Guid AuditId { get; set; }

    public Guid UserId { get; set; }

    public required string Action { get; set; }

    public required string EntityType { get; set; }

    public Guid? EntityId { get; set; }

    /// <summary>JSON snapshot before the change, when there was a before.</summary>
    public string? BeforeState { get; set; }

    /// <summary>JSON snapshot after the change, when there is an after.</summary>
    public string? AfterState { get; set; }

    public string? IpAddress { get; set; }

    public DateTime OccurredAt { get; set; }
}
