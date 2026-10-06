namespace ExpertHub.Core.Domain;

/// <summary>
/// One value inside a <see cref="ReferenceList"/> (`10` §3.1).
/// </summary>
/// <remarks>
/// A reference value <b>deactivates, never deletes</b>: a historical record
/// whose reason was later retired must still resolve to its label. The
/// DbContext refuses to delete one, and <see cref="IsActive"/> is the only
/// retirement mechanism.
/// </remarks>
public sealed class ReferenceValue
{
    public Guid ValueId { get; set; }

    public required string ListCode { get; set; }

    public required string Code { get; set; }

    public required string LabelAr { get; set; }

    public required string LabelEn { get; set; }

    public int SortOrder { get; set; }

    /// <summary>Deactivate, never delete — history must still resolve.</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Who masters this value: null for one Expert Hub manages, or an
    /// <see cref="IntegrationSystems"/> code (e.g. <c>INT-05</c>) for one
    /// synchronized from that system — which nobody edits here.
    /// </summary>
    public string? Source { get; set; }

    /// <summary>
    /// The source's own extra fields for this value, as JSON (a FAST country:
    /// nationality labels, country code, Nafath mapping, <c>isRestricted</c>).
    /// Carried as received; no behaviour is attached to them here.
    /// </summary>
    public string? Attributes { get; set; }

    /// <summary>When the source last confirmed this value; null for local values.</summary>
    public DateTime? SyncedAt { get; set; }
}
