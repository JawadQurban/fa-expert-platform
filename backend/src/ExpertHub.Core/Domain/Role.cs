namespace ExpertHub.Core.Domain;

/// <summary>
/// One of the six fixed roles of BRD §8.8.5 (`10` §3.2).
/// </summary>
/// <remarks>
/// The rows are seeded when CAP-08's service is implemented (BE-03) — the six
/// are BRD facts, not configuration. What this table never gains is a create
/// or delete path: <see cref="RoleCode"/> and the CHECK constraint on
/// <c>code</c> close the union at both layers.
/// </remarks>
public sealed class Role
{
    public int RoleId { get; set; }

    public RoleCode Code { get; set; }

    public required string NameAr { get; set; }

    public required string NameEn { get; set; }

    /// <summary>§8.8.5's own description of the role's operational responsibility.</summary>
    public required string DescriptionAr { get; set; }

    public required string DescriptionEn { get; set; }

    /// <summary>True for all six — the BRD fixes them (§8.8.5).</summary>
    public bool IsSystem { get; set; }
}
