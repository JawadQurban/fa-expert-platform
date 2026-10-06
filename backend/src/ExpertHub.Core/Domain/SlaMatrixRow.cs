namespace ExpertHub.Core.Domain;

/// <summary>
/// One deadline of the central SLA matrix — `SLA_MATRIX_ROW`, `10` §3.9.
/// `BR-0705`: every deadline across the twelve capabilities is managed here
/// and nowhere else — no other capability's service exposes one.
/// </summary>
/// <remarks>
/// A deadline is <b>fixed</b>, <b>record-derived</b>, or
/// <b>undefined-duration</b> (P-150/P-151): J-12's agreement expiry follows
/// the agreement's own term and only the 90/30/5 reminder schedule is
/// central, while `DM-GAP-10` rows have no duration at all and can produce no
/// countdown (`P-156`). A single nullable number cannot tell those apart, so
/// <see cref="Status"/> is the discriminator and the nullable columns follow
/// it. The wire union in `shared/types/sla.ts` is this row, exactly.
/// </remarks>
public sealed class SlaMatrixRow
{
    /// <summary>The frontend contract's own id, e.g. `SLA-0501` — every
    /// countdown badge names the row that configures it.</summary>
    public required string SlaId { get; set; }

    /// <summary>`null` where the BRD names no capability for the area —
    /// J-20's material review is the one such case.</summary>
    public string? CapabilityCode { get; set; }

    public required string ActionCode { get; set; }

    public required string NameAr { get; set; }

    public required string NameEn { get; set; }

    /// <summary>Where the deadline is stated — or stated to be missing.</summary>
    public required string Source { get; set; }

    public required string OnBreachAr { get; set; }

    public required string OnBreachEn { get; set; }

    /// <summary>A value of <see cref="SlaStatuses"/>.</summary>
    public required string Status { get; set; }

    /// <summary>Only when <see cref="Status"/> is <c>fixed</c> (`DM-GAP-10` otherwise).</summary>
    public int? Duration { get; set; }

    /// <summary>A value of <see cref="SlaUnits"/>; only when fixed.</summary>
    public string? Unit { get; set; }

    /// <summary>JSON array of days-before-deadline reminder offsets
    /// (90/30/5 for agreements — `BR-0303`); null when undefined-duration.</summary>
    public string? ReminderOffsets { get; set; }

    /// <summary>Keeps the console's catalogue order stable.</summary>
    public int SortOrder { get; set; }
}
