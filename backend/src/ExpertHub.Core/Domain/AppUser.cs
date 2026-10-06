namespace ExpertHub.Core.Domain;

/// <summary>
/// A person known to the platform (`10` §3.2).
/// </summary>
/// <remarks>
/// <para>
/// Authentication is INT-01's, never the platform's (`P-133`, `BR-0808`):
/// this row holds <b>no credential of any kind</b> — no password, no hash, no
/// token. <see cref="ExternalIdentityId"/> is a reference to the identity FAST
/// masters (`BR-1205`), nothing more.
/// </para>
/// <para>
/// The name is a bilingual pair because neither language is a translation of
/// the other at read time (BRD §10.4) — the UI renders whichever the locale
/// asks for.
/// </para>
/// </remarks>
public sealed class AppUser
{
    public Guid UserId { get; set; }

    /// <summary>The subject FAST's identity provider asserts — reference only (`BR-1205`).</summary>
    public required string ExternalIdentityId { get; set; }

    public required string Email { get; set; }

    public string? Phone { get; set; }

    public required string FullNameAr { get; set; }

    public required string FullNameEn { get; set; }

    /// <summary>Which language notifications are sent in (`BR-0707` sends exactly one).</summary>
    public required string PreferredCommunicationLanguage { get; set; }

    public required string PreferredUiLanguage { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsEmployee { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public DateTime CreatedAt { get; set; }
}
