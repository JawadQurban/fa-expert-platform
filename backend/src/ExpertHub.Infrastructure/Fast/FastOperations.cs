using System.Text.Json;

namespace ExpertHub.Infrastructure.Fast;

/*
 * The FAST operations Expert Hub can actually use, named once so no capability
 * assembles a URL. Everything here is drawn from the 2026-09-08 reference; an
 * endpoint the reference does not document is not invented here.
 *
 * ⚠️ What is DELIBERATELY absent, because FAST does not expose it:
 *   - `plan.Plan`, `PlanScheduleDay`, `PlanTrainer`, `PlanTaker` — the whole
 *     CAP-05 chain, and `Q20`'s enrolment and attendance.
 *   - `Survey.*` — MTM trainee evaluations (INT-02, `Q23`).
 *   - Writing a trainer's accreditation back to FAST.
 * Those remain asks, not code.
 */

/// <summary>One of FAST's reference values — the shape its lookups share.</summary>
public sealed record FastLookupItem(int? Id, string? NameAr, string? NameEn, string? Code);

/// <summary>
/// Reference data FAST already owns, which Expert Hub currently invents or
/// leaves empty.
/// </summary>
/// <remarks>
/// The direct prize is nationality: the application form offers three options
/// where FAST has the authoritative country and nationality list (`D-36`), and
/// `GetCountryByNafathMappingId` even maps the identity provider's own country
/// ids to FAST's — which is exactly the identifier mapping every integration
/// otherwise has to guess at.
/// </remarks>
public static class FastLookups
{
    public const string Countries = "api/v1/Lookup/GetCountries";
    public const string AllCountries = "api/v1/Lookup/GetAllCountries";
    public const string EducationTypes = "api/v1/Lookup/GetAllEducationType";
    public const string Sectors = "api/v1/Lookup/GetSectors";
    public const string Topics = "api/v1/Lookup/GetTopics";
    public const string CompetencyLevels = "api/v1/Lookup/GetCompetencyLevels";
    public const string CancellationReasons = "api/v1/Lookup/GetCancellationReasons";

    /// <summary>FAST's country by the identity provider's own id — the
    /// identifier bridge, and the only one the contract hands us.</summary>
    public static string CountryByIdentityId(string identityCountryId) =>
        $"api/v1/Lookup/GetCountryByNafathMappingId/{Uri.EscapeDataString(identityCountryId)}";

    /// <summary>Training-course dropdowns, used when a trainer records a course.</summary>
    public const string TrainingCourseSectors = "api/training-courses/sectors";
    public const string TrainingCourseLevels = "api/training-courses/levels";
    public const string TrainingCourseLocationTypes = "api/training-courses/location-types";
}

/// <summary>
/// The trainer's own qualification record, which FAST masters and exposes for
/// both reading and writing.
/// </summary>
/// <remarks>
/// <para>
/// This is the first concrete answer to `Q30`. It does not cover the whole
/// base profile — only these four collections — but for them, «can a change
/// made in Expert Hub reach FAST» is answered yes, so the write-through
/// `P-135` describes becomes buildable rather than hypothetical.
/// </para>
/// <para>
/// ⚠️ Every one is scoped to the authenticated user. Staff cannot read another
/// person's qualifications through these, so the internal trainer base still
/// has no source — see <see cref="IFastTokenProvider"/>.
/// </para>
/// </remarks>
public static class FastQualifications
{
    public const string Education = "api/qualifications-education";
    public const string PracticalExperience = "api/qualifications-practical-experience";
    public const string Professional = "api/qualifications-professional";
    public const string TrainingCourses = "api/qualifications-training-courses";

    public static string EducationById(string id) => $"{Education}/{Uri.EscapeDataString(id)}";

    public static string PracticalExperienceById(string id) =>
        $"{PracticalExperience}/{Uri.EscapeDataString(id)}";

    public static string ProfessionalById(string id) =>
        $"{Professional}/{Uri.EscapeDataString(id)}";

    public static string TrainingCourseById(string id) =>
        $"{TrainingCourses}/{Uri.EscapeDataString(id)}";
}

