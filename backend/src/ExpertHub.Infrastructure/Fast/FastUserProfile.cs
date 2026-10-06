using System.Text.Json;
using System.Text.Json.Serialization;

namespace ExpertHub.Infrastructure.Fast;

/// <summary>
/// What `GET /api/v1/Users/Info` gives us about the signed-in person.
/// </summary>
/// <remarks>
/// <para>
/// The live payload carries far more than this — captchas, favourites, theme,
/// organization logos, empty attachment shells. Only the fields Expert Hub
/// actually uses are named, because a model that mirrors an undeclared
/// response is a maintenance burden that grows every time FAST adds a
/// property.
/// </para>
/// <para>
/// ⚠️ <b>FAST masters every field here</b> (`BR-1201`, `P-129`). Expert Hub
/// holds a replica, dated, and never writes back through this route.
/// </para>
/// </remarks>
public sealed record FastUserProfile
{
    /// <summary>FAST's own id for the person.</summary>
    public string? Id { get; init; }

    public string? UserName { get; init; }

    public string? Email { get; init; }

    public string? PhoneNumber { get; init; }

    /// <summary>The name a person recognises. QA found applicants shown as
    /// `JawadQurban` and `1000499630` because we had no source for this
    /// (`D-15`) — the token carries only `sub` and `email`.</summary>
    public string? FullNameAr { get; init; }

    public string? FullNameEn { get; init; }

    /// <summary>
    /// The given name on its own, as FAST sends it.
    /// </summary>
    /// <remarks>
    /// ⚠️ <b>FAST sends this and the prefill claimed it did not.</b> The note
    /// on `ApplicationPrefill` used to say «FAST sends one `fullNameAr`», and
    /// on that basis the four Arabic name fields were left blank for everybody.
    /// The real payload has carried `firstNameAr` and `firstNameEn` since the
    /// first capture — nobody read past the full names.
    /// </remarks>
    public string? FirstNameAr { get; init; }

    public string? FirstNameEn { get; init; }

    /// <summary>National ID, Iqama or passport as FAST holds it — the
    /// authoritative value behind `D-01`'s validation.</summary>
    public string? IdNumber { get; init; }

    public string? PassportNumber { get; init; }

    public string? ResidencyNumber { get; init; }

    public DateTime? DateOfBirth { get; init; }

    public int? NationalityCountryId { get; init; }

    /// <summary>`true` when FAST considers them Academy staff. More reliable
    /// than the role-claim mapping, which is unconfigured (`Q37`).</summary>
    public bool IsEmployee { get; init; }

    public bool IsOrganizationAdmin { get; init; }

    public bool IsOrganizationCoordinator { get; init; }

    public string? UserOrganization { get; init; }

    public string? JobTitle { get; init; }

    public string? PreferredUiLanguage { get; init; }

    public string? PreferredCommunicationLanguage { get; init; }

    public string? SocialMediaUrl { get; init; }

    /// <summary>Whether FAST permits this person to edit their own profile —
    /// which decides whether a field is `request-change` or simply locked.</summary>
    public bool CanChangeProfile { get; init; }

    /// <summary>FAST's roles for this person. ⚠️ These are what they are IN
    /// FAST; they do not grant anything in Expert Hub (`P-181`) — see
    /// <see cref="FastRole"/>.</summary>
    public IReadOnlyList<FastRole> Roles { get; init; } = [];

    /// <summary>FAST's own free-text role labels, e.g. «مستخدم مسجل تابع
    /// لجهة». Display only.</summary>
    public IReadOnlyList<string> UserRoles { get; init; } = [];

    /// <summary>The nested profile, which carries the bank data and the
    /// expert flags.</summary>
    public FastUserProfileDetail? UserProfile { get; init; }

    /* ── the eight bank fields (J-09/F6/AC-3), which FAST already holds ──── */

    public string? BankAccount { get; init; }

    public string? BankName { get; init; }

    public string? BankBranch { get; init; }

