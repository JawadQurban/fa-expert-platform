using System.Text.Json;

namespace ExpertHub.Infrastructure.Fast;

/// <summary>
/// Reads the trainer contracts the Academy holds for the signed-in person.
/// </summary>
/// <remarks>
/// <para>
/// Owner ruling, 2026-09-10: read them, show them clearly labelled as the
/// Academy's own documents, and do not write. `Approve` and `Refuse` exist on
/// the same controller and are deliberately NOT called.
/// </para>
/// <para>
/// ⚠️ <b>Because whether a FAST «trainer contract» IS an Expert Hub agreement
/// is still unanswered</b> — question 3 for the FAST team, and the one that
/// risks `BR-1201`. Reading is reversible: if the answer turns out to be «the
/// same artefact», this becomes the source and nothing has to be undone. Had
/// this shipped Approve/Refuse, Expert Hub would have committed to FAST
/// mastering the agreement before anybody decided that.
/// </para>
/// <para>
/// ⚠️ <b>Stored raw, like the qualifications</b> (`P-254`). The register
/// declares no schema for the response, and a DTO written from an operation
/// name is the `P-238` failure waiting to happen: it would deserialize to a
/// row of nulls and report success.
/// </para>
/// </remarks>
public sealed class FastContractsReader
{
    private readonly FastApiClient _client;

    public FastContractsReader(FastApiClient client) => _client = client;

    public bool IsConfigured => _client.IsConfigured;

    /// <summary>
    /// The contracts as FAST sent them, or null when the call failed — which
    /// is not the same as «this person has none», and is not recorded as if
    /// it were.
    /// </summary>
    public async Task<string?> ReadAsync(
        string accessToken, string locale, CancellationToken cancellationToken)
    {
        var result = await _client
            .GetWithTokenAsync<JsonElement>(
                FastTrainerContracts.List, accessToken, locale, cancellationToken)
            .ConfigureAwait(false);

        return !result.Ok || result.Value.ValueKind == JsonValueKind.Undefined
            ? null
            : result.Value.GetRawText();
    }
}

/// <summary>
/// One trainer contract, as the Academy's response describes it.
/// </summary>
/// <remarks>
/// ⚠️ <b>Every property is optional and nothing here is required to be
/// present.</b> This is read defensively from an undeclared payload: a field
/// that turns out to be named differently renders as absent, which is a
/// display gap, rather than throwing and taking the profile page down with it.
/// </remarks>
public sealed record FastContractItem
{
    public string? Id { get; init; }

    public string? ContractNumber { get; init; }

    public string? Status { get; init; }

    public string? StatusName { get; init; }

    public DateTime? StartDate { get; init; }

    public DateTime? EndDate { get; init; }
}

/// <summary>Reads the stored collection into the shape above.</summary>
public static class FastContractItems
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    /// <summary>
    /// ⚠️ Never throws. The stored text is whatever FAST sent at some past
    /// sign-in; a payload that changed shape is a display gap, not a reason a
    /// profile page fails to load.
    /// </summary>
    public static IReadOnlyList<FastContractItem> Parse(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return [];
        }
        try
        {
            return JsonSerializer.Deserialize<List<FastContractItem>>(raw, Json) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
