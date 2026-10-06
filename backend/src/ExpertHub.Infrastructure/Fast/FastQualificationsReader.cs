using System.Text.Json;

namespace ExpertHub.Infrastructure.Fast;

/// <summary>
/// The four qualification collections FAST holds for a person, as received.
/// </summary>
/// <param name="Education">Degrees.</param>
/// <param name="PracticalExperience">Employment history.</param>
/// <param name="Professional">Professional certifications.</param>
/// <param name="TrainingCourses">Courses attended.</param>
/// <remarks>
/// ⚠️ <b>Raw JSON, not a typed model, and that is deliberate.</b> The API
/// register of 2026-09-08 shows all four returning <c>ApiResponse</c> with an
/// undeclared payload: <c>CreateOrUpdatePracticalExperienceDto</c> is named as a
/// request body and defined nowhere. A DTO written for a payload nobody has
/// seen is a guess that compiles, and the first real response would silently
/// deserialize to a row of nulls — the exact failure `P-238` was about.
/// </remarks>
public sealed record FastQualificationSet(
    string? Education,
    string? PracticalExperience,
    string? Professional,
    string? TrainingCourses)
{
    /// <summary>How many items each collection holds.</summary>
    /// <remarks>
    /// ⚠️ A count is the one fact that survives not knowing the shape: it is
    /// the length of a JSON array, whatever the array contains. It is
    /// therefore all this integration claims until somebody runs it against
    /// the live API once and the stored payload reveals the field names.
    /// </remarks>
    public FastQualificationCounts Counts() => new(
        Count(Education),
        Count(PracticalExperience),
        Count(Professional),
        Count(TrainingCourses));

    private static int Count(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return 0;
        }
        try
        {
            var root = JsonDocument.Parse(raw).RootElement;
            return root.ValueKind == JsonValueKind.Array ? root.GetArrayLength() : 0;
        }
        catch (JsonException)
        {
            return 0;
        }
    }
}

/// <summary>What the Academy holds, by collection.</summary>
public sealed record FastQualificationCounts(
    int Education, int PracticalExperience, int Professional, int TrainingCourses)
{
    public int Total => Education + PracticalExperience + Professional + TrainingCourses;
}

/// <summary>
/// Reads the signed-in person's qualifications from FAST.
/// </summary>
/// <remarks>
/// <para>
/// Owner ruling, 2026-09-09: «now we have the API, should all the data come
/// from FAST — the qualification and professional certification — when the
/// trainer is already approved». FAST masters them (`BR-1201`), it exposes
/// them for reading <i>and</i> writing (`Q30`'s one concrete answer), and an
/// approved trainer has already given them to the Academy once.
/// </para>
/// <para>
/// ⚠️ <b>Read at sign-in, like the profile.</b> Every one of these endpoints is
/// scoped to «the currently authenticated user», and `P-215` discards the token
/// straight after the handshake — so this runs in the same moment
/// `FastProfileImport` does, and for the same reason. The consequence is the
/// same too: the replica is only ever as fresh as that person's last sign-in.
/// </para>
/// </remarks>
public sealed class FastQualificationsReader
{
    private readonly FastApiClient _client;

    public FastQualificationsReader(FastApiClient client) => _client = client;

    public bool IsConfigured => _client.IsConfigured;

    /// <summary>
    /// All four collections. A collection that fails is null rather than
    /// fatal: three qualifications are better than none because the fourth
    /// endpoint was down.
    /// </summary>
    public async Task<FastQualificationSet> ReadAsync(
        string accessToken, string locale, CancellationToken cancellationToken)
    {
        var education = await RawAsync(
            FastQualifications.Education, accessToken, locale, cancellationToken)
            .ConfigureAwait(false);
        var practical = await RawAsync(
            FastQualifications.PracticalExperience, accessToken, locale, cancellationToken)
            .ConfigureAwait(false);
        var professional = await RawAsync(
            FastQualifications.Professional, accessToken, locale, cancellationToken)
            .ConfigureAwait(false);
        var courses = await RawAsync(
            FastQualifications.TrainingCourses, accessToken, locale, cancellationToken)
            .ConfigureAwait(false);

        return new FastQualificationSet(education, practical, professional, courses);
    }

    /// <summary>
    /// One collection as JSON text, or null. The envelope is peeled by the
    /// client (`P-238`); what is stored is the payload itself.
    /// </summary>
    private async Task<string?> RawAsync(
        string path, string accessToken, string locale, CancellationToken ct)
    {
        var result = await _client
            .GetWithTokenAsync<JsonElement>(path, accessToken, locale, ct)
            .ConfigureAwait(false);
        if (!result.Ok)
        {
            return null;
        }
        // Stored verbatim so the field names can be read off a real response
        // rather than guessed at from a request DTO nobody published.
        return result.Value.ValueKind == JsonValueKind.Undefined
            ? null
            : result.Value.GetRawText();
    }
}
