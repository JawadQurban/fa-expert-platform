namespace ExpertHub.Core.Domain;

/// <summary>
/// One grantable unit — a feature within a capability, exactly as BRD §8.8.4
/// defines the permission list (`10` §3.2).
/// </summary>
/// <remarks>
/// The 58 permissions are the BRD's own feature codes (P-139): the codes are
/// verified, and the bilingual labels were extracted from the PDF's wrapped
/// tables and still need a wording pass (`Q31`'s secondary ask).
/// </remarks>
public sealed class Permission
{
    public int PermissionId { get; set; }

    /// <summary><c>CAP-01</c> … <c>CAP-12</c>.</summary>
    public required string CapabilityCode { get; set; }

    /// <summary>The BRD feature code, e.g. <c>F-0801</c> — one feature is one unit (§8.8.4).</summary>
    public required string FeatureCode { get; set; }

    public required string NameAr { get; set; }

    public required string NameEn { get; set; }

    /// <summary>
    /// ⚠️ True where the label was extracted from the BRD PDF's wrapped tables
    /// and may be truncated (P-139): the code is verified, the wording is not.
    /// Cleared label by label as `Q31`'s wording pass lands.
    /// </summary>
    public bool LabelNeedsVerification { get; set; }
}