/// <summary>
/// Trainer contracts — the closest thing FAST exposes to CAP-03's agreements.
/// </summary>
/// <remarks>
/// ⚠️ <b>Whether this is the same artefact as an Expert Hub agreement is an
/// open question, and it matters.</b> If it is, two systems are about to
/// master the same contract and `BR-1201` needs a ruling before either writes.
/// If it is not, they are separate documents that happen to share a name. The
/// operations are declared here so the question can be asked precisely; nothing
/// calls them yet.
/// </remarks>
public static class FastTrainerContracts
{
    public const string List = "api/v1/TrainerContracts/trainer-contracts";

    /// <summary>Generates the PDF and stores it on the CDN — which is also a
    /// partial answer to `G26`, since FAST already has a document store.</summary>
    public static string Download(string contractId) =>
        $"{List}/Download?contractId={Uri.EscapeDataString(contractId)}";

    public const string Approve = "api/v1/TrainerContracts/trainer-contracts/Approve";
    public const string Refuse = "api/v1/TrainerContracts/trainer-contracts/Refuse";
}

/// <summary>
/// The competency framework — a candidate vocabulary for `Q16`, which has been
/// open since August because no domain taxonomy exists anywhere in the BRD.
/// </summary>
public static class FastFinancialSkills
{
    public const string FrameworkOverview = "api/v1/FinancialSkills/GetFrameworkOverview";

    /// <summary>⚠️ A <b>POST</b>, taking `FrameworkStructureRequestDto` — the
    /// 2026-09-08 register corrected this. It reads like a lookup and is not
    /// one.</summary>
    public const string FrameworkStructure = "api/v1/FinancialSkills/GetFrameworkStructure";

    public const string Competencies = "api/v1/FinancialSkills/GetCompetencies";

    /// <summary>One competency, with its levels — `id`, `code`, `name`,
    /// `typeName`, `description`. The first real candidate for `Q16`'s
    /// vocabulary, because it is coded rather than free text.</summary>
    public static string CompetencyDetails(string id) =>
        $"api/v1/FinancialSkills/GetCompetencyDetails?id={Uri.EscapeDataString(id)}";

    /// <summary>⚠️ The parameter is `familyId`, not `jobFamilyId` (register,
    /// 2026-09-08). It also takes an optional `sectorId`.</summary>
    public static string JobFamily(string id) =>
        $"api/v1/FinancialSkills/GetJobFamilyDetails?familyId={Uri.EscapeDataString(id)}";
}

/// <summary>
/// Reads FAST's reference lists. The first real consumer of the client, and
/// the one with an immediate payoff: a real nationality list.
/// </summary>
public sealed class FastReferenceReader
{
    private readonly FastApiClient _client;

    public FastReferenceReader(FastApiClient client) => _client = client;

    public bool IsConfigured => _client.IsConfigured;

    /// <summary>
    /// FAST's countries and nationalities. Returns the raw elements rather
    /// than a mapped type: the contract declares no schema for this endpoint,
    /// so the field names are confirmed by looking at a live response, not by
    /// a DTO somebody wrote from hope.
    /// </summary>
    public Task<FastResult<JsonElement>> CountriesAsync(
        string locale, CancellationToken cancellationToken) =>
        _client.GetAsync(FastLookups.Countries, locale, cancellationToken);

    public Task<FastResult<JsonElement>> EducationTypesAsync(
        string locale, CancellationToken cancellationToken) =>
        _client.GetAsync(FastLookups.EducationTypes, locale, cancellationToken);

    public Task<FastResult<JsonElement>> SectorsAsync(
        string locale, CancellationToken cancellationToken) =>
        _client.GetAsync(FastLookups.Sectors, locale, cancellationToken);

    /// <summary>
    /// The competency framework behind `Q16`'s taxonomy question.
    /// </summary>
    /// <remarks>
    /// ⚠️ <b>A POST, despite reading like a lookup</b> — it takes
    /// `FrameworkStructureRequestDto` (paging and filters). This was a GET here
    /// until the 2026-09-08 register said otherwise; it would have returned 405
    /// the first time anything called it.
    /// </remarks>
    public Task<FastResult<JsonElement>> CompetencyFrameworkAsync(
        object? filter, string locale, CancellationToken cancellationToken) =>
        _client.PostAsync<JsonElement>(
            FastFinancialSkills.FrameworkStructure, filter, locale, cancellationToken);

    /// <summary>The overview, which is a genuine GET.</summary>
    public Task<FastResult<JsonElement>> CompetencyOverviewAsync(
        string locale, CancellationToken cancellationToken) =>
        _client.GetAsync(FastFinancialSkills.FrameworkOverview, locale, cancellationToken);
}
