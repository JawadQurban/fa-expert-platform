namespace ExpertHub.Core.Domain;

/// <summary>
/// One external system Expert Hub exchanges data with — `INTEGRATED_SYSTEM`,
/// `10` §3.12. The six rows (`INT-01`…`INT-06`) are the crossing register of
/// `08` §4.1, seeded by migration: an integration that is not registered here
/// does not exist, which is what makes "no ad-hoc HttpClient call" checkable.
/// </summary>
public sealed class IntegratedSystem
{
    /// <summary>`INT-01`…`INT-06` — the code the BRD (§8.12) uses.</summary>
    public required string SystemCode { get; set; }

    public required string NameAr { get; set; }

    public required string NameEn { get; set; }

    /// <summary>From Expert Hub's viewpoint — a value of <see cref="IntegrationDirections"/>.</summary>
    public required string Direction { get; set; }

    /// <summary>JSON array of capability codes this crossing serves.</summary>
    public required string BenefitingCapabilities { get; set; }

    public required string Importance { get; set; }

    public bool IsActive { get; set; }
}