    public string? BankSwiftCode { get; init; }

    [JsonPropertyName("bankIBAN")]
    public string? BankIban { get; init; }

    public string? BankCountry { get; init; }

    public string? BankCity { get; init; }

    public string? NameInBankCard { get; init; }

    /// <summary>Every bank field FAST supplied, keyed as Expert Hub's own bank
    /// form names them — so the applicant is asked to confirm rather than to
    /// retype what the Academy already has.</summary>
    public IReadOnlyDictionary<string, string> BankFields()
    {
        var fields = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["bankCountry"] = BankCountry ?? string.Empty,
            ["bankCity"] = BankCity ?? string.Empty,
            ["bankName"] = BankName ?? string.Empty,
            ["branchName"] = BankBranch ?? string.Empty,
            ["iban"] = BankIban ?? string.Empty,
            ["swiftCode"] = BankSwiftCode ?? string.Empty,
            ["accountHolderName"] = NameInBankCard ?? string.Empty,
            ["accountNumber"] = BankAccount ?? string.Empty,
        };
        // Only what FAST really sent: an empty string is not data, and a
        // half-filled form that claims to be prefilled is worse than a blank.
        return fields.Where(pair => pair.Value.Length > 0)
            .ToDictionary(pair => pair.Key, pair => pair.Value, StringComparer.Ordinal);
    }
}

/// <summary>
/// One of FAST's roles. ⚠️ <b>Informative, never authoritative here.</b>
/// `P-181` fixes that Expert Hub's permissions come from its own `USER_ROLE`
/// table; what FAST says a person is tells us who they are over there, and is
/// shown to an administrator deciding what to grant here.
/// </summary>
public sealed record FastRole(string? DisplayName, int Code, string? SystemName);

/// <summary>The `userProfile` object, for the fields not repeated at the root.</summary>
public sealed record FastUserProfileDetail
{
    public string? JobTitleAr { get; init; }

    public string? JobTitleEn { get; init; }

    public string? DepartmentAr { get; init; }

    public string? DepartmentEn { get; init; }

    public int? SectorId { get; init; }

    public int? SubSectorId { get; init; }

    /* ⚠️ FAST's three "Expert" flags — `Q22`. They do NOT line up with Expert
       Hub's four services: only «question writer» has an obvious counterpart.
       Carried verbatim so the mapping can be decided from real data rather
       than guessed. */

    public bool ExpertCorrector { get; init; }

    public bool ExpertReviewer { get; init; }

    public bool ExpertQuestionAuthor { get; init; }
}

/// <summary>Reads the signed-in person's FAST profile.</summary>
/// <remarks>
/// ⚠️ <b>`Users/Info` is scoped to the caller's own token</b>, so this cannot
/// read anybody else. Staff looking up another trainer still have no source
/// — see `19` §4.
/// </remarks>
public sealed class FastUserReader
{
    public const string InfoPath = "api/v1/Users/Info";

    private readonly FastApiClient _client;

    public FastUserReader(FastApiClient client) => _client = client;

    public bool IsConfigured => _client.IsConfigured;

    /// <summary>
    /// The profile, using a token supplied by the caller.
    /// </summary>
    /// <remarks>
    /// The token is passed rather than resolved because the one moment Expert
    /// Hub reliably holds a FAST access token is the sign-in handshake, before
    /// it is discarded (`P-215`). Reading the profile there gives us the data
    /// without keeping a live credential for the life of the session.
    /// </remarks>
    public Task<FastResult<FastUserProfile>> GetInfoAsync(
        string accessToken, string locale, CancellationToken cancellationToken) =>
        _client.GetWithTokenAsync<FastUserProfile>(
            InfoPath, accessToken, locale, cancellationToken);

    /// <summary>Parses a payload already in hand — used by tests, and by any
    /// caller that obtained the JSON another way.</summary>
    public static FastResult<FastUserProfile> Parse(string rawJson) =>
        FastApiClient.Unwrap<FastUserProfile>(rawJson);
}
