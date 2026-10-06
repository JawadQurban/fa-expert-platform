namespace ExpertHub.Core.Domain;

/// <summary>
/// One routed row of the central matrix — `NOTIFICATION_MATRIX_ROW`, `10`
/// §3.9. <b>Presence is the routing</b>: an unrouted event simply has no row
/// (the frontend union's `unrouted` member), so a half-configured row cannot
/// exist, let alone fire.
/// </summary>
/// <remarks>
/// There is deliberately <b>no channel column</b> (P-147): `BR-0702` fires
/// email and in-platform together, so a column whose only legal value is
/// "both" is not a column. Channel lives on `NOTIFICATION_LOG`, where it
/// records what actually happened. ⚠️ Which audience each event gets is
/// `DM-GAP-08` — every row starts absent and `modelStatus` stays
/// <c>unapproved</c>.
/// </remarks>
public sealed class NotificationMatrixRow
{
    public Guid RowId { get; set; }

    public required string EventCode { get; set; }

    /// <summary>Always an <b>approved</b> template — the service refuses a draft (`BR-0701`).</summary>
    public Guid TemplateId { get; set; }

    /// <summary>JSON array of <see cref="AudienceCodes"/> values — at least one.</summary>
    public required string Audience { get; set; }

    /// <summary>A routed row may still be paused.</summary>
    public bool IsActive { get; set; }
}
