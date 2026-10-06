namespace ExpertHub.Core.Domain;

/// <summary>
/// A platform-owned enumeration (`10` §3.1) — services, rejection reasons,
/// withdrawal reasons, and every other list a System Administrator maintains.
/// </summary>
/// <remarks>
/// The point of modelling lists as rows is `BR-0103`: adding a value must never
/// require a release. Lists whose contents the BRD fixes are marked
/// <see cref="IsEditable"/> = false.
/// </remarks>
public sealed class ReferenceList
{
    /// <summary>Stable key, e.g. <c>service</c>, <c>rejection_reason</c>.</summary>
    public required string ListCode { get; set; }

    public required string NameAr { get; set; }

    public required string NameEn { get; set; }

    /// <summary>False for lists the BRD fixes — the UI offers no editing for those.</summary>
    public bool IsEditable { get; set; }
}
